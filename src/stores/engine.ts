import { defineStore } from 'pinia';
import type {
  EngineState,
  Minute,
  Signal,
  TimelineItem,
  WorkerComputeRequest,
  WorkerComputeResponse,
} from '@/types';
import { SIGNALS_ALL } from '@/types';
import { rangeMinutes } from '@/utils/time';
import { SIGNAL_BASELINES, INTERVENTIONS } from '@/models';
import { buildWorkerRequest, toMinuteOfDay } from '@/core/serialization';
import { useProfilesStore } from './profiles';
import { buildProfileAdjustments } from '@/models/profiles';
import { derivePhysiology } from '@/models/subject';

interface EngineStoreState extends EngineState {
  busy: boolean;
  error?: string;
}

const defaultGridStep = 5;
const initialGrid = rangeMinutes(defaultGridStep);

const createEmptySeries = (length: number): Record<Signal, Float32Array> => {
  return SIGNALS_ALL.reduce((acc, signal) => {
    acc[signal] = new Float32Array(length);
    return acc;
  }, {} as Record<Signal, Float32Array>);
};

let worker: Worker | null = null;

export const useEngineStore = defineStore('engine', {
  state: (): EngineStoreState => ({
    gridStepMin: defaultGridStep,
    gridMins: initialGrid,
    baselines: SIGNAL_BASELINES,
    series: createEmptySeries(initialGrid.length),
    busy: false,
    error: undefined,
    lastComputedAt: undefined,
  }),
  actions: {
    setGridStep(step: number) {
      this.gridStepMin = step;
      this.gridMins = rangeMinutes(step);
      this.series = createEmptySeries(this.gridMins.length);
    },
    setBaselines(map: EngineState['baselines']) {
      this.baselines = map;
    },
    async recompute(payload?: { items?: TimelineItem[]; defs?: WorkerComputeRequest['defs'] }) {
      if (typeof Worker === 'undefined') {
        this.error = 'Web Workers are not supported in this environment';
        return;
      }
      if (!worker) {
        worker = new Worker(new URL('../workers/engine.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event: MessageEvent<WorkerComputeResponse>) => {
          const { series } = event.data;
          console.debug('[EngineStore] Received series from worker. Keys:', Object.keys(series));
          
          // Data validation check
          const sampleKey: Signal = 'dopamine';
          if (series[sampleKey]) {
            const sample = series[sampleKey];
            let hasData = false;
            for (let i = 0; i < Math.min(10, sample.length); i++) {
              if (sample[i] !== 0) hasData = true;
            }
            if (!hasData) {
              console.warn(`[EngineStore] Warning: Sample signal '${sampleKey}' appears to be all zeros in first 10 samples.`);
            }
          }

          this.series = series;
          this.busy = false;
          this.lastComputedAt = Date.now();
        };
        worker.onerror = (event) => {
          console.error('[EngineStore] Worker Error:', event.message);
          this.error = event.message;
          this.busy = false;
        };
      }
      const items = payload?.items ?? [];
      const defs = payload?.defs ?? INTERVENTIONS;
      const clonedItems = JSON.parse(JSON.stringify(items));
      const clonedDefs = JSON.parse(JSON.stringify(defs));
      const gridCopy = [...this.gridMins] as Minute[];
      const wakeItem = items.find((item) => item.meta.key === 'wake');
      const sleepItem = items.find((item) => item.meta.key === 'sleep');
      const wakeOffsetMin = wakeItem ? toMinuteOfDay(wakeItem.start) : undefined;
      const sleepMinutes =
        sleepItem && sleepItem.start && sleepItem.end
          ? (() => {
              const start = toMinuteOfDay(sleepItem.start);
              const end = toMinuteOfDay(sleepItem.end);
              const diff = end - start;
              return diff > 0 ? diff : diff + 24 * 60;
            })()
          : undefined;
      const profilesStore = useProfilesStore();
      const profileAdjustments = buildProfileAdjustments(profilesStore.profiles);
      // Ensure subject is a plain object by explicit construction
      const s = profilesStore.subject;
      const subject = {
        age: s.age,
        weight: s.weight,
        height: s.height,
        sex: s.sex,
        cycleLength: s.cycleLength,
        lutealPhaseLength: s.lutealPhaseLength,
        cycleDay: s.cycleDay,
      };
      const physiology = derivePhysiology(subject);
      
      console.debug('[EngineStore] Posting request to worker...');

      const request = buildWorkerRequest(gridCopy, clonedItems, clonedDefs, {
        options: {
          wakeOffsetMin,
          sleepMinutes,
          profileBaselines: profileAdjustments.baselines,
          profileCouplings: profileAdjustments.couplings,
          subject,
          physiology,
        },
      });
      this.busy = true;
      worker.postMessage(request);
    },
  },
});