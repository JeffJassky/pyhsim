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
import { SIGNALS_ALL } from "@physim/core";
import { rangeMinutes, toMinuteOfDay } from "@/utils/time";
import { buildInterventionLibrary } from "@physim/core";
import { buildConditionAdjustments } from "@physim/core";
import { derivePhysiology } from "@physim/core";
import { useTimelineStore } from "./timeline";
import { useUserStore } from "./user";
import { buildWorkerRequest } from "@/core/serialization";

interface EngineStoreState extends EngineState {
  durationDays: number;
  busy: boolean;
  error?: string;
  computeTimeMs?: number;
  debug: {
    enableBaselines: boolean;
    enableInterventions: boolean;
    enableCouplings: boolean;
    enableHomeostasis: boolean;
    enableReceptors: boolean;
    enableTransporters: boolean;
    enableEnzymes: boolean;
    enableConditions: boolean;
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
      enableConditions: true,
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
            computeTimeMs,
          } = event.data;
          console.debug(
            "[EngineStore] Received series from worker. Keys:",
            Object.keys(series),
            "Time:",
            computeTimeMs
          );

          // ... (validation check remains) ...

          this.series = series as Record<Signal, Float32Array>;
          this.auxiliarySeries = auxiliarySeries;
          this.finalHomeostasisState = finalHomeostasisState;
          this.homeostasisSeries = homeostasisSeries;
          this.computeTimeMs = computeTimeMs;
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
      const rawItems = payload?.items ?? timelineStore.items;
      const items = rawItems.filter(item => !item.meta.disabled);
      
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
      const userStore = useUserStore();
      const conditionAdjustments = buildConditionAdjustments(
        userStore.conditions
      );
      // Ensure subject is a plain object by explicit construction
      const s = userStore.subject;
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
      
      // We still send clonedDefs for other metadata (labels, colors), but Worker will rely on resolvedPharmacology
      const clonedDefs = JSON.parse(JSON.stringify(defs));

      console.debug("[EngineStore] Posting request to worker...");

      // Build the base worker request which handles time conversion (startMin, durationMin)
      const baseRequest = buildWorkerRequest(gridCopy, items, clonedDefs, {
        options: {
          wakeOffsetMin,
          sleepMinutes,
          conditionCouplings: conditionAdjustments.couplings,
          conditionBaselines: conditionAdjustments.baselines,
          receptorDensities: conditionAdjustments.receptorDensities,
          receptorSensitivities: conditionAdjustments.receptorSensitivities,
          transporterActivities: conditionAdjustments.transporterActivities,
          enzymeActivities: conditionAdjustments.enzymeActivities,
          subject,
          physiology,
          debug: { ...this.debug },
        },
      });

      // Resolve dynamic pharmacology for each item
      baseRequest.items.forEach(item => {
        const def = defs.find(d => d.key === item.meta.key);
        let resolvedPharm: any[] = [];
        
        if (def) {
          if (typeof def.pharmacology === 'function') {
            try {
              const result = (def.pharmacology as any)(item.meta.params || {});
              resolvedPharm = Array.isArray(result) ? result : [result];
            } catch (e) {
              console.error(`[EngineStore] Failed to resolve pharmacology for ${item.meta.key}:`, e);
            }
          } else if (def.pharmacology) {
             resolvedPharm = [def.pharmacology];
          }
        }
        
        item.resolvedPharmacology = resolvedPharm;
      });

      // Crucial: Ensure the entire request is serializable (removes any accidental functions)
      const request = JSON.parse(JSON.stringify(baseRequest));

      this.busy = true;
      worker.postMessage(request);
    },
  },
});
