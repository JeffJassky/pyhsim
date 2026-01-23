import type { Signal } from "../types";

export type TargetCategory =
  | "receptor"
  | "transporter"
  | "enzyme"
  | "auxiliary";

export interface BaseTargetDefinition {
  category: TargetCategory;
  system: string;
  description: string;
}

/** Receptor definition with signal couplings */
export interface ReceptorDefinition extends BaseTargetDefinition {
  category: "receptor";
  /** Signals affected by this receptor and their coupling polarity */
  couplings: Array<{
    signal: Signal;
    /** +1 = excitatory (agonist increases signal), -1 = inhibitory (agonist decreases signal) */
    sign: 1 | -1;
  }>;
  /** Receptor adaptation kinetics */
  adaptation?: {
    k_up: number; // Upregulation rate
    k_down: number; // Downregulation rate
  };
}

/** Transporter definition (e.g. reuptake pumps) */
export interface TransporterDefinition extends BaseTargetDefinition {
  category: "transporter";
  /** Primary signal cleared by this transporter */
  primarySignal: Signal;
  /** Adaptation kinetics */
  adaptation?: {
    k_up: number;
    k_down: number;
  };
}

/** Enzyme definition (metabolic breakdown) */
export interface EnzymeDefinition extends BaseTargetDefinition {
  category: "enzyme";
  /** Signals metabolized by this enzyme */
  substrates: Signal[];
  /** Baseline activity level */
  baselineActivity?: number;
}

/** Auxiliary variable definition (internal pools, etc.) */
export interface AuxiliaryTargetDefinition extends BaseTargetDefinition {
  category: "auxiliary";
}

/** Union of all pharmacological target definitions */
export type TargetDefinition =
  | ReceptorDefinition
  | TransporterDefinition
  | EnzymeDefinition
  | AuxiliaryTargetDefinition;
