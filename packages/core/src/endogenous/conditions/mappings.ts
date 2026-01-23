import type { Signal } from "../../engine";
import type { ReceptorKey } from "../targets";

/**
 * Maps receptor changes to downstream signal effects
 */
export const RECEPTOR_SIGNAL_MAP: Partial<Record<ReceptorKey, { signal: Signal; gainPerDensity: number }[]>> = {
  D1: [{ signal: 'dopamine', gainPerDensity: 0.15 }],
  D2: [{ signal: 'dopamine', gainPerDensity: 0.25 }],
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
  Alpha2: [{ signal: 'norepi', gainPerDensity: -0.1 }], 
  Beta1: [{ signal: 'norepi', gainPerDensity: 0.1 }, { signal: 'adrenaline', gainPerDensity: 0.15 }],
  Beta2: [{ signal: 'adrenaline', gainPerDensity: 0.1 }],

  M1: [{ signal: 'acetylcholine', gainPerDensity: 0.2 }],
  M2: [{ signal: 'acetylcholine', gainPerDensity: -0.1 }],
  M3: [{ signal: 'acetylcholine', gainPerDensity: 0.1 }],
  M4: [{ signal: 'acetylcholine', gainPerDensity: 0.05 }],

  H1: [{ signal: 'histamine', gainPerDensity: 0.25 }],
  H3: [{ signal: 'histamine', gainPerDensity: -0.15 }],

  OX1R: [{ signal: 'orexin', gainPerDensity: 0.2 }],
  OX2R: [{ signal: 'orexin', gainPerDensity: 0.3 }],

  OXTR: [{ signal: 'oxytocin', gainPerDensity: 0.4 }],

  MT1: [{ signal: 'melatonin', gainPerDensity: 0.3 }],
  MT2: [{ signal: 'melatonin', gainPerDensity: 0.2 }],
};

export const RECEPTOR_SENSITIVITY_GAIN: Partial<Record<ReceptorKey, { signal: Signal; gainPerSensitivity: number }[]>> = {
  D1: [{ signal: 'dopamine', gainPerSensitivity: 0.12 }],
  D2: [{ signal: 'dopamine', gainPerSensitivity: 0.20 }],
  D3: [{ signal: 'dopamine', gainPerSensitivity: 0.04 }],
  D4: [{ signal: 'dopamine', gainPerSensitivity: 0.02 }],
  D5: [{ signal: 'dopamine', gainPerSensitivity: 0.02 }],

  '5HT1A': [{ signal: 'serotonin', gainPerSensitivity: 0.15 }, { signal: 'gaba', gainPerSensitivity: 0.08 }],
  '5HT2A': [{ signal: 'serotonin', gainPerSensitivity: 0.12 }, { signal: 'glutamate', gainPerSensitivity: 0.08 }],
  '5HT2C': [{ signal: 'serotonin', gainPerSensitivity: 0.08 }],
  '5HT3': [{ signal: 'serotonin', gainPerSensitivity: 0.04 }],

  GABA_A: [{ signal: 'gaba', gainPerSensitivity: 0.25 }],
  GABA_B: [{ signal: 'gaba', gainPerSensitivity: 0.12 }],

  NMDA: [{ signal: 'glutamate', gainPerSensitivity: 0.25 }],
  AMPA: [{ signal: 'glutamate', gainPerSensitivity: 0.20 }],
  mGluR: [{ signal: 'glutamate', gainPerSensitivity: 0.08 }],

  Alpha1: [{ signal: 'norepi', gainPerSensitivity: 0.12 }, { signal: 'adrenaline', gainPerSensitivity: 0.08 }],
  Alpha2: [{ signal: 'norepi', gainPerSensitivity: -0.08 }],
  Beta1: [{ signal: 'norepi', gainPerSensitivity: 0.08 }, { signal: 'adrenaline', gainPerSensitivity: 0.12 }],
  Beta2: [{ signal: 'adrenaline', gainPerSensitivity: 0.08 }],

  M1: [{ signal: 'acetylcholine', gainPerSensitivity: 0.15 }],
  M2: [{ signal: 'acetylcholine', gainPerSensitivity: -0.08 }],
  M3: [{ signal: 'acetylcholine', gainPerSensitivity: 0.08 }],
  M4: [{ signal: 'acetylcholine', gainPerSensitivity: 0.04 }],

  H1: [{ signal: 'histamine', gainPerSensitivity: 0.20 }],
  H3: [{ signal: 'histamine', gainPerSensitivity: -0.12 }],

  OX1R: [{ signal: 'orexin', gainPerSensitivity: 0.15 }],
  OX2R: [{ signal: 'orexin', gainPerSensitivity: 0.25 }],

  OXTR: [{ signal: 'oxytocin', gainPerSensitivity: 0.30 }],
  MT1: [{ signal: 'melatonin', gainPerSensitivity: 0.25 }],
  MT2: [{ signal: 'melatonin', gainPerSensitivity: 0.15 }],
};
