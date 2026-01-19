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

/**
 * OPTIMIZED SOLVER V2 (Production Bateman Edition)
 * 
 * Strategy for Bit-for-Bit Parity with V1:
 * 1. Manual RK4 Injection: Syncs PK analytical values at k1, k2, k3, k4.
 * 2. First-Order Bateman Model: Matches V1's "Gut -> Central" oral kinetics.
 * 3. 24-hour Warm-up: Establishes residue from yesterday for seamless day-wrapping.
 */
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

  // --- ANALYTICAL EVALUATOR ---
  function getAnalyticalConc(id: string, t: number): number {
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

  // --- INITIALIZE BUFFERS ---
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

  // --- STATE & WARM-UP ---
  let currentState = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
    subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any), isAsleep: false 
  }, options?.debug);

  if (options?.debug?.enableConditions !== false) {
    if (options?.enzymeActivities) for (const [k, v] of Object.entries(options.enzymeActivities)) if (currentState.auxiliary[k] !== undefined) currentState.auxiliary[k] += v;
    if (options?.transporterActivities) for (const [k, v] of Object.entries(options.transporterActivities)) if (currentState.auxiliary[k] !== undefined) currentState.auxiliary[k] += v;
    if (options?.receptorDensities) for (const [k, v] of Object.entries(options.receptorDensities)) currentState.receptors[`${k}_density`] = 1.0 + v;
    if (options?.receptorSensitivities) for (const [k, v] of Object.entries(options.receptorSensitivities)) currentState.receptors[`${k}_sensitivity`] = 1.0 + v;
  }

  if (options?.initialHomeostasisState) {
    currentState = { ...currentState, ...(options.initialHomeostasisState as any) };
  } else {
    // 24-HOUR WARM-UP
    for (let t_warm = -1440; t_warm < 0; t_warm += 1.0) {
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
      for (const id of uniqueInterventions.keys()) currentState.pk[`${id}_central`] = getAnalyticalConc(id, t_warm);
      currentState = integrateStep(currentState, t_warm, 1.0, warmUpCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, solverInterventions, options?.debug, conditionAdjustments);
    }
  }

  // --- SIMULATION LOOP ---
  gridMins.forEach((minute, idx) => {
    const adjustedMinute = (minute % minutesPerDay + minutesPerDay) % minutesPerDay;
    const circadianMinuteOfDay = (adjustedMinute + circadianShift + minutesPerDay) % minutesPerDay;
    const dt = idx === 0 ? 0 : gridStep;
    if (dt > 0) {
      const subSteps = Math.max(1, Math.ceil(dt / 1.0));
      const subDt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        const t = minute - dt + s * subDt;
        const currentMin = (t % minutesPerDay + minutesPerDay) % minutesPerDay;
        const isAsleep = enableInterventions && items.some(item => {
          const def = defsMap.get(item.meta.key); if (def?.key !== 'sleep') return false;
          const start = item.startMin; const end = item.startMin + item.durationMin;
          return (currentMin >= start && currentMin <= end) || (currentMin+1440 >= start && currentMin+1440 <= end) || (currentMin-1440 >= start && currentMin-1440 <= end);
        });
        const dynamicsCtx: DynamicsContext = {
          minuteOfDay: currentMin, circadianMinuteOfDay: (currentMin + circadianShift + minutesPerDay) % minutesPerDay,
          dayOfYear: 1, isAsleep, subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any),
        };
        // Manual RK4 stages for analytical PK injection
        for (const id of uniqueInterventions.keys()) currentState.pk[`${id}_central`] = getAnalyticalConc(id, t);
        const k1 = computeDerivatives(currentState, t, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, solverInterventions, options?.debug, conditionAdjustments);
        const k2State = addStates(currentState, scaleState(k1, subDt / 2));
        for (const id of uniqueInterventions.keys()) k2State.pk[`${id}_central`] = getAnalyticalConc(id, t + subDt / 2);
        const k2 = computeDerivatives(k2State, t + subDt / 2, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, solverInterventions, options?.debug, conditionAdjustments);
        const k3State = addStates(currentState, scaleState(k2, subDt / 2));
        for (const id of uniqueInterventions.keys()) k3State.pk[`${id}_central`] = getAnalyticalConc(id, t + subDt / 2);
        const k3 = computeDerivatives(k3State, t + subDt / 2, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, solverInterventions, options?.debug, conditionAdjustments);
        const k4State = addStates(currentState, scaleState(k3, subDt));
        for (const id of uniqueInterventions.keys()) k4State.pk[`${id}_central`] = getAnalyticalConc(id, t + subDt);
        const k4 = computeDerivatives(k4State, t + subDt, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, solverInterventions, options?.debug, conditionAdjustments);
        const combined = scaleState(addStates(k1, addStates(scaleState(k2, 2), addStates(scaleState(k3, 2), k4))), 1 / 6);
        currentState = addStates(currentState, scaleState(combined, subDt));

        // Clamp signals after manual RK4 (matching ode-solver.ts behavior)
        if (options?.debug?.enableBaselines !== false) {
          for (const signalKey of Object.keys(unifiedDefinitions)) {
            const def = unifiedDefinitions[signalKey];
            if (def) {
              const min = def.min ?? 0;
              const max = def.max ?? Infinity;
              currentState.signals[signalKey] = Math.max(min, Math.min(max, currentState.signals[signalKey]));
            }
          }
        }
        for (const auxKey of Object.keys(AUXILIARY_DEFINITIONS)) {
          currentState.auxiliary[auxKey] = Math.max(0, Math.min(2.0, currentState.auxiliary[auxKey]));
        }
      }
    } else {
      for (const id of uniqueInterventions.keys()) currentState.pk[`${id}_central`] = getAnalyticalConc(id, minute);
      const isAsleep = enableInterventions && items.some(item => {
        const def = defsMap.get(item.meta.key); if (def?.key !== 'sleep') return false;
        const start = item.startMin; const end = item.startMin + item.durationMin;
        return (minute >= start && minute <= end) || (minute+1440 >= start && minute+1440 <= end) || (minute-1440 >= start && minute-1440 <= end);
      });
      const dynamicsCtx = { minuteOfDay: adjustedMinute, circadianMinuteOfDay, dayOfYear: 1, isAsleep, subject: options?.subject ?? ({} as any), physiology: options?.physiology ?? ({} as any) };
      currentState = integrateStep(currentState, minute, 0, dynamicsCtx as any, unifiedDefinitions, AUXILIARY_DEFINITIONS, solverInterventions, options?.debug, conditionAdjustments);
    }
    for (const signal of includeSignals) series[signal][idx] = currentState.signals[signal] ?? 0;
    for (const auxKey of Object.keys(auxiliarySeries)) auxiliarySeries[auxKey][idx] = currentState.auxiliary[auxKey] ?? 0;
    homeostasisSeries.glucosePool[idx] = currentState.signals.glucose ?? 0; homeostasisSeries.insulinPool[idx] = currentState.signals.insulin ?? 0; homeostasisSeries.hepaticGlycogen[idx] = currentState.auxiliary.hepaticGlycogen ?? 0;
    homeostasisSeries.adenosinePressure[idx] = currentState.auxiliary.adenosinePressure ?? 0; homeostasisSeries.cortisolPool[idx] = currentState.signals.cortisol ?? 0; homeostasisSeries.cortisolIntegral[idx] = currentState.auxiliary.cortisolIntegral ?? 0;
    homeostasisSeries.adrenalineReserve[idx] = currentState.signals.adrenaline ?? 0; homeostasisSeries.dopamineVesicles[idx] = currentState.auxiliary.dopamineVesicles ?? 0; homeostasisSeries.norepinephrineVesicles[idx] = currentState.auxiliary.norepinephrineVesicles ?? 0;
    homeostasisSeries.serotoninPrecursor[idx] = currentState.auxiliary.serotoninPrecursor ?? 0; homeostasisSeries.acetylcholineTone[idx] = currentState.signals.acetylcholine ?? 0; homeostasisSeries.gabaPool[idx] = currentState.auxiliary.gabaPool ?? 0;
    homeostasisSeries.bdnfExpression[idx] = currentState.auxiliary.bdnfExpression ?? 0; homeostasisSeries.ghReserve[idx] = currentState.auxiliary.ghReserve ?? 0;
  });
  return { series, auxiliarySeries, finalHomeostasisState: currentState as any, homeostasisSeries: homeostasisSeries as any };
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

  // Clamp signals to min/max (matching ode-solver.ts behavior)
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

  // Clamp auxiliary variables to [0, 2]
  for (const auxKey of Object.keys(auxDefs)) {
    nextState.auxiliary[auxKey] = Math.max(0, Math.min(2.0, nextState.auxiliary[auxKey]));
  }

  return nextState;
}