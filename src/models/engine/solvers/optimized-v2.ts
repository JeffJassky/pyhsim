import {
  Minute,
  Signal,
  WorkerComputeRequest,
  WorkerComputeResponse,
} from "@/types";
import { SIGNALS_ALL } from "@/types";
import type { SimulationState, DynamicsContext, ActiveIntervention } from '@/types/unified';
import {
  createInitialState,
  getAllUnifiedDefinitions,
  AUXILIARY_DEFINITIONS,
  SIGNAL_DEFINITIONS,
  computeDerivatives,
  type ConditionAdjustments,
} from "@/models/engine";
import { calculateVd } from "../pharmacokinetics";
import { addStates, scaleState } from "../state";
import { isReceptor, getReceptorSignals } from "../../physiology/pharmacology";
import { hill } from "../utils";

/**
 * OPTIMIZED SOLVER V2 (Production Bateman Edition)
 * 
 * Strategy for Bit-for-Bit Parity with V1:
 * 1. Manual RK4 Injection: Syncs PK analytical values at k1, k2, k3, k4.
 * 2. First-Order Bateman Model: Matches V1's "Gut -> Central" oral kinetics.
 * 3. 24-hour Warm-up: Establishes residue from yesterday for seamless day-wrapping.
 * 4. System Vectorization: Maps all state to a flat Float64Array for O(1) access.
 */

// --- VECTORIZED ENGINE TYPES ---

interface VectorLayout {
  size: number;
  signals: Map<Signal, number>;
  auxiliary: Map<string, number>;
  receptors: Map<string, number>;
  keys: string[]; // For reconstruction
}

interface PreResolvedDefinition {
  index: number;
  tau: number;
  setpoint: (ctx: DynamicsContext) => number;
  production: Array<{
    coefficient: number;
    sourceIndex: number; // -1 for constant/circadian
    transform?: (v: number, state: any, ctx: any) => number;
  }>;
  clearance: Array<{
    rate: number;
    type: string;
    enzymeIndex: number;
    Km?: number;
    transform?: (v: number, state: any, ctx: any) => number;
  }>;
  couplings: Array<{
    sourceIndex: number;
    receptorIndex: number;
    normalizedStrength: number; // strength / tau
    isStimulate: boolean;
  }>;
  min: number;
  max: number;
}

export function runOptimizedV2(request: WorkerComputeRequest): WorkerComputeResponse {
  const { gridMins, items, defs, options } = request;

  const enableInterventions = options?.debug?.enableInterventions ?? true;
  const includeSignals = options?.includeSignals ?? SIGNALS_ALL;
  const gridStep = gridMins.length > 1 ? gridMins[1] - gridMins[0] : 5;
  const minutesPerDay = 24 * 60;

  const defsMap = new Map(defs.map((def) => [def.key, def]));
  const unifiedDefinitions = getAllUnifiedDefinitions();

  // --- PRE-CALCULATE INTERVENTIONS & WAKE TIME ---
  const pkAgents: Array<{
    id: string,
    startTime: number,
    duration: number,
    intensity: number,
    dose: number,
    ka: number,
    ke: number,
    vd: number,
    F: number,
    model: string,
    molarMass: number
  }> = [];

  const uniqueInterventions = new Map<string, any>();
  let wakeTimeMin = 480; 
  let foundWakeTime = false;

  if (enableInterventions) {
    const numDays = Math.ceil((gridMins[gridMins.length - 1] + 1) / 1440);
    for (let d = 0; d < numDays; d++) {
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;

        if (d === 0 && !foundWakeTime) {
          if (def.key === 'wake') { wakeTimeMin = item.startMin % 1440; foundWakeTime = true; }
          else if (def.key === 'sleep') { wakeTimeMin = (item.startMin + item.durationMin) % 1440; foundWakeTime = true; }
        }

        let pharms: any[] = [];
        if ((item as any).resolvedPharmacology) pharms = (item as any).resolvedPharmacology;
        else if (def.pharmacology && typeof def.pharmacology !== 'function') pharms = [def.pharmacology];

        pharms.forEach((p, index) => {
          const agentId = pharms.length > 1 ? `${item.id}_${index}` : item.id;
          if (!uniqueInterventions.has(agentId)) {
            uniqueInterventions.set(agentId, {
              id: agentId, key: def.key, intensity: item.meta.intensity ?? 1.0, params: item.meta.params,
              pharmacology: { molecule: p.molecule, pk: p.pk ? { ...p.pk, isAnalytical: true } : undefined, pd: p.pd }
            });
          }

          if (p.pk) {
            const ke = p.pk.eliminationRate ?? (0.693 / (p.pk.halfLifeMin ?? 60));
            const ka = p.pk.absorptionRate ?? (ke * 4);
            pkAgents.push({
              id: agentId,
              startTime: item.startMin + (d * 1440),
              duration: item.durationMin,
              intensity: item.meta.intensity ?? 1.0,
              dose: Number(item.meta.params?.mg ?? item.meta.params?.dose ?? item.meta.params?.units ?? 100),
              ka, ke, 
              vd: p.pk.volume ? calculateVd(p, options?.physiology as any, options?.subject as any) : 50,
              F: p.pk.bioavailability ?? 1.0,
              model: p.pk.model,
              molarMass: p.molecule?.molarMass ?? 200
            });
          }
        });
      }
    }
  }

  const solverInterventions = Array.from(uniqueInterventions.values());
  const agentsById = new Map<string, typeof pkAgents>();
  pkAgents.forEach(a => {
    if (!agentsById.has(a.id)) agentsById.set(a.id, []);
    agentsById.get(a.id)!.push(a);
  });

  const standardWakeTime = 480;
  const circadianShift = standardWakeTime - wakeTimeMin;
  const conditionAdjustments: ConditionAdjustments = (options?.debug?.enableConditions !== false) ? {
    baselines: options?.conditionBaselines,
    couplings: options?.conditionCouplings,
  } : {};

  // --- ANALYTICAL EVALUATOR (Base Equation) ---
  function getAnalyticalConcRaw(id: string, t: number): number {
    const instances = agentsById.get(id);
    if (!instances) return 0;
    let sum = 0;
    for (const a of instances) {
      const dt = t - a.startTime;
      if (dt < 0) continue;
      if (a.model === 'activity-dependent') {
        const tau = 5;
        if (dt <= a.duration) sum += a.intensity * (1 - Math.exp(-dt / tau));
        else sum += a.intensity * (1 - Math.exp(-a.duration / tau)) * Math.exp(-(dt - a.duration) / tau);
      } else {
        const kin = (a.dose * a.F * a.intensity) / a.duration;
        const ka = a.ka; const ke = a.ke; const Vd = a.vd; const D = a.duration;
        let c = 0;
        if (dt <= D) {
          const term1 = (1 - Math.exp(-ke * dt)) / ke;
          const term2 = (Math.exp(-ka * dt) - Math.exp(-ke * dt)) / (ke - ka);
          c = (kin / Vd) * (term1 - term2);
        } else {
          const G_peak = (kin / ka) * (1 - Math.exp(-ka * D));
          const term1_peak = (1 - Math.exp(-ke * D)) / ke;
          const term2_peak = (Math.exp(-ka * D) - Math.exp(-ke * D)) / (ke - ka);
          const C_peak = (kin / Vd) * (term1_peak - term2_peak);
          const dt_post = dt - D;
          c = C_peak * Math.exp(-ke * dt_post) + (ka * G_peak / (Vd * (ke - ka))) * (Math.exp(-ka * dt_post) - Math.exp(-ke * dt_post));
        }
        sum += c;
      }
    }
    return sum;
  }

  // --- LAYER 2: ANALYTICAL PK PRE-COMPUTATION ---
  const pkMinT = -1440;
  const pkMaxT = gridMins.length > 0 ? Math.ceil(gridMins[gridMins.length - 1]) : 0;
  const pkRange = pkMaxT - pkMinT + 1;
  const pkBuffers = new Map<string, Float32Array>();

  for (const id of uniqueInterventions.keys()) {
    const buffer = new Float32Array(pkRange);
    for (let t = pkMinT; t <= pkMaxT; t++) {
      buffer[t - pkMinT] = getAnalyticalConcRaw(id, t);
    }
    pkBuffers.set(id, buffer);
  }

  function getAnalyticalConc(id: string, t: number): number {
    const buffer = pkBuffers.get(id);
    if (!buffer) return 0;
    const floatIdx = t - pkMinT;
    const idx0 = Math.floor(floatIdx);
    const idx1 = idx0 + 1;
    if (idx0 < 0) return buffer[0] ?? 0;
    if (idx1 >= buffer.length) return buffer[buffer.length - 1] ?? 0;
    const v0 = buffer[idx0];
    const v1 = buffer[idx1];
    const frac = floatIdx - idx0;
    return v0 + (v1 - v0) * frac;
  }

  // --- PRE-CALCULATE DAILY ACTIVE SETS (Layer 1 Optimization) ---
  const allActiveInterventions: ActiveIntervention[] = [];
  if (enableInterventions) {
    const numDays = Math.ceil((gridMins[gridMins.length - 1] + gridStep) / 1440);
    for (let d = 0; d < numDays; d++) {
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;
        let pharms: any[] = [];
        if ((item as any).resolvedPharmacology) pharms = (item as any).resolvedPharmacology;
        else if (def.pharmacology && typeof def.pharmacology !== 'function') pharms = [def.pharmacology];

        pharms.forEach((pharm, index) => {
          const agentId = pharms.length > 1 ? `${item.id}_${index}` : item.id;
          allActiveInterventions.push({
            id: agentId, key: def.key, startTime: item.startMin + (d * 1440),
            duration: item.durationMin, intensity: item.meta.intensity ?? 1.0,
            params: item.meta.params, pharmacology: pharm
          });
        });
      }
    }
  }
  allActiveInterventions.sort((a, b) => a.startTime - b.startTime);

  let activePointer = 0;
  let activeSet: ActiveIntervention[] = [];

  function updateActiveSet(t: number) {
    activeSet = activeSet.filter(iv => t <= iv.startTime + iv.duration);
    while (activePointer < allActiveInterventions.length && allActiveInterventions[activePointer].startTime <= t) {
      const iv = allActiveInterventions[activePointer];
      if (t <= iv.startTime + iv.duration) {
        activeSet.push(iv);
      }
      activePointer++;
    }
  }

  // --- LAYER 3: SYSTEM VECTORIZATION (Setup) ---
  const initialObjState = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
    subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any), isAsleep: false 
  }, options?.debug);

  if (options?.debug?.enableConditions !== false) {
    if (options?.enzymeActivities) for (const [k, v] of Object.entries(options.enzymeActivities)) if (initialObjState.auxiliary[k] !== undefined) initialObjState.auxiliary[k] += v;
    if (options?.transporterActivities) for (const [k, v] of Object.entries(options.transporterActivities)) if (initialObjState.auxiliary[k] !== undefined) initialObjState.auxiliary[k] += v;
    if (options?.receptorDensities) for (const [k, v] of Object.entries(options.receptorDensities)) initialObjState.receptors[`${k}_density`] = 1.0 + v;
    if (options?.receptorSensitivities) for (const [k, v] of Object.entries(options.receptorSensitivities)) initialObjState.receptors[`${k}_sensitivity`] = 1.0 + v;
  }

  const layout: VectorLayout = { size: 0, signals: new Map(), auxiliary: new Map(), receptors: new Map(), keys: [] };
  for (const s of SIGNALS_ALL) { layout.signals.set(s, layout.size); layout.keys[layout.size] = s; layout.size++; }
  for (const k of Object.keys(initialObjState.auxiliary)) { layout.auxiliary.set(k, layout.size); layout.keys[layout.size] = k; layout.size++; }
  for (const k of Object.keys(initialObjState.receptors)) { layout.receptors.set(k, layout.size); layout.keys[layout.size] = k; layout.size++; }

  const initialStateVector = new Float64Array(layout.size);
  layout.signals.forEach((idx, s) => initialStateVector[idx] = initialObjState.signals[s] ?? 0);
  layout.auxiliary.forEach((idx, k) => initialStateVector[idx] = initialObjState.auxiliary[k] ?? 0);
  layout.receptors.forEach((idx, k) => initialStateVector[idx] = initialObjState.receptors[k] ?? 0);

  const resolvedSignals: PreResolvedDefinition[] = [];
  SIGNALS_ALL.forEach(s => {
    const def = unifiedDefinitions[s];
    resolvedSignals.push({
      index: layout.signals.get(s)!,
      tau: def.dynamics.tau,
      setpoint: def.dynamics.setpoint,
      min: def.min ?? 0,
      max: def.max ?? Infinity,
      production: def.dynamics.production.map(p => ({
        coefficient: p.coefficient,
        sourceIndex: p.source === 'constant' || p.source === 'circadian' ? -1 : layout.signals.get(p.source as Signal) ?? -1,
        transform: p.transform
      })),
      clearance: def.dynamics.clearance.map(c => ({
        rate: c.rate, type: c.type, enzymeIndex: c.enzyme ? layout.auxiliary.get(c.enzyme) ?? -1 : -1, Km: c.Km, transform: c.transform
      })),
      couplings: def.dynamics.couplings.map(c => ({
        sourceIndex: layout.signals.get(c.source) ?? -1,
        receptorIndex: layout.receptors.get(`${c.source}_sensitivity`) ?? -1,
        normalizedStrength: c.strength / def.dynamics.tau,
        isStimulate: c.effect === 'stimulate'
      }))
    });
  });

  const resolvedAux: PreResolvedDefinition[] = [];
  layout.auxiliary.forEach((idx, k) => {
    const def = AUXILIARY_DEFINITIONS[k];
    if (!def) return;
    resolvedAux.push({
      index: idx, tau: def.dynamics.tau, setpoint: def.dynamics.setpoint, min: 0, max: 2.0,
      production: def.dynamics.production.map(p => ({
        coefficient: p.coefficient,
        sourceIndex: p.source === 'constant' || p.source === 'circadian' ? -1 : layout.signals.get(p.source as Signal) ?? -1,
        transform: p.transform
      })),
      clearance: def.dynamics.clearance.map(c => ({
        rate: c.rate, type: c.type, enzymeIndex: c.enzyme ? layout.auxiliary.get(c.enzyme) ?? -1 : -1, Km: c.Km, transform: c.transform
      })),
      couplings: []
    });
  });

  const getSignalTargetsVector = (target: string) => {
    const targets: Array<{ index: number, sign: number }> = [];
    if (isReceptor(target)) {
      getReceptorSignals(target).forEach(ts => {
        const idx = layout.signals.get(ts.signal);
        if (idx !== undefined) targets.push({ index: idx, sign: ts.sign });
      });
    }
    const directIdx = layout.signals.get(target as Signal);
    if (directIdx !== undefined) targets.push({ index: directIdx, sign: 1 });
    return targets;
  };

  // --- RK4 WORKSPACE ---
  const k1 = new Float64Array(layout.size);
  const k2 = new Float64Array(layout.size);
  const k3 = new Float64Array(layout.size);
  const k4 = new Float64Array(layout.size);
  const tmpState = new Float64Array(layout.size);

  /**
   * Helper to provide a legacy-compatible state object for transform functions
   * that expect state.signals.X or state.auxiliary.Y
   */
  function createLegacyProxy(vector: Float64Array): SimulationState {
    return {
      signals: new Proxy({}, {
        get: (_, prop) => vector[layout.signals.get(prop as Signal)!] ?? 0
      }),
      auxiliary: new Proxy({}, {
        get: (_, prop) => vector[layout.auxiliary.get(prop as string)!] ?? 0
      }),
      receptors: new Proxy({}, {
        get: (_, prop) => vector[layout.receptors.get(prop as string)!] ?? 0
      }),
      pk: {}, // Analytical PK doesn't use state.pk
      accumulators: {}
    } as SimulationState;
  }

  function computeDerivativesVector(state: Float64Array, t: number, ctx: DynamicsContext, interventions: ActiveIntervention[], derivs: Float64Array) {
    derivs.fill(0);
    const legacyState = createLegacyProxy(state);

    // 1. Signals
    for (let i = 0; i < resolvedSignals.length; i++) {
      const rd = resolvedSignals[i];
      const val = state[rd.index];
      let setpoint = options?.debug?.enableBaselines !== false ? rd.setpoint(ctx) : 0;
      if (options?.debug?.enableConditions !== false && conditionAdjustments?.baselines?.[SIGNALS_ALL[i]]?.amplitude) setpoint += conditionAdjustments.baselines[SIGNALS_ALL[i]]!.amplitude!;
      let dS = (setpoint - val) / rd.tau;
      if (options?.debug?.enableBaselines !== false) {
        for (const p of rd.production) {
          const srcVal = p.sourceIndex === -1 ? 1.0 : state[p.sourceIndex];
          dS += p.coefficient * (p.transform ? p.transform(srcVal, legacyState, ctx) : srcVal);
        }
      }
      for (const c of rd.clearance) {
        let rate = c.rate;
        if (c.type === 'saturable') rate /= (c.Km! + val);
        else if (c.type === 'enzyme-dependent') rate *= (state[c.enzymeIndex] ?? 1.0);
        if (c.transform) rate *= c.transform(val, legacyState, ctx);
        dS -= rate * val;
      }
      if (options?.debug?.enableCouplings !== false) {
        for (const cp of rd.couplings) {
          const srcVal = state[cp.sourceIndex];
          const sensitivity = cp.receptorIndex === -1 ? 1.0 : state[cp.receptorIndex];
          dS += (cp.normalizedStrength * srcVal * sensitivity) * (cp.isStimulate ? 1 : -1);
        }
      }
      if (options?.debug?.enableInterventions !== false) {
        const signalKey = SIGNALS_ALL[i];
        for (const iv of interventions) {
          if ((iv as any).target === signalKey && (iv as any).type === "rate") dS += (iv as any).magnitude ?? 0;
          if (iv.pharmacology?.pd) {
            const conc = getAnalyticalConc(iv.id, t);
            if (conc > 0) {
              for (const eff of iv.pharmacology.pd) {
                const targets = getSignalTargetsVector(eff.target);
                for (const tgt of targets) {
                  if (tgt.index === rd.index) {
                    const dIdx = layout.receptors.get(`${eff.target}_density`);
                    const density = dIdx !== undefined ? state[dIdx] : 1.0;
                    const response = (conc * (eff.intrinsicEfficacy ?? 10) * density) / rd.tau;
                    if (eff.mechanism === 'agonist') dS += response * tgt.sign;
                    else if (eff.mechanism === 'antagonist') {
                      if (tgt.sign > 0) dS -= response * tgt.sign * (val / (val + 20));
                      else dS -= response * tgt.sign;
                    }
                  }
                }
              }
            }
          }
        }
      }
      derivs[rd.index] = dS;
    }
    // 2. Aux
    for (let i = 0; i < resolvedAux.length; i++) {
      const rd = resolvedAux[i];
      const val = state[rd.index];
      let setpoint = options?.debug?.enableHomeostasis !== false ? rd.setpoint(ctx) : 0;
      let dA = (setpoint - val) / rd.tau;
      if (options?.debug?.enableHomeostasis !== false) {
        for (const p of rd.production) {
          const srcVal = p.sourceIndex === -1 ? 1.0 : state[p.sourceIndex];
          dA += p.coefficient * (p.transform ? p.transform(srcVal, legacyState, ctx) : srcVal);
        }
      }
      for (const c of rd.clearance) {
        let rate = c.rate;
        if (c.type === 'saturable') rate /= (c.Km! + val);
        else if (c.type === 'enzyme-dependent') rate *= (state[c.enzymeIndex] ?? 1.0);
        if (c.transform) rate *= c.transform(val, legacyState, ctx);
        dA -= rate * val;
      }
      derivs[rd.index] = dA;
    }
    // 3. Receptors
    if (options?.debug?.enableReceptors !== false) {
      layout.receptors.forEach((idx, k) => {
        if (k.endsWith('_density')) {
          const base = k.replace('_density', '');
          let totalOccupancy = 0;
          for (const iv of interventions) {
            if (iv.pharmacology?.pd) {
              const conc = getAnalyticalConc(iv.id, t);
              const eff = iv.pharmacology.pd.find((e: any) => e.target === base);
              if (eff && conc > 0) totalOccupancy += hill(conc, eff.EC50 ?? 100, 1.2);
            }
          }
          derivs[idx] = 0.0005 * (1.0 - state[idx]) - 0.002 * Math.min(1.0, totalOccupancy) * state[idx];
        }
      });
    }
  }

  function integrateStepVector(state: Float64Array, t: number, dt: number, ctx: DynamicsContext, interventions: ActiveIntervention[]) {
    if (dt === 0) return;
    computeDerivativesVector(state, t, ctx, interventions, k1);
    for (let i = 0; i < layout.size; i++) tmpState[i] = state[i] + k1[i] * (dt / 2);
    computeDerivativesVector(tmpState, t + dt / 2, ctx, interventions, k2);
    for (let i = 0; i < layout.size; i++) tmpState[i] = state[i] + k2[i] * (dt / 2);
    computeDerivativesVector(tmpState, t + dt / 2, ctx, interventions, k3);
    for (let i = 0; i < layout.size; i++) tmpState[i] = state[i] + k3[i] * dt;
    computeDerivativesVector(tmpState, t + dt, ctx, interventions, k4);
    for (let i = 0; i < layout.size; i++) state[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    resolvedSignals.forEach(rs => state[rs.index] = Math.max(rs.min, Math.min(rs.max, state[rs.index])));
    resolvedAux.forEach(ra => state[ra.index] = Math.max(ra.min, Math.min(ra.max, state[ra.index])));
  }

  let currentStateVector = initialStateVector;

  if (options?.initialHomeostasisState) {
    const s = options.initialHomeostasisState as any;
    if (s.signals) Object.entries(s.signals).forEach(([k, v]) => { const idx = layout.signals.get(k as any); if (idx !== undefined) currentStateVector[idx] = v as number; });
    if (s.auxiliary) Object.entries(s.auxiliary).forEach(([k, v]) => { const idx = layout.auxiliary.get(k); if (idx !== undefined) currentStateVector[idx] = v as number; });
    if (s.receptors) Object.entries(s.receptors).forEach(([k, v]) => { const idx = layout.receptors.get(k); if (idx !== undefined) currentStateVector[idx] = v as number; });
  } else {
    // 24-HOUR WARM-UP
    activePointer = 0;
    activeSet = [];
    for (let t_warm = -1440; t_warm < 0; t_warm += 1.0) {
      updateActiveSet(t_warm);
      const wallMin = (t_warm % 1440 + 1440) % 1440;
      const isAsleep_warm = enableInterventions && items.some(item => {
        const def = defsMap.get(item.meta.key); if (def?.key !== 'sleep') return false;
        const start = item.startMin; const end = item.startMin + item.durationMin;
        return (wallMin >= start && wallMin <= end) || (wallMin+1440 >= start && wallMin+1440 <= end) || (wallMin-1440 >= start && wallMin-1440 <= end);
      });
      const warmUpCtx: DynamicsContext = {
        minuteOfDay: wallMin, circadianMinuteOfDay: (wallMin + circadianShift + 1440) % 1440,
        dayOfYear: 1, isAsleep: isAsleep_warm, subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any),
      };
      integrateStepVector(currentStateVector, t_warm, 1.0, warmUpCtx, activeSet);
    }
  }

  // --- SIMULATION LOOP ---
  const series: Record<Signal, Float32Array> = {} as Record<Signal, Float32Array>;
  for (const signal of includeSignals) series[signal] = new Float32Array(gridMins.length);
  const auxiliarySeries: Record<string, Float32Array> = {};
  for (const key of Object.keys(AUXILIARY_DEFINITIONS)) auxiliarySeries[key] = new Float32Array(gridMins.length);

  const homeostasisSeries = {
    glucosePool: new Float32Array(gridMins.length), insulinPool: new Float32Array(gridMins.length), hepaticGlycogen: new Float32Array(gridMins.length),
    adenosinePressure: new Float32Array(gridMins.length), cortisolPool: new Float32Array(gridMins.length), cortisolIntegral: new Float32Array(gridMins.length),
    adrenalineReserve: new Float32Array(gridMins.length), dopamineVesicles: new Float32Array(gridMins.length), serotoninPrecursor: new Float32Array(gridMins.length),
    norepinephrineVesicles: new Float32Array(gridMins.length), acetylcholineTone: new Float32Array(gridMins.length), gabaPool: new Float32Array(gridMins.length),
    bdnfExpression: new Float32Array(gridMins.length), ghReserve: new Float32Array(gridMins.length),
  };

  activePointer = 0;
  activeSet = [];
  gridMins.forEach((minute, idx) => {
    const adjustedMinute = (minute % minutesPerDay + minutesPerDay) % minutesPerDay;
    const circadianMinuteOfDay = (adjustedMinute + circadianShift + minutesPerDay) % minutesPerDay;
    const isAsleep = enableInterventions && items.some(item => {
      const def = defsMap.get(item.meta.key); if (def?.key !== 'sleep') return false;
      const start = item.startMin; const end = item.startMin + item.durationMin;
      const m = minute;
      return (m >= start && m <= end) || (m + 1440 >= start && m + 1440 <= end) || (m - 1440 >= start && m - 1440 <= end);
    });

    const dt = idx === 0 ? 0 : gridStep;
    if (dt > 0) {
      const subSteps = Math.max(1, Math.ceil(dt / 1.0));
      const subDt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        const t = minute - dt + s * subDt;
        updateActiveSet(t);
        const currentMin = (t % minutesPerDay + minutesPerDay) % minutesPerDay;
        const dynamicsCtx: DynamicsContext = {
          minuteOfDay: currentMin, circadianMinuteOfDay: (currentMin + circadianShift + minutesPerDay) % minutesPerDay,
          dayOfYear: 1, isAsleep, subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any),
        };
        integrateStepVector(currentStateVector, t, subDt, dynamicsCtx, activeSet);
      }
    } else {
      updateActiveSet(minute);
      const dynamicsCtx = { minuteOfDay: adjustedMinute, circadianMinuteOfDay, dayOfYear: 1, isAsleep, subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any) };
      integrateStepVector(currentStateVector, minute, 0, dynamicsCtx as any, activeSet);
    }

    layout.signals.forEach((idxV, s) => { if (series[s]) series[s][idx] = currentStateVector[idxV]; });
    layout.auxiliary.forEach((idxV, k) => { if (auxiliarySeries[k]) auxiliarySeries[k][idx] = currentStateVector[idxV]; });

    const getV = (key: string, map: Map<string, number>) => { const idxV = map.get(key); return idxV !== undefined ? currentStateVector[idxV] : 0; };
    homeostasisSeries.glucosePool[idx] = getV('glucose', layout.signals);
    homeostasisSeries.insulinPool[idx] = getV('insulin', layout.signals);
    homeostasisSeries.hepaticGlycogen[idx] = getV('hepaticGlycogen', layout.auxiliary);
    homeostasisSeries.adenosinePressure[idx] = getV('adenosinePressure', layout.auxiliary);
    homeostasisSeries.cortisolPool[idx] = getV('cortisol', layout.signals);
    homeostasisSeries.cortisolIntegral[idx] = getV('cortisolIntegral', layout.auxiliary);
    homeostasisSeries.adrenalineReserve[idx] = getV('adrenaline', layout.signals);
    homeostasisSeries.dopamineVesicles[idx] = getV('dopamineVesicles', layout.auxiliary);
    homeostasisSeries.norepinephrineVesicles[idx] = getV('norepinephrineVesicles', layout.auxiliary);
    homeostasisSeries.serotoninPrecursor[idx] = getV('serotoninPrecursor', layout.auxiliary);
    homeostasisSeries.acetylcholineTone[idx] = getV('acetylcholine', layout.signals);
    homeostasisSeries.gabaPool[idx] = getV('gabaPool', layout.auxiliary);
    homeostasisSeries.bdnfExpression[idx] = getV('bdnfExpression', layout.auxiliary);
    homeostasisSeries.ghReserve[idx] = getV('ghReserve', layout.auxiliary);
  });

  const finalHomeostasisState: any = {
    signals: Object.fromEntries(Array.from(layout.signals.entries()).map(([k, idx]) => [k, currentStateVector[idx]])),
    auxiliary: Object.fromEntries(Array.from(layout.auxiliary.entries()).map(([k, idx]) => [k, currentStateVector[idx]])),
    receptors: Object.fromEntries(Array.from(layout.receptors.entries()).map(([k, idx]) => [k, currentStateVector[idx]])),
    pk: {}, accumulators: {}
  };

  return { series, auxiliarySeries, finalHomeostasisState, homeostasisSeries: homeostasisSeries as any };
}

function integrateStep(state: SimulationState, t: number, dt: number, ctx: DynamicsContext, defs: any, auxDefs: any, ivs: any, debug: any, cond: any) {
  const k1 = computeDerivatives(state, t, ctx, defs, auxDefs, ivs, debug, cond);
  const k2State = addStates(state, scaleState(k1, dt / 2));
  const k2 = computeDerivatives(k2State, t + dt / 2, ctx, defs, auxDefs, ivs, debug, cond);
  const k3State = addStates(state, scaleState(k2, dt / 2));
  const k3 = computeDerivatives(k3State, t + dt / 2, ctx, defs, auxDefs, ivs, debug, cond);
  const k4State = addStates(state, scaleState(k3, dt));
  const k4 = computeDerivatives(k4State, t + dt, ctx, defs, auxDefs, ivs, debug, cond);
  const combined = scaleState(addStates(k1, addStates(scaleState(k2, 2), addStates(scaleState(k3, 2), k4))), 1 / 6);
  const nextState = addStates(state, scaleState(combined, dt));
  if (debug?.enableBaselines !== false) {
    for (const signalKey of Object.keys(defs)) {
      const def = defs[signalKey];
      if (def) {
        const min = def.min ?? 0;
        const max = def.max ?? Infinity;
        nextState.signals[signalKey] = Math.max(min, Math.min(max, nextState.signals[signalKey]));
      }
    }
  }
  for (const auxKey of Object.keys(auxDefs)) nextState.auxiliary[auxKey] = Math.max(0, Math.min(2.0, nextState.auxiliary[auxKey]));
  return nextState;
}