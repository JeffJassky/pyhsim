# Refactor Plan

The core change is moving away from `BaselineSpec` (which pre-defines rhythms) toward a `KineticsSpec` that defines the differential equation for each signal: `d/dt = Production(inputs) - Clearance`. This aligns with the Pharmacokinetic/Pharmacodynamic (PK/PD) modeling approach, which is well-established for describing these physiological systems (1). Below is a structured breakdown of how the TypeScript shapes evolve to implement the research recommendations. All numbered citations refer to the detailed evidence summarized in `plans/research.md`.

## 1. Core Architectural Shift: BaselineSpec ➔ KineticsSpec

`BaselineSpec` currently acts as a generator that produces a value for a given minute. Instead, each signal should become a state variable whose level is determined by its production and clearance rates. `SignalDef` loses the `baseline` property in favor of `kinetics`.

```ts
// Replaces BaselineSpec and defines d/dt for each signal
export interface KineticsSpec {
  production: {
    basalRate: number;
    drivers?: CouplingSpec; // replaces 'couplings'
    modulators?: ModulationSpec; // gain control by other signals
  };
  clearance: {
    kind: 'firstOrder' | 'michaelisMenten' | 'zeroOrder';
    halfLifeMin?: number; // e.g., 66 min for cortisol (6)
    Vmax?: number;
    Km?: number;
    VmaxModulators?: ModulationSpec; // insulin modulates glucose uptake (7)
  };
}

export interface ModulationSpec {
  source: Signal; // e.g., 'scn_vasopressin'
  mapping: ResponseSpec; // response function for gain control
  description: string; // e.g., "SCN gates 24h adrenal sensitivity to ACTH"
}

export interface SignalDef {
  key: Signal;
  label: string;
  group: SignalGroup;
  kinetics: KineticsSpec; // replaces `baseline`
  // ... semantics, description, display config, etc.
}
```

## 2. Tier 1: Modeling the SCN as a True Oscillator

SCN signals (melatonin, VIP, vasopressin) are the clock itself and should be defined by a dynamic oscillator model rather than a `KineticsSpec`. Implement the Forger-Kronauer limit-cycle oscillator for Process P (pacemaker) and Process L (light adaptation) (10).

```ts
export interface ScnOscillatorDef {
  key: 'SCN_PACEMAKER';
  processP: {
    periodTau: number; // intrinsic period, ~24.2h (12)
    // ... remaining differential equation params
  };
  processL: {
    adaptationRate: number;
    // ... light processing params
  };
  outputs: {
    signal: 'melatonin' | 'vasopressin' | 'vip';
    mapping: string; // e.g., "x > 0 ? k * x : 0"
  };
}

export const MelatoninDef: SignalDef = {
  key: 'melatonin',
  label: 'Melatonin',
  group: 'SCN',
  kinetics: {
    production: {
      basalRate: 0,
      drivers: /* driven by SCN */,
      modulators: /* acute light suppression (15) */,
    },
  },
  clearance: {
    kind: 'firstOrder',
    halfLifeMin: 50, // ~45–66 minutes (16)
  },
  // ...
};
```

## 3. Tier 2: Upgrading ResponseSpec for Nonlinear Couplings

`ResponseSpec` must support the nonlinear functions identified in the research because linear gains cannot capture high-fidelity behavior. Add Hill, inhibitory Hill, Michaelis-Menten, and logistic mappings for dose-response curves (7, 20).

```ts
export type ResponseSpec =
  | { kind: 'linear'; gain: number }
  | {
      kind: 'hill'; // stimulatory (e.g., ACTH -> Cortisol (20))
      Emax: number;
      EC50: number;
      n: number;
    }
  | {
      kind: 'ihill'; // inhibitory (e.g., Light -> Melatonin)
      Imax: number;
      IC50: number;
      n: number;
    }
  | {
      kind: 'michaelisMenten'; // e.g., Glucose uptake (8)
      Vmax: number;
      Km: number;
    }
  | { kind: 'logistic'; L: number; k: number; x0: number };

export const CortisolDef: SignalDef = {
  key: 'cortisol',
  kinetics: {
    production: {
      basalRate: 0.1,
      drivers: {
        kind: 'hill',
        Emax: /* value */,
        EC50: 10.0,
        n: 1.5,
      },
      description: 'ACTH nonlinearly stimulates cortisol synthesis. (26)',
      modulators: /* ... */,
    },
  },
  clearance: {
    kind: 'firstOrder',
    halfLifeMin: 66,
  },
  // ...
};
```

## 4. Tier 2: Handling HPA Feedback and State-Dependent Orexin

Two major report findings need dedicated shapes: dual-receptor HPA feedback and state-dependent orexin activity (28–32).

```ts
// Dual-receptor cortisol feedback (MR vs GR)
export const ActhDef: SignalDef = {
  key: 'ACTH',
  kinetics: {
    production: {
      basalRate: 0,
      drivers: /* upstream drive */,
      modulators: {
        mr: { kind: 'ihill', Imax: 0.3, IC50: 2.0, n: 1 },
        gr: { kind: 'ihill', Imax: 1.0, IC50: 20.0, n: 2 }, // stress range (29)
      },
      description: 'Cortisol feedback via high (MR) and low (GR) affinity. (29)',
    },
  },
  clearance: { kind: 'firstOrder', halfLifeMin: 20 },
  // ...
};

// New source options for state-mapped and oscillator-driven signals
export type SignalSource =
  | { kind: 'dynamic'; kinetics: KineticsSpec }
  | { kind: 'oscillator'; oscillatorKey: 'SCN_PACEMAKER'; outputKey: 'melatonin' | 'vasopressin' | 'vip' }
  | { kind: 'stateMapped'; sourceState: 'SleepState' | 'CognitiveLoad'; map: Record<string, number> }
  | { kind: 'input'; key: 'INPUT_LIGHT_LUX' | 'INPUT_MEAL_CALORIES' };

export interface SignalDef {
  key: Signal;
  label: string;
  group: SignalGroup;
  source: SignalSource; // replaces `baseline` and `kinetics`
  // ...
}

// State-mapped orexin implementation
export const OrexinDef: SignalDef = {
  key: 'orexin',
  label: 'Orexin (Neuronal Activity)',
  group: 'Neuro',
  source: {
    kind: 'stateMapped',
    sourceState: 'SleepState',
    map: {
      ACTIVE_WAKE: 1.0,
      QUIET_WAKE: 0.17,
      SWS: 0.01,
      REM: 0.01,
    },
  },
  description: {
    physiology:
      'Neuronal activity, not plasma level. High firing during wakefulness and silent during sleep. (31, 32)',
  },
  // ...
};
```

## 5. Tier 3: Adding Neuro-Immune Systems

Add new cytokine signals (e.g., IL-6, TNF-α) as dynamic pools defined with `KineticsSpec`. Their couplings close the sickness-behavior loop via orexin modulation (36, 37).

```ts
export const IL6Def: SignalDef = {
  key: 'il6',
  label: 'Interleukin-6',
  group: 'Immune',
  source: {
    kind: 'dynamic',
    kinetics: {
      production: {
        basalRate: 0.05,
        drivers: /* immune drive */,
        modulators: [
          { source: 'SCN_PACEMAKER', mapping: /* ... */, description: 'SCN gates 24h rhythm.' },
          {
            source: 'cortisol',
            mapping: { kind: 'ihill', Imax: 1.0, IC50: 15.0, n: 1 },
            description: 'Cortisol suppresses inflammatory cytokine production. (36)',
          },
        ],
      },
      clearance: { kind: 'firstOrder', halfLifeMin: 60 },
    },
  },
  // ...
};

export const OrexinDef_Dynamic: SignalDef = {
  key: 'orexin',
  label: 'Orexin (Neuronal Activity)',
  group: 'Neuro',
  source: {
    kind: 'dynamic',
    kinetics: {
      production: {
        basalRate: 0,
        drivers: /* sleep-state drive */,
        modulators: [
          {
            source: 'il6',
            mapping: { kind: 'ihill', Imax: 1.0, IC50: 5.0, n: 1 },
            description: 'Orexin suppression by elevated cytokines causes fatigue. (37)',
          },
        ],
      },
      clearance: { kind: 'firstOrder', halfLifeMin: 10 },
    },
  },
  // ...
};
```

This architecture is intentionally more complex, but it mirrors the underlying biology and upgrades the model from a playback system to a predictive, dynamic engine. For source details, quantitative parameters, and the supporting rationale for each numbered citation, see `plans/research.md`.
