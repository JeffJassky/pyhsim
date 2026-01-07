/**
 * Neurophysiological Profiles Module
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
  | 'AChE';            // Acetylcholinesterase

// --- Profile Types ---

export type ProfileKey = 'adhd' | 'autism' | 'depression' | 'anxiety';

export interface ProfileParam {
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

export interface ProfileDef {
  key: ProfileKey;
  label: string;
  description: {
    physiology: string;
    application: string;
    references?: string[];
  };
  params: ProfileParam[];

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
const RECEPTOR_SIGNAL_MAP: Record<ReceptorKey, { signal: Signal; gainPerDensity: number }[]> = {
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

/**
 * Maps transporter changes to synaptic concentration effects
 * Higher transporter activity = faster clearance = lower synaptic concentration
 */
const TRANSPORTER_SIGNAL_MAP: Record<TransporterKey, { signal: Signal; gainPerActivity: number }> = {
  DAT: { signal: 'dopamine', gainPerActivity: -0.3 },   // More DAT = less DA
  NET: { signal: 'norepi', gainPerActivity: -0.25 },    // More NET = less NE
  SERT: { signal: 'serotonin', gainPerActivity: -0.25 },
  GAT1: { signal: 'gaba', gainPerActivity: -0.2 },
  GLT1: { signal: 'glutamate', gainPerActivity: -0.2 },
};

// --- Profile Definitions ---

const linear = (gain: number): ResponseSpec => ({ kind: 'linear', gain });

export const PROFILE_LIBRARY: ProfileDef[] = [
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
];

// --- Profile State & Adjustments ---

export interface ProfileStateSnapshot {
  enabled: boolean;
  params: Record<string, number>;
}

export interface ProfileAdjustments {
  baselines: ProfileBaselineAdjustments;
  couplings: ProfileCouplingAdjustments;
  receptorDensities: Partial<Record<ReceptorKey, number>>;
  transporterActivities: Partial<Record<TransporterKey, number>>;
  enzymeActivities: Partial<Record<EnzymeKey, number>>;
}

type BaselineAdj = { amplitude?: number; phaseShiftMin?: number };

/**
 * Computes signal adjustments from receptor/transporter modifiers
 */
function computeMechanisticEffects(
  profile: ProfileDef,
  intensity: number
): { baselines: ProfileBaselineAdjustments; receptors: Partial<Record<ReceptorKey, number>>; transporters: Partial<Record<TransporterKey, number>> } {
  const baselines: ProfileBaselineAdjustments = {};
  const receptors: Partial<Record<ReceptorKey, number>> = {};
  const transporters: Partial<Record<TransporterKey, number>> = {};

  // Process receptor modifiers
  for (const mod of profile.receptorModifiers ?? []) {
    const delta = (mod.density ?? 0) * intensity;
    receptors[mod.receptor] = (receptors[mod.receptor] ?? 0) + delta;

    // Map to signal effects
    const mappings = RECEPTOR_SIGNAL_MAP[mod.receptor] ?? [];
    for (const { signal, gainPerDensity } of mappings) {
      const signalDelta = delta * gainPerDensity;
      baselines[signal] = baselines[signal] ?? {};
      baselines[signal]!.amplitude = (baselines[signal]!.amplitude ?? 0) + signalDelta;
    }
  }

  // Process transporter modifiers
  for (const mod of profile.transporterModifiers ?? []) {
    const delta = mod.activity * intensity;
    transporters[mod.transporter] = (transporters[mod.transporter] ?? 0) + delta;

    // Map to signal effects
    const mapping = TRANSPORTER_SIGNAL_MAP[mod.transporter];
    if (mapping) {
      const signalDelta = delta * mapping.gainPerActivity;
      baselines[mapping.signal] = baselines[mapping.signal] ?? {};
      baselines[mapping.signal]!.amplitude = (baselines[mapping.signal]!.amplitude ?? 0) + signalDelta;
    }
  }

  return { baselines, receptors, transporters };
}

/**
 * Builds the complete profile adjustments from enabled profiles
 */
export function buildProfileAdjustments(
  state: Record<ProfileKey, ProfileStateSnapshot>
): ProfileAdjustments {
  const baselineAdjustments: ProfileBaselineAdjustments = {};
  const couplingAdjustments: ProfileCouplingAdjustments = {};
  const receptorDensities: Partial<Record<ReceptorKey, number>> = {};
  const transporterActivities: Partial<Record<TransporterKey, number>> = {};
  const enzymeActivities: Partial<Record<EnzymeKey, number>> = {};

  const ensureBaseline = (signal: Signal): BaselineAdj => {
    if (!baselineAdjustments[signal]) {
      baselineAdjustments[signal] = {};
    }
    return baselineAdjustments[signal] as BaselineAdj;
  };

  for (const profile of PROFILE_LIBRARY) {
    const snapshot = state[profile.key];
    if (!snapshot?.enabled) continue;

    const defaultParamKey = profile.params[0]?.key;

    // --- Process Mechanistic Modifiers ---
    const paramKey = profile.receptorModifiers?.[0]?.paramKey ?? defaultParamKey;
    const intensity = paramKey && snapshot.params[paramKey] !== undefined
      ? snapshot.params[paramKey]
      : 1;

    const { baselines: mechBaselines, receptors, transporters } = computeMechanisticEffects(profile, intensity);

    // Merge mechanistic effects
    for (const [signal, adj] of Object.entries(mechBaselines)) {
      const record = ensureBaseline(signal as Signal);
      record.amplitude = (record.amplitude ?? 0) + (adj.amplitude ?? 0);
    }

    for (const [rec, val] of Object.entries(receptors)) {
      receptorDensities[rec as ReceptorKey] = (receptorDensities[rec as ReceptorKey] ?? 0) + val;
    }

    for (const [trans, val] of Object.entries(transporters)) {
      transporterActivities[trans as TransporterKey] = (transporterActivities[trans as TransporterKey] ?? 0) + val;
    }

    // --- Process Legacy Signal Modifiers (for backward compatibility) ---
    for (const modifier of profile.signalModifiers ?? []) {
      const modParamKey = modifier.paramKey ?? defaultParamKey;
      const modIntensity = modParamKey && snapshot.params[modParamKey] !== undefined
        ? snapshot.params[modParamKey]
        : 1;

      const target = modifier.key;

      if (modifier.baseline) {
        const record = ensureBaseline(target);
        if (modifier.baseline.amplitudeGain !== undefined) {
          record.amplitude = (record.amplitude ?? 0) + modifier.baseline.amplitudeGain * modIntensity;
        }
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
            description: `Profile (${profile.label})`,
          });
        }
      }
    }

    // Process enzyme modifiers
    for (const mod of profile.enzymeModifiers ?? []) {
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
    transporterActivities,
    enzymeActivities,
  };
}
