import type { ConditionDef } from "../types";

export const autism: ConditionDef = {
  key: 'autism',
  label: 'Autism Spectrum',
  description: {
    physiology:
      'ASD frequently involves excitation/inhibition (E/I) imbalance, with evidence for ' +
      'reduced GABAergic inhibition and/or enhanced glutamatergic excitation.',
    application:
      'Adjust E/I imbalance to model the degree of inhibitory deficit.',
    references: [
      'Rubenstein & Merzenich (2003)',
      'LeBlanc & Bhatt (2019)',
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
    { receptor: 'GABA_A', paramKey: 'eibalance', density: -0.25 },
    { receptor: 'GABA_B', paramKey: 'eibalance', density: -0.1 },
    { receptor: 'NMDA', paramKey: 'eibalance', sensitivity: 0.15 },
    { receptor: 'OXTR', paramKey: 'eibalance', density: -0.3 },
    { receptor: '5HT2A', paramKey: 'eibalance', density: 0.1 },
  ],
  transporterModifiers: [
    { transporter: 'SERT', paramKey: 'eibalance', activity: -0.2 },
    { transporter: 'GAT1', paramKey: 'eibalance', activity: 0.15 },
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
};
