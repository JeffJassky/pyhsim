/**
 * RAW TARGET DEFINITIONS
 * This is the import-free Source of Truth for all pharmacological targets.
 * We define them here as a plain object to allow TypeScript to infer
 * the exact string keys for our union types.
 */
export const RAW_TARGETS = {
  // === RECEPTORS ===
  D1: {
    category: 'receptor',
    system: 'Dopaminergic',
    description: 'Helps with thinking clearly, coordinating movement, and feeling motivated. When dopamine activates this receptor, it generally "speeds up" brain activity in areas that handle planning and decision-making.',
    couplings: [{ signal: 'dopamine', sign: 1 }],
    adaptation: { k_up: 0.0008, k_down: 0.0015 }
  },
  D2: {
    category: 'receptor',
    system: 'Dopaminergic',
    description: 'Central to motivation, pleasure, and smooth movement. This is the main target of antipsychotic medications, and also where stimulants and Parkinson\'s drugs have major effects.',
    couplings: [{ signal: 'dopamine', sign: 1 }],
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  D3: {
    category: 'receptor',
    system: 'Dopaminergic',
    description: 'Found mainly in emotional brain regions. Influences mood, emotional responses, and some aspects of thinking. Plays a role in addiction and craving.',
    couplings: [{ signal: 'dopamine', sign: 1 }]
  },
  D4: {
    category: 'receptor',
    system: 'Dopaminergic',
    description: 'Important for attention, impulse control, and planning ahead. Some ADHD and antipsychotic medications work partly through this receptor.',
    couplings: [{ signal: 'dopamine', sign: 1 }]
  },
  D5: {
    category: 'receptor',
    system: 'Dopaminergic',
    description: 'Works similarly to D1 but is rarer. Supports memory formation and higher-level thinking. Less well understood than other dopamine receptors.',
    couplings: [{ signal: 'dopamine', sign: 1 }]
  },

  '5HT1A': {
    category: 'receptor',
    system: 'Serotonergic',
    description: 'A key calming receptor. Anti-anxiety medications like buspirone work here, and many antidepressants affect it. Activation generally reduces anxiety and promotes emotional stability.',
    couplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT1B': {
    category: 'receptor',
    system: 'Serotonergic',
    description: 'Acts as a "brake" on serotonin release and affects blood vessels. Migraine medications (triptans) target this receptor to constrict dilated blood vessels in the brain.',
    couplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT2A': {
    category: 'receptor',
    system: 'Serotonergic',
    description: 'Shapes how we perceive and interpret the world. This is the main target of psychedelics like LSD and psilocybin. Also involved in sleep, mood, and creative thinking.',
    couplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT2C': {
    category: 'receptor',
    system: 'Serotonergic',
    description: 'Influences appetite, mood, and anxiety. Many antidepressants and antipsychotics affect this receptor, which is why they can cause weight changes as a side effect.',
    couplings: [{ signal: 'serotonin', sign: 1 }]
  },
  '5HT3': {
    category: 'receptor',
    system: 'Serotonergic',
    description: 'The nausea receptor. Unlike other serotonin receptors, this one acts quickly like a switch. Blocking it is how anti-nausea medications like ondansetron (Zofran) work.',
    couplings: [{ signal: 'serotonin', sign: 1 }]
  },

  GABA_A: {
    category: 'receptor',
    system: 'GABAergic',
    description: 'The brain\'s main "calm down" switch. Benzodiazepines (Xanax, Valium), sleep aids, and alcohol all work by enhancing this receptor. Produces rapid sedation and anxiety relief.',
    couplings: [{ signal: 'gaba', sign: 1 }]
  },
  GABA_B: {
    category: 'receptor',
    system: 'GABAergic',
    description: 'A slower, longer-lasting calming receptor. Baclofen (a muscle relaxant) works here. Produces more gradual relaxation effects than GABA-A, particularly for muscle tension.',
    couplings: [{ signal: 'gaba', sign: 1 }]
  },

  NMDA: {
    category: 'receptor',
    system: 'Glutamatergic',
    description: 'Critical for learning and forming new memories. Ketamine and memantine (used for Alzheimer\'s) block this receptor. Too much activity here can damage neurons.',
    couplings: [{ signal: 'glutamate', sign: 1 }]
  },
  AMPA: {
    category: 'receptor',
    system: 'Glutamatergic',
    description: 'The brain\'s main "go" signal for fast communication between neurons. Works instantly, unlike NMDA which requires more conditions to activate.',
    couplings: [{ signal: 'glutamate', sign: 1 }]
  },
  mGluR: {
    category: 'receptor',
    system: 'Glutamatergic',
    description: 'Fine-tunes how excitable neurons are. Works more slowly than AMPA/NMDA, acting like a volume knob rather than an on/off switch. Emerging target for anxiety and depression treatments.',
    couplings: [{ signal: 'glutamate', sign: 1 }]
  },

  Alpha1: {
    category: 'receptor',
    system: 'Adrenergic',
    description: 'Tightens blood vessels and raises blood pressure. Blood pressure medications like prazosin block this receptor. Also why decongestants can raise blood pressure.',
    couplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Alpha2: {
    category: 'receptor',
    system: 'Adrenergic',
    description: 'Acts as a "brake" on the stress response. Clonidine and guanfacine (used for ADHD and blood pressure) work here. Activation lowers heart rate, blood pressure, and anxiety.',
    couplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Beta1: {
    category: 'receptor',
    system: 'Adrenergic',
    description: 'The heart\'s "speed up" receptor. Makes the heart beat faster and stronger. Beta-blockers (like metoprolol) block this to treat high blood pressure, anxiety tremors, and heart conditions.',
    couplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Beta2: {
    category: 'receptor',
    system: 'Adrenergic',
    description: 'Opens airways and relaxes blood vessels. Asthma inhalers (albuterol) activate this receptor to help breathing. Also causes the shaky feeling from too much caffeine or stimulants.',
    couplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },
  Beta_Adrenergic: {
    category: 'receptor',
    system: 'Adrenergic',
    description: 'Combined beta receptor effects on the heart and lungs. Represents the overall "fight or flight" response to adrenaline—faster heart, open airways, increased alertness.',
    couplings: [
      { signal: 'norepi', sign: 1 },
      { signal: 'adrenaline', sign: 1 }
    ]
  },

  H1: {
    category: 'receptor',
    system: 'Histaminergic',
    description: 'Drives allergic reactions and keeps you awake. Antihistamines like Benadryl block this, which is why they cause drowsiness. Also why allergies can make you feel foggy.',
    couplings: [{ signal: 'histamine', sign: 1 }]
  },
  H2: {
    category: 'receptor',
    system: 'Histaminergic',
    description: 'Controls stomach acid production. Medications like famotidine (Pepcid) and ranitidine block this receptor to treat heartburn and ulcers.',
    couplings: [{ signal: 'histamine', sign: 1 }]
  },
  H3: {
    category: 'receptor',
    system: 'Histaminergic',
    description: 'The brain\'s histamine thermostat—it regulates how much histamine gets released. Blocking it increases alertness, which is how some wakefulness medications work.',
    couplings: [{ signal: 'histamine', sign: 1 }]
  },

  OX1R: {
    category: 'receptor',
    system: 'Orexinergic',
    description: 'Promotes wakefulness and appetite. Part of the system that keeps you alert and interested in food. People with narcolepsy have damage to this system.',
    couplings: [{ signal: 'orexin', sign: 1 }]
  },
  OX2R: {
    category: 'receptor',
    system: 'Orexinergic',
    description: 'The main wakefulness receptor. Sleep medications like suvorexant (Belsomra) block this to help you fall asleep. Especially important for staying awake during the day.',
    couplings: [{ signal: 'orexin', sign: 1 }]
  },

  MT1: {
    category: 'receptor',
    system: 'Melatonergic',
    description: 'Tells your body "it\'s time to sleep." Melatonin supplements and medications like ramelteon activate this receptor to promote drowsiness.',
    couplings: [{ signal: 'melatonin', sign: 1 }]
  },
  MT2: {
    category: 'receptor',
    system: 'Melatonergic',
    description: 'Sets your internal clock. Helps your body sync up with day and night cycles. Important for jet lag recovery and shift work adjustment.',
    couplings: [{ signal: 'melatonin', sign: 1 }]
  },

  Adenosine_A1: {
    category: 'receptor',
    system: 'Adenosinergic',
    description: 'Makes you feel sleepy as it builds up during the day. Caffeine works mainly by blocking this receptor, which is why coffee makes you feel more awake and alert.',
    couplings: [
      { signal: 'dopamine', sign: -1 },
      { signal: 'acetylcholine', sign: -1 }
    ]
  },
  Adenosine_A2a: {
    category: 'receptor',
    system: 'Adenosinergic',
    description: 'Links sleep pressure to dopamine. Caffeine also blocks this receptor. Located in movement-control brain areas, which is why caffeine can help Parkinson\'s symptoms.',
    couplings: [{ signal: 'dopamine', sign: -1 }]
  },
  Adenosine_A2b: {
    category: 'receptor',
    system: 'Adenosinergic',
    description: 'Involved in inflammation and blood vessel relaxation. Less important for brain effects than A1 and A2a. Plays a role in asthma and immune responses.',
    couplings: []
  },
  Adenosine_A3: {
    category: 'receptor',
    system: 'Adenosinergic',
    description: 'Protects cells during low-oxygen conditions and modulates immune function. Less relevant to everyday alertness; more important in disease states.',
    couplings: []
  },

  nAChR: {
    category: 'receptor',
    system: 'Cholinergic',
    description: 'The nicotine receptor. Activates quickly to enhance focus, memory, and alertness. Nicotine from smoking or patches works here. Also controls muscle movement.',
    couplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
  mAChR_M1: {
    category: 'receptor',
    system: 'Cholinergic',
    description: 'Critical for memory and learning. Alzheimer\'s drugs try to boost activity here. Blocking it (like with Benadryl) can cause confusion, especially in older adults.',
    couplings: [{ signal: 'acetylcholine', sign: 1 }]
  },
  mAChR_M2: {
    category: 'receptor',
    system: 'Cholinergic',
    description: 'The heart\'s "slow down" receptor. Activating it lowers heart rate. This is part of the "rest and digest" system that calms the body after stress.',
    couplings: [{ signal: 'acetylcholine', sign: 1 }]
  },

  // === TRANSPORTERS ===
  DAT: {
    category: 'transporter',
    system: 'Dopaminergic',
    description: 'The dopamine vacuum cleaner—sucks dopamine back into neurons after release. Cocaine and amphetamines block or reverse this, flooding the brain with dopamine.',
    primarySignal: 'dopamine',
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  NET: {
    category: 'transporter',
    system: 'Norepinephrinergic',
    description: 'Clears norepinephrine (adrenaline\'s cousin) from synapses. Blocked by SNRIs (like Effexor), atomoxetine (Strattera), and cocaine. Blocking it increases alertness and focus.',
    primarySignal: 'norepi',
    adaptation: { k_up: 0.001, k_down: 0.002 }
  },
  SERT: {
    category: 'transporter',
    system: 'Serotonergic',
    description: 'The main target of SSRI antidepressants (Prozac, Zoloft, etc.). Blocking it keeps serotonin active longer, which over weeks helps improve mood and reduce anxiety.',
    primarySignal: 'serotonin',
    adaptation: { k_up: 0.0008, k_down: 0.0015 }
  },
  GAT1: {
    category: 'transporter',
    system: 'GABAergic',
    description: 'Removes GABA from synapses. Blocking it (like with tiagabine) keeps GABA active longer, producing calming and anti-seizure effects.',
    primarySignal: 'gaba'
  },
  GLT1: {
    category: 'transporter',
    system: 'Glutamatergic',
    description: 'Cleans up glutamate to prevent brain overstimulation. Essential for brain health—when it fails, excess glutamate can damage neurons (seen in strokes and some brain diseases).',
    primarySignal: 'glutamate'
  },

  // === ENZYMES ===
  MAO_A: {
    category: 'enzyme',
    system: 'Monoamine',
    description: 'Breaks down serotonin, norepinephrine, and dopamine. MAO inhibitor antidepressants block this enzyme. Requires dietary restrictions because it also breaks down tyramine in aged foods.',
    substrates: ['serotonin', 'norepi', 'dopamine'],
    baselineActivity: 1.0
  },
  MAO_B: {
    category: 'enzyme',
    system: 'Monoamine',
    description: 'Mainly breaks down dopamine in the brain. Parkinson\'s medications like selegiline block this to preserve dopamine. Safer than MAO-A inhibitors regarding food interactions.',
    substrates: ['dopamine'],
    baselineActivity: 1.0
  },
  COMT: {
    category: 'enzyme',
    system: 'Monoamine',
    description: 'Degrades dopamine, norepinephrine, and adrenaline, especially in the prefrontal cortex. Genetic variations affect how quickly you clear these chemicals, influencing stress response and focus.',
    substrates: ['dopamine', 'norepi', 'adrenaline'],
    baselineActivity: 1.0
  },
  AChE: {
    category: 'enzyme',
    system: 'Cholinergic',
    description: 'Breaks down acetylcholine very rapidly. Alzheimer\'s drugs (donepezil, rivastigmine) block this to boost acetylcholine for better memory. Also the target of nerve agents.',
    substrates: ['acetylcholine'],
    baselineActivity: 1.0
  },
  DAO: {
    category: 'enzyme',
    system: 'Histaminergic',
    description: 'Breaks down histamine from food. People with low DAO activity may experience headaches, flushing, or digestive issues after eating aged cheeses, wine, or fermented foods.',
    substrates: ['histamine'],
    baselineActivity: 1.0
  },

  // === AUXILIARY POOLS ===
  adenosinePressure: {
    category: 'auxiliary',
    system: 'Sleep',
    description: 'Your "sleep debt"—builds up the longer you stay awake and makes you increasingly sleepy. Cleared during sleep. Caffeine masks it but doesn\'t reduce it.'
  },
  dopamineVesicles: {
    category: 'auxiliary',
    system: 'Capacity',
    description: 'Your dopamine reserves ready to be released. Gets depleted with sustained stimulant use or stress. Needs time and rest to refill, which is why stimulants stop working as well with overuse.'
  },
  norepinephrineVesicles: {
    category: 'auxiliary',
    system: 'Capacity',
    description: 'Your stored adrenaline-like chemicals ready for the next stressor. Chronic stress or stimulant use depletes these reserves, contributing to burnout and fatigue.'
  },
  serotoninPrecursor: {
    category: 'auxiliary',
    system: 'Capacity',
    description: 'Building blocks for making serotonin, including 5-HTP and tryptophan from protein. Low levels can limit serotonin production even if everything else is working properly.'
  },
  gabaPool: {
    category: 'auxiliary',
    system: 'Capacity',
    description: 'Your reserves for making GABA, the brain\'s main calming chemical. Can be supported by B vitamins and certain amino acids. Low levels may contribute to anxiety.'
  },
  glutamatePool: {
    category: 'auxiliary',
    system: 'Capacity',
    description: 'Resources for making glutamate, the brain\'s main excitatory chemical. Usually abundant, but balance with GABA is important for brain health.'
  },
  hepaticGlycogen: {
    category: 'auxiliary',
    system: 'Metabolic',
    description: 'Sugar stored in your liver that maintains blood glucose between meals. Running low causes the shaky, irritable feeling of low blood sugar. Refilled by eating carbohydrates.'
  },
  insulinAction: {
    category: 'auxiliary',
    system: 'Metabolic',
    description: 'How well your cells respond to insulin. Reduced by poor sleep, chronic stress, and inactivity. When low, blood sugar stays elevated longer after meals.'
  },
  cortisolIntegral: {
    category: 'auxiliary',
    system: 'Stress',
    description: 'Your cumulative stress exposure over time. High levels indicate chronic stress, which can impair memory, immunity, and metabolism. Rest and recovery help bring it down.'
  },
  crhPool: {
    category: 'auxiliary',
    system: 'Stress',
    description: 'The brain\'s stress alarm signal. Triggers the cascade leading to cortisol release. Elevated in chronic anxiety and depression. Target of some experimental treatments.'
  },
  ghReserve: {
    category: 'auxiliary',
    system: 'Growth',
    description: 'Growth hormone ready to be released, mainly during deep sleep. Important for tissue repair, muscle maintenance, and metabolism. Declines with age and poor sleep.'
  },
  bdnfExpression: {
    category: 'auxiliary',
    system: 'Growth',
    description: 'Production of BDNF, a protein that helps brain cells grow and form new connections. Increased by exercise, learning, and some antidepressants. Essential for mental sharpness and resilience.'
  }
} as const;
