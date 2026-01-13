import type { UnifiedSignalDefinition, AuxiliaryDefinition } from '@/types/unified';
import { minuteToPhase, hourToPhase, windowPhase, gaussianPhase, sigmoidPhase, widthToConcentration, minutesToPhaseWidth } from '../utils';

/**
 * ENERGY (Composite)
 */
export const energy: UnifiedSignalDefinition = {
  key: 'energy',
  label: 'Energy',
  unit: '%',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(2), 1.0);
      const afternoonDip = gaussianPhase(p, hourToPhase(9), 1.5);
      const tone = 50.0 + 40.0 * wakeDrive - 15.0 * afternoonDip;
      // Scale by metabolic capacity if available
      return tone * (0.8 + 0.2 * (ctx.physiology?.metabolicCapacity ?? 1.0));
    },
    tau: 120,
    production: [
      { source: 'glucose', coefficient: 0.1, transform: (G) => Math.min(1.0, G / 100) },
      { source: 'dopamine', coefficient: 0.05 }, // 3.0 / 50 = 0.06
      { source: 'thyroid', coefficient: 0.5 }, // 1.0 / 2.0 = 0.5
      { source: 'estrogen', coefficient: 0.02 }, // 2.0 / 100 = 0.02
      { source: 'cortisol', coefficient: 0.1 }, // Moderate cortisol supports energy
    ],
    clearance: [
      { type: 'linear', rate: 0.01, transform: (_, state, ctx) => ctx.isAsleep ? 0.5 : 1.0 }
    ],
    couplings: [
      { source: 'inflammation', effect: 'inhibit', strength: 0.3 },
      { source: 'melatonin', effect: 'inhibit', strength: 0.05 }, // -4.0 / 80 = 0.05
    ]
  },
  initialValue: 50,
  min: 0,
  max: 150,
  display: {
    color: '#facc15',
    referenceRange: { min: 30, max: 90 }
  }
};

/**
 * HRV (Heart Rate Variability)
 */
export const hrv: UnifiedSignalDefinition = {
  key: 'hrv',
  label: 'HRV',
  unit: 'ms',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const nocturnalRise = gaussianPhase(p, hourToPhase(23), 2.0);
      return 45.0 + 35.0 * nocturnalRise;
    },
    tau: 30,
    production: [
      { source: 'vagal', coefficient: 40.0 } // 40.0 from signals.ts
    ],
    clearance: [],
    couplings: [
      { source: 'adrenaline', effect: 'inhibit', strength: 0.1 }, // -0.1
      { source: 'norepi', effect: 'inhibit', strength: 0.08 }, // -0.08
    ]
  },
  initialValue: 60,
  min: 10,
  max: 150,
  display: {
    color: '#10b981',
    referenceRange: { min: 40, max: 100 }
  }
};

/**
 * BLOOD PRESSURE
 */
export const bloodPressure: UnifiedSignalDefinition = {
  key: 'bloodPressure',
  label: 'Blood Pressure',
  unit: 'mmHg',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const wakeRise = sigmoidPhase(p, hourToPhase(2), 1.0);
      return 100.0 + 20.0 * wakeRise;
    },
    tau: 15,
    production: [],
    clearance: [],
    couplings: [
      { source: 'adrenaline', effect: 'stimulate', strength: 0.05 }, // 0.05
      { source: 'norepi', effect: 'stimulate', strength: 0.4 }, // 0.4
      { source: 'cortisol', effect: 'stimulate', strength: 0.5 }, // 0.5
      { source: 'vagal', effect: 'inhibit', strength: 10.0 }, // -10.0
    ]
  },
  initialValue: 110,
  min: 70,
  max: 200,
  display: {
    color: '#ef4444',
    referenceRange: { min: 90, max: 140 }
  }
};

/**
 * INFLAMMATION
 */
export const inflammation: UnifiedSignalDefinition = {
  key: 'inflammation',
  label: 'Inflammation',
  unit: 'relative',
  dynamics: {
    setpoint: (ctx) => 1.0,
    tau: 1440, // Slow dynamics (1 day)
    production: [
      { source: 'constant', coefficient: 0.01, transform: (_, state) => {
          const glucose = state.signals.glucose ?? 90;
          return glucose > 150 ? (glucose - 150) / 100 : 0;
        } 
      },
      { source: 'adrenaline', coefficient: 0.08, transform: (A) => A > 200 ? 1.0 : 0 }, // Acute stress spike
    ],
    clearance: [
      { type: 'linear', rate: 0.0005 }
    ],
    couplings: [
      { source: 'cortisol', effect: 'inhibit', strength: 0.2 } // -0.2
    ]
  },
  initialValue: 1.0,
  min: 0,
  max: 10,
  display: {
    color: '#7f1d1d',
    referenceRange: { min: 0.5, max: 2.0 }
  }
};

/**
 * BDNF
 */
export const bdnf: UnifiedSignalDefinition = {
  key: 'bdnf',
  label: 'BDNF',
  unit: 'ng/mL',
  dynamics: {
    setpoint: (ctx) => 25.0,
    tau: 480,
    production: [
      { source: 'growthHormone', coefficient: 0.5 }, // 0.5
      { source: 'constant', coefficient: 0.005, transform: (_, state) => state.auxiliary.bdnfExpression ?? 0.6 }
    ],
    clearance: [
      { type: 'linear', rate: 0.002 }
    ],
    couplings: [
      { source: 'cortisol', effect: 'inhibit', strength: 0.3 } // -0.3
    ]
  },
  initialValue: 25.0,
  min: 0,
  max: 100,
  display: {
    color: '#8b5cf6',
    referenceRange: { min: 10, max: 40 }
  }
};

export const bdnfExpression: AuxiliaryDefinition = {
  key: 'bdnfExpression',
  dynamics: {
    setpoint: (ctx) => 0.6,
    tau: 2880, // 2 days
    production: [
      { source: 'constant', coefficient: 0.001, transform: (_, state) => 0 } 
    ],
    clearance: [
      { type: 'linear', rate: 0.0001 }
    ]
  },
  initialValue: 0.6
};

/**
 * VAGAL TONE
 */
export const vagal: UnifiedSignalDefinition = {
  key: 'vagal',
  label: 'Vagal Tone',
  unit: 'a.u.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const parasym = windowPhase(p, hourToPhase(13), hourToPhase(7), minutesToPhaseWidth(60));
      const drop = gaussianPhase(p, hourToPhase(1), widthToConcentration(60));
      return 0.4 + 0.35 * parasym - 0.15 * drop;
    },
    tau: 30,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.05 }
    ],
    couplings: [
      { source: 'oxytocin', effect: 'stimulate', strength: 0.04 }, // 0.04
      { source: 'gaba', effect: 'stimulate', strength: 0.006 }, // 0.006
      { source: 'adrenaline', effect: 'inhibit', strength: 0.002 }, // -0.002
      { source: 'cortisol', effect: 'inhibit', strength: 0.01 }, // -0.01
    ]
  },
  initialValue: 0.5,
  min: 0,
  max: 1.5,
  display: { 
    color: '#10b981',
    referenceRange: { min: 0.3, max: 0.8 }
  }
};

/**
 * KETONES
 */
export const ketone: UnifiedSignalDefinition = {
  key: 'ketone',
  label: 'Ketones',
  unit: 'mmol/L',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.minuteOfDay);
      const overnight = gaussianPhase(p, hourToPhase(19.5), widthToConcentration(400)) + gaussianPhase(p, hourToPhase(22.5), widthToConcentration(260));
      const daySuppression = gaussianPhase(p, hourToPhase(7.5), widthToConcentration(300));
      const tone = 0.3 + 1.2 * overnight - 0.5 * daySuppression;
      return Math.max(0.1, tone);
    },
    tau: 480,
    production: [
      { source: 'glucagon', coefficient: 0.02 } // 0.02
    ],
    clearance: [
      { type: 'linear', rate: 0.01 }
    ],
    couplings: [
      { source: 'insulin', effect: 'inhibit', strength: 0.05 } // -0.05
    ]
  },
  initialValue: 0.2,
  min: 0,
  max: 8.0,
  display: { 
    color: '#8b5cf6',
    referenceRange: { min: 0.1, max: 5.0 }
  }
};

/**
 * ETHANOL
 */
export const ethanol: UnifiedSignalDefinition = {
  key: 'ethanol',
  label: 'Ethanol',
  unit: 'g/dL', // Or arbitrary units matching pharmacology
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 60,
    production: [], // Added via interventions
    clearance: [
      { type: 'linear', rate: 0.015 } // ~1 unit per hour
    ],
    couplings: []
  },
  initialValue: 0,
  min: 0,
  max: 0.5,
  display: { 
    color: '#ef4444',
    referenceRange: { min: 0, max: 0.08 }
  }
};

/**
 * ACETALDEHYDE
 */
export const acetaldehyde: UnifiedSignalDefinition = {
  key: 'acetaldehyde',
  label: 'Acetaldehyde',
  unit: 'relative',
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 60,
    production: [
      { source: 'ethanol', coefficient: 0.3 } // 0.3
    ],
    clearance: [
      { type: 'linear', rate: 0.03 }
    ],
    couplings: []
  },
  initialValue: 0,
  min: 0,
  max: 10,
  display: { 
    color: '#b91c1c',
    referenceRange: { min: 0, max: 1 }
  }
};

/**
 * MAGNESIUM
 */
export const magnesium: UnifiedSignalDefinition = {
  key: 'magnesium',
  label: 'Magnesium',
  unit: 'relative',
  dynamics: {
    setpoint: (ctx) => 0.6,
    tau: 10080, // Very slow
    production: [],
    clearance: [
      { type: 'linear', rate: 0.0001 }
    ],
    couplings: [
      { source: 'adrenaline', effect: 'inhibit', strength: 0.05 } // -0.05
    ]
  },
  initialValue: 0.6,
  min: 0,
  max: 2.0,
  display: { 
    color: '#3b82f6',
    referenceRange: { min: 0.4, max: 1.0 }
  }
};

/**
 * SENSORY LOAD
 */
export const sensoryLoad: UnifiedSignalDefinition = {
  key: 'sensoryLoad',
  label: 'Sensory Load',
  unit: 'relative',
  dynamics: {
    setpoint: (ctx) => 0.1,
    tau: 15,
    production: [
      { source: 'adrenaline', coefficient: 0.2 } // 0.2
    ],
    clearance: [
      { type: 'linear', rate: 0.1 }
    ],
    couplings: [
      { source: 'gaba', effect: 'inhibit', strength: 0.15 } // -0.15
    ]
  },
  initialValue: 0.1,
  min: 0,
  max: 10,
  display: { 
    color: '#f59e0b',
    referenceRange: { min: 0, max: 1.0 }
  }
};

/**
 * mTOR
 */
export const mtor: UnifiedSignalDefinition = {
  key: 'mtor',
  label: 'mTOR',
  unit: 'fold-change',
  dynamics: {
    setpoint: (ctx) => 1.0,
    tau: 1440,
    production: [
      { source: 'insulin', coefficient: 0.03 } // 0.03
    ],
    clearance: [
      { type: 'linear', rate: 0.01 }
    ],
    couplings: []
  },
  initialValue: 1.0,
  min: 0,
  max: 5,
  display: { 
    color: '#f43f5e',
    referenceRange: { min: 0.5, max: 3.0 }
  }
};

/**
 * AMPK
 */
export const ampk: UnifiedSignalDefinition = {
  key: 'ampk',
  label: 'AMPK',
  unit: 'fold-change',
  dynamics: {
    setpoint: (ctx) => 1.0,
    tau: 1440,
    production: [
      { source: 'glucagon', coefficient: 0.01 } // 0.01
    ],
    clearance: [
      { type: 'linear', rate: 0.01 }
    ],
    couplings: [
      { source: 'insulin', effect: 'inhibit', strength: 0.04 } // -0.04
    ]
  },
  initialValue: 1.0,
  min: 0,
  max: 5,
  display: { 
    color: '#10b981',
    referenceRange: { min: 0.5, max: 3.0 }
  }
};

/**
 * OXYGEN
 */
export const oxygen: UnifiedSignalDefinition = {
  key: 'oxygen',
  label: 'Oxygen',
  unit: 'relative',
  dynamics: {
    setpoint: (ctx) => 50.0,
    tau: 5,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.2 }
    ],
    couplings: []
  },
  initialValue: 50,
  min: 0,
  max: 100,
  display: { 
    color: '#3b82f6',
    referenceRange: { min: 40, max: 95 }
  }
};

