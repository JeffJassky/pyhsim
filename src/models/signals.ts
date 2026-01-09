/**
 * Signal Definitions and Baseline Functions
 *
 * This module defines all physiological signals tracked by the simulation,
 * including their baseline circadian patterns, units, and reference values.
 *
 * ============================================================================
 * SIGNAL UNITS REFERENCE
 * ============================================================================
 *
 * CLINICAL UNITS (measurable values):
 * ------------------------------------
 * Signal              Unit          Reference Range       Notes
 * ------              ----          ---------------       -----
 * glucose             mg/dL         70–140                Fasting ~90, post-meal <140
 * insulin             µIU/mL        2–20                  Fasting <10, peak ~50-100
 * cortisol            µg/dL         5–25                  AM peak ~15-25, PM trough ~5
 * melatonin           pg/mL         0–100                 Night peak ~80, day ~5
 * vasopressin         pg/mL         0–10                  Normal ~2-6
 * testosterone        ng/dL         300–1000 (M)          AM peak, PM trough
 * estradiol           pg/mL         15–350 (F)            Varies with cycle phase
 * progesterone        ng/mL         0.1–25 (F)            Luteal peak ~10-25
 * prolactin           ng/mL         5–25                  Higher at night, stress
 * growthHormone       ng/mL         0–10                  Pulsatile, sleep peak
 * tsh                 mIU/L         0.4–4.0               Night peak
 * leptin              ng/mL         2–20                  Higher with fat mass
 * ghrelin             pg/mL         100–600               Pre-meal peak ~600
 *
 * PERCENTAGE BASELINE UNITS (% of baseline):
 * ------------------------------------------
 * These signals use "100 = baseline" scaling where 100 represents the
 * reference physiological baseline. Deviations are expressed as percentage
 * changes from this baseline.
 *
 * Signal              100 =          50 =                 150 =
 * ------              -----          ----                 -----
 * dopamine            Basal DA       50% reduction        50% increase
 * serotonin           Basal 5-HT     50% reduction        50% increase
 * norepinephrine      Basal NE       Low arousal          High stress/alertness
 * adrenaline          Basal EPI      Rest state           Fight-or-flight
 * gaba                Basal GABA     Anxious/excited      Calm/sedated
 * glutamate           Basal Glu      Hypoactive           Hyperexcitable
 * acetylcholine       Basal ACh      Low attention        High focus
 * histamine           Basal HA       Drowsy               Alert
 * adenosine           Basal Ado      Fresh/rested         Sleep pressure high
 * orexin              Basal Orx      Sleepy               Wakeful
 * bdnf                Basal BDNF     Low plasticity       High plasticity
 * endorphin           Basal β-end    Neutral mood         Euphoric
 * anandamide          Basal AEA      Neutral              Relaxed/content
 * oxytocin            Basal OT       Low bonding          High bonding
 * dynorphin           Basal Dyn      Neutral              Dysphoric/aversive
 *
 * ARBITRARY/SUBJECTIVE UNITS:
 * ---------------------------
 * Signal              Range          Interpretation
 * ------              -----          --------------
 * energy              0–100          Subjective energy level
 * alertness           0–100          Subjective alertness
 * focus               0–100          Cognitive performance
 * mood                0–100          Subjective mood state
 * stress              0–100          Perceived stress
 * sleepiness          0–100          Subjective sleepiness
 * hunger              0–100          Appetite level
 * satiety             0–100          Fullness level
 * pain                0–100          Pain perception
 *
 * CONVERSION NOTES:
 * -----------------
 * - Kernel outputs are additive adjustments to baselines
 * - For clinical units: kernel output is in same units (e.g., +10 mg/dL glucose)
 * - For % baseline: kernel output is percentage points (e.g., +20 means 100→120)
 * - Homeostasis corrections are also in native units
 *
 * ============================================================================
 */

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
} from "@/types";
import { DEFAULT_SUBJECT, getMenstrualHormones } from "./subject";

const MINUTES_IN_DAY = 24 * 60;
const TWO_PI = 2 * Math.PI;

// ============================================================================
// PHASE-BASED HELPER FUNCTIONS
// ============================================================================
// These functions use phase angles (θ = 2π * minute / 1440) instead of raw
// minutes, providing inherently continuous evaluation across day boundaries.
// cos(2π) = cos(0), so there's no discontinuity at midnight.

/**
 * Convert minute to phase angle (0 to 2π for one day)
 * This is the core transformation for continuous time modeling.
 */
const minuteToPhase = (minute: Minute): number => {
  return (minute / MINUTES_IN_DAY) * TWO_PI;
};

/**
 * Convert hour-of-day to phase angle
 * e.g., 6 AM = π/2, 12 PM = π, 6 PM = 3π/2
 */
const hourToPhase = (hour: number): number => {
  return (hour / 24) * TWO_PI;
};

/**
 * Convert duration in minutes to phase width
 */
const minutesToPhaseWidth = (mins: number): number => {
  return (mins / MINUTES_IN_DAY) * TWO_PI;
};

/**
 * Convert width in minutes to von Mises concentration parameter
 * Higher concentration = narrower peak
 */
const widthToConcentration = (widthMinutes: number): number => {
  const widthPhase = minutesToPhaseWidth(widthMinutes);
  // Calibrated to match the visual width of the old gaussian function
  return 2 / (widthPhase * widthPhase);
};

/**
 * Von Mises-like gaussian on circular domain
 * Uses exp(κ * (cos(θ - θ₀) - 1)) which peaks at 1 when θ = θ₀
 * and smoothly decays based on concentration κ
 *
 * @param phase - Current phase angle
 * @param centerPhase - Phase angle of peak
 * @param concentration - Higher = narrower peak (use widthToConcentration for familiar units)
 */
const gaussianPhase = (phase: number, centerPhase: number, concentration: number): number => {
  const diff = phase - centerPhase;
  return Math.exp(concentration * (Math.cos(diff) - 1));
};

/**
 * Smooth window function using cosine blend
 * Returns 1 inside the window, 0 outside, with smooth transitions at edges.
 * Handles wrap-around windows (e.g., 22:00 to 06:00) correctly.
 *
 * @param phase - Current phase angle
 * @param startPhase - Phase angle where window begins
 * @param endPhase - Phase angle where window ends
 * @param transitionWidth - Phase width of smooth transition (default ~30 min)
 */
const windowPhase = (
  phase: number,
  startPhase: number,
  endPhase: number,
  transitionWidth: number = minutesToPhaseWidth(30)
): number => {
  // Normalize phase to [0, 2π)
  let p = phase % TWO_PI;
  if (p < 0) p += TWO_PI;

  // Normalize start and end to [0, 2π)
  let s = startPhase % TWO_PI;
  if (s < 0) s += TWO_PI;
  let e = endPhase % TWO_PI;
  if (e < 0) e += TWO_PI;

  // Handle wrap-around windows (e.g., 22:00 to 06:00 where end < start)
  const wraps = e < s;

  // Check if we're in the window
  const inWindow = wraps
    ? (p >= s || p <= e)
    : (p >= s && p <= e);

  if (!inWindow) return 0;

  // Calculate distance to start edge
  let distToStart: number;
  if (wraps && p < s) {
    distToStart = p + (TWO_PI - s);
  } else {
    distToStart = p - s;
  }

  // Calculate distance to end edge
  let distToEnd: number;
  if (wraps && p > e) {
    distToEnd = (TWO_PI - p) + e;
  } else {
    distToEnd = e - p;
  }

  // Cosine fade at edges for smooth transitions
  const fadeIn = distToStart < transitionWidth
    ? 0.5 * (1 - Math.cos(Math.PI * distToStart / transitionWidth))
    : 1;
  const fadeOut = distToEnd < transitionWidth
    ? 0.5 * (1 - Math.cos(Math.PI * distToEnd / transitionWidth))
    : 1;

  return fadeIn * fadeOut;
};

/**
 * Simple cosine rhythm - peaks at 1 at centerPhase, troughs at 0 opposite
 * Useful for signals with simple sinusoidal circadian patterns.
 *
 * @param phase - Current phase angle
 * @param peakPhase - Phase angle of maximum
 */
const cosineRhythm = (phase: number, peakPhase: number): number => {
  return 0.5 * (1 + Math.cos(phase - peakPhase));
};

/**
 * Smooth sigmoid-like transition using cosine
 * Returns 0 before transition, 1 after, with smooth cosine blend.
 *
 * @param phase - Current phase angle
 * @param transitionPhase - Center of the transition
 * @param transitionWidth - Width of the transition region
 */
const sigmoidPhase = (
  phase: number,
  transitionPhase: number,
  transitionWidth: number = minutesToPhaseWidth(45)
): number => {
  // Normalize phase difference to [-π, π]
  let diff = phase - transitionPhase;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;

  if (diff < -transitionWidth / 2) return 0;
  if (diff > transitionWidth / 2) return 1;

  // Cosine blend in the transition region
  return 0.5 * (1 + Math.sin(Math.PI * diff / transitionWidth));
};

// ============================================================================
// END PHASE-BASED HELPERS
// ============================================================================

const getDayOfCycle = (
  minute: Minute,
  cycleLength: number,
  startDay: number = 0
) => {
  // Assuming minute 0 is start of simulation.
  // We need a way to offset this if the user starts mid-cycle.
  // For now, assuming sim start = cycle day 0.
  const day = Math.floor(minute / MINUTES_IN_DAY) + startDay;
  return day % cycleLength;
};

const fnBaseline = (
  fn: (minute: Minute, ctx: BaselineContext) => number
): BaselineSpec => ({
  kind: "function",
  fn,
});

const fixedDelay = (minutesDelay?: number): DelaySpec | undefined =>
  minutesDelay && minutesDelay > 0
    ? { kind: "fixed", minutes: minutesDelay }
    : undefined;

const linear = (gain: number): ResponseSpec => ({ kind: "linear", gain });

/**
 * Default semantics by signal group
 *
 * These provide fallback units and ranges when signals don't specify their own.
 * Individual signals should override with specific clinical values where available.
 */
const DEFAULT_SEMANTICS: Record<SignalGroup, SignalDef["semantics"]> = {
  /**
   * SCN (Suprachiasmatic Nucleus) signals
   * Typically in pg/mL for neuropeptides
   */
  SCN: {
    unit: "pg/mL",
    referenceRange: { min: 0, max: 100 },
    normalized: { mean: 0.5, sd: 0.2 },
    isLatent: true,
  },
  /**
   * Neurotransmitter signals
   * Use % baseline where 100 = normal tonic level
   * This allows interventions to express effects as % changes
   */
  Neuro: {
    unit: "% baseline",
    referenceRange: { min: 50, max: 150 },
    normalized: { mean: 0.5, sd: 0.2 },
    isLatent: true,
    // Note: 100 = baseline tonic release, kernels add/subtract from this
  },
  /**
   * Endocrine signals
   * Default to insulin-like units; individual hormones override
   */
  Endocrine: {
    unit: "µIU/mL",
    referenceRange: { min: 2, max: 20 },
    normalized: { mean: 0.5, sd: 0.2 },
  },
  /**
   * Metabolic signals
   * Default to glucose-like units (mg/dL)
   */
  Metabolic: {
    unit: "mg/dL",
    referenceRange: { min: 70, max: 140 },
    normalized: { mean: 0.5, sd: 0.2 },
  },
  /**
   * Autonomic signals
   * Various metrics for ANS activity
   */
  Autonomic: {
    unit: "HRV index",
    referenceRange: { min: 0.3, max: 0.8 },
    normalized: { mean: 0.5, sd: 0.2 },
  },
  /**
   * Subjective experience signals
   * 0–100 scale representing self-reported states
   */
  Subjective: {
    unit: "score (0-100)",
    referenceRange: { min: 0, max: 100 },
    normalized: { mean: 0.5, sd: 0.2 },
    isLatent: true,
  },
  /**
   * Organ-specific activity signals
   * -1 to +1 scale for directional effects
   */
  Organ: {
    unit: "score (-1 to +1)",
    referenceRange: { min: -1, max: 1 },
    normalized: { mean: 0.5, sd: 0.2 },
    isLatent: true,
  },
};

export const SIGNAL_DEFS: SignalDef[] = [
  {
    key: "melatonin",
    label: "Melatonin",
    group: "SCN",
    isPremium: false,
    semantics: DEFAULT_SEMANTICS.SCN,
    description: {
      physiology:
        "Pineal hormone rising after dusk to broadcast biological night and align peripheral clocks.",
      application:
        "Track whether light hygiene or supplementation is shifting sleep onset / circadian phase.",
    },
    display: { tendency: "higher" },
    goals: ["sleep", "recovery", "calm"],
    baseline: fnBaseline((minute) => {
      // Peak ~80 pg/mL. Window from 15:00 to 23:30 approx.
      const p = minuteToPhase(minute);
      return 80.0 * windowPhase(p, hourToPhase(15), hourToPhase(23.5), minutesToPhaseWidth(30));
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "vasopressin",
    label: "Vasopressin",
    group: "SCN",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.SCN,
      referenceRange: { min: 0, max: 10 },
    },
    description: {
      physiology:
        "SCN shell neurons release AVP to keep clock cells phase-locked and to gate downstream endocrine outputs.",
      application:
        "Watch AVP when assessing circadian robustness against travel, shift work, or dehydration.",
    },
    display: { tendency: "mid" },
    goals: ["sleep", "recovery"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const couple = gaussianPhase(p, hourToPhase(8), widthToConcentration(260));
      const nightRise = windowPhase(p, hourToPhase(16.5), hourToPhase(8), minutesToPhaseWidth(45));
      // Baseline ~2, Peak ~6 pg/mL
      return 1.8 + 3.5 * couple + 3.5 * nightRise;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "vip",
    label: "VIP",
    group: "SCN",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.SCN,
      referenceRange: { min: 0, max: 100 },
    }, // a.u. really, but let's match scale
    description: {
      physiology:
        "VIP neurons in the SCN core translate retinal light input into synchronized clock gene expression.",
      application:
        "Morning light therapy should sharpen VIP peaks; use this to validate zeitgeber timing.",
    },
    display: { tendency: "mid" },
    goals: ["energy", "sleep", "productivity"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const day = gaussianPhase(p, hourToPhase(9), widthToConcentration(300));
      const eveningSuppress = windowPhase(p, hourToPhase(15), hourToPhase(4), minutesToPhaseWidth(35));
      return 20.0 + 50.0 * day - 25.0 * eveningSuppress;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "dopamine",
    label: "Dopamine",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "Midbrain dopamine tracks reward prediction and energizes goal-directed behavior.",
      application:
        "Map stimulant use, novelty, or movement to dopamine tone to avoid overdriving motivation.",
    },
    display: { tendency: "higher" },
    goals: ["focus", "energy", "mood", "productivity"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const morningDrive = gaussianPhase(p, hourToPhase(3.5), widthToConcentration(160));
      const afternoonPlateau = gaussianPhase(p, hourToPhase(6.5), widthToConcentration(320));
      const eveningDrop = gaussianPhase(p, hourToPhase(16), widthToConcentration(200));
      return (
        20.0 +
        45.0 * morningDrive +
        20.0 * afternoonPlateau -
        15.0 * eveningDrop
      );
    }),
    couplings: [
      {
        source: "cortisol",
        mapping: linear(0.5), // Cortisol (20) -> +10 units
        description:
          "Moderate cortisol supports dopaminergic tone through catecholamine availability.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "serotonin",
    label: "Serotonin",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "Raphe serotonin integrates light exposure, carbohydrate intake, and mood stability.",
      application:
        "Use to gauge whether daylight, meals, or SSRIs are creating the calm/upbeat baseline you want.",
    },
    display: { tendency: "mid" },
    goals: ["mood", "calm", "sleep"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const lateMorning = gaussianPhase(p, hourToPhase(5), widthToConcentration(260));
      const afternoon = gaussianPhase(p, hourToPhase(9), widthToConcentration(300));
      return 20.0 + 25.0 * (lateMorning + afternoon);
    }),
    couplings: [
      {
        source: "vip",
        mapping: linear(0.3), // VIP (50) -> +15 units
        description: "SCN VIP input stabilizes raphe serotonin phase.",
      },
      {
        source: "cortisol",
        mapping: linear(-0.5), // Cortisol (20) -> -10 units
        description:
          "Elevated cortisol dampens serotonin synthesis via tryptophan shunting.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "acetylcholine",
    label: "Acetylcholine",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "Basal-forebrain cholinergic tone sharpens attention and supports REM consolidation.",
      application:
        "Track focus blocks, nicotine, or meditation to see how they sustain precision without overloading.",
    },
    display: { tendency: "higher" },
    goals: ["focus", "energy"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const dawnPriming = sigmoidPhase(p, hourToPhase(1.5), minutesToPhaseWidth(35 * 4));
      const middayPlateau = gaussianPhase(p, hourToPhase(6.5), widthToConcentration(320));
      const eveningDrop = sigmoidPhase(p, hourToPhase(14.5), minutesToPhaseWidth(45 * 4));
      const tone =
        25.0 + 45.0 * dawnPriming + 35.0 * middayPlateau - 30.0 * eveningDrop;
      return Math.max(5.0, tone);
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "gaba",
    label: "GABA",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "Inhibitory GABA tone accumulates with sleep pressure and damps sympathetic overdrive.",
      application:
        "Check whether relaxation, breathwork, or evening routines are lifting GABA enough for sleep.",
    },
    display: { tendency: "mid" },
    goals: ["calm", "sleep", "recovery"],
    baseline: fnBaseline((minute) => {
      // High GABA tone from afternoon through night (14:00 -> 09:00)
      const p = minuteToPhase(minute);
      const highTone = windowPhase(p, hourToPhase(14), hourToPhase(9), minutesToPhaseWidth(60));
      return 15.0 + 50.0 * highTone;
    }),
    couplings: [
      {
        source: "adrenaline",
        mapping: linear(-0.3), // Adrenaline (20-500 pg/mL) -> GABA at 100 baseline produces -30 pg/mL
        description:
          "GABA-mediated parasympathetic tone restrains adrenergic surges.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "norepi",
    label: "Norepinephrine",
    group: "Neuro",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Neuro,
      unit: "pg/mL",
      referenceRange: { min: 100, max: 600 },
    },
    description: {
      physiology:
        "Locus coeruleus norepinephrine sets sympathetic vigilance and readiness to respond.",
      application:
        "Use to titrate stimulant dosage or monitor stress spikes from work, caffeine, or alarms.",
    },
    display: { tendency: "higher" },
    goals: ["focus", "energy"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const alertness = gaussianPhase(p, hourToPhase(2), widthToConcentration(120)) + 0.4 * gaussianPhase(p, hourToPhase(7), widthToConcentration(200));
      // Scale to pg/mL range: baseline ~150, peak ~400
      return 150.0 + 250.0 * alertness;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "histamine",
    label: "Histamine",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "TMN histamine neurons maintain wake maintenance and cortical activation.",
      application:
        "Anti-histamines, allergy load, or bright light show up here—useful for troubleshooting grogginess.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "sleep"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const wake = sigmoidPhase(p, hourToPhase(1), minutesToPhaseWidth(35 * 4));
      const day = gaussianPhase(p, hourToPhase(8), widthToConcentration(300));
      const nightFall = sigmoidPhase(p, hourToPhase(15), minutesToPhaseWidth(40 * 4));
      const tone = 15.0 + 45.0 * wake + 35.0 * day - 30.0 * nightFall;
      return Math.max(2.0, tone);
    }),
    couplings: [
      {
        source: "melatonin",
        mapping: linear(-0.3), // Melatonin (80) -> -24 units
        delay: fixedDelay(20),
        description:
          "Nocturnal melatonin suppresses TMN histamine neurons to permit sleep maintenance.",
      },
      {
        source: "vip",
        mapping: linear(0.2), // VIP (50) -> +10 units
        description:
          "VIP signaling from the SCN core excites histaminergic tone to reinforce daytime wakefulness.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "orexin",
    label: "Orexin",
    group: "Neuro",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Neuro,
      unit: "pg/mL",
      referenceRange: { min: 200, max: 500 },
    },
    description: {
      physiology:
        "Hypothalamic orexin links energy status and feeding cues to sustained wake drive.",
      application:
        "See how sleep, fasting, or carbs influence orexin so you can balance alertness with appetite.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "sleep", "digestion"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const wakeDrive = sigmoidPhase(p, hourToPhase(1.8), minutesToPhaseWidth(30 * 4));
      const feedingCue = gaussianPhase(p, hourToPhase(4.5), widthToConcentration(160)) + 0.6 * gaussianPhase(p, hourToPhase(8.5), widthToConcentration(280));
      const sleepPressure = sigmoidPhase(p, hourToPhase(15), minutesToPhaseWidth(45 * 4));
      // Scale to CSF pg/mL range: baseline ~250, peak ~450
      const tone =
        250.0 + 150.0 * wakeDrive + 80.0 * feedingCue - 100.0 * sleepPressure;
      return Math.max(150.0, tone);
    }),
    couplings: [
      {
        source: "melatonin",
        mapping: linear(-0.4), // Melatonin (80) -> -32 units
        delay: fixedDelay(30),
        description:
          "Melatonin inhibits hypothalamic orexin neurons, lowering wake pressure at night.",
      },
      {
        source: "ghrelin",
        mapping: linear(0.05), // Ghrelin (500) -> +25 units
        description: "Ghrelin stimulates orexin to couple hunger with arousal.",
      },
      {
        source: "dopamine",
        mapping: linear(0.3), // Dopamine (50) -> +15 units
        description:
          "Mesolimbic dopamine reinforces orexin firing during motivated states.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "glutamate",
    label: "Glutamate",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "Primary excitatory transmitter carrying cortical throughput and learning plasticity.",
      application:
        "High glutamate reflects cognitively intense work or stress; use to pace deep work vs. recovery blocks.",
    },
    display: { tendency: "higher" },
    goals: ["focus", "energy"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const focusBand = gaussianPhase(p, hourToPhase(7), widthToConcentration(260));
      const eveningDecline = gaussianPhase(p, hourToPhase(14), widthToConcentration(200));
      const tone = 25.0 + 55.0 * focusBand - 25.0 * eveningDecline;
      return Math.max(5.0, tone);
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "endocannabinoid",
    label: "Endocannabinoid Tone",
    group: "Neuro",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Neuro,
    description: {
      physiology:
        "Endocannabinoids act as retrograde messengers buffering stress, pain, and appetite signals.",
      application:
        "Exercise, fasting, or cannabis use alters this curve—track to understand cravings and calm responses.",
    },
    display: { tendency: "mid" },
    goals: ["calm", "pain", "mood"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const afternoonEase = sigmoidPhase(p, hourToPhase(10.5), minutesToPhaseWidth(55 * 4));
      const nightRise = sigmoidPhase(p, hourToPhase(15.5), minutesToPhaseWidth(35 * 4));
      return 12.0 + 40.0 * afternoonEase + 40.0 * nightRise;
    }),
    couplings: [
      {
        source: "serotonin",
        mapping: linear(0.05),
        description:
          "Serotonergic input modulates endocannabinoid tone during mood regulation.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "cortisol",
    label: "Cortisol",
    group: "Endocrine",
    isPremium: false,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ug/dL",
      referenceRange: { min: 5, max: 25 },
    },
    description: {
      physiology:
        "Adrenal glucocorticoid governing energy mobilization and stress response.",
      application:
        "Check the Cortisol Awakening Response (CAR) and evening decline to assess HPA axis health.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "recovery"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      // Cortisol Awakening Response (CAR) peak around 07:30
      const CAR = gaussianPhase(p, hourToPhase(7.5), widthToConcentration(90));
      // Active day component (high in morning, drops in evening)
      // Replaces (1 - dayDrop)
      const dayComponent = windowPhase(p, hourToPhase(6), hourToPhase(20), minutesToPhaseWidth(120));
      // Baseline ~2, Peak ~20
      return 2.0 + 18.0 * CAR + 4.0 * dayComponent;
    }),
    couplings: [
      {
        source: "orexin",
        mapping: linear(0.2),
        description:
          "Orexin neurons activate the HPA axis, boosting ACTH and cortisol.",
      },
      {
        source: "melatonin",
        mapping: linear(-0.14),
        delay: fixedDelay(45),
        description:
          "Melatonin feeds back on the HPA axis, suppressing nocturnal cortisol.",
      },
      {
        source: "gaba",
        mapping: linear(-0.09),
        description:
          "GABAergic tone inhibits CRH release, blunting cortisol bursts.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "adrenaline",
    label: "Adrenaline",
    group: "Endocrine",
    isPremium: false,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "pg/mL",
      referenceRange: { min: 20, max: 500 },
    },
    description: {
      physiology:
        "Adrenal medulla epinephrine delivers acute fight-or-flight energy and bronchodilation.",
      application:
        "Ensure workouts or cold exposure create sharp spikes with clean recoveries instead of chronic elevation.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "calm", "productivity"],
    baseline: fnBaseline(
      (minute) => 30.0 + 80.0 * gaussianPhase(minuteToPhase(minute), hourToPhase(2), widthToConcentration(120))
    ),
    couplings: [
      {
        source: "orexin",
        mapping: linear(2.0),
        description:
          "Orexin drives sympathetic preganglionic neurons, elevating epinephrine.",
      },
      {
        source: "dopamine",
        mapping: linear(1.0),
        description:
          "Dopamine facilitates adrenal medulla output during reward-driven arousal.",
      },
      {
        source: "gaba",
        mapping: linear(-1.5),
        description:
          "GABA-mediated parasympathetic tone restrains adrenergic surges.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "insulin",
    label: "Insulin",
    group: "Endocrine",
    isPremium: false,
    semantics: DEFAULT_SEMANTICS.Endocrine,
    description: {
      physiology:
        "Pancreatic beta-cell insulin clears glucose into muscle, liver, and fat stores.",
      application:
        "Use to test meal composition, exercise, or meds that improve insulin sensitivity and flatten peaks.",
    },
    display: { tendency: "neutral" },
    goals: ["digestion", "energy", "weightLoss", "productivity", "longevity"],
    baseline: fnBaseline(() => 5.0),
    couplings: [
      {
        source: "orexin",
        mapping: linear(0.15), // Orexin (100) -> +15 uIU/mL
        description:
          "Orexin enhances vagal drive to beta cells, boosting insulin.",
      },
      {
        source: "glucagon",
        mapping: linear(-0.05),
        description:
          "Glucagon opposes insulin secretion through intra-islet feedback.",
      },
      {
        source: "dopamine",
        mapping: linear(0.1), // Dopamine (100) -> +10 uIU/mL
        description:
          "Pancreatic dopamine augments first-phase insulin release.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "glucagon",
    label: "Glucagon",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "pg/mL",
      referenceRange: { min: 50, max: 150 },
    },
    description: {
      physiology:
        "Alpha-cell glucagon releases stored glucose and stimulates ketogenesis during fasting.",
      application:
        "Extended fasting or endurance sessions should elevate glucagon; use this to plan refuel windows.",
    },
    display: { tendency: "higher" },
    goals: ["digestion", "energy", "weightLoss", "longevity"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const nocturnal = gaussianPhase(p, hourToPhase(23), widthToConcentration(160)) + 0.8 * gaussianPhase(p, hourToPhase(1.5), widthToConcentration(220));
      const daytimeSuppression = gaussianPhase(p, hourToPhase(7.5), widthToConcentration(320));
      const tone = 40 + 35 * nocturnal - 15 * daytimeSuppression;
      return Math.max(20, tone);
    }),
    couplings: [
      {
        source: "insulin",
        mapping: linear(-0.5),
        description: "Paracrine insulin suppresses alpha-cell glucagon.",
      },
      {
        source: "cortisol",
        mapping: linear(2.0),
        description:
          "Cortisol promotes gluconeogenesis and glucagon secretion during stress.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "ghrelin",
    label: "Ghrelin",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "pg/mL",
      referenceRange: { min: 200, max: 800 },
    },
    description: {
      physiology:
        "Stomach-derived ghrelin pulses ahead of meals to trigger hunger and growth hormone release.",
      application:
        "Time meals, protein, or fiber to blunt unwanted appetite spikes shown here.",
    },
    display: { tendency: "mid" },
    goals: ["digestion", "weightLoss", "longevity"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const breakfast = gaussianPhase(p, hourToPhase(3), widthToConcentration(90));
      const lunch = gaussianPhase(p, hourToPhase(7), widthToConcentration(90));
      const dinner = gaussianPhase(p, hourToPhase(12), widthToConcentration(120));
      // Base 250 + Peaks up to 600
      return 250.0 + 350.0 * (breakfast + lunch + dinner);
    }),
    couplings: [
      {
        source: "leptin",
        mapping: linear(-15.0), // Leptin (10) -> -150 pg/mL
        description:
          "Adipose leptin suppresses gastric ghrelin secretion to signal fullness.",
      },
      {
        source: "insulin",
        mapping: linear(-2.0), // Insulin (30) -> -60 pg/mL
        description: "Post-meal insulin blunts ghrelin release for 2–3 hours.",
      },
      {
        source: "progesterone",
        mapping: linear(20.0), // Progesterone (10) -> +200 pg/mL
        description:
          "Progesterone rise in the luteal phase increases appetite baseline.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "glp1",
    label: "GLP-1",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "pmol/L",
      referenceRange: { min: 2, max: 20 },
    },
    description: {
      physiology:
        "Gut incretin GLP-1 enhances insulin secretion and slows gastric emptying to prolong satiety.",
      application:
        "Fiber, protein, or GLP-1 agonists should raise this curve—useful when coaching appetite control.",
    },
    display: { tendency: "higher" },
    goals: ["digestion"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const bk = gaussianPhase(p, hourToPhase(3.2), widthToConcentration(70));
      const ln = gaussianPhase(p, hourToPhase(7.2), widthToConcentration(80));
      const dn = gaussianPhase(p, hourToPhase(12.5), widthToConcentration(90));
      const tone = 2.0 + 12.0 * (bk + 0.9 * ln + 0.8 * dn);
      return Math.min(25, tone);
    }),
    couplings: [
      {
        source: "insulin",
        mapping: linear(0.02), // Insulin (30) -> +0.6 pmol/L
        description:
          "Beta-cell activity correlates with incretin release during nutrient intake.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "leptin",
    label: "Leptin",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ng/mL",
      referenceRange: { min: 2, max: 30 },
    },
    description: {
      physiology:
        "Adose leptin reports long-term energy sufficiency to the hypothalamus.",
      application:
        "Sleep restriction or crash dieting should not chronically suppress leptin if you want stable metabolism.",
    },
    display: { tendency: "higher" },
    goals: ["digestion", "energy"],
    baseline: fnBaseline(
      (minute) => 6.0 + 5.0 * sigmoidPhase(minuteToPhase(minute), hourToPhase(10), minutesToPhaseWidth(120 * 4))
    ),
    couplings: [
      {
        source: "insulin",
        mapping: linear(0.05), // Insulin (30) -> +1.5 ng/mL
        delay: fixedDelay(60),
        description:
          "Post-prandial insulin stimulates adipocytes to raise leptin expression.",
      },
      {
        source: "glucagon",
        mapping: linear(-0.05), // Glucagon (100) -> -5 ng/mL
        description:
          "Glucagon-driven lipolysis transiently lowers leptin signal.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "thyroid",
    label: "Thyroid Tone",
    group: "Endocrine",
    isPremium: false,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "uIU/mL",
      referenceRange: { min: 0.5, max: 5.0 },
    },
    description: {
      physiology:
        "Thyroid hormones set basal metabolic rate and temperature compensation.",
      application:
        "Monitor under chronic stress or dieting to avoid metabolic slowdown.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "recovery", "weightLoss", "productivity", "longevity"],
    baseline: fnBaseline((minute, ctx) => {
      const p = minuteToPhase(minute);
      const active = windowPhase(p, hourToPhase(2.5), hourToPhase(23), minutesToPhaseWidth(80));
      const midday = gaussianPhase(p, hourToPhase(7.5), widthToConcentration(360));
      const nightDip = gaussianPhase(p, hourToPhase(16.5), widthToConcentration(300));
      let tone = 1.0 + 2.0 * active + 1.5 * midday - 1.2 * nightDip;

      // Scale by metabolic capacity if available (default 1.0)
      const scale = ctx.physiology?.metabolicCapacity ?? 1.0;
      tone *= scale;

      return Math.max(0.5, tone);
    }),
    couplings: [
      {
        source: "cortisol",
        mapping: linear(-0.08), // Cortisol (20) -> -1.6 uIU/mL
        description: "Chronic cortisol suppresses TSH, lowering thyroid tone.",
      },
      {
        source: "leptin",
        mapping: linear(0.1), // Leptin (10) -> +1.0 uIU/mL
        description: "Adequate leptin supports TRH/TSH drive to the thyroid.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "oxytocin",
    label: "Oxytocin",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "pg/mL",
      referenceRange: { min: 1, max: 10 },
    },
    description: {
      physiology:
        "Hypothalamic oxytocin fosters bonding, trust, and parasympathetic activation.",
      application:
        "Social rituals, skin contact, or breathwork should raise oxytocin when emotional regulation is the goal.",
    },
    display: { tendency: "higher" },
    goals: ["mood", "calm", "pain"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const social = gaussianPhase(p, hourToPhase(10), widthToConcentration(260));
      const evening = sigmoidPhase(p, hourToPhase(14.5), minutesToPhaseWidth(40 * 4));
      return 1.5 + 4.0 * social + 5.0 * evening;
    }),
    couplings: [
      {
        source: "endocannabinoid",
        mapping: linear(0.04), // Endocannabinoid (% baseline, ~50-150) -> +2 to +6 pg/mL oxytocin
        description:
          "Endocannabinoid tone modulates oxytocin release during stress buffering.",
      },
      {
        source: "serotonin",
        mapping: linear(0.06), // Serotonin (50) -> +3 pg/mL
        description:
          "Serotonin facilitates oxytocin release in social bonding contexts.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "prolactin",
    label: "Prolactin",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ng/mL",
      referenceRange: { min: 2, max: 20 },
    },
    description: {
      physiology:
        "Pituitary prolactin surges during sleep and caregiving, supporting immune balance and recovery.",
      application:
        "Evening relaxation, heat, or intimacy sessions should allow the nightly prolactin crest to form.",
    },
    display: { tendency: "mid" },
    goals: ["recovery", "sleep", "cycle"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const prep = sigmoidPhase(p, hourToPhase(13.5), minutesToPhaseWidth(50 * 4));
      const sleepPulse = gaussianPhase(p, hourToPhase(18), widthToConcentration(120)) + 0.8 * gaussianPhase(p, hourToPhase(23.5), widthToConcentration(200));
      return 4.0 + 8.0 * prep + 12.0 * sleepPulse;
    }),
    couplings: [
      {
        source: "gaba",
        mapping: linear(0.05), // GABA (50) -> +2.5 ng/mL
        description:
          "GABAergic inhibition of tuberoinfundibular dopamine disinhibits prolactin.",
      },
      {
        source: "dopamine",
        mapping: linear(-0.1), // Dopamine (50) -> -5 ng/mL (Strong inhibition)
        description:
          "Hypothalamic dopamine tonically suppresses prolactin secretion.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "growthHormone",
    label: "Growth Hormone",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ng/mL",
      referenceRange: { min: 0, max: 10 },
    },
    description: {
      physiology:
        "Growth hormone pulses shortly after sleep onset to drive protein synthesis and tissue repair.",
      application:
        "Hard training and good sleep hygiene should amplify this peak—use to evaluate recovery plans.",
    },
    display: { tendency: "higher" },
    goals: ["recovery", "energy", "longevity"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const sleepOnset = gaussianPhase(p, hourToPhase(18.5), widthToConcentration(120));
      const rebound = gaussianPhase(p, hourToPhase(22.5), widthToConcentration(90));
      const tone = 0.5 + 8.0 * (sleepOnset + 0.6 * rebound);
      return Math.min(15, tone);
    }),
    couplings: [
      {
        source: "gaba",
        mapping: linear(0.04), // GABA (50) -> +2 ng/mL
        description:
          "Sleep-related GABA increases GHRH release and growth hormone pulses.",
      },
      {
        source: "ghrelin",
        mapping: linear(0.01), // Ghrelin (400) -> +4 ng/mL
        description:
          "Ghrelin directly stimulates somatotrophs, boosting growth hormone.",
      },
      {
        source: "cortisol",
        mapping: linear(-0.15), // Cortisol (20) -> -3 ng/mL
        description: "High cortisol suppresses growth hormone secretion.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "glucose",
    label: "Glucose",
    group: "Metabolic",
    isPremium: false,
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology:
        "Glucose tracks immediate carbohydrate availability for the brain and muscles.",
      application:
        "Make sure fueling or fasting tactics keep glucose within the range that matches your goals.",
    },
    display: { tendency: "mid" },
    goals: ["energy", "digestion", "weightLoss", "longevity"],
    baseline: fnBaseline(() => 85.0),
    couplings: [
      {
        source: "cortisol",
        mapping: linear(0.5),
        isManagedByHomeostasis: true,
        description:
          "Cortisol stimulates hepatic gluconeogenesis, raising glucose.",
      },
      {
        source: "adrenaline",
        mapping: linear(0.05),
        description:
          "Adrenaline drives glycogenolysis, elevating glucose acutely.",
      },
      {
        source: "insulin",
        mapping: linear(-1.5),
        isManagedByHomeostasis: true,
        description:
          "Insulin clears glucose into tissues, lowering circulating levels.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "oxygen",
    label: "Oxygen Delivery",
    group: "Metabolic",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology:
        "Cerebral and systemic oxygen delivery driven by blood flow and respiratory efficiency.",
      application:
        "Track how aerobic exercise, breathwork, and certain nootropics support brain fuel delivery.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "focus"],
    baseline: fnBaseline(() => 50.0),
    metadata: { version: "1.0.0" },
  },
  {
    key: "ketone",
    label: "Ketone / FFA",
    group: "Metabolic",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Metabolic,
      unit: "mmol/L",
      referenceRange: { min: 0.1, max: 5.0 },
    },
    description: {
      physiology:
        "Ketone and free fatty acid levels reflect reliance on fat oxidation during fasting or low insulin states.",
      application:
        "Use to confirm fasting, low-carb diets, or cold exposure are shifting you toward fat metabolism.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "digestion", "longevity"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      const overnight = gaussianPhase(p, hourToPhase(19.5), widthToConcentration(400)) + gaussianPhase(p, hourToPhase(22.5), widthToConcentration(260));
      const daySuppression = gaussianPhase(p, hourToPhase(7.5), widthToConcentration(300));
      // Baseline ~0.3 mmol/L. Fasting -> 1.5 mmol/L.
      const tone = 0.3 + 1.2 * overnight - 0.5 * daySuppression;
      return Math.max(0.1, tone);
    }),
    couplings: [
      {
        source: "glucagon",
        mapping: linear(0.02),
        description:
          "Glucagon promotes lipolysis and ketogenesis during fasting.",
      },
      {
        source: "insulin",
        mapping: linear(-0.05),
        description:
          "Insulin suppresses ketone production by inhibiting lipolysis.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "energy",
    label: "Energy",
    group: "Subjective",
    isPremium: false,
    semantics: DEFAULT_SEMANTICS.Subjective,
    description: {
      physiology:
        "Composite readout of endocrine and neurotransmitter cues that create perceived energy capacity.",
      application:
        "Tie subjectively productive hours to the objective drivers shown here to design better schedules.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "weightLoss", "productivity"],
    baseline: fnBaseline((minute, ctx) => {
      const p = minuteToPhase(minute);
      const morning = gaussianPhase(p, hourToPhase(2.5), widthToConcentration(180));
      const afternoon = gaussianPhase(p, hourToPhase(6), widthToConcentration(260));
      const slump = gaussianPhase(p, hourToPhase(14), widthToConcentration(200));
      const tone = 3.0 + 4.0 * (morning + afternoon) - 1.5 * slump;

      const metabolicScale = ctx.physiology?.metabolicCapacity ?? 1.0;
      return tone * (0.8 + 0.2 * metabolicScale);
    }),
    couplings: [
      {
        source: "cortisol",
        mapping: linear(0.1),
        description: "Moderate cortisol supplies glucose for perceived energy.",
      },
      {
        source: "thyroid",
        mapping: linear(0.5), // Thyroid (2.0) -> +1.0 score
        description:
          "Thyroid-mediated metabolic rate boosts systemic energy availability.",
      },
      {
        source: "dopamine",
        mapping: linear(0.06), // Dopamine (50) -> +3.0 score
        description: "Dopamine contributes to subjective drive and vigor.",
      },
      {
        source: "melatonin",
        mapping: linear(-0.05), // Melatonin (80) -> -4.0 score
        description:
          "Melatonin signals biological night, pulling down perceived energy.",
      },
      {
        source: "estrogen",
        mapping: linear(0.02), // Estrogen (100) -> +2.0 score
        description:
          "Estrogen supports metabolic vigor and perceived energy availability.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "vagal",
    label: "Vagal Tone",
    group: "Autonomic",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Autonomic,
    description: {
      physiology:
        "Vagal tone expresses parasympathetic braking on the heart and organs via the vagus nerve.",
      application:
        "Breathwork, HRV training, or calm evenings should lift vagal tone for better recovery.",
    },
    display: { tendency: "higher" },
    goals: ["calm", "recovery", "sleep"],
    baseline: fnBaseline((minute) => {
      const p = minuteToPhase(minute);
      // High vagal tone from afternoon through sleep (13:00 -> 07:00)
      const parasym = windowPhase(p, hourToPhase(13), hourToPhase(7), minutesToPhaseWidth(60));
      const drop = gaussianPhase(p, hourToPhase(1), widthToConcentration(60));
      return 0.4 + 0.35 * parasym - 0.15 * drop;
    }),
    couplings: [
      {
        source: "oxytocin",
        mapping: linear(0.04), // Oxytocin (5) -> +0.2
        description:
          "Oxytocin enhances parasympathetic vagal tone during bonding/relaxation.",
      },
      {
        source: "gaba",
        mapping: linear(0.006), // GABA (50) -> +0.3
        description: "GABA-mediated inhibition promotes vagal dominance.",
      },
      {
        source: "adrenaline",
        mapping: linear(-0.002), // Adrenaline (200) -> -0.4
        description: "Adrenergic surges withdraw vagal tone.",
      },
      {
        source: "cortisol",
        mapping: linear(-0.01), // Cortisol (20) -> -0.2
        description: "Chronic cortisol diminishes vagal recovery capacity.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "testosterone",
    label: "Testosterone",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ng/dL",
      referenceRange: { min: 250, max: 950 },
    },
    description: {
      physiology: "Androgen supporting muscle, motivation, and erythropoiesis.",
      application:
        "Use as a low-frequency trend (labs) rather than acute chart.",
    },
    display: { tendency: "higher" },
    goals: ["cycle", "energy", "recovery"],
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;

      // Age decline: ~1% per year after 30
      const ageFactor = Math.max(0.5, 1 - Math.max(0, subject.age - 30) * 0.01);

      let val = 0;
      if (subject.sex === "male") {
        // Diurnal rhythm for males: peak in morning ~600 ng/dL
        const p = minuteToPhase(minute);
        const circadian = 400.0 + 300.0 * gaussianPhase(p, hourToPhase(8), widthToConcentration(240));
        val = circadian * ageFactor;
      } else {
        // Lower, steady baseline for females ~40 ng/dL
        val = 40.0 * ageFactor;
      }
      return val;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "estrogen",
    label: "Estrogen",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "pg/mL",
      referenceRange: { min: 20, max: 300 },
    },
    description: {
      physiology:
        "Estrogen tunes metabolism, cognition, and reproductive cycles.",
      application: "Track phases or hormone therapy contextually.",
    },
    display: { tendency: "higher" },
    goals: ["cycle", "energy", "mood", "focus"],
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === "male") {
        return 30.0; // Low constant for males
      }
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      // Normalized 0-1 * 250 + 20
      const val =
        20.0 + 250.0 * getMenstrualHormones(day, subject.cycleLength).estrogen;
      return val;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "progesterone",
    label: "Progesterone",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ng/mL",
      referenceRange: { min: 0.1, max: 20 },
    },
    description: {
      physiology:
        "Progesterone rises in the luteal phase, raising body temp and promoting GABAergic calm.",
      application:
        "Expect higher sleep drive and slightly reduced insulin sensitivity during the luteal peak.",
    },
    display: { tendency: "mid" },
    goals: ["cycle", "calm", "sleep"],
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === "male") return 0.2;
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      // Normalized 0-1 * 18 + 0.2
      return (
        0.2 + 18.0 * getMenstrualHormones(day, subject.cycleLength).progesterone
      );
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "lh",
    label: "LH",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "IU/L",
      referenceRange: { min: 1, max: 20 },
    },
    description: {
      physiology: "Luteinizing Hormone spikes to trigger ovulation.",
      application: "Marker of ovulation timing.",
    },
    display: { tendency: "neutral" },
    goals: ["cycle"],
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === "male") return 5.0;
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      // Peak at ovulation ~20-50 IU/L. Let's say 30 baseline peak.
      return 2.0 + 30.0 * getMenstrualHormones(day, subject.cycleLength).lh;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "fsh",
    label: "FSH",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "IU/L",
      referenceRange: { min: 1, max: 15 },
    },
    description: {
      physiology: "Follicle Stimulating Hormone recruits ovarian follicles.",
      application: "Correlates with early follicular phase.",
    },
    display: { tendency: "neutral" },
    goals: ["cycle"],
    baseline: fnBaseline((minute, ctx) => {
      const subject = ctx.subject ?? DEFAULT_SUBJECT;
      if (subject.sex === "male") return 5.0;
      const day = getDayOfCycle(minute, subject.cycleLength, subject.cycleDay);
      return 3.0 + 12.0 * getMenstrualHormones(day, subject.cycleLength).fsh;
    }),
    metadata: { version: "1.0.0" },
  },
  {
    key: "hrv",
    label: "HRV",
    group: "Autonomic",
    isPremium: false,
    semantics: {
      ...DEFAULT_SEMANTICS.Autonomic,
      unit: "ms",
      referenceRange: { min: 20, max: 100 },
    },
    description: {
      physiology:
        "Heart Rate Variability reflects the balance between sympathetic and parasympathetic branches.",
      application:
        "Track as a primary marker of recovery and autonomic readiness.",
    },
    display: { tendency: "higher" },
    goals: ["recovery", "calm"],
    baseline: fnBaseline(() => 50.0),
    couplings: [
      {
        source: "vagal",
        mapping: linear(40.0),
        description: "Vagal tone drives the HF component of HRV.",
      },
      {
        source: "adrenaline",
        mapping: linear(-0.1),
        description: "Sympathetic activation suppresses HRV.",
      },
      {
        source: "norepi",
        mapping: linear(-0.08),
        description: "Sympathetic norepinephrine suppresses HRV.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "bloodPressure",
    label: "Blood Pressure",
    group: "Autonomic",
    isPremium: false,
    semantics: {
      ...DEFAULT_SEMANTICS.Autonomic,
      unit: "mmHg",
      referenceRange: { min: 70, max: 110 },
    },
    description: {
      physiology:
        "Systemic arterial pressure driven by cardiac output and peripheral resistance.",
      application:
        "Monitor spikes from stimulants, stress, or intense lifting.",
    },
    display: { tendency: "lower" },
    goals: ["energy", "recovery"],
    baseline: fnBaseline(() => 90.0),
    couplings: [
      {
        source: "adrenaline",
        mapping: linear(0.05),
        description: "Adrenaline increases heart rate and vasoconstriction.",
      },
      {
        source: "cortisol",
        mapping: linear(0.5),
        description:
          "Cortisol increases vascular sensitivity to catecholamines.",
      },
      {
        source: "vagal",
        mapping: linear(-10.0),
        description: "Vagal activity lowers blood pressure via bradycardia.",
      },
      {
        source: "norepi",
        mapping: linear(0.4),
        description: "Norepinephrine causes vasoconstriction, raising BP.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "ethanol",
    label: "Ethanol",
    group: "Metabolic",
    isPremium: false,
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology: "Circulating alcohol awaiting hepatic metabolism.",
      application:
        "Simulate the clearing time and its impact on sleep architecture.",
    },
    display: { tendency: "lower" },
    goals: ["calm", "sleep"],
    baseline: fnBaseline(() => 0),
    metadata: { version: "1.0.0" },
  },
  {
    key: "acetaldehyde",
    label: "Acetaldehyde",
    group: "Metabolic",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology:
        "Primary toxic metabolite of ethanol; drives hangovers and oxidative stress.",
      application: 'Track the "hangover tail" after alcohol consumption.',
    },
    display: { tendency: "lower" },
    goals: ["recovery"],
    baseline: fnBaseline(() => 0),
    couplings: [
      {
        source: "ethanol",
        mapping: linear(0.3),
        description: "Conversion of ethanol by ADH.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "inflammation",
    label: "Inflammation",
    group: "Metabolic",
    isPremium: false,
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology:
        "Systemic inflammatory tone reflecting cytokine activity (IL-6, TNF-α, CRP).",
      application:
        "Track inflammatory burden from stress, poor sleep, alcohol, and diet.",
    },
    display: { tendency: "lower" },
    goals: ["recovery", "pain", "longevity"],
    baseline: fnBaseline(() => 1.0),
    couplings: [
      {
        source: "cortisol",
        mapping: linear(-0.2),
        description: "Cortisol is a potent endogenous anti-inflammatory.",
      },
      {
        source: "adrenaline",
        mapping: linear(0.08),
        description:
          "Acute stress can trigger transient inflammatory cytokine release.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "bdnf",
    label: "BDNF",
    group: "Neuro",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Neuro,
      unit: "ng/mL",
      referenceRange: { min: 10, max: 40 },
    },
    description: {
      physiology:
        "Brain-Derived Neurotrophic Factor supports neuronal survival and synaptic plasticity.",
      application:
        "Track how exercise, sleep, and certain nootropics support brain health.",
    },
    display: { tendency: "higher" },
    goals: ["focus", "recovery", "longevity"],
    baseline: fnBaseline(() => 25.0), // Serum BDNF baseline ~25 ng/mL
    couplings: [
      {
        source: "growthHormone",
        mapping: linear(0.5),
        description: "GH and IGF-1 support BDNF expression.",
      },
      {
        source: "cortisol",
        mapping: linear(-0.3),
        description: "Chronic high cortisol suppresses hippocampal BDNF.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "magnesium",
    label: "Magnesium",
    group: "Metabolic",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Metabolic,
    description: {
      physiology:
        "Intracellular magnesium levels; critical for >300 enzymatic reactions.",
      application:
        "Assess status in context of ADHD management and stress recovery.",
    },
    display: { tendency: "higher" },
    goals: ["recovery", "calm", "focus"],
    baseline: fnBaseline(() => 0.6),
    couplings: [
      {
        source: "adrenaline",
        mapping: linear(-0.05),
        description:
          "Stress-induced catecholamine release increases magnesium excretion.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "sensoryLoad",
    label: "Sensory Load",
    group: "Subjective",
    isPremium: true,
    semantics: DEFAULT_SEMANTICS.Subjective,
    description: {
      physiology:
        "Accumulated sensory input processing demand; particularly relevant for Autism profiles.",
      application:
        'Use to predict "overload" or meltdowns when combined with high arousal.',
    },
    display: { tendency: "lower" },
    goals: ["calm", "focus"],
    baseline: fnBaseline(() => 0.1),
    couplings: [
      {
        source: "adrenaline",
        mapping: linear(0.2),
        description: "Hyper-arousal increases sensory sensitivity.",
      },
      {
        source: "gaba",
        mapping: linear(-0.15),
        description: "GABAergic inhibition helps filter sensory input.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "shbg",
    label: "SHBG",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "nmol/L",
      referenceRange: { min: 20, max: 100 },
    },
    description: {
      physiology:
        "Sex Hormone Binding Globulin; regulates free vs bound hormone fractions.",
      application:
        "Important for understanding bioavailable testosterone and estrogen.",
    },
    display: { tendency: "mid" },
    goals: ["cycle"],
    baseline: fnBaseline(() => 40.0),
    couplings: [
      {
        source: "insulin",
        mapping: linear(-0.2),
        description: "High insulin levels suppress hepatic SHBG production.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "ferritin",
    label: "Ferritin / Iron",
    group: "Metabolic",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Metabolic,
      unit: "ng/mL",
      referenceRange: { min: 20, max: 300 },
    },
    description: {
      physiology:
        "Iron stores critical for oxygen transport and mitochondrial energy production.",
      application:
        "Track energy dips related to menstrual blood loss or dietary intake.",
    },
    display: { tendency: "higher" },
    goals: ["energy", "recovery"],
    baseline: fnBaseline(() => 60.0),
    metadata: { version: "1.0.0" },
  },
  {
    key: "dheas",
    label: "DHEA-S",
    group: "Endocrine",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ug/dL",
      referenceRange: { min: 100, max: 400 },
    },
    description: {
      physiology:
        "Adrenal androgen and neurosteroid; counter-regulatory to cortisol.",
      application:
        "Assess the Cortisol/DHEA ratio as a marker of HPA axis resilience.",
    },
    display: { tendency: "higher" },
    goals: ["cycle", "energy", "recovery"],
    baseline: fnBaseline(() => 200.0),
    couplings: [
      {
        source: "cortisol",
        mapping: linear(-2.0),
        description:
          "Adrenal steal or chronic stress can divert precursors away from DHEA.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "alt",
    label: "ALT (Liver)",
    group: "Organ",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Organ,
      unit: "U/L",
      referenceRange: { min: 10, max: 50 },
    },
    description: {
      physiology: "Liver enzyme; marker of hepatic stress or turnover.",
      application: "Monitor during high metabolic load or toxin exposure.",
    },
    display: { tendency: "lower" },
    goals: ["recovery", "digestion"],
    baseline: fnBaseline(() => 20.0),
    couplings: [
      {
        source: "acetaldehyde",
        mapping: linear(5.0),
        description: "Toxic metabolites stress hepatic tissue.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "ast",
    label: "AST (Liver)",
    group: "Organ",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Organ,
      unit: "U/L",
      referenceRange: { min: 10, max: 50 },
    },
    description: {
      physiology: "Liver/Heart enzyme; marker of tissue turnover.",
      application: "Track alongside ALT for liver health assessment.",
    },
    display: { tendency: "lower" },
    goals: ["recovery"],
    baseline: fnBaseline(() => 20.0),
    metadata: { version: "1.0.0" },
  },
  {
    key: "egfr",
    label: "eGFR (Kidney)",
    group: "Organ",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Organ,
      unit: "mL/min",
      referenceRange: { min: 60, max: 120 },
    },
    description: {
      physiology:
        "Estimated Glomerular Filtration Rate; marker of kidney function.",
      application: "Monitor during high protein intake or chronic stress.",
    },
    display: { tendency: "higher" },
    goals: ["recovery"],
    baseline: fnBaseline(() => 100.0),
    metadata: { version: "1.0.0" },
  },
  {
    key: "vitaminD3",
    label: "Vitamin D3",
    group: "Endocrine",
    isPremium: false,
    semantics: {
      ...DEFAULT_SEMANTICS.Endocrine,
      unit: "ng/mL",
      referenceRange: { min: 30, max: 100 },
    },
    description: {
      physiology:
        "Steroid hormone precursor critical for immunity and calcium metabolism.",
      application: "Long-term baseline tracker.",
    },
    display: { tendency: "higher" },
    goals: ["recovery", "cycle", "longevity"],
    baseline: fnBaseline(() => 40.0),
    metadata: { version: "1.0.0" },
  },
  {
    key: "mtor",
    label: "mTOR",
    group: "Metabolic",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Metabolic,
      unit: "fold-change",
      referenceRange: { min: 0.5, max: 3.0 },
    },
    description: {
      physiology: "Master regulator of cell growth and protein synthesis.",
      application: 'Visualize anabolic "building" windows vs recovery.',
    },
    display: { tendency: "neutral" },
    goals: ["recovery", "energy", "weightLoss", "longevity"],
    baseline: fnBaseline(() => 1.0), // Baseline = 1.0x (no change)
    couplings: [
      {
        source: "insulin",
        mapping: linear(0.03),
        description: "Insulin/IGF-1 signaling activates the mTOR pathway.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
  {
    key: "ampk",
    label: "AMPK",
    group: "Metabolic",
    isPremium: true,
    semantics: {
      ...DEFAULT_SEMANTICS.Metabolic,
      unit: "fold-change",
      referenceRange: { min: 0.5, max: 3.0 },
    },
    description: {
      physiology:
        "Energy sensor that triggers catabolic pathways and autophagy.",
      application: 'Visualize "cleaning" and energy conservation windows.',
    },
    display: { tendency: "neutral" },
    goals: ["energy", "recovery", "digestion", "weightLoss", "longevity"],
    baseline: fnBaseline(() => 1.0), // Baseline = 1.0x (no change)
    couplings: [
      {
        source: "insulin",
        mapping: linear(-0.04),
        description: "Insulin inhibits AMPK as it signals energy abundance.",
      },
      {
        source: "glucagon",
        mapping: linear(0.01),
        description: "Glucagon signals energy deficit, activating AMPK.",
      },
    ],
    metadata: { version: "1.0.0" },
  },
];

export const SIGNAL_LIBRARY = Object.fromEntries(
  SIGNAL_DEFS.map((def) => [def.key, def])
) as Record<Signal, SignalDef>;

const baselineFnFromSpec = (spec: BaselineSpec): BaselineFn => {
  switch (spec.kind) {
    case "function":
      return (minute: Minute, ctx: BaselineContext) => {
        const val = spec.fn(minute, ctx);
        if (isNaN(val)) {
          console.error(
            `[BaselineFn] NaN produced for ${spec.kind} at ${minute}min`
          );
        }
        return val;
      };
    case "flat":
      return () => spec.value;
    case "gaussianMix":
      return (minute: Minute) =>
        spec.terms.reduce(
          (sum, term) =>
            sum + term.gain * gaussianPhase(minuteToPhase(minute), hourToPhase(term.centerHours), widthToConcentration(term.widthMin)),
          0
        );
    case "sigmoidCombo":
      return (minute: Minute) => {
        const p = minuteToPhase(minute);
        const rise = sigmoidPhase(p, hourToPhase(spec.riseHour), minutesToPhaseWidth(spec.riseSlope * 4));
        const fall = sigmoidPhase(p, hourToPhase(spec.fallHour), minutesToPhaseWidth(spec.fallSlope * 4));
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