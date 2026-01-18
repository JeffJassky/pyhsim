import type { InterventionDef } from "@/types";
import { Agents } from "../../physiology/agents";

export const FOOD_INTERVENTIONS: InterventionDef[] = [
  {
    key: "food",
    label: "Food",

    icon: "🍽️",
    defaultDurationMin: 30,
    params: [
      // === MACRONUTRIENTS ===
      {
        key: "carbSugar",
        label: "Sugar (g)",
        type: "slider",
        min: 0,
        max: 120,
        step: 5,
        default: 35,
        hint: "Simple sugars (glucose, fructose, sucrose)",
      },
      {
        key: "carbStarch",
        label: "Starch (g)",
        type: "slider",
        min: 0,
        max: 150,
        step: 5,
        default: 40,
        hint: "Complex carbs (bread, rice, pasta, potatoes)",
      },
      {
        key: "protein",
        label: "Protein (g)",
        type: "slider",
        min: 0,
        max: 80,
        step: 5,
        default: 30,
        hint: "Meat, fish, eggs, legumes, dairy",
      },
      {
        key: "fat",
        label: "Fat (g)",
        type: "slider",
        min: 0,
        max: 70,
        step: 5,
        default: 20,
        hint: "Oils, butter, nuts, fatty meats",
      },
      {
        key: "fiber",
        label: "Fiber (g)",
        type: "slider",
        min: 0,
        max: 30,
        step: 1,
        default: 5,
        hint: "Vegetables, whole grains, legumes",
      },
      // === MEAL CHARACTERISTICS ===
      {
        key: "glycemicIndex",
        label: "Glycemic Index",
        type: "slider",
        min: 20,
        max: 100,
        step: 5,
        default: 60,
        hint: "Low (20-55), Medium (56-69), High (70-100)",
      },
      {
        key: "waterMl",
        label: "Water (mL)",
        type: "slider",
        min: 0,
        max: 500,
        step: 50,
        default: 200,
        hint: "Liquid content speeds gastric emptying",
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "select",
        options: [
          { value: "cold", label: "Cold" },
          { value: "room", label: "Room temp" },
          { value: "warm", label: "Warm" },
          { value: "hot", label: "Hot" },
        ],
        default: "warm",
        hint: "Hot meals slow gastric emptying",
      },
    ],
    // DYNAMIC PHARMACOLOGY FACTORY
    // Returns a list of all active agents in the meal
    // Each macronutrient triggers comprehensive physiological cascades
    // Meal characteristics (GI, water, temperature) modify absorption kinetics
    pharmacology: (params) => {
      // === MACRONUTRIENTS ===
      const sugar = Number(params.carbSugar) || 0;
      const starch = Number(params.carbStarch) || 0;
      const protein = Number(params.protein) || 0;
      const fat = Number(params.fat) || 0;
      const fiber = Number(params.fiber) || 0;

      // === MEAL CHARACTERISTICS ===
      const glycemicIndex = Number(params.glycemicIndex) || 60;
      const waterMl = Number(params.waterMl) || 200;
      const temperature = String(params.temperature) || "warm";

      // Temperature affects gastric emptying rate
      // Hot meals slow emptying (vagal reflex), cold speeds it slightly
      const temperatureMultiplier =
        {
          cold: 1.1, // 10% faster emptying
          room: 1.0, // Baseline
          warm: 0.95, // 5% slower
          hot: 0.85, // 15% slower (protective gastric reflex)
        }[temperature] ?? 1.0;

      // Water speeds gastric emptying (dilutes, increases motility)
      // Effect saturates around 300-400mL
      const waterSpeedBoost = 1 + (waterMl / (waterMl + 400)) * 0.3; // Up to 30% faster

      // Combined GI adjustment: base GI modified by temperature and water
      // Water increases effective GI (faster absorption), hot food decreases it
      const effectiveGI =
        glycemicIndex * waterSpeedBoost * temperatureMultiplier;

      // Starch converts to glucose, but with slightly less efficiency/mass than pure sugar
      // Also, starch has inherently lower GI than sugar
      const starchGI = Math.min(effectiveGI, effectiveGI * 0.8); // Starch is ~20% slower
      const totalGlucoseEquivalent = sugar + starch * 0.9;

      const agents = [];

      // GLUCOSE: Primary fuel, insulin driver, reward, serotonin, satiety signals,
      // post-prandial sedation (orexin↓, norepi↓, cortisol↓)
      if (totalGlucoseEquivalent > 0) {
        // Weight average GI based on sugar vs starch proportion
        const sugarProportion = sugar / (sugar + starch + 0.001);
        const weightedGI =
          effectiveGI * sugarProportion + starchGI * (1 - sugarProportion);

        agents.push(
          Agents.Glucose(totalGlucoseEquivalent, {
            fatGrams: fat,
            fiberGrams: fiber,
            sugarGrams: sugar,
            glycemicIndex: weightedGI,
          }),
        );
      }

      // LIPIDS: Strong satiety, GLP-1, leptin, vagal activation, parasympathetic,
      // endocannabinoid "bliss", post-prandial sedation
      if (fat > 0) {
        agents.push(Agents.Lipids(fat));
      }

      // PROTEIN: mTOR, glucagon, satiety, neurotransmitter precursors, BDNF,
      // glutamate, histamine, mild sedation
      if (protein > 0) {
        agents.push(Agents.Protein(protein));
      }

      // FIBER: Gut-brain axis, GLP-1, SCFA-mediated GABA, anti-inflammatory,
      // vagal activation, serotonin
      if (fiber > 0) {
        agents.push(Agents.Fiber(fiber));
      }

      return agents;
    },
    group: "Food",
    categories: ["food"],
    goals: ["energy", "digestion", "longevity"],
  },
];
