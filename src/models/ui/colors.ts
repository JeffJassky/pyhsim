import type { IdealTendency } from "@/types";

export const TENDENCY_COLORS: Record<
  IdealTendency,
  { line: string; fill: string }
> = {
  higher: {
    line: "var(--color-macro-carbs)",
    fill: "color-mix(in srgb, var(--color-macro-carbs), transparent 88%)",
  },
  lower: {
    line: "var(--color-warning)",
    fill: "color-mix(in srgb, var(--color-warning), transparent 88%)",
  },
  mid: {
    line: "var(--neutral-900)",
    fill: "var(--neutral-900)",
  },
  none: {
    line: "var(--neutral-900)",
    fill: "var(--neutral-900)",
  },
};

export const TENDENCY_LINE_GRADIENTS: Record<IdealTendency, [string, string]> =
  {
    higher: ["var(--sky-400)", "var(--sky-600)"],
    lower: ["var(--amber-400)", "var(--rose-600)"],
    mid: ["var(--neutral-200)", "var(--neutral-500)"],
    none: ["var(--neutral-200)", "var(--neutral-500)"],
  };
