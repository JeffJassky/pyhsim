import {
  Minute,
  Signal,
  WorkerComputeRequest,
  WorkerComputeResponse,
} from "@/types";
import { SIGNALS_ALL } from "@/types";
import type { SimulationState, DynamicsContext, ActiveIntervention } from '@/types/unified';
import {
  integrateStep,
  createInitialState,
  getAllUnifiedDefinitions,
  AUXILIARY_DEFINITIONS,
  SIGNAL_DEFINITIONS,
  type ConditionAdjustments,
} from "@/models/engine";

export function runNumericalV1(request: WorkerComputeRequest): WorkerComputeResponse {
  const { gridMins, items, defs, options } = request;

  const enableInterventions = options?.debug?.enableInterventions ?? true;
  const includeSignals = options?.includeSignals ?? SIGNALS_ALL;
  const gridStep = gridMins.length > 1 ? gridMins[1] - gridMins[0] : 5;
  const minutesPerDay = 24 * 60;

  const series: Record<Signal, Float32Array> = {} as Record<Signal, Float32Array>;
  for (const signal of includeSignals) {
    series[signal] = new Float32Array(gridMins.length);
  }

  const auxiliarySeries: Record<string, Float32Array> = {};
  for (const key of Object.keys(AUXILIARY_DEFINITIONS)) {
    auxiliarySeries[key] = new Float32Array(gridMins.length);
  }

  const homeostasisSeries = {
    glucosePool: new Float32Array(gridMins.length),
    insulinPool: new Float32Array(gridMins.length),
    hepaticGlycogen: new Float32Array(gridMins.length),
    adenosinePressure: new Float32Array(gridMins.length),
    cortisolPool: new Float32Array(gridMins.length),
    cortisolIntegral: new Float32Array(gridMins.length),
    adrenalineReserve: new Float32Array(gridMins.length),
    dopamineVesicles: new Float32Array(gridMins.length),
    serotoninPrecursor: new Float32Array(gridMins.length),
    norepinephrineVesicles: new Float32Array(gridMins.length),
    acetylcholineTone: new Float32Array(gridMins.length),
    gabaPool: new Float32Array(gridMins.length),
    bdnfExpression: new Float32Array(gridMins.length),
    ghReserve: new Float32Array(gridMins.length),
  };

  const defsMap = new Map(defs.map((def) => [def.key, def]));
  const unifiedDefinitions = getAllUnifiedDefinitions();
  
  // Initialize state
  let initialState: SimulationState = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
    subject: options?.subject ?? ({} as any),
    physiology: options?.physiology ?? ({} as any),
    isAsleep: false 
  }, options?.debug);

  // Apply condition adjustments
  if (options?.debug?.enableConditions !== false) {
    if (options?.enzymeActivities) {
      for (const [key, val] of Object.entries(options.enzymeActivities)) {
        if (initialState.auxiliary[key] !== undefined) {
          initialState.auxiliary[key] += val;
        }
      }
    }
    if (options?.transporterActivities) {
      for (const [key, val] of Object.entries(options.transporterActivities)) {
        if (initialState.auxiliary[key] !== undefined) {
          initialState.auxiliary[key] += val;
        }
      }
    }
    if (options?.receptorDensities) {
      for (const [key, val] of Object.entries(options.receptorDensities)) {
        initialState.receptors[`${key}_density`] = 1.0 + val;
      }
    }
    if (options?.receptorSensitivities) {
      for (const [key, val] of Object.entries(options.receptorSensitivities)) {
        initialState.receptors[`${key}_sensitivity`] = 1.0 + val;
      }
    }
  }

  let currentState: SimulationState = options?.initialHomeostasisState
    ? (options.initialHomeostasisState as any) 
    : initialState;

  // Prepare active interventions and wake time early for warm-up context
  const activeInterventions: ActiveIntervention[] = [];
  let wakeTimeMin = 480; 
  let foundWakeTime = false;

  if (enableInterventions) {
    const numDays = Math.ceil((gridMins[gridMins.length - 1] + gridStep) / 1440);
    
    for (const item of items) {
      if (foundWakeTime) break;
      const def = defsMap.get(item.meta.key);
      if (def?.key === 'wake') {
        wakeTimeMin = item.startMin % 1440;
        foundWakeTime = true;
      } else if (def?.key === 'sleep') {
        wakeTimeMin = (item.startMin + item.durationMin) % 1440;
        foundWakeTime = true;
      }
    }

    for (let d = 0; d < numDays; d++) {
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;

        let pharmList: any[] = [];
        if ((item as any).resolvedPharmacology) {
          pharmList = (item as any).resolvedPharmacology;
        } else if (def.pharmacology && typeof def.pharmacology !== 'function') {
           pharmList = [def.pharmacology];
        }

        pharmList.forEach((pharm, index) => {
           const agentId = pharmList.length > 1 ? `${item.id}_${index}` : item.id;
           activeInterventions.push({
            id: agentId, 
            key: def.key,
            startTime: item.startMin + (d * 1440),
            duration: item.durationMin,
            intensity: item.meta.intensity ?? 1.0,
            params: item.meta.params,
            pharmacology: pharm
          });
        });
      }
    }
  }

  const standardWakeTime = 480;
  const circadianShift = standardWakeTime - wakeTimeMin;
  const conditionAdjustments: ConditionAdjustments = (options?.debug?.enableConditions !== false) ? {
    baselines: options?.conditionBaselines,
    couplings: options?.conditionCouplings,
  } : {};

  // --- 24-HOUR PHYSIOLOGICAL WARM-UP ---
  if (!options?.initialHomeostasisState) {
    const warmUpDt = 1.0;
    for (let t_warm = -1440; t_warm < 0; t_warm += warmUpDt) {
      const wallMin = (t_warm % 1440 + 1440) % 1440;
      const isAsleep_warm = enableInterventions && items.some(item => {
        const def = defsMap.get(item.meta.key);
        if (def?.key !== 'sleep') return false;
        const start = item.startMin; const end = item.startMin + item.durationMin;
        return (wallMin >= start && wallMin <= end) || (wallMin+1440 >= start && wallMin+1440 <= end) || (wallMin-1440 >= start && wallMin-1440 <= end);
      });

      const warmUpCtx: DynamicsContext = {
        minuteOfDay: wallMin,
        circadianMinuteOfDay: (wallMin + circadianShift + 1440) % 1440,
        dayOfYear: 1, isAsleep: isAsleep_warm,
        subject: options?.subject ?? ({} as any),
        physiology: options?.physiology ?? ({} as any),
      };

      currentState = integrateStep(currentState, t_warm, warmUpDt, warmUpCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug, conditionAdjustments);
    }
  }

  // Simulation Loop
  gridMins.forEach((minute, idx) => {
    const adjustedMinute = minute % minutesPerDay;
    const circadianMinuteOfDay = (adjustedMinute + circadianShift + minutesPerDay) % minutesPerDay;
    
    const isAsleep = enableInterventions && items.some(item => {
      const def = defsMap.get(item.meta.key);
      if (def?.key !== 'sleep') return false;
      const start = item.startMin;
      const end = item.startMin + item.durationMin;
      if (minute >= start && minute <= end) return true;
      if ((minute + 1440) >= start && (minute + 1440) <= end) return true;
      if ((minute - 1440) >= start && (minute - 1440) <= end) return true;
      return false;
    });

    const dynamicsCtx: DynamicsContext = {
      minuteOfDay: adjustedMinute,
      circadianMinuteOfDay,
      dayOfYear: 1, 
      isAsleep,
      subject: options?.subject ?? ({} as any),
      physiology: options?.physiology ?? ({} as any),
    };

    const dt = idx === 0 ? 0 : gridStep;
    if (dt > 0) {
      const subSteps = Math.max(1, Math.ceil(dt / 1.0));
      const subDt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        currentState = integrateStep(currentState, minute - dt + s * subDt, subDt, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug, conditionAdjustments);
      }
    } else {
      currentState = integrateStep(currentState, minute, 0, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug, conditionAdjustments);
    }

    for (const signal of includeSignals) {
      series[signal][idx] = currentState.signals[signal] ?? 0;
    }
    for (const auxKey of Object.keys(auxiliarySeries)) {
      auxiliarySeries[auxKey][idx] = currentState.auxiliary[auxKey] ?? 0;
    }

    homeostasisSeries.glucosePool[idx] = currentState.signals.glucose ?? 0;
    homeostasisSeries.insulinPool[idx] = currentState.signals.insulin ?? 0;
    homeostasisSeries.hepaticGlycogen[idx] = currentState.auxiliary.hepaticGlycogen ?? 0;
    homeostasisSeries.adenosinePressure[idx] = currentState.auxiliary.adenosinePressure ?? 0;
    homeostasisSeries.cortisolPool[idx] = currentState.signals.cortisol ?? 0;
    homeostasisSeries.cortisolIntegral[idx] = currentState.auxiliary.cortisolIntegral ?? 0;
    homeostasisSeries.adrenalineReserve[idx] = currentState.signals.adrenaline ?? 0;
    homeostasisSeries.dopamineVesicles[idx] = currentState.auxiliary.dopamineVesicles ?? 0;
    homeostasisSeries.norepinephrineVesicles[idx] = currentState.auxiliary.norepinephrineVesicles ?? 0;
    homeostasisSeries.serotoninPrecursor[idx] = currentState.auxiliary.serotoninPrecursor ?? 0;
    homeostasisSeries.acetylcholineTone[idx] = currentState.signals.acetylcholine ?? 0;
    homeostasisSeries.gabaPool[idx] = currentState.auxiliary.gabaPool ?? 0;
    homeostasisSeries.bdnfExpression[idx] = currentState.auxiliary.bdnfExpression ?? 0;
    homeostasisSeries.ghReserve[idx] = currentState.auxiliary.ghReserve ?? 0;
  });

  return {
    series,
    auxiliarySeries,
    finalHomeostasisState: currentState as any,
    homeostasisSeries: homeostasisSeries as any,
  };
}
