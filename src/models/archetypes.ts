import type { Goal } from "@/types/neurostate";

export type ArchetypeId = "biohacker" | "neurodivergent" | "cycle_syncer";

export interface Archetype {
  id: ArchetypeId;
  label: string;
  icon: string;
  description: string;
  commonGoals: Goal[];
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "biohacker",
    label: "Optimizer",
    icon: "🧪",
    description:
      "Data-driven optimization of energy, longevity, and performance.",
    commonGoals: [
      "energy",
      "productivity",
      "longevity",
      "recovery",
      "focus",
      "weightLoss",
      "sleep",
    ],
  },
  {
    id: "neurodivergent",
    label: "Neurodiverse",
    icon: "🧠",
    description: "Managing focus, stimulation, and mood regulation (ADHD/ASD).",
    commonGoals: ["focus", "mood", "calm", "sleep", "productivity", "energy"],
  },
  {
    id: "cycle_syncer",
    label: "Cycle Syncer",
    icon: "🌙",
    description: "Aligning lifestyle with infradian and hormonal rhythms.",
    commonGoals: ["cycle", "mood", "weightLoss", "digestion", "sleep", "calm"],
  },
];
