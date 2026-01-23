import * as nutritional from "./nutritional";
import * as stress from "./stress";
import * as substances from "./substances";
import * as supplements from "./supplements";
import * as psychedelics from "./psychedelics";
import * as lifestyle from "./lifestyle";
import * as thermal from "./thermal";

export const Agents = {
  ...nutritional,
  ...stress,
  ...substances,
  ...supplements,
  ...psychedelics,
  ...lifestyle,
  ...thermal,
};

export {
  nutritional,
  stress,
  substances,
  supplements,
  psychedelics,
  lifestyle,
  thermal,
};