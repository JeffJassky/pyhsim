
/**
 * PLAN: Unified Dynamic Intervention Architecture
 * ===============================================
 * 
 * CHALLENGE:
 * We need to model diverse interventions (Drugs, Food, Exercise, Social, Light)
 * where the user's input (Dose, Macros, Intensity) dynamically alters the physics
 * (Pharmacokinetics & Pharmacodynamics).
 * 
 * REQUIREMENTS:
 * 1. Flexibility: Must handle "100mg Caffeine" (Simple) vs "Oatmeal with extra fat" (Composite) vs "HIIT" (Abstract).
 * 2. Composition: Food is a mixture of agents (Glucose, Lipids).
 * 3. Interaction: Fat slows Glucose.
 * 4. Elegance: Avoid massive switch statements or ad-hoc "if food do this".
 * 
 * COMPARISON OF APPROACHES
 * ========================
 * 
 * OPTION A: The "Ingredient System" (Agent Primitives)
 * ----------------------------------------------------
 * Concept:
 *   An Intervention is a "Recipe" that returns a list of "Active Agents".
 *   `Food(params)` -> `[Glucose(50g), Lipids(20g)]`
 *   `Ritalin(params)` -> `[Methylphenidate(10mg)]`
 *   `Exercise(params)` -> `[SympatheticStress(Level 5), MetabolicLoad(Level 8)]`
 * 
 * Pros:
 *   - Extreme Reusability: "Glucose" logic is defined once, used by Food, Soda, Gels.
 *   - Compositional: Trivial to add "Caffeine" to "Chocolate" or "Pre-workout".
 *   - Physically Accurate: The Solver simulates agents, not "names".
 * 
 * Cons:
 *   - Interaction Complexity: How does the Solver know that Lipids slow Glucose? 
 *     We need a "Gastric Compartment" manager or "Interaction Rules" engine.
 * 
 * 
 * OPTION B: The "Modifier Config" (Declarative JSON)
 * --------------------------------------------------
 * Concept:
 *   Static JSON with math rules.
 *   `halfLife: { base: 30, modifiers: [{ param: 'fat', op: 'add', factor: 1.5 }] }`
 * 
 * Pros:
 *   - Safe, Serializable, no `eval()`.
 *   - Good for UI builders.
 * 
 * Cons:
 *   - Limited Power: Hard to model "If carb > 50 AND fat < 10 then spike insulin".
 *   - Verbose: Describing complex biological logic in JSON is painful.
 * 
 * 
 * OPTION C: The "Factory Function" (Dynamic Pharmacology)
 * -------------------------------------------------------
 * Concept:
 *   `pharmacology` is a function: `(params) => PharmacologyDef[]`
 *   It returns the *final, calculated physics* for that specific instance.
 * 
 * Pros:
 *   - Maximum Power: Can use full JS logic to calculate delays, peaks, etc.
 *   - Encapsulation: The "Fat slows Glucose" logic lives inside the `FoodFactory`, 
 *     keeping the Solver simple.
 *   - Backwards Compatible: Static objects can be wrapped in `() => obj`.
 * 
 * Cons:
 *   - Logic Duplication: If "Fat slows Glucose" is needed for 50 foods, 
 *     we might copy-paste logic unless we use helper functions.
 * 
 * 
 * SELECTED ARCHITECTURE: The "Factory + Primitives" Hybrid
 * ========================================================
 * 
 * We will use Option C (Factory Functions) but powered by Option A's (Agent Primitives).
 * 
 * Why?
 * 1. The Solver stays dumb. It just receives a list of `PharmacologyDef`.
 * 2. The Complexity lives in reusable "Agent Creators" (helpers).
 * 3. It handles everything:
 *    - Simple Drug: `() => Agents.Methylphenidate(params.mg)`
 *    - Food: `() => [Agents.Glucose(params.carbs, { fat: params.fat }), Agents.Lipids(params.fat)]`
 *      ^ Note how we pass 'fat' into the Glucose agent to handle the interaction locally!
 * 
 * 
 * EXECUTION PLAN
 * ==============
 * 
 * 1. Define `Agents` Library (`src/models/physiology/agents.ts`)
 *    - Create factories for: `Glucose`, `Lipids`, `Protein`, `Caffeine`, `Methylphenidate`, `SympatheticStress`.
 *    - These functions return standard `PharmacologyDef` objects.
 *    - They accept context (e.g. `fatContent`) to adjust their internal PK.
 * 
 * 2. Update `InterventionDef` Type
 *    - Allow `pharmacology` to be `PharmacologyDef | (params) => PharmacologyDef | PharmacologyDef[]`.
 * 
 * 3. Update `engine.worker.ts`
 *    - When processing interventions, check if `pharmacology` is a function.
 *    - If so, execute it with `item.params`.
 *    - Flatten the result (handle arrays).
 *    - Feed the resulting definitions into the solver loop.
 * 
 * 4. Refactor Registry Files
 *    - `food.interventions.ts`: Use `Agents.Glucose`, `Agents.Lipids`, etc.
 *    - `lifestyle.interventions.ts`: Use `Agents.SympatheticStress` for exercise.
 *    - `prescription.interventions.ts`: Use `Agents.Methylphenidate`.
 * 
 * This scales infinitely. Adding "Ashwagandha" just means adding `Agents.Ashwagandha`.
 * Adding a "Keto Meal" just means composing `Lipids` and `Protein` agents.
 */
