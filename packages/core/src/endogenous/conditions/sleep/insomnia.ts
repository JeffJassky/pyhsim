import type { ConditionDef } from "../types";

export const insomnia: ConditionDef = {
  key: 'insomnia',
  label: 'Primary Insomnia',
  description: {
    physiology:
      'Primary insomnia involves hyperarousal of the central nervous system with ' +
      'orexin system overactivation and reduced GABAergic inhibition.',
    application:
      'Adjust severity to model the degree of sleep system dysfunction.',
    references: [
      'Riemann et al. (2010)',
      'Winkelman (2015)',
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
    { receptor: 'OX2R', paramKey: 'severity', sensitivity: 0.25 },
    { receptor: 'OX1R', paramKey: 'severity', sensitivity: 0.15 },
    { receptor: 'GABA_A', paramKey: 'severity', density: -0.15 },
    { receptor: 'MT1', paramKey: 'severity', density: -0.2 },
    { receptor: 'MT2', paramKey: 'severity', density: -0.15 },
  ],
  transporterModifiers: [
    { transporter: 'GAT1', paramKey: 'severity', activity: 0.15 },
  ],
  signalModifiers: [
    { key: 'orexin', paramKey: 'severity', baseline: { amplitudeGain: 0.2 } },
    { key: 'melatonin', paramKey: 'severity', baseline: { amplitudeGain: -0.25, phaseShiftMin: 45 } },
    { key: 'gaba', paramKey: 'severity', baseline: { amplitudeGain: -0.15 } },
    { key: 'cortisol', paramKey: 'severity', baseline: { amplitudeGain: 0.1, phaseShiftMin: -30 } },
    { key: 'norepi', paramKey: 'severity', baseline: { amplitudeGain: 0.1 } },
  ],
};
