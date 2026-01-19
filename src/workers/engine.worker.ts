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
import { runOptimizedV2 } from "../models/engine/solvers/optimized-v2";

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const startTime = performance.now();
  const request = event.data;

  console.debug("[EngineWorker] Running Optimized V2 solver...");
  const result = runOptimizedV2(request);

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
