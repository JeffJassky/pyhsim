import type { Signal } from '@/types';

export interface BioSystemDef {
  id: string;
  label: string;
  icon: string;
  signals: Signal[];
  description: string;
  applicationDescription?: string;
}

export const BIOLOGICAL_SYSTEMS: BioSystemDef[] = [
  {
    id: 'nervous',
    label: 'Nervous System',
    icon: '🧠',
    signals: [
      'dopamine', 'serotonin', 'acetylcholine', 'gaba', 'glutamate',
      'norepi', 'histamine', 'orexin', 'endocannabinoid', 'bdnf',
      'adenosinePressure', 'sensoryLoad', 'dopamineVesicles', 
      'norepinephrineVesicles', 'serotoninPrecursor', 'gabaPool', 
      'bdnfExpression'
    ] as Signal[],
    description: 'The network of neurons and neurotransmitters that controls perception, thought, and immediate bodily responses.',
    applicationDescription: 'Monitor neurotransmitter balance and synaptic health.'
  },
  {
    id: 'endocrine',
    label: 'Endocrine System',
    icon: '🩸',
    signals: [
      'cortisol', 'adrenaline', 'thyroid', 'growthHormone', 'prolactin',
      'oxytocin', 'vasopressin', 'melatonin', 'vip', 'ghReserve'
    ] as Signal[],
    description: 'The collection of glands that produce hormones to regulate metabolism, growth, and tissue function.',
    applicationDescription: 'Track hormonal responses to stress, sleep, and environmental cues.'
  },
  {
    id: 'metabolic',
    label: 'Metabolic System',
    icon: '⚡',
    signals: [
      'insulin', 'glucagon', 'leptin', 'ghrelin', 'glp1',
      'glucose', 'ketone', 'energy', 'hepaticGlycogen',
      'mtor', 'ampk', 'insulinAction'
    ] as Signal[],
    description: 'The machinery that converts food into energy and manages fuel storage and utilization across the body.',
    applicationDescription: 'Observe how fueling strategies affect energy production and storage.'
  },
  {
    id: 'reproductive',
    label: 'Reproductive System',
    icon: '🧬',
    signals: [
      'testosterone', 'estrogen', 'progesterone', 'lh', 'fsh', 'shbg', 'dheas'
    ] as Signal[],
    description: 'The sex organs and hormones that govern reproduction, sexual characteristics, and influence systemic health.',
    applicationDescription: 'Follow cycle phases or hormonal status.'
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular & Autonomic',
    icon: '❤️',
    signals: [
      'bloodPressure', 'hrv', 'vagal', 'oxygen'
    ] as Signal[],
    description: 'The heart, blood vessels, and the autonomic control (sympathetic/parasympathetic) that regulates blood flow and arousal states.',
    applicationDescription: 'Assess autonomic balance and cardiovascular stress.'
  },
  {
    id: 'organ',
    label: 'Organ Health & Detox',
    icon: '🫁',
    signals: [
      'alt', 'ast', 'egfr', 'ethanol', 'acetaldehyde', 'inflammation'
    ] as Signal[],
    description: 'The vital organs (Liver, Kidneys) responsible for filtration, detoxification, and systemic maintenance.',
    applicationDescription: 'Monitor markers of organ stress and detoxification load.'
  },
  {
    id: 'nutritional',
    label: 'Nutritional Status',
    icon: '🥗',
    signals: [
      'magnesium', 'ferritin', 'vitaminD3', 'zinc', 'b12', 'folate',
      'iron', 'selenium', 'copper', 'chromium', 'choline'
    ] as Signal[],
    description: 'The levels of essential micronutrients and minerals required for enzymatic function and physiological health.',
    applicationDescription: 'Ensure cofactor availability for optimal biological function.'
  }
];