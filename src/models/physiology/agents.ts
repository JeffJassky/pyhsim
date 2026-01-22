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
        delivery: "infusion",
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
          intrinsicEfficacy: amountGrams * 2.0 * giMultiplier,
          unit: "mg/dL",
          description:
            "Carbs break down into blood sugar. Higher glycemic index foods spike it faster—this is the energy you feel (or the crash that follows).",
        },
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.5 * giMultiplier,
          unit: "µIU/mL",
          tau: 45,
          description:
            "Your pancreas releases insulin to move sugar into cells. Bigger carb loads mean more insulin, which also affects hunger and fat storage.",
        },
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: glp1Effect,
          unit: "pmol/L",
          tau: 35,
          description:
            "A gut hormone that amplifies insulin and tells your brain you're getting full. This is what Ozempic mimics—carbs naturally trigger it.",
        },
        // Reward and mood
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(20, palatability * 20),
          unit: "nM",
          tau: 20,
          description:
            "Sweet and palatable foods trigger reward circuits. This is the 'mmm' feeling—and why sugary foods can feel hard to resist.",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: carbSerotoninEffect,
          unit: "nM",
          tau: 150,
          description:
            "Carbs help tryptophan enter the brain to make serotonin. This is why carb-heavy meals can improve mood and feel comforting.",
        },
        // Satiety signals
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: gabaSatiety * 25,
          unit: "nM",
          tau: 30,
          description:
            "Eating activates calming circuits that signal satisfaction. This is part of why a good meal makes you feel content and relaxed.",
        },
        {
          target: "leptin",
          mechanism: "agonist",
          intrinsicEfficacy: leptinEffect,
          unit: "ng/mL",
          tau: 180,
          description:
            "The 'fullness' hormone that tells your brain you've eaten enough. Takes a while to kick in—eating slowly helps you notice it.",
        },
        // Metabolic switching (fed state)
        {
          target: "ketone",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(1.5, amountGrams * 0.02),
          unit: "mmol/L",
          tau: 60,
          description:
            "When carbs are available, your body stops burning fat for fuel. This is why eating carbs knocks you out of ketosis.",
        },
        {
          target: "ampk",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(0.5, amountGrams * 0.01),
          unit: "fold-change",
          tau: 30,
          description:
            "Eating turns off the 'low fuel' sensor. Your body shifts from scavenging mode to storage mode.",
        },
        // Post-prandial sedation ("food coma")
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: orexinSuppression,
          unit: "pg/mL",
          tau: 45,
          description:
            "Big carb meals suppress your wakefulness signals. This is the 'food coma'—especially noticeable after high-GI meals.",
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: norepinephrineSuppression,
          unit: "pg/mL",
          tau: 30,
          description:
            "Your body shifts from 'alert mode' to 'rest and digest.' Less fight-or-flight chemicals means you feel calmer and sleepier.",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolSuppression,
          unit: "µg/dL",
          tau: 60,
          description:
            "Eating signals safety to your body, so stress hormones drop. A comforting meal genuinely does reduce stress chemistry.",
        },
        // Thermic Effect of Food (TEF)
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 60,
          description:
            "Your metabolism speeds up to process the food. About 8% of carb calories go toward digestion itself.",
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
        delivery: "infusion",
        halfLifeMin: 120, // Slow digestion
        timeToPeakMin: 180, // Fat absorption is slow (chylomicron formation)
        volume: { kind: "weight", base_L_kg: 0.3 },
      },
      pd: [
        // Satiety and hunger signals
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: amountGrams * 3.0,
          unit: "pg/mL",
          tau: 60,
          description:
            "Fat powerfully suppresses the hunger hormone. This is why fatty meals keep you satisfied for hours—fat is the most satiating macronutrient.",
        },
        {
          target: "leptin",
          mechanism: "agonist",
          intrinsicEfficacy: leptinEffect,
          unit: "ng/mL",
          tau: 120,
          description:
            "Fat triggers strong fullness signaling. Your body registers calorie-dense food and reduces appetite accordingly.",
        },
        // Incretin and metabolic
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.3,
          unit: "pmol/L",
          tau: 90,
          description:
            "Fat stimulates the same gut hormone that Ozempic mimics. This helps regulate appetite and slows stomach emptying.",
        },
        // Parasympathetic activation (rest and digest)
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: vagalEffect,
          unit: "index",
          tau: 45,
          description:
            "Fatty meals activate the 'rest and digest' nerve. Your body prioritizes digestion, which is why rich meals make you want to relax.",
        },
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: achEffect,
          unit: "nM",
          tau: 30,
          description:
            "The parasympathetic signal that tells your gut to secrete digestive enzymes. Fat requires thorough processing.",
        },
        // Reward, comfort, and bliss
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(8, amountGrams * 0.2),
          unit: "nM",
          tau: 25,
          description:
            "Rich, fatty foods light up reward circuits. Evolution wired us to seek calorie-dense food—hence the appeal of butter and cream.",
        },
        {
          target: "oxytocin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, amountGrams * 0.08),
          unit: "pg/mL",
          tau: 60,
          description:
            "Comfort foods trigger the 'bonding' hormone. This is why ice cream after a breakup actually does feel emotionally soothing.",
        },
        {
          target: "endocannabinoid",
          mechanism: "agonist",
          intrinsicEfficacy: endocannabinoidEffect,
          unit: "nM",
          tau: 90,
          description:
            "Fat triggers your body's own 'bliss molecules' (similar to what cannabis activates). This creates that deep satisfaction from rich food.",
        },
        // Post-prandial sedation
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: orexinSuppression,
          unit: "pg/mL",
          tau: 90,
          description:
            "Heavy fatty meals suppress wakefulness signals. The drowsiness comes on slower than with carbs but lasts longer.",
        },
        {
          target: "norepi",
          mechanism: "antagonist",
          intrinsicEfficacy: norepinephrineSuppression,
          unit: "pg/mL",
          tau: 60,
          description:
            "Alertness chemicals drop as your body focuses on digestion. You shift from 'go mode' to 'processing mode.'",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolSuppression,
          unit: "µg/dL",
          tau: 90,
          description:
            "A satisfying meal signals safety, lowering stress hormones. Comfort eating genuinely reduces cortisol—at least temporarily.",
        },
        // Inflammatory response
        {
          target: "inflammation",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.05,
          unit: "index",
          tau: 120,
          description:
            "Large fatty meals cause temporary inflammation as fat enters the bloodstream. This is normal but excessive with very high-fat meals.",
        },
        // Thermic Effect of Food (TEF) - Fat has lowest TEF
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 120,
          description:
            "Fat has the lowest metabolic cost to process—only 3% of calories go to digestion. This is why fat is efficiently stored.",
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
        delivery: "infusion",
        halfLifeMin: 60,
        timeToPeakMin: 90, // Protein digestion is moderate speed
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Anabolic signaling
        {
          target: "mtor",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 1.0,
          unit: "fold-change",
          tau: 90,
          description:
            "Protein flips the 'build muscle' switch. This is the main signal that tells your body to repair and grow tissue after exercise.",
        },
        // Metabolic hormones
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.2,
          unit: "µIU/mL",
          tau: 45,
          description:
            "Protein raises insulin, but less than carbs. This helps amino acids enter muscles without causing the same blood sugar swings.",
        },
        {
          target: "glucagon",
          mechanism: "agonist",
          intrinsicEfficacy: amountGrams * 0.5,
          unit: "pg/mL",
          tau: 30,
          description:
            "Protein uniquely raises glucagon alongside insulin. This maintains stable blood sugar—why protein is better for steady energy.",
        },
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: glp1Effect,
          unit: "pmol/L",
          tau: 60,
          description:
            "Protein triggers the gut fullness hormone, adding to its satiating effect. Another reason high-protein diets help with appetite.",
        },
        // Satiety signals
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: amountGrams * 2.5,
          unit: "pg/mL",
          tau: 60,
          description:
            "Protein strongly suppresses hunger—more than carbs or fat calorie-for-calorie. This is a key reason high-protein diets work for weight loss.",
        },
        {
          target: "leptin",
          mechanism: "agonist",
          intrinsicEfficacy: leptinEffect,
          unit: "ng/mL",
          tau: 150,
          description:
            "Protein signals fullness to your brain over the hours after eating. Part of why you stay satisfied longer after a steak than after pasta.",
        },
        // Neurotransmitter precursors
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopaminePrecursorEffect,
          unit: "nM",
          tau: 120,
          description:
            "Protein provides tyrosine, the raw material for dopamine. Good protein intake supports motivation, focus, and drive.",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninPrecursorEffect,
          unit: "nM",
          tau: 150,
          description:
            "Protein provides tryptophan, which becomes serotonin. However, protein-heavy meals can actually reduce brain serotonin—see carbs for boosting it.",
        },
        // Excitatory amino acids
        {
          target: "glutamate",
          mechanism: "agonist",
          intrinsicEfficacy: glutamateEffect,
          unit: "µM",
          tau: 60,
          description:
            "Protein-rich foods contain glutamate—this is the 'umami' taste. It's also an alerting brain chemical, which is why protein meals feel energizing.",
        },
        // Histamine from histidine
        {
          target: "histamine",
          mechanism: "agonist",
          intrinsicEfficacy: histamineEffect,
          unit: "nM",
          tau: 90,
          description:
            "High-protein foods (especially aged ones) contain histidine, which becomes histamine. Sensitive people may notice flushing or alertness.",
        },
        // Neurotrophin support
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: bdnfEffect,
          unit: "ng/mL",
          tau: 180,
          description:
            "Protein provides the building blocks for BDNF, which supports brain health and learning. Adequate protein intake matters for cognition.",
        },
        // Mild sedation from satiety (less than carbs due to tyrosine counter)
        {
          target: "orexin",
          mechanism: "antagonist",
          intrinsicEfficacy: orexinSuppression,
          unit: "pg/mL",
          tau: 90,
          description:
            "Protein causes less food coma than carbs. The tyrosine (alerting) partly counteracts the sedation from fullness signals.",
        },
        // Thermic Effect of Food (TEF) - Protein has HIGHEST TEF (~25%)
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 90,
          description:
            "Protein has the highest metabolic cost—25% of calories go to digestion. This 'thermic effect' is why high-protein diets boost metabolism.",
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
        delivery: "infusion",
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
          tau: 120,
          description:
            "Fiber feeds gut bacteria that release compounds triggering GLP-1. This delayed fullness signal helps you stay satisfied between meals.",
        },
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: amountGrams * 1.5,
          unit: "pg/mL",
          tau: 30,
          description:
            "Fiber physically fills your stomach, immediately suppressing hunger. This mechanical stretch is why high-fiber meals feel filling even with fewer calories.",
        },
        // Gut-brain axis (SCFA-mediated)
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: scfaGabaEffect,
          unit: "nM",
          tau: 180,
          description:
            "Gut bacteria literally produce calming chemicals from fiber. This gut-brain connection is why fiber intake affects mood and anxiety hours later.",
        },
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: vagalEffect,
          unit: "index",
          tau: 60,
          description:
            "Fiber activates the nerve connecting your gut to your brain. This is how your gut 'talks' to your brain about what you've eaten.",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: gutSerotoninEffect,
          unit: "nM",
          tau: 90,
          description:
            "90% of your serotonin is made in the gut. Fiber feeds the bacteria that support this production—another reason diet affects mood.",
        },
        // Anti-inflammatory (gut barrier, microbiome)
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: scfaAntiInflammatory,
          unit: "index",
          tau: 240,
          description:
            "Fiber produces compounds that reduce gut inflammation and strengthen the intestinal barrier. This is why fiber protects against many chronic diseases.",
        },
        // Thermic Effect of Food (TEF) - from fermentation
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 240,
          description:
            "Bacteria expend energy fermenting fiber, generating a small metabolic boost. The calories from fiber are harder to extract than other carbs.",
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
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: 300 * intensity,
          unit: "pg/mL",
          tau: 5,
          description:
            "Exercise triggers an immediate rush of norepinephrine. This is the focus and alertness you feel—your brain preparing for physical demands.",
        },
        {
          target: "adrenaline",
          mechanism: "agonist",
          intrinsicEfficacy: 250 * intensity,
          unit: "pg/mL",
          tau: 2,
          description:
            "The classic 'adrenaline rush.' Your heart beats faster, airways open, and blood flows to muscles. The intensity you feel during exercise.",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: 15 * intensity,
          unit: "µg/dL",
          tau: 15,
          description:
            "Exercise is a controlled stressor that raises cortisol. This mobilizes energy stores and is healthy in short bursts—it's chronic elevation that's harmful.",
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
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "ampk",
          mechanism: "agonist",
          intrinsicEfficacy: 20 * intensity,
          unit: "fold-change",
          tau: 10,
          description:
            "When muscles burn energy, AMPK activates to restore it. This 'fuel gauge' sensor drives many benefits of exercise—improved insulin sensitivity, fat burning, mitochondria building.",
        },
        {
          target: "glucose",
          mechanism: "antagonist",
          intrinsicEfficacy: 40 * intensity,
          unit: "mg/dL",
          tau: 5,
          description:
            "Working muscles pull glucose out of your blood. This is why exercise lowers blood sugar and improves insulin sensitivity—your muscles become glucose sinks.",
        },
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: 30 * intensity,
          unit: "ng/mL",
          tau: 30,
          description:
            "Exercise is the most powerful BDNF booster known. This 'brain fertilizer' improves memory, mood, and neuroplasticity—a key reason exercise helps depression.",
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
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "mtor",
          mechanism: "agonist",
          intrinsicEfficacy: 15 * intensity,
          unit: "fold-change",
          tau: 120,
          description:
            "Lifting heavy things activates the 'build muscle' pathway. This mechanical tension is THE signal that tells your body to grow stronger.",
        },
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: 5 * intensity,
          unit: "ng/dL",
          tau: 60,
          description:
            "Resistance training boosts testosterone acutely. This anabolic hormone helps build muscle and bone—one reason strength training benefits everyone.",
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: 10 * intensity,
          unit: "ng/mL",
          tau: 30,
          description:
            "Heavy lifting triggers growth hormone release, especially with shorter rest periods. This aids muscle repair and fat metabolism.",
        },
        {
          target: "inflammation",
          mechanism: "agonist",
          intrinsicEfficacy: 0.5 * intensity,
          unit: "index",
          tau: 240,
          description:
            "Muscle damage creates inflammation—this is the soreness you feel 1-2 days later (DOMS). It's part of the repair process that makes muscles stronger.",
        },
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
      delivery: "bolus",
      bioavailability: 0.3,
      halfLifeMin: 180,
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
      volume: { kind: "lbm", base_L_kg: 2.0 },
    },
    pd: [
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 34,
        intrinsicEfficacy: mg * 3.0,
        unit: "nM",
        description:
          "Blocks dopamine reuptake, the main mechanism for focus. Dopamine stays active longer in the synapse, improving attention and motivation.",
      },
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 300,
        intrinsicEfficacy: mg * 3.0,
        unit: "nM",
        description:
          "Also blocks norepinephrine reuptake, adding to alertness and focus. This contributes to the 'locked in' feeling during tasks.",
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        EC50: 0.2,
        intrinsicEfficacy: mg * 0.5,
        unit: "µg/dL",
        description:
          "Mildly raises stress hormones, part of why it increases arousal. This can contribute to appetite suppression and elevated heart rate.",
      },
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 2000,
        intrinsicEfficacy: mg * 0.1,
        unit: "nM",
        description:
          "Very weak serotonin effects compared to dopamine. This is why methylphenidate feels more 'focused' than 'happy' compared to some other medications.",
      },
    ],
  }),

  Caffeine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Caffeine", molarMass: 194.19, logP: -0.07 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
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
        description:
          "Blocks adenosine from binding, preventing the 'sleep pressure' signal from reaching neurons.",
      },
      {
        target: "Adenosine_A1",
        mechanism: "antagonist",
        Ki: 12000,
        intrinsicEfficacy: mg * 0.2,
        unit: "nM",
        description:
          "Inhibits the general slowing of neural activity, maintaining higher cognitive speed.",
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        EC50: 25000,
        intrinsicEfficacy: mg * 0.08,
        unit: "µg/dL",
        description:
          "Triggers a modest release of the body's primary stress hormone.",
      },
      {
        target: "adrenaline",
        mechanism: "agonist",
        EC50: 30000,
        intrinsicEfficacy: mg * 0.12,
        unit: "pg/mL",
        description:
          "Activates the 'fight or flight' response, increasing physical readiness.",
      },
      {
        target: "norepi",
        mechanism: "agonist",
        EC50: 30000,
        intrinsicEfficacy: mg * 0.9375,
        unit: "pg/mL",
        description:
          "Boosts focus and vigilance by increasing norepinephrine levels in the brain.",
      },
    ],
  }),

  Melatonin: (mg: number): PharmacologyDef => ({
    molecule: { name: "Melatonin", molarMass: 232.28 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
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
        description:
          "Primary sleep-onset receptor. Activates the 'biological night' signal in the brain's master clock.",
      },
      {
        target: "MT2",
        mechanism: "agonist",
        Ki: 0.23,
        intrinsicEfficacy: mg * 6.66,
        unit: "pg/mL",
        description:
          "Circadian phase shifter. Helps synchronize the timing of various biological rhythms.",
      },
      {
        target: "orexin",
        mechanism: "antagonist",
        EC50: 50,
        intrinsicEfficacy: mg * 3.33,
        unit: "pg/mL",
        description:
          "Directly suppresses the 'wakefulness' peptide, reducing arousal and alertness.",
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        EC50: 100,
        intrinsicEfficacy: mg * 1.66,
        unit: "µg/dL",
        description:
          "Blunts the stress hormone response, facilitating the transition into deep rest.",
      },
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 200,
        intrinsicEfficacy: mg * 16.0,
        unit: "nM",
        description:
          "Enhances the brain's primary inhibitory signal, providing a gentle sedative effect.",
      },
    ],
  }),

  LTheanine: (mg: number): PharmacologyDef => ({
    molecule: { name: "L-Theanine", molarMass: 174.2 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.95,
      halfLifeMin: 75,
      clearance: {
        renal: { baseCL_mL_min: 180 },
        hepatic: { baseCL_mL_min: 80 },
      },
      volume: { kind: "tbw", fraction: 0.5 },
    },
    pd: [
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 20.0,
        intrinsicEfficacy: mg * 0.36,
        unit: "nM",
        description:
          "Enhances your brain's natural calming signals. This is the main reason theanine promotes relaxation without drowsiness—it works with your GABA system gently.",
      },
      {
        target: "NMDA",
        mechanism: "antagonist",
        Ki: 50.0,
        intrinsicEfficacy: mg * 0.0021,
        unit: "µM",
        description:
          "Mildly reduces excitatory brain activity. This helps take the 'edge' off stimulation, which is why theanine pairs well with caffeine.",
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        EC50: 30.0,
        intrinsicEfficacy: mg * 0.004,
        unit: "nM",
        description:
          "Modestly supports serotonin levels, contributing to the calm, content feeling. Not strong enough to affect mood dramatically on its own.",
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        EC50: 35.0,
        intrinsicEfficacy: mg * 0.005,
        unit: "nM",
        description:
          "Slightly supports dopamine, which may help maintain motivation while relaxed. This is the 'alert but calm' quality of theanine.",
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        EC50: 25.0,
        intrinsicEfficacy: mg * 0.03,
        unit: "µg/dL",
        description:
          "Reduces stress hormone response, especially during demanding situations. This is why theanine can help with performance anxiety.",
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
        delivery: "infusion",
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
          description:
            "Alcohol's main effect—it amplifies your brain's 'calm down' signals. This causes relaxation, reduced anxiety, impaired coordination, and at high doses, sedation.",
        },
        {
          target: "ethanol",
          mechanism: "agonist",
          intrinsicEfficacy: grams * 10,
          unit: "mg/dL",
          description:
            "Blood alcohol level. Legal limit is typically 80 mg/dL. Effects progress from relaxation to impairment to danger as this rises.",
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: units * 3.3,
          unit: "nM",
          tau: 10,
          description:
            "The 'buzz'—alcohol releases dopamine in reward circuits. This pleasurable feeling drives the desire for more and underlies alcohol's addictive potential.",
        },
        {
          target: "NMDA",
          mechanism: "NAM",
          Ki: 50000,
          intrinsicEfficacy: units * 0.13,
          unit: "fold-change",
          description:
            "Alcohol blocks learning and memory circuits. This is why you don't remember things well when drunk—and why blackouts happen at high doses.",
        },
        {
          target: "vasopressin",
          mechanism: "antagonist",
          intrinsicEfficacy: units * 6.6,
          unit: "pg/mL",
          description:
            "Suppresses the hormone that tells your kidneys to retain water. This is why alcohol makes you urinate frequently and causes dehydration (and hangovers).",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: units * 6.6,
          unit: "µg/dL",
          description:
            "Alcohol raises stress hormones, especially as it wears off. This contributes to 'hangxiety'—the anxious, jittery feeling the morning after drinking.",
        },
        {
          target: "inflammation",
          mechanism: "agonist",
          intrinsicEfficacy: units * 0.33,
          unit: "index",
          description:
            "Alcohol triggers inflammatory responses throughout the body. Regular drinking increases baseline inflammation, affecting liver, brain, and overall health.",
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
        delivery: "bolus",
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
          tau: 90,
          description:
            "Provides raw material for dopamine production. Most helpful when you're depleted from stress or demanding cognitive work—won't do much if stores are already full.",
        },
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: norepinephrineEffect,
          unit: "pg/mL",
          tau: 120,
          description:
            "Supports norepinephrine synthesis for sustained alertness. Particularly useful during prolonged stress or sleep deprivation when these stores run low.",
        },
        {
          target: "adrenaline",
          mechanism: "agonist",
          intrinsicEfficacy: adrenalineEffect,
          unit: "pg/mL",
          tau: 150,
          description:
            "Adrenaline is made from norepinephrine, so tyrosine indirectly supports it. Helpful for maintaining stress response capacity.",
        },
        // Thyroid hormone support
        {
          target: "thyroid",
          mechanism: "agonist",
          intrinsicEfficacy: thyroidEffect,
          unit: "pmol/L",
          tau: 240,
          description:
            "Tyrosine is a building block for thyroid hormones. This is a minor effect—tyrosine deficiency is rare, so most people won't notice thyroid benefits.",
        },
        // Mild alertness from catecholamine support
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, mg * 0.003),
          unit: "pg/mL",
          tau: 90,
          description:
            "May support wakefulness signals indirectly through catecholamine support. The effect is subtle—more like preventing a dip than creating a boost.",
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
        delivery: "bolus",
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
          tau: 30,
          description:
            "L-DOPA converts directly to dopamine, bypassing the usual rate-limiting step. This is why it's so effective for Parkinson's—and why it has stronger effects than tyrosine.",
        },
        // Secondary catecholamine effects
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: norepinephrineEffect,
          unit: "pg/mL",
          tau: 60,
          description:
            "Some dopamine converts to norepinephrine, adding to alertness and focus. This cascade effect contributes to the overall stimulating quality.",
        },
        // Endocrine effects
        {
          target: "prolactin",
          mechanism: "antagonist",
          intrinsicEfficacy: prolactinSuppression,
          unit: "ng/mL",
          tau: 45,
          description:
            "Dopamine naturally suppresses prolactin release. This is why L-DOPA/Mucuna is sometimes used to lower elevated prolactin levels.",
        },
        {
          target: "growthHormone",
          mechanism: "agonist",
          intrinsicEfficacy: ghEffect,
          unit: "ng/mL",
          tau: 60,
          description:
            "Dopamine stimulates growth hormone release. This is why Mucuna supplements are sometimes marketed for fitness—though the effect is modest.",
        },
        // Mood/reward
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(5, mg * 0.02),
          unit: "pg/mL",
          tau: 45,
          description:
            "The dopamine boost supports wakefulness and motivation. You may notice increased drive and interest in activities.",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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
        delivery: "bolus",
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

  // =============================================================================
  // THERMAL EXPOSURE AGENTS
  // =============================================================================

  /**
   * COLD EXPOSURE
   * Cold water immersion, cold showers, cryotherapy.
   *
   * Comprehensive effects:
   * - Sympathetic activation: norepinephrine ↑↑, adrenaline ↑
   * - Brown adipose tissue activation: thyroid ↑, energy ↑
   * - Cold shock proteins: BDNF ↑
   * - Vagal dive reflex: brief vagal ↑
   * - Stress response: cortisol ↑ (mild, transient)
   * - Anti-inflammatory (chronic effect)
   * - Dopamine: ↑ (post-exposure mood lift)
   */
  ColdExposure: (
    tempCelsius: number,
    intensity: number = 1.0,
  ): PharmacologyDef => {
    // Temperature affects intensity (colder = more intense)
    // 0°C = ice bath (max), 15°C = cool shower (mild)
    const tempFactor = Math.max(0.3, (15 - tempCelsius) / 15);
    const effectiveIntensity = intensity * tempFactor;

    // Norepinephrine can increase 200-500% with cold exposure
    const norepinephrineEffect = Math.min(400, effectiveIntensity * 300);
    const adrenalineEffect = Math.min(200, effectiveIntensity * 150);
    const dopamineEffect = Math.min(30, effectiveIntensity * 25); // Significant mood lift
    const cortisolEffect = Math.min(8, effectiveIntensity * 6);
    const bdnfEffect = Math.min(15, effectiveIntensity * 12);
    const thyroidEffect = Math.min(0.2, effectiveIntensity * 0.15);
    const vagalEffect = Math.min(0.3, effectiveIntensity * 0.2); // Dive reflex
    const antiInflammatory = Math.min(0.3, effectiveIntensity * 0.2);

    return {
      molecule: { name: "Cold Exposure", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
          pd: [
              // Primary sympathetic activation
              {
                target: "norepi",
                mechanism: "agonist",
                intrinsicEfficacy: norepinephrineEffect,
                unit: "pg/mL",
                tau: 5, // Very fast onset
                description: "Cold triggers a massive rush of norepinephrine, boosting alertness and metabolism far beyond what caffeine can do.",
              },
              {
                target: "adrenaline",
                mechanism: "agonist",
                intrinsicEfficacy: adrenalineEffect,
                unit: "pg/mL",
                tau: 3,
                description: "The 'cold shock' response immediately prepares your body for survival, spiking energy and heart rate.",
              },
              // Dopamine mood lift (delayed, persists post-exposure)
              {
                target: "dopamine",
                mechanism: "agonist",
                intrinsicEfficacy: dopamineEffect,
                unit: "nM",
                tau: 30,
                description: "Cold immersion can raise dopamine by up to 250%. This creates a steady, multi-hour mood lift without the 'crash'.",
              },
              // Stress response
              {
                target: "cortisol",
                mechanism: "agonist",
                intrinsicEfficacy: cortisolEffect,
                unit: "µg/dL",
                tau: 15,
                description: "Briefly raises cortisol. This 'hormetic' stress helps train your nervous system to stay calm under pressure.",
              },
              // Neurotrophic (cold shock proteins)
              {
                target: "bdnf",
                mechanism: "agonist",
                intrinsicEfficacy: bdnfEffect,
                unit: "ng/mL",
                tau: 60,
                description: "Activates 'cold shock' proteins that support brain health and protect neurons from damage.",
              },
              // Metabolic activation (BAT)
              {
                target: "thyroid",
                mechanism: "agonist",
                intrinsicEfficacy: thyroidEffect,
                unit: "pmol/L",
                tau: 30,
                description: "Stimulates brown adipose tissue (BAT) to burn fat for heat, increasing your overall metabolic rate.",
              },
              // Vagal dive reflex (brief parasympathetic activation)
              {
                target: "vagal",
                mechanism: "agonist",
                intrinsicEfficacy: vagalEffect,
                unit: "index",
                tau: 10,
                description: "Immersion triggers the 'dive reflex,' which can help reset the heart rate and calm the nervous system afterward.",
              },
              // Anti-inflammatory (chronic adaptation)
              {
                target: "inflammation",
                mechanism: "antagonist",
                intrinsicEfficacy: antiInflammatory,
                unit: "index",
                tau: 120,
                description: "Regular cold exposure helps lower systemic inflammation and speeds up physical recovery.",
              },
              // Alertness
              {
                target: "orexin",
                mechanism: "agonist",
                intrinsicEfficacy: Math.min(20, effectiveIntensity * 15),
                unit: "pg/mL",
                tau: 10,
                description: "Directly stimulates wakefulness signals, instantly clearing brain fog and sleep inertia.",
              },
            ],
          };
        },
      
        /**
         * HEAT EXPOSURE
         * Sauna, steam room, hot baths.
         * 
         * Comprehensive effects:
         * - Heat shock proteins: BDNF ↑, inflammation ↓
         * - Growth hormone: ↑↑ (major effect, up to 16x increase)
         * - Prolactin: ↑
         * - Relaxation: cortisol ↓, vagal ↑
         * - Serotonin: ↑
         * - Vasodilation: blood pressure effects
         * - Dehydration stress: vasopressin ↑
         */
        HeatExposure: (
          tempCelsius: number,
          type: "dry" | "infrared" | "steam" = "dry",
          intensity: number = 1.0,
        ): PharmacologyDef => {
          // Temperature affects intensity
          // Dry sauna: 80-100°C (strongest)
          // Infrared: 45-65°C (moderate, deeper penetration)
          // Steam: 40-50°C (humidity compensates for lower temp)
      
          let tempFactor: number;
          let ghMultiplier: number;
      
          switch (type) {
            case "dry":
              tempFactor = Math.min(1.5, (tempCelsius - 60) / 40);
              ghMultiplier = 1.0; // Strongest GH response
              break;
            case "infrared":
              tempFactor = Math.min(1.2, (tempCelsius - 35) / 30);
              ghMultiplier = 0.7; // Moderate GH
              break;
            case "steam":
              tempFactor = Math.min(1.3, (tempCelsius - 35) / 15);
              ghMultiplier = 0.8; // Good GH, humidity helps
              break;
            default:
              tempFactor = 1.0;
              ghMultiplier = 1.0;
          }
      
          const effectiveIntensity = Math.max(0.3, intensity * tempFactor);
      
          // Growth hormone can increase 2-16x with heat exposure
          const ghEffect = Math.min(25, effectiveIntensity * ghMultiplier * 20);
          const prolactinEffect = Math.min(15, effectiveIntensity * 10);
          const bdnfEffect = Math.min(12, effectiveIntensity * 10);
          const serotoninEffect = Math.min(8, effectiveIntensity * 6);
          const vagalEffect = Math.min(0.4, effectiveIntensity * 0.3);
          const cortisolReduction = Math.min(5, effectiveIntensity * 4);
          const antiInflammatory = Math.min(0.25, effectiveIntensity * 0.2);
          const vasopressinEffect = Math.min(8, effectiveIntensity * 6); // Dehydration signal
      
          return {
            molecule: { name: "Heat Exposure", molarMass: 0 },
            pk: { model: "activity-dependent", delivery: "continuous" },
            pd: [
              // Major growth hormone release
              {
                target: "growthHormone",
                mechanism: "agonist",
                intrinsicEfficacy: ghEffect,
                unit: "ng/mL",
                tau: 20,
                description: "Sauna use can spike growth hormone by 200-1600%, supporting muscle repair and anti-aging.",
              },
              // Prolactin increase
              {
                target: "prolactin",
                mechanism: "agonist",
                intrinsicEfficacy: prolactinEffect,
                unit: "ng/mL",
                tau: 30,
                description: "Heat stress triggers prolactin, which may help with heat adaptation and neurogenesis.",
              },
              // Neurotrophic (heat shock proteins)
              {
                target: "bdnf",
                mechanism: "agonist",
                intrinsicEfficacy: bdnfEffect,
                unit: "ng/mL",
                tau: 45,
                description: "Activates 'heat shock' proteins that support brain health and help repair damaged proteins.",
              },
              // Mood and relaxation
              {
                target: "serotonin",
                mechanism: "agonist",
                intrinsicEfficacy: serotoninEffect,
                unit: "nM",
                tau: 30,
                description: "The warmth boosts serotonin levels, creating a feeling of peacefulness and well-being.",
              },
              {
                target: "vagal",
                mechanism: "agonist",
                intrinsicEfficacy: vagalEffect,
                unit: "index",
                tau: 20,
                description: "As your body relaxes into the heat, vagal tone increases, helping you shift into recovery mode.",
              },
              // Stress reduction
              {
                target: "cortisol",
                mechanism: "antagonist",
                intrinsicEfficacy: cortisolReduction,
                unit: "µg/dL",
                tau: 45,
                description: "Deep heat is a powerful stress-reliever that helps lower systemic cortisol levels.",
              },
              // Anti-inflammatory
              {
                target: "inflammation",
                mechanism: "antagonist",
                intrinsicEfficacy: antiInflammatory,
                unit: "index",
                tau: 90,
                description: "Helps reduce markers of inflammation and muscle soreness, making it great for recovery.",
              },
              // Fluid balance
              {
                target: "vasopressin",
                mechanism: "agonist",
                intrinsicEfficacy: vasopressinEffect,
                unit: "pg/mL",
                tau: 30,
                description: "Sweating triggers the hormone that helps your body retain water and manage hydration.",
              },
              // Mild sedation post-exposure
              {
                target: "orexin",
                mechanism: "antagonist",
                intrinsicEfficacy: Math.min(8, effectiveIntensity * 6),
                unit: "pg/mL",
                tau: 60,
                description: "Heat exposure can lead to a pleasant post-sauna drowsiness, signaling deep relaxation and recovery."
              },
              // Endocannabinoid activation (relaxation)
              {
                target: "endocannabinoid",
                mechanism: "agonist",
                intrinsicEfficacy: Math.min(5, effectiveIntensity * 4),
                unit: "nM",
                tau: 30,
                description: "Heat activates your body's natural 'bliss molecules,' contributing to the profound sense of well-being and calm after a session."
              }
            ],
          };
        },
        // =============================================================================
  // PRESCRIPTION MEDICATIONS - ADHD
  // =============================================================================

  /**
   * AMPHETAMINE (Adderall IR)
   * Mixed amphetamine salts - DAT/NET releaser.
   *
   * More potent than methylphenidate due to releasing mechanism.
   */
  Amphetamine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Amphetamine", molarMass: 135.21, logP: 1.76 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.75,
      halfLifeMin: 600, // ~10 hours
      timeToPeakMin: 180,
      clearance: { hepatic: { baseCL_mL_min: 300, CYP: "CYP2D6" } },
      volume: { kind: "lbm", base_L_kg: 3.5 },
    },
    pd: [
      // DAT releasing (more potent than reuptake inhibition)
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 25,
        intrinsicEfficacy: mg * 5.0, // Stronger than MPH
        unit: "nM",
      },
      // NET releasing
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 40,
        intrinsicEfficacy: mg * 4.5,
        unit: "nM",
      },
      // Mild SERT effect
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 1800,
        intrinsicEfficacy: mg * 0.3,
        unit: "nM",
      },
      // TAAR1 agonism (trace amine receptor)
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.5, // Additional DA release via TAAR1
        unit: "nM",
        tau: 15,
      },
      // Sympathetic activation
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.4,
        unit: "µg/dL",
        tau: 30,
      },
      {
        target: "adrenaline",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 3.0,
        unit: "pg/mL",
        tau: 20,
      },
    ],
  }),

  /**
   * LISDEXAMFETAMINE (Vyvanse)
   * Prodrug of amphetamine - slower onset, smoother curve.
   */
  Lisdexamfetamine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Lisdexamfetamine", molarMass: 263.38, logP: -0.73 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.95, // High as prodrug
      halfLifeMin: 720, // ~12 hours (includes conversion time)
      timeToPeakMin: 240, // Slower due to enzymatic conversion
      clearance: { hepatic: { baseCL_mL_min: 250, CYP: "CYP2D6" } },
      volume: { kind: "lbm", base_L_kg: 3.5 },
    },
    pd: [
      // Same targets as amphetamine but lower per-mg efficacy (prodrug conversion)
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 25,
        intrinsicEfficacy: mg * 1.5, // ~30% of dose converts
        unit: "nM",
      },
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 40,
        intrinsicEfficacy: mg * 1.35,
        unit: "nM",
      },
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 1800,
        intrinsicEfficacy: mg * 0.09,
        unit: "nM",
      },
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.45,
        unit: "nM",
        tau: 20,
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.12,
        unit: "µg/dL",
        tau: 45,
      },
    ],
  }),

  /**
   * METHYLPHENIDATE XR (Concerta)
   * Extended release methylphenidate - OROS delivery system.
   */
  MethylphenidateXR: (mg: number): PharmacologyDef => ({
    molecule: { name: "Methylphenidate XR", molarMass: 233.31, logP: 2.15 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.3,
      halfLifeMin: 420, // Extended due to OROS release
      timeToPeakMin: 360, // Biphasic: 1-2hr initial, 6-8hr second peak
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CES1" } },
      volume: { kind: "lbm", base_L_kg: 2.0 },
    },
    pd: [
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 34,
        intrinsicEfficacy: mg * 2.5, // Slightly less peak than IR
        unit: "nM",
      },
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 300,
        intrinsicEfficacy: mg * 2.5,
        unit: "nM",
      },
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.4,
        unit: "µg/dL",
        tau: 60,
      },
    ],
  }),

  /**
   * GUANFACINE (Intuniv)
   * Alpha-2A adrenergic agonist - non-stimulant ADHD treatment.
   */
  Guanfacine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Guanfacine", molarMass: 246.09, logP: 1.52 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.8,
      halfLifeMin: 1020, // ~17 hours
      timeToPeakMin: 300,
      clearance: { hepatic: { baseCL_mL_min: 150, CYP: "CYP3A4" } },
      volume: { kind: "weight", base_L_kg: 6.3 },
    },
    pd: [
      // Alpha-2A agonism reduces sympathetic tone
      {
        target: "norepi",
        mechanism: "antagonist", // Reduces NE release
        intrinsicEfficacy: mg * 80,
        unit: "pg/mL",
        tau: 60,
      },
      {
        target: "adrenaline",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 50,
        unit: "pg/mL",
        tau: 60,
      },
      // Prefrontal cortex enhancement (via alpha-2A)
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 3.0, // Modest PFC DA enhancement
        unit: "nM",
        tau: 90,
      },
      // Calming effect
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 2.0,
        unit: "µg/dL",
        tau: 90,
      },
      // Blood pressure lowering
      {
        target: "bloodPressure",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 5.0,
        unit: "mmHg",
        tau: 60,
      },
    ],
  }),

  // =============================================================================
  // PRESCRIPTION MEDICATIONS - ANTIDEPRESSANTS
  // =============================================================================

  /**
   * SERTRALINE (Zoloft)
   * SSRI with sigma-1 receptor activity.
   */
  Sertraline: (mg: number): PharmacologyDef => ({
    molecule: { name: "Sertraline", molarMass: 306.23, logP: 5.29 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.44,
      halfLifeMin: 1560, // ~26 hours
      timeToPeakMin: 360,
      clearance: { hepatic: { baseCL_mL_min: 450, CYP: "CYP2D6" } },
      volume: { kind: "weight", base_L_kg: 20 },
    },
    pd: [
      // Primary SERT inhibition
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 0.29,
        intrinsicEfficacy: mg * 0.4,
        unit: "nM",
      },
      // Downstream serotonin elevation
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.15,
        unit: "nM",
        tau: 240,
      },
      // Sigma-1 receptor agonism (anxiolytic)
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.1,
        unit: "nM",
        tau: 180,
      },
      // Minor DAT inhibition
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 25,
        intrinsicEfficacy: mg * 0.05,
        unit: "nM",
      },
    ],
  }),

  /**
   * FLUOXETINE (Prozac)
   * SSRI with long half-life and 5-HT2C antagonism.
   */
  Fluoxetine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Fluoxetine", molarMass: 309.33, logP: 4.05 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.72,
      halfLifeMin: 2880, // 1-3 days (norfluoxetine: 4-16 days)
      timeToPeakMin: 480,
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP2D6" } },
      volume: { kind: "weight", base_L_kg: 25 },
    },
    pd: [
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 0.81,
        intrinsicEfficacy: mg * 0.35,
        unit: "nM",
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.12,
        unit: "nM",
        tau: 360,
      },
      // 5-HT2C antagonism (mildly activating)
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.03,
        unit: "nM",
        tau: 240,
      },
      {
        target: "norepi",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.8,
        unit: "pg/mL",
        tau: 240,
      },
    ],
  }),

  /**
   * ESCITALOPRAM (Lexapro)
   * Highly selective SSRI.
   */
  Escitalopram: (mg: number): PharmacologyDef => ({
    molecule: { name: "Escitalopram", molarMass: 324.39, logP: 3.5 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.8,
      halfLifeMin: 1800, // ~27-32 hours
      timeToPeakMin: 300,
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP2C19" } },
      volume: { kind: "weight", base_L_kg: 12 },
    },
    pd: [
      // Most selective SERT inhibitor
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 1.1,
        intrinsicEfficacy: mg * 0.8, // Higher efficacy per mg
        unit: "nM",
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.25,
        unit: "nM",
        tau: 300,
      },
    ],
  }),

  /**
   * VENLAFAXINE (Effexor)
   * SNRI - dose-dependent NET effects.
   */
  Venlafaxine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Venlafaxine", molarMass: 277.4, logP: 2.74 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.45,
      halfLifeMin: 300, // ~5 hours (XR extends this)
      timeToPeakMin: 150,
      clearance: { hepatic: { baseCL_mL_min: 1350, CYP: "CYP2D6" } },
      volume: { kind: "weight", base_L_kg: 7.5 },
    },
    pd: [
      // SERT at all doses
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 82,
        intrinsicEfficacy: mg * 0.25,
        unit: "nM",
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.1,
        unit: "nM",
        tau: 120,
      },
      // NET at higher doses (>150mg)
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 2480,
        intrinsicEfficacy: Math.max(0, (mg - 75) * 0.1), // Kicks in >75mg
        unit: "nM",
      },
      {
        target: "norepi",
        mechanism: "agonist",
        intrinsicEfficacy: Math.max(0, (mg - 75) * 0.5),
        unit: "pg/mL",
        tau: 120,
      },
    ],
  }),

  /**
   * DULOXETINE (Cymbalta)
   * Balanced SNRI.
   */
  Duloxetine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Duloxetine", molarMass: 297.42, logP: 4.72 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.5,
      halfLifeMin: 720, // ~12 hours
      timeToPeakMin: 360,
      clearance: { hepatic: { baseCL_mL_min: 1000, CYP: "CYP1A2" } },
      volume: { kind: "weight", base_L_kg: 23 },
    },
    pd: [
      // Balanced SERT/NET
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 0.8,
        intrinsicEfficacy: mg * 0.4,
        unit: "nM",
      },
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 7.5,
        intrinsicEfficacy: mg * 0.35,
        unit: "nM",
      },
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.12,
        unit: "nM",
        tau: 180,
      },
      {
        target: "norepi",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.0,
        unit: "pg/mL",
        tau: 180,
      },
    ],
  }),

  /**
   * BUPROPION (Wellbutrin)
   * NDRI - no serotonin effects.
   */
  Bupropion: (mg: number): PharmacologyDef => ({
    molecule: { name: "Bupropion", molarMass: 239.74, logP: 3.21 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.87,
      halfLifeMin: 1260, // ~21 hours
      timeToPeakMin: 180,
      clearance: { hepatic: { baseCL_mL_min: 200, CYP: "CYP2B6" } },
      volume: { kind: "weight", base_L_kg: 20 },
    },
    pd: [
      // DAT inhibition (primary)
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 526,
        intrinsicEfficacy: mg * 0.15,
        unit: "nM",
      },
      // NET inhibition
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 2000,
        intrinsicEfficacy: mg * 0.1,
        unit: "nM",
      },
      // Downstream effects
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.05,
        unit: "nM",
        tau: 90,
      },
      {
        target: "norepi",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.3,
        unit: "pg/mL",
        tau: 90,
      },
      // nAChR antagonism (smoking cessation mechanism)
      {
        target: "acetylcholine",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.02,
        unit: "nM",
        tau: 120,
      },
    ],
  }),

  // =============================================================================
  // PRESCRIPTION MEDICATIONS - ANTI-ANXIETY
  // =============================================================================

  /**
   * ALPRAZOLAM (Xanax)
   * Fast-acting, short-duration benzodiazepine.
   */
  Alprazolam: (mg: number): PharmacologyDef => ({
    molecule: { name: "Alprazolam", molarMass: 308.77, logP: 2.12 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.9,
      halfLifeMin: 660, // ~11 hours
      timeToPeakMin: 60, // Fast onset
      clearance: { hepatic: { baseCL_mL_min: 75, CYP: "CYP3A4" } },
      volume: { kind: "weight", base_L_kg: 1.0 },
    },
    pd: [
      // GABA-A PAM (potent)
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 20,
        intrinsicEfficacy: mg * 80,
        unit: "nM",
      },
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 60,
        unit: "nM",
        tau: 15,
      },
      // Anxiolytic effects
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 8,
        unit: "µg/dL",
        tau: 30,
      },
      {
        target: "norepi",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 100,
        unit: "pg/mL",
        tau: 20,
      },
      // Sedation
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 20,
        unit: "pg/mL",
        tau: 30,
      },
      {
        target: "histamine",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 10,
        unit: "nM",
        tau: 30,
      },
    ],
  }),

  /**
   * LORAZEPAM (Ativan)
   * Medium-acting benzodiazepine.
   */
  Lorazepam: (mg: number): PharmacologyDef => ({
    molecule: { name: "Lorazepam", molarMass: 321.16, logP: 2.39 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.93,
      halfLifeMin: 720, // ~12 hours
      timeToPeakMin: 120,
      clearance: { hepatic: { baseCL_mL_min: 80 } }, // Glucuronidation, not CYP
      volume: { kind: "weight", base_L_kg: 1.3 },
    },
    pd: [
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 25,
        intrinsicEfficacy: mg * 70,
        unit: "nM",
      },
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 50,
        unit: "nM",
        tau: 30,
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 6,
        unit: "µg/dL",
        tau: 45,
      },
      {
        target: "norepi",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 80,
        unit: "pg/mL",
        tau: 30,
      },
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 15,
        unit: "pg/mL",
        tau: 45,
      },
    ],
  }),

  /**
   * CLONAZEPAM (Klonopin)
   * Long-acting benzodiazepine.
   */
  Clonazepam: (mg: number): PharmacologyDef => ({
    molecule: { name: "Clonazepam", molarMass: 315.71, logP: 2.41 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.9,
      halfLifeMin: 2160, // ~30-40 hours
      timeToPeakMin: 180,
      clearance: { hepatic: { baseCL_mL_min: 90, CYP: "CYP3A4" } },
      volume: { kind: "weight", base_L_kg: 3.2 },
    },
    pd: [
      {
        target: "GABA_A",
        mechanism: "PAM",
        EC50: 15,
        intrinsicEfficacy: mg * 100, // Very potent
        unit: "nM",
      },
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 80,
        unit: "nM",
        tau: 60,
      },
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 10,
        unit: "µg/dL",
        tau: 90,
      },
      {
        target: "norepi",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 120,
        unit: "pg/mL",
        tau: 60,
      },
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 25,
        unit: "pg/mL",
        tau: 90,
      },
    ],
  }),

  /**
   * BUSPIRONE (Buspar)
   * Azapirone anxiolytic - 5-HT1A partial agonist.
   */
  Buspirone: (mg: number): PharmacologyDef => ({
    molecule: { name: "Buspirone", molarMass: 385.5, logP: 1.74 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.04, // Very low (extensive first-pass)
      halfLifeMin: 150, // ~2-3 hours
      timeToPeakMin: 60,
      clearance: { hepatic: { baseCL_mL_min: 1700, CYP: "CYP3A4" } },
      volume: { kind: "weight", base_L_kg: 5.3 },
    },
    pd: [
      // 5-HT1A partial agonist (anxiolytic without sedation)
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.3,
        unit: "nM",
        tau: 30,
      },
      // Mild anxiolysis
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.5,
        unit: "µg/dL",
        tau: 60,
      },
      // Mild D2 antagonism
      {
        target: "dopamine",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.1,
        unit: "nM",
        tau: 45,
      },
      // No significant GABA effect (non-sedating)
    ],
  }),

  /**
   * HYDROXYZINE (Vistaril)
   * Antihistamine anxiolytic.
   */
  Hydroxyzine: (mg: number): PharmacologyDef => ({
    molecule: { name: "Hydroxyzine", molarMass: 374.91, logP: 2.36 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.8,
      halfLifeMin: 1200, // ~20 hours
      timeToPeakMin: 120,
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP3A4" } },
      volume: { kind: "weight", base_L_kg: 16 },
    },
    pd: [
      // H1 antagonism (primary)
      {
        target: "histamine",
        mechanism: "antagonist",
        Ki: 2,
        intrinsicEfficacy: mg * 0.8,
        unit: "nM",
        description: "Blocks histamine, the brain's main 'wake' signal. This is why it's so effective for both allergies and sleep.",
      },
      // Sedation via H1
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.3,
        unit: "pg/mL",
        tau: 60,
        description: "Indirectly lowers wakefulness peptides, helping quiet a racing mind and reduce physical agitation.",
      },
      // mAChR antagonism (anticholinergic)
      {
        target: "acetylcholine",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.15,
        unit: "nM",
        tau: 60,
        description: "Mildly reduces acetylcholine activity, which contributes to the 'fuzzy' or relaxed mental feeling.",
      },
      // 5-HT2A antagonism (anxiolytic)
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.05,
        unit: "nM",
        tau: 90,
        description: "Gently modulates serotonin pathways to help stabilize mood and reduce acute anxiety.",
      },
      // Mild anxiolysis
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.2,
        unit: "µg/dL",
        tau: 90,
        description: "Blunts the physical stress response, helping lower the body's 'panic' signals during high anxiety.",
      },
    ],
  }),

  // =============================================================================
  // ADDITIONAL SUPPLEMENTS
  // =============================================================================

  /**
   * INOSITOL
   * Second messenger modulator - GABA-A and serotonin receptor effects.
   */
  Inositol: (mg: number): PharmacologyDef => {
    // Typical dose: 500-18000mg (higher for anxiety/OCD)
    const gabaEffect = Math.min(30, mg * 0.002);
    const serotoninEffect = Math.min(10, mg * 0.0008);
    const insulinEffect = Math.min(3, mg * 0.0002);

    return {
      molecule: { name: "Inositol", molarMass: 180.16 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.9,
        halfLifeMin: 240,
        timeToPeakMin: 120,
        volume: { kind: "tbw", fraction: 0.6 },
      },
      pd: [
        // GABA-A modulation
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: gabaEffect,
          unit: "nM",
          tau: 90,
          description: "Supports the brain's natural calming system, making it easier to handle repetitive thoughts or worries.",
        },
        // Serotonin receptor sensitivity
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninEffect,
          unit: "nM",
          tau: 120,
          description: "Helps your serotonin receptors work more efficiently, which can improve mood stability over time.",
        },
        // Insulin signaling support
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: insulinEffect,
          unit: "µIU/mL",
          tau: 180,
          description: "Improves how your cells respond to insulin, supporting better blood sugar balance and hormone health.",
        },
        // Anxiolysis
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(3, mg * 0.0002),
          unit: "µg/dL",
          tau: 120,
          description: "Gently lowers the stress response, contributing to an overall sense of calm and better resilience.",
        },
      ],
    };
  },

  /**
   * ZINC
   * Essential mineral for immune, hormonal, and neurological function.
   */
  Zinc: (mg: number): PharmacologyDef => {
    // Typical dose: 15-50mg elemental zinc
    const zincSignalEffect = Math.min(25, mg * 0.8);
    const testosteroneEffect = Math.min(30, mg * 1.0);
    const nmdaEffect = Math.min(0.2, mg * 0.005);

    return {
      molecule: { name: "Zinc", molarMass: 65.38 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.3, // Varies by form
        halfLifeMin: 720,
        timeToPeakMin: 180,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Direct zinc signal elevation
        {
          target: "zinc",
          mechanism: "agonist",
          intrinsicEfficacy: zincSignalEffect,
          unit: "µg/dL",
          tau: 120,
          description: "Restores elemental zinc levels, which are critical for over 300 different enzymatic reactions in your body.",
        },
        // Testosterone support
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: testosteroneEffect,
          unit: "ng/dL",
          tau: 480,
          description: "Zinc is a foundational building block for male hormones. Supporting your levels helps maintain healthy testosterone production.",
        },
        // NMDA modulation
        {
          target: "NMDA",
          mechanism: "antagonist",
          intrinsicEfficacy: nmdaEffect,
          unit: "µM",
          tau: 120,
          description: "Acts as a natural brake on excitatory signals in the brain, helping protect neurons and support a steady mood.",
        },
        // Immune/inflammation modulation
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(0.15, mg * 0.004),
          unit: "index",
          tau: 360,
          description: "Powers the 'search and destroy' cells of your immune system while helping keep systemic inflammation in check.",
        },
      ],
    };
  },

  /**
   * COPPER
   * Essential mineral - usually paired with zinc.
   */
  Copper: (mg: number): PharmacologyDef => {
    // Typical dose: 1-2mg (often taken with zinc at 8:1 ratio)
    return {
      molecule: { name: "Copper", molarMass: 63.55 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.5,
        halfLifeMin: 1440,
        timeToPeakMin: 240,
        volume: { kind: "weight", base_L_kg: 0.1 },
      },
      pd: [
        // Direct copper signal
        {
          target: "copper",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(20, mg * 15),
          unit: "µg/dL",
          tau: 180,
          description: "Maintains copper status, which is vital for building connective tissue and keeping your nervous system healthy.",
        },
        // Iron metabolism support (ceruloplasmin)
        {
          target: "iron",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(10, mg * 5),
          unit: "µg/dL",
          tau: 360,
          description: "Works with iron to help your body form red blood cells and transport oxygen to your muscles and brain.",
        },
      ],
    };
  },

  /**
   * B-COMPLEX (B12 + Folate focus)
   * Methylation and energy metabolism support.
   */
  BComplex: (
    b12_mcg: number = 500,
    folate_mcg: number = 400,
  ): PharmacologyDef => {
    return {
      molecule: { name: "B-Complex", molarMass: 1355 }, // B12 MW
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.5, // Sublingual higher
        halfLifeMin: 1440,
        timeToPeakMin: 240,
        volume: { kind: "tbw", fraction: 0.5 },
      },
      pd: [
        // B12 signal elevation
        {
          target: "b12",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(200, b12_mcg * 0.2),
          unit: "pg/mL",
          tau: 360,
          description: "Essential for protecting your nerves and creating the DNA in every cell of your body.",
        },
        // Folate signal elevation
        {
          target: "folate",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(8, folate_mcg * 0.01),
          unit: "ng/mL",
          tau: 360,
          description: "Helps your body build new proteins and support the 'methylation' process that keeps your cells running smoothly.",
        },
        // Energy metabolism
        {
          target: "energy",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(0.1, (b12_mcg + folate_mcg) * 0.00005),
          unit: "index",
          tau: 240,
          description: "Acts as a spark plug for your mitochondria, helping your cells turn food into the energy you feel.",
        },
        // Homocysteine reduction → inflammation
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(0.1, (b12_mcg + folate_mcg) * 0.00005),
          unit: "index",
          tau: 720,
          description: "Helps clear metabolic byproducts like homocysteine, which can otherwise cause inflammation in your arteries.",
        },
      ],
    };
  },

  /**
   * CHROMIUM
   * Insulin sensitivity support.
   */
  Chromium: (mcg: number): PharmacologyDef => {
    // Typical dose: 200-1000mcg
    return {
      molecule: { name: "Chromium Picolinate", molarMass: 418.33 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.02, // Very low absorption
        halfLifeMin: 2880,
        timeToPeakMin: 120,
        volume: { kind: "weight", base_L_kg: 0.2 },
      },
      pd: [
        // Chromium status
        {
          target: "chromium",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(0.3, mcg * 0.0005),
          unit: "index",
          tau: 480,
          description: "Supports chromium levels, a trace mineral your body uses to move sugar from the blood into cells.",
        },
        // Insulin sensitivity
        {
          target: "insulin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, mcg * 0.005),
          unit: "µIU/mL",
          tau: 360,
          description: "Helps insulin work more effectively, making it easier for your body to manage blood sugar after meals.",
        },
        // Glucose handling
        {
          target: "glucose",
          mechanism: "antagonist",
          intrinsicEfficacy: Math.min(10, mcg * 0.015),
          unit: "mg/dL",
          tau: 360,
          description: "By improving insulin action, chromium helps lower and stabilize blood sugar levels.",
        },
      ],
    };
  },

  /**
   * RHODIOLA ROSEA
   * Adaptogen with MAO inhibition and cortisol modulation.
   */
  Rhodiola: (mg: number): PharmacologyDef => {
    // Typical dose: 200-600mg standardized extract
    const cortisolModulation = Math.min(6, mg * 0.012);
    const dopamineSupport = Math.min(8, mg * 0.015);
    const serotoninSupport = Math.min(5, mg * 0.01);

    return {
      molecule: { name: "Salidroside", molarMass: 300.3 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.3,
        halfLifeMin: 300,
        timeToPeakMin: 90,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Cortisol modulation (adaptogenic)
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: cortisolModulation,
          unit: "µg/dL",
          tau: 90,
          description: "This adaptogen helps 'balance' your cortisol levels, so you feel less frazzled during stressful times.",
        },
        // MAO-B inhibition → dopamine
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineSupport,
          unit: "nM",
          tau: 60,
          description: "Gently boosts dopamine availability, which can improve focus, motivation, and mental clarity.",
        },
        // Serotonin support
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninSupport,
          unit: "nM",
          tau: 90,
          description: "Supports serotonin levels to help stabilize your mood and improve emotional resilience.",
        },
        // AMPK activation (metabolic)
        {
          target: "ampk",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(0.15, mg * 0.0003),
          unit: "fold-change",
          tau: 120,
          description: "Activates your body's energy-sensing pathway, helping your cells burn fuel more efficiently.",
        },
        // Energy/alertness
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(5, mg * 0.01),
          unit: "pg/mL",
          tau: 60,
          description: "Nudges your 'wakefulness' signal, providing a steady sense of alertness without the jitters of caffeine.",
        },
      ],
    };
  },

  /**
   * CDP-CHOLINE (Citicoline)
   * Choline source and phospholipid precursor.
   */
  CDPCholine: (mg: number): PharmacologyDef => {
    // Typical dose: 250-500mg
    const cholineEffect = Math.min(8, mg * 0.02);
    const achEffect = Math.min(20, mg * 0.05);
    const dopamineSupport = Math.min(5, mg * 0.012);

    return {
      molecule: { name: "Citicoline", molarMass: 488.32 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.9,
        halfLifeMin: 360,
        timeToPeakMin: 60,
        volume: { kind: "tbw", fraction: 0.5 },
      },
      pd: [
        // Choline signal
        {
          target: "choline",
          mechanism: "agonist",
          intrinsicEfficacy: cholineEffect,
          unit: "µmol/L",
          tau: 60,
          description: "Restores your pool of choline, the raw material for keeping your brain's communication fast and clear.",
        },
        // Acetylcholine synthesis
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: achEffect,
          unit: "nM",
          tau: 45,
          description: "Boosts acetylcholine, the primary 'learning chemical' your brain uses for memory and focus.",
        },
        // Dopamine receptor density support
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: dopamineSupport,
          unit: "nM",
          tau: 120,
          description: "May help keep your dopamine receptors healthy and responsive, supporting long-term motivation.",
        },
        // Focus/alertness
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, mg * 0.008),
          unit: "pg/mL",
          tau: 45,
          description: "Supports wakefulness and cognitive drive by nudge-activating your brain's alertness signals.",
        },
      ],
    };
  },

  /**
   * L-CARNITINE (ALCAR)
   * Mitochondrial energy transport and cognitive support.
   */
  LCarnitine: (mg: number): PharmacologyDef => {
    // Typical dose: 500-2000mg
    const energyEffect = Math.min(0.15, mg * 0.0001);
    const bdnfEffect = Math.min(8, mg * 0.005);
    const achEffect = Math.min(10, mg * 0.006);

    return {
      molecule: { name: "Acetyl-L-Carnitine", molarMass: 203.24 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.15, // Low oral bioavailability
        halfLifeMin: 240,
        timeToPeakMin: 180,
        volume: { kind: "weight", base_L_kg: 0.5 },
      },
      pd: [
        // Mitochondrial energy
        {
          target: "energy",
          mechanism: "agonist",
          intrinsicEfficacy: energyEffect,
          unit: "index",
          tau: 120,
          description: "Helps shuttle fatty acids into your mitochondria, giving your brain and body more fuel to work with.",
        },
        // BDNF support
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: bdnfEffect,
          unit: "ng/mL",
          tau: 240,
          description: "Gently supports the production of 'brain fertilizer,' which helps maintain and protect your neurons.",
        },
        // Acetylcholine enhancement
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: achEffect,
          unit: "nM",
          tau: 120,
          description: "Supports clear thinking and mental speed by providing resources for your brain's primary messaging chemical.",
        },
        // Mild dopamine support
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: Math.min(3, mg * 0.002),
          unit: "nM",
          tau: 180,
          description: "Subtly assists dopamine signaling, which can help maintain a steady sense of drive throughout the day.",
        },
      ],
    };
  },

  /**
   * DIGESTIVE ENZYMES
   * Enhanced nutrient absorption and gut support.
   */
  DigestiveEnzymes: (units: number = 1): PharmacologyDef => {
    // units = number of capsules/servings
    return {
      molecule: { name: "Digestive Enzymes", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        // Enhanced nutrient absorption → GLP-1
        {
          target: "glp1",
          mechanism: "agonist",
          intrinsicEfficacy: units * 3,
          unit: "pmol/L",
          tau: 30,
          description: "Breaking down food more efficiently can boost 'fullness' signals, helping you feel satisfied with your meal.",
        },
        // Reduced gut inflammation
        {
          target: "inflammation",
          mechanism: "antagonist",
          intrinsicEfficacy: units * 0.1,
          unit: "index",
          tau: 90,
          description: "By preventing large, undigested food particles from irritating your gut, these enzymes help lower localized inflammation.",
        },
        // Vagal tone support (gut-brain axis)
        {
          target: "vagal",
          mechanism: "agonist",
          intrinsicEfficacy: units * 0.1,
          unit: "index",
          tau: 60,
          description: "Smoother digestion keeps your 'gut-to-brain' nerve pathway calm and responsive.",
        },
        // Better satiety signaling
        {
          target: "ghrelin",
          mechanism: "antagonist",
          intrinsicEfficacy: units * 15,
          unit: "pg/mL",
          tau: 45,
          description: "Helps turn off 'hunger' hormones more quickly as your body registers that food is being effectively processed.",
        },
      ],
    };
  },

  // =============================================================================
  // PSYCHEDELICS & RELATED COMPOUNDS
  // =============================================================================

  /**
   * MDMA (3,4-Methylenedioxymethamphetamine)
   * Entactogen/empathogen with potent serotonin-releasing effects.
   *
   * Pharmacology:
   * - Primary mechanism: SERT reversal → massive serotonin release
   * - Secondary: DAT and NET reversal → dopamine and norepinephrine release
   * - Oxytocin release (prosocial effects)
   * - 5-HT2A agonism (mild psychedelic component)
   * - Cortisol/stress hormone elevation
   * - Hyperthermia risk (thermoregulation disruption)
   *
   * PK: Well absorbed orally, CYP2D6 metabolism, 8-9 hour half-life
   */
  MDMA: (mg: number): PharmacologyDef => ({
    molecule: { name: "MDMA", molarMass: 193.25, logP: 2.28 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.75,
      halfLifeMin: 510, // ~8.5 hours
      timeToPeakMin: 120, // 1.5-2 hours
      clearance: { hepatic: { baseCL_mL_min: 600, CYP: "CYP2D6" } },
      volume: { kind: "weight", base_L_kg: 5.0 },
    },
    pd: [
      // Massive SERT reversal - serotonin release (primary mechanism)
      {
        target: "SERT",
        mechanism: "antagonist",
        Ki: 610,
        intrinsicEfficacy: mg * 8.0, // Very potent SERT effect
        unit: "nM",
        description:
          "MDMA reverses the serotonin transporter, causing a massive flood of serotonin into synapses—this drives the intense emotional warmth and empathy.",
      },
      // Direct serotonin elevation
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 12.0,
        unit: "nM",
        tau: 30,
        description:
          "Serotonin levels surge dramatically, creating feelings of emotional openness, love, and connectedness that define the MDMA experience.",
      },
      // DAT reversal - dopamine release (secondary)
      {
        target: "DAT",
        mechanism: "antagonist",
        Ki: 1500,
        intrinsicEfficacy: mg * 2.5,
        unit: "nM",
        description:
          "Dopamine release contributes to the euphoria and stimulation, though this is secondary to serotonin effects.",
      },
      // Dopamine elevation
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 3.0,
        unit: "nM",
        tau: 25,
        description:
          "Elevated dopamine creates reward sensations and motivational energy, adding to the pleasurable experience.",
      },
      // NET reversal - norepinephrine release
      {
        target: "NET",
        mechanism: "antagonist",
        Ki: 380,
        intrinsicEfficacy: mg * 3.5,
        unit: "nM",
        description:
          "Norepinephrine release drives stimulant effects: increased heart rate, alertness, and physical energy.",
      },
      // Norepinephrine elevation
      {
        target: "norepi",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 4.0,
        unit: "pg/mL",
        tau: 20,
        description:
          "Elevated norepinephrine causes the 'speedy' component—increased heart rate, wakefulness, and arousal.",
      },
      // Oxytocin release - social bonding
      {
        target: "oxytocin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.5,
        unit: "pg/mL",
        tau: 40,
        description:
          "MDMA triggers oxytocin release, the 'bonding hormone,' creating deep feelings of trust and emotional intimacy.",
      },
      // 5-HT2A agonism (mild psychedelic component)
      {
        target: "5HT2A",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.3,
        Ki: 5100,
        unit: "nM",
        description:
          "Mild 5-HT2A activation contributes to sensory enhancement—colors seem brighter, music more moving.",
      },
      // Cortisol elevation (stress response)
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.15,
        unit: "µg/dL",
        tau: 60,
        description:
          "Cortisol rises as part of the physiological stress response, contributing to alertness but also to the 'comedown.'",
      },
      // Adrenaline release
      {
        target: "adrenaline",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 5.0,
        unit: "pg/mL",
        tau: 30,
        description:
          "Adrenaline release causes physical stimulation—dilated pupils, increased body temperature, and energized feeling.",
      },
      // Prolactin elevation (post-peak)
      {
        target: "prolactin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.3,
        unit: "ng/mL",
        tau: 180,
        description:
          "Prolactin rises after the peak, contributing to the 'loved up' feeling but also to subsequent low mood during comedown.",
      },
      // Body temperature elevation (thermogenesis)
      {
        target: "temperature",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.012,
        unit: "index",
        tau: 45,
        description:
          "MDMA impairs thermoregulation—body temperature rises, which is why staying cool and hydrated is critical.",
      },
    ],
  }),

  /**
   * LSD (Lysergic acid diethylamide)
   * Classic serotonergic psychedelic with extremely high 5-HT2A affinity.
   *
   * Pharmacology:
   * - Primary: 5-HT2A agonism (visual/cognitive effects)
   * - Secondary: 5-HT2C, 5-HT1A agonism
   * - Dopamine D1/D2 receptor activity
   * - Very high potency (microgram doses)
   * - Long duration due to receptor residence time
   *
   * PK: Rapid absorption, hepatic metabolism, 3-5 hour half-life
   * but effects last 8-12 hours due to prolonged receptor binding
   */
  LSD: (mcg: number): PharmacologyDef => {
    // LSD is dosed in micrograms; convert to mg-equivalent for calculations
    const mgEquiv = mcg / 1000;

    return {
      molecule: { name: "LSD", molarMass: 323.43, logP: 2.95 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.71, // High oral bioavailability
        halfLifeMin: 210, // ~3.5 hours but effects much longer
        timeToPeakMin: 90, // 1-2 hours
        clearance: { hepatic: { baseCL_mL_min: 650, CYP: "CYP3A4" } },
        volume: { kind: "weight", base_L_kg: 0.55 },
      },
      pd: [
        // 5-HT2A agonism - PRIMARY mechanism (psychedelic effects)
        {
          target: "5HT2A",
          mechanism: "agonist",
          Ki: 1.1, // Extremely high affinity (Ki ~1 nM)
          intrinsicEfficacy: mcg * 0.8, // Scaled for microgram dosing
          unit: "nM",
          tau: 480, // Prolonged due to receptor residence time
          description:
            "LSD binds tightly to 5-HT2A receptors and stays there—this drives the visual distortions, altered thinking, and profound shifts in perception.",
        },
        // 5-HT2C agonism (anxiety/cardiovascular)
        {
          target: "5HT2C",
          mechanism: "agonist",
          Ki: 23,
          intrinsicEfficacy: mcg * 0.4,
          unit: "nM",
          tau: 360,
          description:
            "5-HT2C activation can cause anxiety or restlessness, especially during the come-up. It also suppresses appetite.",
        },
        // 5-HT1A partial agonism (calming/mood)
        {
          target: "5HT1A",
          mechanism: "agonist",
          Ki: 54,
          intrinsicEfficacy: mcg * 0.25,
          unit: "nM",
          tau: 300,
          description:
            "5-HT1A activity provides an anxiolytic counterbalance, contributing to peaceful or mystical experiences.",
        },
        // Dopamine D2 agonism (stimulation, euphoria)
        {
          target: "D2",
          mechanism: "agonist",
          Ki: 420,
          intrinsicEfficacy: mcg * 0.15,
          unit: "nM",
          tau: 240,
          description:
            "Dopamine receptor activation adds stimulation and can contribute to euphoric or grandiose thinking.",
        },
        // Dopamine D1 agonism (cognition)
        {
          target: "D1",
          mechanism: "agonist",
          Ki: 960,
          intrinsicEfficacy: mcg * 0.1,
          unit: "nM",
          tau: 240,
          description:
            "D1 activation may enhance cognitive flexibility—the ability to see things from new perspectives.",
        },
        // Glutamate modulation (neuroplasticity)
        {
          target: "glutamate",
          mechanism: "agonist",
          intrinsicEfficacy: mcg * 0.3,
          unit: "µM",
          tau: 300,
          description:
            "LSD increases glutamate signaling in the prefrontal cortex, potentially driving neuroplastic changes and insights.",
        },
        // BDNF upregulation (neuroplasticity)
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: mcg * 0.02,
          unit: "ng/mL",
          tau: 720,
          description:
            "Psychedelics promote BDNF release, which supports neural growth and may underlie lasting therapeutic benefits.",
        },
        // Cortisol elevation (stress response)
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: mcg * 0.03,
          unit: "µg/dL",
          tau: 120,
          description:
            "Cortisol rises during the experience, reflecting the psychological intensity—this normalizes as effects subside.",
        },
        // Norepinephrine elevation (arousal)
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: mcg * 0.5,
          unit: "pg/mL",
          tau: 180,
          description:
            "Mild sympathetic activation causes dilated pupils, slight increase in heart rate, and heightened alertness.",
        },
      ],
    };
  },

  /**
   * PSILOCYBIN (4-phosphoryloxy-N,N-dimethyltryptamine)
   * Prodrug converted to psilocin; classic serotonergic psychedelic.
   *
   * Pharmacology:
   * - Dephosphorylated to psilocin (active metabolite) in gut/liver
   * - Primary: 5-HT2A agonism (psychedelic effects)
   * - Secondary: 5-HT2C, 5-HT1A agonism
   * - Shorter duration than LSD (4-6 hours)
   *
   * PK: Rapid conversion to psilocin, 2-3 hour half-life
   * Note: mg refers to psilocybin content, not dried mushroom weight
   * (dried mushrooms typically contain 0.5-2% psilocybin by weight)
   */
  Psilocybin: (mg: number): PharmacologyDef => ({
    molecule: { name: "Psilocybin", molarMass: 284.25, logP: -0.19 },
    pk: {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.52, // After first-pass conversion to psilocin
      halfLifeMin: 165, // ~2.75 hours (psilocin)
      timeToPeakMin: 80, // 1-1.5 hours
      clearance: {
        hepatic: { baseCL_mL_min: 1200, CYP: "CYP2D6" },
      },
      volume: { kind: "weight", base_L_kg: 3.0 },
    },
    pd: [
      // 5-HT2A agonism - PRIMARY mechanism
      {
        target: "5HT2A",
        mechanism: "agonist",
        Ki: 6.0, // High affinity
        intrinsicEfficacy: mg * 8.0,
        unit: "nM",
        tau: 240,
        description:
          "Psilocin (the active form) binds 5-HT2A receptors, dissolving default brain patterns and creating visual/perceptual shifts.",
      },
      // 5-HT2C agonism
      {
        target: "5HT2C",
        mechanism: "agonist",
        Ki: 18,
        intrinsicEfficacy: mg * 4.5,
        unit: "nM",
        tau: 200,
        description:
          "5-HT2C activation contributes to body load, nausea (early), and emotional amplification.",
      },
      // 5-HT1A agonism (calming, anti-anxiety)
      {
        target: "5HT1A",
        mechanism: "agonist",
        Ki: 49,
        intrinsicEfficacy: mg * 3.0,
        unit: "nM",
        tau: 180,
        description:
          "5-HT1A activity provides emotional warmth and can reduce anxiety, contributing to peaceful experiences.",
      },
      // 5-HT2B agonism (noted for cardiac consideration)
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 2.5,
        unit: "nM",
        tau: 150,
        description:
          "Overall serotonin signaling increases, affecting mood, perception, and bodily sensations.",
      },
      // Glutamate release (cortical)
      {
        target: "glutamate",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.6,
        unit: "µM",
        tau: 120,
        description:
          "Increased glutamate in prefrontal regions supports cognitive flexibility and may enable therapeutic insights.",
      },
      // BDNF upregulation
      {
        target: "bdnf",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.25,
        unit: "ng/mL",
        tau: 480,
        description:
          "Psilocybin promotes BDNF expression, supporting neuroplasticity—this may underlie lasting mood improvements.",
      },
      // Dopamine modulation (indirect)
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.8,
        unit: "nM",
        tau: 120,
        description:
          "Indirect dopamine elevation contributes to the meaningful, significant quality of experiences.",
      },
      // Cortisol (mild stress response)
      {
        target: "cortisol",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.08,
        unit: "µg/dL",
        tau: 90,
        description:
          "Mild cortisol elevation reflects the psychological intensity but is less pronounced than with stimulants.",
      },
    ],
  }),

  /**
   * KETAMINE
   * Dissociative anesthetic with rapid-acting antidepressant properties.
   *
   * Pharmacology:
   * - Primary: NMDA receptor antagonism (dissociation, analgesia)
   * - Secondary: D2 receptor agonism, opioid receptor activity
   * - AMPA receptor potentiation (downstream)
   * - Rapid BDNF/synaptogenesis (antidepressant effect)
   *
   * PK: Variable by route; intranasal/sublingual common for therapy
   * Half-life ~2.5-3 hours; effects 45-90 min
   */
  Ketamine: (
    mg: number,
    route: "intranasal" | "sublingual" | "iv" | "im" = "intranasal",
  ): PharmacologyDef => {
    // Bioavailability varies significantly by route
    const routeParams = {
      intranasal: { bioavail: 0.45, tPeak: 20, halfLife: 150 },
      sublingual: { bioavail: 0.3, tPeak: 30, halfLife: 155 },
      iv: { bioavail: 1.0, tPeak: 5, halfLife: 150 },
      im: { bioavail: 0.93, tPeak: 15, halfLife: 155 },
    };
    const params = routeParams[route];

    return {
      molecule: { name: "Ketamine", molarMass: 237.73, logP: 3.12 },
      pk: {
        model: "1-compartment",
        delivery: route === "iv" ? "infusion" : "bolus",
        bioavailability: params.bioavail,
        halfLifeMin: params.halfLife,
        timeToPeakMin: params.tPeak,
        clearance: {
          hepatic: { baseCL_mL_min: 1100, CYP: "CYP3A4" },
        },
        volume: { kind: "weight", base_L_kg: 3.0 },
      },
      pd: [
        // NMDA antagonism - PRIMARY mechanism
        {
          target: "NMDA",
          mechanism: "antagonist",
          Ki: 500, // Non-competitive antagonist
          intrinsicEfficacy: mg * 0.004, // Scaled for µM
          unit: "µM",
          tau: 60,
          description:
            "NMDA blockade causes dissociation—a dreamlike detachment from body and surroundings. Also provides profound pain relief.",
        },
        // Glutamate surge (paradoxical - drives AMPA)
        {
          target: "glutamate",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 0.08,
          unit: "µM",
          tau: 30,
          description:
            "NMDA blockade paradoxically increases glutamate release, activating AMPA receptors and triggering neuroplastic cascades.",
        },
        // AMPA potentiation (downstream antidepressant)
        {
          target: "AMPA",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 0.05,
          unit: "µM",
          tau: 45,
          description:
            "Enhanced AMPA signaling drives rapid synapse formation—this is thought to underlie ketamine's fast antidepressant action.",
        },
        // BDNF upregulation (synaptogenesis)
        {
          target: "bdnf",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 0.15,
          unit: "ng/mL",
          tau: 180,
          description:
            "Ketamine rapidly increases BDNF, promoting new synaptic connections within hours—unlike traditional antidepressants that take weeks.",
        },
        // D2 receptor agonism
        {
          target: "D2",
          mechanism: "agonist",
          Ki: 4800,
          intrinsicEfficacy: mg * 0.8,
          unit: "nM",
          tau: 50,
          description:
            "Dopamine receptor activity contributes to mood elevation and the rewarding aspects of the experience.",
        },
        // Dopamine elevation
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 1.2,
          unit: "nM",
          tau: 40,
          description:
            "Increased dopamine signaling adds to mood improvement and may contribute to abuse potential.",
        },
        // Mu-opioid receptor activity (analgesia)
        {
          target: "endorphin",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 0.3,
          unit: "nM",
          tau: 45,
          description:
            "Opioid receptor activity provides additional pain relief and contributes to the warm, floaty feeling.",
        },
        // Norepinephrine elevation (sympathomimetic)
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 1.5,
          unit: "pg/mL",
          tau: 30,
          description:
            "Sympathetic activation increases heart rate and blood pressure—monitoring is important at higher doses.",
        },
        // GABA modulation
        {
          target: "gaba",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 0.4,
          unit: "nM",
          tau: 50,
          description:
            "Mild GABAergic effects contribute to anxiolysis and the sedated, dreamy quality.",
        },
        // Cortisol (mild elevation)
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 0.03,
          unit: "µg/dL",
          tau: 60,
          description:
            "Modest stress hormone elevation occurs during the experience but normalizes quickly.",
        },
      ],
    };
  },

  /**
   * THC - INHALED (Delta-9-Tetrahydrocannabinol)
   * Primary psychoactive compound in cannabis, inhaled route.
   *
   * Pharmacology:
   * - Primary: CB1 receptor agonism (CNS effects)
   * - Secondary: CB2 receptor agonism (immune/peripheral)
   * - GPR55 agonism, TRPV1 modulation
   * - Complex effects on dopamine, GABA, glutamate
   *
   * PK (Inhaled): Rapid absorption through lungs
   * - Peak: 5-10 minutes
   * - Duration: 2-4 hours acute effects
   * - Half-life: 20-30 hours (due to lipophilicity/redistribution)
   */
  THCInhaled: (mg: number): PharmacologyDef => ({
    molecule: { name: "THC (inhaled)", molarMass: 314.47, logP: 6.97 },
    pk: {
      model: "2-compartment", // High lipophilicity = redistribution
      delivery: "bolus",
      bioavailability: 0.25, // 10-35% typical for smoking
      halfLifeMin: 120, // Effective half-life for acute effects
      timeToPeakMin: 8, // Very rapid via lungs
      clearance: {
        hepatic: { baseCL_mL_min: 950, CYP: "CYP2C9" },
      },
      volume: { kind: "weight", base_L_kg: 3.4 },
    },
    pd: [
      // CB1 agonism - PRIMARY mechanism (CNS effects)
      {
        target: "CB1",
        mechanism: "agonist",
        Ki: 10, // High affinity
        intrinsicEfficacy: mg * 12.0,
        unit: "nM",
        tau: 90,
        description:
          "CB1 activation in the brain creates the 'high'—altered perception, relaxation, euphoria, and changes in time perception.",
      },
      // CB2 agonism (peripheral/immune)
      {
        target: "CB2",
        mechanism: "agonist",
        Ki: 24,
        intrinsicEfficacy: mg * 5.0,
        unit: "nM",
        tau: 120,
        description:
          "CB2 receptors in the immune system may reduce inflammation and contribute to body relaxation.",
      },
      // Dopamine release (reward, motivation)
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 2.0,
        unit: "nM",
        tau: 45,
        description:
          "THC increases dopamine in reward circuits, creating pleasurable feelings—this underlies both enjoyment and dependence risk.",
      },
      // GABA modulation (relaxation)
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.5,
        unit: "nM",
        tau: 60,
        description:
          "Enhanced GABA signaling contributes to relaxation, reduced anxiety (at low doses), and sedation.",
      },
      // Glutamate inhibition
      {
        target: "glutamate",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.4,
        unit: "µM",
        tau: 60,
        description:
          "Reduced glutamate release impairs short-term memory and can cause the 'foggy' thinking characteristic of being high.",
      },
      // Serotonin modulation
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.8,
        unit: "nM",
        tau: 75,
        description:
          "Serotonin effects contribute to mood changes—elevating mood for some, but potentially increasing anxiety in others.",
      },
      // Appetite stimulation (munchies)
      {
        target: "ghrelin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 8.0,
        unit: "pg/mL",
        tau: 45,
        description:
          "CB1 activation in the hypothalamus triggers intense hunger—the classic 'munchies' effect.",
      },
      // Orexin modulation (sedation/appetite)
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 2.0,
        unit: "pg/mL",
        tau: 90,
        description:
          "Reduced orexin signaling contributes to drowsiness and the couch-lock effect of many strains.",
      },
      // Heart rate increase (acute)
      {
        target: "adrenaline",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.5,
        unit: "pg/mL",
        tau: 30,
        description:
          "Acute sympathetic activation increases heart rate—this is why heart pounding can occur, especially for new users.",
      },
      // Cortisol modulation (biphasic)
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.05,
        unit: "µg/dL",
        tau: 120,
        description:
          "Cannabis tends to reduce stress hormones, contributing to relaxation—though this effect varies by individual.",
      },
      // Anandamide potentiation (endocannabinoid)
      {
        target: "anandamide",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.3,
        unit: "nM",
        tau: 90,
        description:
          "THC mimics and enhances the body's natural cannabinoid, anandamide—named after the Sanskrit word for 'bliss.'",
      },
    ],
  }),

  /**
   * THC - ORAL/EDIBLE (Delta-9-Tetrahydrocannabinol)
   * Cannabis consumed orally with hepatic first-pass metabolism.
   *
   * Key differences from inhaled:
   * - Slower onset (1-3 hours vs minutes)
   * - Longer duration (6-8+ hours vs 2-4 hours)
   * - First-pass creates 11-OH-THC (more potent, more psychoactive)
   * - More intense, less controllable experience
   * - Lower bioavailability but higher peak intensity
   */
  THCOral: (mg: number): PharmacologyDef => ({
    molecule: { name: "THC (oral)", molarMass: 314.47, logP: 6.97 },
    pk: {
      model: "2-compartment",
      delivery: "bolus",
      bioavailability: 0.08, // 4-12% oral; but 11-OH-THC more potent
      halfLifeMin: 300, // Longer effective duration
      timeToPeakMin: 120, // 1-3 hours (highly variable)
      clearance: {
        hepatic: { baseCL_mL_min: 950, CYP: "CYP2C9" },
      },
      volume: { kind: "weight", base_L_kg: 3.4 },
    },
    pd: [
      // CB1 agonism - enhanced by 11-OH-THC
      {
        target: "CB1",
        mechanism: "agonist",
        Ki: 5, // 11-OH-THC has higher affinity
        intrinsicEfficacy: mg * 18.0, // More potent due to metabolite
        unit: "nM",
        tau: 240, // Much longer duration
        description:
          "Oral THC is converted to 11-OH-THC in the liver—this metabolite crosses the blood-brain barrier more easily and is more potent, leading to stronger effects.",
      },
      // CB2 agonism
      {
        target: "CB2",
        mechanism: "agonist",
        Ki: 20,
        intrinsicEfficacy: mg * 7.0,
        unit: "nM",
        tau: 300,
        description:
          "Prolonged CB2 activation provides extended anti-inflammatory and body-relaxing effects.",
      },
      // Dopamine (more sustained)
      {
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 2.5,
        unit: "nM",
        tau: 180,
        description:
          "Dopamine elevation is more gradual but longer-lasting, contributing to extended euphoria or dysphoria.",
      },
      // GABA (stronger sedation)
      {
        target: "gaba",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 2.5,
        unit: "nM",
        tau: 180,
        description:
          "Enhanced GABA effects create stronger sedation—edibles are known for being more 'body heavy.'",
      },
      // Glutamate inhibition (more pronounced)
      {
        target: "glutamate",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.7,
        unit: "µM",
        tau: 180,
        description:
          "Stronger glutamate suppression causes more pronounced cognitive impairment and memory disruption.",
      },
      // Serotonin modulation
      {
        target: "serotonin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.2,
        unit: "nM",
        tau: 180,
        description:
          "Prolonged serotonin effects can intensify emotional experiences—both positive and negative.",
      },
      // Appetite stimulation (prolonged)
      {
        target: "ghrelin",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 12.0,
        unit: "pg/mL",
        tau: 180,
        description:
          "Extended appetite stimulation—the munchies can persist for hours with edibles.",
      },
      // Orexin suppression (stronger sedation)
      {
        target: "orexin",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 4.0,
        unit: "pg/mL",
        tau: 240,
        description:
          "Pronounced orexin suppression creates strong sedation—falling asleep is common with edibles.",
      },
      // Heart rate (more gradual)
      {
        target: "adrenaline",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 1.0,
        unit: "pg/mL",
        tau: 90,
        description:
          "Heart rate increases more gradually than smoking but can persist longer, occasionally causing anxiety.",
      },
      // Cortisol (stress reduction)
      {
        target: "cortisol",
        mechanism: "antagonist",
        intrinsicEfficacy: mg * 0.08,
        unit: "µg/dL",
        tau: 240,
        description:
          "Extended stress hormone suppression contributes to deep relaxation or, if too intense, feeling 'stuck.'",
      },
      // Anandamide potentiation
      {
        target: "anandamide",
        mechanism: "agonist",
        intrinsicEfficacy: mg * 0.5,
        unit: "nM",
        tau: 240,
        description:
          "Prolonged enhancement of the endocannabinoid system creates the extended, often intense edible experience.",
      },
    ],
  }),

  // =============================================================================
  // NEW LIFESTYLE & SUBSTANCE AGENTS
  // =============================================================================

  /**
   * SUNLIGHT VIEWING
   * Circadian entrainment and mood support.
   */
  SunlightExposure: (
    lux: number, // 10000+ for direct sun
    timeOfDay: "sunrise" | "midday" | "sunset" = "midday"
  ): PharmacologyDef => {
    // Intensity factor (logarithmic scale approx)
    const intensity = Math.min(1.5, Math.log10(lux + 1) / 4);

    let melatoninSuppression = 0;
    let cortisolPulse = 0;
    let serotoninBoost = 0;

    if (timeOfDay === "sunrise") {
      melatoninSuppression = 100 * intensity; // Morning light clears melatonin
      cortisolPulse = 15 * intensity; // Healthy CAR (Cortisol Awakening Response)
      serotoninBoost = 20 * intensity;
    } else if (timeOfDay === "midday") {
      melatoninSuppression = 50 * intensity;
      serotoninBoost = 30 * intensity; // Mood boost
    } else if (timeOfDay === "sunset") {
      // Sunset light (low blue, high red) protects melatonin
      melatoninSuppression = 0;
      serotoninBoost = 10 * intensity;
    }

    return {
      molecule: { name: "Photons", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "melatonin",
          mechanism: "antagonist",
          intrinsicEfficacy: melatoninSuppression,
          unit: "pg/mL",
          tau: 5,
          description: "Bright light hits the retina and tells the SCN to shut down melatonin production, waking you up.",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: cortisolPulse,
          unit: "µg/dL",
          tau: 15,
          description: "Morning sunlight triggers a healthy Cortisol Awakening Response, setting your circadian rhythm for the day.",
        },
        {
          target: "serotonin",
          mechanism: "agonist",
          intrinsicEfficacy: serotoninBoost,
          unit: "nM",
          tau: 10,
          description: "Bright light stimulates serotonin production, improving mood and focus.",
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: 5 * intensity,
          unit: "nM",
          tau: 10,
          description: "Sunlight triggers mild dopamine release, contributing to motivation and well-being.",
        },
      ],
    };
  },

  /**
   * NICOTINE
   * nAChR agonist with complex delivery kinetics.
   */
  Nicotine: (
    mg: number,
    delivery: "smoked" | "vaped" | "gum" | "patch" | "pouch"
  ): PharmacologyDef => {
    // Delivery determines PK
    let pkModel: any = {
      model: "1-compartment",
      delivery: "bolus",
      bioavailability: 0.0,
      halfLifeMin: 120,
      timeToPeakMin: 0,
      volume: { kind: "weight", base_L_kg: 2.6 },
    };

    switch (delivery) {
      case "smoked": // Fastest, highest spike
        pkModel.bioavailability = 0.8;
        pkModel.timeToPeakMin = 2; // Near instant
        break;
      case "vaped":
        pkModel.bioavailability = 0.6;
        pkModel.timeToPeakMin = 5;
        break;
      case "gum": // Slower, lower bio
        pkModel.bioavailability = 0.5;
        pkModel.timeToPeakMin = 30;
        break;
      case "pouch": // Buccal
        pkModel.bioavailability = 0.6;
        pkModel.timeToPeakMin = 20;
        break;
      case "patch": // Continuous
        pkModel.delivery = "infusion";
        pkModel.bioavailability = 0.7;
        pkModel.timeToPeakMin = 120;
        break;
    }

    return {
      molecule: { name: "Nicotine", molarMass: 162.23 },
      pk: pkModel,
      pd: [
        {
          target: "acetylcholine",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 15.0, // Mimics ACh
          unit: "nM",
          tau: 10,
          description: "Nicotine binds directly to acetylcholine receptors, sharpening focus and attention.",
        },
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 5.0,
          unit: "nM",
          tau: 15,
          description: "Triggers dopamine release in reward circuits—this drives the pleasure and addiction potential.",
        },
        {
          target: "norepi",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 8.0,
          unit: "pg/mL",
          tau: 15,
          description: "Stimulates the sympathetic nervous system, increasing alertness and heart rate.",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: mg * 1.5,
          unit: "µg/dL",
          tau: 20,
          description: "Causes a stress hormone spike, which feels like 'energy' but depletes reserves over time.",
        },
        {
          target: "endorphin", // Mild opioid effect
          mechanism: "agonist",
          intrinsicEfficacy: mg * 2.0,
          unit: "nM",
          tau: 15,
          description: "Release of beta-endorphins contributes to the mild anxiety relief and calming effect.",
        },
      ],
    };
  },

  /**
   * ELECTROLYTES
   * Sodium, Potassium, Magnesium balance.
   */
  Electrolytes: (
    sodium_mg: number,
    potassium_mg: number,
    magnesium_mg: number
  ): PharmacologyDef => {
    return {
      molecule: { name: "Electrolytes", molarMass: 0 },
      pk: {
        model: "1-compartment",
        delivery: "bolus",
        bioavailability: 0.9,
        halfLifeMin: 240,
        timeToPeakMin: 45,
        volume: { kind: "tbw", fraction: 1.0 },
      },
      pd: [
        // Hydration/Blood Pressure (Sodium)
        {
          target: "bloodPressure",
          mechanism: "agonist",
          intrinsicEfficacy: sodium_mg * 0.005,
          unit: "mmHg",
          tau: 60,
          description: "Sodium helps retain fluid volume, supporting blood pressure and hydration.",
        },
        // Energy/Nerve function (Sodium/Potassium pump)
        {
          target: "energy",
          mechanism: "agonist",
          intrinsicEfficacy: (sodium_mg + potassium_mg) * 0.002,
          unit: "index",
          tau: 60,
          description: "Proper electrolyte balance allows your nerves to fire efficiently, reducing fatigue.",
        },
        // Relaxation (Magnesium/Potassium)
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: (magnesium_mg * 0.01 + potassium_mg * 0.001),
          unit: "µg/dL",
          tau: 90,
          description: "Magnesium and potassium help relax the nervous system and lower stress hormones.",
        },
        // Muscle function
        {
          target: "vagal", // Proxy for muscle relaxation
          mechanism: "agonist",
          intrinsicEfficacy: magnesium_mg * 0.001,
          unit: "index",
          tau: 60,
          description: "Magnesium acts as a natural calcium blocker, helping muscles relax and preventing cramps.",
        },
      ],
    };
  },

  /**
   * BREATHWORK
   * Conscious control of respiration to shift state.
   */
  Breathwork: (
    type: "calm" | "balance" | "activation", // box/4-7-8 vs coherence vs wim hof
    intensity: number = 1.0
  ): PharmacologyDef => {
    // Base vagal effect for all conscious breathing
    let vagal = 0.5 * intensity;
    let norepi = 0;
    let cortisol = 0;
    let description = "";

    if (type === "calm") { // 4-7-8, slow breathing
      vagal = 2.0 * intensity;
      norepi = -20 * intensity; // Suppression
      cortisol = -5 * intensity;
      description = "Slow, prolonged exhalations directly stimulate the vagus nerve, rapidly lowering heart rate and anxiety.";
    } else if (type === "balance") { // Box breathing, Coherence
      vagal = 1.0 * intensity;
      norepi = -5 * intensity; // Mild calming
      description = "Rhythmic, balanced breathing synchronizes heart rate variability (HRV) and creates a state of alert calm.";
    } else if (type === "activation") { // Wim Hof, Tummo, Fire
      vagal = 0.2 * intensity; // Mild background vagal
      norepi = 150 * intensity; // Huge sympathetic spike
      cortisol = 10 * intensity; // Acute stress
      description = "Hyperventilation triggers a controlled fight-or-flight response (adrenaline), followed by a deep calm retention phase.";
    }

    const pd: any[] = [
      {
        target: "vagal",
        mechanism: "agonist",
        intrinsicEfficacy: vagal,
        unit: "index",
        tau: 2, // Fast
        description: "Direct modulation of the vagus nerve through respiratory sinus arrhythmia.",
      },
      {
        target: "norepi",
        mechanism: type === "activation" ? "agonist" : "antagonist",
        intrinsicEfficacy: Math.abs(norepi),
        unit: "pg/mL",
        tau: 2,
        description: description,
      },
      {
        target: "cortisol",
        mechanism: type === "activation" ? "agonist" : "antagonist",
        intrinsicEfficacy: Math.abs(cortisol),
        unit: "µg/dL",
        tau: 15,
        description: type === "activation" ? "Acute hormetic stress spike." : "Reduces stress hormones.",
      },
    ];

    if (type === "activation") {
      pd.push({
        target: "dopamine",
        mechanism: "agonist",
        intrinsicEfficacy: 15 * intensity,
        unit: "nM",
        tau: 5,
        description: "Intense breathing can trigger a dopamine rush and euphoria.",
      });
    }

    return {
      molecule: { name: "Breathwork", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd,
    };
  },

  /**
   * SOCIAL MEDIA
   * Digital stimuli effects.
   */
  SocialMedia: (
    type: "entertainment" | "doomscrolling",
    durationMin: number
  ): PharmacologyDef => {
    // Reward variability (slot machine effect)
    const rewardVariability = 1.5; 

    return {
      molecule: { name: "Social Media", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "dopamine",
          mechanism: "agonist",
          // Doomscrolling has higher 'seeking' dopamine but lower satisfaction
          intrinsicEfficacy: type === "entertainment" ? 15 : 25, 
          unit: "nM",
          tau: 5,
          description: "Variable reward schedules keep dopamine seeking high, often without fulfilling the drive.",
        },
        {
          target: "cortisol",
          mechanism: "agonist",
          intrinsicEfficacy: type === "doomscrolling" ? 8.0 : 2.0,
          unit: "µg/dL",
          tau: 10,
          description: type === "doomscrolling" 
            ? "Negative content triggers threat detection circuits, raising stress."
            : "Mild stimulation prevents full relaxation.",
        },
        {
          target: "orexin",
          mechanism: "agonist",
          intrinsicEfficacy: 10,
          unit: "pg/mL",
          tau: 5,
          description: "Blue light and constant novelty keep wakefulness signals high, suppressing sleep pressure.",
        },
        {
          target: "serotonin",
          mechanism: "antagonist",
          intrinsicEfficacy: type === "doomscrolling" ? 5 : 0,
          unit: "nM",
          tau: 20,
          description: "Social comparison and negative news can lower mood and serotonin tone.",
        },
      ],
    };
  },

  /**
   * SEXUAL ACTIVITY
   * Hormonal and neurotransmitter cascade.
   */
  SexualActivity: (
    type: "partnered" | "solo",
    orgasm: boolean
  ): PharmacologyDef => {
    const partnerFactor = type === "partnered" ? 2.0 : 1.0;
    const orgasmFactor = orgasm ? 1.0 : 0.2;

    return {
      molecule: { name: "Sexual Activity", molarMass: 0 },
      pk: { model: "activity-dependent", delivery: "continuous" },
      pd: [
        {
          target: "dopamine",
          mechanism: "agonist",
          intrinsicEfficacy: 30 * partnerFactor,
          unit: "nM",
          tau: 5,
          description: "Intense activation of reward and motivation circuits.",
        },
        {
          target: "oxytocin",
          mechanism: "agonist",
          intrinsicEfficacy: (type === "partnered" ? 50 : 10) * orgasmFactor,
          unit: "pg/mL",
          tau: 15,
          description: "Massive release (especially if partnered) driving bonding, trust, and relaxation.",
        },
        {
          target: "prolactin",
          mechanism: "agonist",
          intrinsicEfficacy: orgasm ? 40 : 5, // The "post-nut" hormone
          unit: "ng/mL",
          tau: 5, // Rapid post-orgasm spike
          description: "The 'satiety' hormone responsible for the refractory period and post-orgasm relaxation.",
        },
        {
          target: "testosterone",
          mechanism: "agonist",
          intrinsicEfficacy: 15 * partnerFactor, // Acute rise
          unit: "ng/dL",
          tau: 15,
          description: "Acute arousal temporarily boosts testosterone and dominance signaling.",
        },
        {
          target: "cortisol",
          mechanism: "antagonist",
          intrinsicEfficacy: 10 * orgasmFactor,
          unit: "µg/dL",
          tau: 30,
          description: "Orgasm provides significant stress relief and lowering of tension.",
        },
        {
          target: "endorphin",
          mechanism: "agonist",
          intrinsicEfficacy: 20 * orgasmFactor,
          unit: "nM",
          tau: 10,
          description: "Natural pain relief and euphoria.",
        },
      ],
    };
  },
};
