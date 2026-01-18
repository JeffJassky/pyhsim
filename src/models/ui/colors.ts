import type { IdealTendency } from "@/types";

export const TENDENCY_COLORS: Record<
  IdealTendency,
  { line: string; fill: string }
> = {
  higher: { line: "#38bdf8", fill: "rgba(56, 189, 248, 0.12)" },
  lower: { line: "#f97316", fill: "rgba(249, 115, 22, 0.12)" },
  mid: { line: "#94a3b8", fill: "rgba(148, 163, 184, 0.12)" },
  none: { line: "#94a3b8", fill: "rgba(148, 163, 184, 0.12)" },
};

export const TENDENCY_LINE_GRADIENTS: Record<IdealTendency, [string, string]> =
  {
    higher: ["#67e8f9", "#0ea5e9"],
    lower: ["#fb923c", "#dc2626"],
    mid: ["#e5e7eb", "#94a3b8"],
    none: ["#e5e7eb", "#94a3b8"],
  };
