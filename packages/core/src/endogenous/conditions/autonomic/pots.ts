import type { ConditionDef } from "../types";

export const pots: ConditionDef = {
  key: 'pots',
  label: 'POTS',
  description: {
    physiology:
      'Postural Orthostatic Tachycardia Syndrome involves autonomic dysfunction with ' +
      'impaired vasoconstriction and compensatory tachycardia on standing.',
    application:
      'Adjust severity to model the degree of autonomic dysfunction.',
    references: [
      'Raj (2013)',
      'Goldstein et al. (2002)',
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
    { receptor: 'Alpha1', paramKey: 'severity', sensitivity: 0.25 },
    { receptor: 'Beta1', paramKey: 'severity', sensitivity: 0.2 },
    { receptor: 'Alpha2', paramKey: 'severity', density: -0.15 },
  ],
  transporterModifiers: [
    { transporter: 'NET', paramKey: 'severity', activity: -0.3 },
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
};
