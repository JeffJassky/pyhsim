import type { BioSystemDef } from "./types";

export const cardiovascular: BioSystemDef = {
  id: "cardiovascular",
  label: "Cardiovascular & Autonomic",
  icon: "❤️",
  signals: ["bloodPressure", "hrv", "vagal", "oxygen"],
  description:
    "The heart, blood vessels, and the autonomic control (sympathetic/parasympathetic) that regulates blood flow and arousal states.",
  applicationDescription: "Assess autonomic balance and cardiovascular stress.",
};
