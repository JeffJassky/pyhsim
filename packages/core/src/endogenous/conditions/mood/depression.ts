import type { ConditionDef } from "../types";

export const depression: ConditionDef = {
  key: 'depression',
  label: 'Major Depression',
  description: {
    physiology:
      'MDD involves monoamine deficiency (reduced 5-HT, NE, and DA signaling), ' +
      'HPA axis hyperactivity with elevated cortisol, and reduced BDNF expression.',
    application:
      'Adjust severity to model the depth of monoamine deficiency and HPA dysregulation.',
    references: [
      'Krishnan & Nestler (2008)',
      'Duman & Aghajanian (2012)',
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
    { receptor: '5HT1A', paramKey: 'severity', sensitivity: 0.3 },
    { receptor: '5HT2A', paramKey: 'severity', density: 0.15 },
    { receptor: 'D2', paramKey: 'severity', density: -0.1 },
    { receptor: 'Beta1', paramKey: 'severity', density: 0.1 },
  ],
  transporterModifiers: [
    { transporter: 'SERT', paramKey: 'severity', activity: 0.2 },
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
};
