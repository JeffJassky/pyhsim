import type { PharmacologyDef, ParamValues } from "@/types/neurostate";

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
   *
   * Comprehensive effects:
   * - Direct glucose elevation
   * - Biphasic insulin response (first + second phase)
   * - GLP-1 incretin effect (potentiates insulin)
   * - Dopamine reward from palatability
   * - Serotonin via tryptophan transport (insulin facilitates)
   * - GABA satiety signaling
   * - Leptin acute post-prandial rise
   * - Ketone suppression (fed state inhibits ketogenesis)
   * - AMPK suppression (high glucose = low energy stress)
   * - Orexin suppression (post-prandial drowsiness / "food coma")
   * - Norepinephrine suppression (parasympathetic shift)
   * - Cortisol suppression (rest-and-digest state)
   * - Thermic effect (~8% TEF) - increased T4→T3 conversion
   */
  Glucose: (
    amountGrams: number,
    context: {
      fatGrams?: number;
      fiberGrams?: number;
      sugarGrams?: number;
      glycemicIndex?: number;
    } = {},
  ): PharmacologyDef => {
    // Interaction: Fat and Fiber slow absorption
    const fat = context.fatGrams ?? 0;
    const fiber = context.fiberGrams ?? 0;
    const sugar = context.sugarGrams ?? amountGrams * 0.5; // Estimate sugar portion if not specified
    const gi = context.glycemicIndex ?? 60; // Default moderate GI

    // GI affects absorption rate (high GI = faster absorption)
    const giMultiplier = gi / 60; // Normalize to 1.0 at GI=60
    const baseHalfLife = 30 / giMultiplier; // Higher GI = shorter half-life
    const slowingFactor = fat * 0.5 + fiber * 1.5;
    const halfLife = baseHalfLife + slowingFactor;

    // Palatability for dopamine reward (sugar is more rewarding)
    const palatability = Math.min(1, sugar * 0.004 + fat * 0.003);

    // Serotonin effect: carbs drive tryptophan uptake via insulin
    // Larger carb loads = more serotonin synthesis (saturates around 60g)
    const carbSerotoninEffect = (amountGrams / (amountGrams + 60)) * 30; // Hill-like, max ~30% boost

    // GABA satiety (carbs + fiber drive GABA-ergic satiety circuits)
    const gabaSatiety = Math.min(1, amountGrams * 0.01 + fiber * 0.05);

    // Leptin acute response (kcal-dependent, slower than insulin)
    const kcalFromCarbs = amountGrams * 4;
    const leptinEffect = (kcalFromCarbs / (kcalFromCarbs + 600)) * 3.0; // Hill curve, max 3 ng/mL

    // GLP-1 from carbs (incretin - amplifies insulin effect)
    const glp1Effect = (amountGrams / (amountGrams + 40)) * 18 * 0.6; // Carb contributes 60%

    // Post-prandial sedation ("food coma") - carbs are the main driver
    // High-GI carbs cause more dramatic glucose spike → more insulin → more sedation
    const sedationIntensity = (amountGrams / (amountGrams + 50)) * giMultiplier;
    const orexinSuppression = Math.min(15, sedationIntensity * 12); // Orexin drives wakefulness
    const norepinephrineSuppression = Math.min(100, sedationIntensity * 80); // Sympathetic withdrawal
    const cortisolSuppression = Math.min(5, sedationIntensity * 4); // Stress hormone drops

    // Thermic Effect of Food (TEF) - Carbs have ~8% TEF
    // Manifests as increased T4→T3 conversion and metabolic rate
    const tefKcal = kcalFromCarbs * 0.08; // 8% of carb calories
    const thyroidEffect = Math.min(0.15, (tefKcal / 100) * 0.1); // Modest thyroid activation

    return {
      molecule: { name: "Glucose", molarMass: 180.16 },
      pk: {
        model: "1-compartment",
        bioavailability: 1.0,
        halfLifeMin: halfLife,
        timeToPeakMin: halfLife * 0.6,
        volume: { kind: "weight", base_L_kg: 0.2 },
      },
      pd: [
        // Primary metabolic effects
        {
          target: "glucose",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 2.0 * giMultiplier, // High GI = higher spike
          unit: "mg/dL",
        },
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.5 * giMultiplier, // High GI = more insulin
          unit: "µIU/mL",
          tau: 45,
        },
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: glp1Effect,
          unit: "pmol/L",
          tau: 35,
        },
        // Reward and mood
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(20, palatability * 20), // Palatability-driven reward
          unit: "nM",
          tau: 20,
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: carbSerotoninEffect,
          unit: "nM",
          tau: 150, // Slow: tryptophan must be absorbed and converted
        },
        // Satiety signals
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: gabaSatiety * 25, // GABA-ergic satiety
          unit: "nM",
          tau: 30,
        },
        {
          target: "leptin",
          mechanism: "agonist",
          intrinsicEfficacy: leptinEffect,
          unit: "ng/mL",
          tau: 180, // Leptin is slow to rise post-meal
        },
        // Metabolic switching (fed state)
        {
          target: "ketone",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(1.5, amountGrams * 0.02), // Suppress ketogenesis
          unit: "mmol/L",
          tau: 60,
        },
        {
          target: "ampk",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(0.5, amountGrams * 0.01), // Fed state suppresses AMPK
          unit: "fold-change",
          tau: 30,
        },
        // Post-prandial sedation ("food coma")
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: orexinSuppression, // Orexin drives wakefulness; suppression → drowsiness
          unit: "pg/mL",
          tau: 45,
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: norepinephrineSuppression, // Sympathetic withdrawal
          unit: "pg/mL",
          tau: 30,
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolSuppression, // Rest-and-digest suppresses stress
          unit: "µg/dL",
          tau: 60,
        },
        // Thermic Effect of Food (TEF)
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect, // T4→T3 conversion increases with feeding
          unit: "pmol/L",
          tau: 60, // Peaks ~1hr post-meal
        },
      ],
    };
  },

  /**
   * LIPIDS (Fat)
   * Satiety signal and caloric density.
   *
   * Comprehensive effects:
   * - Strong ghrelin suppression (potent satiety signal)
   * - GLP-1 release (fat is a strong GLP-1 secretagogue)
   * - Leptin signaling (fat mass correlates with leptin, acute meal effect too)
   * - CCK-mediated vagal activation (fat triggers cholecystokinin → vagus)
   * - Acetylcholine release (parasympathetic "rest and digest")
   * - Post-prandial lipemia inflammatory response
   * - Mild dopamine from palatability (fat is hedonically rewarding)
   * - Oxytocin (fat-rich meals can trigger social/comfort signaling)
   * - Endocannabinoid activation (fat triggers anandamide/"bliss" response)
   * - Orexin suppression (fat contributes to post-meal drowsiness)
   * - Norepinephrine suppression (parasympathetic dominance)
   * - Cortisol suppression (comfort/relaxation response)
   * - Thermic effect (~3% TEF) - lowest of all macros
   */
  Lipids: (amountGrams: number): PharmacologyDef => {
    // Kcal from fat
    const kcalFromFat = amountGrams * 9;

    // Leptin effect (fat is the strongest leptin signal)
    const leptinEffect = (kcalFromFat / (kcalFromFat + 400)) * 4.0; // Hill curve, up to 4 ng/mL

    // Vagal activation via CCK release (fat strongly activates vagal afferents)
    const vagalEffect = Math.min(0.5, amountGrams * 0.015);

    // Parasympathetic "rest and digest" response
    const achEffect = Math.min(15, amountGrams * 0.4);

    // Endocannabinoid "bliss" response (fat triggers anandamide synthesis)
    // Dietary fat, especially oleic acid, increases endocannabinoid tone
    const endocannabinoidEffect = Math.min(8, amountGrams * 0.25);

    // Post-prandial sedation from fat (slower onset than carbs, but significant)
    const fatSedation = amountGrams / (amountGrams + 40);
    const orexinSuppression = Math.min(10, fatSedation * 8);
    const norepinephrineSuppression = Math.min(80, fatSedation * 60);
    const cortisolSuppression = Math.min(4, fatSedation * 3);

    // Thermic Effect of Food (TEF) - Fat has only ~3% TEF (lowest of macros)
    const tefKcal = kcalFromFat * 0.03;
    const thyroidEffect = Math.min(0.08, (tefKcal / 100) * 0.05); // Very modest

    return {
      molecule: { name: "Lipids", molarMass: 282 }, // Oleic acid approx
      pk: {
        model: "1-compartment",
        halfLifeMin: 120, // Slow digestion
        timeToPeakMin: 180, // Fat absorption is slow (chylomicron formation)
        volume: { kind: "weight", base_L_kg: 0.3 },
      },
      pd: [
        // Satiety and hunger signals
        {
          target: "ghrelin",
          mechanism: "antagonist", // Strong hunger suppression
          intrinsicEfficacy: amountGrams * 3.0,
          unit: "pg/mL",
          tau: 60,
        },
        {
          target: "leptin",
          mechanism: "agonist",
          intrinsicEfficacy: leptinEffect,
          unit: "ng/mL",
          tau: 120,
        },
        // Incretin and metabolic
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.3, // Fat is a good GLP-1 stimulant
          unit: "pmol/L",
          tau: 90,
        },
        // Parasympathetic activation (rest and digest)
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: vagalEffect,
          unit: "index",
          tau: 45,
        },
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: achEffect,
          unit: "nM",
          tau: 30,
        },
        // Reward, comfort, and bliss
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(8, amountGrams * 0.2), // Fat is palatable
          unit: "nM",
          tau: 25,
        },
        {
          target: "oxytocin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, amountGrams * 0.08), // Comfort/social eating signal
          unit: "pg/mL",
          tau: 60,
        },
        {
          target: "endocannabinoid",
          mechanism: "agonist",
          intrinsicEfficacy: endocannabinoidEffect, // Anandamide "bliss molecule"
          unit: "nM",
          tau: 90,
        },
        // Post-prandial sedation
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: orexinSuppression,
          unit: "pg/mL",
          tau: 90, // Slower onset than carbs
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: norepinephrineSuppression,
          unit: "pg/mL",
          tau: 60,
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolSuppression,
          unit: "µg/dL",
          tau: 90,
        },
        // Inflammatory response
        {
          target: "inflammation",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.05, // Post-prandial inflammation
          unit: "index",
          tau: 120,
        },
        // Thermic Effect of Food (TEF) - Fat has lowest TEF
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 120, // Slow: fat digestion is slow
        },
      ],
    };
  },

  /**
   * AMINO ACIDS (Protein)
   * mTOR driver and modest insulinogenic.
   *
   * Comprehensive effects:
   * - mTOR activation (muscle protein synthesis, especially leucine)
   * - Modest insulin response (less than carbs, but present)
   * - Glucagon secretion (protein uniquely stimulates both insulin AND glucagon)
   * - Strong ghrelin suppression (protein is very satiating)
   * - GLP-1 release (protein is a good incretin stimulus)
   * - Serotonin precursor (tryptophan is an amino acid)
   * - Dopamine precursor (tyrosine/phenylalanine are amino acids)
   * - BDNF support (amino acids support neurotrophin synthesis)
   * - Leptin signaling (protein meals have modest leptin effect)
   * - Thermogenic effect (protein has high TEF ~25%)
   * - Glutamate elevation (glutamic acid is abundant in protein)
   * - Histidine → histamine (minor effect from protein digestion)
   * - Mild orexin suppression (satiety-mediated, less than carbs)
   */
  Protein: (amountGrams: number): PharmacologyDef => {
    // GLP-1 from protein (40% of mixed meal GLP-1 response)
    const glp1Effect = (amountGrams / (amountGrams + 25)) * 18 * 0.4;

    // Leptin effect (modest from protein)
    const kcalFromProtein = amountGrams * 4;
    const leptinEffect = (kcalFromProtein / (kcalFromProtein + 800)) * 2.0;

    // Precursor effects (tyrosine → dopamine, tryptophan → serotonin)
    // ~5% of protein is tyrosine, ~1% is tryptophan
    const tyrosineGrams = amountGrams * 0.05;
    const tryptophanGrams = amountGrams * 0.01;
    const dopaminePrecursorEffect = Math.min(5, tyrosineGrams * 2);
    const serotoninPrecursorEffect = Math.min(8, tryptophanGrams * 10);

    // BDNF support (protein provides building blocks)
    const bdnfEffect = Math.min(5, amountGrams * 0.1);

    // Glutamate from protein (~10% of protein is glutamic acid)
    // Important for umami taste and excitatory neurotransmission
    const glutamateGrams = amountGrams * 0.1;
    const glutamateEffect = Math.min(15, glutamateGrams * 1.5);

    // Histamine from histidine (~2% of protein)
    // Can cause flushing, alertness in sensitive individuals
    const histidineGrams = amountGrams * 0.02;
    const histamineEffect = Math.min(3, histidineGrams * 1.0);

    // Protein has mild sedation effect via satiety, but less than carbs
    // Also counteracted by tyrosine (alerting)
    const proteinSedation = amountGrams / (amountGrams + 60);

    // Thermic Effect of Food (TEF) - Protein has highest TEF at ~25%
    // This is why protein is "metabolically expensive" and helps with weight loss
    const tefKcal = kcalFromProtein * 0.25;
    const thyroidEffect = Math.min(0.3, (tefKcal / 100) * 0.2); // Strong thyroid activation
    const orexinSuppression = Math.min(5, proteinSedation * 4); // Much less than carbs

    return {
      molecule: { name: "Amino Acids", molarMass: 110 }, // Average AA
      pk: {
        model: "1-compartment",
        halfLifeMin: 60,
        timeToPeakMin: 90, // Protein digestion is moderate speed
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Anabolic signaling
        {
          target: "mtor",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 1.0, // Strong mTOR activation
          unit: "fold-change",
          tau: 90,
        },
        // Metabolic hormones
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.2, // Less than carbs
          unit: "µIU/mL",
          tau: 45,
        },
        {
          target: "glucagon",
          mechanism: "agonist", // Protein uniquely stimulates glucagon
          intrinsicEfficacy: amountGrams * 0.5,
          unit: "pg/mL",
          tau: 30,
        },
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: glp1Effect,
          unit: "pmol/L",
          tau: 60,
        },
        // Satiety signals
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: amountGrams * 2.5, // Protein is very satiating
          unit: "pg/mL",
          tau: 60,
        },
        {
          target: "leptin",
          mechanism: "agonist",
          intrinsicEfficacy: leptinEffect,
          unit: "ng/mL",
          tau: 150,
        },
        // Neurotransmitter precursors
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopaminePrecursorEffect, // Tyrosine → L-DOPA → Dopamine
          unit: "nM",
          tau: 120, // Slow: requires absorption and synthesis
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninPrecursorEffect, // Tryptophan → 5-HTP → Serotonin
          unit: "nM",
          tau: 150,
        },
        // Excitatory amino acids
        {
          target: "glutamate",
          mechanism: "agonist",
          intrinsicEfficacy: glutamateEffect, // Glutamic acid → glutamate
          unit: "µM",
          tau: 60,
        },
        // Histamine from histidine
        {
          target: "histamine",
          mechanism: "agonist",
          intrinsicEfficacy: histamineEffect,
          unit: "nM",
          tau: 90,
        },
        // Neurotrophin support
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: bdnfEffect,
          unit: "ng/mL",
          tau: 180, // Very slow: gene expression
        },
        // Mild sedation from satiety (less than carbs due to tyrosine counter)
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: orexinSuppression,
          unit: "pg/mL",
          tau: 90,
        },
        // Thermic Effect of Food (TEF) - Protein has HIGHEST TEF (~25%)
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect, // Strong metabolic activation
          unit: "pmol/L",
          tau: 90, // Moderate onset
        },
      ],
    };
  },

  /**
   * DIETARY FIBER
   * Gut-brain axis modulator and metabolic regulator.
   *
   * Fiber has unique effects beyond just slowing nutrient absorption:
   * - GLP-1 secretion (fiber is a potent GLP-1 secretagogue via L-cells)
   * - Short-chain fatty acid (SCFA) production by gut microbiota
   * - GABA production (gut bacteria produce GABA from fiber fermentation)
   * - Vagal nerve activation (gut-brain axis signaling)
   * - Anti-inflammatory effects (gut barrier integrity, microbiome health)
   * - Ghrelin modulation (bulk/distension signals satiety)
   * - Modest serotonin effects (gut serotonin from enterochromaffin cells)
   * - PYY (peptide YY) release - not in signals, approximated via ghrelin
   * - Thermic effect (~5% TEF) - fermentation energy cost
   */
  Fiber: (amountGrams: number): PharmacologyDef => {
    // GLP-1 from fiber (fermentation products stimulate L-cells)
    // Fiber can boost GLP-1 response by up to 30%
    const glp1Effect = Math.min(5, amountGrams * 0.3);

    // SCFA-mediated effects (butyrate, propionate, acetate)
    // Takes time for bacterial fermentation (delayed effect)
    const scfaGabaEffect = Math.min(15, amountGrams * 0.8);
    const scfaAntiInflammatory = Math.min(0.3, amountGrams * 0.015);

    // Vagal activation (mechanoreceptors + SCFA signaling)
    const vagalEffect = Math.min(0.3, amountGrams * 0.012);

    // Gut serotonin (90% of body's serotonin is in gut)
    const gutSerotoninEffect = Math.min(5, amountGrams * 0.2);

    // Thermic Effect of Food (TEF) - Fiber has ~5% TEF from fermentation
    // Bacteria expend energy fermenting fiber, producing heat
    const kcalFromFiber = amountGrams * 2; // ~2 kcal/g (from SCFA)
    const tefKcal = kcalFromFiber * 0.05;
    const thyroidEffect = Math.min(0.05, (tefKcal / 100) * 0.08); // Modest, delayed

    return {
      molecule: { name: "Dietary Fiber", molarMass: 162 }, // Cellulose unit approx
      pk: {
        model: "1-compartment",
        halfLifeMin: 240, // Very slow: fermentation in colon
        timeToPeakMin: 180, // Effects peak hours after eating
        volume: { kind: "weight", base_L_kg: 0.1 }, // Stays in gut mostly
      },
      pd: [
        // Incretin and satiety
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: glp1Effect,
          unit: "pmol/L",
          tau: 120, // Delayed: fermentation required
        },
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: amountGrams * 1.5, // Bulk/distension signal
          unit: "pg/mL",
          tau: 30, // Faster: mechanical effect
        },
        // Gut-brain axis (SCFA-mediated)
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: scfaGabaEffect, // Gut bacteria produce GABA
          unit: "nM",
          tau: 180, // Very delayed: bacterial fermentation
        },
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: vagalEffect,
          unit: "index",
          tau: 60,
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: gutSerotoninEffect, // Enterochromaffin cell stimulation
          unit: "nM",
          tau: 90,
        },
        // Anti-inflammatory (gut barrier, microbiome)
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: scfaAntiInflammatory,
          unit: "index",
          tau: 240, // Very slow: requires microbiome adaptation
        },
        // Thermic Effect of Food (TEF) - from fermentation
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 240, // Very delayed: fermentation takes hours
        },
      ],
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
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: 300 * intensity,
          unit: "pg/mL",
          tau: 5,
        },
        {
          target: "adrenaline",
          mechanism: "agonist",
          intrinsicEfficacy: 250 * intensity,
          unit: "pg/mL",
          tau: 2,
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: 15 * intensity,
          unit: "µg/dL",
          tau: 15,
        },
      ],
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
        {
          target: "ampk",
          mechanism: "agonist",
          intrinsicEfficacy: 20 * intensity,
          unit: "fold-change",
          tau: 10,
        },
        {
          target: "glucose",
          mechanism: "antagonist",
          intrinsicEfficacy: 40 * intensity,
          unit: "mg/dL",
          tau: 5,
        }, // Uptake
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: 30 * intensity,
          unit: "ng/mL",
          tau: 30,
        },
      ],
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
        {
          target: "mtor",
          mechanism: "agonist",
          intrinsicEfficacy: 15 * intensity,
          unit: "fold-change",
          tau: 120,
        },
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: 5 * intensity,
          unit: "ng/dL",
          tau: 60,
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: 10 * intensity,
          unit: "ng/mL",
          tau: 30,
        },
        {
          target: "inflammation",
          mechanism: "agonist",
          intrinsicEfficacy: 0.5 * intensity,
          unit: "index",
          tau: 240,
        }, // DOMS
      ],
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
      // Normalized: intrinsicEfficacy per mg approx.
      // Target 10mg -> Gain 30.0. So 3.0 per mg.
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 34,
        intrinsicEfficacy: mg * 3.0,
        unit: "nM",
      },
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 300,
        intrinsicEfficacy: mg * 3.0,
        unit: "nM",
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        EC50: 0.2,
        intrinsicEfficacy: mg * 0.5,
        unit: "µg/dL",
      },
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 2000,
        intrinsicEfficacy: mg * 0.1,
        unit: "nM",
      },
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
      // Normalized: intrinsicEfficacy per mg.
      // 100mg -> Gain 40.0. So 0.4 per mg.
      {
        target: "Adenosine_A2a",
        mechanism: "antagonist",
        Ki: 2400,
        intrinsicEfficacy: mg * 0.4,
        unit: "nM",
      },
      {
        target: "Adenosine_A1",
        mechanism: "antagonist",
        Ki: 12000,
        intrinsicEfficacy: mg * 0.2,
        unit: "nM",
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        EC50: 25000,
        intrinsicEfficacy: mg * 0.08,
        unit: "µg/dL",
      },
      {
        target: "adrenaline",
        mechanism: "agonist",
        EC50: 30000,
        intrinsicEfficacy: mg * 0.12,
        unit: "pg/mL",
      },
      {
        target: "norepi",
        mechanism: "agonist",
        EC50: 30000,
        intrinsicEfficacy: mg * 0.9375,
        unit: "pg/mL",
      },
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
      {
        target: "MT1",
        mechanism: "agonist",
        Ki: 0.08,
        intrinsicEfficacy: mg * 8.33,
        unit: "pg/mL",
      },
      {
        target: "MT2",
        mechanism: "agonist",
        Ki: 0.23,
        intrinsicEfficacy: mg * 6.66,
        unit: "pg/mL",
      },
      {
        target: "orexin",
        mechanism: "antagonist",
        EC50: 50,
        intrinsicEfficacy: mg * 3.33,
        unit: "pg/mL",
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        EC50: 100,
        intrinsicEfficacy: mg * 1.66,
        unit: "µg/dL",
      },
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 200,
        intrinsicEfficacy: mg * 16.0,
        unit: "nM",
      },
    ],
  }),

  LTheanine: (mg: number): PharmacologyDef => ({
    molecule: { name: "L-Theanine", molarMass: 174.2 },
    pk: {
      model: "1-compartment",
      bioavailability: 0.95,
      halfLifeMin: 75,
      clearance: {
        renal: { baseCL_mL_min: 180 },
        hepatic: { baseCL_mL_min: 80 },
      },
      volume: { kind: "tbw", fraction: 0.5 },
    },
    pd: [
      // Original 200mg -> Gain 72. So 0.36 per mg.
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 20.0,
        intrinsicEfficacy: mg * 0.36,
        unit: "nM",
      },
      {
        target: "NMDA",
        mechanism: "antagonist",
        Ki: 50.0,
        intrinsicEfficacy: mg * 0.0021,
        unit: "µM",
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        EC50: 30.0,
        intrinsicEfficacy: mg * 0.004,
        unit: "nM",
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        EC50: 35.0,
        intrinsicEfficacy: mg * 0.005,
        unit: "nM",
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        EC50: 25.0,
        intrinsicEfficacy: mg * 0.03,
        unit: "µg/dL",
      },
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
        {
          target: "GABA_A",
          mechanism: "PAM",
          intrinsicEfficacy: units * 1.6,
          unit: "fold-change",
        },
        {
          target: "ethanol",
          mechanism: "agonist",
          intrinsicEfficacy: grams * 10,
          unit: "mg/dL",
        }, // Approx peak
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: units * 3.3,
          unit: "nM",
          tau: 10,
        },
        {
          target: "NMDA",
          mechanism: "NAM",
          Ki: 50000,
          intrinsicEfficacy: units * 0.13,
          unit: "fold-change",
        },
        {
          target: "vasopressin",
          mechanism: "antagonist",
          intrinsicEfficacy: units * 6.6,
          unit: "pg/mL",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: units * 6.6,
          unit: "µg/dL",
        },
        {
          target: "inflammation",
          mechanism: "agonist",
          intrinsicEfficacy: units * 0.33,
          unit: "index",
        },
      ],
    };
  },

  // =============================================================================
  // COMPREHENSIVE SUPPLEMENT AGENTS
  // =============================================================================

  /**
   * L-TYROSINE
   * Catecholamine and thyroid hormone precursor.
   *
   * Comprehensive effects:
   * - Dopamine precursor (tyrosine → L-DOPA → dopamine)
   * - Norepinephrine precursor (dopamine → norepinephrine)
   * - Adrenaline precursor (norepinephrine → adrenaline)
   * - Thyroid hormone precursor (tyrosine + iodine → T3/T4)
   * - Stress resilience (catecholamine stores depleted under stress)
   * - Cognitive support under demanding conditions
   */
  LTyrosine: (mg: number): PharmacologyDef => {
    // Tyrosine is rate-limited by tyrosine hydroxylase, not tyrosine availability
    // Effects are most noticeable under stress when catecholamines are depleted
    const dopamineEffect = Math.min(8, mg * 0.008); // Modest dopamine support
    const norepinephrineEffect = Math.min(50, mg * 0.05); // NE from dopamine conversion
    const adrenalineEffect = Math.min(30, mg * 0.025); // Adrenaline from NE
    const thyroidEffect = Math.min(0.1, mg * 0.0001); // Very modest thyroid support

    return {
      molecule: { name: "L-Tyrosine", molarMass: 181.19 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.8,
        halfLifeMin: 150,
        timeToPeakMin: 60,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Catecholamine synthesis
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineEffect,
          unit: "nM",
          tau: 90, // Slow: requires synthesis
        },
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: norepinephrineEffect,
          unit: "pg/mL",
          tau: 120,
        },
        {
          target: "adrenaline",
          mechanism: "agonist",
          intrinsicEfficacy: adrenalineEffect,
          unit: "pg/mL",
          tau: 150,
        },
        // Thyroid hormone support
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 240, // Very slow: thyroid synthesis
        },
        // Mild alertness from catecholamine support
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, mg * 0.003),
          unit: "pg/mL",
          tau: 90,
        },
      ],
    };
  },

  /**
   * L-DOPA (Mucuna Pruriens)
   * Direct dopamine precursor (bypasses rate-limiting step).
   *
   * Comprehensive effects:
   * - Strong dopamine elevation (L-DOPA → dopamine directly)
   * - Norepinephrine elevation (dopamine → norepinephrine)
   * - Prolactin suppression (dopamine inhibits prolactin release)
   * - Growth hormone modulation (dopamine affects GH release)
   * - Potential peripheral effects (nausea if not taken with AADC inhibitor)
   */
  LDopa: (mg: number): PharmacologyDef => {
    // L-DOPA is potent because it bypasses tyrosine hydroxylase
    // Mucuna typically contains 15% L-DOPA, so 200mg mucuna ≈ 30mg L-DOPA
    // We assume mg = actual L-DOPA content
    const dopamineEffect = Math.min(25, mg * 0.15); // Strong dopamine effect
    const norepinephrineEffect = Math.min(40, mg * 0.08); // DA → NE conversion
    const prolactinSuppression = Math.min(10, mg * 0.05); // Dopamine suppresses prolactin
    const ghEffect = Math.min(3, mg * 0.015); // Modest GH effect

    return {
      molecule: { name: "L-DOPA", molarMass: 197.19 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.4, // Variable, affected by amino acid competition
        halfLifeMin: 90, // Relatively short
        timeToPeakMin: 45,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Direct dopamine synthesis
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineEffect,
          unit: "nM",
          tau: 30, // Fast: direct precursor
        },
        // Secondary catecholamine effects
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: norepinephrineEffect,
          unit: "pg/mL",
          tau: 60,
        },
        // Endocrine effects
        {
          target: "prolactin",
          mechanism: "antagonist",
          intrinsicEfficacy: prolactinSuppression, // Dopamine inhibits prolactin
          unit: "ng/mL",
          tau: 45,
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: ghEffect,
          unit: "ng/mL",
          tau: 60,
        },
        // Mood/reward
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(5, mg * 0.02),
          unit: "pg/mL",
          tau: 45,
        },
      ],
    };
  },

  /**
   * P-5-P (Pyridoxal-5-Phosphate / Active Vitamin B6)
   * Essential cofactor for neurotransmitter synthesis.
   *
   * Comprehensive effects:
   * - Dopamine synthesis cofactor (L-DOPA → dopamine requires B6)
   * - Serotonin synthesis cofactor (5-HTP → serotonin requires B6)
   * - GABA synthesis cofactor (glutamate → GABA requires B6)
   * - Histamine metabolism (B6 helps degrade histamine)
   * - Melatonin pathway support (serotonin → melatonin)
   * - Homocysteine metabolism (cardiovascular health)
   */
  P5P: (mg: number): PharmacologyDef => {
    // P-5-P is the active form of B6, more bioavailable than pyridoxine
    // Acts as a cofactor, so effects are supportive rather than direct
    const dopamineSupport = Math.min(5, mg * 0.15);
    const serotoninSupport = Math.min(4, mg * 0.12);
    const gabaSupport = Math.min(8, mg * 0.25); // Strong GABA cofactor role
    const histamineReduction = Math.min(3, mg * 0.08);
    const melatoninSupport = Math.min(3, mg * 0.08);

    return {
      molecule: { name: "Pyridoxal-5-Phosphate", molarMass: 247.14 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.75,
        halfLifeMin: 300, // Long tissue retention
        timeToPeakMin: 120,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Neurotransmitter synthesis support
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineSupport,
          unit: "nM",
          tau: 120,
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninSupport,
          unit: "nM",
          tau: 120,
        },
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: gabaSupport, // B6 is critical for GABA synthesis
          unit: "nM",
          tau: 90,
        },
        // Histamine metabolism
        {
          target: "histamine",
          mechanism: "antagonist",
          intrinsicEfficacy: histamineReduction, // B6 helps DAO degrade histamine
          unit: "nM",
          tau: 120,
        },
        // Melatonin pathway
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: melatoninSupport,
          unit: "pg/mL",
          tau: 240, // Very delayed
        },
      ],
    };
  },

  /**
   * MAGNESIUM
   * Essential mineral for 300+ enzymatic reactions.
   *
   * Comprehensive effects:
   * - NMDA receptor antagonist (blocks excitotoxicity)
   * - GABA receptor support (enhances GABA binding)
   * - Muscle relaxation (calcium channel modulation)
   * - Sleep quality improvement
   * - Cortisol modulation (HPA axis support)
   * - Blood pressure regulation
   * - Insulin sensitivity support
   */
  Magnesium: (mg: number): PharmacologyDef => {
    // Elemental magnesium content varies by form:
    // Glycinate: 14%, Citrate: 16%, Oxide: 60% (but poor absorption)
    // We assume mg = elemental magnesium
    const nmdaAntagonism = Math.min(0.3, mg * 0.0008);
    const gabaSupport = Math.min(20, mg * 0.05);
    const cortisolReduction = Math.min(3, mg * 0.008);
    const sleepSupport = Math.min(8, mg * 0.02); // Via melatonin/GABA
    const muscleRelaxation = Math.min(0.3, mg * 0.0008); // Vagal proxy

    return {
      molecule: { name: "Magnesium", molarMass: 24.31 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.4, // Varies greatly by form
        halfLifeMin: 720, // Long tissue half-life
        timeToPeakMin: 180,
        volume: { kind: "weight", base_L_kg: 0.3 },
      },
      pd: [
        // Neurological effects
        {
          target: "NMDA",
          mechanism: "antagonist",
          intrinsicEfficacy: nmdaAntagonism, // Natural NMDA channel blocker
          unit: "µM",
          tau: 120,
        },
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: gabaSupport,
          unit: "nM",
          tau: 90,
        },
        // Stress and sleep
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolReduction,
          unit: "µg/dL",
          tau: 180,
        },
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: sleepSupport,
          unit: "pg/mL",
          tau: 240,
        },
        // Muscle and autonomic
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: muscleRelaxation,
          unit: "index",
          tau: 120,
        },
        // Metabolic
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(2, mg * 0.005), // Insulin sensitivity
          unit: "µIU/mL",
          tau: 240,
        },
      ],
    };
  },

  /**
   * OMEGA-3 FATTY ACIDS (EPA/DHA)
   * Essential fatty acids for brain and cardiovascular health.
   *
   * Comprehensive effects:
   * - Anti-inflammatory (resolvin/protectin production)
   * - BDNF upregulation (neuroplasticity)
   * - Serotonin/dopamine membrane fluidity support
   * - Cortisol modulation
   * - Cardiovascular protection
   * - Cell membrane integrity (especially neurons)
   */
  Omega3: (mg: number): PharmacologyDef => {
    // mg = combined EPA + DHA
    // Effects are slow-building (membrane incorporation takes weeks)
    // Acute effects are modest; chronic effects are substantial
    const antiInflammatory = Math.min(0.4, mg * 0.0002);
    const bdnfSupport = Math.min(8, mg * 0.004);
    const serotoninSupport = Math.min(3, mg * 0.0015);
    const dopamineSupport = Math.min(2, mg * 0.001);
    const cortisolModulation = Math.min(2, mg * 0.001);

    return {
      molecule: { name: "EPA/DHA", molarMass: 330 }, // Average of EPA/DHA
      pk: {
        model: "1-compartment",
        bioavailability: 0.7, // With fat-containing meal
        halfLifeMin: 2880, // Days (membrane incorporation)
        timeToPeakMin: 360,
        volume: { kind: "weight", base_L_kg: 0.2 },
      },
      pd: [
        // Anti-inflammatory
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: antiInflammatory,
          unit: "index",
          tau: 1440, // Very slow: membrane effects
        },
        // Neurotrophic
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: bdnfSupport,
          unit: "ng/mL",
          tau: 720, // Slow: gene expression
        },
        // Neurotransmitter support (membrane fluidity)
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninSupport,
          unit: "nM",
          tau: 480,
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineSupport,
          unit: "nM",
          tau: 480,
        },
        // Stress modulation
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolModulation,
          unit: "µg/dL",
          tau: 720,
        },
      ],
    };
  },

  /**
   * ALPHA-GPC
   * Highly bioavailable choline source for acetylcholine synthesis.
   *
   * Comprehensive effects:
   * - Acetylcholine precursor (primary effect)
   * - Cognitive enhancement (memory, focus)
   * - Growth hormone potentiation
   * - Neuroprotection (membrane phospholipid support)
   * - Vagal tone support (ACh is parasympathetic)
   */
  AlphaGPC: (mg: number): PharmacologyDef => {
    // Alpha-GPC is ~40% choline by weight
    // Much better brain bioavailability than choline bitartrate
    const aceCholineEffect = Math.min(25, mg * 0.04);
    const ghPotentiation = Math.min(3, mg * 0.005);
    const vagalSupport = Math.min(0.2, mg * 0.0003);

    return {
      molecule: { name: "Alpha-GPC", molarMass: 257.22 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.88, // Excellent
        halfLifeMin: 240,
        timeToPeakMin: 60,
        volume: { kind: "tbw", fraction: 0.5 },
      },
      pd: [
        // Primary cholinergic effect
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: aceCholineEffect,
          unit: "nM",
          tau: 45,
        },
        // Endocrine
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: ghPotentiation,
          unit: "ng/mL",
          tau: 90,
        },
        // Autonomic
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: vagalSupport,
          unit: "index",
          tau: 60,
        },
        // Focus/alertness (cholinergic tone)
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, mg * 0.005),
          unit: "pg/mL",
          tau: 45,
        },
      ],
    };
  },

  /**
   * 5-HTP (5-Hydroxytryptophan)
   * Direct serotonin precursor (bypasses tryptophan hydroxylase).
   *
   * Comprehensive effects:
   * - Strong serotonin elevation
   * - Melatonin precursor (serotonin → melatonin)
   * - Mood improvement
   * - Appetite modulation
   * - Sleep latency reduction (via melatonin)
   * - Potential peripheral effects (should take with EGCG)
   */
  FiveHTP: (mg: number): PharmacologyDef => {
    // 5-HTP directly converts to serotonin (no rate-limiting step)
    // Much more potent than tryptophan for serotonin elevation
    const serotoninEffect = Math.min(30, mg * 0.25);
    const melatoninEffect = Math.min(15, mg * 0.1);
    const appetiteSuppression = Math.min(25, mg * 0.15); // Ghrelin proxy
    const moodEffect = Math.min(0.3, mg * 0.002); // Vagal/calm

    return {
      molecule: { name: "5-Hydroxytryptophan", molarMass: 220.22 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.7,
        halfLifeMin: 120,
        timeToPeakMin: 45,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // Primary serotonergic effect
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninEffect,
          unit: "nM",
          tau: 30, // Fast: direct precursor
        },
        // Melatonin pathway
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: melatoninEffect,
          unit: "pg/mL",
          tau: 120, // Delayed: serotonin → melatonin conversion
        },
        // Appetite/satiety
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: appetiteSuppression,
          unit: "pg/mL",
          tau: 60,
        },
        // Mood/calm
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: moodEffect,
          unit: "index",
          tau: 45,
        },
        // Mild sedation at higher doses
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(5, mg * 0.03),
          unit: "pg/mL",
          tau: 90,
        },
      ],
    };
  },

  /**
   * ASHWAGANDHA (Withania somnifera)
   * Adaptogenic herb for stress resilience.
   *
   * Comprehensive effects:
   * - Cortisol reduction (primary adaptogenic effect)
   * - GABA-ergic activity (anxiolytic)
   * - Thyroid hormone support (T4 → T3 conversion)
   * - Testosterone support (in men)
   * - Sleep quality improvement
   * - Cognitive enhancement under stress
   */
  Ashwagandha: (mg: number): PharmacologyDef => {
    // Standardized to withanolides (typically 2.5-5%)
    // We assume mg = root extract, not withanolide content
    const cortisolReduction = Math.min(8, mg * 0.012);
    const gabaEffect = Math.min(15, mg * 0.02);
    const thyroidSupport = Math.min(0.15, mg * 0.0002);
    const testosteroneSupport = Math.min(30, mg * 0.04);
    const sleepImprovement = Math.min(8, mg * 0.01);

    return {
      molecule: { name: "Withaferin A", molarMass: 470.6 }, // Primary withanolide
      pk: {
        model: "1-compartment",
        bioavailability: 0.5,
        halfLifeMin: 360,
        timeToPeakMin: 120,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Primary adaptogenic effect
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolReduction,
          unit: "µg/dL",
          tau: 120,
        },
        // Anxiolytic
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: gabaEffect,
          unit: "nM",
          tau: 90,
        },
        // Endocrine support
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidSupport,
          unit: "pmol/L",
          tau: 240,
        },
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: testosteroneSupport,
          unit: "ng/dL",
          tau: 480, // Very slow: hormonal adaptation
        },
        // Sleep
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: sleepImprovement,
          unit: "pg/mL",
          tau: 180,
        },
        // Orexin modulation (sleep/wake)
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(5, mg * 0.007),
          unit: "pg/mL",
          tau: 120,
        },
      ],
    };
  },

  /**
   * VITAMIN D3 (Cholecalciferol)
   * Fat-soluble vitamin with hormone-like effects.
   *
   * Comprehensive effects:
   * - Immune modulation
   * - Mood/serotonin support (VDR in raphe nuclei)
   * - Bone health (calcium absorption)
   * - Testosterone support
   * - Anti-inflammatory effects
   * - Sleep quality (VDR in sleep-regulating areas)
   */
  VitaminD: (iu: number): PharmacologyDef => {
    // 1 IU = 0.025 mcg; typical dose 1000-5000 IU
    // Effects are very slow (weeks to months for steady state)
    const mcg = iu * 0.025;
    const moodSupport = Math.min(5, mcg * 0.04);
    const antiInflammatory = Math.min(0.15, mcg * 0.001);
    const testosteroneSupport = Math.min(15, mcg * 0.1);
    const sleepSupport = Math.min(3, mcg * 0.02);

    return {
      molecule: { name: "Cholecalciferol", molarMass: 384.64 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.8, // With fat
        halfLifeMin: 20160, // ~2 weeks
        timeToPeakMin: 720,
        volume: { kind: "weight", base_L_kg: 0.15 },
      },
      pd: [
        // Direct signal (if vitaminD3 is in your signals)
        {
          target: "vitaminD3",
          mechanism: "agonist",
          intrinsicEfficacy: mcg * 0.5,
          unit: "ng/mL",
          tau: 1440,
        },
        // Mood/serotonin (VDR regulates TPH2)
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: moodSupport,
          unit: "nM",
          tau: 1440, // Very slow
        },
        // Anti-inflammatory
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: antiInflammatory,
          unit: "index",
          tau: 2880,
        },
        // Endocrine
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: testosteroneSupport,
          unit: "ng/dL",
          tau: 2880,
        },
        // Sleep
        {
          target: "melatonin",
          mechanism: "agonist",
          intrinsicEfficacy: sleepSupport,
          unit: "pg/mL",
          tau: 1440,
        },
      ],
    };
  },

  /**
   * CREATINE
   * ATP regeneration support for brain and muscle.
   *
   * Comprehensive effects:
   * - Cognitive enhancement (brain ATP support)
   * - Neuroprotection (energy buffer)
   * - Physical performance (muscle ATP)
   * - Mild mood support
   * - Dopamine modulation (via energy metabolism)
   */
  Creatine: (grams: number): PharmacologyDef => {
    // Typical dose: 3-5g daily
    // Effects build over days/weeks (saturation loading)
    const cognitiveSupport = Math.min(0.1, grams * 0.02); // Energy proxy
    const dopamineSupport = Math.min(3, grams * 0.5);
    const bdnfSupport = Math.min(3, grams * 0.4);

    return {
      molecule: { name: "Creatine", molarMass: 131.13 },
      pk: {
        model: "1-compartment",
        bioavailability: 0.95,
        halfLifeMin: 180, // Plasma; tissue is much longer
        timeToPeakMin: 90,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Energy/cognitive
        {
          target: "energy",
          mechanism: "agonist",
          intrinsicEfficacy: cognitiveSupport,
          unit: "index",
          tau: 60,
        },
        // Mild dopamine support
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineSupport,
          unit: "nM",
          tau: 120,
        },
        // Neurotrophic
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: bdnfSupport,
          unit: "ng/mL",
          tau: 240,
        },
        // Anti-fatigue
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(2, grams * 0.3),
          unit: "pg/mL",
          tau: 90,
        },
      ],
    };
  },

  /**
   * LION'S MANE (Hericium erinaceus)
   * Nootropic mushroom for nerve growth and cognition.
   *
   * Comprehensive effects:
   * - BDNF upregulation (hericenones/erinacines)
   * - NGF stimulation (nerve growth factor - proxied via BDNF)
   * - Neuroprotection
   * - Mild anxiolytic/mood effects
   * - Cognitive enhancement
   * - Potential myelination support
   */
  LionsMane: (mg: number): PharmacologyDef => {
    // Typically 500-3000mg extract daily
    // Effects are slow-building (neurotrophin expression)
    const bdnfEffect = Math.min(15, mg * 0.01);
    const moodSupport = Math.min(5, mg * 0.003);
    const cognitiveSupport = Math.min(5, mg * 0.003);
    const antiInflammatory = Math.min(0.1, mg * 0.00005);

    return {
      molecule: { name: "Hericenone", molarMass: 440 }, // Approximate
      pk: {
        model: "1-compartment",
        bioavailability: 0.3, // Variable
        halfLifeMin: 480,
        timeToPeakMin: 180,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Primary neurotrophic effect
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: bdnfEffect,
          unit: "ng/mL",
          tau: 720, // Very slow: gene expression
        },
        // Mood/anxiety
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: moodSupport,
          unit: "nM",
          tau: 360,
        },
        // Cognitive (acetylcholine support)
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: cognitiveSupport,
          unit: "nM",
          tau: 240,
        },
        // Anti-inflammatory
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: antiInflammatory,
          unit: "index",
          tau: 480,
        },
        // GABA support (anxiolytic)
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(5, mg * 0.003),
          unit: "nM",
          tau: 180,
        },
      ],
    };
  },
};
