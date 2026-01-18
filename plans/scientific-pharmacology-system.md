# Scientific Pharmacology System

## Problem Statement

The current system has:

- **Magic numbers** (`intrinsicEfficacy: 30`) with no scientific basis
- **Inconsistent units** (dopamine in "% baseline", glucose in mg/dL)
- **No validation** against published literature
- **Duplicate/conflicting parameters** across files
- **No way to incorporate real research** into the simulation

This makes the system useless for medical accuracy.

---

## Design Principles

### 1. Calibration-First, Not Parameter-First

**Current (wrong):**

```typescript
{ target: "DAT", Ki: 0.01, intrinsicEfficacy: 30 }  // What does 30 mean?
```

**Correct:**

```typescript
{
  target: "DAT",
  binding: { Ki_nM: 34, source: "Volkow 1998" },
  calibration: {
    referenceDose_mg: 10,
    expectedEffect: { signal: "dopamine", change: "+250%", source: "Volkow 2001" }
  }
}
```

The system calculates whatever internal parameters are needed to produce the expected effect at the reference dose.

### 2. Units as First-Class Citizens

Every value carries its unit. No implicit conversions.

```typescript
type Concentration = { value: number; unit: "nM" | "µM" | "mg/L" | "µg/dL" };
type Time = { value: number; unit: "min" | "hr" | "day" };
type Mass = { value: number; unit: "mg" | "g" | "µg" };
```

### 3. Literature as the Source of Truth

Every parameter either:

- Has a citation (journal, year, DOI)
- Is explicitly labeled `empirical: true` with reasoning

```typescript
interface SourcedValue<T> {
  value: T;
  source: Citation | { empirical: true; reasoning: string };
  uncertainty?: { low: T; high: T };  // Range from literature
}
```

### 4. Signals Have Real Units

No more "% baseline". Every signal is a real biomarker with physiological units and reference ranges.

```typescript
interface SignalDefinition {
  key: string;
  unit: PhysiologicalUnit;
  compartment: "plasma" | "CSF" | "synaptic" | "intracellular";
  referenceRange: {
    low: number;
    high: number;
    population: "healthy adult";
    source: Citation;
  };
  measurementMethod?: string;  // "ELISA", "microdialysis", "mass spec"
}
```

### 5. DRY Through Composition

Instead of duplicating receptor/transporter/signal definitions:

```
┌─────────────────────────────────────────────────────────────┐
│                    LITERATURE LAYER                         │
│  - Binding affinities (Ki, Kd, EC50)                       │
│  - Reference ranges for biomarkers                          │
│  - Published dose-response data                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BIOLOGY LAYER                            │
│  - Receptor definitions (signal couplings)                  │
│  - Transporter definitions (clearance targets)              │
│  - Enzyme definitions (metabolism pathways)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DRUG LAYER                               │
│  - Molecule properties (MW, pKa, logP)                      │
│  - PK parameters (bioavailability, Vd, clearance)           │
│  - Target binding (references Biology Layer)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CALIBRATION LAYER                        │
│  - Maps drug → expected clinical effect                     │
│  - Computes internal parameters to match literature         │
│  - Validates against published dose-response curves         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTERVENTION LAYER                       │
│  - User-facing definitions (dose, timing, route)            │
│  - References Drug Layer                                    │
│  - No pharmacology parameters here - just references        │
└─────────────────────────────────────────────────────────────┘
```

---

## New Directory Structure

```
src/models/
├── literature/                    # Citations and sourced data
│   ├── citations.ts              # Citation type and registry
│   ├── binding-affinities.ts     # Ki/Kd/EC50 from literature
│   ├── reference-ranges.ts       # Biomarker normal ranges
│   └── dose-response-studies.ts  # Published clinical data
│
├── biology/                       # Physiological definitions
│   ├── signals/                  # Biomarker definitions
│   │   ├── index.ts
│   │   ├── neurotransmitters.ts  # DA, 5HT, NE, ACh, GABA, Glu
│   │   ├── hormones.ts           # Cortisol, insulin, etc.
│   │   └── metabolites.ts        # Glucose, ketones, etc.
│   ├── receptors/                # Receptor definitions
│   │   ├── index.ts
│   │   ├── dopaminergic.ts       # D1, D2, D3, D4, D5
│   │   ├── serotonergic.ts       # 5HT1A, 5HT2A, etc.
│   │   └── ...
│   ├── transporters/             # Transporter definitions
│   │   ├── index.ts
│   │   └── monoamine.ts          # DAT, NET, SERT
│   ├── enzymes/                  # Metabolic enzymes
│   │   ├── index.ts
│   │   └── cyp450.ts             # CYP1A2, CYP2D6, CYP3A4
│   └── pathways/                 # Signal coupling pathways
│       ├── index.ts
│       └── monoamine.ts          # DA synthesis → release → reuptake → metabolism
│
├── drugs/                         # Drug definitions (PK/PD)
│   ├── index.ts
│   ├── types.ts                  # DrugDefinition interface
│   ├── stimulants/
│   │   ├── caffeine.ts
│   │   └── methylphenidate.ts
│   ├── supplements/
│   │   ├── melatonin.ts
│   │   └── magnesium.ts
│   └── ...
│
├── calibration/                   # Calibration system
│   ├── index.ts
│   ├── dose-response.ts          # Compute parameters from expected effects
│   ├── validation.ts             # Compare simulation to literature
│   └── targets/                  # Per-drug calibration targets
│       ├── caffeine.ts           # Expected effects at reference doses
│       └── methylphenidate.ts
│
├── simulation/                    # ODE system (renamed from unified/)
│   ├── index.ts
│   ├── solver.ts                 # RK4 integrator
│   ├── state.ts                  # SimulationState type
│   └── dynamics/                 # Signal dynamics
│       ├── index.ts
│       └── ...
│
├── interventions/                 # User-facing intervention definitions
│   ├── index.ts
│   ├── types.ts
│   └── ...                       # Simplified - references drugs/
│
└── subject/                       # Subject/patient model
    ├── index.ts
    ├── demographics.ts           # Age, sex, weight, height
    ├── genetics.ts               # CYP450 genotypes, etc.
    └── physiology.ts             # Derived: TBW, LBM, GFR, etc.
```

---

## Core Type Definitions

### Citation

```typescript
interface Citation {
  authors: string;      // "Volkow ND et al."
  title: string;
  journal: string;
  year: number;
  doi?: string;
  pmid?: number;
  notes?: string;       // What specifically was cited
}

// Usage
const VOLKOW_2001: Citation = {
  authors: "Volkow ND et al.",
  title: "Therapeutic doses of oral methylphenidate significantly increase extracellular dopamine",
  journal: "J Neurosci",
  year: 2001,
  doi: "10.1523/JNEUROSCI.21-02-j0001.2001",
  notes: "Microdialysis study showing DA increase with MPH"
};
```

### SourcedValue

```typescript
type SourcedValue<T> =
  | { value: T; source: Citation; uncertainty?: { low: T; high: T } }
  | { value: T; empirical: true; reasoning: string };

// Usage
const caffeineA2aKi: SourcedValue<Concentration> = {
  value: { value: 2400, unit: "nM" },
  source: FREDHOLM_1999,
  uncertainty: {
    low: { value: 2400, unit: "nM" },
    high: { value: 10000, unit: "nM" }
  }
};
```

### Signal Definition

```typescript
interface SignalDefinition {
  key: string;
  name: string;

  // Physical properties
  unit: string;                    // "nM", "pg/mL", "mg/dL"
  compartment: Compartment;        // Where is this measured?

  // Reference data (from literature)
  referenceRange: SourcedValue<{ low: number; high: number }>;
  circadianVariation?: SourcedValue<{ amplitude: number; peakTime: number }>;

  // Dynamics (derived from physiology)
  halfLife: SourcedValue<Time>;    // Elimination/clearance half-life

  // No "tau" - computed from half-life
  // No "intrinsicEfficacy" - doesn't belong here
}

// Example
const DOPAMINE: SignalDefinition = {
  key: "dopamine",
  name: "Dopamine",
  unit: "nM",
  compartment: "synaptic",  // Extracellular in striatum
  referenceRange: {
    value: { low: 5, high: 20 },  // nM, basal extracellular
    source: PARSONS_2008,
    uncertainty: { low: { low: 2, high: 10 }, high: { low: 10, high: 50 } }
  },
  halfLife: {
    value: { value: 200, unit: "ms" },  // Synaptic clearance is fast!
    source: JONES_1998
  }
};
```

### Drug Definition

```typescript
interface DrugDefinition {
  key: string;
  name: string;

  molecule: {
    molarMass: SourcedValue<number>;  // g/mol
    pKa?: SourcedValue<number>;
    logP?: SourcedValue<number>;
  };

  pharmacokinetics: {
    bioavailability: SourcedValue<number>;  // 0-1
    volumeOfDistribution: SourcedValue<VolumeSpec>;
    halfLife: SourcedValue<Time>;
    clearance: ClearanceSpec;
  };

  pharmacodynamics: {
    targets: TargetBinding[];  // References receptors/transporters/enzymes
  };

  // Calibration data - the key innovation
  calibration: CalibrationTarget[];
}

interface TargetBinding {
  target: string;                    // References biology/receptors or biology/transporters
  mechanism: "agonist" | "antagonist" | "inhibitor" | "PAM" | "NAM";
  affinity: SourcedValue<Concentration>;  // Ki or EC50
  intrinsicActivity?: SourcedValue<number>;  // 0-1 for partial agonists
}

interface CalibrationTarget {
  description: string;
  dose: SourcedValue<Mass>;
  route: "oral" | "IV" | "sublingual" | "inhaled";
  expectedEffect: {
    signal: string;
    metric: "peak" | "AUC" | "steady_state";
    change: SourcedValue<EffectSize>;  // "+250%" or "absolute: 50 nM"
    timeframe?: SourcedValue<Time>;
  };
  source: Citation;
}
```

### Intervention Definition (Simplified)

```typescript
interface InterventionDefinition {
  key: string;
  label: string;
  icon: string;
  color: string;

  // Reference to drug definition - no PK/PD here!
  drug: string;  // Key into drugs registry

  // User-configurable parameters
  params: ParamDefinition[];

  // Display
  categories: string[];
  goals: string[];
}

// Example - much simpler than current
const CAFFEINE_INTERVENTION: InterventionDefinition = {
  key: "caffeine",
  label: "Caffeine",
  icon: "☕",
  color: "#8B4513",
  drug: "caffeine",  // References drugs/supplements/caffeine.ts
  params: [
    { key: "mg", label: "Dose (mg)", type: "slider", min: 25, max: 400, default: 100 }
  ],
  categories: ["supplements"],
  goals: ["energy", "focus"]
};
```

---

## Calibration System

The key innovation: **we don't guess intrinsicEfficacy, we derive it from expected clinical effects.**

### CalibrationEngine

```typescript
class CalibrationEngine {
  /**
   * Given a drug's targets and a calibration target (expected effect),
   * compute the internal parameters needed to produce that effect.
   */
  calibrate(drug: DrugDefinition): CalibratedDrug {
    const calibrated: CalibratedDrug = { ...drug, internalParams: {} };

    for (const target of drug.calibration) {
      // 1. Compute expected plasma concentration at reference dose
      const Cmax = this.computeCmax(drug, target.dose);

      // 2. Compute receptor occupancy at Cmax
      const occupancy = this.computeOccupancy(drug, Cmax);

      // 3. Given expected effect and occupancy, solve for internal gain
      // expectedEffect = occupancy * internalGain
      // internalGain = expectedEffect / occupancy
      const internalGain = this.solveForGain(target.expectedEffect, occupancy);

      calibrated.internalParams[target.expectedEffect.signal] = {
        gain: internalGain,
        derivedFrom: target.source
      };
    }

    return calibrated;
  }

  /**
   * Validate calibrated drug against all its calibration targets.
   * Returns error if simulation doesn't match expected effects.
   */
  validate(calibrated: CalibratedDrug): ValidationResult {
    const results: ValidationResult[] = [];

    for (const target of calibrated.calibration) {
      // Run simulation with reference dose
      const simulated = this.simulate(calibrated, target.dose);

      // Compare to expected
      const actual = simulated[target.expectedEffect.signal];
      const expected = target.expectedEffect.change;
      const error = this.computeError(actual, expected);

      results.push({
        target: target.description,
        expected,
        actual,
        error,
        withinUncertainty: error < expected.uncertainty
      });
    }

    return results;
  }
}
```

### Example: Calibrating Methylphenidate

```typescript
// In drugs/stimulants/methylphenidate.ts

export const METHYLPHENIDATE: DrugDefinition = {
  key: "methylphenidate",
  name: "Methylphenidate",

  molecule: {
    molarMass: { value: 233.31, source: PUBCHEM }
  },

  pharmacokinetics: {
    bioavailability: { value: 0.30, source: KIMKO_1999 },  // IR form
    halfLife: { value: { value: 180, unit: "min" }, source: KIMKO_1999 },
    volumeOfDistribution: {
      value: { kind: "lbm", base_L_kg: 2.0 },
      source: KIMKO_1999
    }
  },

  pharmacodynamics: {
    targets: [
      {
        target: "DAT",  // References biology/transporters
        mechanism: "inhibitor",
        affinity: {
          value: { value: 34, unit: "nM" },  // Ki
          source: VOLKOW_1998
        }
      },
      {
        target: "NET",
        mechanism: "inhibitor",
        affinity: {
          value: { value: 339, unit: "nM" },
          source: VOLKOW_1998
        }
      }
    ]
  },

  // THE KEY PART - calibration targets from literature
  calibration: [
    {
      description: "Dopamine increase at therapeutic dose",
      dose: { value: { value: 10, unit: "mg" }, source: VOLKOW_2001 },
      route: "oral",
      expectedEffect: {
        signal: "dopamine",
        metric: "peak",
        change: {
          value: "+250%",  // 2.5x baseline
          source: VOLKOW_2001,
          uncertainty: { low: "+200%", high: "+400%" }
        },
        timeframe: { value: { value: 60, unit: "min" }, source: VOLKOW_2001 }
      },
      source: VOLKOW_2001
    },
    {
      description: "DAT occupancy at therapeutic dose",
      dose: { value: { value: 10, unit: "mg" }, source: VOLKOW_1998 },
      route: "oral",
      expectedEffect: {
        signal: "DAT_occupancy",
        metric: "peak",
        change: {
          value: "50-70%",
          source: VOLKOW_1998
        }
      },
      source: VOLKOW_1998
    }
  ]
};
```

---

## Signal Dynamics (Simplified)

Instead of arbitrary `tau` values, dynamics are derived from physiology:

```typescript
interface SignalDynamics {
  signal: string;

  // Production = synthesis rate (constitutive + regulated)
  production: {
    constitutive: SourcedValue<Rate>;  // Basal synthesis
    regulators: Regulator[];           // What increases/decreases synthesis
  };

  // Clearance = elimination pathways
  clearance: {
    mechanisms: ClearanceMechanism[];
    // Total clearance determines "tau" - we don't set tau directly
  };

  // Computed at runtime
  get effectiveTau(): number {
    // tau = 1 / total_clearance_rate
    return 1 / this.totalClearanceRate;
  }
}

interface ClearanceMechanism {
  type: "reuptake" | "enzymatic" | "diffusion" | "receptor_internalization";
  mediator?: string;         // DAT, MAO-B, etc.
  rate: SourcedValue<Rate>;  // From literature
  saturable?: {
    Km: SourcedValue<Concentration>;
    Vmax: SourcedValue<Rate>;
  };
}
```

---

## Validation System

Every simulation can be validated against literature:

```typescript
interface ValidationSuite {
  name: string;
  tests: ValidationTest[];
}

interface ValidationTest {
  name: string;
  description: string;

  // Setup
  subject: SubjectProfile;
  intervention: { drug: string; dose: Mass; timing: Time };

  // Expected outcome (from literature)
  expected: {
    signal: string;
    metric: "peak" | "AUC" | "trough" | "time_to_peak";
    value: SourcedValue<number>;
  };

  // Tolerance
  acceptableError: number;  // e.g., 0.20 = 20% deviation OK
}

// Example validation suite
const CAFFEINE_VALIDATION: ValidationSuite = {
  name: "Caffeine PK/PD Validation",
  tests: [
    {
      name: "Cortisol increase after 200mg caffeine",
      description: "Lovallo 2005 showed ~30% cortisol increase",
      subject: { age: 25, sex: "male", weight: 70 },
      intervention: { drug: "caffeine", dose: { value: 200, unit: "mg" }, timing: { value: 0, unit: "min" } },
      expected: {
        signal: "cortisol",
        metric: "peak",
        value: {
          value: 1.30,  // 30% increase = 1.30x baseline
          source: LOVALLO_2005,
          uncertainty: { low: 1.15, high: 1.45 }
        }
      },
      acceptableError: 0.20
    }
  ]
};
```

---

## Migration Path

### Phase 1: Literature Foundation (Week 1-2)

1. Create `literature/` directory structure
2. Compile citations for all current parameters
3. Flag all parameters as `sourced` or `empirical: true`
4. Document uncertainty ranges

### Phase 2: Biology Layer (Week 2-3)

1. Define signals with real units and reference ranges
2. Define receptors with literature-sourced affinities
3. Define transporters and enzymes
4. Define coupling pathways

### Phase 3: Drug Layer (Week 3-4)

1. Redefine drugs with `DrugDefinition` interface
2. Add calibration targets from literature
3. Implement `CalibrationEngine`
4. Validate each drug against its targets

### Phase 4: Simulation Refactor (Week 4-5)

1. Update ODE solver to use calibrated parameters
2. Remove all `intrinsicEfficacy` parameters
3. Derive `tau` from clearance mechanisms
4. Add unit tracking throughout

### Phase 5: Validation Suite (Week 5-6)

1. Build validation test suite
2. Run against published PK/PD studies
3. Document deviations and uncertainties
4. Publish calibration methodology

---

## Benefits

1. **Medical Accuracy**: Parameters traceable to literature
2. **No Magic Numbers**: Every value has a source
3. **Validation**: Can prove simulation matches real pharmacology
4. **Extensibility**: Adding a new drug = adding literature data, not guessing
5. **Transparency**: Users can see exactly what studies back each prediction
6. **DRY**: Drug definitions reference biology layer, no duplication

---

## Example: Complete Caffeine Definition

```typescript
// literature/citations.ts
export const FREDHOLM_1999: Citation = {
  authors: "Fredholm BB et al.",
  title: "Actions of caffeine in the brain with special reference to factors that contribute to its widespread use",
  journal: "Pharmacol Rev",
  year: 1999,
  pmid: 10049999
};

// biology/signals/neurotransmitters.ts
export const ADENOSINE: SignalDefinition = {
  key: "adenosine",
  name: "Adenosine",
  unit: "nM",
  compartment: "extracellular",
  referenceRange: {
    value: { low: 30, high: 300 },
    source: DUNWIDDIE_2001
  },
  halfLife: {
    value: { value: 10, unit: "sec" },
    source: DUNWIDDIE_2001
  }
};

// biology/receptors/adenosine.ts
export const A2A_RECEPTOR: ReceptorDefinition = {
  key: "Adenosine_A2a",
  name: "Adenosine A2A Receptor",
  endogenousLigand: "adenosine",
  signalCouplings: [
    { signal: "dopamine", effect: "inhibitory", pathway: "striatopallidal" }
  ],
  distribution: {
    striatum: "high",
    cortex: "low"
  }
};

// drugs/supplements/caffeine.ts
export const CAFFEINE: DrugDefinition = {
  key: "caffeine",
  name: "Caffeine",

  molecule: {
    molarMass: { value: 194.19, source: PUBCHEM }
  },

  pharmacokinetics: {
    bioavailability: { value: 0.99, source: FREDHOLM_1999 },
    halfLife: {
      value: { value: 300, unit: "min" },
      source: FREDHOLM_1999,
      uncertainty: { low: { value: 180, unit: "min" }, high: { value: 600, unit: "min" } }
    },
    volumeOfDistribution: {
      value: { kind: "tbw", fraction: 0.6 },
      source: FREDHOLM_1999
    }
  },

  pharmacodynamics: {
    targets: [
      {
        target: "Adenosine_A2a",
        mechanism: "antagonist",
        affinity: {
          value: { value: 2400, unit: "nM" },
          source: FREDHOLM_1999
        }
      },
      {
        target: "Adenosine_A1",
        mechanism: "antagonist",
        affinity: {
          value: { value: 12000, unit: "nM" },
          source: FREDHOLM_1999
        }
      }
    ]
  },

  calibration: [
    {
      description: "Alertness increase at moderate dose",
      dose: { value: { value: 200, unit: "mg" }, source: SMITH_2002 },
      route: "oral",
      expectedEffect: {
        signal: "alertness",  // Derived signal from adenosine/dopamine
        metric: "peak",
        change: {
          value: "+15%",  // Reaction time improvement
          source: SMITH_2002
        }
      },
      source: SMITH_2002
    },
    {
      description: "Cortisol increase",
      dose: { value: { value: 200, unit: "mg" }, source: LOVALLO_2005 },
      route: "oral",
      expectedEffect: {
        signal: "cortisol",
        metric: "peak",
        change: {
          value: "+30%",
          source: LOVALLO_2005,
          uncertainty: { low: "+15%", high: "+45%" }
        },
        timeframe: { value: { value: 60, unit: "min" }, source: LOVALLO_2005 }
      },
      source: LOVALLO_2005
    }
  ]
};

// interventions/supplements.ts
export const CAFFEINE_INTERVENTION: InterventionDefinition = {
  key: "caffeine",
  label: "Caffeine",
  icon: "☕",
  color: "#8B4513",
  drug: "caffeine",  // That's it - no PK/PD here
  params: [
    { key: "mg", label: "Dose (mg)", type: "slider", min: 25, max: 400, default: 100 }
  ],
  categories: ["supplements"],
  goals: ["energy", "focus"]
};
```

---

## Open Questions

1. **Derived signals** (energy, focus, mood): Keep as composites of real biomarkers, or remove entirely?
2. **Genetic variation**: How to model CYP450 polymorphisms without overwhelming complexity?
3. **Drug-drug interactions**: Full CYP inhibition matrix, or simplified?
4. **Validation data access**: Some studies are behind paywalls - how to cite responsibly?
5. **Uncertainty propagation**: How to display confidence intervals to users?

---

## Success Criteria

1. **Every parameter has a source**: No more "intrinsicEfficacy: 30"
2. **Validation suite passes**: Simulation matches published PK/PD within 20%
3. **Units are consistent**: All signals in physiological units
4. **New drugs are additive**: Adding a drug = adding literature data only
5. **Transparency**: Users can click any prediction and see the source studies
