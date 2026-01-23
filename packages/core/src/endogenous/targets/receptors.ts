import type { ReceptorDefinition } from "../types";

export const RECEPTORS = {
  D1: {
    category: "receptor",
    system: "Dopaminergic",
    description:
      "Helps with thinking clearly, coordinating movement, and feeling motivated.",
    couplings: [{ signal: "dopamine", sign: 1 }],
    adaptation: { k_up: 0.0008, k_down: 0.0015 },
  } as ReceptorDefinition,
  D2: {
    category: "receptor",
    system: "Dopaminergic",
    description: "Central to motivation, pleasure, and smooth movement.",
    couplings: [{ signal: "dopamine", sign: 1 }],
    adaptation: { k_up: 0.001, k_down: 0.002 },
  } as ReceptorDefinition,
  D3: {
    category: "receptor",
    system: "Dopaminergic",
    description: "Found mainly in emotional brain regions.",
    couplings: [{ signal: "dopamine", sign: 1 }],
  } as ReceptorDefinition,
  D4: {
    category: "receptor",
    system: "Dopaminergic",
    description:
      "Important for attention, impulse control, and planning ahead.",
    couplings: [{ signal: "dopamine", sign: 1 }],
  } as ReceptorDefinition,
  D5: {
    category: "receptor",
    system: "Dopaminergic",
    description: "Works similarly to D1 but is rarer.",
    couplings: [{ signal: "dopamine", sign: 1 }],
  } as ReceptorDefinition,
  "5HT1A": {
    category: "receptor",
    system: "Serotonergic",
    description: "A key calming receptor.",
    couplings: [{ signal: "serotonin", sign: 1 }],
  } as ReceptorDefinition,
  "5HT1B": {
    category: "receptor",
    system: "Serotonergic",
    description:
      'Acts as a "brake" on serotonin release and affects blood vessels.',
    couplings: [{ signal: "serotonin", sign: 1 }],
  } as ReceptorDefinition,
  "5HT2A": {
    category: "receptor",
    system: "Serotonergic",
    description: "Shapes how we perceive and interpret the world.",
    couplings: [{ signal: "serotonin", sign: 1 }],
  } as ReceptorDefinition,
  "5HT2C": {
    category: "receptor",
    system: "Serotonergic",
    description: "Influences appetite, mood, and anxiety.",
    couplings: [{ signal: "serotonin", sign: 1 }],
  } as ReceptorDefinition,
  "5HT3": {
    category: "receptor",
    system: "Serotonergic",
    description: "The nausea receptor.",
    couplings: [{ signal: "serotonin", sign: 1 }],
  } as ReceptorDefinition,
  GABA_A: {
    category: "receptor",
    system: "GABAergic",
    description: 'The brain\'s main "calm down" switch.',
    couplings: [{ signal: "gaba", sign: 1 }],
  } as ReceptorDefinition,
  GABA_B: {
    category: "receptor",
    system: "GABAergic",
    description: "A slower, longer-lasting calming receptor.",
    couplings: [{ signal: "gaba", sign: 1 }],
  } as ReceptorDefinition,
  NMDA: {
    category: "receptor",
    system: "Glutamatergic",
    description: "Critical for learning and forming new memories.",
    couplings: [{ signal: "glutamate", sign: 1 }],
  } as ReceptorDefinition,
  AMPA: {
    category: "receptor",
    system: "Glutamatergic",
    description:
      'The brain\'s main "go" signal for fast communication between neurons.',
    couplings: [{ signal: "glutamate", sign: 1 }],
  } as ReceptorDefinition,
  mGluR: {
    category: "receptor",
    system: "Glutamatergic",
    description: "Fine-tunes how excitable neurons are.",
    couplings: [{ signal: "glutamate", sign: 1 }],
  } as ReceptorDefinition,
  Alpha1: {
    category: "receptor",
    system: "Adrenergic",
    description: "Tightens blood vessels and raises blood pressure.",
    couplings: [
      { signal: "norepi", sign: 1 },
      { signal: "adrenaline", sign: 1 },
    ],
  } as ReceptorDefinition,
  Alpha2: {
    category: "receptor",
    system: "Adrenergic",
    description: 'Acts as a "brake" on the stress response.',
    couplings: [
      { signal: "norepi", sign: 1 },
      { signal: "adrenaline", sign: 1 },
    ],
  } as ReceptorDefinition,
  Beta1: {
    category: "receptor",
    system: "Adrenergic",
    description: 'The heart\'s "speed up" receptor.',
    couplings: [
      { signal: "norepi", sign: 1 },
      { signal: "adrenaline", sign: 1 },
    ],
  } as ReceptorDefinition,
  Beta2: {
    category: "receptor",
    system: "Adrenergic",
    description: "Opens airways and relaxes blood vessels.",
    couplings: [
      { signal: "norepi", sign: 1 },
      { signal: "adrenaline", sign: 1 },
    ],
  } as ReceptorDefinition,
  Beta_Adrenergic: {
    category: "receptor",
    system: "Adrenergic",
    description: "Combined beta receptor effects on the heart and lungs.",
    couplings: [
      { signal: "norepi", sign: 1 },
      { signal: "adrenaline", sign: 1 },
    ],
  } as ReceptorDefinition,
  H1: {
    category: "receptor",
    system: "Histaminergic",
    description: "Drives allergic reactions and keeps you awake.",
    couplings: [{ signal: "histamine", sign: 1 }],
  } as ReceptorDefinition,
  H2: {
    category: "receptor",
    system: "Histaminergic",
    description: "Controls stomach acid production.",
    couplings: [{ signal: "histamine", sign: 1 }],
  } as ReceptorDefinition,
  H3: {
    category: "receptor",
    system: "Histaminergic",
    description: "The brain's histamine thermostat.",
    couplings: [{ signal: "histamine", sign: 1 }],
  } as ReceptorDefinition,
  OX1R: {
    category: "receptor",
    system: "Orexinergic",
    description: "Promotes wakefulness and appetite.",
    couplings: [{ signal: "orexin", sign: 1 }],
  } as ReceptorDefinition,
  OX2R: {
    category: "receptor",
    system: "Orexinergic",
    description: "The main wakefulness receptor.",
    couplings: [{ signal: "orexin", sign: 1 }],
  } as ReceptorDefinition,
  MT1: {
    category: "receptor",
    system: "Melatonergic",
    description: 'Tells your body "it\'s time to sleep."',
    couplings: [{ signal: "melatonin", sign: 1 }],
  } as ReceptorDefinition,
  MT2: {
    category: "receptor",
    system: "Melatonergic",
    description: "Sets your internal clock.",
    couplings: [{ signal: "melatonin", sign: 1 }],
  } as ReceptorDefinition,
  Adenosine_A1: {
    category: "receptor",
    system: "Adenosinergic",
    description: "Makes you feel sleepy as it builds up during the day.",
    couplings: [
      { signal: "dopamine", sign: -1 },
      { signal: "acetylcholine", sign: -1 },
    ],
  } as ReceptorDefinition,
  Adenosine_A2a: {
    category: "receptor",
    system: "Adenosinergic",
    description: "Links sleep pressure to dopamine.",
    couplings: [{ signal: "dopamine", sign: -1 }],
  } as ReceptorDefinition,
  Adenosine_A2b: {
    category: "receptor",
    system: "Adenosinergic",
    description: "Involved in inflammation and blood vessel relaxation.",
    couplings: [],
  } as ReceptorDefinition,
  Adenosine_A3: {
    category: "receptor",
    system: "Adenosinergic",
    description: "Protects cells during low-oxygen conditions.",
    couplings: [],
  } as ReceptorDefinition,
  nAChR: {
    category: "receptor",
    system: "Cholinergic",
    description: "The nicotine receptor.",
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  mAChR_M1: {
    category: "receptor",
    system: "Cholinergic",
    description: "Critical for memory and learning.",
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  M1: {
    category: "receptor",
    system: "Cholinergic",
    description: "Alias for mAChR_M1.",
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  mAChR_M2: {
    category: "receptor",
    system: "Cholinergic",
    description: 'The heart\'s "slow down" receptor.',
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  M2: {
    category: "receptor",
    system: "Cholinergic",
    description: "Alias for mAChR_M2.",
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  M3: {
    category: "receptor",
    system: "Cholinergic",
    description: "Involved in smooth muscle contraction.",
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  M4: {
    category: "receptor",
    system: "Cholinergic",
    description: "Found in the CNS, involved in locomotor activity.",
    couplings: [{ signal: "acetylcholine", sign: 1 }],
  } as ReceptorDefinition,
  OXTR: {
    category: "receptor",
    system: "Oxytocinergic",
    description: "The primary oxytocin receptor.",
    couplings: [{ signal: "oxytocin", sign: 1 }],
  } as ReceptorDefinition,
  CB1: {
    category: "receptor",
    system: "Cannabinoid",
    description: "The brain's main cannabis receptor.",
    couplings: [{ signal: "endocannabinoid", sign: 1 }],
  } as ReceptorDefinition,
  CB2: {
    category: "receptor",
    system: "Cannabinoid",
    description: "Found mainly in immune cells.",
    couplings: [{ signal: "endocannabinoid", sign: 1 }],
  } as ReceptorDefinition,
  Mu_Opioid: {
    category: "receptor",
    system: "Opioid",
    description: "The primary target of opioid painkillers.",
    couplings: [{ signal: "endorphin", sign: 1 }],
  } as ReceptorDefinition,
  Kappa_Opioid: {
    category: "receptor",
    system: "Opioid",
    description: "Produces pain relief but with dysphoria.",
    couplings: [{ signal: "dynorphin", sign: 1 }],
  } as ReceptorDefinition,
};
