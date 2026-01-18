import type { InterventionDef } from "@/types";
import { Agents } from "../../physiology/agents";

export const PRESCRIPTION_INTERVENTIONS: InterventionDef[] = [
  {
    key: "ritalinIR10",
    label: "Ritalin IR",

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
    // DYNAMIC PHARMACOLOGY
    pharmacology: (params) => Agents.Methylphenidate(Number(params.mg) || 10),
    group: "Stimulants",
    categories: ["medications"],
    goals: ["focus", "energy"],
  },
];
