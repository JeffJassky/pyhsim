import type { ConditionDef } from "../types";

export const mcas: ConditionDef = {
  key: 'mcas',
  label: 'MCAS',
  description: {
    physiology:
      'Mast Cell Activation Syndrome involves inappropriate mast cell degranulation ' +
      'releasing histamine, prostaglandins, and other mediators.',
    application:
      'Adjust activation level to model baseline mast cell instability.',
    references: [
      'Afrin et al. (2016)',
      'Molderings et al. (2011)',
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
    { receptor: 'H1', paramKey: 'activation', sensitivity: 0.3 },
    { receptor: 'H3', paramKey: 'activation', density: -0.2 },
  ],
  enzymeModifiers: [
    { enzyme: 'DAO', paramKey: 'activation', activity: -0.35 },
  ],
  signalModifiers: [
    { key: 'histamine', paramKey: 'activation', baseline: { amplitudeGain: 0.35 } },
    { key: 'inflammation', paramKey: 'activation', baseline: { amplitudeGain: 0.25 } },
    { key: 'cortisol', paramKey: 'activation', baseline: { amplitudeGain: 0.15 } },
    { key: 'vagal', paramKey: 'activation', baseline: { amplitudeGain: -0.1 } },
    { key: 'sensoryLoad', paramKey: 'activation', baseline: { amplitudeGain: 0.2 } },
  ],
};
