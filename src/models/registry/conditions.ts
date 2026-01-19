/**
 * Neurophysiological Conditions Module
 *
 * Models individual differences in neurobiology at the RECEPTOR and TRANSPORTER level,
 * rather than using phenomenological amplitude adjustments.
 *
 * Key Concepts:
 * - Receptor density (Bmax): Number of available receptors
 * - Transporter function: Reuptake efficiency (DAT, NET, SERT)
 * - Enzyme activity: Degradation rates (MAO, COMT)
 * - Coupling efficiency: Signal transduction strength
 */

import type {
  CouplingSpec,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
  ResponseSpec,
  Signal,
} from '@/types';

// --- Receptor & Transporter Definitions ---

export type ReceptorKey =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5'           // Dopamine receptors
  | '5HT1A' | '5HT2A' | '5HT2C' | '5HT3'       // Serotonin receptors
  | 'GABA_A' | 'GABA_B'                        // GABA receptors
  | 'NMDA' | 'AMPA' | 'mGluR'                  // Glutamate receptors
  | 'Alpha1' | 'Alpha2' | 'Beta1' | 'Beta2'   // Adrenergic receptors
  | 'M1' | 'M2' | 'M3' | 'M4'                 // Muscarinic receptors
  | 'H1' | 'H3'                                // Histamine receptors
  | 'OX1R' | 'OX2R'                            // Orexin receptors
  | 'OXTR'                                     // Oxytocin receptor
  | 'MT1' | 'MT2';                             // Melatonin receptors

export type TransporterKey =
  | 'DAT'   // Dopamine transporter
  | 'NET'   // Norepinephrine transporter
  | 'SERT'  // Serotonin transporter
  | 'GAT1'  // GABA transporter
  | 'GLT1'; // Glutamate transporter

export type EnzymeKey =
  | 'MAO_A' | 'MAO_B'  // Monoamine oxidases
  | 'COMT'             // Catechol-O-methyltransferase
  | 'AChE'             // Acetylcholinesterase
  | 'DAO';             // Diamine oxidase (histamine metabolism)

// --- Condition Types ---

export type ConditionKey = 'adhd' | 'autism' | 'depression' | 'anxiety' | 'pots' | 'mcas' | 'insomnia' | 'pcos';

export interface ConditionParam {
  key: string;
  label: string;
  type: 'slider';
  min: number;
  max: number;
  step: number;
  default: number;
}

/**
 * Receptor-level modification
 *
 * density: Relative receptor density (1.0 = normal, <1 = downregulated, >1 = upregulated)
 * sensitivity: Receptor coupling efficiency (affects signal transduction gain)
 */
export interface ReceptorModifier {
  receptor: ReceptorKey;
  paramKey?: string;
  density?: number;      // Delta relative to 1.0 (e.g., -0.2 = 20% reduction)
  sensitivity?: number;  // Delta relative to 1.0
}

/**
 * Transporter-level modification
 *
 * activity: Transporter function (1.0 = normal, >1 = faster clearance, <1 = slower)
 * Affects synaptic concentration of the transported molecule
 */
export interface TransporterModifier {
  transporter: TransporterKey;
  paramKey?: string;
  activity: number;  // Delta relative to 1.0
}

/**
 * Enzyme-level modification
 */
export interface EnzymeModifier {
  enzyme: EnzymeKey;
  paramKey?: string;
  activity: number;  // Delta relative to 1.0
}

/**
 * Signal effect derived from receptor/transporter changes
 */
export interface DerivedSignalEffect {
  signal: Signal;
  mechanism: string;  // Human-readable explanation
  amplitudeGain?: number;
  phaseShiftMin?: number;
}

/**
 * Coupling effect derived from receptor/transporter changes
 */
export interface DerivedCouplingEffect {
  target: Signal;
  source: Signal;
  gain: number;
  mechanism: string;
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

  // Mechanistic modifiers (new approach)
  receptorModifiers?: ReceptorModifier[];
  transporterModifiers?: TransporterModifier[];
  enzymeModifiers?: EnzymeModifier[];

  // Legacy signal modifiers (for backward compatibility during transition)
  signalModifiers?: SignalModifier[];
}

// Legacy interface for backward compatibility
export interface SignalModifier {
  key: Signal;
  paramKey?: string;
  baseline?: {
    amplitudeGain?: number;
    phaseShiftMin?: number;
  };
  couplingGains?: Partial<Record<Signal, number>>;
}

// --- Receptor → Signal Mapping ---

/**
 * Maps receptor changes to downstream signal effects
 */
export const RECEPTOR_SIGNAL_MAP: Record<ReceptorKey, { signal: Signal; gainPerDensity: number }[]> = {
  D1: [{ signal: 'dopamine', gainPerDensity: 0.15 }],
  D2: [{ signal: 'dopamine', gainPerDensity: 0.25 }],  // D2 is major postsynaptic receptor
  D3: [{ signal: 'dopamine', gainPerDensity: 0.05 }],
  D4: [{ signal: 'dopamine', gainPerDensity: 0.03 }],
  D5: [{ signal: 'dopamine', gainPerDensity: 0.02 }],

  '5HT1A': [{ signal: 'serotonin', gainPerDensity: 0.2 }, { signal: 'gaba', gainPerDensity: 0.1 }],
  '5HT2A': [{ signal: 'serotonin', gainPerDensity: 0.15 }, { signal: 'glutamate', gainPerDensity: 0.1 }],
  '5HT2C': [{ signal: 'serotonin', gainPerDensity: 0.1 }],
  '5HT3': [{ signal: 'serotonin', gainPerDensity: 0.05 }],

  GABA_A: [{ signal: 'gaba', gainPerDensity: 0.35 }],
  GABA_B: [{ signal: 'gaba', gainPerDensity: 0.15 }],

  NMDA: [{ signal: 'glutamate', gainPerDensity: 0.3 }],
  AMPA: [{ signal: 'glutamate', gainPerDensity: 0.25 }],
  mGluR: [{ signal: 'glutamate', gainPerDensity: 0.1 }],

  Alpha1: [{ signal: 'norepi', gainPerDensity: 0.15 }],
  Alpha2: [{ signal: 'norepi', gainPerDensity: -0.1 }], // Autoreceptor, inhibitory
  Beta1: [{ signal: 'norepi', gainPerDensity: 0.1 }, { signal: 'adrenaline', gainPerDensity: 0.15 }],
  Beta2: [{ signal: 'adrenaline', gainPerDensity: 0.1 }],

  M1: [{ signal: 'acetylcholine', gainPerDensity: 0.2 }],
  M2: [{ signal: 'acetylcholine', gainPerDensity: -0.1 }], // Autoreceptor
  M3: [{ signal: 'acetylcholine', gainPerDensity: 0.1 }],
  M4: [{ signal: 'acetylcholine', gainPerDensity: 0.05 }],

  H1: [{ signal: 'histamine', gainPerDensity: 0.25 }],
  H3: [{ signal: 'histamine', gainPerDensity: -0.15 }], // Autoreceptor

  OX1R: [{ signal: 'orexin', gainPerDensity: 0.2 }],
  OX2R: [{ signal: 'orexin', gainPerDensity: 0.3 }],

  OXTR: [{ signal: 'oxytocin', gainPerDensity: 0.4 }],

  MT1: [{ signal: 'melatonin', gainPerDensity: 0.3 }],
  MT2: [{ signal: 'melatonin', gainPerDensity: 0.2 }],
};

// Note: Transporter effects on signal levels are now handled dynamically in engine.worker.ts
// rather than as baseline amplitude adjustments. This provides more accurate modeling of
// how DAT/NET/SERT activity affects synaptic neurotransmitter concentrations.

// --- Condition Definitions ---

const linear = (gain: number): ResponseSpec => ({ kind: 'linear', gain });

export const CONDITION_LIBRARY: ConditionDef[] = [
  {
    key: 'adhd',
    label: 'ADHD',
    description: {
      physiology:
        'ADHD involves hypofunctional prefrontal dopamine and norepinephrine signaling, ' +
        'primarily driven by increased DAT and NET density/activity, leading to faster ' +
        'synaptic clearance. This creates lower tonic (baseline) DA/NE with preserved or ' +
        'enhanced phasic responses to stimuli.',
      application:
        'Adjust severity to model the degree of transporter upregulation. Higher severity ' +
        'reflects greater DAT/NET activity and more pronounced hypodopaminergia.',
      references: [
        'Volkow et al. (2007) - Evaluating dopamine reward pathway in ADHD',
        'Arnsten (2009) - Toward a new understanding of ADHD pathophysiology',
      ],
    },
    params: [
      {
        key: 'severity',
        label: 'Severity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.6,
      },
    ],
    // Mechanistic: ADHD is modeled as transporter hyperfunction
    transporterModifiers: [
      { transporter: 'DAT', paramKey: 'severity', activity: 0.4 },   // 40% increase at full severity
      { transporter: 'NET', paramKey: 'severity', activity: 0.25 },  // 25% increase
    ],
    receptorModifiers: [
      { receptor: 'D2', paramKey: 'severity', density: -0.15 },      // Compensatory downregulation
      { receptor: 'Alpha2', paramKey: 'severity', sensitivity: -0.2 }, // Reduced autoreceptor function
    ],
    // Derived effects (computed from above, but listed for legacy compatibility)
    signalModifiers: [
      { key: 'dopamine', paramKey: 'severity', baseline: { amplitudeGain: -0.2 } },
      { key: 'norepi', paramKey: 'severity', baseline: { amplitudeGain: -0.12 } },
      { key: 'melatonin', paramKey: 'severity', baseline: { phaseShiftMin: 30 } },
      {
        key: 'cortisol',
        paramKey: 'severity',
        couplingGains: { orexin: 0.15, gaba: -0.1 },
      },
      {
        key: 'orexin',
        paramKey: 'severity',
        couplingGains: { ghrelin: 0.1, dopamine: 0.08 },
      },
    ],
  },
  {
    key: 'autism',
    label: 'Autism Spectrum',
    description: {
      physiology:
        'ASD frequently involves excitation/inhibition (E/I) imbalance, with evidence for ' +
        'reduced GABAergic inhibition and/or enhanced glutamatergic excitation. Oxytocin ' +
        'receptor density in social brain regions is often reduced, affecting social reward ' +
        'processing. Serotonin system alterations are common (hyperserotonemia).',
      application:
        'Adjust E/I imbalance to model the degree of inhibitory deficit. Higher values ' +
        'represent greater GABA-A receptor dysfunction and E/I shift toward excitation.',
      references: [
        'Rubenstein & Merzenich (2003) - Model of autism: increased E/I ratio',
        'LeBlanc & Bhatt (2019) - GABAergic dysfunction in ASD',
      ],
    },
    params: [
      {
        key: 'eibalance',
        label: 'E/I Imbalance',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: 'GABA_A', paramKey: 'eibalance', density: -0.25 },  // Reduced GABA-A
      { receptor: 'GABA_B', paramKey: 'eibalance', density: -0.1 },
      { receptor: 'NMDA', paramKey: 'eibalance', sensitivity: 0.15 }, // Enhanced NMDA
      { receptor: 'OXTR', paramKey: 'eibalance', density: -0.3 },     // Reduced oxytocin receptors
      { receptor: '5HT2A', paramKey: 'eibalance', density: 0.1 },     // Altered 5-HT signaling
    ],
    transporterModifiers: [
      { transporter: 'SERT', paramKey: 'eibalance', activity: -0.2 }, // Reduced SERT -> hyperserotonemia
      { transporter: 'GAT1', paramKey: 'eibalance', activity: 0.15 }, // Faster GABA clearance
    ],
    signalModifiers: [
      { key: 'gaba', paramKey: 'eibalance', baseline: { amplitudeGain: -0.15 } },
      { key: 'glutamate', paramKey: 'eibalance', baseline: { amplitudeGain: 0.12 } },
      { key: 'oxytocin', paramKey: 'eibalance', baseline: { amplitudeGain: -0.15 } },
      {
        key: 'vagal',
        paramKey: 'eibalance',
        baseline: { amplitudeGain: -0.1 },
        couplingGains: { oxytocin: -0.2 },
      },
      { key: 'serotonin', paramKey: 'eibalance', baseline: { amplitudeGain: 0.1 } },
      { key: 'sensoryLoad', paramKey: 'eibalance', baseline: { amplitudeGain: 0.2 } },
    ],
  },
  {
    key: 'depression',
    label: 'Major Depression',
    description: {
      physiology:
        'MDD involves monoamine deficiency (reduced 5-HT, NE, and DA signaling), ' +
        'HPA axis hyperactivity with elevated cortisol, reduced BDNF expression, ' +
        'and neuroinflammation. Receptor changes include 5-HT1A autoreceptor ' +
        'supersensitivity and altered 5-HT2A postsynaptic function.',
      application:
        'Adjust severity to model the depth of monoamine deficiency and HPA dysregulation.',
      references: [
        'Krishnan & Nestler (2008) - The molecular neurobiology of depression',
        'Duman & Aghajanian (2012) - Synaptic dysfunction in depression',
      ],
    },
    params: [
      {
        key: 'severity',
        label: 'Severity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: '5HT1A', paramKey: 'severity', sensitivity: 0.3 },   // Autoreceptor supersensitivity
      { receptor: '5HT2A', paramKey: 'severity', density: 0.15 },      // Upregulated (compensatory)
      { receptor: 'D2', paramKey: 'severity', density: -0.1 },
      { receptor: 'Beta1', paramKey: 'severity', density: 0.1 },       // Adrenergic upregulation
    ],
    transporterModifiers: [
      { transporter: 'SERT', paramKey: 'severity', activity: 0.2 },    // Faster 5-HT clearance
      { transporter: 'NET', paramKey: 'severity', activity: 0.15 },
    ],
    signalModifiers: [
      { key: 'serotonin', paramKey: 'severity', baseline: { amplitudeGain: -0.25 } },
      { key: 'dopamine', paramKey: 'severity', baseline: { amplitudeGain: -0.15 } },
      { key: 'norepi', paramKey: 'severity', baseline: { amplitudeGain: -0.1 } },
      { key: 'cortisol', paramKey: 'severity', baseline: { amplitudeGain: 0.2 } },
      { key: 'bdnf', paramKey: 'severity', baseline: { amplitudeGain: -0.3 } },
      {
        key: 'melatonin',
        paramKey: 'severity',
        baseline: { amplitudeGain: -0.15, phaseShiftMin: 45 },
      },
    ],
  },
  {
    key: 'anxiety',
    label: 'Generalized Anxiety',
    description: {
      physiology:
        'GAD involves HPA axis hypersensitivity, reduced GABAergic inhibition in ' +
        'amygdala circuits, enhanced noradrenergic reactivity, and altered 5-HT1A ' +
        'receptor function. The locus coeruleus shows heightened responsivity.',
      application:
        'Adjust reactivity to model the degree of stress system sensitization.',
      references: [
        'Etkin et al. (2009) - Disrupted amygdalar subregion connectivity in GAD',
        'Lydiard (2003) - The role of GABA in anxiety disorders',
      ],
    },
    params: [
      {
        key: 'reactivity',
        label: 'Stress Reactivity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: 'GABA_A', paramKey: 'reactivity', density: -0.2 },
      { receptor: '5HT1A', paramKey: 'reactivity', density: -0.15 },
      { receptor: 'Alpha1', paramKey: 'reactivity', sensitivity: 0.2 },
      { receptor: 'Beta1', paramKey: 'reactivity', sensitivity: 0.15 },
    ],
    enzymeModifiers: [
      { enzyme: 'MAO_A', paramKey: 'reactivity', activity: -0.1 },  // Slower NE degradation
    ],
    signalModifiers: [
      { key: 'gaba', paramKey: 'reactivity', baseline: { amplitudeGain: -0.15 } },
      { key: 'norepi', paramKey: 'reactivity', baseline: { amplitudeGain: 0.15 } },
      { key: 'adrenaline', paramKey: 'reactivity', baseline: { amplitudeGain: 0.1 } },
      {
        key: 'cortisol',
        paramKey: 'reactivity',
        baseline: { amplitudeGain: 0.1 },
        couplingGains: { norepi: 0.2, adrenaline: 0.15 },
      },
      { key: 'vagal', paramKey: 'reactivity', baseline: { amplitudeGain: -0.15 } },
    ],
  },
  {
    key: 'pots',
    label: 'POTS',
    description: {
      physiology:
        'Postural Orthostatic Tachycardia Syndrome involves autonomic dysfunction with ' +
        'impaired vasoconstriction and compensatory tachycardia on standing. Key features ' +
        'include norepinephrine transporter (NET) dysfunction leading to hyperadrenergic states, ' +
        'reduced vagal tone, and alpha-1 receptor supersensitivity. Many patients show ' +
        'elevated standing norepinephrine with paradoxical blood pressure instability.',
      application:
        'Adjust severity to model the degree of autonomic dysfunction. Higher values reflect ' +
        'greater sympathetic hyperactivation and reduced parasympathetic compensation. ' +
        'Use to simulate effects of hydration, salt loading, and medication timing.',
      references: [
        'Raj (2013) - Postural Tachycardia Syndrome (POTS)',
        'Goldstein et al. (2002) - Dysautonomia in hyperadrenergic POTS',
        'Thieben et al. (2007) - POTS: The Mayo Clinic experience',
      ],
    },
    params: [
      {
        key: 'severity',
        label: 'Severity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: 'Alpha1', paramKey: 'severity', sensitivity: 0.25 },   // Supersensitive alpha-1
      { receptor: 'Beta1', paramKey: 'severity', sensitivity: 0.2 },     // Cardiac beta sensitivity
      { receptor: 'Alpha2', paramKey: 'severity', density: -0.15 },      // Reduced autoreceptor
    ],
    transporterModifiers: [
      { transporter: 'NET', paramKey: 'severity', activity: -0.3 },      // NET dysfunction -> NE accumulation
    ],
    signalModifiers: [
      { key: 'norepi', paramKey: 'severity', baseline: { amplitudeGain: 0.25 } },
      { key: 'adrenaline', paramKey: 'severity', baseline: { amplitudeGain: 0.15 } },
      { key: 'vagal', paramKey: 'severity', baseline: { amplitudeGain: -0.25 } },
      { key: 'hrv', paramKey: 'severity', baseline: { amplitudeGain: -0.2 } },
      { key: 'bloodPressure', paramKey: 'severity', baseline: { amplitudeGain: -0.1 } },
      {
        key: 'cortisol',
        paramKey: 'severity',
        baseline: { amplitudeGain: 0.1 },
        couplingGains: { norepi: 0.15 },
      },
      {
        key: 'energy',
        paramKey: 'severity',
        baseline: { amplitudeGain: -0.2 },
        couplingGains: { bloodPressure: 0.15, vagal: 0.1 },
      },
    ],
  },
  {
    key: 'mcas',
    label: 'MCAS',
    description: {
      physiology:
        'Mast Cell Activation Syndrome involves inappropriate mast cell degranulation ' +
        'releasing histamine, prostaglandins, and other mediators. This leads to chronic ' +
        'histamine excess, H1/H2 receptor overactivation, and systemic inflammation. ' +
        'DAO enzyme deficiency often co-occurs, impairing histamine clearance from the gut.',
      application:
        'Adjust activation level to model baseline mast cell instability. Higher values ' +
        'represent more frequent/intense degranulation episodes. Use to simulate effects ' +
        'of H1/H2 blockers, DAO supplements, and trigger avoidance.',
      references: [
        'Afrin et al. (2016) - Mast cell activation disease: A concise practical guide',
        'Molderings et al. (2011) - Mast cell activation disease',
        'Theoharides et al. (2019) - MCAS and neuroinflammation',
      ],
    },
    params: [
      {
        key: 'activation',
        label: 'Activation Level',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: 'H1', paramKey: 'activation', sensitivity: 0.3 },      // Enhanced H1 response
      { receptor: 'H3', paramKey: 'activation', density: -0.2 },         // Reduced autoreceptor inhibition
    ],
    enzymeModifiers: [
      { enzyme: 'DAO', paramKey: 'activation', activity: -0.35 },        // Impaired DAO -> slower histamine clearance
    ],
    signalModifiers: [
      { key: 'histamine', paramKey: 'activation', baseline: { amplitudeGain: 0.35 } },
      { key: 'inflammation', paramKey: 'activation', baseline: { amplitudeGain: 0.25 } },
      { key: 'cortisol', paramKey: 'activation', baseline: { amplitudeGain: 0.15 } },
      { key: 'vagal', paramKey: 'activation', baseline: { amplitudeGain: -0.1 } },
      { key: 'sensoryLoad', paramKey: 'activation', baseline: { amplitudeGain: 0.2 } },
      {
        key: 'gaba',
        paramKey: 'activation',
        baseline: { amplitudeGain: -0.1 },
        couplingGains: { histamine: -0.15 },
      },
      {
        key: 'energy',
        paramKey: 'activation',
        baseline: { amplitudeGain: -0.15 },
        couplingGains: { inflammation: -0.2, histamine: -0.1 },
      },
    ],
  },
  {
    key: 'insomnia',
    label: 'Primary Insomnia',
    description: {
      physiology:
        'Primary insomnia involves hyperarousal of the central nervous system with ' +
        'orexin system overactivation, reduced GABAergic inhibition, and blunted melatonin ' +
        'signaling. MT1/MT2 receptor sensitivity may be reduced, and the circadian phase ' +
        'is often delayed. The locus coeruleus remains hyperactive during sleep attempts.',
      application:
        'Adjust severity to model the degree of sleep system dysfunction. Higher values ' +
        'reflect greater orexin hyperactivity and reduced sleep pressure accumulation. ' +
        'Use to simulate effects of sleep hygiene, melatonin timing, and GABAergic supplements.',
      references: [
        'Riemann et al. (2010) - The hyperarousal model of insomnia',
        'Buysse (2013) - Insomnia: diagnosis and treatment',
        'Winkelman (2015) - GABA system in insomnia',
      ],
    },
    params: [
      {
        key: 'severity',
        label: 'Severity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: 'OX2R', paramKey: 'severity', sensitivity: 0.25 },     // Orexin hyperactivity
      { receptor: 'OX1R', paramKey: 'severity', sensitivity: 0.15 },
      { receptor: 'GABA_A', paramKey: 'severity', density: -0.15 },      // Reduced GABA-A
      { receptor: 'MT1', paramKey: 'severity', density: -0.2 },          // Blunted melatonin receptors
      { receptor: 'MT2', paramKey: 'severity', density: -0.15 },
    ],
    transporterModifiers: [
      { transporter: 'GAT1', paramKey: 'severity', activity: 0.15 },     // Faster GABA clearance
    ],
    signalModifiers: [
      { key: 'orexin', paramKey: 'severity', baseline: { amplitudeGain: 0.2 } },
      { key: 'melatonin', paramKey: 'severity', baseline: { amplitudeGain: -0.25, phaseShiftMin: 45 } },
      { key: 'gaba', paramKey: 'severity', baseline: { amplitudeGain: -0.15 } },
      { key: 'cortisol', paramKey: 'severity', baseline: { amplitudeGain: 0.1, phaseShiftMin: -30 } },
      { key: 'norepi', paramKey: 'severity', baseline: { amplitudeGain: 0.1 } },
      {
        key: 'histamine',
        paramKey: 'severity',
        baseline: { amplitudeGain: 0.1 },
        couplingGains: { orexin: 0.15 },
      },
      {
        key: 'glutamate',
        paramKey: 'severity',
        baseline: { amplitudeGain: 0.1 },
        couplingGains: { gaba: -0.1 },
      },
    ],
  },
  {
    key: 'pcos',
    label: 'PCOS',
    description: {
      physiology:
        'Polycystic Ovary Syndrome involves hyperandrogenism, insulin resistance, and ' +
        'altered LH/FSH pulsatility. Elevated LH drives ovarian androgen production, ' +
        'while insulin resistance enhances adrenal DHEA-S and reduces SHBG. The HPA axis ' +
        'often shows elevated cortisol, and dopamine signaling may be altered.',
      application:
        'Adjust severity to model the degree of metabolic and hormonal dysfunction. ' +
        'Higher values reflect greater insulin resistance and androgen excess. ' +
        'Use to simulate effects of inositol, metformin timing, and cycle-aware interventions.',
      references: [
        'Azziz et al. (2016) - PCOS: a contemporary perspective',
        'Diamanti-Kandarakis & Dunaif (2012) - Insulin resistance in PCOS',
        'Rosenfield & Ehrmann (2016) - Pathogenesis of PCOS',
      ],
    },
    params: [
      {
        key: 'severity',
        label: 'Severity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.5,
      },
    ],
    receptorModifiers: [
      { receptor: 'D2', paramKey: 'severity', density: -0.1 },           // Altered dopamine (affects prolactin)
    ],
    signalModifiers: [
      { key: 'insulin', paramKey: 'severity', baseline: { amplitudeGain: 0.25 } },
      { key: 'testosterone', paramKey: 'severity', baseline: { amplitudeGain: 0.3 } },
      { key: 'dheas', paramKey: 'severity', baseline: { amplitudeGain: 0.2 } },
      { key: 'shbg', paramKey: 'severity', baseline: { amplitudeGain: -0.25 } },
      { key: 'lh', paramKey: 'severity', baseline: { amplitudeGain: 0.2 } },
      { key: 'fsh', paramKey: 'severity', baseline: { amplitudeGain: -0.1 } },
      { key: 'estrogen', paramKey: 'severity', baseline: { amplitudeGain: -0.1 } },
      { key: 'progesterone', paramKey: 'severity', baseline: { amplitudeGain: -0.2 } },
      { key: 'cortisol', paramKey: 'severity', baseline: { amplitudeGain: 0.1 } },
      { key: 'inflammation', paramKey: 'severity', baseline: { amplitudeGain: 0.15 } },
      {
        key: 'glucose',
        paramKey: 'severity',
        baseline: { amplitudeGain: 0.1 },
        couplingGains: { insulin: -0.2 },  // Insulin resistance
      },
      {
        key: 'energy',
        paramKey: 'severity',
        couplingGains: { glucose: 0.15, insulin: -0.1 },
      },
    ],
  },
];

// --- Condition State & Adjustments ---

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

type BaselineAdj = { amplitude?: number; phaseShiftMin?: number };

/**
 * Sensitivity gain per receptor type.
 * Sensitivity affects signal transduction efficiency (how strongly each receptor responds).
 * Positive sensitivity = enhanced response, negative = blunted response.
 */
export const RECEPTOR_SENSITIVITY_GAIN: Record<ReceptorKey, { signal: Signal; gainPerSensitivity: number }[]> = {
  // Dopamine: sensitivity affects response magnitude
  D1: [{ signal: 'dopamine', gainPerSensitivity: 0.12 }],
  D2: [{ signal: 'dopamine', gainPerSensitivity: 0.20 }],
  D3: [{ signal: 'dopamine', gainPerSensitivity: 0.04 }],
  D4: [{ signal: 'dopamine', gainPerSensitivity: 0.02 }],
  D5: [{ signal: 'dopamine', gainPerSensitivity: 0.02 }],

  // Serotonin
  '5HT1A': [{ signal: 'serotonin', gainPerSensitivity: 0.15 }, { signal: 'gaba', gainPerSensitivity: 0.08 }],
  '5HT2A': [{ signal: 'serotonin', gainPerSensitivity: 0.12 }, { signal: 'glutamate', gainPerSensitivity: 0.08 }],
  '5HT2C': [{ signal: 'serotonin', gainPerSensitivity: 0.08 }],
  '5HT3': [{ signal: 'serotonin', gainPerSensitivity: 0.04 }],

  // GABA
  GABA_A: [{ signal: 'gaba', gainPerSensitivity: 0.25 }],
  GABA_B: [{ signal: 'gaba', gainPerSensitivity: 0.12 }],

  // Glutamate
  NMDA: [{ signal: 'glutamate', gainPerSensitivity: 0.25 }],
  AMPA: [{ signal: 'glutamate', gainPerSensitivity: 0.20 }],
  mGluR: [{ signal: 'glutamate', gainPerSensitivity: 0.08 }],

  // Adrenergic
  Alpha1: [{ signal: 'norepi', gainPerSensitivity: 0.12 }, { signal: 'adrenaline', gainPerSensitivity: 0.08 }],
  Alpha2: [{ signal: 'norepi', gainPerSensitivity: -0.08 }], // Autoreceptor
  Beta1: [{ signal: 'norepi', gainPerSensitivity: 0.08 }, { signal: 'adrenaline', gainPerSensitivity: 0.12 }],
  Beta2: [{ signal: 'adrenaline', gainPerSensitivity: 0.08 }],

  // Muscarinic
  M1: [{ signal: 'acetylcholine', gainPerSensitivity: 0.15 }],
  M2: [{ signal: 'acetylcholine', gainPerSensitivity: -0.08 }],
  M3: [{ signal: 'acetylcholine', gainPerSensitivity: 0.08 }],
  M4: [{ signal: 'acetylcholine', gainPerSensitivity: 0.04 }],

  // Histamine
  H1: [{ signal: 'histamine', gainPerSensitivity: 0.20 }],
  H3: [{ signal: 'histamine', gainPerSensitivity: -0.12 }],

  // Orexin
  OX1R: [{ signal: 'orexin', gainPerSensitivity: 0.15 }],
  OX2R: [{ signal: 'orexin', gainPerSensitivity: 0.25 }],

  // Others
  OXTR: [{ signal: 'oxytocin', gainPerSensitivity: 0.30 }],
  MT1: [{ signal: 'melatonin', gainPerSensitivity: 0.25 }],
  MT2: [{ signal: 'melatonin', gainPerSensitivity: 0.15 }],
};

/**
 * Computes signal adjustments from receptor/transporter modifiers
 *
 * Density: affects number of available receptors → baseline signal amplitude
 * Sensitivity: affects coupling efficiency → response gain to stimuli
 */
function computeMechanisticEffects(
  condition: ConditionDef,
  intensity: number
): {
  baselines: ProfileBaselineAdjustments;
  receptors: Partial<Record<ReceptorKey, number>>;
  transporters: Partial<Record<TransporterKey, number>>;
  sensitivities: Partial<Record<ReceptorKey, number>>;
} {
  const baselines: ProfileBaselineAdjustments = {};
  const receptors: Partial<Record<ReceptorKey, number>> = {};
  const transporters: Partial<Record<TransporterKey, number>> = {};
  const sensitivities: Partial<Record<ReceptorKey, number>> = {};

  // Process receptor modifiers
  for (const mod of condition.receptorModifiers ?? []) {
    // Density affects baseline amplitude
    const densityDelta = (mod.density ?? 0) * intensity;
    if (densityDelta !== 0) {
      receptors[mod.receptor] = (receptors[mod.receptor] ?? 0) + densityDelta;

      const densityMappings = RECEPTOR_SIGNAL_MAP[mod.receptor] ?? [];
      for (const { signal, gainPerDensity } of densityMappings) {
        const signalDelta = densityDelta * gainPerDensity;
        baselines[signal] = baselines[signal] ?? {};
        baselines[signal]!.amplitude = (baselines[signal]!.amplitude ?? 0) + signalDelta;
      }
    }

    // Sensitivity affects response gain (transduction efficiency)
    const sensitivityDelta = (mod.sensitivity ?? 0) * intensity;
    if (sensitivityDelta !== 0) {
      sensitivities[mod.receptor] = (sensitivities[mod.receptor] ?? 0) + sensitivityDelta;

      const sensitivityMappings = RECEPTOR_SENSITIVITY_GAIN[mod.receptor] ?? [];
      for (const { signal, gainPerSensitivity } of sensitivityMappings) {
        const signalDelta = sensitivityDelta * gainPerSensitivity;
        baselines[signal] = baselines[signal] ?? {};
        baselines[signal]!.amplitude = (baselines[signal]!.amplitude ?? 0) + signalDelta;
      }
    }
  }

  // Process transporter modifiers
  // Note: We track transporter activities here but do NOT apply baseline amplitude effects.
  // The engine worker handles transporter effects dynamically by modulating effective
  // neurotransmitter levels for homeostasis inputs. This avoids double-counting.
  for (const mod of condition.transporterModifiers ?? []) {
    const delta = mod.activity * intensity;
    transporters[mod.transporter] = (transporters[mod.transporter] ?? 0) + delta;
    // Transporter effects are applied in engine.worker.ts via effectiveDopamine/etc.
  }

  return { baselines, receptors, transporters, sensitivities };
}

/**
 * Builds the complete condition adjustments from enabled conditions
 */
export function buildConditionAdjustments(
  state: Record<ConditionKey, ConditionStateSnapshot>
): ConditionAdjustments {
  const baselineAdjustments: ProfileBaselineAdjustments = {};
  const couplingAdjustments: ProfileCouplingAdjustments = {};
  const receptorDensities: Partial<Record<ReceptorKey, number>> = {};
  const receptorSensitivities: Partial<Record<ReceptorKey, number>> = {};
  const transporterActivities: Partial<Record<TransporterKey, number>> = {};
  const enzymeActivities: Partial<Record<EnzymeKey, number>> = {};

  const ensureBaseline = (signal: Signal): BaselineAdj => {
    if (!baselineAdjustments[signal]) {
      baselineAdjustments[signal] = {};
    }
    return baselineAdjustments[signal] as BaselineAdj;
  };

  for (const condition of CONDITION_LIBRARY) {
    const snapshot = state[condition.key];
    if (!snapshot?.enabled) continue;

    const defaultParamKey = condition.params[0]?.key;

    // --- Process Mechanistic Modifiers ---
    const hasMechanistic = !!(
      condition.receptorModifiers?.length ||
      condition.transporterModifiers?.length ||
      condition.enzymeModifiers?.length
    );

    const paramKey = condition.receptorModifiers?.[0]?.paramKey ?? defaultParamKey;
    const intensity = paramKey && snapshot.params[paramKey] !== undefined
      ? snapshot.params[paramKey]
      : 1;

    const { baselines: mechBaselines, receptors, transporters, sensitivities } = computeMechanisticEffects(condition, intensity);

    // Merge mechanistic effects
    for (const [signal, adj] of Object.entries(mechBaselines)) {
      const record = ensureBaseline(signal as Signal);
      record.amplitude = (record.amplitude ?? 0) + (adj.amplitude ?? 0);
    }

    for (const [rec, val] of Object.entries(receptors)) {
      receptorDensities[rec as ReceptorKey] = (receptorDensities[rec as ReceptorKey] ?? 0) + val;
    }

    for (const [rec, val] of Object.entries(sensitivities)) {
      receptorSensitivities[rec as ReceptorKey] = (receptorSensitivities[rec as ReceptorKey] ?? 0) + val;
    }

    for (const [trans, val] of Object.entries(transporters)) {
      transporterActivities[trans as TransporterKey] = (transporterActivities[trans as TransporterKey] ?? 0) + val;
    }

    // --- Process Legacy Signal Modifiers ---
    // Only use legacy modifiers for effects NOT covered by mechanistic system:
    // - Phase shifts (not modeled mechanistically)
    // - Coupling gains (not modeled mechanistically)
    // - Amplitude gains ONLY if no mechanistic modifiers exist
    for (const modifier of condition.signalModifiers ?? []) {
      const modParamKey = modifier.paramKey ?? defaultParamKey;
      const modIntensity = modParamKey && snapshot.params[modParamKey] !== undefined
        ? snapshot.params[modParamKey]
        : 1;

      const target = modifier.key;

      if (modifier.baseline) {
        const record = ensureBaseline(target);
        // Skip amplitude if mechanistic modifiers handle this signal
        // (mechanistic system computes amplitude from receptor/transporter changes)
        if (modifier.baseline.amplitudeGain !== undefined && !hasMechanistic) {
          record.amplitude = (record.amplitude ?? 0) + modifier.baseline.amplitudeGain * modIntensity;
        }
        // Phase shifts are always applied (not modeled mechanistically)
        if (modifier.baseline.phaseShiftMin !== undefined) {
          record.phaseShiftMin = (record.phaseShiftMin ?? 0) + modifier.baseline.phaseShiftMin * modIntensity;
        }
      }

      if (modifier.couplingGains) {
        const extras = (couplingAdjustments[target] = couplingAdjustments[target] ?? []);
        for (const [source, gain] of Object.entries(modifier.couplingGains)) {
          if (!gain) continue;
          extras.push({
            source: source as Signal,
            mapping: linear(gain * modIntensity),
            description: `Condition (${condition.label})`,
          });
        }
      }
    }

    // Process enzyme modifiers
    for (const mod of condition.enzymeModifiers ?? []) {
      const enzParamKey = mod.paramKey ?? defaultParamKey;
      const enzIntensity = enzParamKey && snapshot.params[enzParamKey] !== undefined
        ? snapshot.params[enzParamKey]
        : 1;
      enzymeActivities[mod.enzyme] = (enzymeActivities[mod.enzyme] ?? 0) + mod.activity * enzIntensity;
    }
  }

  return {
    baselines: baselineAdjustments,
    couplings: couplingAdjustments,
    receptorDensities,
    receptorSensitivities,
    transporterActivities,
    enzymeActivities,
  };
}
