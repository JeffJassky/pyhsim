import type {
  BaselineContext,
  BaselineFn,
  BaselineMap,
  BaselineSpec,
  CouplingMap,
  DelaySpec,
  Minute,
  ResponseSpec,
  Signal,
  SignalDef,
  SignalGroup,
} from '@/types';
import { DEFAULT_SUBJECT, getMenstrualHormones } from './subject';

const MINUTES_IN_DAY = 24 * 60;
const minutes = (hours: number) => hours * 60;

const gaussian = (minute: Minute, centerHours: number, widthMinutes: number) =>
  Math.exp(-Math.pow((minute - minutes(centerHours)) / widthMinutes, 2));

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const wrapMinute = (minute: Minute) => {
  let m = minute % MINUTES_IN_DAY;
  if (m < 0) m += MINUTES_IN_DAY;
  return m as Minute;
};

const getDayOfCycle = (minute: Minute, cycleLength: number, startDay: number = 0) => {
  // Assuming minute 0 is start of simulation.
  // We need a way to offset this if the user starts mid-cycle.
  // For now, assuming sim start = cycle day 0.
  const day = Math.floor(minute / MINUTES_IN_DAY) + startDay; 
  return day % cycleLength;
};

const fnBaseline = (fn: (minute: Minute, ctx: BaselineContext) => number): BaselineSpec => ({
  kind: 'function',
  fn,
});

const fixedDelay = (minutesDelay?: number): DelaySpec | undefined =>
  minutesDelay && minutesDelay > 0 ? { kind: 'fixed', minutes: minutesDelay } : undefined;

const linear = (gain: number): ResponseSpec => ({ kind: 'linear', gain });

const DEFAULT_SEMANTICS: Record<SignalGroup, SignalDef['semantics']> = {
  SCN: { unit: 'a.u.', normalized: { mean: 0.5, sd: 0.2 }, isLatent: true },
  Neuro: { unit: 'a.u.', normalized: { mean: 0.5, sd: 0.2 }, isLatent: true },
  Endocrine: { unit: 'pg/mL', normalized: { mean: 0.5, sd: 0.2 } },
  Metabolic: { unit: 'a.u.', normalized: { mean: 0.5, sd: 0.2 } },
  Autonomic: { unit: 'a.u.', normalized: { mean: 0.5, sd: 0.2 } },
  Subjective: { unit: 'a.u.', normalized: { mean: 0.5, sd: 0.2 }, isLatent: true },
  Organ: { unit: 'a.u.', normalized: { mean: 0.5, sd: 0.2 }, isLatent: true },
};

export const SIGNAL_DEFS: SignalDef[] = [
  {
    key: 'melatonin',
    label: 'Melatonin',
    group: 'SCN',
    semantics: DEFAULT_SEMANTICS.SCN,
    description: {
      physiology: 'Pineal hormone rising after dusk to broadcast biological night and align peripheral clocks.',
      application: 'Track whether light hygiene or supplementation is shifting sleep onset / circadian phase.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const rise = sigmoid((m - minutes(15)) / 30);
      const fall = sigmoid((m - minutes(23.5)) / 25);
      return Math.max(0, rise - fall);
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'vasopressin',
    label: 'Vasopressin',
    group: 'SCN',
    semantics: DEFAULT_SEMANTICS.SCN,
    description: {
      physiology: 'SCN shell neurons release AVP to keep clock cells phase-locked and to gate downstream endocrine outputs.',
      application: 'Watch AVP when assessing circadian robustness against travel, shift work, or dehydration.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const couple = gaussian(m, 8, 260);
      const nightRise = sigmoid((m - minutes(16.5)) / 45);
      return 0.18 + 0.35 * couple + 0.35 * nightRise;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'vip',
    label: 'VIP',
    group: 'SCN',
    semantics: DEFAULT_SEMANTICS.SCN,
    description: {
      physiology: 'VIP neurons in the SCN core translate retinal light input into synchronized clock gene expression.',
      application: 'Morning light therapy should sharpen VIP peaks; use this to validate zeitgeber timing.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const day = gaussian(m, 9, 300);
      const eveningSuppress = sigmoid((m - minutes(15)) / 35);
      return 0.2 + 0.5 * day - 0.25 * eveningSuppress;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'dopamine',
    label: 'Dopamine',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Midbrain dopamine tracks reward prediction and energizes goal-directed behavior.',
      application: 'Map stimulant use, novelty, or movement to dopamine tone to avoid overdriving motivation.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const morningDrive = gaussian(m, 3.5, 160);
      const afternoonPlateau = gaussian(m, 6.5, 320);
      const eveningDrop = gaussian(m, 16, 200);
      return 0.2 + 0.45 * morningDrive + 0.2 * afternoonPlateau - 0.15 * eveningDrop;
    }),
    couplings: [
      {
        source: 'cortisol',
        mapping: linear(0.05),
        description: 'Moderate cortisol supports dopaminergic tone through catecholamine availability.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'serotonin',
    label: 'Serotonin',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Raphe serotonin integrates light exposure, carbohydrate intake, and mood stability.',
      application: 'Use to gauge whether daylight, meals, or SSRIs are creating the calm/upbeat baseline you want.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const lateMorning = gaussian(m, 5, 260);
      const afternoon = gaussian(m, 9, 300);
      return 0.2 + 0.25 * (lateMorning + afternoon);
    }),
    couplings: [
      {
        source: 'vip',
        mapping: linear(0.12),
        description: 'SCN VIP input stabilizes raphe serotonin phase.',
      },
      {
        source: 'cortisol',
        mapping: linear(-0.06),
        description: 'Elevated cortisol dampens serotonin synthesis via tryptophan shunting.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'acetylcholine',
    label: 'Acetylcholine',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Basal-forebrain cholinergic tone sharpens attention and supports REM consolidation.',
      application: 'Track focus blocks, nicotine, or meditation to see how they sustain precision without overloading.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const dawnPriming = sigmoid((m - minutes(1.5)) / 35);
      const middayPlateau = gaussian(m, 6.5, 320);
      const eveningDrop = sigmoid((m - minutes(14.5)) / 45);
      const tone = 0.25 + 0.45 * dawnPriming + 0.35 * middayPlateau - 0.3 * eveningDrop;
      return Math.max(0.05, tone);
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'gaba',
    label: 'GABA',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Inhibitory GABA tone accumulates with sleep pressure and damps sympathetic overdrive.',
      application: 'Check whether relaxation, breathwork, or evening routines are lifting GABA enough for sleep.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const evening = sigmoid((m - minutes(14)) / 45);
      const night = sigmoid((m - minutes(17)) / 30);
      return 0.15 + 0.5 * (evening + night);
    }),
    couplings: [
      {
        source: 'adrenaline',
        mapping: linear(-0.07),
        description: 'GABA-mediated parasympathetic tone restrains adrenergic surges.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'norepi',
    label: 'Norepinephrine',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Locus coeruleus norepinephrine sets sympathetic vigilance and readiness to respond.',
      application: 'Use to titrate stimulant dosage or monitor stress spikes from work, caffeine, or alarms.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const alertness = gaussian(m, 2, 120) + 0.4 * gaussian(m, 7, 200);
      return 0.15 + 0.35 * alertness;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'histamine',
    label: 'Histamine',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'TMN histamine neurons maintain wake maintenance and cortical activation.',
      application: 'Anti-histamines, allergy load, or bright light show up here—useful for troubleshooting grogginess.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const wake = sigmoid((m - minutes(1)) / 35);
      const day = gaussian(m, 8, 300);
      const nightFall = sigmoid((m - minutes(15)) / 40);
      const tone = 0.15 + 0.45 * wake + 0.35 * day - 0.3 * nightFall;
      return Math.max(0.02, tone);
    }),
    couplings: [
      {
        source: 'melatonin',
        mapping: linear(-0.22),
        delay: fixedDelay(20),
        description: 'Nocturnal melatonin suppresses TMN histamine neurons to permit sleep maintenance.',
      },
      {
        source: 'vip',
        mapping: linear(0.12),
        description: 'VIP signaling from the SCN core excites histaminergic tone to reinforce daytime wakefulness.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'orexin',
    label: 'Orexin',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Hypothalamic orexin links energy status and feeding cues to sustained wake drive.',
      application: 'See how sleep, fasting, or carbs influence orexin so you can balance alertness with appetite.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const wakeDrive = sigmoid((m - minutes(1.8)) / 30);
      const feedingCue = gaussian(m, 4.5, 160) + 0.6 * gaussian(m, 8.5, 280);
      const sleepPressure = sigmoid((m - minutes(15)) / 45);
      const tone = 0.2 + 0.4 * wakeDrive + 0.25 * feedingCue - 0.35 * sleepPressure;
      return Math.max(0.03, tone);
    }),
    couplings: [
      {
        source: 'melatonin',
        mapping: linear(-0.28),
        delay: fixedDelay(30),
        description: 'Melatonin inhibits hypothalamic orexin neurons, lowering wake pressure at night.',
      },
      {
        source: 'ghrelin',
        mapping: linear(0.1),
        description: 'Ghrelin stimulates orexin to couple hunger with arousal.',
      },
      {
        source: 'dopamine',
        mapping: linear(0.06),
        description: 'Mesolimbic dopamine reinforces orexin firing during motivated states.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'glutamate',
    label: 'Glutamate',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Primary excitatory transmitter carrying cortical throughput and learning plasticity.',
      application: 'High glutamate reflects cognitively intense work or stress; use to pace deep work vs. recovery blocks.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const focusBand = gaussian(m, 7, 260);
      const eveningDecline = gaussian(m, 14, 200);
      const tone = 0.25 + 0.55 * focusBand - 0.25 * eveningDecline;
      return Math.max(0.05, tone);
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'endocannabinoid',
    label: 'Endocannabinoid Tone',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Endocannabinoids act as retrograde messengers buffering stress, pain, and appetite signals.',
      application: 'Exercise, fasting, or cannabis use alters this curve—track to understand cravings and calm responses.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const afternoonEase = sigmoid((m - minutes(10.5)) / 55);
      const nightRise = sigmoid((m - minutes(15.5)) / 35);
      return 0.12 + 0.4 * afternoonEase + 0.4 * nightRise;
    }),
    couplings: [
      {
        source: 'serotonin',
        mapping: linear(0.05),
        description: 'Serotonergic input modulates endocannabinoid tone during mood regulation.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'cortisol',
    label: 'Cortisol',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'HPA-axis cortisol mobilizes glucose, raises blood pressure, and entrains peripheral clocks.',
      application: 'Ensure the peak happens early and drops by evening to protect sleep and metabolic health.',
    },
    display: { tendency: 'lower' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const morningPeak = gaussian(m, 0.5, 40);
      const middayStress = gaussian(m, 9, 240);
      return 0.2 + 0.8 * morningPeak + 0.2 * middayStress;
    }),
    couplings: [
      {
        source: 'orexin',
        mapping: linear(0.2),
        description: 'Orexin neurons activate the HPA axis, boosting ACTH and cortisol.',
      },
      {
        source: 'melatonin',
        mapping: linear(-0.14),
        delay: fixedDelay(45),
        description: 'Melatonin feeds back on the HPA axis, suppressing nocturnal cortisol.',
      },
      {
        source: 'gaba',
        mapping: linear(-0.09),
        description: 'GABAergic tone inhibits CRH release, blunting cortisol bursts.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'adrenaline',
    label: 'Adrenaline',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Adrenal medulla epinephrine delivers acute fight-or-flight energy and bronchodilation.',
      application: 'Ensure workouts or cold exposure create sharp spikes with clean recoveries instead of chronic elevation.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => 0.1 + 0.25 * gaussian(wrapMinute(minute), 2, 120)),
    couplings: [
      {
        source: 'orexin',
        mapping: linear(0.14),
        description: 'Orexin drives sympathetic preganglionic neurons, elevating epinephrine.',
      },
      {
        source: 'dopamine',
        mapping: linear(0.08),
        description: 'Dopamine facilitates adrenal medulla output during reward-driven arousal.',
      },
      {
        source: 'gaba',
        mapping: linear(-0.07),
        description: 'GABA-mediated parasympathetic tone restrains adrenergic surges.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'insulin',
    label: 'Insulin',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Pancreatic beta-cell insulin clears glucose into muscle, liver, and fat stores.',
      application: 'Use to test meal composition, exercise, or meds that improve insulin sensitivity and flatten peaks.',
    },
    display: { tendency: 'neutral' },
    baseline: fnBaseline(() => 0.1),
    couplings: [
      {
        source: 'orexin',
        mapping: linear(0.1),
        description: 'Orexin enhances vagal drive to beta cells, boosting insulin.',
      },
      {
        source: 'glucagon',
        mapping: linear(-0.11),
        description: 'Glucagon opposes insulin secretion through intra-islet feedback.',
      },
      {
        source: 'dopamine',
        mapping: linear(0.05),
        description: 'Pancreatic dopamine augments first-phase insulin release.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'glucagon',
    label: 'Glucagon',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Alpha-cell glucagon releases stored glucose and stimulates ketogenesis during fasting.',
      application: 'Extended fasting or endurance sessions should elevate glucagon; use this to plan refuel windows.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const nocturnal = gaussian(m, 23, 160) + 0.8 * gaussian(m, 1.5, 220);
      const daytimeSuppression = gaussian(m, 7.5, 320);
      const tone = 0.25 + 0.35 * nocturnal - 0.18 * daytimeSuppression;
      return Math.max(0.05, tone);
    }),
    couplings: [
      {
        source: 'insulin',
        mapping: linear(-0.11),
        description: 'Paracrine insulin suppresses alpha-cell glucagon.',
      },
      {
        source: 'cortisol',
        mapping: linear(0.08),
        description: 'Cortisol promotes gluconeogenesis and glucagon secretion during stress.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'ghrelin',
    label: 'Ghrelin',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Stomach-derived ghrelin pulses ahead of meals to trigger hunger and growth hormone release.',
      application: 'Time meals, protein, or fiber to blunt unwanted appetite spikes shown here.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const breakfast = gaussian(m, 3, 90);
      const lunch = gaussian(m, 7, 90);
      const dinner = gaussian(m, 12, 120);
      return 0.2 + 0.35 * (breakfast + lunch + dinner);
    }),
    couplings: [
      {
        source: 'leptin',
        mapping: linear(-0.05),
        description: 'Adipose leptin suppresses gastric ghrelin secretion to signal fullness.',
      },
      {
        source: 'insulin',
        mapping: linear(-0.04),
        description: 'Post-meal insulin blunts ghrelin release for 2–3 hours.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'glp1',
    label: 'GLP-1',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Gut incretin GLP-1 enhances insulin secretion and slows gastric emptying to prolong satiety.',
      application: 'Fiber, protein, or GLP-1 agonists should raise this curve—useful when coaching appetite control.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const bk = gaussian(m, 3.2, 70);
      const ln = gaussian(m, 7.2, 80);
      const dn = gaussian(m, 12.5, 90);
      const tone = 0.08 + 0.45 * (bk + 0.9 * ln + 0.8 * dn);
      return Math.min(0.9, tone);
    }),
    couplings: [
      {
        source: 'insulin',
        mapping: linear(0.05),
        description: 'Beta-cell activity correlates with incretin release during nutrient intake.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'leptin',
    label: 'Leptin',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Adipose leptin reports long-term energy sufficiency to the hypothalamus.',
      application: 'Sleep restriction or crash dieting should not chronically suppress leptin if you want stable metabolism.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => 0.2 + 0.15 * sigmoid((wrapMinute(minute) - minutes(10)) / 120)),
    couplings: [
      {
        source: 'insulin',
        mapping: linear(0.08),
        delay: fixedDelay(60),
        description: 'Post-prandial insulin stimulates adipocytes to raise leptin expression.',
      },
      {
        source: 'glucagon',
        mapping: linear(-0.04),
        description: 'Glucagon-driven lipolysis transiently lowers leptin signal.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'thyroid',
    label: 'Thyroid Tone',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Thyroid hormones set basal metabolic rate and temperature compensation.',
      application: 'Monitor under chronic stress or dieting to avoid metabolic slowdown.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute, ctx) => {
      const m = wrapMinute(minute);
      const ramp = sigmoid((m - minutes(2.5)) / 80);
      const midday = gaussian(m, 7.5, 360);
      const nightDip = gaussian(m, 16.5, 300);
      let tone = 0.22 + 0.4 * ramp + 0.35 * midday - 0.25 * nightDip;
      
      // Scale by metabolic capacity if available (default 1.0)
      const scale = ctx.physiology?.metabolicCapacity ?? 1.0;
      tone *= scale;

      return Math.max(0.05, tone);
    }),
    couplings: [
      {
        source: 'cortisol',
        mapping: linear(-0.05),
        description: 'Chronic cortisol suppresses TSH, lowering thyroid tone.',
      },
      {
        source: 'leptin',
        mapping: linear(0.06),
        description: 'Adequate leptin supports TRH/TSH drive to the thyroid.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'oxytocin',
    label: 'Oxytocin',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Hypothalamic oxytocin fosters bonding, trust, and parasympathetic activation.',
      application: 'Social rituals, skin contact, or breathwork should raise oxytocin when emotional regulation is the goal.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const social = gaussian(m, 10, 260);
      const evening = sigmoid((m - minutes(14.5)) / 40);
      return 0.1 + 0.25 * social + 0.35 * evening;
    }),
    couplings: [
      {
        source: 'endocannabinoid',
        mapping: linear(0.05),
        description: 'Endocannabinoid tone modulates oxytocin release during stress buffering.',
      },
      {
        source: 'serotonin',
        mapping: linear(0.08),
        description: 'Serotonin facilitates oxytocin release in social bonding contexts.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'prolactin',
    label: 'Prolactin',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Pituitary prolactin surges during sleep and caregiving, supporting immune balance and recovery.',
      application: 'Evening relaxation, heat, or intimacy sessions should allow the nightly prolactin crest to form.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const prep = sigmoid((m - minutes(13.5)) / 50);
      const sleepPulse = gaussian(m, 18, 120) + 0.8 * gaussian(m, 23.5, 200);
      return 0.12 + 0.35 * prep + 0.4 * sleepPulse;
    }),
    couplings: [
      {
        source: 'gaba',
        mapping: linear(0.09),
        description: 'GABAergic inhibition of tuberoinfundibular dopamine disinhibits prolactin.',
      },
      {
        source: 'dopamine',
        mapping: linear(-0.09),
        description: 'Hypothalamic dopamine tonically suppresses prolactin secretion.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'growthHormone',
    label: 'Growth Hormone',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Growth hormone pulses shortly after sleep onset to drive protein synthesis and tissue repair.',
      application: 'Hard training and good sleep hygiene should amplify this peak—use to evaluate recovery plans.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const sleepOnset = gaussian(m, 18.5, 120);
      const rebound = gaussian(m, 22.5, 90);
      const tone = 0.08 + 0.65 * (sleepOnset + 0.6 * rebound);
      return Math.min(1, tone);
    }),
    couplings: [
      {
        source: 'gaba',
        mapping: linear(0.16),
        description: 'Sleep-related GABA increases GHRH release and growth hormone pulses.',
      },
      {
        source: 'ghrelin',
        mapping: linear(0.09),
        description: 'Ghrelin directly stimulates somatotrophs, boosting growth hormone.',
      },
      {
        source: 'cortisol',
        mapping: linear(-0.12),
        description: 'High cortisol suppresses growth hormone secretion.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'glucose',
    label: 'Glucose',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Glucose tracks immediate carbohydrate availability for the brain and muscles.',
      application: 'Make sure fueling or fasting tactics keep glucose within the range that matches your goals.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline(() => 0.1),
    couplings: [
      {
        source: 'cortisol',
        mapping: linear(0.12),
        description: 'Cortisol stimulates hepatic gluconeogenesis, raising glucose.',
      },
      {
        source: 'adrenaline',
        mapping: linear(0.09),
        description: 'Adrenaline drives glycogenolysis, elevating glucose acutely.',
      },
      {
        source: 'insulin',
        mapping: linear(-0.18),
        description: 'Insulin clears glucose into tissues, lowering circulating levels.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'ketone',
    label: 'Ketone / FFA',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Ketone and free fatty acid levels reflect reliance on fat oxidation during fasting or low insulin states.',
      application: 'Use to confirm fasting, low-carb diets, or cold exposure are shifting you toward fat metabolism.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const overnight = gaussian(m, 19.5, 400) + gaussian(m, 22.5, 260);
      const daySuppression = gaussian(m, 7.5, 300);
      const tone = 0.15 + 0.4 * overnight - 0.25 * daySuppression;
      return Math.max(0.02, tone);
    }),
    couplings: [
      {
        source: 'glucagon',
        mapping: linear(0.13),
        description: 'Glucagon promotes lipolysis and ketogenesis during fasting.',
      },
      {
        source: 'insulin',
        mapping: linear(-0.11),
        description: 'Insulin suppresses ketone production by inhibiting lipolysis.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'energy',
    label: 'Energy',
    group: 'Subjective',
    semantics: DEFAULT_SEMANTICS.Subjective,
    description: {
      physiology: 'Composite readout of endocrine and neurotransmitter cues that create perceived energy capacity.',
      application: 'Tie subjectively productive hours to the objective drivers shown here to design better schedules.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute, ctx) => {
      const m = wrapMinute(minute);
      const morning = gaussian(m, 2.5, 180);
      const afternoon = gaussian(m, 6, 260);
      const slump = gaussian(m, 14, 200);
      const tone = 0.3 + 0.4 * (morning + afternoon) - 0.15 * slump;
      
      const metabolicScale = ctx.physiology?.metabolicCapacity ?? 1.0;
      return tone * (0.8 + 0.2 * metabolicScale);
    }),
    couplings: [
      {
        source: 'cortisol',
        mapping: linear(0.08),
        description: 'Moderate cortisol supplies glucose for perceived energy.',
      },
      {
        source: 'thyroid',
        mapping: linear(0.13),
        description: 'Thyroid-mediated metabolic rate boosts systemic energy availability.',
      },
      {
        source: 'dopamine',
        mapping: linear(0.05),
        description: 'Dopamine contributes to subjective drive and vigor.',
      },
      {
        source: 'melatonin',
        mapping: linear(-0.06),
        description: 'Melatonin signals biological night, pulling down perceived energy.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'vagal',
    label: 'Vagal Tone',
    group: 'Autonomic',
    semantics: DEFAULT_SEMANTICS.Autonomic,
    description: {
      physiology: 'Vagal tone expresses parasympathetic braking on the heart and organs via the vagus nerve.',
      application: 'Breathwork, HRV training, or calm evenings should lift vagal tone for better recovery.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute) => {
      const m = wrapMinute(minute);
      const parasym = sigmoid((m - minutes(13)) / 60);
      const drop = gaussian(m, 1, 60);
      return 0.4 + 0.35 * parasym - 0.15 * drop;
    }),
    couplings: [
      {
        source: 'oxytocin',
        mapping: linear(0.11),
        description: 'Oxytocin enhances parasympathetic vagal tone during bonding/relaxation.',
      },
      {
        source: 'gaba',
        mapping: linear(0.13),
        description: 'GABA-mediated inhibition promotes vagal dominance.',
      },
      {
        source: 'adrenaline',
        mapping: linear(-0.13),
        description: 'Adrenergic surges withdraw vagal tone.',
      },
      {
        source: 'cortisol',
        mapping: linear(-0.09),
        description: 'Chronic cortisol diminishes vagal recovery capacity.',
      },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'testosterone',
    label: 'Testosterone',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Androgen supporting muscle, motivation, and erythropoiesis.',
      application: 'Use as a low-frequency trend (labs) rather than acute chart.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      
      // Age decline: ~1% per year after 30
      const ageFactor = Math.max(0.5, 1 - Math.max(0, subject.age - 30) * 0.01);

      let val = 0;
      if (subject.sex === 'male') {
         // Diurnal rhythm for males: peak in morning
         const m = wrapMinute(minute);
         const circadian = 0.4 + 0.2 * gaussian(m, 8, 240);
         val = circadian * ageFactor;
      } else {
        // Lower, steady baseline for females
        val = 0.05 * ageFactor;
      }
      // console.log(`[Baseline:testosterone] ${minute}min -> ${val.toFixed(3)} (sex: ${subject.sex})`);
      return val;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'estrogen',
    label: 'Estrogen',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Estrogen tunes metabolism, cognition, and reproductive cycles.',
      application: 'Track phases or hormone therapy contextually.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === 'male') {
        return 0.05; // Low constant for males
      }
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      const val = getMenstrualHormones(day, subject.cycleLength).estrogen;
      if (minute === 0) console.log(`[Baseline:estrogen] Day ${day} -> ${val.toFixed(3)}`);
      return val;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'progesterone',
    label: 'Progesterone',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Progesterone rises in the luteal phase, raising body temp and promoting GABAergic calm.',
      application: 'Expect higher sleep drive and slightly reduced insulin sensitivity during the luteal peak.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === 'male') return 0.02;
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      return getMenstrualHormones(day, subject.cycleLength).progesterone;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'lh',
    label: 'LH',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Luteinizing Hormone spikes to trigger ovulation.',
      application: 'Marker of ovulation timing.',
    },
    display: { tendency: 'neutral' },
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === 'male') return 0.1;
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      return getMenstrualHormones(day, subject.cycleLength).lh;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'fsh',
    label: 'FSH',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Follicle Stimulating Hormone recruits ovarian follicles.',
      application: 'Correlates with early follicular phase.',
    },
    display: { tendency: 'neutral' },
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === 'male') return 0.1;
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      return getMenstrualHormones(day, subject.cycleLength).fsh;
    }),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'hrv',
    label: 'HRV',
    group: 'Autonomic',
    semantics: DEFAULT_SEMANTICS.Autonomic,
    description: {
      physiology: 'Heart Rate Variability reflects the balance between sympathetic and parasympathetic branches.',
      application: 'Track as a primary marker of recovery and autonomic readiness.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.4),
    couplings: [
      { source: 'vagal', mapping: linear(0.5), description: 'Vagal tone drives the HF component of HRV.' },
      { source: 'adrenaline', mapping: linear(-0.3), description: 'Sympathetic activation suppresses HRV.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'bloodPressure',
    label: 'Blood Pressure',
    group: 'Autonomic',
    semantics: DEFAULT_SEMANTICS.Autonomic,
    description: {
      physiology: 'Systemic arterial pressure driven by cardiac output and peripheral resistance.',
      application: 'Monitor spikes from stimulants, stress, or intense lifting.',
    },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0.3),
    couplings: [
      { source: 'adrenaline', mapping: linear(0.4), description: 'Adrenaline increases heart rate and vasoconstriction.' },
      { source: 'cortisol', mapping: linear(0.15), description: 'Cortisol increases vascular sensitivity to catecholamines.' },
      { source: 'vagal', mapping: linear(-0.2), description: 'Vagal activity lowers blood pressure via bradycardia.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'ethanol',
    label: 'Ethanol',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Circulating alcohol awaiting hepatic metabolism.',
      application: 'Simulate the clearing time and its impact on sleep architecture.',
    },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'acetaldehyde',
    label: 'Acetaldehyde',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Primary toxic metabolite of ethanol; drives hangovers and oxidative stress.',
      application: 'Track the "hangover tail" after alcohol consumption.',
    },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0),
    couplings: [
      { source: 'ethanol', mapping: linear(0.3), description: 'Conversion of ethanol by ADH.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'inflammation',
    label: 'Inflammation (CRP)',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Acute phase reactants (CRP, IL-6) signaling systemic immune activation.',
      application: 'Monitor recovery from overtraining, poor sleep, or chronic stress.',
    },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0.1),
    couplings: [
      { source: 'cortisol', mapping: linear(-0.2), description: 'Cortisol is a potent endogenous anti-inflammatory.' },
      { source: 'adrenaline', mapping: linear(0.08), description: 'Acute stress can trigger transient inflammatory cytokine release.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'bdnf',
    label: 'BDNF',
    group: 'Neuro',
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology: 'Brain-Derived Neurotrophic Factor supports neuronal survival and synaptic plasticity.',
      application: 'Track how exercise, sleep, and certain nootropics support brain health.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.3),
    couplings: [
      { source: 'growthHormone', mapping: linear(0.15), description: 'GH and IGF-1 support BDNF expression.' },
      { source: 'cortisol', mapping: linear(-0.1), description: 'Chronic high cortisol suppresses hippocampal BDNF.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'magnesium',
    label: 'Magnesium status',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Intracellular magnesium levels; critical for >300 enzymatic reactions.',
      application: 'Assess status in context of ADHD management and stress recovery.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.6),
    couplings: [
      { source: 'adrenaline', mapping: linear(-0.05), description: 'Stress-induced catecholamine release increases magnesium excretion.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'sensoryLoad',
    label: 'Sensory Load',
    group: 'Subjective',
    semantics: DEFAULT_SEMANTICS.Subjective,
    description: {
      physiology: 'Accumulated sensory input processing demand; particularly relevant for Autism profiles.',
      application: 'Use to predict "overload" or meltdowns when combined with high arousal.',
    },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0.1),
    couplings: [
      { source: 'adrenaline', mapping: linear(0.2), description: 'Hyper-arousal increases sensory sensitivity.' },
      { source: 'gaba', mapping: linear(-0.15), description: 'GABAergic inhibition helps filter sensory input.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'shbg',
    label: 'SHBG',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Sex Hormone Binding Globulin; regulates free vs bound hormone fractions.',
      application: 'Important for understanding bioavailable testosterone and estrogen.',
    },
    display: { tendency: 'mid' },
    baseline: fnBaseline(() => 0.4),
    couplings: [
      { source: 'insulin', mapping: linear(-0.12), description: 'High insulin levels suppress hepatic SHBG production.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'ferritin',
    label: 'Ferritin / Iron',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: 'Iron stores critical for oxygen transport and mitochondrial energy production.',
      application: 'Track energy dips related to menstrual blood loss or dietary intake.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.5),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'dheas',
    label: 'DHEA-S',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology: 'Adrenal androgen and neurosteroid; counter-regulatory to cortisol.',
      application: 'Assess the Cortisol/DHEA ratio as a marker of HPA axis resilience.',
    },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.4),
    couplings: [
      { source: 'cortisol', mapping: linear(-0.08), description: 'Adrenal steal or chronic stress can divert precursors away from DHEA.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'alt',
    label: 'ALT (Liver)',
    group: 'Organ',
    semantics: DEFAULT_SEMANTICS.Organ,
    description: { physiology: 'Liver enzyme; marker of hepatic stress or turnover.', application: 'Monitor during high metabolic load or toxin exposure.' },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0.2),
    couplings: [
      { source: 'acetaldehyde', mapping: linear(0.15), description: 'Toxic metabolites stress hepatic tissue.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'ast',
    label: 'AST (Liver)',
    group: 'Organ',
    semantics: DEFAULT_SEMANTICS.Organ,
    description: { physiology: 'Liver/Heart enzyme; marker of tissue turnover.', application: 'Track alongside ALT for liver health assessment.' },
    display: { tendency: 'lower' },
    baseline: fnBaseline(() => 0.2),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'egfr',
    label: 'eGFR (Kidney)',
    group: 'Organ',
    semantics: DEFAULT_SEMANTICS.Organ,
    description: { physiology: 'Estimated Glomerular Filtration Rate; marker of kidney function.', application: 'Monitor during high protein intake or chronic stress.' },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.8),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'vitaminD3',
    label: 'Vitamin D3',
    group: 'Endocrine',
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: { physiology: 'Steroid hormone precursor critical for immunity and calcium metabolism.', application: 'Long-term baseline tracker.' },
    display: { tendency: 'higher' },
    baseline: fnBaseline(() => 0.4),
    metadata: { version: '1.0.0' },
  },
  {
    key: 'mtor',
    label: 'mTOR',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: { physiology: 'Master regulator of cell growth and protein synthesis.', application: 'Visualize anabolic "building" windows vs recovery.' },
    display: { tendency: 'neutral' },
    baseline: fnBaseline(() => 0.3),
    couplings: [
      { source: 'insulin', mapping: linear(0.4), description: 'Insulin/IGF-1 signaling activates the mTOR pathway.' },
    ],
    metadata: { version: '1.0.0' },
  },
  {
    key: 'ampk',
    label: 'AMPK',
    group: 'Metabolic',
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: { physiology: 'Energy sensor that triggers catabolic pathways and autophagy.', application: 'Visualize "cleaning" and energy conservation windows.' },
    display: { tendency: 'neutral' },
    baseline: fnBaseline(() => 0.3),
    couplings: [
      { source: 'insulin', mapping: linear(-0.35), description: 'Insulin inhibits AMPK as it signals energy abundance.' },
      { source: 'glucagon', mapping: linear(0.2), description: 'Glucagon signals energy deficit, activating AMPK.' },
    ],
    metadata: { version: '1.0.0' },
  },
];

export const SIGNAL_LIBRARY = Object.fromEntries(
  SIGNAL_DEFS.map((def) => [def.key, def])
) as Record<Signal, SignalDef>;

const baselineFnFromSpec = (spec: BaselineSpec): BaselineFn => {
  switch (spec.kind) {
    case 'function':
      return (minute: Minute, ctx: BaselineContext) => {
        const val = spec.fn(minute, ctx);
        if (isNaN(val)) {
          console.error(`[BaselineFn] NaN produced for ${spec.kind} at ${minute}min`);
        }
        return val;
      };
    case 'flat':
      return () => spec.value;
    case 'gaussianMix':
      return (minute: Minute) =>
        spec.terms.reduce(
          (sum, term) => sum + term.gain * gaussian(minute, term.centerHours, term.widthMin),
          0
        );
    case 'sigmoidCombo':
      return (minute: Minute) => {
        const m = wrapMinute(minute);
        const rise = sigmoid((m - minutes(spec.riseHour)) / spec.riseSlope);
        const fall = sigmoid((m - minutes(spec.fallHour)) / spec.fallSlope);
        return Math.max(0, rise - fall);
      };
    default:
      return () => 0;
  }
};

export const SIGNAL_BASELINES: BaselineMap = Object.fromEntries(
  SIGNAL_DEFS.map((def) => [def.key, baselineFnFromSpec(def.baseline)])
) as BaselineMap;

export const SIGNAL_COUPLINGS: CouplingMap = SIGNAL_DEFS.reduce((acc, def) => {
  if (def.couplings?.length) acc[def.key] = def.couplings;
  return acc;
}, {} as CouplingMap);
