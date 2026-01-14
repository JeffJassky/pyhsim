import type { InterventionDef } from "@/types";
import { Agents } from "../../physiology/agents";

export const FOOD_INTERVENTIONS: InterventionDef[] = [
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
        key: "fiber",
        label: "Fiber (g)",
        type: "slider",
        min: 0,
        max: 30,
        step: 1,
        default: 5,
      },
    ],
    // DYNAMIC PHARMACOLOGY FACTORY
    // Returns a list of all active agents in the meal
    pharmacology: (params) => {
      const sugar = Number(params.carbSugar) || 0;
      const starch = Number(params.carbStarch) || 0;
      const protein = Number(params.protein) || 0;
      const fat = Number(params.fat) || 0;
      const fiber = Number(params.fiber) || 0;

      // Starch converts to glucose, but with slightly less efficiency/mass than pure sugar
      const totalGlucoseEquivalent = sugar + (starch * 0.9);

      const agents = [];

      if (totalGlucoseEquivalent > 0) {
        agents.push(Agents.Glucose(totalGlucoseEquivalent, { fatGrams: fat, fiberGrams: fiber }));
      }
      
      if (fat > 0) {
        agents.push(Agents.Lipids(fat));
      }

      if (protein > 0) {
        agents.push(Agents.Protein(protein));
      }

      return agents;
    },
    group: "Food",
    categories: ["food"],
    goals: ["energy", "digestion", "longevity"],
  },
];
