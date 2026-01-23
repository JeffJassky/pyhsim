import type { ConditionDef } from "../types";

export const anxiety: ConditionDef = {
  key: 'anxiety',
  label: 'Generalized Anxiety',
  description: {
    physiology:
      'GAD involves HPA axis hypersensitivity, reduced GABAergic inhibition, ' +
      'and enhanced noradrenergic reactivity.',
    application:
      'Adjust reactivity to model the degree of stress system sensitization.',
    references: [
      'Etkin et al. (2009)',
      'Lydiard (2003)',
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
    { enzyme: 'MAO_A', paramKey: 'reactivity', activity: -0.1 },
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
};
