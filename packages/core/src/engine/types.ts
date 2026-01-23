// Pure Simulation Engine Types

export type Signal = string;

export interface SolverDebugOptions {
  enableBaselines?: boolean;
  enableInterventions?: boolean;
  enableCouplings?: boolean;
  enableHomeostasis?: boolean;
  enableReceptors?: boolean;
  enableTransporters?: boolean;
  enableEnzymes?: boolean;
  enableConditions?: boolean;
  receptorKeys?: string[];
}

/**
 * The environment passed to signal dynamics functions (setpoints, transforms).
 */
export interface DynamicsContext {
  minuteOfDay: number;
  circadianMinuteOfDay: number;
  dayOfYear: number;
  isAsleep: boolean;
  subject: any; // Domain-specific fields (age, sex, etc.)
  physiology: any; // Calculated fields (BMR, TBW, etc.)
}

export interface ProductionTerm {
  source: Signal | "constant" | "circadian";
  coefficient: number;
  transform?: (
    value: number,
    state: SimulationState,
    ctx: DynamicsContext,
  ) => number;
}

export type ClearanceType = "linear" | "saturable" | "enzyme-dependent";

export interface ClearanceTerm {
  type: ClearanceType;
  rate: number;
  enzyme?: string;
  Km?: number;
  transform?: (
    value: number,
    state: SimulationState,
    ctx: DynamicsContext,
  ) => number;
}

export interface DynamicCoupling {
  source: Signal;
  effect: "stimulate" | "inhibit";
  strength: number;
  delay?: number;
  saturation?: number;
}

export interface SignalDynamics {
  setpoint: (ctx: DynamicsContext) => number;
  tau: number;
  production: ProductionTerm[];
  clearance: ClearanceTerm[];
  couplings: DynamicCoupling[];
}

export type IdealTendency = "higher" | "lower" | "mid" | "none";

export interface SignalDefinition {
  key: Signal;
  label: string;
  unit: string;
  description: string;
  dynamics: SignalDynamics;
  initialValue:
    | number
    | ((ctx: { subject: any; physiology: any; isAsleep: boolean }) => number);
  min?: number;
  max?: number;
  idealTendency: IdealTendency;
  display: {
    referenceRange?: { min: number; max: number };
  };
  goals?: string[];
  isPremium?: boolean;
  group?: string;
}

export interface AuxiliaryDefinition {
  key: string;
  label?: string;
  dynamics: {
    setpoint: (ctx: DynamicsContext) => number;
    tau: number;
    production: ProductionTerm[];
    clearance: ClearanceTerm[];
  };
  initialValue: number | ((ctx: { subject: any; physiology: any }) => number);
}

export interface SimulationState {
  signals: Record<string, number>;
  auxiliary: Record<string, number>;
  receptors: Record<string, number>;
  pk: Record<string, number>;
  accumulators: Record<string, number>;
}

export interface ActiveIntervention {
  id: string;
  key: string;
  startTime: number;
  duration: number;
  intensity: number;
  params: Record<string, any>;
  pharmacology?: any;
}

export type Minute = number;
export type UUID = string;

export interface WorkerComputeRequest {
  gridMins: Minute[];
  items: any[];
  defs: any[];
  options?: any;
}

export interface WorkerComputeResponse {
  series: Record<Signal, Float32Array>;
  auxiliarySeries: Record<string, Float32Array>;
  finalHomeostasisState: any;
  homeostasisSeries: any;
  computeTimeMs?: number;
}

// --- Pharmacology (PK/PD) ---
export type PDMechanism = "agonist" | "antagonist" | "PAM" | "NAM";
export type PharmacologicalTarget = string;

export interface PharmacologyDef {
  molecule: {
    name: string;
    molarMass: number;
    pK_a?: number;
    logP?: number;
  };
  pk?: any;
  pd?: Array<{
    target: PharmacologicalTarget;
    unit?: string;
    mechanism: PDMechanism;
    Ki?: number;
    EC50?: number;
    intrinsicEfficacy?: number;
    tau?: number;
    alpha?: number;
    description?: string;
  }>;
}

export interface ResponseSpec {
  kind: "linear" | "hill" | "ihill" | "logistic";
  gain?: number;
  Emax?: number;
  EC50?: number;
  Imax?: number;
  IC50?: number;
  n?: number;
  L?: number;
  k?: number;
  x0?: number;
}

export interface CouplingSpec {
  source: Signal;
  mapping: ResponseSpec;
  saturation?: ResponseSpec;
  delay?: any;
  description: string;
  isManagedByHomeostasis?: boolean;
}

export type ProfileBaselineAdjustments = Partial<
  Record<Signal, { amplitude?: number; phaseShiftMin?: number }>
>;
export type ProfileCouplingAdjustments = Partial<
  Record<Signal, CouplingSpec[]>
>;

/**
 * Shared container for worker items.
 */
export interface ItemForWorker {
  id: UUID;
  startMin: Minute;
  durationMin: number;
  meta: any;
  resolvedPharmacology?: PharmacologyDef[];
}

export type ConcentrationUnit =
  | "mg/dL" // Glucose, ethanol
  | "g/dL" // High ethanol
  | "µg/dL" // Cortisol, zinc, copper, iron
  | "ng/dL" // Testosterone
  | "ng/mL" // Leptin, BDNF, growth hormone, folate
  | "pg/mL" // Catecholamines, melatonin, orexin, B12
  | "µIU/mL" // Insulin
  | "pmol/L" // GLP-1, thyroid
  | "nmol/L" // SHBG
  | "nM" // Synaptic neurotransmitters
  | "µM" // Glutamate (extracellular)
  | "IU/L" // LH, FSH
  | "U/L" // Enzymes (ALT, AST)
  | "mmol/L" // Ketones, electrolytes
  | "µg/L" // Selenium
  | "µmol/L"; // Choline

export type RateUnit = "mL/min/1.73m²"; // eGFR

export type WeightUnit = "mcg" | "mg" | "g" | "kg" | "g" | "oz" | "lb" | "µg";
export type TemperatureUnit = "°C" | "°F";
export type VolumeUnit = "ml" | "L" | "floz" | "cup" | "pint" | "qt" | "gal";

export type TimeUnit = "ms" | "sec" | "min" | "hr";
export type PressureUnit = "mmHg";
export type RatioUnit = "fold-change" | "ratio" | "relative" | "a.u.";
export type CompositeUnit = "index" | "units" | "IU" | "servings" | "x"; // Explicitly marks as computed index, not a measurement
export type PercentUnit = "% baseline" | "%"; // For legacy/transitional support

export type PhysiologicalUnit =
  | ConcentrationUnit
  | RateUnit
  | TimeUnit
  | PressureUnit
  | RatioUnit
  | CompositeUnit
  | PercentUnit
  | WeightUnit;

export type ParameterUnit =
  | WeightUnit
  | CompositeUnit
  | TemperatureUnit
  | VolumeUnit;
