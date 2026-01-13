import type { UnifiedSignalDefinition, AuxiliaryDefinition } from '@/types/unified';
import { minuteToPhase, hourToPhase, windowPhase, gaussianPhase, sigmoidPhase } from '../utils';

/**
 * DOPAMINE
 */
export const dopamine: UnifiedSignalDefinition = {
  key: 'dopamine',
  label: 'Dopamine',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const morningDrive = gaussianPhase(p, hourToPhase(10.5), 1.0);
      const afternoonPlateau = gaussianPhase(p, hourToPhase(13.5), 0.8);
      const eveningDrop = gaussianPhase(p, hourToPhase(22), 0.5);
      return 20.0 + 45.0 * morningDrive + 20.0 * afternoonPlateau - 15.0 * eveningDrop;
    },
    tau: 120, // 2 hour baseline dynamics
    production: [
      // Release from vesicles: proportional to activity * vesicles
      { 
        source: 'constant', 
        coefficient: 0.002, 
        transform: (_, state) => {
          const vesicles = state.auxiliary.dopamineVesicles ?? 0.8;
          const activity = 1.0; // TODO: link to firing rate
          return activity * vesicles * 50; 
        } 
      }
    ],
    clearance: [
      { type: 'enzyme-dependent', rate: 0.002, enzyme: 'DAT' },
      { type: 'enzyme-dependent', rate: 0.001, enzyme: 'MAO_B' },
    ],
    couplings: [
      // Analytical was 0.5. 0.5 / 120 = 0.0042
      { source: 'cortisol', effect: 'stimulate', strength: 0.0042 },
    ]
  },
  initialValue: 50,
  min: 0,
  max: 200,
  display: {
    color: '#f97316',
    referenceRange: { min: 30, max: 80 }
  }
};

/**
 * SEROTONIN
 */
export const serotonin: UnifiedSignalDefinition = {
  key: 'serotonin',
  label: 'Serotonin',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const lateMorning = gaussianPhase(p, hourToPhase(11), 1.0);
      const afternoon = gaussianPhase(p, hourToPhase(15), 0.8);
      return 20.0 + 25.0 * (lateMorning + afternoon);
    },
    tau: 180,
    production: [
      { 
        source: 'constant', 
        coefficient: 0.002, 
        transform: (_, state) => {
          const precursor = state.auxiliary.serotoninPrecursor ?? 0.7;
          return precursor * 40;
        } 
      }
    ],
    clearance: [
      { type: 'enzyme-dependent', rate: 0.002, enzyme: 'SERT' },
      { type: 'enzyme-dependent', rate: 0.001, enzyme: 'MAO_A' },
    ],
    couplings: [
      { source: 'vip', effect: 'stimulate', strength: 0.0016 },
      // Analytical was -0.5. 0.5 / 180 = 0.0028
      { source: 'cortisol', effect: 'inhibit', strength: 0.0028 },
    ]
  },
  initialValue: 50,
  min: 0,
  max: 200,
  display: {
    color: '#8b5cf6',
    referenceRange: { min: 30, max: 80 }
  }
};

// --- Auxiliary Variables ---

export const dopamineVesicles: AuxiliaryDefinition = {
  key: 'dopamineVesicles',
  dynamics: {
    setpoint: (ctx) => 0.8,
    tau: 100, // Replenishment time
    production: [
      { 
        source: 'constant', 
        coefficient: 0.01, 
        transform: (_, state) => {
          const V = state.auxiliary.dopamineVesicles ?? 0.8;
          return 0.8 * (1 - V);
        }
      }
    ],
    clearance: [
      { 
        type: 'linear', 
        rate: 0.005, 
        transform: (_, state) => 1.0 // activity
      }
    ]
  },
  initialValue: 0.8
};

/**
 * NOREPINEPHRINE
 */
export const norepi: UnifiedSignalDefinition = {
  key: 'norepi',
  label: 'Norepinephrine',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(8.5), 1.0);
      const stressResponse = gaussianPhase(p, hourToPhase(9), 0.5);
      return 25.0 + 40.0 * wakeDrive + 15.0 * stressResponse;
    },
    tau: 90,
    production: [
      { 
        source: 'constant', 
        coefficient: 0.002, 
        transform: (_, state) => {
          const vesicles = state.auxiliary.norepinephrineVesicles ?? 0.8;
          return vesicles * 45;
        } 
      }
    ],
    clearance: [
      { type: 'enzyme-dependent', rate: 0.002, enzyme: 'NET' },
      { type: 'enzyme-dependent', rate: 0.001, enzyme: 'MAO_A' },
    ],
    couplings: [
      { source: 'cortisol', effect: 'stimulate', strength: 0.005 },
      { source: 'orexin', effect: 'stimulate', strength: 0.008 },
    ]
  },
  initialValue: 40,
  min: 0,
  max: 200,
  display: {
    color: '#ef4444',
    referenceRange: { min: 20, max: 70 }
  }
};

export const norepinephrineVesicles: AuxiliaryDefinition = {
  key: 'norepinephrineVesicles',
  dynamics: {
    setpoint: (ctx) => 0.8,
    tau: 120,
    production: [
      { source: 'constant', coefficient: 0.008, transform: (_, state) => 0.8 - (state.auxiliary.norepinephrineVesicles ?? 0.8) }
    ],
    clearance: [
      { type: 'linear', rate: 0.004 }
    ]
  },
  initialValue: 0.8
};

/**
 * GABA
 */
export const gaba: UnifiedSignalDefinition = {
  key: 'gaba',
  label: 'GABA',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const eveningRise = sigmoidPhase(p, hourToPhase(21), 1.0);
      return 40.0 + 30.0 * eveningRise;
    },
    tau: 120,
    production: [
      { 
        source: 'constant', 
        coefficient: 0.0015, 
        transform: (_, state) => (state.auxiliary.gabaPool ?? 0.7) * 50
      }
    ],
    clearance: [
      { type: 'enzyme-dependent', rate: 0.002, enzyme: 'GAT1' }
    ],
    couplings: [
      { source: 'melatonin', effect: 'stimulate', strength: 0.1 },
      { source: 'glutamate', effect: 'inhibit', strength: 0.05 },
    ]
  },
  initialValue: 50,
  min: 0,
  max: 150,
  display: {
    color: '#3b82f6',
    referenceRange: { min: 40, max: 90 }
  }
};

export const gabaPool: AuxiliaryDefinition = {
  key: 'gabaPool',
  dynamics: {
    setpoint: (ctx) => 0.7,
    tau: 240,
    production: [
      { source: 'constant', coefficient: 0.004, transform: (_, state) => 0.7 - (state.auxiliary.gabaPool ?? 0.7) }
    ],
    clearance: [
      { type: 'linear', rate: 0.001 }
    ]
  },
  initialValue: 0.7
};

/**
 * GLUTAMATE
 */
export const glutamate: UnifiedSignalDefinition = {
  key: 'glutamate',
  label: 'Glutamate',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const wakeDrive = sigmoidPhase(p, hourToPhase(9), 1.0);
      return 30.0 + 50.0 * wakeDrive;
    },
    tau: 60,
    production: [
      { 
        source: 'constant', 
        coefficient: 0.003, 
        transform: (_, state) => (state.auxiliary.glutamatePool ?? 0.7) * 60
      }
    ],
    clearance: [
      { type: 'enzyme-dependent', rate: 0.004, enzyme: 'GLT1' }
    ],
    couplings: [
      { source: 'norepi', effect: 'stimulate', strength: 0.05 },
      { source: 'gaba', effect: 'inhibit', strength: 0.1 },
    ]
  },
  initialValue: 60,
  min: 0,
  max: 200,
  display: {
    color: '#facc15',
    referenceRange: { min: 40, max: 100 }
  }
};

export const glutamatePool: AuxiliaryDefinition = {
  key: 'glutamatePool',
  dynamics: {
    setpoint: (ctx) => 0.7,
    tau: 180,
    production: [
      { source: 'constant', coefficient: 0.005, transform: (_, state) => 0.7 - (state.auxiliary.glutamatePool ?? 0.7) }
    ],
    clearance: [
      { type: 'linear', rate: 0.002 }
    ]
  },
  initialValue: 0.7
};

/**
 * ACETYLCHOLINE
 */
export const acetylcholine: UnifiedSignalDefinition = {
  key: 'acetylcholine',
  label: 'Acetylcholine',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const remDrive = ctx.isAsleep ? 0.8 : 0.4; // Simplified
      const wakeFocus = windowPhase(p, hourToPhase(10), hourToPhase(12), 0.5);
      return 30.0 + 40.0 * wakeFocus + 30.0 * remDrive;
    },
    tau: 45,
    production: [],
    clearance: [
      { type: 'enzyme-dependent', rate: 0.02, enzyme: 'AChE' }
    ],
    couplings: [
      { source: 'orexin', effect: 'stimulate', strength: 0.15 }
    ]
  },
  initialValue: 40,
  min: 0,
  max: 150,
  display: {
    color: '#22c55e',
    referenceRange: { min: 30, max: 90 }
  }
};

/**
 * ENDOCANNABINOID (e.g., Anandamide)
 */
export const endocannabinoid: UnifiedSignalDefinition = {
  key: 'endocannabinoid',
  label: 'Endocannabinoid',
  unit: '% baseline',
  dynamics: {
    setpoint: (ctx) => {
      const p = minuteToPhase(ctx.circadianMinuteOfDay);
      const morningRise = gaussianPhase(p, hourToPhase(9), 2.0);
      return 20.0 + 30.0 * morningRise;
    },
    tau: 60,
    production: [],
    clearance: [
      { type: 'linear', rate: 0.02 }
    ],
    couplings: [
      { source: 'dopamine', effect: 'stimulate', strength: 0.05 },
      { source: 'cortisol', effect: 'inhibit', strength: 0.05 },
    ]
  },
  initialValue: 25,
  min: 0,
  max: 150,
  display: {
    color: '#065f46',
    referenceRange: { min: 10, max: 60 }
  }
};

export const serotoninPrecursor: AuxiliaryDefinition = {

  key: 'serotoninPrecursor',

  dynamics: {

    setpoint: (ctx) => 0.7,

    tau: 480, // Slow replenishment

    production: [

      // Tryptophan from diet: simplified meal effect

      {

        source: 'constant',

        coefficient: 1.0,

        transform: (_, state, ctx) => {

          // In the unified model, we can check for recent food interventions

          // But for now, let's use a simplified constant drive if insulin is high

          // (representing the insulin-mediated transport of tryptophan)

          const insulin = state.signals.insulin;

          return insulin > 15 ? 0.0005 * (insulin - 15) : 0;

        }

      }

    ],

    clearance: [

      { type: 'linear', rate: 0.001 }

    ]

  },

  initialValue: 0.7

};
