import type { Signal } from '@/types/neurostate';
import type {
  ReceptorTarget,
  TransporterTarget,
  EnzymeTarget,
  PharmacologicalTarget,
  ReceptorDefinition,
  TransporterDefinition,
  EnzymeDefinition,
} from './types';

// === RECEPTORS ===
// Ported from getSignalTargets() in ode-solver.ts

export const RECEPTORS: Record<ReceptorTarget, ReceptorDefinition> = {
  // Dopamine receptors
  D1: {
    target: 'D1',
    category: 'receptor',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }],
    adaptation: { k_up: 0.0008, k_down: 0.0015 }
  },
  D2: {
    target: 'D2',
    category: 'receptor',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }],
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  D3: {
    target: 'D3',
    category: 'receptor',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }]
  },
  D4: {
    target: 'D4',
    category: 'receptor',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }]
  },
  D5: {
    target: 'D5',
    category: 'receptor',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }]
  },

  // Serotonin receptors
  '5HT1A': {
    target: '5HT1A',
    category: 'receptor',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT1B': {
    target: '5HT1B',
    category: 'receptor',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT2A': {
    target: '5HT2A',
    category: 'receptor',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT2C': {
    target: '5HT2C',
    category: 'receptor',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT3': {
    target: '5HT3',
    category: 'receptor',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },

  // GABA receptors
  GABA_A: {
    target: 'GABA_A',
    category: 'receptor',
    signalCouplings: [{ signal: 'gaba', sign: 1 }]
  },
  GABA_B: {
    target: 'GABA_B',
    category: 'receptor',
    signalCouplings: [{ signal: 'gaba', sign: 1 }]
  },

  // Glutamate receptors
  NMDA: {
    target: 'NMDA',
    category: 'receptor',
    signalCouplings: [{ signal: 'glutamate', sign: 1 }]
  },
  AMPA: {
    target: 'AMPA',
    category: 'receptor',
    signalCouplings: [{ signal: 'glutamate', sign: 1 }]
  },
  mGluR: {
    target: 'mGluR',
    category: 'receptor',
    signalCouplings: [{ signal: 'glutamate', sign: 1 }]
  },

  // Adrenergic receptors
  Alpha1: {
    target: 'Alpha1',
    category: 'receptor',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Alpha2: {
    target: 'Alpha2',
    category: 'receptor',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Beta1: {
    target: 'Beta1',
    category: 'receptor',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Beta2: {
    target: 'Beta2',
    category: 'receptor',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Beta_Adrenergic: {
    target: 'Beta_Adrenergic',
    category: 'receptor',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },

  // Histamine receptors
  H1: {
    target: 'H1',
    category: 'receptor',
    signalCouplings: [{ signal: 'histamine', sign: 1 }]
  },
  H2: {
    target: 'H2',
    category: 'receptor',
    signalCouplings: [{ signal: 'histamine', sign: 1 }]
  },
  H3: {
    target: 'H3',
    category: 'receptor',
    signalCouplings: [{ signal: 'histamine', sign: 1 }]
  },

  // Orexin receptors
  OX1R: {
    target: 'OX1R',
    category: 'receptor',
    signalCouplings: [{ signal: 'orexin', sign: 1 }]
  },
  OX2R: {
    target: 'OX2R',
    category: 'receptor',
    signalCouplings: [{ signal: 'orexin', sign: 1 }]
  },

  // Melatonin receptors
  MT1: {
    target: 'MT1',
    category: 'receptor',
    signalCouplings: [{ signal: 'melatonin', sign: 1 }]
  },
  MT2: {
    target: 'MT2',
    category: 'receptor',
    signalCouplings: [{ signal: 'melatonin', sign: 1 }]
  },

  // Adenosine receptors (inhibitory couplings)
  Adenosine_A1: {
    target: 'Adenosine_A1',
    category: 'receptor',
    signalCouplings: [
      { signal: 'dopamine', sign: -1 },
      { signal: 'acetylcholine', sign: -1 }
    ]
  },
  Adenosine_A2a: {
    target: 'Adenosine_A2a',
    category: 'receptor',
    signalCouplings: [{ signal: 'dopamine', sign: -1 }]
  },
  Adenosine_A2b: {
    target: 'Adenosine_A2b',
    category: 'receptor',
    signalCouplings: []
  },
  Adenosine_A3: {
    target: 'Adenosine_A3',
    category: 'receptor',
    signalCouplings: []
  },

  // Cholinergic receptors
  nAChR: {
    target: 'nAChR',
    category: 'receptor',
    signalCouplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
  mAChR_M1: {
    target: 'mAChR_M1',
    category: 'receptor',
    signalCouplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
  mAChR_M2: {
    target: 'mAChR_M2',
    category: 'receptor',
    signalCouplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
};

// === TRANSPORTERS ===

export const TRANSPORTERS: Record<TransporterTarget, TransporterDefinition> = {
  DAT: {
    target: 'DAT',
    category: 'transporter',
    primarySignal: 'dopamine',
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  NET: {
    target: 'NET',
    category: 'transporter',
    primarySignal: 'norepi',
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  SERT: {
    target: 'SERT',
    category: 'transporter',
    primarySignal: 'serotonin',
    adaptation: { k_up: 0.0008, k_down: 0.0015 }
  },
  GAT1: {
    target: 'GAT1',
    category: 'transporter',
    primarySignal: 'gaba'
  },
  GLT1: {
    target: 'GLT1',
    category: 'transporter',
    primarySignal: 'glutamate'
  }
};

// === ENZYMES ===

export const ENZYMES: Record<EnzymeTarget, EnzymeDefinition> = {
  MAO_A: {
    target: 'MAO_A',
    category: 'enzyme',
    substrates: ['serotonin', 'norepi', 'dopamine'],
    baselineActivity: 1.0
  },
  MAO_B: {
    target: 'MAO_B',
    category: 'enzyme',
    substrates: ['dopamine'],
    baselineActivity: 1.0
  },
  COMT: {
    target: 'COMT',
    category: 'enzyme',
    substrates: ['dopamine', 'norepi', 'adrenaline'],
    baselineActivity: 1.0
  },
  AChE: {
    target: 'AChE',
    category: 'enzyme',
    substrates: ['acetylcholine'],
    baselineActivity: 1.0
  },
  DAO: {
    target: 'DAO',
    category: 'enzyme',
    substrates: ['histamine'],
    baselineActivity: 1.0
  }
};

// === LOOKUP FUNCTIONS ===

const RECEPTOR_SET = new Set(Object.keys(RECEPTORS));
const TRANSPORTER_SET = new Set(Object.keys(TRANSPORTERS));
const ENZYME_SET = new Set(Object.keys(ENZYMES));

export function isReceptor(target: string): target is ReceptorTarget {
  return RECEPTOR_SET.has(target);
}

export function isTransporter(target: string): target is TransporterTarget {
  return TRANSPORTER_SET.has(target);
}

export function isEnzyme(target: string): target is EnzymeTarget {
  return ENZYME_SET.has(target);
}

export function isKnownTarget(target: string): boolean {
  return isReceptor(target) || isTransporter(target) || isEnzyme(target);
}

/**
 * Get all signals affected by a receptor target.
 * Returns empty array for transporters/enzymes (they work via clearance, not direct coupling).
 */
export function getReceptorSignals(target: string): Array<{ signal: Signal; sign: number }> {
  if (isReceptor(target)) {
    return RECEPTORS[target].signalCouplings;
  }
  return [];
}

/**
 * Get the primary signal for a transporter.
 */
export function getTransporterSignal(target: TransporterTarget): Signal {
  return TRANSPORTERS[target].primarySignal;
}

/**
 * Get all substrate signals for an enzyme.
 */
export function getEnzymeSubstrates(target: EnzymeTarget): Signal[] {
  return ENZYMES[target].substrates;
}

/**
 * Get all transporter keys (for auxiliary generation).
 */
export function getAllTransporterKeys(): TransporterTarget[] {
  return Object.keys(TRANSPORTERS) as TransporterTarget[];
}

/**
 * Get all enzyme keys (for auxiliary generation).
 */
export function getAllEnzymeKeys(): EnzymeTarget[] {
  return Object.keys(ENZYMES) as EnzymeTarget[];
}
