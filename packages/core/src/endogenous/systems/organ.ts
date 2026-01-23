import type { BioSystemDef } from "./types";

export const organ: BioSystemDef = {
  id: "organ",
  label: "Organ Health & Detox",
  icon: "🫁",
  signals: ["alt", "ast", "egfr", "ethanol", "acetaldehyde", "inflammation"],
  description:
    "The vital organs (Liver, Kidneys) responsible for filtration, detoxification, and systemic maintenance.",
  applicationDescription:
    "Monitor markers of organ stress and detoxification load.",
};
