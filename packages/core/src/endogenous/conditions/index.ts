export * from "./types";
export * from "./utils";
export * from "./mappings";

import * as neurodivergence from "./neurodivergence";
import * as mood from "./mood";
import * as autonomic from "./autonomic";
import * as immune from "./immune";
import * as sleep from "./sleep";
import * as endocrine from "./endocrine";
import type { ConditionDef } from "./types";

export const CONDITION_LIBRARY: ConditionDef[] = [
  ...Object.values(neurodivergence),
  ...Object.values(mood),
  ...Object.values(autonomic),
  ...Object.values(immune),
  ...Object.values(sleep),
  ...Object.values(endocrine),
];

export { neurodivergence, mood, autonomic, immune, sleep, endocrine };
