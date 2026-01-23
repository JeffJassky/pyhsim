import type { ConditionDef } from "../types";

export const adhd: ConditionDef = {
  key: 'adhd',
  label: 'ADHD',
  description: {
    physiology:
      'ADHD involves hypofunctional prefrontal dopamine and norepinephrine signaling, ' +
      'primarily driven by increased DAT and NET density/activity, leading to faster ' +
      'synaptic clearance.',
    application:
      'Adjust severity to model the degree of transporter upregulation.',
    references: [
      'Volkow et al. (2007)',
      'Arnsten (2009)',
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
  transporterModifiers: [
    { transporter: 'DAT', paramKey: 'severity', activity: 0.4 },
    { transporter: 'NET', paramKey: 'severity', activity: 0.25 },
  ],
  receptorModifiers: [
    { receptor: 'D2', paramKey: 'severity', density: -0.15 },
    { receptor: 'Alpha2', paramKey: 'severity', sensitivity: -0.2 },
  ],
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
};
