import type { BioSystemDef } from "./types";

export const endocrine: BioSystemDef = {
  id: "endocrine",
  label: "Endocrine System",
  icon: "🩸",
  signals: [
    "cortisol",
    "adrenaline",
    "thyroid",
    "growthHormone",
    "prolactin",
    "oxytocin",
    "vasopressin",
    "melatonin",
    "vip",
  ],
  auxiliary: ["ghReserve"],
  description:
    "The collection of glands that produce hormones to regulate metabolism, growth, and tissue function.",
  applicationDescription:
    "Track hormonal responses to stress, sleep, and environmental cues.",
};
