import { defineStore } from "pinia";
import type {
  EngineState,
  Minute,
  Signal,
  TimelineItem,
  WorkerComputeRequest,
  WorkerComputeResponse,
  HomeostasisStateSnapshot,
  HomeostasisSeries,
} from "@/types";
import { SIGNALS_ALL } from "@/types";
import { rangeMinutes, toMinuteOfDay } from "@/utils/time";
import { buildInterventionLibrary } from "@/models/registry/interventions";
import { buildProfileAdjustments } from "@/models/registry/profiles";
import { derivePhysiology } from "@/models/domain/subject";
import { useTimelineStore } from "./timeline";
import { useProfilesStore } from "./profiles";
import { buildWorkerRequest } from "@/core/serialization";

interface EngineStoreState extends EngineState {
  durationDays: number;
  busy: boolean;
  error?: string;
  debug: {
    enableBaselines: boolean;
    enableInterventions: boolean;
    enableCouplings: boolean;
    enableHomeostasis: boolean;
    enableReceptors: boolean;
    enableTransporters: boolean;
    enableEnzymes: boolean;
  };
  finalHomeostasisState?: HomeostasisStateSnapshot;
  homeostasisSeries?: HomeostasisSeries;
}

const defaultGridStep = 5;
const initialGrid = rangeMinutes(defaultGridStep, 2 * 24 * 60);

const createEmptySeries = (length: number): Record<Signal, Float32Array> => {
  return SIGNALS_ALL.reduce((acc, signal) => {
    acc[signal] = new Float32Array(length);
    return acc;
  }, {} as Record<Signal, Float32Array>);
};

let worker: Worker | null = null;

export const useEngineStore = defineStore("engine", {
  state: (): EngineStoreState => ({
    gridStepMin: defaultGridStep,
    gridMins: initialGrid,
    durationDays: 1,
    series: createEmptySeries(initialGrid.length),
    auxiliarySeries: {},
    busy: false,
    error: undefined,
    lastComputedAt: undefined,
    debug: {
      enableBaselines: true,
      enableInterventions: true,
      enableCouplings: true,
      enableHomeostasis: true,
      enableReceptors: true,
      enableTransporters: true,
      enableEnzymes: true,
    },
    finalHomeostasisState: undefined,
    homeostasisSeries: undefined,
  }),
  actions: {
    setGridStep(step: number) {
      this.gridStepMin = step;
      const totalMinutes = (this.durationDays + 1) * 24 * 60;
      this.gridMins = rangeMinutes(step, totalMinutes);
      this.series = createEmptySeries(this.gridMins.length);
      this.auxiliarySeries = {};
    },
    setDuration(days: number) {
      this.durationDays = days;
      const totalMinutes = (days + 1) * 24 * 60;
      this.gridMins = rangeMinutes(this.gridStepMin, totalMinutes);
      this.series = createEmptySeries(this.gridMins.length);
      this.auxiliarySeries = {};
      this.recompute();
    },
    updateDebug(flags: Partial<EngineStoreState["debug"]>) {
      this.debug = { ...this.debug, ...flags };
      // Trigger recompute immediately when debug flags change
      this.recompute();
    },
    async recompute(payload?: {
      items?: TimelineItem[];
      defs?: WorkerComputeRequest["defs"];
    }) {
      if (typeof Worker === "undefined") {
        this.error = "Web Workers are not supported in this environment";
        return;
      }
      if (!worker) {
        worker = new Worker(
          new URL("../workers/engine.worker.ts", import.meta.url),
          { type: "module" }
        );
        worker.onmessage = (event: MessageEvent<WorkerComputeResponse>) => {
          const {
            series,
            auxiliarySeries,
            finalHomeostasisState,
            homeostasisSeries,
          } = event.data;
          console.debug(
            "[EngineStore] Received series from worker. Keys:",
            Object.keys(series)
          );

          // Data validation check
          const sampleKey: Signal = "dopamine";
          if (series[sampleKey]) {
            const sample = series[sampleKey];
            let hasData = false;
            for (let i = 0; i < Math.min(10, sample.length); i++) {
              if (sample[i] !== 0) hasData = true;
            }
            if (!hasData) {
              console.warn(
                `[EngineStore] Warning: Sample signal '${sampleKey}' appears to be all zeros in first 10 samples.`
              );
            }
          }

          this.series = series;
          this.auxiliarySeries = auxiliarySeries;
          this.finalHomeostasisState = finalHomeostasisState;
          this.homeostasisSeries = homeostasisSeries;
          this.busy = false;
          this.lastComputedAt = Date.now();
        };
        worker.onerror = (event) => {
          console.error("[EngineStore] Worker Error:", event.message);
          this.error = event.message;
          this.busy = false;
        };
      }
      const timelineStore = useTimelineStore();
      const items = payload?.items ?? timelineStore.items;
      const clonedItems = JSON.parse(JSON.stringify(items));
      const gridCopy = [...this.gridMins] as Minute[];
      const sleepItem = items.find((item) => item.meta.key === "sleep");
      // Wake time is determined by when the sleep block ends
      const wakeOffsetMin = sleepItem
        ? toMinuteOfDay(sleepItem.end)
        : undefined;
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
      const profileAdjustments = buildProfileAdjustments(
        profilesStore.profiles
      );
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

      // Build intervention library with dynamic PK parameters based on subject/physiology
      const defs =
        payload?.defs ?? buildInterventionLibrary(subject, physiology);
      const clonedDefs = JSON.parse(JSON.stringify(defs));

      console.debug("[EngineStore] Posting request to worker...");

      const request = buildWorkerRequest(gridCopy, clonedItems, clonedDefs, {
        options: {
          wakeOffsetMin,
          sleepMinutes,
          profileCouplings: profileAdjustments.couplings,
          receptorDensities: profileAdjustments.receptorDensities,
          transporterActivities: profileAdjustments.transporterActivities,
          enzymeActivities: profileAdjustments.enzymeActivities,
          subject,
          physiology,
          debug: { ...this.debug },
        },
      });
      this.busy = true;
      worker.postMessage(request);
    },
  },
});
