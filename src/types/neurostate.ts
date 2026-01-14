// types/neurostate.ts

import type { Physiology, Subject } from '@/models/domain/subject';
import type { PharmacologicalTarget, PDMechanism } from '@/models/physiology/pharmacology/types';
import type { PhysiologicalUnit } from './units';
export type { Physiology, Subject };

/* ===========================
   Core time + units
=========================== */

export type Minute = number & { readonly __brand: "Minute" }; // 0..1439
export type Hour = number & { readonly __brand: "Hour" };
export type Percent = number & { readonly __brand: "Percent" }; // 0..1

export type ISODateString = string; // for persisted scenarios
export type UUID = string;

/** 0..1-ish normalized signal value; allow >1 for spikes, negative for suppressors */
export type SignalValue = number;

/* ===========================
   Signals & Systems
=========================== */

export type NeuroSignal =
  | "dopamine"
  | "serotonin"
  | "norepi" // norepinephrine
  | "acetylcholine"
  | "gaba"
  | "melatonin"
  | "histamine"
  | "orexin"
  | "glutamate"
  | "endocannabinoid";

export type HormoneSignal =
  | "cortisol"
  | "adrenaline"
  | "insulin"
  | "glucagon"
  | "leptin"
  | "ghrelin"
  | "oxytocin"
  | "prolactin"
  | "vasopressin"
  | "vip"
  | "testosterone"
  | "estrogen"
  | "progesterone"
  | "lh"
  | "fsh"
  | "thyroid" // proxy (metabolic tone);
  | "growthHormone"
  | "glp1";

export type MetabolicProxy =
  | "glucose" // sim proxy
  | "energy" // composite
  | "vagal" // vagal tone proxy (HRV-derived if available)
  | "ketone"
  | "hrv"
  | "bloodPressure"
  | "oxygen"
  | "ethanol"
  | "acetaldehyde"
  | "inflammation"
  | "bdnf"
  | "magnesium"
  | "sensoryLoad"
  | "shbg"
  | "ferritin"
  | "dheas"
  | "alt"
  | "ast"
  | "egfr"
  | "vitaminD3"
  | "mtor"
  | "ampk";

export type Signal = NeuroSignal | HormoneSignal | MetabolicProxy;

export const SIGNALS_ALL: readonly Signal[] = [
  "dopamine",
  "serotonin",
  "norepi",
  "acetylcholine",
  "gaba",
  "melatonin",
  "histamine",
  "orexin",
  "glutamate",
  "endocannabinoid",
  "cortisol",
  "adrenaline",
  "insulin",
  "glucagon",
  "leptin",
  "ghrelin",
  "oxytocin",
  "prolactin",
  "vasopressin",
  "vip",
  "testosterone",
  "estrogen",
  "progesterone",
  "lh",
  "fsh",
  "thyroid",
  "growthHormone",
  "glp1",
  "glucose",
  "energy",
  "vagal",
  "ketone",
  "hrv",
  "bloodPressure",
  "ethanol",
  "acetaldehyde",
  "inflammation",
  "bdnf",
  "magnesium",
  "sensoryLoad",
  "shbg",
  "ferritin",
  "dheas",
  "alt",
  "ast",
  "egfr",
  "vitaminD3",
  "mtor",
  "ampk",
] as const;

/** A point-in-time vector for all (or some) signals */
export type SignalVector = Partial<Record<Signal, SignalValue>>;

/** Dense series for a day (same grid for all signals) */
export interface SignalSeries {
  gridStepMin: number; // e.g., 5
  grid: Minute[]; // length = 1440 / gridStepMin
  series: Record<Signal, Float32Array>; // each array length = grid.length
}

/* ===========================
   Baselines
=========================== */

export type BaselineFn = (minuteOfDay: Minute, ctx: BaselineContext) => SignalValue;

export type BaselineMap = Partial<Record<Signal, BaselineFn>>;

/* ===========================
   Interventions (Library)
=========================== */

export type ParamType = "slider" | "select" | "switch" | "number" | "text";

export interface ParamDefBase<K extends string = string> {
  key: K;
  label: string;
  type: ParamType;
  unit?: string;
  /** Show hints in UI (chips, helper text) */
  hint?: string;
}

export interface SliderParamDef<K extends string = string>
  extends ParamDefBase<K> {
  type: "slider";
  min: number;
  max: number;
  step?: number;
  default: number;
}

export interface SelectParamDef<K extends string = string>
  extends ParamDefBase<K> {
  type: "select";
  options: Array<{ value: string | number; label: string }>;
  default: string | number;
}

export interface SwitchParamDef<K extends string = string>
  extends ParamDefBase<K> {
  type: "switch";
  default: boolean | number; // 0/1 is fine too
}

export interface NumberParamDef<K extends string = string>
  extends ParamDefBase<K> {
  type: "number";
  default: number;
}

export interface TextParamDef<K extends string = string>
  extends ParamDefBase<K> {
  type: "text";
  default: string;
}

export type ParamDef =
  | SliderParamDef
  | SelectParamDef
  | SwitchParamDef
  | NumberParamDef
  | TextParamDef;

export type ParamValues = Record<string, number | string | boolean>;

export type InterventionKey =
  | "food"
  | "caffeine"
  | "walk"
  | "resistance"
  | "blueLight"
  | "sunlight"
  | "nap"
  | "sleep"
  | "sex"
  | "electrolytes"
  | "meditation"
  | "coldExposure"
  | "heatSauna"
  | "social"
  | "supplement"
  | (string & {}); // allow extensions

/**
 * Kernel function signature (Worker-side).
 * t: minutes since start (can be negative)
 * p: parameter bag (from ParamValues)
 * returns delta to *add* to signal baseline at that time
 */
export type KernelFn = (t: number, p: ParamValues) => number;

/**
 * To make kernels portable to the Worker without bundler coupling,
 * we store them as strings and reconstruct via new Function in the Worker.
 */
export type KernelFnString = string;

export interface KernelSpec {
  fn: KernelFnString;
  desc: string; // Human-readable explanation of the math/physiology
}

/** Signal-specific kernels for an intervention */
export type KernelSet = Partial<Record<Signal, KernelSpec>>;

/** Clearance specification for physiology-dependent PK */
export interface ClearanceSpec {
  /** Hepatic (liver) metabolism component */
  hepatic?: {
    baseCL_mL_min: number;  // Base clearance in mL/min for reference 70kg male
    CYP?: string;           // Primary CYP enzyme (e.g., "CYP1A2", "CYP3A4")
  };
  /** Renal (kidney) excretion component */
  renal?: {
    baseCL_mL_min: number;  // Base renal clearance in mL/min
  };
}

/** Volume of distribution specification for physiology-dependent PK */
export interface VolumeSpec {
  kind: "weight" | "tbw" | "lbm" | "sex-adjusted";
  base_L_kg?: number;       // For weight-based: Vd = base * weight
  fraction?: number;        // For tbw-based: Vd = TBW * fraction
  male_L_kg?: number;       // For sex-adjusted (male)
  female_L_kg?: number;     // For sex-adjusted (female)
}

/** Library item definition */
export interface PharmacologyDef {
  molecule: {
    name: string;
    molarMass: number; // g/mol
    pK_a?: number;
    logP?: number;
  };
  pk?: {
    model: "1-compartment" | "2-compartment" | "michaelis-menten" | "activity-dependent";
    bioavailability?: number; // 0..1
    absorptionRate?: number; // 1/min
    // Static parameters (fallback when physiology not available)
    halfLifeMin?: number;
    timeToPeakMin?: number;
    // Michaelis-Menten specific
    Vmax?: number; // mg/dL per minute
    Km?: number;   // mg/dL
    // Two-compartment model parameters
    /** Inter-compartmental transfer rate central→peripheral (1/min) */
    k_12?: number;
    /** Inter-compartmental transfer rate peripheral→central (1/min) */
    k_21?: number;
    /** Peripheral compartment volume (L/kg or L) */
    V_peripheral?: number;
    // Dynamic physiology-dependent parameters
    clearance?: ClearanceSpec;
    volume?: VolumeSpec;
  };
  pd?: Array<{
    target: PharmacologicalTarget; // e.g. "Adenosine_A2a", "DAT", or direct signal like "dopamine"
    mechanism: PDMechanism;
    Ki?: number; // nM
    EC50?: number; // nM
    effectGain?: number; // Mapping to engine units (e.g. 50.0)
    unit?: PhysiologicalUnit; // Explicit unit for validation and clarity
    /** Efficacy parameter (Black & Leff operational model)
     * - Full agonist: tau = 10 (default)
     * - Partial agonist: tau = 1-3
     * - Super agonist: tau > 10
     * Higher tau = approaches Emax at lower occupancy */
    tau?: number;
    /** Cooperativity factor for allosteric modulators (PAM/NAM)
     * Default: 3.0 for PAM, 0.3 for NAM */
    alpha?: number;
  }>;
}

export type DynamicPharmacologyFn = (params: ParamValues) => PharmacologyDef | PharmacologyDef[];

export interface InterventionDef {
  key: InterventionKey;
  label: string;
  color: string; // UI chip/bg color
  icon?: string; // emoji or icon key
  defaultDurationMin: number;
  params: ParamDef[];
  pharmacology: PharmacologyDef | DynamicPharmacologyFn; // Required in mechanistic foundation
  /** Optional grouping for UI (e.g., "Food", "Light", "Movement") */
  group?: string;
  /** Optional explainers for tooltips */
  notes?: string;
  /** Explicit categorization for UI filtering */
  categories?: string[];
  /** Goal-based tagging (e.g., "focus", "sleep") */
  goals?: string[];
}

/* ===========================
   Timeline items
=========================== */

export interface TimelineItemMeta {
  key: InterventionKey; // which library item
  params: ParamValues; // tuned per instance
  intensity: number; // 0..1
  locked?: boolean; // allow drag?
  labelOverride?: string; // custom text on bar
}

export interface TimelineItem {
  id: UUID;
  start: ISODateString; // full date-time for vis-timeline
  end: ISODateString;
  type: "range" | "point"; // most will be 'range'
  style?: string; // vis-timeline inline style (optional)
  content?: string; // text on the bar
  meta: TimelineItemMeta;
  group?: string | number;
}

/** Minimal runtime shape sent to worker (faster) */
export interface ItemForWorker {
  id: UUID;
  startMin: Minute; // minutes from 0:00 local day
  durationMin: number;
  meta: TimelineItemMeta;
  /** Pre-calculated pharmacology from the main thread (handles dynamic factories) */
  resolvedPharmacology?: PharmacologyDef[];
}

/* ===========================
   Worker bridge (messages)
=========================== */

export interface WorkerComputeRequest {
  gridMins: Minute[]; // sampling grid (e.g., every 5 min)
  items: ItemForWorker[]; // timeline activities
  defs: InterventionDef[]; // library (for kernels)
  baselines?: BaselineMapSerialized;
  /** Optional extra knobs the worker can use (e.g., user sensitivity) */
  options?: {
    clampMin?: number; // e.g., -1
    clampMax?: number; // e.g., 1.5
    includeSignals?: readonly Signal[]; // limit to speed up
    wakeOffsetMin?: Minute;
    sleepMinutes?: number;
    profileBaselines?: ProfileBaselineAdjustments;
    profileCouplings?: ProfileCouplingAdjustments;
    /** Receptor density adjustments from profiles (e.g., D2: -0.2 means 20% reduction) */
    receptorDensities?: Record<string, number>;
    /** Transporter activity adjustments from profiles (e.g., DAT: 0.4 means 40% increase) */
    transporterActivities?: Record<string, number>;
    /** Enzyme activity adjustments from profiles */
    enzymeActivities?: Record<string, number>;
    subject?: Subject;
    physiology?: Physiology;
    /** Enable ODE-based homeostatic feedback (glucose-insulin, sleep pressure, HPA) */
    enableHomeostasis?: boolean;
    /** Initial homeostasis state for multi-day simulations */
    initialHomeostasisState?: HomeostasisStateSnapshot;
    /** Debug flags for signal isolation */
    debug?: {
      enableBaselines?: boolean;
      enableInterventions?: boolean;
      enableCouplings?: boolean;
      enableHomeostasis?: boolean;
      enableReceptors?: boolean;
      enableTransporters?: boolean;
      enableEnzymes?: boolean;
    };
  };
}

export type BaselineMapSerialized = Partial<Record<Signal, string>>; // stringified fn bodies

export interface WorkerComputeResponse {
  series: Record<Signal, Float32Array>;
  auxiliarySeries: Record<string, Float32Array>;
  /** Final homeostasis state after simulation (for chaining multi-day scenarios) */
  finalHomeostasisState?: HomeostasisStateSnapshot;
  /** Time series of homeostasis state variables for visualization */
  homeostasisSeries?: HomeostasisSeries;
}

/* ===========================
   Organ heatmap
=========================== */

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

export type OrganWeights = Partial<Record<Signal, number>>;
export type OrganWeightMap = Record<OrganKey, OrganWeights>;

export interface OrganScoreVector {
  [organ: string]: number; // -1..1.2 diverging (cool→hot)
}

/* ===========================
   Polyvagal / Arousal model
=========================== */

export interface ArousalComponents {
  sympathetic: number; // 0..1
  parasympathetic: number; // 0..1 (vagal)
  overall: number; // derived 0..1 (e.g., softplus(symp - para))
  state: "ventral" | "mobilized" | "dorsal";
}

export type ArousalComponentKey = "sympathetic" | "parasympathetic" | "overall";

export interface ArousalWeights {
  sympathetic: Partial<Record<Signal, number>>; // e.g., cortisol + adrenaline + norepi - GABA
  parasympathetic: Partial<Record<Signal, number>>; // e.g., vagal + GABA - cortisol
}

/* ===========================
   Composite meters ("subjective")
=========================== */

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
  /** Weighted sum of signals to compute meter value (0..1 recommended) */
  weights: Partial<Record<Signal, number>>;
  /** Optional nonlinearity (applied post-sum) */
  nonlinearity?: "sigmoid" | "softplus" | "relu" | "tanh";
  /** Optional hint for UI grouping */
  group?: "Cognition" | "Affect" | "Arousal" | "Social" | "Sleep";
}

export type MeterMap = Record<MeterKey, MeterWeights>;

export interface MeterVector {
  [meter: string]: number; // 0..1 (or beyond if you prefer)
}

/* ===========================
   Homeostasis State Persistence
=========================== */

/**
 * Serializable snapshot of homeostasis state for persistence
 * This allows scenarios to save/restore the physiological state
 */
export interface HomeostasisStateSnapshot {
  // Glucose-Insulin Axis
  glucosePool: number;
  insulinPool: number;
  insulinAction: number;
  hepaticGlycogen: number;

  // Sleep Pressure
  adenosinePressure: number;

  // HPA Axis
  crhPool: number;
  cortisolPool: number;
  cortisolIntegral: number;
  adrenalineReserve: number;

  // Neurotransmitter Pools
  dopamineVesicles: number;
  norepinephrineVesicles: number;
  serotoninPrecursor: number;
  acetylcholineTone: number;
  gabaPool: number;
  glutamatePool: number;

  // Growth Factors
  bdnfExpression: number;
  ghReserve: number;

  // Modern Unified State (Supersedes above)
  signals?: Record<string, number>;
  auxiliary?: Record<string, number>;
  receptors?: Record<string, number>; // Renamed from receptorStates
  pk?: Record<string, number>;
  accumulators?: Record<string, number>;

  // Legacy (Keep for back-compat)
  receptorStates: Record<string, number>;
}

/**
 * Time series of homeostasis state variables across the simulation.
 * Each array has the same length as the signal grid.
 */
export interface HomeostasisSeries {
  // Glucose-Insulin Axis
  glucosePool: Float32Array;
  insulinPool: Float32Array;
  hepaticGlycogen: Float32Array;

  // Sleep Pressure
  adenosinePressure: Float32Array;

  // HPA Axis
  cortisolPool: Float32Array;
  cortisolIntegral: Float32Array;
  adrenalineReserve: Float32Array;

  // Neurotransmitter Pools
  dopamineVesicles: Float32Array;
  norepinephrineVesicles: Float32Array;
  serotoninPrecursor: Float32Array;
  acetylcholineTone: Float32Array;
  gabaPool: Float32Array;

  // Growth Factors
  bdnfExpression: Float32Array;
  ghReserve: Float32Array;
}

/* ===========================
   Scenarios & presets
=========================== */

export interface Scenario {
  id: UUID;
  name: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  gridStepMin: number; // e.g., 5
  items: TimelineItem[]; // full items
  /** Optional user personalizations */
  personal?: {
    signalSensitivities?: Partial<Record<Signal, number>>; // per-user gains
    organWeights?: Partial<OrganWeightMap>; // overrides
    meterWeights?: Partial<MeterMap>; // overrides
    arousal?: Partial<ArousalWeights>;
  };
  /** Freeform notes / markdown */
  notes?: string;
  /** Saved homeostasis state for multi-day scenarios */
  homeostasisState?: HomeostasisStateSnapshot;
}

/* ===========================
   Store / app state
=========================== */

export interface EngineState {
  gridStepMin: number;
  gridMins: Minute[];
  series: Record<Signal, Float32Array>; // last computed
  auxiliarySeries: Record<string, Float32Array>; // last computed aux
  lastComputedAt?: number;
}

export interface TimelineState {
  items: TimelineItem[];
  selectedId?: UUID;
  isDragging?: boolean;
}

export interface LibraryState {
  defs: InterventionDef[];
}

export interface HeatmapState {
  organWeights: OrganWeightMap;
  organScoresAtPlayhead: OrganScoreVector;
  organSeries: Record<OrganKey, Float32Array>;
  showSystems: { endocrine: boolean; autonomic: boolean; metabolic: boolean };
}

export interface ArousalState {
  weights: ArousalWeights;
  componentsAtPlayhead: ArousalComponents;
  series: Record<ArousalComponentKey, Float32Array>;
}

export interface MeterState {
  meters: MeterMap;
  valuesAtPlayhead: MeterVector;
  series: Record<MeterKey, Float32Array>;
}

export interface UIState {
  playheadMin: Minute;
  isScrubbing: boolean;
  zoomHours: number; // time zoom for timeline/charts
  theme: "light" | "dark";
  compareScenarioId?: UUID; // for A/B
  profileModalOpen: boolean;
  targetsModalOpen: boolean;
  tourActive: boolean;
  tourStep: number;
}

export interface AppState {
  engine: EngineState;
  timeline: TimelineState;
  library: LibraryState;
  heatmap: HeatmapState;
  arousal: ArousalState;
  meters: MeterState;
  ui: UIState;
  scenario?: Scenario;
}

/* ===========================
   Helpers for safe math / normalization
=========================== */

export type Clamp = (v: number, lo?: number, hi?: number) => number;
export type Lerp = (a: number, b: number, t: number) => number;

/** Mapping function used by charts/heatmap (e.g., -1..1.2 range) */
export interface DivergingScale {
  domain: [number, number]; // e.g., [-1, 1.2]
  /** returns 0..1 position; color lookup happens at UI layer */
  normalize: (v: number) => number;
}

/* ===========================
   Chart glue types
=========================== */

export type ChartSeriesKey = Signal | MeterKey | OrganKey | ArousalComponentKey;

export type SeriesTendency = "higher" | "lower" | "mid" | "neutral";

export interface ChartSeriesSpec {
  key: ChartSeriesKey;
  label: string;
  isPremium?: boolean;
  unit?: string;
  color?: string;
  tendency?: SeriesTendency;
  yMin?: number;
  yMax?: number;
  visible?: boolean;
  /** optional smoothing window in minutes */
  smoothMin?: number;
  info?: {
    physiology: string;
    application: string;
    couplings?: Array<{
      source: string;
      mapping: ResponseSpec;
      description: string;
    }>;
  };
}

export interface ChartViewModel {
  xLabels: string[]; // "08:00", "08:05", ...
  lines: Array<{ key: string; data: number[] }>;
}

/* ===========================
   Events / bus
=========================== */

export type EngineEvent =
  | { type: "recompute:request" }
  | { type: "recompute:done"; at: number }
  | { type: "timeline:changed"; ids: UUID[] }
  | { type: "playhead:moved"; minute: Minute }
  | { type: "item:selected"; id?: UUID }
  | { type: "scenario:loaded"; id: UUID };

/* ===========================
   Unified Signal Registry
=========================== */

export type SignalGroup =
  | "SCN"
  | "Neuro"
  | "Endocrine"
  | "Metabolic"
  | "Autonomic"
  | "Subjective"
  | "Organ";

export type Goal =
  | "energy"
  | "productivity"
  | "weightLoss"
  | "mood"
  | "focus"
  | "recovery"
  | "sleep"
  | "digestion"
  | "pain"
  | "cycle"
  | "calm"
  | "longevity";

export interface SignalDef {
  key: Signal;
  label: string;
  group: SignalGroup;
  isPremium: boolean;
  semantics: {
    unit: string; // "a.u." or "mg/dL", etc.
    // The engine runs in absolute units.
    // The UI can normalize using this range for "0..1" equivalent charts.
    referenceRange: {
      min: number; // e.g. 70 (mg/dL)
      max: number; // e.g. 140 (mg/dL)
    };
    normalized?: { mean: number; sd: number }; // Deprecated? Kept for legacy compat.
    isLatent?: boolean;
    observable?: {
      transform?:
        | "identity"
        | "log"
        | "logit"
        | "affine"
        | { kind: "custom"; expr: string };
      measurementNoise?: { kind: "gaussian" | "lognormal"; sd: number };
    };
  };
  description: {
    physiology: string;
    application: string;
    references?: Array<{ doi?: string; pmid?: string; note?: string }>;
  };
  display: {
    tendency: SeriesTendency;
    color?: string;
    chartOrder?: number;
    unitsOverride?: string;
  };
  baseline: BaselineSpec;
  kinetics?: {
    halfLifeMin?: number;
    elimination?:
      | { kind: "firstOrder"; kElim: number }
      | { kind: "michaelisMenten"; Vmax: number; Km: number }
      | { kind: "biexponential"; kFast: number; kSlow: number; fracFast: number };
    delay?: DelaySpec;
    sensitivity?: number;
    decayShape?: "exp" | "gamma" | "logistic" | "powerLaw";
    processNoise?: { kind: "OU" | "gaussian"; sigma: number; tauMin?: number };
  };
  couplings?: CouplingSpec[];
  constraints?: {
    min?: number;
    max?: number;
    saturation?: ResponseSpec;
    warningThresholds?: Array<{ value: number; message: string }>;
  };
  /** Goal-based tagging (e.g., "focus", "sleep") */
  goals?: Goal[];
  validation?: {
    expectedRange?: { min: number; max: number; context?: string };
    testIds?: string[];
    lastFit?: { dataset: string; rmse: number; date: string };
  };
  metadata?: {
    version: string;
    assumptions?: string[];
    population?: { sex?: "M" | "F" | "Other"; ageRange?: [number, number]; notes?: string };
  };
}

export type BaselineSpec =
  | { kind: "function"; fn: (minute: Minute, ctx: BaselineContext) => number }
  | { kind: "flat"; value: number }
  | {
      kind: "gaussianMix";
      terms: Array<{ centerHours: number; widthMin: number; gain: number }>;
    }
  | {
      kind: "fourier";
      periodMin: number;
      harmonics: Array<{ k: number; amp: number; phaseDeg: number }>;
    }
  | {
      kind: "pulseTrain";
      ratePerHour: number;
      refractoryMin?: number;
      jitterMin?: number;
      pulseShape: DelaySpec;
    }
  | {
      kind: "sigmoidCombo";
      riseHour: number;
      riseSlope: number;
      fallHour: number;
      fallSlope: number;
    }
  | { kind: "custom"; params: Record<string, number>; generator: (minute: Minute, params: any) => number };

export interface BaselineContext {
  chronotypeShiftMin?: number;
  amplitudeScale?: number;
  sleepDebt?: number;
  zeitgeber?: { lightLux?: number; meal?: boolean; exercise?: number };
  subject?: Subject;
  physiology?: Physiology;
}

export type DelaySpec =
  | { kind: "fixed"; minutes: number }
  | { kind: "gamma"; shape: number; scaleMin: number }
  | { kind: "normal"; meanMin: number; sdMin: number };

export type ResponseSpec =
  | { kind: "linear"; gain: number }
  | { kind: "hill"; Emax: number; EC50: number; n: number }
  | { kind: "ihill"; Imax: number; IC50: number; n: number }
  | { kind: "logistic"; L: number; k: number; x0: number };

export interface CouplingSpec {
  source: Signal;
  mapping: ResponseSpec;
  saturation?: ResponseSpec;
  delay?: DelaySpec;
  description: string;
  /** If true, the engine ignores this analytical coupling because it's handled by the ODE system. */
  isManagedByHomeostasis?: boolean;
}

export type CouplingMap = Partial<Record<Signal, CouplingSpec[]>>;

export type ProfileBaselineAdjustments = Partial<
  Record<Signal, { amplitude?: number; phaseShiftMin?: number }>
>;
export type ProfileCouplingAdjustments = Partial<Record<Signal, CouplingSpec[]>>;

/* ===========================
   Guards / predicates
=========================== */

export function isMinute(n: number): n is Minute {
  return Number.isFinite(n) && n >= 0 && n < 24 * 60;
}

export function ensureSignalVector(
  vals: Partial<Record<string, number>>
): SignalVector {
  const out: SignalVector = {};
  for (const s of SIGNALS_ALL) {
    const v = vals[s];
    if (typeof v === "number" && Number.isFinite(v)) out[s] = v;
  }
  return out;
}
