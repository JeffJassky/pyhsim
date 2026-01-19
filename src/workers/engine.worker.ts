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
import { runNumericalV1 } from "../models/engine/solvers/numerical-v1";
import { runOptimizedV2 } from "../models/engine/solvers/optimized-v2";

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const startTime = performance.now();
  const request = event.data;
  const { options } = request;

  let result: WorkerComputeResponse;

  if (options?.useOptimizedEngine) {
    console.debug("[EngineWorker] Running Optimized V2 solver...");
    result = runOptimizedV2(request);

    // --- Optional: Parallel Validation Mode ---
    // Uncomment to detect mathematical divergence during development
    /*
    const goldStandard = runNumericalV1(request);
    let maxDiff = 0;
    for (const sig of SIGNALS_ALL) {
      if (!result.series[sig] || !goldStandard.series[sig]) continue;
      for (let i = 0; i < result.series[sig].length; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(result.series[sig][i] - goldStandard.series[sig][i]));
      }
    }
    if (maxDiff > 1e-6) {
      console.warn(`[EngineWorker] WARNING: Optimized engine divergent! Max delta: ${maxDiff}`);
    } else {
      console.debug(`[EngineWorker] Validation passed. Max delta: ${maxDiff}`);
    }
    */
  } else {
    console.debug("[EngineWorker] Running Numerical V1 solver...");
    result = runNumericalV1(request);
  }

  const payload: WorkerComputeResponse = {
    ...result,
    computeTimeMs: performance.now() - startTime,
  };

  const transferables = [
    ...Object.values(result.series).map((buffer) => buffer.buffer),
    ...Object.values(result.auxiliarySeries).map((buffer) => buffer.buffer),
    ...Object.values(result.homeostasisSeries).map((buffer) => buffer.buffer),
  ];
  (self as any).postMessage(payload, transferables);
};
