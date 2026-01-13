import {
  BaselineContext,
  BaselineFn,
  ItemForWorker,
  Minute,
  Physiology,
  Subject,
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
} from "@/models/unified";

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const { gridMins, items, defs, options } = event.data;

  const enableInterventions = options?.debug?.enableInterventions ?? true;

  const includeSignals = options?.includeSignals ?? SIGNALS_ALL;
  const gridStep = gridMins.length > 1 ? gridMins[1] - gridMins[0] : 5;
  const wakeOffsetMin = options?.wakeOffsetMin ?? (0 as Minute);
  const minutesPerDay = 24 * 60;

  const baselineContext: BaselineContext = {
    chronotypeShiftMin: wakeOffsetMin,
    sleepDebt: 0,
    subject: options?.subject,
    physiology: options?.physiology,
  };

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

  // --- Unified ODE Simulation ---
  const unifiedDefinitions = getAllUnifiedDefinitions();
  
  // Initialize state
  let initialState: SimulationState = createInitialState(SIGNAL_DEFINITIONS, AUXILIARY_DEFINITIONS, {
    subject: options?.subject ?? ({} as any),
    physiology: options?.physiology ?? ({} as any),
    isAsleep: false 
  }, options?.debug);

  // Apply profile adjustments to initial state auxiliary variables (enzymes, transporters)
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

  // Apply receptor profile adjustments
  if (options?.receptorDensities) {
    for (const [key, val] of Object.entries(options.receptorDensities)) {
      initialState.receptors[`${key}_density`] = 1.0 + val;
    }
  }

  let currentState: SimulationState = options?.initialHomeostasisState
    ? (options.initialHomeostasisState as any) 
    : initialState;

  // Prepare mechanistic interventions
  const activeInterventions: ActiveIntervention[] = [];
  let wakeTimeMin = 480; // Default 8:00 AM
  let foundWakeTime = false;

  if (enableInterventions) {
    const numDays = Math.ceil((gridMins[gridMins.length - 1] + gridStep) / 1440);
    
    // First pass: find wake time for circadian alignment
    // We look for the FIRST wake or sleep event to establish the rhythm anchor
    // (Simplification: assuming consistent schedule or using the first day as anchor)
    for (const item of items) {
      if (foundWakeTime) break;
      const def = defsMap.get(item.meta.key);
      if (!def) continue;

      if (def.key === 'wake') {
        wakeTimeMin = item.startMin % 1440;
        foundWakeTime = true;
      } else if (def.key === 'sleep') {
        // Wake time is end of sleep
        wakeTimeMin = (item.startMin + item.durationMin) % 1440;
        foundWakeTime = true;
      }
    }

    for (let d = 0; d < numDays; d++) {
      for (const item of items) {
        const def = defsMap.get(item.meta.key);
        if (!def) continue;

        const intervention = {
          id: item.id, // Same ID allows sharing the PK compartment across days
          key: def.key,
          startTime: item.startMin + (d * 1440),
          duration: item.durationMin,
          intensity: item.meta.intensity ?? 1.0,
          params: item.meta.params,
          pharmacology: def.pharmacology
        };

        activeInterventions.push(intervention);
      }
    }
  }

  // Calculate shift needed to align user's wake time to "Standard Model Time" (8:00 AM)
  const standardWakeTime = 480;
  const circadianShift = standardWakeTime - wakeTimeMin;

  // Simulation Loop
  gridMins.forEach((minute, idx) => {
    const adjustedMinute = minute % minutesPerDay;
    const circadianMinuteOfDay = (adjustedMinute + circadianShift + minutesPerDay) % minutesPerDay;
    
    const isAsleep = enableInterventions && items.some(item => {
      const def = defsMap.get(item.meta.key);
      if (def?.key !== 'sleep') return false;
      const inRange = (minute >= item.startMin && minute <= item.startMin + item.durationMin);
      const inWrappedRange = ((minute + 1440) >= item.startMin && (minute + 1440) <= item.startMin + item.durationMin);
      return inRange || inWrappedRange;
    });

    const dynamicsCtx: DynamicsContext = {
      minuteOfDay: adjustedMinute,
      circadianMinuteOfDay,
      dayOfYear: 1, 
      isAsleep,
      subject: options?.subject ?? ({} as any),
      physiology: options?.physiology ?? ({} as any),
    };

    // Step ODE
    const dt = idx === 0 ? 0 : gridStep;
    if (dt > 0) {
      const subSteps = Math.max(1, Math.ceil(dt / 1.0)); // 1 minute sub-steps for stability
      const subDt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        currentState = integrateStep(currentState, minute - dt + s * subDt, subDt, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug);
      }
    } else {
      currentState = integrateStep(currentState, minute, 0, dynamicsCtx, unifiedDefinitions, AUXILIARY_DEFINITIONS, activeInterventions, options?.debug);
    }

    // Write results to series
    for (const signal of includeSignals) {
      series[signal][idx] = currentState.signals[signal] ?? 0;
    }

    // Write results to auxiliary series
    for (const auxKey of Object.keys(auxiliarySeries)) {
      auxiliarySeries[auxKey][idx] = currentState.auxiliary[auxKey] ?? 0;
    }

    // Map unified auxiliary to homeostasis series for UI compatibility
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
    homeostasisSeries.acetylcholineTone[idx] = currentState.signals.acetylcholine ?? 0; // mapped to signal
    homeostasisSeries.gabaPool[idx] = currentState.auxiliary.gabaPool ?? 0;
    homeostasisSeries.bdnfExpression[idx] = currentState.auxiliary.bdnfExpression ?? 0;
    homeostasisSeries.ghReserve[idx] = currentState.auxiliary.ghReserve ?? 0;
  });

  const payload: WorkerComputeResponse = {
    series,
    auxiliarySeries,
    finalHomeostasisState: currentState as any,
    homeostasisSeries: homeostasisSeries as any,
  };

  const transferables = [
    ...Object.values(series).map((buffer) => buffer.buffer),
    ...Object.values(auxiliarySeries).map((buffer) => buffer.buffer),
    ...Object.values(homeostasisSeries).map((buffer) => buffer.buffer),
  ];
  (self as any).postMessage(payload, transferables);
};
