export type ConcentrationUnit =
  | 'mg/dL'      // Glucose, ethanol
  | 'µg/dL'      // Cortisol
  | 'ng/mL'      // Leptin, BDNF, growth hormone
  | 'pg/mL'      // Catecholamines, melatonin, orexin
  | 'µIU/mL'     // Insulin
  | 'pmol/L'     // GLP-1, thyroid
  | 'nM'         // Synaptic neurotransmitters
  | 'µM'         // Glutamate (extracellular)
  | 'IU/L'       // LH, FSH
  | 'mmol/L';    // Ketones, electrolytes

export type TimeUnit = 'ms' | 'sec' | 'min' | 'hr';
export type PressureUnit = 'mmHg';
export type RatioUnit = 'fold-change' | 'ratio';
export type CompositeUnit = 'index';  // Explicitly marks as computed index, not a measurement
export type PercentUnit = '% baseline' | '%'; // For legacy/transitional support

export type PhysiologicalUnit = ConcentrationUnit | TimeUnit | PressureUnit | RatioUnit | CompositeUnit | PercentUnit;
