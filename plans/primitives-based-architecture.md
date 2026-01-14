# Primitives-Based Physiology Architecture

## Core Principle

**There are exactly 5 biological primitives. Everything else is built from them.**

---

## The 5 Primitives

### 1. Molecule

A chemical species that exists in the body.

```typescript
interface Molecule {
  key: string;                    // "dopamine", "caffeine", "glucose"
  name: string;
  molarMass: number;              // g/mol

  // Physical properties (for PK calculations)
  logP?: number;                  // Lipophilicity
  pKa?: number;                   // Acid dissociation
  charge?: number;                // At physiological pH
}
```

Examples: dopamine, serotonin, caffeine, glucose, insulin, cortisol, melatonin

### 2. Compartment

A physical location where molecules exist at some concentration.

```typescript
interface Compartment {
  key: string;                    // "plasma", "synapse_striatum", "cytoplasm_neuron"
  name: string;

  // Volume (for concentration calculations)
  volume: VolumeSpec;             // Fixed L, or body-relative (e.g., 0.6 * TBW)

  // What molecules can exist here
  permeable?: Molecule[];         // If restricted (e.g., BBB)
}
```

Examples: plasma, gut_lumen, liver_cytoplasm, synapse_striatum, synapse_pfc, csf, adipose

### 3. Transporter

Moves molecules between compartments.

```typescript
interface Transporter {
  key: string;                    // "DAT", "SERT", "GLUT4"
  name: string;

  // What it transports
  substrates: Molecule[];         // Can transport multiple (e.g., VMAT2)
  from: Compartment;
  to: Compartment;

  // Kinetics (Michaelis-Menten)
  Km: SourcedValue<Concentration>;   // Affinity
  Vmax: SourcedValue<Rate>;          // Max rate

  // What affects it
  inhibitors?: MoleculeBinding[];    // Drugs that block it

  // Direction
  reversible?: boolean;              // Can run backwards (e.g., amphetamine reverses DAT)
}
```

Examples:
- DAT: dopamine, synapse → cytoplasm
- SERT: serotonin, synapse → cytoplasm
- VMAT2: [dopamine, serotonin, norepinephrine], cytoplasm → vesicle
- GLUT4: glucose, plasma → muscle_cell
- P-gp: [many drugs], brain → plasma (efflux pump)

### 4. Enzyme

Converts molecules to other molecules.

```typescript
interface Enzyme {
  key: string;                    // "MAO_A", "CYP3A4", "tyrosine_hydroxylase"
  name: string;

  // What it does
  reactions: Reaction[];

  // Where it operates
  compartments: Compartment[];

  // What affects it
  inhibitors?: MoleculeBinding[];
  inducers?: MoleculeBinding[];
}

interface Reaction {
  substrates: Molecule[];         // Input molecules
  products: Molecule[];           // Output molecules

  // Kinetics
  Km: SourcedValue<Concentration>;
  Vmax: SourcedValue<Rate>;

  // Stoichiometry (if not 1:1)
  stoichiometry?: Record<string, number>;
}
```

Examples:
- MAO_A: serotonin → 5-HIAA, norepinephrine → DHPG
- MAO_B: dopamine → DOPAC, phenethylamine → phenylacetic_acid
- TH (tyrosine hydroxylase): tyrosine → L-DOPA (rate-limiting for DA synthesis)
- CYP3A4: [many drugs] → metabolites
- CYP1A2: caffeine → paraxanthine

### 5. Receptor

Molecules bind to it, triggering downstream effects.

```typescript
interface Receptor {
  key: string;                    // "D1", "D2", "5HT2A", "GABA_A"
  name: string;

  // Where it is
  compartment: Compartment;
  location: "presynaptic" | "postsynaptic" | "extrasynaptic" | "peripheral";

  // What binds
  endogenousLigand: Molecule;
  Kd: SourcedValue<Concentration>;   // Binding affinity

  // Effects when activated
  effects: ReceptorEffect[];

  // Drugs that bind
  ligands?: MoleculeBinding[];
}

interface ReceptorEffect {
  type: "modulate_synthesis" | "modulate_release" | "modulate_activity" | "ion_channel" | "second_messenger";
  target: string;                 // What's affected
  direction: "increase" | "decrease";
  magnitude: SourcedValue<number>;   // How much (fold-change or %)
}
```

Examples:
- D2_autoreceptor: dopamine binds → decreases dopamine release (negative feedback)
- D1_postsynaptic: dopamine binds → activates adenylyl cyclase → cAMP cascade
- GABA_A: GABA binds → opens Cl- channel → hyperpolarization
- A2a: adenosine binds → decreases dopamine signaling (in striatum)

---

## The State

At any moment, the system state is:

```typescript
interface PhysiologyState {
  // Concentration of each molecule in each compartment
  concentrations: Map<[Molecule, Compartment], Concentration>;

  // Activity level of each transporter/enzyme (1.0 = baseline)
  activities: Map<Transporter | Enzyme, number>;

  // Occupancy of each receptor by each ligand (0-1)
  occupancies: Map<[Receptor, Molecule], number>;

  // Receptor density (for adaptation, 1.0 = baseline)
  densities: Map<Receptor, number>;
}
```

---

## Interventions (NOT a primitive)

Interventions are parameterized effects on the primitives. They are NOT a new primitive type.

```typescript
interface Intervention {
  key: string;
  name: string;
  icon: string;

  // User-configurable parameters
  params: ParamDef[];

  // What this intervention does to the system
  effects: Effect[];

  // Timing
  onset?: Expression;        // When effects start (can depend on params)
  duration?: Expression;     // How long effects last
}

interface ParamDef {
  key: string;
  label: string;
  type: "number" | "slider" | "select";
  unit?: string;
  min?: number;
  max?: number;
  default: number;
}
```

### Effect Types

There are exactly 6 effect types (corresponding to what you can do to primitives):

```typescript
type Effect =
  // Add molecules to a compartment
  | {
      type: "add_molecule";
      molecule: string;
      compartment: string;
      rate: Expression;          // molecules/min, can use params
    }

  // Bind to a receptor/transporter/enzyme
  | {
      type: "bind";
      target: string;            // receptor, transporter, or enzyme key
      affinity: Expression;      // Ki or EC50, can use params
      mechanism: "agonist" | "antagonist" | "inhibitor" | "activator" | "PAM" | "NAM";
    }

  // Modulate synthesis rate of a molecule
  | {
      type: "modulate_synthesis";
      molecule: string;
      factor: Expression;        // Multiplier (1.0 = no change)
    }

  // Modulate release rate of a molecule
  | {
      type: "modulate_release";
      molecule: string;
      factor: Expression;
    }

  // Modulate activity of transporter/enzyme
  | {
      type: "modulate_activity";
      target: string;
      factor: Expression;
    }

  // Change receptor density (for long-term effects)
  | {
      type: "modulate_density";
      receptor: string;
      factor: Expression;
    }
```

### Expression

Expressions can reference params and state:

```typescript
type Expression = string;  // Evaluated at runtime

// Examples:
"params.mg / subject.Vd"                    // Dose-dependent
"1 + params.intensity * 2"                  // Intensity-dependent
"params.duration > 30 ? 1.5 : 1.2"          // Duration-dependent
"state.concentrations['cortisol']['plasma'] > 20 ? 0.8 : 1.0"  // State-dependent
```

---

## Example Interventions

### Caffeine (Drug)

```typescript
const CAFFEINE: Intervention = {
  key: "caffeine",
  name: "Caffeine",
  icon: "☕",

  params: [
    { key: "mg", label: "Dose", unit: "mg", type: "slider", min: 25, max: 400, default: 100 }
  ],

  effects: [
    // Caffeine enters plasma
    {
      type: "add_molecule",
      molecule: "caffeine",
      compartment: "plasma",
      rate: "params.mg * bioavailability / absorption_time"  // mg/min
    },
    // Caffeine binds A2a receptors (antagonist)
    {
      type: "bind",
      target: "A2a",
      affinity: "2400",  // nM, from literature
      mechanism: "antagonist"
    },
    // Caffeine binds A1 receptors (antagonist)
    {
      type: "bind",
      target: "A1",
      affinity: "12000",  // nM
      mechanism: "antagonist"
    }
  ]
};
```

### Ritalin (Drug)

```typescript
const RITALIN: Intervention = {
  key: "ritalin",
  name: "Ritalin IR",
  icon: "💊",

  params: [
    { key: "mg", label: "Dose", unit: "mg", type: "slider", min: 5, max: 40, default: 10 }
  ],

  effects: [
    {
      type: "add_molecule",
      molecule: "methylphenidate",
      compartment: "plasma",
      rate: "params.mg * 0.30 / 30"  // 30% bioavailability, absorbed over ~30min
    },
    {
      type: "bind",
      target: "DAT",
      affinity: "34",  // nM
      mechanism: "inhibitor"
    },
    {
      type: "bind",
      target: "NET",
      affinity: "339",  // nM
      mechanism: "inhibitor"
    }
  ]
};
```

### Exercise (Activity)

```typescript
const EXERCISE: Intervention = {
  key: "exercise",
  name: "Exercise",
  icon: "🏃",

  params: [
    { key: "duration", label: "Duration", unit: "min", type: "slider", min: 10, max: 120, default: 30 },
    { key: "intensity", label: "Intensity", type: "slider", min: 0.3, max: 1.0, default: 0.7 }
  ],

  effects: [
    // Exercise increases catecholamine synthesis
    {
      type: "modulate_synthesis",
      molecule: "adrenaline",
      factor: "1 + params.intensity * 3"  // Up to 4x at max intensity
    },
    {
      type: "modulate_synthesis",
      molecule: "norepinephrine",
      factor: "1 + params.intensity * 2"
    },
    // Exercise increases cortisol (HPA activation)
    {
      type: "modulate_synthesis",
      molecule: "cortisol",
      factor: "1 + params.intensity * 1.5"
    },
    // Exercise increases dopamine release
    {
      type: "modulate_release",
      molecule: "dopamine",
      factor: "1 + params.intensity * 0.5"
    },
    // Exercise increases BDNF expression (delayed)
    {
      type: "modulate_synthesis",
      molecule: "bdnf",
      factor: "1 + (params.duration / 60) * 0.5"  // More duration = more BDNF
    }
  ],

  onset: "5",      // Effects start after 5 min
  duration: "params.duration + 60"  // Effects last duration + 1hr recovery
};
```

### Meditation (Activity)

```typescript
const MEDITATION: Intervention = {
  key: "meditation",
  name: "Meditation",
  icon: "🧘",

  params: [
    { key: "duration", label: "Duration", unit: "min", type: "slider", min: 5, max: 60, default: 20 }
  ],

  effects: [
    // Meditation reduces HPA axis activity
    {
      type: "modulate_synthesis",
      molecule: "cortisol",
      factor: "0.8 - (params.duration / 60) * 0.1"  // Longer = more reduction
    },
    // Meditation increases GABA release
    {
      type: "modulate_release",
      molecule: "gaba",
      factor: "1.2 + (params.duration / 60) * 0.2"
    },
    // Meditation increases parasympathetic tone (via ACh)
    {
      type: "modulate_release",
      molecule: "acetylcholine",
      factor: "1.3"
    }
  ],

  onset: "3",
  duration: "params.duration + 30"
};
```

### Sleep (State)

```typescript
const SLEEP: Intervention = {
  key: "sleep",
  name: "Sleep",
  icon: "😴",

  params: [
    { key: "duration", label: "Duration", unit: "hr", type: "slider", min: 4, max: 10, default: 8 }
  ],

  effects: [
    // Melatonin increases during sleep
    {
      type: "modulate_synthesis",
      molecule: "melatonin",
      factor: "5"  // 5x baseline
    },
    // Growth hormone pulses during deep sleep
    {
      type: "modulate_synthesis",
      molecule: "growth_hormone",
      factor: "10"  // Major pulses
    },
    // Cortisol suppressed early, rises before waking
    {
      type: "modulate_synthesis",
      molecule: "cortisol",
      factor: "0.3"  // Suppressed during sleep
    },
    // Adenosine clearance
    {
      type: "modulate_activity",
      target: "adenosine_clearance",
      factor: "2"  // Faster clearance during sleep
    },
    // Orexin suppressed
    {
      type: "modulate_synthesis",
      molecule: "orexin",
      factor: "0.1"
    }
  ]
};
```

### Food (Intake)

```typescript
const FOOD: Intervention = {
  key: "food",
  name: "Meal",
  icon: "🍽️",

  params: [
    { key: "carbs", label: "Carbs", unit: "g", type: "slider", min: 0, max: 200, default: 50 },
    { key: "protein", label: "Protein", unit: "g", type: "slider", min: 0, max: 100, default: 30 },
    { key: "fat", label: "Fat", unit: "g", type: "slider", min: 0, max: 100, default: 20 }
  ],

  effects: [
    // Glucose from carbs
    {
      type: "add_molecule",
      molecule: "glucose",
      compartment: "gut_lumen",
      rate: "params.carbs * 1000 / 30"  // mg/min, absorbed over ~30min
    },
    // Amino acids from protein (affects synthesis)
    {
      type: "modulate_synthesis",
      molecule: "dopamine",
      factor: "1 + params.protein / 100 * 0.2"  // Tyrosine → dopamine
    },
    {
      type: "modulate_synthesis",
      molecule: "serotonin",
      factor: "1 + params.carbs / 100 * 0.3"  // Carbs increase tryptophan uptake
    },
    // GLP-1 release
    {
      type: "modulate_release",
      molecule: "glp1",
      factor: "1 + (params.carbs + params.protein) / 50"
    },
    // Ghrelin suppression
    {
      type: "modulate_synthesis",
      molecule: "ghrelin",
      factor: "0.3"  // Suppressed by food
    }
  ],

  onset: "10",  // Digestion starts
  duration: "180"  // ~3 hours for full digestion
};
```

---

## The Simulation Loop

```typescript
function simulate(state: PhysiologyState, dt: number, interventions: ActiveIntervention[]): PhysiologyState {
  const derivatives = initializeDerivatives();

  // 1. Compute intervention effects
  for (const intervention of interventions) {
    for (const effect of intervention.effects) {
      applyEffect(effect, state, derivatives, intervention.params);
    }
  }

  // 2. Compute transporter fluxes
  for (const transporter of ALL_TRANSPORTERS) {
    const activity = state.activities.get(transporter);
    for (const substrate of transporter.substrates) {
      const conc = state.concentrations.get([substrate, transporter.from]);
      const flux = activity * transporter.Vmax * conc / (transporter.Km + conc);

      derivatives.concentrations[substrate][transporter.from] -= flux;
      derivatives.concentrations[substrate][transporter.to] += flux;
    }
  }

  // 3. Compute enzyme reactions
  for (const enzyme of ALL_ENZYMES) {
    const activity = state.activities.get(enzyme);
    for (const reaction of enzyme.reactions) {
      const conc = state.concentrations.get([reaction.substrate, enzyme.compartment]);
      const rate = activity * reaction.Vmax * conc / (reaction.Km + conc);

      derivatives.concentrations[reaction.substrate][enzyme.compartment] -= rate;
      derivatives.concentrations[reaction.product][enzyme.compartment] += rate;
    }
  }

  // 4. Compute receptor occupancies and effects
  for (const receptor of ALL_RECEPTORS) {
    const ligandConc = state.concentrations.get([receptor.endogenousLigand, receptor.compartment]);
    const occupancy = ligandConc / (receptor.Kd + ligandConc);
    state.occupancies.set([receptor, receptor.endogenousLigand], occupancy);

    // Apply receptor effects
    for (const effect of receptor.effects) {
      applyReceptorEffect(effect, occupancy, state, derivatives);
    }
  }

  // 5. Integrate
  return integrateState(state, derivatives, dt);
}
```

---

## Directory Structure

```
src/biology/
├── primitives/
│   ├── molecule.ts           # Molecule interface + registry
│   ├── compartment.ts        # Compartment interface + registry
│   ├── transporter.ts        # Transporter interface + registry
│   ├── enzyme.ts             # Enzyme interface + registry
│   └── receptor.ts           # Receptor interface + registry
│
├── instances/                 # Actual biological entities
│   ├── molecules/
│   │   ├── neurotransmitters.ts   # dopamine, serotonin, etc.
│   │   ├── hormones.ts            # cortisol, insulin, etc.
│   │   └── metabolites.ts         # glucose, lactate, etc.
│   ├── compartments/
│   │   ├── blood.ts               # plasma, whole_blood
│   │   ├── brain.ts               # synapse_striatum, synapse_pfc, csf
│   │   └── organs.ts              # liver, gut, muscle, adipose
│   ├── transporters/
│   │   ├── monoamine.ts           # DAT, SERT, NET, VMAT2
│   │   └── glucose.ts             # GLUT1, GLUT4
│   ├── enzymes/
│   │   ├── monoamine.ts           # MAO_A, MAO_B, COMT, TH, AADC
│   │   └── cyp450.ts              # CYP1A2, CYP2D6, CYP3A4
│   └── receptors/
│       ├── dopamine.ts            # D1, D2, D3, D4, D5
│       ├── serotonin.ts           # 5HT1A, 5HT2A, etc.
│       └── adenosine.ts           # A1, A2a, A2b, A3
│
├── state.ts                   # PhysiologyState type
└── simulation.ts              # The simulation loop

src/interventions/
├── types.ts                   # Intervention, Effect, Expression types
├── drugs/
│   ├── caffeine.ts
│   ├── methylphenidate.ts
│   └── melatonin.ts
├── activities/
│   ├── exercise.ts
│   ├── meditation.ts
│   └── sleep.ts
├── nutrition/
│   └── food.ts
└── index.ts                   # Registry of all interventions

src/literature/
├── citations.ts               # Citation type
└── sources/                   # Per-paper sourced values
    ├── volkow-1998.ts
    ├── fredholm-1999.ts
    └── ...
```

---

## What This Achieves

1. **Only 5 primitives** - everything is Molecule, Compartment, Transporter, Enzyme, or Receptor
2. **Interventions are not special** - just parameterized effects on primitives
3. **No ad-hoc systems** - no "DopamineSystem", no "ExerciseSystem"
4. **DRY** - each biological entity defined once
5. **Extensible** - add a new drug = add effects that reference existing primitives
6. **Scientifically grounded** - effects reference literature values (Ki, Vmax, etc.)
7. **Parameterizable** - expressions can use intervention params (dose, duration, intensity)

---

## Migration Path

1. **Define the 5 primitive interfaces** (1 day)
2. **Populate instances** from existing signal definitions (3-5 days)
3. **Convert existing interventions** to effect-based format (3-5 days)
4. **Rewrite simulation loop** to use primitives (2-3 days)
5. **Validate** against expected behaviors (ongoing)

Total: ~2 weeks to working prototype
