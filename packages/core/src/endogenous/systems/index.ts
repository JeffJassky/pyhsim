import { nervous } from "./nervous";
import { endocrine } from "./endocrine";
import { metabolism } from "./metabolism";
import { reproductive } from "./reproductive";
import { cardiovascular } from "./cardiovascular";
import { organ } from "./organ";
import { nutritional } from "./nutritional";
import type { BioSystemDef } from "./types";

export * from "./types";
export * from "./nervous";
export * from "./endocrine";
export * from "./metabolism";
export * from "./reproductive";
export * from "./cardiovascular";
export * from "./organ";
export * from "./nutritional";

export const BIOLOGICAL_SYSTEMS: BioSystemDef[] = [
  nervous,
  endocrine,
  metabolism,
  reproductive,
  cardiovascular,
  organ,
  nutritional,
];
