import type { Signal } from '@/types/neurostate';
import { RAW_TARGETS } from './definitions';

// === Type Inference from Source of Truth ===

export type RegistryTargetKey = keyof typeof RAW_TARGETS;

export type ReceptorTarget = {
  [K in RegistryTargetKey]: typeof RAW_TARGETS[K]['category'] extends 'receptor' ? K : never;
}[RegistryTargetKey];

export type TransporterTarget = {
  [K in RegistryTargetKey]: typeof RAW_TARGETS[K]['category'] extends 'transporter' ? K : never;
}[RegistryTargetKey];

export type EnzymeTarget = {
  [K in RegistryTargetKey]: typeof RAW_TARGETS[K]['category'] extends 'enzyme' ? K : never;
}[RegistryTargetKey];

export type AuxiliaryTarget = {
  [K in RegistryTargetKey]: typeof RAW_TARGETS[K]['category'] extends 'auxiliary' ? K : never;
}[RegistryTargetKey];

/**
 * All valid pharmacological targets.
 * Can be a registry key or a direct signal.
 */
export type PharmacologicalTarget = RegistryTargetKey | Signal;

/** Mechanism of action */
export type PDMechanism = 'agonist' | 'antagonist' | 'PAM' | 'NAM';

// === Definition Interfaces ===

export type TargetCategory = 'receptor' | 'transporter' | 'enzyme' | 'auxiliary';

export interface BaseTargetDefinition {
  target: PharmacologicalTarget;
  category: TargetCategory;
  system: string;
  description: string;
}

/** Receptor definition with signal couplings */
export interface ReceptorDefinition extends BaseTargetDefinition {
  category: 'receptor';
  /** Signals affected by this receptor and their coupling polarity */
  couplings: Array<{
    signal: Signal;
    /** +1 = excitatory (agonist increases signal), -1 = inhibitory (agonist decreases signal) */
    sign: 1 | -1;
  }>;
  /** Receptor adaptation kinetics */
  adaptation?: {
    k_up: number;   // Upregulation rate
    k_down: number; // Downregulation rate
  };
}

/** Transporter definition */
export interface TransporterDefinition extends BaseTargetDefinition {
  category: 'transporter';
  /** Primary signal cleared by this transporter */
  primarySignal: Signal;
  /** Adaptation kinetics */
  adaptation?: {
    k_up: number;
    k_down: number;
  };
}

/** Enzyme definition */
export interface EnzymeDefinition extends BaseTargetDefinition {
  category: 'enzyme';
  /** Signals metabolized by this enzyme */
  substrates: Signal[];
  /** Baseline activity level */
  baselineActivity?: number;
}

/** Auxiliary variable definition (internal pools, etc.) */
export interface AuxiliaryTargetDefinition extends BaseTargetDefinition {
  category: 'auxiliary';
}

/** Union of all target definitions */
export type TargetDefinition =
  | ReceptorDefinition
  | TransporterDefinition
  | EnzymeDefinition
  | AuxiliaryTargetDefinition;
