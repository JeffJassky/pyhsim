import type { ConditionDef } from "../types";

export const pcos: ConditionDef = {
  key: 'pcos',
  label: 'PCOS',
  description: {
    physiology:
      'Polycystic Ovary Syndrome involves hyperandrogenism, insulin resistance, and ' +
      'altered LH/FSH pulsatility.',
    application:
      'Adjust severity to model the degree of metabolic and hormonal dysfunction.',
    references: [
      'Azziz et al. (2016)',
      'Diamanti-Kandarakis & Dunaif (2012)',
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
    { receptor: 'D2', paramKey: 'severity', density: -0.1 },
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
  ],
};
