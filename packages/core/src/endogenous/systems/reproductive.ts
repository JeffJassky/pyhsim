import type { BioSystemDef } from "./types";

export const reproductive: BioSystemDef = {
  id: "reproductive",
  label: "Reproductive System",
  icon: "🧬",
  signals: [
    "testosterone",
    "estrogen",
    "progesterone",
    "lh",
    "fsh",
    "shbg",
    "dheas",
  ],
  description:
    "The sex organs and hormones that govern reproduction, sexual characteristics, and influence systemic health.",
  applicationDescription: "Follow cycle phases or hormonal status.",
};
