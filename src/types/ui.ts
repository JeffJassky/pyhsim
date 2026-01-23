import type { 
  Signal, 
  Minute, 
  UUID, 
  IdealTendency, 
  ResponseSpec 
} from "@physim/core";

import type {
  OrganKey,
  OrganScoreVector,
  OrganWeightMap,
  MeterKey,
  MeterMap,
  MeterVector,
  ArousalComponents,
  ArousalComponentKey,
  ArousalWeights
} from "@physim/core";

export interface EngineState {
  gridStepMin: number;
  gridMins: Minute[];
  series: Record<Signal, Float32Array>;
  auxiliarySeries: Record<string, Float32Array>;
  lastComputedAt?: number;
}

export interface UIState {
  playheadMin: Minute;
  isScrubbing: boolean;
  zoomHours: number;
  theme: "light" | "dark" | "system";
  compareScenarioId?: UUID;
  profileModalOpen: boolean;
  targetsModalOpen: boolean;
  tourActive: boolean;
  tourStep: number;
  panelSizes: any;
}

export interface PanelSizes {
  timeline: number;
  charts: number;
  chatWidth: number;
}

export interface ChartSeriesSpec {
  key: string;
  label: string;
  unit?: string;
  color?: string;
  yMin?: number;
  yMax?: number;
  idealTendency?: IdealTendency;
  isPremium?: boolean;
  info?: {
    description?: string;
    physiology?: string;
    application?: string;
    couplings?: Array<{
      source: string;
      mapping: ResponseSpec;
      description: string;
    }>;
  };
}

export interface SliderParamDef {
  type: "slider";
  min: number;
  max: number;
  step?: number;
}

export interface SelectParamDef {
  type: "select";
  options: Array<{ label: string; value: any }>;
}

export interface DivergingScale {
  domain: [number, number];
  normalize: (value: number) => number;
}

export interface HeatmapState {
  organWeights: OrganWeightMap;
  organScoresAtPlayhead: OrganScoreVector;
  organSeries: Record<OrganKey, Float32Array>;
  showSystems: { endocrine: boolean; autonomic: boolean; metabolic: boolean };
}

export interface MeterState {
  meters: MeterMap;
  valuesAtPlayhead: MeterVector;
  series: Record<MeterKey, Float32Array>;
}

export interface ArousalState {
  weights: ArousalWeights;
  componentsAtPlayhead: ArousalComponents;
  series: Record<ArousalComponentKey, Float32Array>;
}