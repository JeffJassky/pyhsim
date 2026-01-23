import type {
  ArousalWeights,
  MeterMap,
  OrganWeightMap,
} from '@/types/neurostate';

export const ORGAN_WEIGHTS: OrganWeightMap = {
  adrenals: {
    cortisol: 0.8,
    adrenaline: 0.5,
    norepi: 0.2,
    dheas: 0.2,
  },
  brain: {
    dopamine: 0.35,
    serotonin: 0.25,
    norepi: 0.15,
    gaba: 0.15,
    melatonin: -0.1,
    bdnf: 0.2,
    magnesium: 0.15,
    sensoryLoad: -0.2,
  },
  eyes: {
    melatonin: -0.5,
  },
  heart: {
    adrenaline: 0.35,
    norepi: 0.25,
    vagal: -0.35,
    cortisol: 0.1,
    hrv: 0.3,
    bloodPressure: 0.2,
  },
  lungs: {
    adrenaline: 0.25,
    vagal: -0.25,
  },
  liver: {
    insulin: 0.35,
    cortisol: 0.25,
    glucose: 0.2,
    ethanol: 0.3,
    acetaldehyde: 0.4,
    alt: 0.2,
    ast: 0.2,
  },
  pancreas: {
    insulin: 0.8,
  },
  stomach: {
    ghrelin: 0.6,
    serotonin: 0.2,
    vagal: -0.15,
  },
  si: {
    serotonin: 0.45,
    insulin: 0.15,
    vagal: -0.15,
  },
  colon: {
    serotonin: 0.45,
    vagal: -0.15,
  },
  thyroid: {
    energy: 0.5,
    thyroid: 0.8,
  },
  muscle: {
    adrenaline: 0.25,
    insulin: 0.2,
    mtor: 0.3,
    ampk: -0.1,
  },
  adipose: {
    leptin: 0.6,
    insulin: 0.2,
    inflammation: 0.15,
  },
  skin: {
    adrenaline: 0.2,
    cortisol: 0.1,
    vagal: -0.1,
  },
};

export const DEFAULT_METER_WEIGHTS: MeterMap = {
  energy: {
    label: 'Energy',
    weights: {
      energy: 0.3,
      cortisol: 0.1,
      adrenaline: 0.1,
      vagal: -0.1,
      ferritin: 0.15,
      thyroid: 0.15,
      ampk: 0.1,
    },
    group: 'Cognition',
  },
  focus: {
    label: 'Focus',
    weights: {
      dopamine: 0.25,
      norepi: 0.2,
      serotonin: 0.1,
      gaba: -0.1,
      bdnf: 0.1,
      ethanol: -0.25,
    },
    group: 'Cognition',
  },
  calm: {
    label: 'Calm',
    weights: {
      gaba: 0.3,
      vagal: 0.25,
      cortisol: -0.15,
      adrenaline: -0.15,
      hrv: 0.15,
      magnesium: 0.1,
    },
    group: 'Affect',
  },
  mood: {
    label: 'Mood',
    weights: {
      dopamine: 0.15,
      serotonin: 0.3,
      cortisol: -0.15,
      ethanol: -0.1,
      oxytocin: 0.1,
    },
    group: 'Affect',
  },
  social: {
    label: 'Social',
    weights: {
      oxytocin: 0.3,
      dopamine: 0.1,
      cortisol: -0.1,
      sensoryLoad: -0.2,
    },
    group: 'Social',
  },
  overwhelm: {
    label: 'Overwhelm',
    weights: {
      cortisol: 0.3,
      adrenaline: 0.25,
      vagal: -0.2,
      sensoryLoad: 0.35,
      inflammation: 0.1,
    },
    nonlinearity: 'softplus',
    group: 'Arousal',
  },
  sleepPressure: {
    label: 'Sleep Pressure',
    weights: {
      melatonin: 0.35,
      gaba: 0.15,
      energy: -0.2,
      ethanol: 0.1,
    },
    group: 'Sleep',
  },
};

export const DEFAULT_AROUSAL_WEIGHTS: ArousalWeights = {
  sympathetic: {
    cortisol: 0.4,
    adrenaline: 0.3,
    norepi: 0.2,
  },
  parasympathetic: {
    vagal: 0.6,
    gaba: 0.2,
    melatonin: 0.1,
  },
};
