import type { InterventionDef, KernelSet } from "@/types";

/**
 * Small helpers shared by kernels
 */
const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));
const exp = Math.exp;

/**
 * Generic 1st-order PK “tablet” model (one-compartment, first-order absorption/elimination),
 * returned as a concentration-like effect scaler in [0..1].
 * k_a: absorption rate (1/min), k_e: elimination rate (1/min), tlag: absorption lag (min)
 * Area is normalized so that max steady peak ~ 1 for typical k_a/k_e combos.
 */
function pk1(t: number, k_a: number, k_e: number, tlag = 0) {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  const val = (k_a / (k_a - k_e)) * (exp(-k_e * tau) - exp(-k_a * tau));
  // normalize to a reasonable peak ~1 across plausible k_a/k_e:
  const norm =
    1 / Math.max(1e-6, (k_a / (k_a - k_e)) * (k_a ** -1 - k_e ** -1));
  return Math.max(0, val * norm);
}

/**
 * Dual-absorption helper: convex mix of two pk1 pulses (e.g., XR products).
 */
function pk_dual(
  t: number,
  a1: number,
  a2: number,
  e: number,
  lag1 = 0,
  lag2 = 0,
  w = 0.6
) {
  return clamp(w * pk1(t, a1, e, lag1) + (1 - w) * pk1(t, a2, e, lag2), 0, 1);
}

/**
 * Simple gamma-like appearance curve for nutrients (meal → blood).
 * k_rise controls onset, k_fall the tail. Shift with tlag to mimic gastric emptying.
 */
function gammaPulse(t: number, k_rise: number, k_fall: number, tlag = 0) {
  if (t <= tlag) return 0;
  const tau = t - tlag;
  // (1 - e^{-tau/k_rise}) * e^{-tau/k_fall}
  return (1 - exp(-tau / k_rise)) * exp(-tau / k_fall);
}

/**
 * Very small Hill curve helper for saturating effects: H = x^n / (x50^n + x^n)
 */
function hill(x: number, x50: number, n = 1.4) {
  const xn = Math.pow(Math.max(0, x), n);
  const d = Math.pow(Math.max(1e-6, x50), n) + xn;
  return xn / d;
}

/**
 * Estimated gastric emptying delay (tlag, minutes) from fat & fiber with small hydration effect.
 * Anchored to human data that fat & soluble fiber slow emptying.
 */
function gastricDelay(p: any) {
  const base = 15; // min
  const fat = 0.9 * p.fat; // fat is potent
  const fSol = 2.0 * p.fiberSol; // soluble fiber slows markedly
  const fInsol = 0.5 * p.fiberInsol; // insoluble fiber modest
  const hydr = -0.01 * p.hydration; // more water, slightly faster emptying
  return clamp(base + fat + fSol + fInsol + hydr, 5, 150);
}

/**
 * Carbohydrate appearance split: rapid sugars vs starch (GI-weighted),
 * both blunted by fat & soluble fiber (slower emptying + lower appearance rate).
 */
function carbAppearance(t: number, p: any) {
  const tlag = gastricDelay(p);
  // Convert GI into relative starch appearance speed factor:
  const giFac = clamp((p.gi ?? 60) / 100, 0.25, 1.0);
  // Blunting from soluble fiber & fat (incretins, viscosity effects)
  const blunt = clamp(1 - 0.02 * p.fiberSol - 0.004 * p.fat, 0.6, 1);

  // Sugar: faster rise/shorter tail; Starch: slower and GI-scaled
  const sugar = gammaPulse(t, 6, 60, tlag) * p.carbSugar;
  const starch = gammaPulse(t, 14 / giFac, 110 / giFac, tlag) * p.carbStarch;

  return blunt * (sugar + starch); // “mg/dL-equivalent” appearance driver (arbitrary unit)
}

export const KERNEL_RUNTIME_HELPERS = {
  clamp,
  exp,
  pk1,
  pk_dual,
  gammaPulse,
  hill,
  gastricDelay,
  carbAppearance,
};

/**
 * First-phase / second-phase insulin secretion shape driven by glucose appearance.
 * We emulate a quick spike (β-cell first phase) plus a slower tail (second phase).
 */
function insulinSecretionFromMeal(t: number, p: any, I: number) {
  const A = carbAppearance(t, p);
  // Scale → cap amplitude using saturating Hill curve
  const amp = I * 1.8 * hill(A, 120, 1.5);
  const fast = gammaPulse(t, 5, 35, 0); // first phase
  const slow = gammaPulse(t, 18, 160, 0); // second phase
  return amp * (0.55 * fast + 0.45 * slow);
}

/**
 * Ghrelin suppression depth ~ energy & protein/fiber; tail lasts 2–4 h.
 */
function ghrelinDrop(t: number, p: any, I: number) {
  const kcal = 4 * (p.carbSugar + p.carbStarch) + 4 * p.protein + 9 * p.fat;
  const prot = p.protein || 0;
  const fsol = p.fiberSol || 0;
  const fins = p.fiberInsol || 0;
  const depth =
    I *
    clamp(
      0.0025 * prot + 0.0015 * fsol + 0.0007 * fins + 0.001 * (kcal / 100),
      0,
      0.9
    );
  const on = 1 - exp(-t / 18);
  const tail = exp(
    -Math.max(t - 120, 0) / (70 + 6 * prot + 6 * fsol + 2 * fins)
  );
  return -depth * on * tail;
}

/**
 * Leptin: minimal acute rise from a single meal; slow drift (hours) at most.
 * We model a very small, slow increase that saturates.
 */
function leptinSmallSlow(t: number, p: any, I: number) {
  const kcal = 4 * (p.carbSugar + p.carbStarch) + 4 * p.protein + 9 * p.fat;
  const A = I * clamp(0.0006 * (kcal / 100), 0, 0.2);
  return A * (1 - exp(-t / 180));
}

/**
 * Serotonin proxy: carb → tryptophan availability; small protein helps, large protein blunts.
 * We shape with carb load, a small protein term, and a moderate delay (gastric).
 */
function serotoninAfterMeal(t: number, p: any, I: number) {
  const tlag = clamp(gastricDelay(p) - 5, 0, 120);
  const carb = p.carbSugar + p.carbStarch;
  const prot = p.protein;
  const trpAvail = clamp(
    0.003 * carb + 0.001 * Math.min(prot, 25) - 0.0005 * Math.max(prot - 25, 0),
    0,
    0.5
  );
  const A = I * trpAvail;
  const tf = Math.max(0, t - tlag);
  return A * (1 - exp(-tf / 25)) * exp(-Math.max(tf - 150, 0) / 120);
}

/**
 * Dopamine: palatability (sugar+fat) → fast, short-lived reward signal.
 */
function dopaminePalatable(t: number, p: any, I: number) {
  const pal = clamp(0.004 * p.carbSugar + 0.003 * p.fat, 0, 1);
  return I * 0.25 * pal * exp(-t / 45);
}

export const FOOD_KERNELS: KernelSet = {
  insulin: {
    fn: `function(t,p,I){ 
      const A = (${carbAppearance.toString()})(t,p);
      const amp = I * 2.0 * (${hill.toString()})(A, 150, 1.4);
      const fast = (${gammaPulse.toString()})(t, 5, 35, 0); 
      const slow = (${gammaPulse.toString()})(t, 18, 160, 0);
      return amp * (0.6 * fast + 0.4 * slow);
    }`,
    desc: "Biphasic insulin secretion driven by carbohydrate appearance, using non-linear saturation."
  },

  glucose: {
    fn: `function(t,p,I){
      const A = (${carbAppearance.toString()})(t,p);
      const amp = I * 3.5 * (${hill.toString()})(A, 200, 1.3);
      const fast = (1 - Math.exp(-Math.max(0,t)/12)) * Math.exp(-Math.max(0,t)/60);
      const slow = (1 - Math.exp(-Math.max(0,t)/40)) * Math.exp(-Math.max(0,t)/180);
      const rise = amp * (0.6 * fast + 0.4 * slow);
      // Continuous crash (reactive hypoglycemia) proportional to peak insulin/glucose
      const crash = 0.25 * amp * (${pk1.toString()})(t, 1/40, 1/180, 90);
      return rise - crash;
    }`,
    desc: "Rise in blood glucose levels based on carbohydrate digestion and GI, followed by a continuous reactive 'crash' below baseline."
  },

  ghrelin: {
    fn: `function(t,p,I){ 
      const kcal = 4 * (p.carbSugar + p.carbStarch) + 4 * p.protein + 9 * p.fat;
      const depth = I * 0.95 * (${hill.toString()})(kcal, 400, 1.2);
      const on = 1 - Math.exp(-t / 18);
      const tail = Math.exp(-Math.max(t - 120, 0) / (100 + 0.1 * kcal));
      return -depth * on * tail;
    }`,
    desc: "Saturating suppression of ghrelin proportional to total caloric load."
  },

  leptin: {
    fn: `function(t,p,I){ 
      const kcal = 4 * (p.carbSugar + p.carbStarch) + 4 * p.protein + 9 * p.fat;
      const amp = I * 0.25 * (${hill.toString()})(kcal, 600, 1.3);
      return amp * (1 - Math.exp(-t / 180));
    }`,
    desc: "Minor acute increase in satiety hormone leptin, scaled non-linearly with meal size."
  },

  serotonin: {
    fn: `function(t,p,I){ 
      const tlag = (${gastricDelay.toString()})(p) - 5;
      const carb = p.carbSugar + p.carbStarch;
      const doseEffect = (${hill.toString()})(carb, 60, 1.4);
      const A = I * 0.5 * doseEffect;
      const tf = Math.max(0, t - tlag);
      return A * (1 - Math.exp(-tf / 25)) * Math.exp(-Math.max(tf - 150, 0) / 120);
    }`,
    desc: "Serotonin production via post-prandial tryptophan availability, using saturating carb-scaling."
  },

  dopamine: {
    fn: `function(t,p,I){ 
      const pal = (${hill.toString()})(0.004 * p.carbSugar + 0.003 * p.fat, 0.5, 1.2);
      return I * 0.35 * pal * Math.exp(-t / 45);
    }`,
    desc: "Immediate reward signal from palatable (sugar/fat) food, with non-linear reward scaling."
  },

  gaba: {
    fn: `function(t,p,I){
      const carb = p.carbSugar + p.carbStarch;
      const A = I * 0.25 * (${hill.toString()})(carb * 0.01 + p.fiberSol * 0.05, 0.5, 1.2);
      return A * (1 - Math.exp(-t/30));
    }`,
    desc: "Calming GABAergic effect from gut fermentation and satiety."
  },

  mtor: {
    fn: `function(t,p,I){
      const protein = p.protein || 0;
      const amp = I * 0.8 * (${hill.toString()})(protein, 30, 1.5);
      return amp * (${gammaPulse.toString()})(t, 30, 180, 45);
    }`,
    desc: "Activation of the mTOR growth pathway driven primarily by amino acid (leucine) availability from protein intake."
  },

  melatonin: {
    fn: `function(){ return 0; }`,
    desc: "No direct melatonin production from typical meals."
  },
};

/* ====================== Interventions ====================== */

export const INTERVENTIONS: InterventionDef[] = [
  {
    key: "wake",
    label: "Wake Up",
    color: "#facc15",
    icon: "🌅",
    defaultDurationMin: 60,
    params: [],
    kernels: {
      cortisol: {
        fn: `function(t,p,I){ 
          if(t<0) return 0;
          const tf = Math.max(0,t);
          return I * 0.45 * (1 - Math.exp(-tf/12)) * Math.exp(-tf/110);
        }`,
        desc: "Cortisol awakening response (CAR) to mobilize energy.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          return I * 0.25 * (1 - Math.exp(-tf/10)) * Math.exp(-tf/150);
        }`,
        desc: "Morning dopamine pulse to increase alertness and drive.",
      },
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          return -I * 0.6 * Math.exp(-t/20);
        }`,
        desc: "Rapid clearance of remaining nocturnal melatonin.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          return -I * 0.25 * Math.exp(-t/45);
        }`,
        desc: "Reduction in inhibitory GABA to support transition to wakefulness.",
      },
    },
    group: "Routine",
  },
  {
    key: "sleep",
    label: "Sleep / Lights Out",
    color: "#3b82f6",
    icon: "🌙",
    defaultDurationMin: 480,
    params: [],
    kernels: {
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const dur = p.duration || 480;
          if(tf <= dur) return I * 0.8 * (1 - Math.exp(-tf/60));
          const rec = tf - dur;
          return -I * 0.5 * Math.exp(-rec/30);
        }`,
        desc: "Sustained melatonin release during the sleep window.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const dur = p.duration || 480;
          if(tf <= dur) return I * 0.4 * (1 - Math.exp(-tf/45));
          const rec = tf - dur;
          return -I * 0.3 * Math.exp(-rec/40);
        }`,
        desc: "Increased inhibitory tone to maintain sleep state.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const dur = p.duration || 480;
          if(tf <= dur) return -I * 0.3 * (1 - Math.exp(-tf/90));
          const debt = tf - dur;
          return I * 0.22 * Math.exp(-debt/90);
        }`,
        desc: "Suppression of cortisol during early sleep, with rebound if sleep is cut short.",
      },
      growthHormone: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          // Sleep-onset GH pulse
          return I * 0.65 * (1 - Math.exp(-tf/30)) * Math.exp(-tf/120);
        }`,
        desc: "Deep sleep-associated growth hormone pulse.",
      },
    },
    group: "Routine",
  },
  {
    key: "nap",
    label: "Power Nap",
    color: "#60a5fa",
    icon: "😴",
    defaultDurationMin: 25,
    params: [
      {
        key: "quality",
        label: "Refreshment",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const active = Math.min(t, dur);
          const doseEffect = (${hill.toString()})(p.quality, 1.0, 1.4);
          return I * 0.25 * doseEffect * (1 - Math.exp(-active/10));
        }`,
        desc: "Short-term increase in inhibitory GABA for relaxation, scaled by nap quality.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const doseEffect = (${hill.toString()})(p.quality, 1.2, 1.3);
          if(t<=dur) return -I * 0.2 * doseEffect * (1 - Math.exp(-t/15));
          return -I * 0.15 * doseEffect * Math.exp(-(t-dur)/45);
        }`,
        desc: "Brief reduction in stress hormone levels with non-linear quality scaling.",
      },
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const doseEffect = (${hill.toString()})(p.quality, 1.0, 1.5);
          if(t<=dur) return -I * 0.1;
          const tf = t - dur;
          return I * 0.3 * doseEffect * Math.exp(-tf/180);
        }`,
        desc: "Post-nap alertness boost following initial sleep inertia.",
      },
    },
    group: "Routine",
  },
  {
    key: "social",
    label: "Social Interaction",
    color: "#f472b6",
    icon: "🗣️",
    defaultDurationMin: 60,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      oxytocin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          const active = Math.min(t, dur);
          const doseEffect = (${hill.toString()})(p.intensity, 1.2, 1.3);
          return I * 0.4 * doseEffect * (1 - Math.exp(-active/20));
        }`,
        desc: "Release of bonding hormone oxytocin during social engagement.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          const active = Math.min(t, dur);
          const doseEffect = (${hill.toString()})(p.intensity, 1.0, 1.4);
          return I * 0.2 * doseEffect * (1 - Math.exp(-active/30));
        }`,
        desc: "Reward signal from social connection and positive interaction.",
      },
      sensoryLoad: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          const active = Math.min(t, dur);
          const doseEffect = (${hill.toString()})(p.intensity, 1.5, 1.2);
          return I * 0.25 * doseEffect * (active/dur);
        }`,
        desc: "Increase in cognitive/sensory demand from social processing.",
      },
    },
    group: "Lifestyle",
  },
  {
    key: "electrolytes",
    label: "Electrolytes / Hydration",
    color: "#38bdf8",
    icon: "💧",
    defaultDurationMin: 15,
    params: [
      {
        key: "amount",
        label: "Volume (ml)",
        type: "slider",
        min: 0,
        max: 1000,
        step: 50,
        default: 250,
      },
    ],
    kernels: {
      bloodPressure: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/20, 1/180, 10);
          const doseEffect = (${hill.toString()})(p.amount, 500, 1.4);
          return I * 0.15 * doseEffect * pk;
        }`,
        desc: "Transient increase in blood volume and pressure from hydration.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0, t);
          const doseEffect = (${hill.toString()})(p.amount, 600, 1.2);
          return I * 0.08 * doseEffect * (1 - Math.exp(-tf/30));
        }`,
        desc: "Mild increase in vagal tone from improved hydration status.",
      },
    },
    group: "Supplements",
  },
  {
    key: "food",
    label: "Food",
    color: "#8fbf5f",
    icon: "🍽️",
    defaultDurationMin: 30,
    params: [
      {
        key: "carbSugar",
        label: "Sugar (g)",
        type: "slider",
        min: 0,
        max: 120,
        step: 5,
        default: 35,
      },
      {
        key: "carbStarch",
        label: "Starch (g)",
        type: "slider",
        min: 0,
        max: 150,
        step: 5,
        default: 40,
      },
      {
        key: "protein",
        label: "Protein (g)",
        type: "slider",
        min: 0,
        max: 80,
        step: 5,
        default: 30,
      },
      {
        key: "fat",
        label: "Fat (g)",
        type: "slider",
        min: 0,
        max: 70,
        step: 5,
        default: 20,
      },
      {
        key: "fiberSol",
        label: "Soluble fiber (g)",
        type: "slider",
        min: 0,
        max: 25,
        step: 1,
        default: 5,
      },
      {
        key: "fiberInsol",
        label: "Insoluble fiber (g)",
        type: "slider",
        min: 0,
        max: 25,
        step: 1,
        default: 4,
      },
      {
        key: "hydration",
        label: "Hydration (ml)",
        unit: "ml",
        type: "slider",
        min: 0,
        max: 1200,
        step: 50,
        default: 250,
      },
      {
        key: "gi",
        label: "Glycemic index",
        type: "slider",
        min: 20,
        max: 100,
        step: 5,
        default: 60,
      },
    ],
    kernels: FOOD_KERNELS,
    group: "Food",
  },
  {
    key: "alcohol",
    label: "Alcohol",
    color: "#f87171",
    icon: "🍸",
    defaultDurationMin: 60,
    params: [
      {
        key: "units",
        label: "Standard Units",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.5,
        default: 1.5,
      },
    ],
    kernels: {
      ethanol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const k_a = 1/15;
          const k_e = 1/90; 
          return I * (p.units/5) * (${pk1.toString()})(t, k_a, k_e, 10);
        }`,
        desc: "Blood ethanol concentration over time.",
      },
      acetaldehyde: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          // Peaking as ethanol clears
          const pk = (${pk1.toString()})(t, 1/60, 1/300, 45);
          return I * (p.units/5) * 0.8 * pk;
        }`,
        desc: "Metabolic byproduct acetaldehyde, peaking after ethanol and driving oxidative stress.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/15, 1/90, 10);
          // Rebound happens as ethanol clears (delayed negative compartment)
          const rebound = 0.45 * (${pk1.toString()})(t, 1/60, 1/240, 180);
          return I * (p.units/4) * (pk - rebound);
        }`,
        desc: "Acute GABAergic relaxation followed by a continuous compensatory glutamatergic rebound.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/30, 1/120, 20);
          const suppress = 0.6 * (${hill.toString()})(p.units/3 * pk, 0.5, 1.4);
          return -I * suppress;
        }`,
        desc: "Dose-dependent suppression of vagal tone (reduced HRV) by alcohol.",
      },
      inflammation: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          // Delayed inflammatory response peaking several hours later
          return I * (p.units/5) * 0.4 * (${pk1.toString()})(t, 1/120, 1/600, 240);
        }`,
        desc: "Delayed systemic inflammation triggered by ethanol metabolism and gut barrier disruption.",
      },
    },
    group: "Lifestyle",
  },
  {
    key: "meditation",
    label: "Meditation / Breathwork",
    color: "#60a5fa",
    icon: "🧘",
    defaultDurationMin: 20,
    params: [
      {
        key: "intensity",
        label: "Focus Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.8,
      },
    ],
    kernels: {
      vagal: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 20;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.0, 1.4);
          const active = Math.min(t, dur);
          const effect = I * 0.6 * intensityEffect * (1 - Math.exp(-active/8));
          const tail = t > dur ? Math.exp(-(t-dur)/45) : 1;
          return effect * tail;
        }`,
        desc: "Significant increase in vagal tone through slow breathing and focus, using non-linear scaling.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 20;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.2, 1.3);
          return I * 0.3 * intensityEffect * (1 - Math.exp(-Math.min(t, dur)/12));
        }`,
        desc: "Endogenous GABA release supporting a calm state, scaled by focus depth.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 20;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.4, 1.2);
          return -I * 0.2 * intensityEffect * (1 - Math.exp(-Math.min(t, dur)/15));
        }`,
        desc: "Acute reduction in circulating cortisol levels through deliberate parasympathetic activation.",
      },
    },
    group: "Wellness",
  },
  {
    key: "ritalinIR10",
    label: "Ritalin IR",
    color: "#f472b6",
    icon: "💊",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 40,
        step: 5,
        default: 10,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/30, 1/180, 20);
          const doseEffect = (${hill.toString()})(p.mg, 20, 1.5);
          return I * 1.5 * doseEffect * pk;
        }`,
        desc: "Rapid increase in synaptic dopamine via reuptake inhibition, using saturating PD.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/35, 1/200, 20);
          const doseEffect = (${hill.toString()})(p.mg, 25, 1.4);
          return I * 1.0 * doseEffect * pk;
        }`,
        desc: "Increase in norepinephrine supporting focus, with non-linear dose scaling.",
      },
    },
    group: "Stimulants",
  },
  {
    key: "nootropicStack",
    label: "Nootropic Stack",
    color: "#10b981",
    icon: "🌿",
    defaultDurationMin: 360,
    params: [
      {
        key: "theanine",
        label: "L-Theanine (mg)",
        type: "slider",
        min: 0,
        max: 600,
        step: 50,
        default: 200,
      },
      {
        key: "magnesium",
        label: "Magnesium (mg)",
        type: "slider",
        min: 0,
        max: 800,
        step: 50,
        default: 200,
      },
    ],
    kernels: {
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/45, 1/300, 30);
          const doseEffect = (${hill.toString()})(p.theanine, 250, 1.3);
          return I * 0.6 * doseEffect * pk;
        }`,
        desc: "L-Theanine driven GABAergic relaxation with saturating dose-response.",
      },
      magnesium: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/90, 1/600, 60);
          const doseEffect = (${hill.toString()})(p.magnesium, 400, 1.2);
          return I * 0.8 * doseEffect * pk;
        }`,
        desc: "Systemic magnesium availability with saturating absorption kinetics.",
      },
      bdnf: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0, t);
          const doseEffect = (${hill.toString()})(p.magnesium, 400, 1.2);
          return I * 0.3 * doseEffect * (1 - Math.exp(-tf/120));
        }`,
        desc: "Support for BDNF expression scaled non-linearly with magnesium intake.",
      },
      mtor: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0, t);
          const doseEffect = (${hill.toString()})(p.magnesium, 500, 1.1);
          return I * 0.1 * doseEffect * (1 - Math.exp(-tf/240));
        }`,
        desc: "Co-factor support for mTOR signaling with saturating efficacy.",
      },
    },
    group: "Supplements",
  },
  {
    key: "creatine",
    label: "Creatine",
    color: "#6366f1",
    icon: "💪",
    defaultDurationMin: 1440,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 10000,
        step: 500,
        default: 5000,
      },
    ],
    kernels: {
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.mg, 5000, 1.5);
          return I * 0.3 * doseEffect * (1 - Math.exp(-t/360));
        }`,
        desc: "Buildup of phosphocreatine stores with saturating cellular uptake.",
      },
      mtor: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.mg, 6000, 1.4);
          return I * 0.15 * doseEffect * (1 - Math.exp(-t/240));
        }`,
        desc: "Mild mTOR stimulation scaled non-linearly with dosage.",
      },
    },
    group: "Supplements",
  },
  {
    key: "contraceptive",
    label: "Oral Contraceptive",
    color: "#ec4899",
    icon: "💊",
    defaultDurationMin: 1440,
    params: [
      {
        key: "potency",
        label: "Potency",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      estrogen: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          // Steady-state exogenous estrogen delivery
          const pk = (${pk1.toString()})(t, 1/60, 1/1440, 60);
          return I * p.potency * 0.5 * pk;
        }`,
        desc: "Exogenous ethinyl estradiol maintaining steady levels to suppress the natural endogenous cycle.",
      },
      progesterone: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/60, 1/1440, 60);
          return I * p.potency * 0.6 * pk;
        }`,
        desc: "Exogenous progestin to maintain hormonal levels and inhibit the LH surge.",
      },
      shbg: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          // Significant first-pass effect on liver SHBG production
          return I * p.potency * 0.45 * (1 - Math.exp(-t/720));
        }`,
        desc: "Marked increase in sex hormone-binding globulin (SHBG) from oral estrogen passage through the liver.",
      },
    },
    group: "Hormones",
  },
  {
    key: "inositol",
    label: "Inositol",
    color: "#8b5cf6",
    icon: "🍬",
    defaultDurationMin: 720,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 8000,
        step: 500,
        default: 2000,
      },
    ],
    kernels: {
      insulin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/60, 1/480, 45);
          const doseEffect = (${hill.toString()})(p.mg, 3000, 1.3);
          return -I * 0.4 * doseEffect * pk;
        }`,
        desc: "Improvement in insulin sensitivity using saturating PD model.",
      },
    },
    group: "Supplements",
  },
  {
    key: "guanfacine",
    label: "Guanfacine (Intuniv)",
    color: "#a78bfa",
    icon: "💊",
    defaultDurationMin: 1440,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 4,
        step: 1,
        default: 1,
      },
    ],
    kernels: {
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/120, 1/1200, 60);
          const doseEffect = (${hill.toString()})(p.mg, 2, 1.6);
          return -I * 0.8 * doseEffect * pk;
        }`,
        desc: "Reduction in norepinephrine activity via alpha-2A receptor agonism with non-linear scaling.",
      },
      adrenaline: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/120, 1/1200, 60);
          const doseEffect = (${hill.toString()})(p.mg, 2.5, 1.5);
          return -I * 0.6 * doseEffect * pk;
        }`,
        desc: "Suppression of peripheral adrenaline response with saturating efficacy.",
      },
      bloodPressure: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/120, 1/1200, 60);
          const doseEffect = (${hill.toString()})(p.mg, 2, 1.6);
          return -I * 0.5 * doseEffect * pk;
        }`,
        desc: "Systemic reduction in blood pressure through central sympatholytic action.",
      },
    },
    group: "Prescriptions",
  },
  {
    key: "bodyDoubling",
    label: "Body Doubling / Co-working",
    color: "#6366f1",
    icon: "👥",
    defaultDurationMin: 90,
    params: [
      {
        key: "socialIntensity",
        label: "Engagement",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 90;
          const doseEffect = (${hill.toString()})(p.socialIntensity, 1.0, 1.4);
          return I * 0.25 * doseEffect * (1 - Math.exp(-Math.min(t, dur)/20));
        }`,
        desc: "External accountability supporting sustained dopamine for focus with saturating effect.",
      },
      oxytocin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 90;
          const doseEffect = (${hill.toString()})(p.socialIntensity, 1.2, 1.3);
          return I * 0.3 * doseEffect * (1 - Math.exp(-Math.min(t, dur)/30));
        }`,
        desc: "Mild oxytocin release from shared presence, scaled non-linearly.",
      },
      sensoryLoad: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 90;
          const doseEffect = (${hill.toString()})(p.socialIntensity, 1.5, 1.2);
          return -I * 0.15 * doseEffect * (1 - Math.exp(-Math.min(t, dur)/45));
        }`,
        desc: "Reduction in perceived sensory distraction through social regulation.",
      },
    },
    group: "Social",
  },
  {
    key: "seedCycling",
    label: "Seed Cycling",
    color: "#fbbf24",
    icon: "🌱",
    defaultDurationMin: 1440,
    params: [
      {
        key: "phase",
        label: "Cycle Phase",
        type: "select",
        options: [
          { value: "follicular", label: "Follicular (Pumpkin/Flax)" },
          { value: "luteal", label: "Luteal (Sesame/Sunflower)" },
        ],
        default: "follicular",
      },
      {
        key: "dose",
        label: "Dose",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      estrogen: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.dose, 1.0, 1.5);
          return p.phase === "follicular" ? I * 0.08 * doseEffect : 0;
        }`,
        desc: "Mild phytoestrogenic support during follicular phase, using saturating dose scaling.",
      },
      progesterone: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.dose, 1.0, 1.5);
          return p.phase === "luteal" ? I * 0.08 * doseEffect : 0;
        }`,
        desc: "Mild progestogenic support during luteal phase with saturating PD.",
      },
    },
    group: "Hormones",
  },
  {
    key: "liss",
    label: "LISS Cardio",
    color: "#10b981",
    icon: "🏃‍♂️",
    defaultDurationMin: 60,
    params: [
      {
        key: "intensity",
        label: "Effort",
        type: "slider",
        min: 0,
        max: 1.5,
        step: 0.1,
        default: 0.5,
      },
    ],
    kernels: {
      ampk: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          const intensityEffect = (${hill.toString()})(p.intensity, 0.8, 1.4);
          return I * 0.45 * intensityEffect * (1 - Math.exp(-Math.min(t, dur)/40));
        }`,
        desc: "Activation of metabolic master switch AMPK during aerobic exercise.",
      },
      glucose: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.0, 1.5);
          return -I * 0.25 * intensityEffect * (1 - Math.exp(-Math.min(t, dur)/30));
        }`,
        desc: "Increased muscle glucose uptake during exercise with saturating demand.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<=0) return 0;
          const dur = p.duration || 60;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.0, 1.4);
          if(t<=dur) return -I * 0.08 * intensityEffect;
          return I * 0.25 * intensityEffect * Math.exp(-(t-dur)/30);
        }`,
        desc: "Post-exercise parasympathetic rebound and HRV improvement.",
      },
    },
    group: "Movement",
  },
  {
    key: "hiit",
    label: "HIIT Session",
    color: "#ef4444",
    icon: "⚡",
    defaultDurationMin: 25,
    params: [
      {
        key: "intensity",
        label: "Effort",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1.1,
      },
    ],
    kernels: {
      adrenaline: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.2, 1.6);
          if(t<=dur) return I * 0.8 * intensityEffect * Math.sin(Math.PI * t / dur);
          return I * 0.3 * intensityEffect * Math.exp(-(t-dur)/20);
        }`,
        desc: "Intense surge in catecholamines during high-intensity intervals.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.2, 1.5);
          if(t<=dur) return I * 0.45 * intensityEffect * (1 - Math.exp(-t/10));
          return -I * 0.15 * intensityEffect * Math.exp(-(t-dur)/60);
        }`,
        desc: "Acute stress response to high physiological demand.",
      },
      growthHormone: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const tf = Math.max(0, t - dur);
          const intensityEffect = (${hill.toString()})(p.intensity, 1.3, 1.6);
          return I * 0.6 * intensityEffect * Math.exp(-tf/120);
        }`,
        desc: "Post-exercise growth hormone spike driven by lactic threshold.",
      },
      inflammation: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const intensityEffect = (${hill.toString()})(p.intensity, 1.5, 1.4);
          if(t<=dur) return I * 0.25 * intensityEffect * (t/dur);
          return I * 0.25 * intensityEffect * Math.exp(-(t-dur)/180);
        }`,
        desc: "Transient inflammatory markers from muscular microtrauma.",
      },
    },
    group: "Movement",
  },
  {
    key: "caffeine",
    label: "Caffeine",
    color: "#c59f6f",
    icon: "☕",
    defaultDurationMin: 15,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 500,
        step: 5,
        default: 90,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const k_a = 1/45; 
          const k_e = (1/300) * (Cl / Vol); 
          const pk = (${pk1.toString()})(t, k_a, k_e, 10);
          return I * (p.mg/100) * 0.3 * (1/Vol) * pk;
        }`,
        desc: "Secondary dopamine increase via adenosine receptor antagonism.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const k_a = 1/45;
          const k_e = (1/300) * (Cl / Vol);
          const pk = (${pk1.toString()})(t, k_a, k_e, 10);
          return I * (p.mg/100) * 0.25 * (1/Vol) * pk;
        }`,
        desc: "Increase in norepinephrine, enhancing alertness and focus.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const k_a = 1/45;
          const k_e = (1/300) * (Cl / Vol);
          const pk = (${pk1.toString()})(t, k_a, k_e, 10);
          return I * (p.mg/100) * 0.1 * (1/Vol) * pk;
        }`,
        desc: "Mild stimulation of the HPA axis, increasing cortisol.",
      },
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const k_a = 1/45;
          const k_e = (1/300) * (Cl / Vol);
          const pk = (${pk1.toString()})(t, k_a, k_e, 10);
          // PD model: 200mg is roughly IC50 for ~30-50% suppression
          const conc = (p.mg / 200) * pk;
          const suppression = 0.7 * (${hill.toString()})(conc, 0.5, 1.2);
          return -I * suppression;
        }`,
        desc: "Non-linear suppression of melatonin production via adenosine and pineal interaction.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/45, 1/300, 10);
          return -I * (p.mg/100) * 0.15 * pk;
        }`,
        desc: "Reduction in inhibitory GABAergic tone contributing to increased arousal and potential jitters.",
      },
    },
    group: "Stimulants",
  },
  {
    key: "blueLight",
    label: "Blue light",
    color: "#6fa8dc",
    icon: "💡",
    defaultDurationMin: 60,
    params: [
      {
        key: "lux",
        label: "Intensity (lux eq.)",
        type: "slider",
        min: 0,
        max: 500,
        step: 5,
        default: 60,
      },
    ],
    kernels: {
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.lux||0, 25, 1.6);
          return -I * 0.85 * doseEffect; 
        }`,
        desc: "Suppression of pineal melatonin through ipRGC activation, with Hill-curve saturation."
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.lux||0, 100, 1.4);
          return I * 0.3 * doseEffect * (1 - Math.exp(-t/15));
        }`,
        desc: "Minor dopamine boost associated with light-induced alertness."
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const doseEffect = (${hill.toString()})(p.lux||0, 80, 1.5);
          return I * 0.25 * doseEffect * (1 - Math.exp(-t/20));
        }`,
        desc: "Slight cortisol increase contributing to the 'wake' signal."
      },
    },
    group: "Light",
  },
  {
    key: "sunlight",
    label: "Sunlight",
    color: "#fde047",
    icon: "☀️",
    defaultDurationMin: 45,
    params: [
      {
        key: "lux",
        label: "Illuminance (klux eq.)",
        type: "slider",
        min: 0,
        max: 150,
        step: 5,
        default: 90,
      },
    ],
    kernels: {
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const window = function(target,width){
            if(hr===null) return 0.5;
            const span = Math.max(width, 0.5);
            return Math.max(0, 1 - Math.abs(hr - target) / span);
          };
          const doseEffect = (${hill.toString()})(p.lux||0, 35, 1.4);
          const morning = window(7, 4);
          const evening = window(21, 3);
          return -I * doseEffect * (0.55 * morning + 0.95 * evening);
        }`,
        desc: "Phase-dependent suppression of melatonin to anchor the circadian clock."
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const morning = hr===null ? 0.6 : Math.max(0, 1 - Math.abs(hr - 8) / 4);
          const doseEffect = (${hill.toString()})(p.lux||0, 40, 1.6);
          const tf = Math.max(0,t);
          const rise = (1 - Math.exp(-tf/10)) * Math.exp(-tf/70);
          return I * 0.35 * doseEffect * morning * rise;
        }`,
        desc: "Enhanced morning cortisol rise through bright light exposure."
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const midday = hr===null ? 0.6 : Math.max(0, 1 - Math.abs(hr - 13.5) / 3.5);
          const doseEffect = (${hill.toString()})(p.lux||0, 30, 1.3);
          const tf = Math.max(0,t);
          const pulse = (1 - Math.exp(-tf/12)) * Math.exp(-tf/150);
          return I * 0.4 * doseEffect * midday * pulse;
        }`,
        desc: "Dopaminergic reward and alertness from high-intensity broad-spectrum light."
      },
      serotonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const midday = hr===null ? 0.6 : Math.max(0, 1 - Math.abs(hr - 12.5) / 5);
          const doseEffect = (${hill.toString()})(p.lux||0, 25, 1.5);
          return I * 0.5 * doseEffect * midday * (1 - Math.exp(-Math.max(0,t)/18));
        }`,
        desc: "Increased serotonin production and availability during daylight."
      },
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const day = hr===null ? 0.5 : Math.max(0, 1 - Math.abs(hr - 11) / 5);
          const doseEffect = (${hill.toString()})(p.lux||0, 30, 1.5);
          const build = (1 - Math.exp(-Math.max(0,t)/25));
          return I * 0.4 * doseEffect * day * build;
        }`,
        desc: "General metabolic and cognitive energy boost from sun exposure."
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const day = hr===null ? 0.4 : Math.max(0, 1 - Math.abs(hr - 14) / 4);
          const doseEffect = (${hill.toString()})(p.lux||0, 35, 1.4);
          return -I * 0.2 * doseEffect * day;
        }`,
        desc: "Slight reduction in inhibitory tone during active daylight hours."
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
          const morning = hr===null ? 0.5 : Math.max(0, 1 - Math.abs(hr - 9) / 3.5);
          const recovery = Math.max(0, t - Math.max(1, p.duration||45));
          const doseEffect = (${hill.toString()})(p.lux||0, 40, 1.4);
          return I * 0.3 * doseEffect * morning * (1 - Math.exp(-recovery/40));
        }`,
        desc: "Improved autonomic balance and vagal tone recovery post-exposure."
      },
    },
    group: "Light",
  },
  {
    key: "melatoninSupplement",
    label: "Melatonin (supplement)",
    color: "#a78bfa",
    icon: "💊",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 10,
        step: 0.5,
        default: 3,
      },
      {
        key: "release",
        label: "Release profile",
        type: "select",
        options: [
          { value: "immediate", label: "Immediate" },
          { value: "extended", label: "Extended" },
        ],
        default: "immediate",
      },
    ],
    kernels: {
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const slow = p.release === "extended";
          const k_a = slow ? 1/55 : 1/22;
          const k_e = slow ? 1/420 : 1/120;
          const pk = (${pk1.toString()})(t, k_a, k_e, 5);
          const dose = p.mg/3;
          return I * 0.6 * dose * pk;
        }`,
        desc: "Exogenous melatonin delivery following immediate or extended release PK.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const slow = p.release === "extended";
          const k_a = slow ? 1/60 : 1/24;
          const k_e = slow ? 1/360 : 1/150;
          const pk = (${pk1.toString()})(t, k_a, k_e, 5);
          const dose = p.mg/3;
          return -I * 0.25 * dose * pk;
        }`,
        desc: "Suppression of nocturnal cortisol by melatonin.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const slow = p.release === "extended";
          const k_a = slow ? 1/65 : 1/30;
          const k_e = slow ? 1/360 : 1/140;
          const pk = (${pk1.toString()})(t, k_a, k_e, 5);
          const dose = p.mg/3;
          return -I * 0.15 * dose * pk;
        }`,
        desc: "Reduction in evening dopaminergic drive.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const slow = p.release === "extended";
          const k_a = slow ? 1/50 : 1/20;
          const k_e = slow ? 1/280 : 1/120;
          const pk = (${pk1.toString()})(t, k_a, k_e, 5);
          const dose = p.mg/3;
          return I * 0.3 * dose * pk;
        }`,
        desc: "Synergistic increase in GABAergic inhibitory tone.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const slow = p.release === "extended";
          const k_a = slow ? 1/55 : 1/24;
          const k_e = slow ? 1/360 : 1/150;
          const pk = (${pk1.toString()})(t, k_a, k_e, 5);
          const dose = p.mg/3;
          const tf = Math.max(0,t);
          const sustain = (1 - Math.exp(-Math.max(tf-60,0)/90));
          return I * 0.22 * dose * pk * sustain;
        }`,
        desc: "Improvement in nocturnal vagal tone.",
      },
    },
    group: "Supplements",
  },
  {
    key: "adderallIR10",
    label: "Adderall IR",
    color: "#f97316",
    icon: "💊",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 40,
        step: 2.5,
        default: 10,
      },
      {
        key: "takenWithFood",
        label: "With food",
        type: "switch",
        default: false,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const onset = p.takenWithFood ? 45 : 20;
          const k_a = 1/60;
          const k_e = (1/660) * (Cl / Vol); // ~11h half-life
          const pk = (${pk1.toString()})(t, k_a, k_e, onset); 
          // Model crash as a slower, delayed negative pulse (fatigue/depletion)
          const crash = 0.35 * (${pk1.toString()})(t, k_a/4, k_e/2, onset + 300);
          return I * (p.mg/10) * 0.8 * (pk - crash);
        }`,
        desc: "Potent increase in synaptic dopamine followed by a continuous physiological 'crash'.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const onset = p.takenWithFood ? 45 : 20;
          const k_a = 1/55;
          const k_e = (1/600) * (Cl / Vol);
          const pk = (${pk1.toString()})(t, k_a, k_e, onset);
          const crash = 0.3 * (${pk1.toString()})(t, k_a/4, k_e/2, onset + 300);
          return I * (p.mg/10) * 0.55 * (pk - crash);
        }`,
        desc: "Significant increase in norepinephrine followed by a withdrawal rebound.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const Cl = p.metabolicScalar || 1;
          const Vol = p.clearanceScalar || 1;
          const onset = p.takenWithFood ? 45 : 20;
          const k_a = 1/70;
          const k_e = (1/720) * (Cl / Vol);
          const pk = (${pk1.toString()})(t, k_a, k_e, onset);
          return I * (p.mg/10) * 0.18 * (1/Vol) * pk;
        }`,
        desc: "Elevation of cortisol via sympathetic activation.",
      },
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const k_e = 1/660;
          // Substantial energy crash as the stimulant wears off
          return -I * (p.mg/10) * 0.4 * (${pk1.toString()})(t, 1/120, k_e/2, 420);
        }`,
        desc: "Systemic energy crash and burnout following peak stimulant effect.",
      },
    },
    group: "Stimulants",
  },
  {
    key: "adderallXR15",
    label: "Adderall XR",
    color: "#fb923c",
    icon: "💊",
    defaultDurationMin: 720,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 60,
        step: 5,
        default: 15,
      },
      {
        key: "takenWithFood",
        label: "With food",
        type: "switch",
        default: true,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const lag1 = p.takenWithFood ? 90 : 45;
          const lag2 = lag1 + 240;
          const k_e = 1/660;
          const pk = (${pk_dual.toString()})(t, 1/45, 1/60, k_e, lag1, lag2, 0.65);
          const crash = 0.3 * (${pk1.toString()})(t, 1/120, k_e/2, lag2 + 360);
          return I * (p.mg/15) * 0.9 * (pk - crash);
        }`,
        desc: "Extended-release dopaminergic support with a late-day dopamine drop.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const lag1 = p.takenWithFood ? 90 : 45;
          const lag2 = lag1 + 240;
          const k_e = 1/600;
          const pk = (${pk_dual.toString()})(t, 1/40, 1/55, k_e, lag1, lag2, 0.65);
          const crash = 0.25 * (${pk1.toString()})(t, 1/120, k_e/2, lag2 + 360);
          return I * (p.mg/15) * 0.62 * (pk - crash);
        }`,
        desc: "Sustained norepinephrine elevation followed by evening fatigue.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const lag1 = p.takenWithFood ? 90 : 45;
          const lag2 = lag1 + 240;
          const pk = (${pk_dual.toString()})(t, 1/60, 1/80, 1/720, lag1, lag2, 0.65);
          return I * (p.mg/15) * 0.2 * pk;
        }`,
        desc: "Moderate, sustained cortisol elevation from sympathetic drive.",
      },
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          // Late-day energy drop as the XR delivery concludes
          return -I * (p.mg/15) * 0.3 * (${pk1.toString()})(t, 1/180, 1/1200, 720);
        }`,
        desc: "Gradual energy decline and potential late-evening 'crash' as XR effect tapers.",
      },
    },
    group: "Stimulants",
  },
  {
    key: "walk",
    label: "Walk",
    color: "#4ade80",
    icon: "🚶",
    defaultDurationMin: 30,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.5,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||30);
          const inRide = Math.max(0, Math.min(t, dur));
          const effort = I * p.intensity;
          return effort * 0.16 * Math.sin(Math.PI * inRide / dur);
        }`,
        desc: "Moderate dopamine pulse from physical movement and environmental change.",
      },
      serotonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||30);
          const active = Math.min(t, dur);
          return I * p.intensity * 0.22 * (1 - Math.exp(-active/20));
        }`,
        desc: "Mild serotonin release associated with rhythmic aerobic activity.",
      },
      cortisol: {
        fn: `function(t,p,I){
          const dur = Math.max(1, p.duration||30);
          const active = Math.min(t, dur);
          const during = I * p.intensity * -0.06 * Math.sin(Math.PI * active / dur);
          const rec = t>dur ? -0.12 * Math.exp(-(t-dur)/40) : 0;
          return during + rec;
        }`,
        desc: "Reduction in cortisol through low-intensity movement.",
      },
      vagal: {
        fn: `function(t,p,I){
          const dur = Math.max(1, p.duration||30);
          if(t<=0) return 0;
          if(t<=dur) return -I * p.intensity * 0.08; 
          const rec = t - dur;
          return I * p.intensity * 0.22 * (1 - Math.exp(-rec/30));
        }`,
        desc: "Post-walk autonomic recovery and vagal tone improvement.",
      },
    },
    group: "Movement",
  },
  {
    key: "bike",
    label: "Bike",
    color: "#38bdf8",
    icon: "🚴",
    defaultDurationMin: 45,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.7,
      },
    ],
    kernels: {
      glucose: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||45);
          const active = Math.min(t, dur);
          return -I * p.intensity * 0.18 * (1 - Math.exp(-active/20));
        }`,
        desc: "Significant reduction in blood glucose due to muscular uptake during aerobic effort.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||45);
          const on = Math.max(0, Math.min(t, dur));
          return I * p.intensity * 0.26 * Math.sin(Math.PI * on / dur);
        }`,
        desc: "Dopamine release from sustained aerobic effort and speed.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||45);
          const inRide = t<=dur;
          const ride = inRide ? Math.sin(Math.PI * Math.max(0, t) / dur) : Math.exp(-(t-dur)/120);
          return I * p.intensity * 0.32 * ride;
        }`,
        desc: "Norepinephrine rise proportional to cardiovascular demand.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||45);
          const tf = Math.max(0,t);
          const during = tf<=dur ? 0.18 * p.intensity * (1 - Math.exp(-tf/15)) : 0;
          const rec = tf>dur ? -0.16 * Math.exp(-(tf-dur)/45) : 0;
          return I * (during + rec);
        }`,
        desc: "Initial cortisol rise during effort, followed by post-exercise drop.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<=0) return 0;
          const dur = Math.max(1, p.duration||45);
          if(t<=dur) return -I * p.intensity * 0.12;
          const rec = t - dur;
          return I * p.intensity * 0.25 * (1 - Math.exp(-rec/28));
        }`,
        desc: "Parasympathetic suppression during ride, followed by rebound.",
      },
      insulin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||45);
          if(t<=dur) return I * p.intensity * (-0.12);
          const rec = t - dur;
          return I * p.intensity * 0.22 * (1 - Math.exp(-rec/60)) * Math.exp(-rec/900);
        }`,
        desc: "Acute reduction in insulin requirement and improved sensitivity.",
      },
    },
    group: "Movement",
  },
  {
    key: "lift",
    label: "Lift",
    color: "#f87171",
    icon: "🏋",
    defaultDurationMin: 60,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.9,
      },
    ],
    kernels: {
      growthHormone: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0, t - (p.duration||60));
          return I * p.intensity * 0.45 * Math.exp(-tf/90);
        }`,
        desc: "Post-exercise growth hormone pulse stimulated by high-intensity loading.",
      },
      ghrelin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          // Model metabolic demand / post-exercise hunger that also signals GH release
          // Peaks a few hours after lifting
          return I * p.intensity * 0.3 * (${pk1.toString()})(t, 1/120, 1/480, 180);
        }`,
        desc: "Delayed metabolic signaling (via ghrelin) that amplifies nocturnal repair and growth hormone spikes.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||60);
          const on = Math.max(0, Math.min(t, dur));
          return I * p.intensity * 0.3 * Math.sin(Math.PI * on / dur);
        }`,
        desc: "Dopamine surge from heavy loading and accomplishment.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||60);
          const tf = Math.max(0,t);
          const during = tf<=dur ? 0.28 * p.intensity * (1 - Math.exp(-tf/12)) : 0;
          const rec = tf>dur ? -0.18 * Math.exp(-(tf-dur)/60) : 0;
          return I * (during + rec);
        }`,
        desc: "Cortisol elevation due to mechanical and systemic stress.",
      },
      adrenaline: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||60);
          if(t<=dur) return I * p.intensity * 0.28 * Math.sin(Math.PI * t / dur);
          const rec = t - dur;
          return I * p.intensity * 0.12 * Math.exp(-rec/45);
        }`,
        desc: "Adrenaline release supporting peak power and strength.",
      },
      insulin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||60);
          if(t<=dur) return I * p.intensity * (-0.15);
          const rec = t - dur;
          return I * p.intensity * 0.25 * (1 - Math.exp(-rec/70)) * Math.exp(-rec/840);
        }`,
        desc: "Acute increase in non-insulin dependent glucose disposal (GLUT4).",
      },
      mtor: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||60);
          // Mechanical tension triggers mTOR signaling which peaks post-lift
          const pk = (${pk1.toString()})(t, 1/60, 1/480, dur);
          return I * p.intensity * 0.5 * pk;
        }`,
        desc: "Mechanical loading-induced activation of the mTOR pathway for muscle hypertrophy.",
      },
      inflammation: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||60);
          // Acute muscle damage markers peak several hours later
          const pk = (${pk1.toString()})(t, 1/180, 1/1440, dur);
          return I * p.intensity * 0.3 * pk;
        }`,
        desc: "Transient inflammatory response signaling for muscle repair and remodeling.",
      },
    },
    group: "Movement",
  },
  {
    key: "sex",
    label: "Sexual activity",
    color: "#f472b6",
    icon: "💞",
    defaultDurationMin: 30,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(5, p.duration||30);
          const tf = Math.max(0,t);
          const active = Math.min(tf, dur);
          const during = tf<=dur ? I * p.intensity * 0.28 * Math.sin(Math.PI * active / dur) : 0;
          const rec = tf>dur ? -I * p.intensity * 0.18 * Math.exp(-(tf-dur)/25) : 0;
          return during + rec;
        }`,
        desc: "Intense dopaminergic surge during arousal, followed by refractory drop.",
      },
      oxytocin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(5, p.duration||30);
          const tf = Math.max(0,t);
          if(tf<=dur) return I * p.intensity * 0.35 * (1 - Math.exp(-tf/6));
          const rec = tf - dur;
          return I * p.intensity * 0.35 * Math.exp(-rec/150);
        }`,
        desc: "Sustained oxytocin release, particularly high post-activity.",
      },
      prolactin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(5, p.duration||30);
          const tf = Math.max(0,t);
          if(tf<=dur) return I * p.intensity * 0.08 * (tf / dur);
          const rec = tf - dur;
          return I * p.intensity * 0.42 * (1 - Math.exp(-rec/6)) * Math.exp(-rec/120);
        }`,
        desc: "Post-orgasmic prolactin surge, contributing to the refractory period.",
      },
      serotonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(5, p.duration||30);
          const tf = Math.max(0,t);
          if(tf<=dur) return I * p.intensity * 0.15 * (tf / dur);
          const rec = tf - dur;
          return I * p.intensity * 0.26 * (1 - Math.exp(-1 * rec/18)) * Math.exp(-rec/160);
        }`,
        desc: "Post-activity serotonin rise supporting mood and relaxation.",
      },
      cortisol: {
        fn: `function(t,p,I){
          const dur = Math.max(5, p.duration||30);
          const tf = Math.max(0,t);
          if(tf===0) return 0;
          if(tf<=dur) return -I * p.intensity * 0.06 * Math.sin(Math.PI * tf / dur);
          const rec = tf - dur;
          return -I * p.intensity * 0.16 * Math.exp(-rec/80);
        }`,
        desc: "Anxiolytic reduction in cortisol during and after activity.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<=0) return 0;
          const dur = Math.max(5, p.duration||30);
          if(t<=dur) return -I * p.intensity * 0.05 * Math.sin(Math.PI * t / dur);
          const rec = t - dur;
          return I * p.intensity * 0.3 * (1 - Math.exp(-rec/22)) * Math.exp(-rec/210);
        }`,
        desc: "Strong parasympathetic rebound post-activity.",
      },
    },
    group: "Intimacy",
  },
  {
    key: "coldExposure",
    label: "Cold immersion / shower",
    color: "#67e8f9",
    icon: "🧊",
    defaultDurationMin: 8,
    params: [
      {
        key: "intensity",
        label: "Cold load",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.9,
      },
    ],
    kernels: {
      adrenaline: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||8);
          const surge = t <= dur ? Math.sin(Math.PI * t / dur) : 0;
          return I * p.intensity * 0.8 * surge;
        }`,
        desc: "Immediate, intense adrenaline spike from cold shock response.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||8);
          const on = Math.max(0, Math.min(t, dur));
          const surge = Math.sin(Math.PI * on / dur);
          const rebound = t>dur ? Math.exp(-(t-dur)/25) : 0;
          return I * p.intensity * (0.75 * surge + 0.45 * rebound);
        }`,
        desc: "Massive norepinephrine surge (up to 200-300%) from cold shock.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const ramp = (1 - Math.exp(-tf/4));
          return I * p.intensity * 0.22 * ramp * Math.exp(-tf/70);
        }`,
        desc: "Steady, prolonged rise in dopamine following initial exposure.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||8);
          const on = Math.max(0, Math.min(t, dur));
          const acute = 0.16 * Math.sin(Math.PI * on / dur);
          const rec = t>dur ? -0.14 * Math.exp(-(t-dur)/50) : 0;
          return I * p.intensity * (acute + rec);
        }`,
        desc: "Acute stress response followed by adaptive cortisol reduction.",
      },
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const build = (1 - Math.exp(-tf/8));
          const tail = Math.exp(-tf/160);
          return I * p.intensity * 0.3 * build * tail;
        }`,
        desc: "Increased alertness and metabolic rate from thermogenesis.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<=0) return 0;
          const dur = Math.max(1, p.duration||8);
          if(t<=dur) return -I * p.intensity * 0.2;
          const rec = t - dur;
          return I * p.intensity * 0.32 * (1 - Math.exp(-rec/28));
        }`,
        desc: "Cold-induced vagal stimulation post-exposure.",
      },
    },
    group: "Temperature",
  },
  {
    key: "heatSauna",
    label: "Heat / sauna",
    color: "#fb7185",
    icon: "🔥",
    defaultDurationMin: 20,
    params: [
      {
        key: "intensity",
        label: "Heat load",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.8,
      },
    ],
    kernels: {
      adrenaline: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||20);
          const surge = t <= dur ? Math.sin(Math.PI * t / dur) : 0;
          return I * p.intensity * 0.35 * surge;
        }`,
        desc: "Increase in heart rate and adrenaline due to heat-induced cardiovascular demand.",
      },
      serotonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||20);
          const on = Math.max(0, Math.min(t, dur));
          const build = 1 - Math.exp(-on/8);
          const rec = t>dur ? Math.exp(-(t-dur)/60) : 1;
          return I * p.intensity * 0.32 * build * rec;
        }`,
        desc: "Heat-induced serotonin release supporting mood and relaxation.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||20);
          const inSauna = Math.max(0, Math.min(t, dur));
          const pulse = Math.sin(Math.PI * inSauna / dur);
          const rec = t>dur ? Math.exp(-(t-dur)/90) : 1;
          return I * p.intensity * 0.2 * pulse * rec;
        }`,
        desc: "Mild dopamine reward signal from therapeutic heat stress.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||20);
          const on = Math.max(0, Math.min(t, dur));
          const acute = 0.12 * Math.sin(Math.PI * on / dur);
          const rec = t>dur ? -0.15 * Math.exp(-(t-dur)/70) : 0;
          return I * p.intensity * (acute + rec);
        }`,
        desc: "Acute heat stress response followed by systemic relaxation.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||20);
          if(t<=dur) return I * p.intensity * 0.18 * (1 - Math.exp(-t/6));
          const rec = t - dur;
          return I * p.intensity * 0.25 * (1 - Math.exp(-rec/20));
        }`,
        desc: "Increased GABAergic inhibitory tone for deep relaxation.",
      },
      vagal: {
        fn: `function(t,p,I){
          if(t<=0) return 0;
          const dur = Math.max(1, p.duration||20);
          if(t<=dur) return -I * p.intensity * 0.08;
          const rec = t - dur;
          return I * p.intensity * 0.34 * (1 - Math.exp(-rec/24));
        }`,
        desc: "Post-sauna vagal tone improvement through thermoregulatory recovery.",
      },
      energy: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = Math.max(1, p.duration||20);
          if(t<=dur) return I * p.intensity * 0.12;
          const rec = t - dur;
          return -I * p.intensity * 0.18 * Math.exp(-rec/80);
        }`,
        desc: "Initial alertness followed by post-heat lethargy/relaxation.",
      },
    },
    group: "Temperature",
  },
  {
    key: "sensoryOverload",
    label: "Sensory Overload",
    color: "#f87171",
    icon: "🔊",
    defaultDurationMin: 60,
    params: [
      {
        key: "intensity",
        label: "Sensory Intensity",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 1,
      },
    ],
    kernels: {
      sensoryLoad: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          const active = t <= dur ? (t/dur) : Math.exp(-(t-dur)/30);
          return I * p.intensity * 0.8 * active;
        }`,
        desc: "Accumulation of sensory processing demand from loud, bright, or crowded environments.",
      },
      adrenaline: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const dur = p.duration || 60;
          if(t > dur) return 0;
          return I * p.intensity * 0.25 * (1 - Math.exp(-t/10));
        }`,
        desc: "Acute sympathetic activation (fight-or-flight) due to environmental overstimulation.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/30, 1/120, 15);
          return I * p.intensity * 0.2 * pk;
        }`,
        desc: "Activation of the stress response axis in response to sensory-driven anxiety.",
      },
    },
    group: "Environmental",
  },
];

export const INTERVENTION_MAP = new Map(
  INTERVENTIONS.map((def) => [def.key, def])
);
