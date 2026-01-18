# Migration Summary: Physiologically Based Modelling

## Completed Actions

### 1. Scientific Foundations

- **Strategy**: `docs/modelling-improvements.md` outlines the shift from phenomenological curves to PBPK/QSP models.
- **Core Math**: `src/models/pharmacokinetics.ts` provides standardized PK functions (`pk1`, `pk_conc`, `hill`) and a **Kernel Generator**.
- **Physiology**: `src/models/subject.ts` now calculates:
  - **Lean Body Mass (LBM)** (Boer formula)
  - **Liver Blood Flow** (scaled by BSA)
  - **eGFR** (Cockcroft-Gault)
- **Metadata**: `src/types/neurostate.ts` includes `PharmacologyDef` for defining molecules, PK parameters, and PD targets.

### 2. Codebase Refactoring

- **Interventions Model**: `src/models/interventions.ts` was refactored to:
  - Import math helpers from `pharmacokinetics.ts` (DRY).
  - Use `generatePKKernel` for **Caffeine**, **Alcohol**, and **Ritalin**.
  - This means kernel functions are now _generated_ from metadata like `halfLifeMin` and `bioavailability`, rather than being hardcoded strings.
- **Engine Worker**: Verified that `physiology` context (clearance, metabolic capacity) is injected into kernel execution.

### 3. New Data

- **Caffeine**: Added as a new intervention with full pharmacological metadata.
- **Alcohol & Ritalin**: Updated with metadata and dynamic kernel generation.

## Next Steps (User)

- **Tune Effect Gains**: The `intrinsicEfficacy` parameter in `PharmacologyDef` controls the magnitude of the signal response. These are currently estimated (e.g. 50.0 for generic, 2.5 for Alcohol). Adjust these to match desired visual output.
- **Expand Library**: Add `pharmacology` metadata to other supplements (Nootropics, Vitamins) to fully migrate them to the PBPK system.
- **UI Updates**: The UI can now potentially display "Plasma Concentration" vs "Effect" since the underlying model distinguishes them (though they are combined in the kernel output for now).
