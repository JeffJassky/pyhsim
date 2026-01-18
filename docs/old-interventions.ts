import type { InterventionDef, KernelSet } from "@/types";
import {
  clamp,
  exp,
  pk1,
  pk_conc,
  pk_dual,
  gammaPulse,
  hill,
  gastricDelay,
  carbAppearance,
  generatePKKernel,
} from "./pharmacokinetics";

export const KERNEL_RUNTIME_HELPERS = {
  clamp,
  exp,
  pk1,
  pk_conc,
  pk_dual,
  gammaPulse,
  hill,
  gastricDelay,
  carbAppearance,
};

export const FOOD_KERNELS: KernelSet = {
  insulin: {
    fn: `function(t,p,I){ 
      const A = (${carbAppearance.toString()})(t,p) / 50.0;
      const amp = I * 15.0 * (${hill.toString()})(A, 150, 1.4);
      const fast = (${gammaPulse.toString()})(t, 5, 35, 0); 
      const slow = (${gammaPulse.toString()})(t, 18, 160, 0);
      return amp * (0.6 * fast + 0.4 * slow);
    }`,
    desc: "Biphasic insulin secretion driven by carbohydrate appearance, using non-linear saturation.",
  },

  glucose: {
    fn: `function(t,p,I){
      const A = (${carbAppearance.toString()})(t,p);
      const amp = I * 2.0 * A; 
      const fast = (1 - Math.exp(-Math.max(0,t)/12)) * Math.exp(-Math.max(0,t)/60);
      const slow = (1 - Math.exp(-Math.max(0,t)/40)) * Math.exp(-Math.max(0,t)/180);
      const rise = amp * (0.6 * fast + 0.4 * slow);
      const crash = 0.25 * amp * (${pk1.toString()})(t, 1/40, 1/180, 90);
      return rise - crash;
    }`,
    desc: "Rise in blood glucose levels based on carbohydrate digestion and GI, followed by a continuous reactive 'crash' below baseline.",
  },

  ghrelin: {
    fn: `function(t,p,I){ 
      const kcal = 4 * (p.carbSugar + p.carbStarch) + 4 * p.protein + 9 * p.fat;
      const depth = I * 150.0 * (${hill.toString()})(kcal, 400, 1.2);
      const on = 1 - Math.exp(-t / 18);
      const tail = Math.exp(-Math.max(t - 120, 0) / (100 + 0.1 * kcal));
      return -depth * on * tail;
    }`,
    desc: "Saturating suppression of ghrelin proportional to total caloric load.",
  },

  leptin: {
    fn: `function(t,p,I){ 
      const kcal = 4 * (p.carbSugar + p.carbStarch) + 4 * p.protein + 9 * p.fat;
      const amp = I * 3.0 * (${hill.toString()})(kcal, 600, 1.3);
      return amp * (1 - Math.exp(-t / 180));
    }`,
    desc: "Minor acute increase in satiety hormone leptin, scaled non-linearly with meal size.",
  },

  serotonin: {
    fn: `function(t,p,I){ 
      const tlag = (${gastricDelay.toString()})(p) - 5;
      const carb = p.carbSugar + p.carbStarch;
      const doseEffect = (${hill.toString()})(carb, 60, 1.4);
      const A = I * 30.0 * doseEffect;
      const tf = Math.max(0, t - tlag);
      return A * (1 - Math.exp(-tf / 25)) * Math.exp(-Math.max(tf - 150, 0) / 120);
    }`,
    desc: "Serotonin production via post-prandial tryptophan availability, using saturating carb-scaling.",
  },

  dopamine: {
    fn: `function(t,p,I){ 
      const pal = (${hill.toString()})(0.004 * p.carbSugar + 0.003 * p.fat, 0.5, 1.2);
      return I * 20.0 * pal * Math.exp(-t / 45);
    }`,
    desc: "Immediate reward signal from palatable (sugar/fat) food, with non-linear reward scaling.",
  },

  gaba: {
    fn: `function(t,p,I){
      const carb = p.carbSugar + p.carbStarch;
      const A = I * 25.0 * (${hill.toString()})(carb * 0.01 + p.fiberSol * 0.05, 0.5, 1.2);
      return A * (1 - Math.exp(-t/30));
    }`,
    desc: "Calming GABAergic effect from gut fermentation and satiety.",
  },

  mtor: {
    fn: `function(t,p,I){
      const protein = p.protein || 0;
      const amp = I * 50.0 * (${hill.toString()})(protein, 30, 1.5);
      return amp * (${gammaPulse.toString()})(t, 30, 180, 45);
    }`,
    desc: "Activation of the mTOR growth pathway driven primarily by amino acid (leucine) availability from protein intake.",
  },

  melatonin: {
    fn: `function(){ return 0; }`,
    desc: "No direct melatonin production from typical meals.",
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
          return I * 8.0 * (1 - Math.exp(-tf/12)) * Math.exp(-tf/110);
        }`,
        desc: "Cortisol awakening response (CAR) to mobilize energy.",
      },
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          return I * 30.0 * (1 - Math.exp(-tf/10)) * Math.exp(-tf/150);
        }`,
        desc: "Morning dopamine pulse to increase alertness and drive.",
      },
      melatonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          return -I * 40.0 * Math.exp(-t/20);
        }`,
        desc: "Rapid clearance of remaining nocturnal melatonin.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          return -I * 25.0 * Math.exp(-t/45);
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
          if(tf <= dur) return I * 80.0 * (1 - Math.exp(-tf/60));
          const rec = tf - dur;
          return -I * 40.0 * Math.exp(-rec/30);
        }`,
        desc: "Sustained melatonin release during the sleep window.",
      },
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const dur = p.duration || 480;
          if(tf <= dur) return I * 40.0 * (1 - Math.exp(-tf/45));
          const rec = tf - dur;
          return -I * 30.0 * Math.exp(-rec/40);
        }`,
        desc: "Increased inhibitory tone to maintain sleep state.",
      },
      cortisol: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          const dur = p.duration || 480;
          if(tf <= dur) return -I * 8.0 * (1 - Math.exp(-tf/90));
          const debt = tf - dur;
          return I * 6.0 * Math.exp(-debt/90);
        }`,
        desc: "Suppression of cortisol during early sleep, with rebound if sleep is cut short.",
      },
      growthHormone: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const tf = Math.max(0,t);
          // Sleep-onset GH pulse
          return I * 8.0 * (1 - Math.exp(-tf/30)) * Math.exp(-tf/120);
        }`,
        desc: "Deep sleep-associated growth hormone pulse.",
      },
    },
    group: "Routine",
  },
  {
    key: "caffeine",
    label: "Caffeine",
    color: "#78350f",
    icon: "☕",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 400,
        step: 10,
        default: 100,
      },
    ],
    pharmacology: {
      molecule: { name: "Caffeine", molarMass: 194.19 },
      pk: { model: "1-compartment", bioavailability: 0.99, halfLifeMin: 300 },
      pd: [
        {
          target: "Adenosine_A2a",
          mechanism: "antagonist",
          intrinsicEfficacy: 0.1,
        },
      ],
    },
    kernels: {
      dopamine: {
        fn: generatePKKernel({
          molecule: { name: "Caffeine", molarMass: 194.19 },
          pk: {
            model: "1-compartment",
            bioavailability: 0.99,
            halfLifeMin: 300,
          },
          pd: [
            {
              target: "Adenosine_A2a",
              mechanism: "antagonist",
              intrinsicEfficacy: 0.1,
            },
          ],
        }),
        desc: "Adenosine antagonism disinhibiting dopaminergic signaling.",
      },
      norepi: {
        fn: generatePKKernel({
          molecule: { name: "Caffeine", molarMass: 194.19 },
          pk: {
            model: "1-compartment",
            bioavailability: 0.99,
            halfLifeMin: 300,
          },
          pd: [
            {
              target: "Adenosine_A2a",
              mechanism: "antagonist",
              intrinsicEfficacy: 0.1,
            },
          ],
        }),
        desc: "Sympathetic activation via adenosine blockade.",
      },
    },
    group: "Stimulants",
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
    pharmacology: {
      molecule: { name: "Methylphenidate", molarMass: 233.31 },
      pk: { model: "1-compartment", bioavailability: 0.3, halfLifeMin: 180 }, // ~3h
      pd: [{ target: "DAT", mechanism: "antagonist", intrinsicEfficacy: 3.0 }],
    },
    kernels: {
      dopamine: {
        fn: generatePKKernel({
          molecule: { name: "Methylphenidate", molarMass: 233.31 },
          pk: {
            model: "1-compartment",
            bioavailability: 0.3,
            halfLifeMin: 180,
          },
          pd: [
            { target: "DAT", mechanism: "antagonist", intrinsicEfficacy: 3.0 },
          ],
        }),
        desc: "Rapid increase in synaptic dopamine via reuptake inhibition, generated from PK parameters.",
      },
      norepi: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/35, 1/200, 20);
          const doseEffect = (${hill.toString()})(p.mg, 25, 1.4);
          return I * 60.0 * doseEffect * pk;
        }`,
        desc: "Increase in norepinephrine supporting focus, with non-linear dose scaling.",
      },
    },
    group: "Stimulants",
  },
  {
    key: "lTyrosine",
    label: "L-Tyrosine",
    color: "#60a5fa",
    icon: "💊",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 2000,
        step: 100,
        default: 500,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/45, 1/240, 20);
          const doseEffect = (${hill.toString()})(p.mg, 1000, 1.3);
          return I * 0.25 * doseEffect * pk;
        }`,
        desc: "Precursor for dopamine and norepinephrine, supporting focus under stress.",
      },
    },
    group: "Supplements",
  },
  {
    key: "dopaMucuna",
    label: "DOPA Mucuna",
    color: "#818cf8",
    icon: "🌱",
    defaultDurationMin: 240,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 1000,
        step: 50,
        default: 200,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/30, 1/180, 15);
          const doseEffect = (${hill.toString()})(p.mg, 400, 1.5);
          return I * 0.5 * doseEffect * pk;
        }`,
        desc: "Direct source of L-Dopa for immediate dopaminergic lift.",
      },
    },
    group: "Supplements",
  },
  {
    key: "lTheanine",
    label: "L-Theanine",
    color: "#34d399",
    icon: "💊",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 600,
        step: 50,
        default: 200,
      },
    ],
    kernels: {
      gaba: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/45, 1/300, 30);
          const doseEffect = (${hill.toString()})(p.mg, 250, 1.3);
          return I * 0.6 * doseEffect * pk;
        }`,
        desc: "Increases inhibitory tone and alpha brain wave activity via GABA promotion.",
      },
      glutamate: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/45, 1/300, 30);
          const doseEffect = (${hill.toString()})(p.mg, 300, 1.4);
          return -I * 0.25 * doseEffect * pk;
        }`,
        desc: "Acts as a weak glutamate antagonist, reducing excitatory overstimulation.",
      },
    },
    group: "Supplements",
  },
  {
    key: "p5p",
    label: "P-5-P (Active B6)",
    color: "#34d399",
    icon: "💊",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0,
        max: 100,
        step: 5,
        default: 25,
      },
    ],
    kernels: {
      dopamine: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/60, 1/480, 30);
          return I * 0.1 * pk;
        }`,
        desc: "Co-factor support for neurotransmitter synthesis.",
      },
      serotonin: {
        fn: `function(t,p,I){
          if(t<0) return 0;
          const pk = (${pk1.toString()})(t, 1/60, 1/480, 30);
          return I * 0.1 * pk;
        }`,
        desc: "Co-factor support for serotonin production.",
      },
    },
    group: "Supplements",
  },
];

export const INTERVENTION_MAP = new Map(
  INTERVENTIONS.map((def) => [def.key, def]),
);
