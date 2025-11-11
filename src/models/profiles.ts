import type {
  CouplingSpec,
  ProfileBaselineAdjustments,
  ProfileCouplingAdjustments,
  ResponseSpec,
  Signal,
} from '@/types';

export type ProfileKey = 'adhd' | 'autism';

export interface ProfileParam {
  key: string;
  label: string;
  type: 'slider';
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface SignalModifier {
  key: Signal;
  /** Which parameter controls this modifier; defaults to first profile param */
  paramKey?: string;
  baseline?: {
    amplitudeGain?: number;
    phaseShiftMin?: number;
  };
  /** Additional linear coupling gains keyed by source signal */
  couplingGains?: Partial<Record<Signal, number>>;
}

export interface ProfileDef {
  key: ProfileKey;
  label: string;
  description: {
    physiology: string;
    application: string;
  };
  params: ProfileParam[];
  signalModifiers: SignalModifier[];
}

export interface ProfileAdjustments {
  baselines: ProfileBaselineAdjustments;
  couplings: ProfileCouplingAdjustments;
}

const linear = (gain: number): ResponseSpec => ({ kind: 'linear', gain });

export const PROFILE_LIBRARY: ProfileDef[] = [
  {
    key: 'adhd',
    label: 'ADHD',
    description: {
      physiology:
        'Lower tonic dopamine/norepinephrine, heightened orexin drive, and greater stress sensitivity.',
      application:
        'Toggle to simulate ADHD physiology; adjust severity to scale dopamine drop and cortisol coupling.',
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
    signalModifiers: [
      { key: 'dopamine', paramKey: 'severity', baseline: { amplitudeGain: -0.2 } },
      { key: 'norepi', paramKey: 'severity', baseline: { amplitudeGain: -0.1 } },
      { key: 'melatonin', paramKey: 'severity', baseline: { phaseShiftMin: 30 } },
      {
        key: 'cortisol',
        paramKey: 'severity',
        couplingGains: {
          orexin: 0.15,
          gaba: -0.1,
        },
      },
      {
        key: 'orexin',
        paramKey: 'severity',
        couplingGains: {
          ghrelin: 0.1,
          dopamine: 0.08,
        },
      },
      {
        key: 'insulin',
        paramKey: 'severity',
        couplingGains: {
          orexin: 0.1,
        },
      },
    ],
  },
  {
    key: 'autism',
    label: 'Autism Spectrum',
    description: {
      physiology:
        'Frequently exhibits excitation/inhibition imbalance (lower GABA, higher glutamate) and reduced oxytocin coupling.',
      application:
        'Adjust the E/I slider to change how strongly inhibitory vs. excitatory balance is shifted.',
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
    signalModifiers: [
      { key: 'gaba', paramKey: 'eibalance', baseline: { amplitudeGain: -0.15 } },
      { key: 'glutamate', paramKey: 'eibalance', baseline: { amplitudeGain: 0.15 } },
      { key: 'oxytocin', paramKey: 'eibalance', baseline: { amplitudeGain: -0.1 } },
      {
        key: 'vagal',
        paramKey: 'eibalance',
        baseline: { amplitudeGain: -0.1 },
        couplingGains: { oxytocin: -0.2 },
      },
      {
        key: 'serotonin',
        paramKey: 'eibalance',
        baseline: { amplitudeGain: 0.05 },
      },
    ],
  },
];

export interface ProfileStateSnapshot {
  enabled: boolean;
  params: Record<string, number>;
}

type BaselineAdj = { amplitude?: number; phaseShiftMin?: number };

export function buildProfileAdjustments(
  state: Record<ProfileKey, ProfileStateSnapshot>
): ProfileAdjustments {
  const baselineAdjustments: ProfileBaselineAdjustments = {};
  const couplingAdjustments: ProfileCouplingAdjustments = {};

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
    profile.signalModifiers.forEach((modifier) => {
      const paramKey = modifier.paramKey ?? defaultParamKey;
      const intensity =
        paramKey && snapshot.params[paramKey] !== undefined
          ? snapshot.params[paramKey]
          : 1;

      const target = modifier.key;
      if (modifier.baseline) {
        const record = ensureBaseline(target);
        if (modifier.baseline.amplitudeGain !== undefined) {
          record.amplitude =
            (record.amplitude ?? 0) + modifier.baseline.amplitudeGain * intensity;
        }
        if (modifier.baseline.phaseShiftMin !== undefined) {
          record.phaseShiftMin =
            (record.phaseShiftMin ?? 0) + modifier.baseline.phaseShiftMin * intensity;
        }
      }

      if (modifier.couplingGains) {
        const extras = (couplingAdjustments[target] = couplingAdjustments[target] ?? []);
        for (const [source, gain] of Object.entries(modifier.couplingGains)) {
          if (!gain) continue;
          extras.push({
            source: source as Signal,
            mapping: linear(gain * intensity),
            description: `Profile (${profile.label})`,
          });
        }
      }
    });
  }

  return { baselines: baselineAdjustments, couplings: couplingAdjustments };
}
