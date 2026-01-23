import type {
  Signal,
  ResponseSpec,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
} from "../../engine";
import type { ReceptorKey, TransporterKey, EnzymeKey } from "../targets"; // Import directly from targets to break cycle

export type ConditionKey =
  | "adhd"
  | "autism"
  | "depression"
  | "anxiety"
  | "pots"
  | "mcas"
  | "insomnia"
  | "pcos";

export interface ConditionParam {
  key: string;
  label: string;
  type: "slider";
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface ReceptorModifier {
  receptor: ReceptorKey;
  paramKey?: string;
  density?: number;
  sensitivity?: number;
}

export interface TransporterModifier {
  transporter: TransporterKey;
  paramKey?: string;
  activity: number;
}

export interface EnzymeModifier {
  enzyme: EnzymeKey;
  paramKey?: string;
  activity: number;
}

export interface SignalModifier {
  key: Signal;
  paramKey?: string;
  baseline?: {
    amplitudeGain?: number;
    phaseShiftMin?: number;
  };
  couplingGains?: Partial<Record<Signal, number>>;
}

export interface ConditionDef {
  key: ConditionKey;
  label: string;
  description: {
    physiology: string;
    application: string;
    references?: string[];
  };
  params: ConditionParam[];
  receptorModifiers?: ReceptorModifier[];
  transporterModifiers?: TransporterModifier[];
  enzymeModifiers?: EnzymeModifier[];
  signalModifiers?: SignalModifier[];
}

export interface ConditionStateSnapshot {
  enabled: boolean;
  params: Record<string, number>;
}

export interface ConditionAdjustments {
  baselines: ProfileBaselineAdjustments;
  couplings: ProfileCouplingAdjustments;
  receptorDensities: Partial<Record<ReceptorKey, number>>;
  receptorSensitivities: Partial<Record<ReceptorKey, number>>;
  transporterActivities: Partial<Record<TransporterKey, number>>;
  enzymeActivities: Partial<Record<EnzymeKey, number>>;
}