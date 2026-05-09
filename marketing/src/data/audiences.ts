export interface Audience {
  slug: string;
  code: string;
  label: string;
  title: string;
  blurb: string;
}

export const AUDIENCES: Audience[] = [
  {
    slug: "glp1",
    code: "A",
    label: "GLP-1",
    title: "GLP-1 users",
    blurb: "Keep the loss. Keep the muscle. Keep the mood.",
  },
  {
    slug: "performance",
    code: "B",
    label: "Performance",
    title: "Cognitive & physical performance",
    blurb: "Output without overshoot. All day, every day.",
  },
  {
    slug: "longevity",
    code: "C",
    label: "Longevity",
    title: "Longevity & healthspan",
    blurb: "Decades of compounding. Modeled, not guessed.",
  },
  {
    slug: "health",
    code: "D",
    label: "Chronic conditions",
    title: "Hashimoto's · PCOS · POTS",
    blurb: "For the patient who became their own clinician.",
  },
  {
    slug: "adhd",
    code: "E",
    label: "ADHD & focus",
    title: "ADHD & natural focus",
    blurb: "Build a baseline before — or beside — the prescription.",
  },
];
