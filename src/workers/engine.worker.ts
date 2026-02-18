import {
  type WorkerComputeRequest,
  type WorkerComputeResponse,
  runOptimizedV2,
} from "@kyneticbio/core";
import {
  SIGNALS_ALL,
  AUXILIARY_DEFINITIONS,
  HUMAN_RESOLVER,
  getAllUnifiedDefinitions,
  getAllReceptorKeys,
  getAllTransporterKeys,
  type Signal
} from "@kyneticbio/core";

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const startTime = performance.now();
  const request = event.data;

  console.debug("[EngineWorker] Running Optimized V2 solver...");

  // Assembler for the "Human Physiology" system
  const system = {
    signals: SIGNALS_ALL,
    signalDefinitions: getAllUnifiedDefinitions(),
    auxDefinitions: AUXILIARY_DEFINITIONS,
    resolver: HUMAN_RESOLVER,
    receptorKeys: [...getAllReceptorKeys(), ...getAllTransporterKeys()],
  };

  const result = runOptimizedV2(request, system);

  // Post-process homeostasis series (specific to our app's needs)
  const gridMins = request.gridMins;

  const getS = (key: Signal) => result.series[key] || new Float32Array(gridMins.length);
  const getA = (key: string) => result.auxiliarySeries[key] || new Float32Array(gridMins.length);

  result.homeostasisSeries = {
    glucosePool: getS('glucose' as Signal),
    insulinPool: getS('insulin' as Signal),
    hepaticGlycogen: getA('hepaticGlycogen'),
    adenosinePressure: getA('adenosinePressure'),
    cortisolPool: getS('cortisol' as Signal),
    cortisolIntegral: getA('cortisolIntegral'),
    adrenalineReserve: getS('adrenaline' as Signal),
    dopamineVesicles: getA('dopamineVesicles'),
    norepinephrineVesicles: getA('norepinephrineVesicles'),
    serotoninPrecursor: getA('serotoninPrecursor'),
    acetylcholineTone: getS('acetylcholine' as Signal),
    gabaPool: getA('gabaPool'),
    bdnfExpression: getA('bdnfExpression'),
    ghReserve: getA('ghReserve'),
  };

  const payload: WorkerComputeResponse = {
    ...result,
    computeTimeMs: performance.now() - startTime,
  };

  const allBuffers = [
    ...Object.values(result.series),
    ...Object.values(result.auxiliarySeries),
    ...Object.values(result.homeostasisSeries),
  ];

  const transferables = Array.from(
    new Set(allBuffers.map((b) => (b as Float32Array).buffer))
  );

  (self as any).postMessage(payload, transferables);
};