# Plan: Fixing Timing and Dosage Effects

## The Problem
Currently, the simulation treats the duration of a timeline item as a multiplier for its total dosage. This leads to nonsensical behaviors:
1. **Pills (Vitamin D3, Melatonin):** Dragging the bar longer increases the amount of drug entering the system, whereas a pill is a fixed dose regardless of how long the "event" lasts on the timeline.
2. **Infusions (Sipping Coffee):** There is no distinction between taking a 200mg caffeine pill (instant) vs. sipping a 200mg coffee over 30 minutes. In both cases, the total dose should be 200mg, but the coffee should have a slower, more distributed onset.
3. **Continuous Events (Exercise, Sleep):** These correctly use duration (Intensity * Duration = Total Load), but are currently mixed with drug PK logic in a confusing way.

## Desired Behaviors

### 1. Bolus Delivery (Default for Supplements/Meds)
* **Intent:** A fixed amount of a substance enters the system at a specific point in time.
* **Logic:** Total Dose = `mg`. Timeline duration should purely be a visual aid or represent the "window of action," but NOT change the total amount absorbed.
* **Example:** 3mg Melatonin pill.

### 2. Infusion Delivery
* **Intent:** A fixed amount of a substance is delivered steadily over a specific duration.
* **Logic:** Total Dose = `mg`. Input Rate = `mg / duration`.
* **Example:** Drinking a large coffee over 45 minutes.

### 3. Continuous Delivery
* **Intent:** An ongoing physiological signal or "load" that persists as long as the activity is active.
* **Logic:** Input Rate = `intensity`. Total Load = `intensity * duration`.
* **Example:** Cardio exercise driving norepinephrine.

## Refactoring Approach

### Phase 1: Update the Schema (Done)
Add `delivery: 'bolus' | 'infusion' | 'continuous'` to the `PharmacologyDef['pk']` type.

### Phase 2: Update the ODE Solver (`src/models/engine/ode-solver.ts`)
Modify the `gutInput` calculation:
* **'bolus'**: Deliver the entire dose into the `gut` compartment in the first minute of the intervention.
* **'infusion'**: Deliver `dose / duration` per minute for the duration of the intervention.
* **'continuous'**: Use the existing intensity-based logic (mostly for non-PK signals like exercise).

### Phase 3: Update the Library
* Default all supplements and medications to `delivery: 'bolus'`.
* Update "Food" and "Alcohol" to `delivery: 'infusion'`.
* Ensure "Exercise", "Sleep", and "Meditation" remain `delivery: 'continuous'`.

### Phase 4: UI Enhancements
* Update the Inspector to reflect that duration doesn't change dose for bolus items.
* (Optional) Allow users to toggle between "Bolus" and "Infusion" for certain items (like coffee).
