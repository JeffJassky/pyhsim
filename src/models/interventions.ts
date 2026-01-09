import type { InterventionDef, KernelSet, KernelSpec, Signal } from "@/types";
import type { Subject, Physiology } from "./subject";
import {
  clamp,
  exp,
  pk1,
  pk2,
  pk_conc,
  pk2_conc,
  pk_dual,
  gammaPulse,
  hill,
  gastricDelay,
  carbAppearance,
  proteinAppearance,
  fatAppearance,
  totalNutrientAppearance,
  generatePKKernel,
  receptorOccupancy,
  operationalAgonism,
  competitiveAntagonism,
  nonCompetitiveAntagonism,
  positiveAllostericModulation,
  doseToConcentration,
  michaelisMentenPK,
  alcoholBAC,
} from "./pharmacokinetics";

export const KERNEL_RUNTIME_HELPERS = {
  clamp,
  exp,
  pk1,
  pk2,
  pk_conc,
  pk2_conc,
  pk_dual,
  gammaPulse,
  hill,
  gastricDelay,
  // Nutrient appearance functions
  carbAppearance,
  proteinAppearance,
  fatAppearance,
  totalNutrientAppearance,
  // Receptor pharmacology helpers
  receptorOccupancy,
  operationalAgonism,
  competitiveAntagonism,
  nonCompetitiveAntagonism,
  positiveAllostericModulation,
  doseToConcentration,
  // Michaelis-Menten kinetics
  michaelisMentenPK,
  alcoholBAC,
};

export const FOOD_KERNELS: KernelSet = {
  insulin: {
    fn: `function(t,p){ 
      const A = (${carbAppearance.toString()})(t,p) / 50.0;
      const amp = 15.0 * (${hill.toString()})(A, 150, 1.4);
      const fast = (${gammaPulse.toString()})(t, 5, 35, 0); 
      const slow = (${gammaPulse.toString()})(t, 18, 160, 0);
      return amp * (0.6 * fast + 0.4 * slow);
    }`,
    desc: "Biphasic insulin secretion driven by carbohydrate appearance, using non-linear saturation.",
  },

  glucose: {
    fn: `function(t,p){
      const A = (${carbAppearance.toString()})(t,p);
      const amp = 2.0 * A; 
      const fast = (1 - Math.exp(-Math.max(0,t)/12)) * Math.exp(-Math.max(0,t)/60);
      const slow = (1 - Math.exp(-Math.max(0,t)/40)) * Math.exp(-Math.max(0,t)/180);
      const rise = amp * (0.6 * fast + 0.4 * slow);
      const crash = 0.25 * amp * pk1(t, 1/40, 1/180, 90);
      return rise - crash;
    }`,
    desc: "Rise in blood glucose levels based on carbohydrate digestion and GI, followed by a continuous reactive 'crash' below baseline.",
  },

  ghrelin: {
    fn: `function(t,p){
      // Ghrelin suppression driven by actual nutrient appearance in gut
      const nutrientFlux = (${totalNutrientAppearance.toString()})(t, p);
      const totalKcal = 4 * ((p.carbSugar || 0) + (p.carbStarch || 0)) + 4 * (p.protein || 0) + 9 * (p.fat || 0);

      // Suppression proportional to nutrient flux (not just meal size)
      // Hill function captures saturation - big meals don't suppress infinitely more
      const fluxSuppression = (${hill.toString()})(nutrientFlux, 2.0, 1.3);

      // Meal size determines depth of suppression
      const mealScale = (${hill.toString()})(totalKcal, 400, 1.2);

      // Recovery as nutrients clear (fat delays recovery due to slow absorption)
      const fatRecoveryDelay = 1 + 0.5 * ((p.fat || 0) / 30);
      const baseRecovery = 120 * fatRecoveryDelay;
      const recovery = t > 60 ? Math.exp(-Math.max(t - 60, 0) / baseRecovery) : 1;

      return -150.0 * mealScale * fluxSuppression * recovery;
    }`,
    desc: "Ghrelin suppression driven by nutrient appearance kinetics, with fat delaying recovery due to slow absorption.",
  },

  leptin: {
    fn: `function(t,p){
      // Leptin acutely responds to insulin and overall energy flux
      // Fat appearance drives longer-term satiety signaling
      const carbFlux = (${carbAppearance.toString()})(t, p);
      const fatFlux = (${fatAppearance.toString()})(t, p);
      const totalKcal = 4 * ((p.carbSugar || 0) + (p.carbStarch || 0)) + 4 * (p.protein || 0) + 9 * (p.fat || 0);

      // Insulin-mediated acute leptin rise (carb-driven, faster)
      const insulinComponent = (${hill.toString()})(carbFlux, 20, 1.2) * 0.4;

      // Fat-driven sustained component (slower, longer duration)
      const fatComponent = (${hill.toString()})(fatFlux, 0.5, 1.3) * 0.6;

      // Meal size scaling
      const mealScale = (${hill.toString()})(totalKcal, 600, 1.3);

      return 4.0 * mealScale * (insulinComponent + fatComponent);
    }`,
    desc: "Acute leptin response driven by insulin (carb-mediated) and sustained by fat absorption, scaled by meal size.",
  },

  serotonin: {
    fn: `function(t,p){
      const tlag = (${gastricDelay.toString()})(p) - 5;
      const carb = Number(p.carbSugar) + Number(p.carbStarch);
      const doseEffect = (${hill.toString()})(carb, 60, 1.4);
      const A = 30.0 * doseEffect;
      const tf = Math.max(0, t - tlag);
      return A * (1 - Math.exp(-tf / 25)) * Math.exp(-Math.max(tf - 150, 0) / 120);
    }`,
    desc: "Serotonin production via post-prandial tryptophan availability, using saturating carb-scaling.",
  },

  dopamine: {
    fn: `function(t,p){
      const pal = (${hill.toString()})(0.004 * Number(p.carbSugar) + 0.003 * Number(p.fat), 0.5, 1.2);
      return 20.0 * pal * Math.exp(-t / 45);
    }`,
    desc: "Immediate reward signal from palatable (sugar/fat) food, with non-linear reward scaling.",
  },

  gaba: {
    fn: `function(t,p){
      const carb = Number(p.carbSugar) + Number(p.carbStarch);
      const A = 25.0 * (${hill.toString()})(carb * 0.01 + Number(p.fiberSol) * 0.05, 0.5, 1.2);
      return A * (1 - Math.exp(-t/30));
    }`,
    desc: "Calming GABAergic effect from gut fermentation and satiety.",
  },

  mtor: {
    fn: `function(t,p){
      // Use protein appearance kinetics for accurate amino acid timing
      const aminoAcidFlux = (${proteinAppearance.toString()})(t, p);
      // mTOR activation follows amino acid (especially leucine) appearance
      // Saturates at high protein loads
      const amp = 50.0 * (${hill.toString()})(aminoAcidFlux, 0.8, 1.5);
      return amp;
    }`,
    desc: "mTOR pathway activation driven by amino acid appearance kinetics (leucine-sensitive), accounting for protein type (whey vs casein) and co-ingested nutrients.",
  },

  glp1: {
    fn: `function(t,p){
      // GLP-1 release from L-cells in response to nutrient appearance in gut
      // Uses actual absorption kinetics rather than raw gram values
      const carbFlux = (${carbAppearance.toString()})(t, p);
      const proteinFlux = (${proteinAppearance.toString()})(t, p);
      const fatFlux = (${fatAppearance.toString()})(t, p);
      const fiber = (p.fiberSol || 0) + (p.fiberInsol || 0);

      // GLP-1 secretion driven by nutrient flux at L-cells
      // Fat is actually a potent GLP-1 secretagogue (often underappreciated)
      const carbStim = (${hill.toString()})(carbFlux, 15, 1.3);
      const proteinStim = (${hill.toString()})(proteinFlux, 0.5, 1.2);
      const fatStim = (${hill.toString()})(fatFlux, 0.3, 1.4);
      const fiberBoost = 1 + 0.3 * (fiber / 15);

      // Weighted contribution: carbs > fat > protein for GLP-1
      const totalStim = (0.45 * carbStim + 0.35 * fatStim + 0.20 * proteinStim) * fiberBoost;

      // Peak ~15-20 pmol/L increase from a typical meal
      return 20.0 * totalStim;
    }`,
    desc: "GLP-1 incretin release from intestinal L-cells, driven by nutrient appearance kinetics (carbs, fat, protein) with fiber enhancement.",
  },
};

/* ====================== Interventions ====================== */

export const INTERVENTIONS: InterventionDef[] = [
  {
    key: "sleep",
    label: "Sleep",
    color: "#3b82f6",
    icon: "🌙",
    defaultDurationMin: 480,
    params: [],
    kernels: {
      melatonin: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 480;
          if(t <= dur) return 80.0 * (1 - Math.exp(-t/60));
          return -40.0 * Math.exp(-(t-dur)/20);
        }`,
        desc: "Sustained melatonin release during sleep, rapid clearance upon waking.",
      },
      gaba: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 480;
          if(t <= dur) return 40.0 * (1 - Math.exp(-t/45));
          return -25.0 * Math.exp(-(t-dur)/45);
        }`,
        desc: "High inhibitory tone during sleep, drops below baseline at wake.",
      },
      growthHormone: {
        fn: `function(t,p){
          if(t<0) return 0;
          return 8.0 * (1 - Math.exp(-t/30)) * Math.exp(-t/120);
        }`,
        desc: "Deep sleep-associated growth hormone pulse.",
      },
      histamine: {
        fn: `function(t,p){ if(t<0) return 0; return -30.0 * (1 - Math.exp(-t/45)); }`,
        desc: "Suppression of wake-maintaining histaminergic tone.",
      },
      orexin: {
        fn: `function(t,p){ if(t<0) return 0; return -35.0 * (1 - Math.exp(-t/60)); }`,
        desc: "Suppression of orexin arousal drive.",
      },
      cortisol: {
        fn: `function(t,p){
          const dur = p.duration || 480;
          if(t <= dur) return 0;
          const tw = t - dur;
          return 8.0 * (1 - Math.exp(-tw/12)) * Math.exp(-tw/110);
        }`,
        desc: "Cortisol awakening response (CAR) triggered at wake time.",
      },
      dopamine: {
        fn: `function(t,p){
          const dur = p.duration || 480;
          if(t <= dur) return 0;
          const tw = t - dur;
          return 30.0 * (1 - Math.exp(-tw/10)) * Math.exp(-tw/150);
        }`,
        desc: "Morning dopamine pulse to increase alertness upon waking.",
      },
      vip: {
        fn: `function(t,p){
          const dur = p.duration || 480;
          if(t <= dur) return 0;
          const tw = t - dur;
          return 30.0 * (1 - Math.exp(-tw/15));
        }`,
        desc: "SCN VIP neuron synchronization triggered by waking.",
      },
    },
    group: "Routine",
    categories: ["environment"],
    goals: ["sleep", "recovery", "longevity", "energy"],
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
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 25;
          const active = Math.min(t, dur);
          return 25.0 * Number(p.quality || 1) * (1 - Math.exp(-active/10));
        }`,
        desc: "Short-term increase in inhibitory GABA for relaxation.",
      },
      energy: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 25;
          if(t <= dur) return -1.0;
          return 3.0 * Number(p.quality || 1) * Math.exp(-(t-dur)/180);
        }`,
        desc: "Post-nap alertness boost following initial sleep inertia.",
      },
    },
    group: "Routine",
    categories: ["wellness"],
    goals: ["sleep", "recovery", "energy", "longevity"],
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
      molecule: { name: "Caffeine", molarMass: 194.19, logP: -0.07 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.99,
        halfLifeMin: 300,
        clearance: { hepatic: { baseCL_mL_min: 155, CYP: "CYP1A2" } },
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        {
          target: "Adenosine_A2a",
          mechanism: "antagonist",
          Ki: 2400,
          effectGain: 0.15,
        }, // Ki ~2.4 µM
        {
          target: "Adenosine_A1",
          mechanism: "antagonist",
          Ki: 12000,
          effectGain: 0.08,
        },
        {
          target: "PDE_Inhibition",
          mechanism: "antagonist",
          Ki: 480000,
          effectGain: 0.02,
        },
      ],
    },
    kernels: {
      dopamine: {
        fn: generatePKKernel(
          {
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
                Ki: 2400,
                effectGain: 0.15,
              },
            ],
          },
          "Adenosine_A2a"
        ),
        desc: "Adenosine A2a antagonism disinhibits striatopallidal D2 signaling, increasing dopaminergic tone.",
      },
      norepi: {
        fn: generatePKKernel(
          {
            molecule: { name: "Caffeine", molarMass: 194.19 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.99,
              halfLifeMin: 300,
            },
            pd: [
              {
                target: "Adenosine_A1",
                mechanism: "antagonist",
                Ki: 12000,
                effectGain: 0.12,
              },
            ],
          },
          "Adenosine_A1"
        ),
        desc: "Adenosine A1 blockade releases presynaptic inhibition of noradrenergic neurons.",
      },
      melatonin: {
        fn: generatePKKernel(
          {
            molecule: { name: "Caffeine", molarMass: 194.19 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.99,
              halfLifeMin: 300,
            },
            pd: [
              {
                target: "Melatonin_Suppression",
                mechanism: "antagonist",
                Ki: 5000,
                effectGain: -0.25,
              },
            ],
          },
          "Melatonin_Suppression"
        ),
        desc: "Adenosine receptor blockade suppresses pineal melatonin synthesis via SCN pathways.",
      },
      cortisol: {
        fn: generatePKKernel(
          {
            molecule: { name: "Caffeine", molarMass: 194.19 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.99,
              halfLifeMin: 300,
            },
            pd: [
              {
                target: "HPA_Axis",
                mechanism: "agonist",
                EC50: 8000,
                effectGain: 0.04,
              },
            ],
          },
          "HPA_Axis"
        ),
        desc: "HPA axis stimulation via CRH release, raising circulating cortisol.",
      },
      histamine: {
        fn: generatePKKernel(
          {
            molecule: { name: "Caffeine", molarMass: 194.19 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.99,
              halfLifeMin: 300,
            },
            pd: [
              {
                target: "TMN_Wake",
                mechanism: "agonist",
                EC50: 5000,
                effectGain: 0.08,
              },
            ],
          },
          "TMN_Wake"
        ),
        desc: "Adenosine blockade disinhibits tuberomammillary histamine neurons, promoting wakefulness.",
      },
    },
    group: "Stimulants",
    categories: ["medications", "supplements"],
    goals: ["energy", "focus"],
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
      molecule: { name: "Methylphenidate", molarMass: 233.31, logP: 2.15 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.3,
        halfLifeMin: 180,
        clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
        volume: { kind: "lbm", base_L_kg: 2.0 },
      },
      pd: [
        { target: "DAT", mechanism: "antagonist", Ki: 34, effectGain: 0.4 }, // Ki ~34 nM for d-MPH
        { target: "NET", mechanism: "antagonist", Ki: 339, effectGain: 0.25 },
      ],
    },
    kernels: {
      dopamine: {
        fn: generatePKKernel(
          {
            molecule: { name: "Methylphenidate", molarMass: 233.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.3,
              halfLifeMin: 180,
            },
            pd: [
              {
                target: "DAT",
                mechanism: "antagonist",
                Ki: 34,
                effectGain: 0.4,
              },
            ],
          },
          "DAT"
        ),
        desc: "DAT blockade (Ki ~34 nM) increases synaptic dopamine in striatum and PFC.",
      },
      norepi: {
        fn: generatePKKernel(
          {
            molecule: { name: "Methylphenidate", molarMass: 233.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.3,
              halfLifeMin: 180,
            },
            pd: [
              {
                target: "NET",
                mechanism: "antagonist",
                Ki: 339,
                effectGain: 0.25,
              },
            ],
          },
          "NET"
        ),
        desc: "NET blockade (Ki ~339 nM) increases noradrenergic tone supporting vigilance.",
      },
      adrenaline: {
        fn: generatePKKernel(
          {
            molecule: { name: "Methylphenidate", molarMass: 233.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.3,
              halfLifeMin: 180,
            },
            pd: [
              {
                target: "Sympathetic",
                mechanism: "agonist",
                EC50: 200,
                effectGain: 0.08,
              },
            ],
          },
          "Sympathetic"
        ),
        desc: "Peripheral sympathetic activation via noradrenergic effects.",
      },
    },
    group: "Stimulants",
    categories: ["medications"],
    goals: ["focus", "energy"],
  },
  {
    key: "melatonin",
    label: "Melatonin",
    color: "#6366f1",
    icon: "🌙",
    defaultDurationMin: 360,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 0.3,
        max: 10,
        step: 0.5,
        default: 3,
      },
    ],
    pharmacology: {
      molecule: { name: "Melatonin", molarMass: 232.28 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.15, // High first-pass metabolism
        halfLifeMin: 45,
        clearance: {
          hepatic: { baseCL_mL_min: 1200, CYP: "CYP1A2" }, // High extraction ratio
        },
        volume: { kind: "weight", base_L_kg: 1.0 }, // Distributes beyond plasma
      },
      pd: [
        { target: "MT1", mechanism: "agonist", Ki: 0.08, effectGain: 1.0 }, // Very high affinity
        { target: "MT2", mechanism: "agonist", Ki: 0.23, effectGain: 0.8 },
      ],
    },
    kernels: {
      melatonin: {
        fn: generatePKKernel(
          {
            molecule: { name: "Melatonin", molarMass: 232.28 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.15,
              halfLifeMin: 45,
            },
            pd: [
              {
                target: "MT1_MT2",
                mechanism: "agonist",
                EC50: 0.15,
                effectGain: 1.2,
              },
            ],
          },
          "MT1_MT2"
        ),
        desc: "Exogenous melatonin activates MT1/MT2 receptors (sub-nM affinity) in SCN.",
      },
      gaba: {
        fn: generatePKKernel(
          {
            molecule: { name: "Melatonin", molarMass: 232.28 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.15,
              halfLifeMin: 45,
            },
            pd: [
              {
                target: "GABAergic",
                mechanism: "PAM",
                EC50: 1,
                effectGain: 0.15,
              },
            ],
          },
          "GABAergic"
        ),
        desc: "Melatonin potentiates GABAergic transmission, promoting sleep onset.",
      },
      cortisol: {
        fn: generatePKKernel(
          {
            molecule: { name: "Melatonin", molarMass: 232.28 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.15,
              halfLifeMin: 45,
            },
            pd: [
              {
                target: "HPA_Suppression",
                mechanism: "antagonist",
                Ki: 0.5,
                effectGain: -0.08,
              },
            ],
          },
          "HPA_Suppression"
        ),
        desc: "Melatonin suppresses nocturnal HPA axis activity.",
      },
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["sleep"],
  },
  {
    key: "ltheanine",
    label: "L-Theanine",
    color: "#10b981",
    icon: "🍵",
    defaultDurationMin: 300,
    params: [
      {
        key: "mg",
        label: "Dose (mg)",
        type: "slider",
        min: 50,
        max: 400,
        step: 50,
        default: 200,
      },
    ],
    pharmacology: {
      molecule: { name: "L-Theanine", molarMass: 174.2 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.95,
        halfLifeMin: 75,
        clearance: {
          renal: { baseCL_mL_min: 180 }, // Hydrophilic amino acid, primarily renal
          hepatic: { baseCL_mL_min: 80 }, // Minor hepatic component
        },
        volume: { kind: "tbw", fraction: 0.5 }, // Hydrophilic, distributes in body water
      },
      pd: [
        {
          target: "Glutamate_Blockade",
          mechanism: "antagonist",
          Ki: 50000,
          effectGain: 0.05,
        },
        {
          target: "GABA_Enhancement",
          mechanism: "PAM",
          EC50: 20000,
          effectGain: 0.12,
        },
        {
          target: "Alpha_Wave",
          mechanism: "agonist",
          EC50: 15000,
          effectGain: 0.15,
        },
      ],
    },
    kernels: {
      gaba: {
        fn: generatePKKernel(
          {
            molecule: { name: "L-Theanine", molarMass: 174.2 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.95,
              halfLifeMin: 75,
            },
            pd: [
              {
                target: "GABA_Enhancement",
                mechanism: "PAM",
                EC50: 20000,
                effectGain: 0.12,
              },
            ],
          },
          "GABA_Enhancement"
        ),
        desc: "L-Theanine enhances GABA synthesis and release, promoting calm without sedation.",
      },
      glutamate: {
        fn: generatePKKernel(
          {
            molecule: { name: "L-Theanine", molarMass: 174.2 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.95,
              halfLifeMin: 75,
            },
            pd: [
              {
                target: "Glutamate_Blockade",
                mechanism: "antagonist",
                Ki: 50000,
                effectGain: -0.08,
              },
            ],
          },
          "Glutamate_Blockade"
        ),
        desc: "Mild glutamate receptor modulation reduces excitotoxic stress.",
      },
      dopamine: {
        fn: generatePKKernel(
          {
            molecule: { name: "L-Theanine", molarMass: 174.2 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.95,
              halfLifeMin: 75,
            },
            pd: [
              {
                target: "DA_Modulation",
                mechanism: "agonist",
                EC50: 30000,
                effectGain: 0.06,
              },
            ],
          },
          "DA_Modulation"
        ),
        desc: "Moderate increase in striatal dopamine supporting focused attention.",
      },
      serotonin: {
        fn: generatePKKernel(
          {
            molecule: { name: "L-Theanine", molarMass: 174.2 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.95,
              halfLifeMin: 75,
            },
            pd: [
              {
                target: "5HT_Modulation",
                mechanism: "agonist",
                EC50: 25000,
                effectGain: 0.08,
              },
            ],
          },
          "5HT_Modulation"
        ),
        desc: "Enhanced serotonergic tone supports mood stability.",
      },
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "focus", "mood"],
  },
  {
    key: "magnesium",
    label: "Magnesium",
    color: "#8b5cf6",
    icon: "💎",
    defaultDurationMin: 480,
    params: [
      {
        key: "mg",
        label: "Elemental Mg (mg)",
        type: "slider",
        min: 100,
        max: 500,
        step: 50,
        default: 300,
      },
    ],
    pharmacology: {
      molecule: { name: "Magnesium", molarMass: 24.31 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.35, // Variable absorption depending on form
        halfLifeMin: 720, // Slow tissue redistribution
        clearance: {
          renal: { baseCL_mL_min: 5 }, // Low clearance, heavily reabsorbed (~95-97%)
        },
        volume: { kind: "weight", base_L_kg: 0.45 }, // Distributes to tissues
      },
      pd: [
        {
          target: "NMDA_Block",
          mechanism: "antagonist",
          Ki: 1000000,
          effectGain: 0.03,
        },
        {
          target: "GABA_Support",
          mechanism: "PAM",
          EC50: 500000,
          effectGain: 0.08,
        },
      ],
    },
    kernels: {
      gaba: {
        fn: generatePKKernel(
          {
            molecule: { name: "Magnesium", molarMass: 24.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.35,
              halfLifeMin: 720,
            },
            pd: [
              {
                target: "GABA_Support",
                mechanism: "PAM",
                EC50: 500000,
                effectGain: 0.06,
              },
            ],
          },
          "GABA_Support"
        ),
        desc: "Magnesium supports GABAergic function and reduces neuronal excitability.",
      },
      glutamate: {
        fn: generatePKKernel(
          {
            molecule: { name: "Magnesium", molarMass: 24.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.35,
              halfLifeMin: 720,
            },
            pd: [
              {
                target: "NMDA_Block",
                mechanism: "antagonist",
                Ki: 1000000,
                effectGain: -0.04,
              },
            ],
          },
          "NMDA_Block"
        ),
        desc: "Voltage-dependent NMDA receptor block reduces glutamatergic overactivation.",
      },
      magnesium: {
        fn: generatePKKernel(
          {
            molecule: { name: "Magnesium", molarMass: 24.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.35,
              halfLifeMin: 720,
            },
            pd: [
              {
                target: "Mg_Status",
                mechanism: "agonist",
                EC50: 200000,
                effectGain: 0.3,
              },
            ],
          },
          "Mg_Status"
        ),
        desc: "Replenishment of intracellular magnesium stores.",
      },
      cortisol: {
        fn: generatePKKernel(
          {
            molecule: { name: "Magnesium", molarMass: 24.31 },
            pk: {
              model: "1-compartment",
              bioavailability: 0.35,
              halfLifeMin: 720,
            },
            pd: [
              {
                target: "HPA_Buffer",
                mechanism: "antagonist",
                Ki: 800000,
                effectGain: -0.03,
              },
            ],
          },
          "HPA_Buffer"
        ),
        desc: "Magnesium buffers HPA axis reactivity, reducing stress-induced cortisol.",
      },
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["calm", "sleep", "recovery", "longevity"],
  },
  {
    key: "exercise",
    label: "Exercise",
    color: "#ef4444",
    icon: "🏃",
    defaultDurationMin: 45,
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0.3,
        max: 1.0,
        step: 0.1,
        default: 0.7,
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "cardio", label: "Cardio" },
          { value: "resistance", label: "Resistance" },
          { value: "hiit", label: "HIIT" },
        ],
        default: "cardio",
      },
    ],
    // Mechanistic modeling of exercise physiology
    pharmacology: {
      molecule: { name: "Exercise", molarMass: 0 }, // Not a molecule, but using the structure
      pk: { model: "activity-dependent" },
      pd: [
        { target: "Beta_Adrenergic", mechanism: "agonist", effectGain: 1.0 },
        { target: "Mu_Opioid", mechanism: "agonist", effectGain: 0.5 },
        { target: "CB1", mechanism: "agonist", effectGain: 0.3 },
      ],
    },
    kernels: {
      dopamine: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);
          const isCardio = p.type === 'cardio' || p.type === 'hiit';

          // Mechanistic: Exercise activates VTA dopamine neurons via:
          // 1. Direct sympathetic activation
          // 2. β-endorphin disinhibition of GABA interneurons
          // 3. Endocannabinoid modulation

          // Sympathetic drive (fast onset)
          const sympatheticDA = 20.0 * int * (1 - Math.exp(-Math.min(t, dur) / 10));

          // β-endorphin mediated (slower, sustained)
          // Peaks ~20-30 min into exercise
          const endorphinDA = isCardio ? 15.0 * int * (1 - Math.exp(-Math.min(t, dur) / 25)) : 8.0 * int;

          // Reward anticipation/completion signal
          const completionBonus = t > dur ? 10.0 * int * Math.exp(-(t - dur) / 30) : 0;

          const activePhase = t <= dur ? (sympatheticDA + endorphinDA) : 0;
          const afterglow = t > dur ? (sympatheticDA + endorphinDA) * 0.4 * Math.exp(-(t - dur) / 120) + completionBonus : 0;

          return (activePhase + afterglow);
        }`,
        desc: "Mesolimbic dopamine release via sympathetic drive and β-endorphin disinhibition of VTA.",
      },
      norepi: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);

          // Mechanistic: Locus coeruleus activation proportional to exercise intensity
          // NE release follows sympathetic activation with ~2min time constant
          const k_on = 1/8;   // Activation rate
          const k_off = 1/20; // Deactivation rate

          const active = Math.min(t, dur);
          const onPhase = int * (1 - Math.exp(-k_on * active));
          const offPhase = t > dur ? onPhase * Math.exp(-k_off * (t - dur)) : onPhase;

          return 45.0 * offPhase;
        }`,
        desc: "Locus coeruleus norepinephrine release proportional to exercise intensity.",
      },
      adrenaline: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);
          const isHIIT = p.type === 'hiit' ? 1.8 : 1.0;
          const isResistance = p.type === 'resistance' ? 1.3 : 1.0;

          // Mechanistic: Adrenal medulla chromaffin cell release
          // Threshold activation (~50% VO2max) then exponential response
          const threshold = 0.5;
          const supraThreshold = Math.max(0, int - threshold) / (1 - threshold);

          // Fast release kinetics with intensity-dependent clearance
          const active = Math.min(t, dur);
          const k_release = 1/6 * (1 + supraThreshold); // Faster at high intensity
          const k_clear = 1/15;

          const onPhase = supraThreshold * isHIIT * isResistance * (1 - Math.exp(-k_release * active));
          const offPhase = t > dur ? onPhase * Math.exp(-k_clear * (t - dur)) : onPhase;

          return 200.0 * offPhase;
        }`,
        desc: "Adrenal medulla catecholamine release with intensity-dependent threshold and kinetics.",
      },
      cortisol: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);

          // Mechanistic: HPA axis activation follows intensity and duration thresholds
          // Low-moderate exercise: minimal cortisol (may even decrease)
          // High intensity or >60min: progressive HPA activation

          const intensityThreshold = 0.65;
          const durationThreshold = 45;

          // Intensity-driven component
          const intensityStress = Math.max(0, int - intensityThreshold) / (1 - intensityThreshold);

          // Duration-driven component (cumulative stress)
          const durationStress = Math.max(0, Math.min(t, dur) - durationThreshold) / 60;

          // Combined stress signal
          const stressSignal = intensityStress + 0.5 * durationStress;

          // Cortisol follows with ~15min delay (ACTH → adrenal response)
          const delay = 15;
          const effectiveT = Math.max(0, t - delay);
          const response = stressSignal * (1 - Math.exp(-effectiveT / 30));

          // Post-exercise return to baseline
          const recovery = t > dur + delay ?
            response * Math.exp(-(t - dur - delay) / 90) : response;

          return 10.0 * recovery;
        }`,
        desc: "HPA axis activation with intensity/duration thresholds and ~15min adrenal response delay.",
      },
      bdnf: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);
          const isCardio = p.type === 'cardio' || p.type === 'hiit' ? 1.4 : 1.0;

          // Mechanistic: BDNF expression via multiple pathways
          // 1. Lactate → FNDC5 (irisin) → hippocampal BDNF
          // 2. PGC-1α activation → peripheral BDNF
          // Peak effect is delayed (gene expression) and prolonged

          // Lactate accumulation as proxy
          const lactateProxy = int * (1 - Math.exp(-Math.min(t, dur) / 15));

          // BDNF response: delayed onset (~30min), prolonged duration (6-24h)
          const expressionDelay = 30;
          const effectiveT = Math.max(0, t - expressionDelay);
          const k_rise = 1/45;
          const k_decay = 1/480; // ~8hr half-life

          const rising = (1 - Math.exp(-k_rise * effectiveT));
          const peakValue = lactateProxy * int * isCardio;
          const decaying = t > dur + 60 ? Math.exp(-k_decay * (t - dur - 60)) : 1;

          return 25.0 * peakValue * rising * decaying;
        }`,
        desc: "BDNF expression via lactate-irisin pathway with delayed onset and prolonged duration.",
      },
      growthHormone: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);
          const isResistance = p.type === 'resistance' ? 1.8 : 1.0;
          const isHIIT = p.type === 'hiit' ? 1.5 : 1.0;

          // Mechanistic: Pituitary GH release via:
          // 1. Exercise-induced reduction of somatostatin
          // 2. GHRH release from hypothalamus
          // 3. Lactate/H+ accumulation signals

          // GH pulse characteristics
          const threshold = 0.5;
          const supraThreshold = Math.max(0, int - threshold) / (1 - threshold);

          // Peak during exercise, rapid post-exercise decline
          const activePhase = supraThreshold * isResistance * isHIIT * (1 - Math.exp(-t / 20));
          const response = t <= dur ? activePhase : activePhase * Math.exp(-(t - dur) / 60);

          return 8.0 * response;
        }`,
        desc: "Pituitary GH pulsatile release driven by metabolic stress and lactate accumulation.",
      },
      endocannabinoid: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);
          const isCardio = p.type === 'cardio' ? 1.5 : 1.0;

          // Mechanistic: Anandamide (AEA) and 2-AG release
          // Optimal at moderate intensity (60-80% VO2max)
          // Requires sustained activity (>20-30 min)

          // Intensity-response: inverted U-shape with optimal ~65-75%
          const optimalIntensity = 0.7;
          const intensityCurve = Math.exp(-Math.pow((int - optimalIntensity) / 0.2, 2));

          // Duration threshold: minimal effect <20 min
          const durationThreshold = 20;
          const effectiveDuration = Math.max(0, Math.min(t, dur) - durationThreshold);
          const durationEffect = 1 - Math.exp(-effectiveDuration / 30);

          // "Runner's high": peaks late in exercise session
          const peak = intensityCurve * durationEffect * isCardio;

          // Slow clearance post-exercise
          const afterEffect = t > dur ?
            peak * Math.exp(-(t - dur) / 180) : peak;

          return 35.0 * afterEffect;
        }`,
        desc: "Endocannabinoid (anandamide) release with inverted-U intensity response and duration threshold.",
      },
      serotonin: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);
          const isCardio = p.type === 'cardio' ? 1.3 : 1.0;

          // Mechanistic: Raphe 5-HT neuron activation
          // Exercise increases tryptophan hydroxylase activity
          // and free tryptophan (from lipolysis freeing albumin binding)

          const active = Math.min(t, dur);
          const k_onset = 1/25;
          const response = int * isCardio * (1 - Math.exp(-k_onset * active));

          // Sustained post-exercise elevation
          const afterEffect = t > dur ?
            response * (0.6 + 0.4 * Math.exp(-(t - dur) / 240)) : response;

          return 18.0 * afterEffect;
        }`,
        desc: "Raphe serotonin activation via increased tryptophan availability from exercise-induced lipolysis.",
      },
      glucose: {
        fn: `function(t,p){
          if(t<0) return 0;
          const dur = p.duration || 45;
          const int = Number(p.intensity || 0.7);

          // Mechanistic: Muscle glucose uptake (GLUT4 translocation)
          // Initially glucose rises (hepatic glycogenolysis)
          // Then falls as muscle uptake exceeds liver output

          const active = Math.min(t, dur);

          // Early phase: slight rise from glucagon/catecholamine drive
          const earlyRise = 5.0 * int * (1 - Math.exp(-active / 10)) * Math.exp(-active / 30);

          // Active phase: progressive decrease from muscle uptake
          const uptake = -15.0 * int * (1 - Math.exp(-active / 40));

          // Post-exercise: increased insulin sensitivity → lower glucose
          const postExercise = t > dur ? -10.0 * int * Math.exp(-(t - dur) / 240) : 0;

          return (earlyRise + uptake + postExercise);
        }`,
        desc: "Glucose dynamics: early catecholamine-driven rise, then muscle uptake, and post-exercise insulin sensitivity.",
      },
    },
    group: "Lifestyle",
    categories: ["exercise"],
    goals: ["energy", "mood", "recovery", "hormones", "longevity"],
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
    pharmacology: {
      molecule: { name: "Ethanol", molarMass: 46.07 },
      pk: {
        model: "michaelis-menten",
        bioavailability: 1.0,
        Vmax: 0.2,
        Km: 10,
        volume: { kind: "sex-adjusted", male_L_kg: 0.68, female_L_kg: 0.55 },
      },
      pd: [{ target: "GABA_A", mechanism: "PAM", effectGain: 2.5 }],
    },
    kernels: {
      ethanol: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);
          const weight = p.weight || 70;
          const sex = p.sex || 'male';
          const metabolicRate = p.metabolicScalar || 1.0;

          // 1 standard unit = 14g ethanol (US) / 10g (UK/AU)
          // Using 12g as international average
          const gramsEthanol = units * 12;

          // Use Michaelis-Menten pharmacokinetics
          // Returns BAC in mg/dL
          return alcoholBAC(t, gramsEthanol, weight, sex, metabolicRate);
        }`,
        desc: "Blood alcohol concentration using Michaelis-Menten (saturable) kinetics - zero-order at high concentrations.",
      },
      gaba: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);
          const weight = p.weight || 70;
          const sex = p.sex || 'male';
          const metabolicRate = p.metabolicScalar || 1.0;
          const gramsEthanol = units * 12;

          // BAC drives GABA-A PAM effect via receptor occupancy
          const bac = alcoholBAC(t, gramsEthanol, weight, sex, metabolicRate);

          // GABA-A potentiation: EC50 ~30 mg/dL, Hill coefficient ~1.5
          const EC50 = 30;
          const n = 1.5;
          const bacN = Math.pow(Math.max(0, bac), n);
          const occupancy = bacN / (Math.pow(EC50, n) + bacN + 1e-6);
          const gabaEffect = 25.0 * occupancy;

          // Glutamatergic rebound as BAC clears (NMDA upregulation)
          // Peaks ~4-8 hours after last drink as tolerance/withdrawal sets in
          const reboundDelay = 240;
          const reboundPeak = Math.max(0, bac > 5 ? 0 :
            units * 8.0 * Math.exp(-Math.pow(t - reboundDelay, 2) / 20000));

          return gabaEffect - reboundPeak;
        }`,
        desc: "GABA-A positive allosteric modulation with glutamatergic rebound during clearance.",
      },
      glutamate: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);
          const weight = p.weight || 70;
          const sex = p.sex || 'male';
          const metabolicRate = p.metabolicScalar || 1.0;
          const gramsEthanol = units * 12;

          const bac = alcoholBAC(t, gramsEthanol, weight, sex, metabolicRate);

          // Acute suppression while intoxicated
          const suppression = -15.0 * (bac / (bac + 30));

          // Rebound hyperexcitability during clearance
          const reboundTime = 300; // 5 hours
          const rebound = bac < 10 && t > 120 ?
            units * 10.0 * Math.exp(-Math.pow(t - reboundTime, 2) / 30000) : 0;

          return suppression + rebound;
        }`,
        desc: "NMDA receptor inhibition during intoxication, rebound hyperexcitability during withdrawal.",
      },
      vagal: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);
          const weight = p.weight || 70;
          const sex = p.sex || 'male';
          const gramsEthanol = units * 12;
          const bac = alcoholBAC(t, gramsEthanol, weight, sex, 1.0);

          // Vagal withdrawal proportional to BAC
          return -0.008 * bac;
        }`,
        desc: "Dose-dependent suppression of vagal tone via GABA-A effects on brainstem.",
      },
      cortisol: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);
          const weight = p.weight || 70;
          const sex = p.sex || 'male';
          const gramsEthanol = units * 12;
          const bac = alcoholBAC(t, gramsEthanol, weight, sex, 1.0);

          // HPA axis activation during clearance (hangover)
          const clearanceStress = bac < 20 && t > 180 ?
            units * 3.0 * Math.exp(-Math.pow(t - 360, 2) / 40000) : 0;

          return clearanceStress;
        }`,
        desc: "HPA axis activation during alcohol clearance contributes to hangover symptoms.",
      },
      inflammation: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);

          // Delayed inflammatory response from acetaldehyde and gut permeability
          // Peaks 6-12 hours after consumption
          const peakTime = 480; // 8 hours
          return units * 0.5 * gammaPulse(t, 120, 600, 180);
        }`,
        desc: "Delayed systemic inflammation from acetaldehyde toxicity and increased gut permeability.",
      },
      melatonin: {
        fn: `function(t,p){
          if(t<0) return 0;
          const units = Number(p.units || 1.5);
          const weight = p.weight || 70;
          const sex = p.sex || 'male';
          const gramsEthanol = units * 12;
          const bac = alcoholBAC(t, gramsEthanol, weight, sex, 1.0);

          // Alcohol suppresses melatonin synthesis
          return -0.4 * bac;
        }`,
        desc: "Pineal melatonin suppression disrupting sleep architecture.",
      },
    },
    group: "Lifestyle",
    categories: ["social"],
    goals: ["mood", "calm"],
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
        fn: `function(t,p){
          const dur = p.duration || 60;
          return 5.0 * Number(p.intensity || 1) * (1 - Math.exp(-Math.min(t, dur)/20));
        }`,
        desc: "Release of bonding hormone oxytocin.",
      },
      dopamine: {
        fn: `function(t,p){
          const dur = p.duration || 60;
          return 20.0 * Number(p.intensity || 1) * (1 - Math.exp(-Math.min(t, dur)/30));
        }`,
        desc: "Reward signal from social connection.",
      },
      serotonin: {
        fn: `function(t,p){
          const dur = p.duration || 60;
          return 10.0 * Number(p.intensity || 1) * (1 - Math.exp(-Math.min(t, dur)/40));
        }`,
        desc: "Mood stabilization from positive social environment.",
      },
      sensoryLoad: {
        fn: `function(t,p){
          const dur = p.duration || 60;
          return 2.5 * Number(p.intensity || 1) * (Math.min(t, dur)/dur);
        }`,
        desc: "Cognitive/sensory demand from social processing.",
      },
    },
    group: "Lifestyle",
    categories: ["social"],
    goals: ["mood", "hormones"],
  },
  {
    key: "meditation",
    label: "Meditation",
    color: "#60a5fa",
    icon: "🧘",
    defaultDurationMin: 20,
    params: [
      {
        key: "intensity",
        label: "Focus",
        type: "slider",
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.8,
      },
    ],
    kernels: {
      vagal: {
        fn: `function(t,p){
          const active = Math.min(t, p.duration || 20);
          const effect = 0.6 * Number(p.intensity || 0.8) * (1 - Math.exp(-active/8));
          return t > (p.duration || 20) ? effect * Math.exp(-(t-(p.duration || 20))/45) : effect;
        }`,
        desc: "Significant increase in parasympathetic vagal tone.",
      },
      gaba: {
        fn: `function(t,p){
          return 15.0 * Number(p.intensity || 0.8) * (1 - Math.exp(-Math.min(t, p.duration || 20)/12));
        }`,
        desc: "Endogenous GABA release supporting a calm state.",
      },
      cortisol: {
        fn: `function(t,p){
          return -5.0 * Number(p.intensity || 0.8) * (1 - Math.exp(-Math.min(t, p.duration || 20)/15));
        }`,
        desc: "Acute reduction in circulating cortisol levels.",
      },
      sensoryLoad: {
        fn: `function(t,p){
          return -2.0 * Number(p.intensity || 0.8) * (1 - Math.exp(-Math.min(t, p.duration || 20)/10));
        }`,
        desc: "Filtering and reduction of accumulated sensory load.",
      },
    },
    group: "Wellness",
    categories: ["wellness"],
    goals: ["calm", "focus", "mood", "longevity"],
  },
  {
    key: "electrolytes",
    label: "Electrolytes",
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
        fn: `function(t,p){
          const pk = pk1(t, 1/20, 1/180, 10);
          return 10.0 * (Number(p.amount)/500 || 0.5) * pk;
        }`,
        desc: "Transient increase in blood volume and pressure from hydration.",
      },
      vagal: {
        fn: `function(t,p){
          return 0.08 * (1 - Math.exp(-t/30));
        }`,
        desc: "Mild increase in vagal tone from improved hydration status.",
      },
    },
    group: "Supplements",
    categories: ["supplements"],
    goals: ["energy", "recovery"],
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
    categories: ["food"],
    goals: ["energy", "digestion", "longevity"],
  },
];

export const INTERVENTION_MAP = new Map(
  INTERVENTIONS.map((def) => [def.key, def])
);

// --- Dynamic Intervention Library Factory ---

/**
 * Cache for generated intervention libraries to avoid redundant regeneration.
 * Key is derived from subject/physiology parameters that affect PK.
 */
const interventionLibraryCache = new Map<string, InterventionDef[]>();

/**
 * Generates a cache key from subject and physiology parameters.
 */
function generateCacheKey(subject?: Subject, physiology?: Physiology): string {
  if (!subject || !physiology) return "default";
  return `${subject.age}-${subject.weight}-${
    subject.sex
  }-${physiology.estimatedGFR.toFixed(1)}-${physiology.liverBloodFlow.toFixed(
    2
  )}-${physiology.leanBodyMass.toFixed(1)}`;
}

/**
 * Builds an intervention library with dynamically generated PK kernels
 * based on the provided subject and physiology.
 *
 * This enables physiology-dependent pharmacokinetics:
 * - Caffeine clearance varies with liver blood flow
 * - Alcohol Vd is sex-adjusted
 * - Methylphenidate scales with lean body mass
 *
 * @param subject Subject demographics (age, weight, sex, etc.)
 * @param physiology Derived physiology (eGFR, liver blood flow, etc.)
 * @returns InterventionDef array with regenerated kernels
 */
export function buildInterventionLibrary(
  subject?: Subject,
  physiology?: Physiology
): InterventionDef[] {
  // Check cache first
  const cacheKey = generateCacheKey(subject, physiology);
  const cached = interventionLibraryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // If no subject/physiology, return static library
  if (!subject || !physiology) {
    interventionLibraryCache.set(cacheKey, INTERVENTIONS);
    return INTERVENTIONS;
  }

  // Deep clone and regenerate kernels for pharmacological interventions
  const dynamicLibrary: InterventionDef[] = INTERVENTIONS.map((def) => {
    // Skip non-pharmacological interventions (no dynamic PK needed)
    if (!def.pharmacology || !def.pharmacology.pk) {
      return def;
    }

    // Skip interventions without clearance/volume specs (no benefit from dynamic params)
    const pk = def.pharmacology.pk;
    if (!pk.clearance && !pk.volume) {
      return def;
    }

    // Regenerate kernels with dynamic parameters
    const newKernels: KernelSet = {};
    for (const [signalKey, spec] of Object.entries(def.kernels)) {
      if (!spec) continue;
      const signal = signalKey as Signal;

      // Find corresponding PD target for this signal
      const pd =
        def.pharmacology.pd?.find((p) =>
          p.target?.toLowerCase().includes(signalKey.toLowerCase())
        ) ?? def.pharmacology.pd?.[0];

      if (pd) {
        // Regenerate with subject/physiology
        const newFn = generatePKKernel(
          def.pharmacology,
          pd.target,
          subject,
          physiology
        );
        newKernels[signal] = { fn: newFn, desc: spec.desc };
      } else {
        // Keep original kernel
        newKernels[signal] = spec;
      }
    }

    return {
      ...def,
      kernels: { ...def.kernels, ...newKernels },
    };
  });

  // Cache and return
  interventionLibraryCache.set(cacheKey, dynamicLibrary);

  // Limit cache size to prevent memory leaks
  if (interventionLibraryCache.size > 10) {
    const firstKey = interventionLibraryCache.keys().next().value;
    if (firstKey) interventionLibraryCache.delete(firstKey);
  }

  return dynamicLibrary;
}

/**
 * Clears the intervention library cache.
 * Useful for testing or when forcing regeneration.
 */
export function clearInterventionLibraryCache(): void {
  interventionLibraryCache.clear();
}
