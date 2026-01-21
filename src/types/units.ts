export type ConcentrationUnit =
  | "mg/dL" // Glucose, ethanol
  | "g/dL" // High ethanol
  | "µg/dL" // Cortisol, zinc, copper, iron
  | "ng/dL" // Testosterone
  | "ng/mL" // Leptin, BDNF, growth hormone, folate
  | "pg/mL" // Catecholamines, melatonin, orexin, B12
  | "µIU/mL" // Insulin
  | "pmol/L" // GLP-1, thyroid
  | "nmol/L" // SHBG
  | "nM" // Synaptic neurotransmitters
  | "µM" // Glutamate (extracellular)
  | "IU/L" // LH, FSH
  | "U/L" // Enzymes (ALT, AST)
  | "mmol/L" // Ketones, electrolytes
  | "µg/L" // Selenium
  | "µmol/L"; // Choline

export type RateUnit = "mL/min/1.73m²"; // eGFR

export type WeightUnit = "mcg" | "mg" | "g" | "kg" | "g" | "oz" | "lb" | "µg";
export type TemperatureUnit = "°C" | "°F";
export type VolumeUnit = "ml" | "L" | "floz" | "cup" | "pint" | "qt" | "gal";

export type TimeUnit = "ms" | "sec" | "min" | "hr";
export type PressureUnit = "mmHg";
export type RatioUnit = "fold-change" | "ratio" | "relative" | "a.u.";
export type CompositeUnit = "index" | "units" | "IU" | "servings" | "x"; // Explicitly marks as computed index, not a measurement
export type PercentUnit = "% baseline" | "%"; // For legacy/transitional support

export type PhysiologicalUnit =
  | ConcentrationUnit
  | RateUnit
  | TimeUnit
  | PressureUnit
  | RatioUnit
  | CompositeUnit
  | PercentUnit
  | WeightUnit;

export type ParameterUnit =
  | WeightUnit
  | CompositeUnit
  | TemperatureUnit
  | VolumeUnit;
