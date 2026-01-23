import type { InterventionDef } from "../../types";
import { Agents } from "../agents";

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
        label: "Sugar",
        unit: "g",
        type: "slider",
        min: 0,
        max: 120,
        step: 5,
        default: 35,
        hint: "Simple sugars (glucose, fructose, sucrose)",
      },
      {
        key: "carbStarch",
        label: "Starch",
        unit: "g",
        type: "slider",
        min: 0,
        max: 150,
        step: 5,
        default: 40,
        hint: "Complex carbs (bread, rice, pasta, potatoes)",
      },
      {
        key: "protein",
        label: "Protein",
        unit: "g",
        type: "slider",
        min: 0,
        max: 80,
        step: 5,
        default: 30,
        hint: "Meat, fish, eggs, legumes, dairy",
      },
      {
        key: "fat",
        label: "Fat",
        unit: "g",
        type: "slider",
        min: 0,
        max: 70,
        step: 5,
        default: 20,
        hint: "Oils, butter, nuts, fatty meats",
      },
      {
        key: "fiber",
        label: "Fiber",
        unit: "g",
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
        unit: "index",
        type: "slider",
        min: 20,
        max: 100,
        step: 5,
        default: 60,
        hint: "Low (20-55), Medium (56-69), High (70-100)",
      },
      {
        key: "waterMl",
        label: "Water",
        unit: "ml",
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
        unit: "°C",
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
    pharmacology: (params: any) => {
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
      const temperatureMultiplier =
        {
          cold: 1.1, 
          room: 1.0, 
          warm: 0.95, 
          hot: 0.85, 
        }[temperature] ?? 1.0;

      // Water speeds gastric emptying
      const waterSpeedBoost = 1 + (waterMl / (waterMl + 400)) * 0.3; 

      // Combined GI adjustment
      const effectiveGI =
        glycemicIndex * waterSpeedBoost * temperatureMultiplier;

      const starchGI = Math.min(effectiveGI, effectiveGI * 0.8); 
      const totalGlucoseEquivalent = sugar + starch * 0.9;

      const agents = [];

      if (totalGlucoseEquivalent > 0) {
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

      if (fat > 0) {
        agents.push(Agents.Lipids(fat));
      }

      if (protein > 0) {
        agents.push(Agents.Protein(protein));
      }

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
