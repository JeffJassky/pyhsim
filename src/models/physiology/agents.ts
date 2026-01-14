import type { PharmacologyDef, ParamValues } from '@/types/neurostate';

/**
 * AGENT PRIMITIVES
 * These are the reusable biological "Lego blocks" for interventions.
 * They can be instantiated and modified by Factory functions.
 */

// =============================================================================
// NUTRITIONAL AGENTS
// =============================================================================

export const Agents = {
  /**
   * GLUCOSE
   * The primary fuel and insulin driver.
   */
  Glucose: (amountGrams: number, context: { fatGrams?: number; fiberGrams?: number } = {}): PharmacologyDef => {
    // Interaction: Fat and Fiber slow absorption
    const fat = context.fatGrams ?? 0;
    const fiber = context.fiberGrams ?? 0;
    
    const baseHalfLife = 30;
    const slowingFactor = (fat * 0.5) + (fiber * 1.5);
    const halfLife = baseHalfLife + slowingFactor;

    return {
      molecule: { name: "Glucose", molarMass: 180.16 },
      pk: {
        model: "1-compartment",
        bioavailability: 1.0,
        halfLifeMin: halfLife, 
        timeToPeakMin: halfLife * 0.6, // Tmax correlates with half-life roughly
        volume: { kind: "weight", base_L_kg: 0.2 },
      },
      pd: [
        {
          target: "glucose",
          mechanism: "agonist",
          effectGain: amountGrams * 2.0, // Scale magnitude by mass
          unit: "mg/dL",
        },
        {
          target: "insulin",
          mechanism: "agonist",
          effectGain: amountGrams * 0.5,
          unit: "µIU/mL",
          tau: 45,
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          effectGain: Math.min(10, amountGrams * 0.1), // Reward saturates
          unit: "nM",
          tau: 20,
        }
      ],
    };
  },

  /**
   * LIPIDS (Fat)
   * Satiety signal and caloric density.
   */
  Lipids: (amountGrams: number): PharmacologyDef => {
    return {
      molecule: { name: "Lipids", molarMass: 282 }, // Oleic acid approx
      pk: {
        model: "1-compartment",
        halfLifeMin: 120, // Slow digestion
        volume: { kind: "weight", base_L_kg: 0.3 },
      },
      pd: [
        {
          target: "ghrelin",
          mechanism: "antagonist", // Suppresses hunger
          effectGain: amountGrams * 3.0,
          unit: "pg/mL",
          tau: 60,
        },
        {
          target: "glp1",
          mechanism: "agonist",
          effectGain: amountGrams * 0.2,
          unit: "pmol/L",
          tau: 90,
        },
        {
           target: "inflammation",
           mechanism: "agonist",
           effectGain: amountGrams * 0.05, // Post-prandial inflammation
           unit: "index",
           tau: 120
        }
      ]
    };
  },

  /**
   * AMINO ACIDS (Protein)
   * mTOR driver and modest insulinogenic.
   */
  Protein: (amountGrams: number): PharmacologyDef => {
    return {
      molecule: { name: "Amino Acids", molarMass: 110 }, // Average AA
      pk: {
        model: "1-compartment",
        halfLifeMin: 60,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        {
          target: "mtor",
          mechanism: "agonist",
          effectGain: amountGrams * 1.0,
          unit: "fold-change",
          tau: 90,
        },
        {
          target: "insulin",
          mechanism: "agonist",
          effectGain: amountGrams * 0.2, // Less than carbs
          unit: "µIU/mL",
          tau: 45,
        },
        {
          target: "glucagon",
          mechanism: "agonist", // Protein stimulates glucagon too (unlike carbs)
          effectGain: amountGrams * 0.5,
          unit: "pg/mL",
          tau: 30,
        },
        {
          target: "ghrelin",
          mechanism: "antagonist",
          effectGain: amountGrams * 2.0,
          unit: "pg/mL",
          tau: 60,
        }
      ]
    };
  },

  // =============================================================================
  // EXERCISE / STRESS AGENTS
  // =============================================================================

  /**
   * SYMPATHETIC DRIVE
   * The "Stress" component of exercise, excitement, or panic.
   */
  SympatheticStress: (intensity: number): PharmacologyDef => {
    // Intensity 0..1..2 (1.0 = heavy exercise)
    return {
      molecule: { name: "Sympathetic Drive", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        { target: "norepi", mechanism: "agonist", effectGain: 300 * intensity, unit: "pg/mL", tau: 5 },
        { target: "adrenaline", mechanism: "agonist", effectGain: 250 * intensity, unit: "pg/mL", tau: 2 },
        { target: "cortisol", mechanism: "agonist", effectGain: 15 * intensity, unit: "µg/dL", tau: 15 },
      ]
    };
  },

  /**
   * METABOLIC LOAD
   * The energy demand component of exercise.
   */
  MetabolicLoad: (intensity: number): PharmacologyDef => {
    return {
      molecule: { name: "Metabolic Load", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        { target: "ampk", mechanism: "agonist", effectGain: 20 * intensity, unit: "fold-change", tau: 10 },
        { target: "glucose", mechanism: "antagonist", effectGain: 40 * intensity, unit: "mg/dL", tau: 5 }, // Uptake
        { target: "bdnf", mechanism: "agonist", effectGain: 30 * intensity, unit: "ng/mL", tau: 30 },
      ]
    };
  },

  /**
   * MECHANICAL LOAD
   * The resistance/damage component (for hypertrophy).
   */
  MechanicalLoad: (intensity: number): PharmacologyDef => {
    return {
      molecule: { name: "Mechanical Load", molarMass: 0 },
      pk: { model: "activity-dependent" },
      pd: [
        { target: "mtor", mechanism: "agonist", effectGain: 15 * intensity, unit: "fold-change", tau: 120 },
        { target: "testosterone", mechanism: "agonist", effectGain: 5 * intensity, unit: "ng/dL", tau: 60 },
        { target: "growthHormone", mechanism: "agonist", effectGain: 10 * intensity, unit: "ng/mL", tau: 30 },
        { target: "inflammation", mechanism: "agonist", effectGain: 0.5 * intensity, unit: "index", tau: 240 } // DOMS
      ]
    };
  },

  // =============================================================================
  // SUBSTANCES & SUPPLEMENTS
  // =============================================================================

  Methylphenidate: (mg: number): PharmacologyDef => ({
    molecule: { name: "Methylphenidate", molarMass: 233.31, logP: 2.15 },
    pk: {
      model: "1-compartment",
      bioavailability: 0.3,
      halfLifeMin: 180,
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
      volume: { kind: "lbm", base_L_kg: 2.0 },
    },
    pd: [
      // Normalized: effectGain per mg approx.
      // Original 10mg -> Gain 6.0. So 0.6 per mg.
      { target: "DAT", mechanism: "antagonist", Ki: 34, effectGain: mg * 0.6, unit: "nM" }, 
      { target: "NET", mechanism: "antagonist", Ki: 300, effectGain: mg * 12.5, unit: "pg/mL" },
      { target: "cortisol", mechanism: "agonist", EC50: 0.2, effectGain: mg * 0.5, unit: "µg/dL" },
      { target: "SERT", mechanism: "antagonist", Ki: 2000, effectGain: mg * 0.03, unit: "nM" },
    ],
  }),

  Caffeine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Caffeine", molarMass: 194.19, logP: -0.07 },
    pk: {
      model: "1-compartment",
      bioavailability: 0.99,
      halfLifeMin: 300,
      clearance: { hepatic: { baseCL_mL_min: 155, CYP: "CYP1A2" } },
      volume: { kind: "tbw", fraction: 0.6 },
    },
    pd: [
      // Original 100mg -> Gain 15. So 0.15 per mg.
      { target: "Adenosine_A2a", mechanism: "antagonist", Ki: 2400, effectGain: mg * 0.15, unit: "nM" },
      { target: "Adenosine_A1", mechanism: "antagonist", Ki: 12000, effectGain: mg * 0.08, unit: "nM" },
      { target: "cortisol", mechanism: "agonist", EC50: 25000, effectGain: mg * 0.08, unit: "µg/dL" },
      { target: "adrenaline", mechanism: "agonist", EC50: 30000, effectGain: mg * 0.12, unit: "pg/mL" },
      { target: "norepi", mechanism: "agonist", EC50: 30000, effectGain: mg * 0.9375, unit: "pg/mL" },
    ],
  }),

  Melatonin: (mg: number): PharmacologyDef => ({
    molecule: { name: "Melatonin", molarMass: 232.28 },
    pk: {
      model: "1-compartment",
      bioavailability: 0.15,
      halfLifeMin: 45,
      clearance: { hepatic: { baseCL_mL_min: 1200, CYP: "CYP1A2" } },
      volume: { kind: "weight", base_L_kg: 1.0 },
    },
    pd: [
      // Original 3mg -> Gain 25. So ~8.33 per mg.
      { target: "MT1", mechanism: "agonist", Ki: 0.08, effectGain: mg * 8.33, unit: "pg/mL" },
      { target: "MT2", mechanism: "agonist", Ki: 0.23, effectGain: mg * 6.66, unit: "pg/mL" },
      { target: "orexin", mechanism: "antagonist", EC50: 50, effectGain: mg * 3.33, unit: "pg/mL" },
      { target: "cortisol", mechanism: "antagonist", EC50: 100, effectGain: mg * 1.66, unit: "µg/dL" },
      { target: "GABA_A", mechanism: "PAM", EC50: 200, effectGain: mg * 16.0, unit: "nM" },
    ],
  }),

  LTheanine: (mg: number): PharmacologyDef => ({
    molecule: { name: "L-Theanine", molarMass: 174.2 },
    pk: {
      model: "1-compartment",
      bioavailability: 0.95,
      halfLifeMin: 75,
      clearance: { renal: { baseCL_mL_min: 180 }, hepatic: { baseCL_mL_min: 80 } },
      volume: { kind: "tbw", fraction: 0.5 },
    },
    pd: [
      // Original 200mg -> Gain 72. So 0.36 per mg.
      { target: "GABA_A", mechanism: "PAM", EC50: 20.0, effectGain: mg * 0.36, unit: "nM" },
      { target: "NMDA", mechanism: "antagonist", Ki: 50.0, effectGain: mg * 0.0021, unit: "µM" },
      { target: "serotonin", mechanism: "agonist", EC50: 30.0, effectGain: mg * 0.004, unit: "nM" },
      { target: "dopamine", mechanism: "agonist", EC50: 35.0, effectGain: mg * 0.005, unit: "nM" },
      { target: "cortisol", mechanism: "antagonist", EC50: 25.0, effectGain: mg * 0.03, unit: "µg/dL" },
    ],
  }),
  
  Alcohol: (units: number): PharmacologyDef => {
    // 1 unit = ~10ml ethanol = ~8g
    const grams = units * 8; 
    return {
      molecule: { name: "Ethanol", molarMass: 46.07 },
      pk: {
        model: "michaelis-menten",
        bioavailability: 1.0,
        Vmax: 0.2, // g/L per minute approx
        Km: 0.1, // g/L (10mg/dL)
        volume: { kind: "sex-adjusted", male_L_kg: 0.68, female_L_kg: 0.55 },
      },
      pd: [
        { target: "GABA_A", mechanism: "PAM", effectGain: units * 1.6, unit: "fold-change" },
        { target: "ethanol", mechanism: "agonist", effectGain: grams * 10, unit: "mg/dL" }, // Approx peak
        { target: "dopamine", mechanism: "agonist", effectGain: units * 3.3, unit: "nM", tau: 10 },
        { target: "NMDA", mechanism: "NAM", Ki: 50000, effectGain: units * 0.13, unit: "fold-change" },
        { target: "vasopressin", mechanism: "antagonist", effectGain: units * 6.6, unit: "pg/mL" },
        { target: "cortisol", mechanism: "agonist", effectGain: units * 6.6, unit: "µg/dL" },
        { target: "inflammation", mechanism: "agonist", effectGain: units * 0.33, unit: "index" },
      ]
    };
  }
};