import type { Signal } from '@/types/neurostate';

// === Receptor Target Types ===

/** Dopamine receptor subtypes */
export type DopamineReceptor = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';

/** Serotonin receptor subtypes */
export type SerotoninReceptor = '5HT1A' | '5HT1B' | '5HT2A' | '5HT2C' | '5HT3';

/** GABA receptor subtypes */
export type GABAReceptor = 'GABA_A' | 'GABA_B';

/** Glutamate receptor subtypes */
export type GlutamateReceptor = 'NMDA' | 'AMPA' | 'mGluR';

/** Adrenergic receptor subtypes */
export type AdrenergicReceptor = 'Alpha1' | 'Alpha2' | 'Beta1' | 'Beta2' | 'Beta_Adrenergic';

/** Histamine receptor subtypes */
export type HistamineReceptor = 'H1' | 'H2' | 'H3';

/** Orexin receptor subtypes */
export type OrexinReceptor = 'OX1R' | 'OX2R';

/** Melatonin receptor subtypes */
export type MelatoninReceptor = 'MT1' | 'MT2';

/** Adenosine receptor subtypes */
export type AdenosineReceptor = 'Adenosine_A1' | 'Adenosine_A2a' | 'Adenosine_A2b' | 'Adenosine_A3';

/** Cholinergic receptor subtypes */
export type CholinergicReceptor = 'nAChR' | 'mAChR_M1' | 'mAChR_M2';

/** All receptor targets */
export type ReceptorTarget =
  | DopamineReceptor
  | SerotoninReceptor
  | GABAReceptor
  | GlutamateReceptor
  | AdrenergicReceptor
  | HistamineReceptor
  | OrexinReceptor
  | MelatoninReceptor
  | AdenosineReceptor
  | CholinergicReceptor;

// === Transporter Target Types ===

/** Monoamine transporters */
export type TransporterTarget =
  | 'DAT'   // Dopamine transporter
  | 'NET'   // Norepinephrine transporter
  | 'SERT'  // Serotonin transporter
  | 'GAT1'  // GABA transporter
  | 'GLT1'; // Glutamate transporter

// === Enzyme Target Types ===

/** Metabolic enzymes */
export type EnzymeTarget =
  | 'MAO_A'  // Monoamine oxidase A
  | 'MAO_B'  // Monoamine oxidase B
  | 'COMT'   // Catechol-O-methyltransferase
  | 'AChE'   // Acetylcholinesterase
  | 'DAO';   // Diamine oxidase (histamine)

// === Auxiliary Target Types ===

/** Auxiliary variables that can be targeted by interventions */
export type AuxiliaryTarget =
  | 'adenosinePressure'
  | 'dopamineVesicles'
  | 'norepinephrineVesicles'
  | 'serotoninPrecursor'
  | 'gabaPool'
  | 'glutamatePool'
  | 'hepaticGlycogen'
  | 'insulinAction'
  | 'cortisolIntegral'
  | 'crhPool'
  | 'ghReserve'
  | 'bdnfExpression';

// === Combined Target Type ===

/**
 * All valid pharmacological targets.
 * Can be a receptor, transporter, enzyme, auxiliary, or direct signal.
 */
export type PharmacologicalTarget = ReceptorTarget | TransporterTarget | EnzymeTarget | AuxiliaryTarget | Signal;

/** Mechanism of action */
export type PDMechanism = 'agonist' | 'antagonist' | 'PAM' | 'NAM';

// === Definition Interfaces ===

/** Receptor definition with signal couplings */
export interface ReceptorDefinition {
  target: ReceptorTarget;
  category: 'receptor';
  /** Signals affected by this receptor and their coupling polarity */
  signalCouplings: Array<{
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
export interface TransporterDefinition {
  target: TransporterTarget;
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
export interface EnzymeDefinition {
  target: EnzymeTarget;
  category: 'enzyme';
  /** Signals metabolized by this enzyme */
  substrates: Signal[];
  /** Baseline activity level */
  baselineActivity?: number;
}

/** Union of all target definitions */
export type TargetDefinition = ReceptorDefinition | TransporterDefinition | EnzymeDefinition;
