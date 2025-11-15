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
  // Scale → cap amplitude by total available carbs (soft cap around 120–140 g)
  const amp = I * clamp(A / (A + 140), 0, 1);
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
  insulin: `function(t,p,I){ 
    return (${insulinSecretionFromMeal.toString()})(t,p,I);
  }`,

  glucose: `function(t,p,I){
    // Use carb appearance directly as a proxy for glycemic drive, then filter with slightly slower time constants
    const A = (${carbAppearance.toString()})(t,p);
    const amp = I * Math.min(1, A / (A + 160));
    const fast = (1 - Math.exp(-Math.max(0,t)/10)) * Math.exp(-Math.max(0,t)/70);
    const slow = (1 - Math.exp(-Math.max(0,t)/35)) * Math.exp(-Math.max(0,t)/200);
    return amp * (0.5*fast + 0.5*slow);
  }`,

  ghrelin: `function(t,p,I){ return (${ghrelinDrop.toString()})(t,p,I); }`,

  leptin: `function(t,p,I){ return (${leptinSmallSlow.toString()})(t,p,I); }`,

  serotonin: `function(t,p,I){ return (${serotoninAfterMeal.toString()})(t,p,I); }`,

  dopamine: `function(t,p,I){ return (${dopaminePalatable.toString()})(t,p,I); }`,

  gaba: `function(t,p,I){
    // Mild post-prandial calming signal; stronger later day (circadianHour optional)
    const evening = (typeof self!=='undefined' && self.circadianHour) ? (self.circadianHour() >= 18 ? 1 : 0) : 0;
    const A = I * evening * Math.min(0.2, 0.001*(p.carbSugar+p.carbStarch) + 0.002*p.fiberSol);
    return A * (1 - Math.exp(-t/30));
  }`,

  melatonin: `function(){ return 0; }`, // Meal itself: no direct acute melatonin effect modeled
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
      cortisol: `function(t,p,I){ 
        if(t<0) return 0;
        // CAR (cortisol awakening response): fast rise, decays over ~1–2 h
        const tf = Math.max(0,t);
        return I * 0.35 * (1 - Math.exp(-tf/12)) * Math.exp(-tf/110);
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        return I * 0.22 * (1 - Math.exp(-tf/10)) * Math.exp(-tf/150);
      }`,
      melatonin: `function(t,p,I){
        if(t<0) return 0;
        // Rapid suppression on waking
        return -I * 0.5 * Math.exp(-t/25);
      }`,
      gaba: `function(t,p,I){
        if(t<0) return 0;
        return -I * 0.2 * Math.exp(-t/45);
      }`,
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
      melatonin: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        const dur = p.duration || 0;
        if(tf <= dur) return I * 0.7 * (1 - Math.exp(-tf/60));
        const rec = tf - dur;
        return -I * 0.4 * Math.exp(-rec/45);
      }`,
      gaba: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        const dur = p.duration || 0;
        if(tf <= dur) return I * 0.35 * (1 - Math.exp(-tf/45));
        const rec = tf - dur;
        return -I * 0.25 * Math.exp(-rec/40);
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        const dur = p.duration || 0;
        if(tf <= dur) return -I * 0.25 * (1 - Math.exp(-tf/90));
        const debt = tf - dur;
        return I * 0.18 * Math.exp(-debt/90);
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        const dur = p.duration || 0;
        if(tf <= dur) return -I * 0.2 * (1 - Math.exp(-tf/60));
        const rebound = tf - dur;
        return I * 0.22 * (1 - Math.exp(-rebound/45)) * Math.exp(-rebound/180);
      }`,
    },
    group: "Routine",
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
        max: 300,
        step: 5,
        default: 90,
      },
    ],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        // Typical Tmax ~ 30–120 min; half-life ~ 4–6 h → k_e ≈ ln2/(240–360)
        const k_a = 1/25, k_e = 1/330;
        const pk = (${pk1.toString()})(t, k_a, k_e, 10);
        const dose = Math.min(1, p.mg/200);
        return I * 0.6 * dose * pk;
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        // Acute cortisol rise around Tmax, decaying within a few hours
        const k_a = 1/25, k_e = 1/240;
        const pk = (${pk1.toString()})(t, k_a, k_e, 10);
        const dose = Math.min(1, p.mg/200);
        return I * 0.2 * dose * pk;
      }`,
      melatonin: `function(){ 
        // No direct acute melatonin suppression from caffeine alone modeled; blue light handles that.
        return 0; 
      }`,
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
        max: 200,
        step: 5,
        default: 60,
      },
    ],
    kernels: {
      melatonin: `function(t,p,I){
        if(t<0) return 0;
        // Very sensitive evening suppression; 50% suppression can occur <30 lux
        const H = (${hill.toString()})(p.lux||0, 25, 1.6); // evening context assumed
        return -I * 0.85 * H; 
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        return I * 0.12 * (1 - Math.exp(-t/15));
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        return I * 0.08 * (1 - Math.exp(-t/20));
      }`,
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
        min: 10,
        max: 120,
        step: 5,
        default: 90,
      },
    ],
    kernels: {
      melatonin: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const window = function(target,width){
          if(hr===null) return 0.5;
          const span = Math.max(width, 0.5);
          return Math.max(0, 1 - Math.abs(hr - target) / span);
        };
        const intensity = (${hill.toString()})(p.lux||0, 35, 1.4);
        const morning = window(7, 4);
        const evening = window(21, 3);
        return -I * intensity * (0.55 * morning + 0.95 * evening);
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const morning = hr===null ? 0.6 : Math.max(0, 1 - Math.abs(hr - 8) / 4);
        const intensity = (${hill.toString()})(p.lux||0, 40, 1.6);
        const tf = Math.max(0,t);
        const rise = (1 - Math.exp(-tf/10)) * Math.exp(-tf/70);
        return I * 0.22 * intensity * morning * rise;
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const midday = hr===null ? 0.6 : Math.max(0, 1 - Math.abs(hr - 13.5) / 3.5);
        const intensity = (${hill.toString()})(p.lux||0, 30, 1.3);
        const tf = Math.max(0,t);
        const pulse = (1 - Math.exp(-tf/12)) * Math.exp(-tf/150);
        return I * 0.25 * intensity * midday * pulse;
      }`,
      serotonin: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const midday = hr===null ? 0.6 : Math.max(0, 1 - Math.abs(hr - 12.5) / 5);
        const intensity = (${hill.toString()})(p.lux||0, 25, 1.5);
        return I * 0.35 * intensity * midday * (1 - Math.exp(-Math.max(0,t)/18));
      }`,
      energy: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const day = hr===null ? 0.5 : Math.max(0, 1 - Math.abs(hr - 11) / 5);
        const intensity = (${hill.toString()})(p.lux||0, 30, 1.5);
        const build = (1 - Math.exp(-Math.max(0,t)/25));
        return I * 0.28 * intensity * day * build;
      }`,
      gaba: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const day = hr===null ? 0.4 : Math.max(0, 1 - Math.abs(hr - 14) / 4);
        const intensity = (${hill.toString()})(p.lux||0, 35, 1.4);
        return -I * 0.12 * intensity * day;
      }`,
      vagal: `function(t,p,I){
        if(t<0) return 0;
        const hr = (typeof self!=='undefined' && self.circadianHour) ? self.circadianHour() : null;
        const morning = hr===null ? 0.5 : Math.max(0, 1 - Math.abs(hr - 9) / 3.5);
        const recovery = Math.max(0, t - Math.max(1, p.duration||45));
        const intensity = (${hill.toString()})(p.lux||0, 40, 1.4);
        return I * 0.18 * intensity * morning * (1 - Math.exp(-recovery/40));
      }`,
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
        min: 0.5,
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
      melatonin: `function(t,p,I){
        if(t<0) return 0;
        const slow = p.release === "extended";
        const k_a = slow ? 1/55 : 1/22;
        const k_e = slow ? 1/420 : 1/120;
        const pk = (${pk1.toString()})(t, k_a, k_e, 5);
        const dose = Math.min(1, (p.mg||0)/5);
        return I * 0.95 * dose * pk;
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const slow = p.release === "extended";
        const k_a = slow ? 1/60 : 1/24;
        const k_e = slow ? 1/360 : 1/150;
        const pk = (${pk1.toString()})(t, k_a, k_e, 5);
        const dose = Math.min(1, (p.mg||0)/5);
        return -I * 0.35 * dose * pk;
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const slow = p.release === "extended";
        const k_a = slow ? 1/65 : 1/30;
        const k_e = slow ? 1/360 : 1/140;
        const pk = (${pk1.toString()})(t, k_a, k_e, 5);
        const dose = Math.min(1, (p.mg||0)/5);
        return -I * 0.18 * dose * pk;
      }`,
      gaba: `function(t,p,I){
        if(t<0) return 0;
        const slow = p.release === "extended";
        const k_a = slow ? 1/50 : 1/20;
        const k_e = slow ? 1/280 : 1/120;
        const pk = (${pk1.toString()})(t, k_a, k_e, 5);
        const dose = Math.min(1, (p.mg||0)/5);
        return I * 0.4 * dose * pk;
      }`,
      vagal: `function(t,p,I){
        if(t<0) return 0;
        const slow = p.release === "extended";
        const k_a = slow ? 1/55 : 1/24;
        const k_e = slow ? 1/360 : 1/150;
        const pk = (${pk1.toString()})(t, k_a, k_e, 5);
        const dose = Math.min(1, (p.mg||0)/5);
        const tf = Math.max(0,t);
        const sustain = (1 - Math.exp(-Math.max(tf-60,0)/90));
        return I * 0.28 * dose * pk * sustain;
      }`,
    },
    group: "Supplements",
  },
  {
    key: "adderallIR10",
    label: "Adderall IR 10 mg",
    color: "#f97316",
    icon: "💊",
    defaultDurationMin: 360,
    params: [
      {
        key: "takenWithFood",
        label: "With food",
        type: "switch",
        default: false,
      },
    ],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        // Amphetamine IR: Tmax ~ 2–4 h; t1/2 ~ 10–12 h; food delays onset
        const onset = p.takenWithFood ? 45 : 20;
        const pk = (${pk1.toString()})(t, 1/60, 1/720, onset); // slower absorption, long elimination
        return I * 0.8 * pk;
      }`,
      norepi: `function(t,p,I){
        if(t<0) return 0;
        const onset = p.takenWithFood ? 45 : 20;
        const pk = (${pk1.toString()})(t, 1/55, 1/700, onset);
        return I * 0.55 * pk;
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const onset = p.takenWithFood ? 45 : 20;
        const pk = (${pk1.toString()})(t, 1/70, 1/800, onset);
        return I * 0.18 * pk;
      }`,
    },
    group: "Stimulants",
  },
  {
    key: "adderallXR15",
    label: "Adderall XR 15 mg",
    color: "#fb923c",
    icon: "💊",
    defaultDurationMin: 720,
    params: [
      {
        key: "takenWithFood",
        label: "With food",
        type: "switch",
        default: true,
      },
    ],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        // MAS XR: bimodal release; food prolongs Tmax
        const lag1 = p.takenWithFood ? 90 : 45;
        const lag2 = lag1 + 240; // second pulse ~4 h later
        const pk = (${pk_dual.toString()})(t, 1/45, 1/60, 1/720, lag1, lag2, 0.65);
        return I * 0.9 * pk;
      }`,
      norepi: `function(t,p,I){
        if(t<0) return 0;
        const lag1 = p.takenWithFood ? 90 : 45;
        const lag2 = lag1 + 240;
        const pk = (${pk_dual.toString()})(t, 1/40, 1/55, 1/720, lag1, lag2, 0.65);
        return I * 0.62 * pk;
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const lag1 = p.takenWithFood ? 90 : 45;
        const lag2 = lag1 + 240;
        const pk = (${pk_dual.toString()})(t, 1/60, 1/80, 1/800, lag1, lag2, 0.65);
        return I * 0.2 * pk;
      }`,
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
        min: 0.2,
        max: 1,
        step: 0.1,
        default: 0.5,
      },
    ],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||30);
        const inRide = Math.max(0, Math.min(t, dur));
        const effort = I * p.intensity;
        // smooth on/off within the bout
        return effort * 0.16 * Math.sin(Math.PI * inRide / dur);
      }`,
      serotonin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||30);
        const active = Math.min(t, dur);
        return I * 0.22 * (1 - Math.exp(-active/20));
      }`,
      cortisol: `function(t,p,I){
        const dur = Math.max(1, p.duration||30);
        const active = Math.min(t, dur);
        const during = I * p.intensity * -0.06 * Math.sin(Math.PI * active / dur);
        const rec = t>dur ? -0.12 * Math.exp(-(t-dur)/40) : 0;
        return during + rec;
      }`,
      vagal: `function(t,p,I){
        const dur = Math.max(1, p.duration||30);
        if(t<=0) return 0;
        if(t<=dur) return -I * 0.08 * p.intensity; // vagal withdrawal during
        const rec = t - dur;
        return I * 0.22 * (1 - Math.exp(-rec/30)); // rebound after
      }`,
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
        min: 0.4,
        max: 1.2,
        step: 0.1,
        default: 0.7,
      },
    ],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||45);
        const on = Math.max(0, Math.min(t, dur));
        return I * 0.26 * p.intensity * Math.sin(Math.PI * on / dur);
      }`,
      norepi: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||45);
        const inRide = t<=dur;
        const ride = inRide ? Math.sin(Math.PI * Math.max(0, t) / dur) : Math.exp(-(t-dur)/120);
        return I * 0.32 * p.intensity * ride;
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||45);
        const tf = Math.max(0,t);
        const during = tf<=dur ? 0.18 * p.intensity * (1 - Math.exp(-tf/15)) : 0;
        const rec = tf>dur ? -0.16 * Math.exp(-(tf-dur)/45) : 0;
        return I * (during + rec);
      }`,
      vagal: `function(t,p,I){
        if(t<=0) return 0;
        const dur = Math.max(1, p.duration||45);
        if(t<=dur) return -I * 0.12 * p.intensity;
        const rec = t - dur;
        return I * 0.25 * (1 - Math.exp(-rec/28));
      }`,
      // Optional insulin sensitivity carryover (glucose disposal ↑ for 12–48h); expose as separate channel if desired
      insulin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||45);
        if(t<=dur) return I * (-0.12 * p.intensity); // during: circulating insulin needs ↓
        const rec = t - dur;
        return I * 0.22 * (1 - Math.exp(-rec/60)) * Math.exp(-rec/900); // carryover up to ~15 h
      }`,
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
        min: 0.5,
        max: 1.5,
        step: 0.1,
        default: 0.9,
      },
    ],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||60);
        const on = Math.max(0, Math.min(t, dur));
        return I * 0.3 * p.intensity * Math.sin(Math.PI * on / dur);
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||60);
        const tf = Math.max(0,t);
        const during = tf<=dur ? 0.28 * p.intensity * (1 - Math.exp(-tf/12)) : 0;
        const rec = tf>dur ? -0.18 * Math.exp(-(tf-dur)/60) : 0;
        return I * (during + rec);
      }`,
      adrenaline: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||60);
        if(t<=dur) return I * 0.28 * p.intensity * Math.sin(Math.PI * t / dur);
        const rec = t - dur;
        return I * 0.12 * Math.exp(-rec/45);
      }`,
      insulin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||60);
        if(t<=dur) return I * (-0.15 * p.intensity);
        const rec = t - dur;
        return I * 0.25 * (1 - Math.exp(-rec/70)) * Math.exp(-rec/840);
      }`,
    },
    group: "Movement",
  },
  {
    key: "sex",
    label: "Sexual activity",
    color: "#f472b6",
    icon: "💞",
    defaultDurationMin: 30,
    params: [],
    kernels: {
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(5, p.duration||30);
        const tf = Math.max(0,t);
        const active = Math.min(tf, dur);
        const during = tf<=dur ? I * 0.28 * Math.sin(Math.PI * active / dur) : 0;
        const rec = tf>dur ? -I * 0.18 * Math.exp(-(tf-dur)/25) : 0;
        return during + rec;
      }`,
      oxytocin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(5, p.duration||30);
        const tf = Math.max(0,t);
        if(tf<=dur) return I * 0.35 * (1 - Math.exp(-tf/6));
        const rec = tf - dur;
        return I * 0.35 * Math.exp(-rec/150);
      }`,
      prolactin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(5, p.duration||30);
        const tf = Math.max(0,t);
        if(tf<=dur) return I * 0.08 * (tf / dur);
        const rec = tf - dur;
        return I * 0.42 * (1 - Math.exp(-rec/6)) * Math.exp(-rec/120);
      }`,
      serotonin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(5, p.duration||30);
        const tf = Math.max(0,t);
        if(tf<=dur) return I * 0.15 * (tf / dur);
        const rec = tf - dur;
        return I * 0.26 * (1 - Math.exp(-rec/18)) * Math.exp(-rec/160);
      }`,
      cortisol: `function(t,p,I){
        const dur = Math.max(5, p.duration||30);
        const tf = Math.max(0,t);
        if(tf===0) return 0;
        if(tf<=dur) return -I * 0.06 * Math.sin(Math.PI * tf / dur);
        const rec = tf - dur;
        return -I * 0.16 * Math.exp(-rec/80);
      }`,
      vagal: `function(t,p,I){
        if(t<=0) return 0;
        const dur = Math.max(5, p.duration||30);
        if(t<=dur) return -I * 0.05 * Math.sin(Math.PI * t / dur);
        const rec = t - dur;
        return I * 0.3 * (1 - Math.exp(-rec/22)) * Math.exp(-rec/210);
      }`,
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
        min: 0.4,
        max: 1.4,
        step: 0.1,
        default: 0.9,
      },
    ],
    kernels: {
      norepi: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||8);
        const on = Math.max(0, Math.min(t, dur));
        const surge = Math.sin(Math.PI * on / dur);
        const rebound = t>dur ? Math.exp(-(t-dur)/25) : 0;
        return I * p.intensity * (0.75 * surge + 0.45 * rebound);
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        const ramp = (1 - Math.exp(-tf/4));
        return I * 0.22 * p.intensity * ramp * Math.exp(-tf/70);
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||8);
        const on = Math.max(0, Math.min(t, dur));
        const acute = 0.16 * Math.sin(Math.PI * on / dur);
        const rec = t>dur ? -0.14 * Math.exp(-(t-dur)/50) : 0;
        return I * p.intensity * (acute + rec);
      }`,
      energy: `function(t,p,I){
        if(t<0) return 0;
        const tf = Math.max(0,t);
        const build = (1 - Math.exp(-tf/8));
        const tail = Math.exp(-tf/160);
        return I * 0.3 * p.intensity * build * tail;
      }`,
      vagal: `function(t,p,I){
        if(t<=0) return 0;
        const dur = Math.max(1, p.duration||8);
        if(t<=dur) return -I * 0.2 * p.intensity;
        const rec = t - dur;
        return I * 0.32 * p.intensity * (1 - Math.exp(-rec/28));
      }`,
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
        min: 0.5,
        max: 1.3,
        step: 0.1,
        default: 0.8,
      },
    ],
    kernels: {
      serotonin: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||20);
        const on = Math.max(0, Math.min(t, dur));
        const build = 1 - Math.exp(-on/8);
        const rec = t>dur ? Math.exp(-(t-dur)/60) : 1;
        return I * 0.32 * p.intensity * build * rec;
      }`,
      dopamine: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||20);
        const inSauna = Math.max(0, Math.min(t, dur));
        const pulse = Math.sin(Math.PI * inSauna / dur);
        const rec = t>dur ? Math.exp(-(t-dur)/90) : 1;
        return I * 0.2 * p.intensity * pulse * rec;
      }`,
      cortisol: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||20);
        const on = Math.max(0, Math.min(t, dur));
        const acute = 0.12 * Math.sin(Math.PI * on / dur);
        const rec = t>dur ? -0.15 * Math.exp(-(t-dur)/70) : 0;
        return I * p.intensity * (acute + rec);
      }`,
      gaba: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||20);
        if(t<=dur) return I * 0.18 * p.intensity * (1 - Math.exp(-t/6));
        const rec = t - dur;
        return I * 0.25 * p.intensity * (1 - Math.exp(-rec/20));
      }`,
      vagal: `function(t,p,I){
        if(t<=0) return 0;
        const dur = Math.max(1, p.duration||20);
        if(t<=dur) return -I * 0.08 * p.intensity;
        const rec = t - dur;
        return I * 0.34 * p.intensity * (1 - Math.exp(-rec/24));
      }`,
      energy: `function(t,p,I){
        if(t<0) return 0;
        const dur = Math.max(1, p.duration||20);
        if(t<=dur) return I * 0.12 * p.intensity;
        const rec = t - dur;
        return -I * 0.18 * p.intensity * Math.exp(-rec/80);
      }`,
    },
    group: "Temperature",
  },
];

export const INTERVENTION_MAP = new Map(
  INTERVENTIONS.map((def) => [def.key, def])
);
