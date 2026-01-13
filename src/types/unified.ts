import type { Signal, Subject, Physiology } from './neurostate';

export interface SolverDebugOptions {
  enableBaselines?: boolean;
  enableInterventions?: boolean;
  enableCouplings?: boolean;
  enableHomeostasis?: boolean;
  enableReceptors?: boolean;
  enableTransporters?: boolean;
  enableEnzymes?: boolean;
}

export interface DynamicsContext {
  minuteOfDay: number;      // 0..1439, Wall clock time
  circadianMinuteOfDay: number; // 0..1439, Biological time (aligned so ~7am is wake)
  dayOfYear: number;        // 1..366
  isAsleep: boolean;
  subject: Subject;
  physiology: Physiology;
}

export interface ProductionTerm {
  source: Signal | 'constant' | 'circadian';
  coefficient: number;
  transform?: (value: number, state: SimulationState, ctx: DynamicsContext) => number;
}

export type ClearanceType = 'linear' | 'saturable' | 'enzyme-dependent';

export interface ClearanceTerm {
  type: ClearanceType;
  rate: number;
  enzyme?: string;  // e.g., 'MAO_A', 'COMT', 'DAT'
  Km?: number;      // Michaelis constant for saturable kinetics
  transform?: (value: number, state: SimulationState, ctx: DynamicsContext) => number;
}

export interface DynamicCoupling {
  source: Signal;
  effect: 'stimulate' | 'inhibit';
  strength: number;
  delay?: number;  // Minutes
  saturation?: number;
}

export interface SignalDynamics {
  /** Baseline/setpoint (can be circadian) */
  setpoint: (ctx: DynamicsContext) => number;

  /** Time constant for return to setpoint (minutes). 
   * Higher = slower return to baseline. */
  tau: number;

  /** Production/synthesis terms */
  production: ProductionTerm[];

  /** Clearance/degradation terms */
  clearance: ClearanceTerm[];

  /** Coupling terms (how other signals affect this one) */
  couplings: DynamicCoupling[];
}

export interface UnifiedSignalDefinition {
  key: Signal;
  label: string;
  unit: string;
  dynamics: SignalDynamics;
  initialValue: number | ((ctx: { subject: Subject; physiology: Physiology; isAsleep: boolean }) => number);
  min?: number;
  max?: number;
  display: {
    color: string;
    referenceRange?: { min: number; max: number };
  };
  goals?: string[];
  isPremium?: boolean;
  group?: string;
  description?: {
    physiology: string;
    application: string;
  };
}

export interface AuxiliaryDefinition {
  key: string;
  dynamics: {
    setpoint: (ctx: DynamicsContext) => number;
    tau: number;
    production: ProductionTerm[];
    clearance: ClearanceTerm[];
  };
  initialValue: number | ((ctx: { subject: Subject; physiology: Physiology }) => number);
}

export interface SimulationState {
  /** All 50+ physiological signals */
  signals: Record<Signal, number>;

  /** Auxiliary state (enzymes, vesicles, etc.) */
  auxiliary: Record<string, number>;

  /** Receptor density/sensitivity states (e.g., 'D2_density', 'A2A_sensitivity') */
  receptors: Record<string, number>;

  /** Pharmacokinetic compartments for active interventions (e.g., 'caffeine_central') */
  pk: Record<string, number>;

  /** Accumulators for long-term tracking (stress load, debt) */
  accumulators: Record<string, number>;
}

export interface ActiveIntervention {
  id: string;
  key: string;             // Intervention library key (e.g., 'caffeine')
  startTime: number;       // absolute minute in simulation
  duration: number;        // minutes
  intensity: number;       // 0..1 scalar
  params: Record<string, any>;
  pharmacology?: any;      // Cloned from library for speed
}
