import type { Signal } from '@/types/neurostate';
import { SIGNAL_UNITS } from '@/models/engine/signal-units';
import type {
  ReceptorTarget,
  TransporterTarget,
  EnzymeTarget,
  AuxiliaryTarget,
  PharmacologicalTarget,
  ReceptorDefinition,
  TransporterDefinition,
  EnzymeDefinition,
  AuxiliaryTargetDefinition,
  TargetDefinition,
} from './types';

/**
 * MASTER TARGET REGISTRY
 * All pharmacological targets (receptors, transporters, enzymes, and auxiliary pools)
 * are defined here in a single unified list.
 */
export const TARGET_DEFINITIONS: TargetDefinition[] = [
  // === RECEPTORS: DOPAMINE ===
  {
    target: 'D1',
    category: 'receptor',
    description: 'Dopamine D1 receptor. Primarily excitatory; involved in cognitive function, motor control, and the reward system.',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }],
    adaptation: { k_up: 0.0008, k_down: 0.0015 }
  },
  {
    target: 'D2',
    category: 'receptor',
    description: 'Dopamine D2 receptor. Key target for antipsychotics; involved in reward, motivation, and movement.',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }],
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  {
    target: 'D3',
    category: 'receptor',
    description: 'Dopamine D3 receptor. Highly expressed in the limbic system; involved in emotional and cognitive functions.',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }]
  },
  {
    target: 'D4',
    category: 'receptor',
    description: 'Dopamine D4 receptor. Linked to executive function and attention; a target for some atypical antipsychotics.',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }]
  },
  {
    target: 'D5',
    category: 'receptor',
    description: 'Dopamine D5 receptor. Similar to D1; involved in high-level cognitive tasks and memory.',
    signalCouplings: [{ signal: 'dopamine', sign: 1 }]
  },

  // === RECEPTORS: SEROTONIN ===
  {
    target: '5HT1A',
    category: 'receptor',
    description: 'Serotonin 5-HT1A receptor. Major target for anxiolytics and antidepressants; regulates mood and anxiety.',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  {
    target: '5HT1B',
    category: 'receptor',
    description: 'Serotonin 5-HT1B receptor. Involved in vascular constriction and presynaptic inhibition of serotonin release.',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  {
    target: '5HT2A',
    category: 'receptor',
    description: 'Serotonin 5-HT2A receptor. Primary target of psychedelics; involved in cognitive processes and perception.',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  {
    target: '5HT2C',
    category: 'receptor',
    description: 'Serotonin 5-HT2C receptor. Involved in regulating mood, anxiety, feeding, and reproductive behavior.',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },
  {
    target: '5HT3',
    category: 'receptor',
    description: 'Serotonin 5-HT3 receptor. Only ionotropic serotonin receptor; involved in nausea and vomiting.',
    signalCouplings: [{ signal: 'serotonin', sign: 1 }]
  },

  // === RECEPTORS: GABA ===
  {
    target: 'GABA_A',
    category: 'receptor',
    description: 'GABA-A receptor. Fast-acting inhibitory channel; target for benzodiazepines and alcohol.',
    signalCouplings: [{ signal: 'gaba', sign: 1 }]
  },
  {
    target: 'GABA_B',
    category: 'receptor',
    description: 'GABA-B receptor. G-protein coupled inhibitory receptor; produces slower, prolonged inhibitory effects.',
    signalCouplings: [{ signal: 'gaba', sign: 1 }]
  },

  // === RECEPTORS: GLUTAMATE ===
  {
    target: 'NMDA',
    category: 'receptor',
    description: 'NMDA receptor. Key for synaptic plasticity and memory; allows calcium influx when activated.',
    signalCouplings: [{ signal: 'glutamate', sign: 1 }]
  },
  {
    target: 'AMPA',
    category: 'receptor',
    description: 'AMPA receptor. Mediates fast excitatory synaptic transmission in the central nervous system.',
    signalCouplings: [{ signal: 'glutamate', sign: 1 }]
  },
  {
    target: 'mGluR',
    category: 'receptor',
    description: 'Metabotropic glutamate receptors. Modulate the excitability of synapses and neurons.',
    signalCouplings: [{ signal: 'glutamate', sign: 1 }]
  },

  // === RECEPTORS: ADRENERGIC ===
  {
    target: 'Alpha1',
    category: 'receptor',
    description: 'Alpha-1 adrenergic receptor. Primarily involved in smooth muscle contraction and vasoconstriction.',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  {
    target: 'Alpha2',
    category: 'receptor',
    description: 'Alpha-2 adrenergic receptor. Often acts as a presynaptic autoreceptor to inhibit further release of norepinephrine.',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  {
    target: 'Beta1',
    category: 'receptor',
    description: 'Beta-1 adrenergic receptor. Predominantly in the heart; increases heart rate and contractility.',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  {
    target: 'Beta2',
    category: 'receptor',
    description: 'Beta-2 adrenergic receptor. Primarily in the lungs and blood vessels; causes bronchodilation and vasodilation.',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  {
    target: 'Beta_Adrenergic',
    category: 'receptor',
    description: 'General Beta-adrenergic receptors. Combined effects on cardiovascular and respiratory systems.',
    signalCouplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },

  // === RECEPTORS: HISTAMINE ===
  {
    target: 'H1',
    category: 'receptor',
    description: 'Histamine H1 receptor. Involved in arousal, the sleep-wake cycle, and allergic responses.',
    signalCouplings: [{ signal: 'histamine', sign: 1 }]
  },
  {
    target: 'H2',
    category: 'receptor',
    description: 'Histamine H2 receptor. Primarily involved in stimulating gastric acid secretion.',
    signalCouplings: [{ signal: 'histamine', sign: 1 }]
  },
  {
    target: 'H3',
    category: 'receptor',
    description: 'Histamine H3 receptor. Acts as an autoreceptor to regulate histamine release in the brain.',
    signalCouplings: [{ signal: 'histamine', sign: 1 }]
  },

  // === RECEPTORS: OREXIN ===
  {
    target: 'OX1R',
    category: 'receptor',
    description: 'Orexin-1 receptor. Involved in regulating wakefulness, energy homeostasis, and reward.',
    signalCouplings: [{ signal: 'orexin', sign: 1 }]
  },
  {
    target: 'OX2R',
    category: 'receptor',
    description: 'Orexin-2 receptor. Plays a critical role in the maintenance of wakefulness.',
    signalCouplings: [{ signal: 'orexin', sign: 1 }]
  },

  // === RECEPTORS: MELATONIN ===
  {
    target: 'MT1',
    category: 'receptor',
    description: 'Melatonin MT1 receptor. Primarily involved in the induction of sleep and regulation of circadian rhythms.',
    signalCouplings: [{ signal: 'melatonin', sign: 1 }]
  },
  {
    target: 'MT2',
    category: 'receptor',
    description: 'Melatonin MT2 receptor. Involved in the synchronization of the circadian clock to the light-dark cycle.',
    signalCouplings: [{ signal: 'melatonin', sign: 1 }]
  },

  // === RECEPTORS: ADENOSINE ===
  {
    target: 'Adenosine_A1',
    category: 'receptor',
    description: 'Adenosine A1 receptor. Inhibits neural activity and promotes sleep; target for caffeine antagonism.',
    signalCouplings: [
      { signal: 'dopamine', sign: -1 },
      { signal: 'acetylcholine', sign: -1 }
    ]
  },
  {
    target: 'Adenosine_A2a',
    category: 'receptor',
    description: 'Adenosine A2a receptor. High levels in the basal ganglia; regulates dopamine signaling and arousal.',
    signalCouplings: [{ signal: 'dopamine', sign: -1 }]
  },
  {
    target: 'Adenosine_A2b',
    category: 'receptor',
    description: 'Adenosine A2b receptor. Involved in inflammatory responses and vasodilation.',
    signalCouplings: []
  },
  {
    target: 'Adenosine_A3',
    category: 'receptor',
    description: 'Adenosine A3 receptor. Involved in immune modulation and protection against ischemia.',
    signalCouplings: []
  },

  // === RECEPTORS: CHOLINERGIC ===
  {
    target: 'nAChR',
    category: 'receptor',
    description: 'Nicotinic acetylcholine receptor. Fast-acting ion channel; involved in muscle contraction and cognitive processes.',
    signalCouplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
  {
    target: 'mAChR_M1',
    category: 'receptor',
    description: 'Muscarinic M1 receptor. G-protein coupled; heavily involved in memory, learning, and attention.',
    signalCouplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
  {
    target: 'mAChR_M2',
    category: 'receptor',
    description: 'Muscarinic M2 receptor. Predominantly in the heart; slows heart rate when activated.',
    signalCouplings: [{ signal: 'acetylcholine', sign: 1 }]
  },

  // === TRANSPORTERS ===
  {
    target: 'DAT',
    category: 'transporter',
    description: 'Dopamine Transporter. Responsible for the reuptake of dopamine from the synaptic cleft, terminating the signal.',
    primarySignal: 'dopamine',
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  {
    target: 'NET',
    category: 'transporter',
    description: 'Norepinephrine Transporter. Responsible for the reuptake of norepinephrine, regulating its synaptic concentration.',
    primarySignal: 'norepi',
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  {
    target: 'SERT',
    category: 'transporter',
    description: 'Serotonin Transporter. Responsible for the reuptake of serotonin; primary target for SSRI antidepressants.',
    primarySignal: 'serotonin',
    adaptation: { k_up: 0.0008, k_down: 0.0015 }
  },
  {
    target: 'GAT1',
    category: 'transporter',
    description: 'GABA Transporter 1. Responsible for the reuptake of GABA, the primary inhibitory neurotransmitter.',
    primarySignal: 'gaba'
  },
  {
    target: 'GLT1',
    category: 'transporter',
    description: 'Glutamate Transporter 1. Primarily responsible for removing glutamate from the synaptic cleft to prevent excitotoxicity.',
    primarySignal: 'glutamate'
  },

  // === ENZYMES ===
  {
    target: 'MAO_A',
    category: 'enzyme',
    description: 'Monoamine Oxidase A. Key enzyme for the metabolism of serotonin, norepinephrine, and dopamine.',
    substrates: ['serotonin', 'norepi', 'dopamine'],
    baselineActivity: 1.0
  },
  {
    target: 'MAO_B',
    category: 'enzyme',
    description: 'Monoamine Oxidase B. Primarily involved in the metabolism of dopamine in the central nervous system.',
    substrates: ['dopamine'],
    baselineActivity: 1.0
  },
  {
    target: 'COMT',
    category: 'enzyme',
    description: 'Catechol-O-methyltransferase. Enzyme that degrades catecholamines like dopamine, norepinephrine, and adrenaline.',
    substrates: ['dopamine', 'norepi', 'adrenaline'],
    baselineActivity: 1.0
  },
  {
    target: 'AChE',
    category: 'enzyme',
    description: 'Acetylcholinesterase. Enzyme that rapidly breaks down acetylcholine in the synaptic cleft to terminate signaling.',
    substrates: ['acetylcholine'],
    baselineActivity: 1.0
  },
  {
    target: 'DAO',
    category: 'enzyme',
    description: 'Diamine Oxidase. The primary enzyme responsible for the breakdown of extracellular histamine.',
    substrates: ['histamine'],
    baselineActivity: 1.0
  },

  // === AUXILIARY POOLS / INTERNAL VARIABLES ===
  {
    target: 'adenosinePressure',
    category: 'auxiliary',
    description: 'Homeostatic sleep pressure. Builds up during wakefulness and is cleared during sleep.'
  },
  {
    target: 'dopamineVesicles',
    category: 'auxiliary',
    description: 'The pool of ready-to-release dopamine in presynaptic neurons.'
  },
  {
    target: 'norepinephrineVesicles',
    category: 'auxiliary',
    description: 'The pool of ready-to-release norepinephrine in presynaptic neurons.'
  },
  {
    target: 'serotoninPrecursor',
    category: 'auxiliary',
    description: 'Availability of precursors like 5-HTP for serotonin synthesis.'
  },
  {
    target: 'gabaPool',
    category: 'auxiliary',
    description: 'The metabolic pool available for GABA synthesis and release.'
  },
  {
    target: 'glutamatePool',
    category: 'auxiliary',
    description: 'The metabolic pool available for glutamate synthesis and release.'
  },
  {
    target: 'hepaticGlycogen',
    category: 'auxiliary',
    description: 'Stored glucose in the liver, used to maintain blood sugar between meals.'
  },
  {
    target: 'insulinAction',
    category: 'auxiliary',
    description: 'The effectiveness of insulin at promoting glucose uptake in tissues.'
  },
  {
    target: 'cortisolIntegral',
    category: 'auxiliary',
    description: 'Total cumulative exposure to cortisol, a marker of long-term stress load.'
  },
  {
    target: 'crhPool',
    category: 'auxiliary',
    description: 'Corticotropin-releasing hormone pool, the top-level driver of the stress response.'
  },
  {
    target: 'ghReserve',
    category: 'auxiliary',
    description: 'The available pool of growth hormone ready for pulsatile release.'
  },
  {
    target: 'bdnfExpression',
    category: 'auxiliary',
    description: 'Rate of Brain-Derived Neurotrophic Factor production, supporting neuroplasticity.'
  }
];

/** Derived maps for O(1) lookups */
export const RECEPTORS: Record<ReceptorTarget, ReceptorDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'receptor').map(d => [d.target, d])) as any;

export const TRANSPORTERS: Record<TransporterTarget, TransporterDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'transporter').map(d => [d.target, d])) as any;

export const ENZYMES: Record<EnzymeTarget, EnzymeDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'enzyme').map(d => [d.target, d])) as any;

export const AUXILIARY: Record<AuxiliaryTarget, AuxiliaryTargetDefinition> = 
  Object.fromEntries(TARGET_DEFINITIONS.filter(d => d.category === 'auxiliary').map(d => [d.target, d])) as any;


// === LOOKUP FUNCTIONS ===

const RECEPTOR_SET = new Set(Object.keys(RECEPTORS));
const TRANSPORTER_SET = new Set(Object.keys(TRANSPORTERS));
const ENZYME_SET = new Set(Object.keys(ENZYMES));
const AUXILIARY_SET = new Set(Object.keys(AUXILIARY));

export function isReceptor(target: string): target is ReceptorTarget {
  return RECEPTOR_SET.has(target);
}

export function isTransporter(target: string): target is TransporterTarget {
  return TRANSPORTER_SET.has(target);
}

export function isEnzyme(target: string): target is EnzymeTarget {
  return ENZYME_SET.has(target);
}

export function isAuxiliary(target: string): target is AuxiliaryTarget {
  return AUXILIARY_SET.has(target);
}

export function isKnownTarget(target: string): boolean {
  return isReceptor(target) || isTransporter(target) || isEnzyme(target) || isAuxiliary(target);
}

/**
 * Global lookup for any pharmacological target description.
 */
export function getTargetDescription(target: PharmacologicalTarget): string {
  if (isReceptor(target)) return RECEPTORS[target].description;
  if (isTransporter(target)) return TRANSPORTERS[target].description;
  if (isEnzyme(target)) return ENZYMES[target].description;
  if (isAuxiliary(target)) return AUXILIARY[target].description;
  
  // Fallback to signal descriptions
  const signalDef = SIGNAL_UNITS[target as Signal];
  if (signalDef) return signalDef.description;

  return '';
}

/**
 * Global lookup for a clean human-readable label for any target.
 */
export function getTargetLabel(target: PharmacologicalTarget): string {
  if (isReceptor(target)) return `${target} Receptor`;
  if (isTransporter(target)) return `${target} Transporter`;
  if (isEnzyme(target)) return `${target} Enzyme`;
  if (isAuxiliary(target)) {
    // Convert camelCase to Title Case with spaces
    return target.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  const signalDef = SIGNAL_UNITS[target as Signal];
  if (signalDef) return signalDef.label;

  return target;
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