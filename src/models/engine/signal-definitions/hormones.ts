import type { UnifiedSignalDefinition, AuxiliaryDefinition } from '@/types/unified';
import { minuteToPhase, hourToPhase, windowPhase, gaussianPhase, sigmoidPhase, widthToConcentration, minutesToPhaseWidth } from '../utils';
import { getMenstrualHormones } from '../../domain/subject';

/**
 * CORTISOL
 * dCortisol/dt = k2 * CRH - k3 * cortisol
 */
export const cortisol: UnifiedSignalDefinition = {
  key: 'cortisol',
  label: 'Cortisol',
  unit: 'µg/dL',
  description: 'Serum cortisol concentration.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const CAR = gaussianPhase(p, hourToPhase(8.75), 1.5); // Cortisol Awakening Response (8:45 AM)
      const dayComponent = windowPhase(p, hourToPhase(8), hourToPhase(20), 0.5);
      return 2.0 + 18.0 * CAR + 4.0 * dayComponent;
    },
    tau: 20, // 1/0.05
    production: [
      // k2 * CRH
      { source: 'constant', coefficient: 0.5, transform: (_, state) => state.auxiliary.crhPool ?? 0 }
    ],
    clearance: [], // Handled by tau/setpoint
    couplings: [
      // Analytical was 0.2. 0.2 / 20 = 0.01
      { source: 'orexin', effect: 'stimulate', strength: 0.01 },
      // Analytical was -0.14. 0.14 / 20 = 0.007
      { source: 'melatonin', effect: 'inhibit', strength: 0.007 },
      // Analytical was -0.09. 0.09 / 20 = 0.0045
      { source: 'gaba', effect: 'inhibit', strength: 0.0045 },
    ]
  },
  initialValue: (ctx) => ctx.isAsleep ? 5 : 12,
  min: 0,
  max: 50,
  display: {
    color: '#ef4444',
    referenceRange: { min: 5, max: 25 }
  }
};

/**
 * ADRENALINE (Epinephrine)
 * Acute arousal drive
 */
export const adrenaline: UnifiedSignalDefinition = {
  key: 'adrenaline',
  label: 'Adrenaline',
  unit: 'pg/mL',
  description: 'Plasma epinephrine concentration.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      return 30.0 + 80.0 * gaussianPhase(p, hourToPhase(10), 2.0); // Mid-morning peak
    },
    tau: 5, // Very fast dynamics (5 min)
    production: [],
    clearance: [
      { type: 'linear', rate: 0.2 }
    ],
    couplings: [
      // Analytical was 2.0. 2.0 / 5 = 0.4
      { source: 'orexin', effect: 'stimulate', strength: 0.4 },
      // 0.2 / 0.2 = 1.0
      { source: 'dopamine', effect: 'stimulate', strength: 1.0 },
      // Analytical was -1.5. 1.5 / 5 = 0.3
      { source: 'gaba', effect: 'inhibit', strength: 0.3 },
    ]
  },
  initialValue: 30,
  min: 0,
  max: 1000,
  display: {
    color: '#f97316',
    referenceRange: { min: 10, max: 100 }
  }
};

/**
 * LEPTIN
 */
export const leptin: UnifiedSignalDefinition = {
  key: 'leptin',
  label: 'Leptin',
  unit: 'ng/mL',
  description: 'Serum leptin.',
  dynamics: {
    setpoint: (ctx) => 15.0 + 5.0 * Math.cos((ctx.circadianMinuteOfDay / 60 - 24) * Math.PI / 12),
    tau: 1440,
    production: [],
    clearance: [],
    couplings: [
      { source: 'insulin', effect: 'stimulate', strength: 0.05 }
    ]
  },
  initialValue: 15,
  display: { 
    color: '#10b981',
    referenceRange: { min: 2, max: 15 } 
  }
};

/**
 * GHRELIN
 */
export const ghrelin: UnifiedSignalDefinition = {
  key: 'ghrelin',
  label: 'Ghrelin',
  unit: 'pg/mL',
  description: 'Active ghrelin.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const preMeal = gaussianPhase(p, hourToPhase(8.5), 1.0) + gaussianPhase(p, hourToPhase(13.0), 1.0) + gaussianPhase(p, hourToPhase(19.0), 1.0);
      return 400 + 600 * preMeal;
    },
    tau: 60,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.02, transform: (_, state) => state.signals.glucose > 120 ? 2.0 : 1.0 }
    ],
    couplings: [
      { source: 'leptin', effect: 'inhibit', strength: 0.25 }, // -15.0 / 60 = 0.25
      { source: 'insulin', effect: 'inhibit', strength: 0.033 }, // -2.0 / 60 = 0.033
      { source: 'progesterone', effect: 'stimulate', strength: 0.33 }, // 20.0 / 60 = 0.33
    ]
  },
  initialValue: 500,
  display: { 
    color: '#f59e0b',
    referenceRange: { min: 500, max: 1500 }
  }
};

/**
 * THYROID (Proxy)
 */
export const thyroid: UnifiedSignalDefinition = {
  key: 'thyroid',
  label: 'Thyroid',
  unit: 'pmol/L',
  description: 'Free T4 proxy.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const active = windowPhase(p, hourToPhase(8), hourToPhase(23), minutesToPhaseWidth(80));
      const midday = gaussianPhase(p, hourToPhase(12), widthToConcentration(360));
      const nightDip = gaussianPhase(p, hourToPhase(2.0), widthToConcentration(300));
      return 1.0 + 2.0 * active + 1.5 * midday - 1.2 * nightDip;
    },
    tau: 43200, // 1 month dynamics
    production: [],
    clearance: [],
    couplings: [
      { source: 'cortisol', effect: 'inhibit', strength: 0.0001 }, // -0.08 / 43200 (approx)
      { source: 'leptin', effect: 'stimulate', strength: 0.0001 }, // 0.1 / 43200
    ]
  },
  initialValue: 1.0,
  display: { 
    color: '#fbbf24',
    referenceRange: { min: 10, max: 25 }
  }
};

/**
 * GROWTH HORMONE
 */
export const growthHormone: UnifiedSignalDefinition = {
  key: 'growthHormone',
  label: 'Growth Hormone',
  unit: 'ng/mL',
  description: 'Serum growth hormone.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const sleepOnset = gaussianPhase(p, hourToPhase(23.5), widthToConcentration(120));
      const rebound = gaussianPhase(p, hourToPhase(3.0), widthToConcentration(90));
      return 0.5 + 8.0 * (sleepOnset + 0.6 * rebound);
    },
    tau: 20,
    production: [
      { source: 'constant', coefficient: 1.0, transform: (_, state) => state.auxiliary.ghReserve ?? 0.8 }
    ],
    clearance: [
      { type: 'linear', rate: 0.05 }
    ],
    couplings: [
      { source: 'gaba', effect: 'stimulate', strength: 0.002 }, // 0.04 / 20 = 0.002
      { source: 'ghrelin', effect: 'stimulate', strength: 0.0005 }, // 0.01 / 20 = 0.0005
      { source: 'cortisol', effect: 'inhibit', strength: 0.0075 }, // -0.15 / 20 = 0.0075
    ]
  },
  initialValue: 0.5,
  display: { 
    color: '#6366f1',
    referenceRange: { min: 0.1, max: 10 }
  }
};

export const ghReserve: AuxiliaryDefinition = {
  key: 'ghReserve',
  dynamics: {
    setpoint: (ctx) => 0.8,
    tau: 1440,
    production: [
      { source: 'constant', coefficient: 0.001, transform: (_, state) => 0.8 - (state.auxiliary.ghReserve ?? 0.8) }
    ],
    clearance: []
  },
  initialValue: 0.8
};

/**
 * OXYTOCIN
 */
export const oxytocin: UnifiedSignalDefinition = {
  key: 'oxytocin',
  label: 'Oxytocin',
  unit: 'pg/mL',
  description: 'Plasma oxytocin.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const social = gaussianPhase(p, hourToPhase(11), widthToConcentration(260));
      const evening = sigmoidPhase(p, hourToPhase(19), minutesToPhaseWidth(40 * 4));
      return 1.5 + 4.0 * social + 5.0 * evening;
    },
    tau: 20,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.05 }
    ],
    couplings: [
      { source: 'endocannabinoid', effect: 'stimulate', strength: 0.002 }, // 0.04 / 20 = 0.002
      // 0.003 / 0.1 = 0.03
      { source: 'serotonin', effect: 'stimulate', strength: 0.03 },
    ]
  },
  initialValue: 5,
  display: { 
    color: '#ec4899',
    referenceRange: { min: 1, max: 10 }
  }
};

/**
 * PROLACTIN
 */
export const prolactin: UnifiedSignalDefinition = {
  key: 'prolactin',
  label: 'Prolactin',
  unit: 'ng/mL',
  description: 'Serum prolactin.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const prep = sigmoidPhase(p, hourToPhase(19), minutesToPhaseWidth(50 * 4));
      const sleepPulse = gaussianPhase(p, hourToPhase(2.0), widthToConcentration(120)) + 0.8 * gaussianPhase(p, hourToPhase(4.0), widthToConcentration(200));
      return 4.0 + 8.0 * prep + 12.0 * sleepPulse;
    },
    tau: 45,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.02 }
    ],
    couplings: [
      { source: 'gaba', effect: 'stimulate', strength: 0.0011 }, // 0.05 / 45 = 0.0011
      // 0.0022 / 0.2 = 0.011
      { source: 'dopamine', effect: 'inhibit', strength: 0.011 },
    ]
  },
  initialValue: 10,
  display: { 
    color: '#f472b6',
    referenceRange: { min: 5, max: 20 }
  }
};

/**
 * VASOPRESSIN (AVP)
 */
export const vasopressin: UnifiedSignalDefinition = {
  key: 'vasopressin',
  label: 'Vasopressin',
  unit: 'pg/mL',
  description: 'Plasma vasopressin.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const couple = gaussianPhase(p, hourToPhase(8.5), widthToConcentration(260));
      const nightRise = windowPhase(p, hourToPhase(23), hourToPhase(7), minutesToPhaseWidth(45));
      return 1.8 + 3.5 * couple + 3.5 * nightRise;
    },
    tau: 20,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.05 }
    ],
    couplings: []
  },
  initialValue: 5,
  display: { 
    color: '#3b82f6',
    referenceRange: { min: 1, max: 5 }
  }
};

/**
 * VIP
 */
export const vip: UnifiedSignalDefinition = {
  key: 'vip',
  label: 'VIP',
  unit: 'pg/mL',
  description: 'Vasoactive intestinal peptide.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const day = gaussianPhase(p, hourToPhase(12), widthToConcentration(300));
      const eveningSuppress = windowPhase(p, hourToPhase(20), hourToPhase(8), minutesToPhaseWidth(35));
      return 20.0 + 50.0 * day - 25.0 * eveningSuppress;
    },
    tau: 30,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.03 }
    ],
    couplings: []
  },
  initialValue: 20,
  display: { 
    color: '#10b981',
    referenceRange: { min: 0, max: 100 }
  }
};

/**
 * TESTOSTERONE
 */
export const testosterone: UnifiedSignalDefinition = {
  key: 'testosterone',
  label: 'Testosterone',
  unit: 'ng/dL',
  description: 'Total serum testosterone.',
  dynamics: {
    setpoint: (ctx) => {
      // Age decline: ~1% per year after 30
      const ageFactor = Math.max(0.5, 1 - Math.max(0, ctx.subject.age - 30) * 0.01);
      
      if (ctx.subject.sex === 'male') {
        const p = minuteToPhase(ctx.circadianMinuteOfDay);
        const circadian = 400.0 + 300.0 * gaussianPhase(p, hourToPhase(8), widthToConcentration(240));
        return circadian * ageFactor;
      } else {
        return 40.0 * ageFactor;
      }
    },
    tau: 60,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.015 }
    ],
    couplings: []
  },
  initialValue: 500,
  display: { 
    color: '#1e3a8a',
    referenceRange: { min: 300, max: 1000 }
  }
};

/**
 * ESTROGEN
 */
export const estrogen: UnifiedSignalDefinition = {
  key: 'estrogen',
  label: 'Estrogen',
  unit: 'pg/mL',
  description: 'Serum estradiol.',
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === 'male') return 30.0;
      
      // Cycle dynamics
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay = (ctx.subject.cycleDay || 0) + Math.floor(ctx.circadianMinuteOfDay / 1440); // Simplified progression
      const effectiveDay = cycleDay % cycleLength;
      
      return 20.0 + 250.0 * getMenstrualHormones(effectiveDay, cycleLength).estrogen;
    },
    tau: 120,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.008 }
    ],
    couplings: []
  },
  initialValue: 40,
  display: { 
    color: '#db2777',
    referenceRange: { min: 50, max: 400 }
  }
};

/**
 * PROGESTERONE
 */
export const progesterone: UnifiedSignalDefinition = {
  key: 'progesterone',
  label: 'Progesterone',
  unit: 'ng/mL',
  description: 'Serum progesterone.',
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === 'male') return 0.2;
      
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay = (ctx.subject.cycleDay || 0) + Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      
      return 0.2 + 18.0 * getMenstrualHormones(effectiveDay, cycleLength).progesterone;
    },
    tau: 120,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.008 }
    ],
    couplings: []
  },
  initialValue: 0.5,
  display: { 
    color: '#9d174d',
    referenceRange: { min: 0.1, max: 20 }
  }
};

/**
 * LH
 */
export const lh: UnifiedSignalDefinition = {
  key: 'lh',
  label: 'LH',
  unit: 'IU/L',
  description: 'Luteinizing hormone.',
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === 'male') return 5.0;
      
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay = (ctx.subject.cycleDay || 0) + Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      
      return 2.0 + 30.0 * getMenstrualHormones(effectiveDay, cycleLength).lh;
    },
    tau: 60,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.02 }
    ],
    couplings: []
  },
  initialValue: 5,
  display: { 
    color: '#8b5cf6',
    referenceRange: { min: 2, max: 15 }
  }
};

/**
 * FSH
 */
export const fsh: UnifiedSignalDefinition = {
  key: 'fsh',
  label: 'FSH',
  unit: 'IU/L',
  description: 'Follicle-stimulating hormone.',
  dynamics: {
    setpoint: (ctx) => {
      if (ctx.subject.sex === 'male') return 5.0;
      
      const cycleLength = ctx.subject.cycleLength || 28;
      const cycleDay = (ctx.subject.cycleDay || 0) + Math.floor(ctx.circadianMinuteOfDay / 1440);
      const effectiveDay = cycleDay % cycleLength;
      
      return 3.0 + 12.0 * getMenstrualHormones(effectiveDay, cycleLength).fsh;
    },
    tau: 60,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.02 }
    ],
    couplings: []
  },
  initialValue: 5,
  display: { 
    color: '#a78bfa',
    referenceRange: { min: 1, max: 10 }
  }
};

/**
 * GLP-1
 */
export const glp1: UnifiedSignalDefinition = {
  key: 'glp1',
  label: 'GLP-1',
  unit: 'pmol/L',
  description: 'Active GLP-1.',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const bk = gaussianPhase(p, hourToPhase(8.5), widthToConcentration(70));
      const ln = gaussianPhase(p, hourToPhase(13.0), widthToConcentration(80));
      const dn = gaussianPhase(p, hourToPhase(19.0), widthToConcentration(90));
      return Math.min(25, 2.0 + 12.0 * (bk + 0.9 * ln + 0.8 * dn));
    },
    tau: 30,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.03 }
    ],
    couplings: [
      { source: 'insulin', effect: 'stimulate', strength: 0.0007 }, // 0.02 / 30 = 0.00067
    ]
  },
  initialValue: 5,
  display: { 
    color: '#059669',
    referenceRange: { min: 5, max: 50 }
  }
};

// --- Auxiliary Variables ---

/**
 * CRH POOL
 * dCRH/dt = drive - feedback - 0.1 * CRH
 */
export const crhPool: AuxiliaryDefinition = {
  key: 'crhPool',
  dynamics: {
    setpoint: (ctx) => {
      const hour = ctx.circadianMinuteOfDay / 60;
      return 0.5 + 0.5 * Math.cos((hour - 8) * Math.PI / 12);
    },
    tau: 10, // 1/0.1
    production: [],
    clearance: [
      { 
        type: 'linear', 
        rate: 0.1, 
        transform: (_, state) => {
          const cortisol = state.signals.cortisol;
          const setpoint = 12; // cortisolSetpoint
          return Math.max(0, cortisol - setpoint);
        }
      }
    ]
  },
  initialValue: 1.0
};

/**
 * CORTISOL INTEGRAL (Allostatic Load)
 */
export const cortisolIntegral: AuxiliaryDefinition = {
  key: 'cortisolIntegral',
  dynamics: {
    setpoint: (ctx) => 0,
    tau: 10000, // Very slow decay
    production: [
      { 
        source: 'constant', 
        coefficient: 1.0, 
        transform: (_, state) => {
          const cortisol = state.signals.cortisol;
          return cortisol > 18 ? 0.0001 * (cortisol - 12) : 0;
        }
      }
    ],
    clearance: [
      { type: 'linear', rate: 0.00005 }
    ]
  },
  initialValue: 0
};