import type { KernelFn, ParamValues, Signal, WorkerComputeResponse } from '@/types';
import { SIGNALS_ALL } from '@/types';

self.onmessage = (event: MessageEvent<{ kernel: string; signal: Signal; params: ParamValues }>) => {
  const { kernel, signal, params } = event.data;
  // eslint-disable-next-line no-new-func
  const fn: KernelFn = new Function(`return (${kernel})`)();
  const minutes = Array.from({ length: 120 }, (_, idx) => idx * 5);
  const series: WorkerComputeResponse['series'] = {} as WorkerComputeResponse['series'];
  for (const sig of SIGNALS_ALL) {
    series[sig] = new Float32Array(minutes.length);
  }
  minutes.forEach((minute, idx) => {
    series[signal][idx] = fn(minute, params, 1);
  });
  self.postMessage({ series });
};
