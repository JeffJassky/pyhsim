import type {
  UUID,
  Minute,
  Signal,
  ResponseSpec,
  PharmacologyDef,
} from "./engine";

// --- Subject & Profile ---
export * from "./endogenous/subject/types";

// --- Interventions & Parameters ---
export type ParamType = "slider" | "select" | "switch" | "number" | "text";

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  unit: string;
  hint?: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: any[];
}

export interface InterventionDef {
  key: string;
  label: string;
  icon?: string;
  defaultDurationMin: number;
  params: ParamDef[];
  pharmacology:
    | PharmacologyDef
    | ((params: any) => PharmacologyDef | PharmacologyDef[]);
  group?: string;
  notes?: string;
  categories?: string[];
  goals?: string[];
}

export type Goal = string;
export type InterventionKey = string;

// --- Timeline & Scenarios ---
export type ParamValues = Record<string, number | string | boolean>;

export interface TimelineItemMeta {
  key: string;
  params: ParamValues;
  intensity: number;
  locked?: boolean;
  disabled?: boolean;
  labelOverride?: string;
  notes?: string;
}

export interface TimelineItem {
  id: UUID;
  start: string;
  end: string;
  type: "range" | "point";
  style?: string;
  content?: string;
  meta: TimelineItemMeta;
  group?: string | number;
}

export interface Scenario {
  id: UUID;
  name: string;
  createdAt: string;
  updatedAt: string;
  gridStepMin: number;
  items: TimelineItem[];
  personal?: any;
  notes?: string;
  homeostasisState?: HomeostasisStateSnapshot;
}

export interface HomeostasisStateSnapshot {
  signals?: Record<string, number>;
  auxiliary?: Record<string, number>;
  receptors?: Record<string, number>;
  pk?: Record<string, number>;
  accumulators?: Record<string, number>;
  [key: string]: any;
}

export interface HomeostasisSeries {
  [key: string]: Float32Array;
}

// --- UI Interpretation (Heatmap & Meters) ---
export type OrganKey =
  | "brain"
  | "eyes"
  | "heart"
  | "lungs"
  | "liver"
  | "pancreas"
  | "stomach"
  | "si"
  | "colon"
  | "adrenals"
  | "thyroid"
  | "muscle"
  | "adipose"
  | "skin";

export type OrganScoreVector = Record<string, number>;
export type OrganWeightMap = Record<OrganKey, Record<string, number>>;

export type MeterKey =
  | "energy"
  | "focus"
  | "calm"
  | "mood"
  | "social"
  | "overwhelm"
  | "sleepPressure";

export interface MeterWeights {
  label: string;
  weights: Record<string, number>;
  nonlinearity?: "sigmoid" | "softplus" | "relu" | "tanh";
  group?: string;
}

export type MeterMap = Record<MeterKey, MeterWeights>;
export type MeterVector = Record<string, number>;

export interface ArousalComponents {
  sympathetic: number;
  parasympathetic: number;
  overall: number;
  state: "ventral" | "mobilized" | "dorsal";
}

export type ArousalComponentKey = "sympathetic" | "parasympathetic" | "overall";

export interface ArousalWeights {
  sympathetic: Record<string, number>;
  parasympathetic: Record<string, number>;
}

export interface TrackedNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MacroRange {
  min: number;
  max: number;
}

export interface MacroTargets {
  carbs: MacroRange;
  fat: MacroRange;
  protein: MacroRange;
}

export interface LogTargets {
  calories: number;
  macrosEnabled: boolean;
  macros: MacroTargets;
}
