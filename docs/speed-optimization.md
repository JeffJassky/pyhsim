# Engine Speed Optimization Plan

## 1. The Problem: Current Performance Bottlenecks

The current physiological engine uses a 4th-order Runge-Kutta (RK4) ODE solver. While mathematically robust, the implementation has a computational complexity of roughly **O(Steps × Signals × Interventions)**.

### Specific Bottlenecks:
1.  **Redundant Timeline Scanning**: Inside the core derivative function (`computeDerivatives`), the engine iterates over the entire timeline (all interventions) multiple times for every simulated minute. 
    *   Since RK4 takes 4 steps per minute, a 24-hour simulation (1,440 minutes) with 50 timeline items performs **288,000+ array scans** per render.
2.  **Numerical PK Overhead**: Drug concentrations (Pharmacokinetics) are currently solved numerically as part of the ODE system. This adds 1–2 extra variables per intervention to the system state, increasing the work the solver has to do for every signal.
3.  **Object Allocation & Lookup**: The inner loop uses heavy JavaScript object property lookups (`state.signals.dopamine`) and string-keyed maps. In a tight loop running millions of times per second, the overhead of the JS engine's hash map lookups and garbage collection becomes significant.
4.  **Full Re-computation**: Every minor edit to an intervention at the end of a 7-day timeline triggers a full re-simulation from Minute 0 of Day 1.

---

## 2. Approach: The "Optimization Stack"

We will implement a 4-layered optimization strategy. These layers are complementary and can be implemented incrementally.

### Layer 1: Active Intervention Indexing (The "Sweep")
*   **Purpose**: Change the timeline complexity from $O(N)$ to $O(1)$.
*   **Solution**: 
    *   Pre-sort the timeline by `startTime`.
    *   Maintain an `activeSet` of interventions during the simulation loop.
    *   Use a pointer to the "next pending" item. At time $t$, only check if the next item should enter the `activeSet` or if an active item should exit.
    *   The derivative function only processes the 1–3 items in the `activeSet` instead of the 100+ items in the full timeline.
*   **Interaction**: This is the foundation. It immediately makes the engine's speed independent of the total history length.

### Layer 2: Analytical PK Pre-computation
*   **Purpose**: Move drug math out of the ODE loop.
*   **Solution**: 
    *   Since PK models (1-compartment, 2-compartment) are linear systems, they have exact analytical solutions (closed-form equations).
    *   Before starting the ODE loop, pre-calculate the concentration curve for every intervention and store it in a `Float32Array`.
    *   The ODE solver then treats drug concentration as a simple lookup table instead of a dynamic variable.
*   **Interaction**: This reduces the number of ODE variables significantly and removes complex branching logic from the derivative function.

### Layer 3: System Vectorization
*   **Purpose**: Minimize JavaScript engine overhead.
*   **Solution**: 
    *   Map signal names (`dopamine`, `serotonin`) to fixed indices in a flat `Float64Array`.
    *   Replace object-based state (`state.signals.dopamine`) with index-based access (`state[5]`).
    *   Use typed array operations for state scaling and addition.
*   **Interaction**: This maximizes the CPU's ability to cache data and minimizes the "lookup penalty" of the JS runtime.

### Layer 4: Change-Point Checkpointing (Memoization)
*   **Purpose**: Implement incremental updates.
*   **Solution**: 
    *   Cache the entire `SimulationState` at regular intervals (e.g., every 6 hours or at the start of every day).
    *   When an intervention is changed at time $T$, identify the last valid checkpoint *before* $T$.
    *   Reload that checkpoint and simulate only from that point forward.
*   **Interaction**: Combined with the previous layers, this makes edits at the end of long timelines feel instantaneous.

---

## 3. Implementation Roadmap

### Phase 1: Algorithmic (Immediate)
*   Implement Layer 1 (Active Indexing) in `engine.worker.ts`.
*   Implement Layer 2 (Analytical PK) by moving PK logic from the derivative function to a pre-simulation pass.

### Phase 2: Structural (Refactor)
*   Implement Layer 3 (Vectorization). This will require updating the `integrateStep` and signal definitions to work with indices.

### Phase 3: UX/Persistence (Final)
*   Implement Layer 4 (Checkpointing). This requires a "diffing" logic in the store to determine which simulated segments are still valid.

---

## 4. Verification & Tooling Strategy

To ensure optimizations do not compromise mathematical integrity, we will implement a "Parallel Verification" system.

### A/B Engine Switching
*   **Strategy Pattern**: Move the core simulation loop into versioned strategy files (`numerical-v1.ts`, `optimized-v2.ts`).
*   **Debug Toggle**: Add a "Use Optimized Engine" switch in the UI. This sends a flag to the worker to select the solver strategy.
*   **Divergence Check**: In "Validation Mode," the worker will run *both* solvers on the same input and compare the output buffers. Any difference > 1e-10 will trigger a console warning.

### Performance Telemetry
*   **Worker Benchmarking**: Measure execution time using `performance.now()` inside the worker and return `computeTimeMs` in the response.
*   **Telemetry Overlay**: Display the compute time in the Signal Chart or Debug Modal (e.g., "⚡ 1.2ms").

### Automated Consistency Tests
*   **Epsilon Testing**: A Vitest suite will run a library of 20+ "Golden Scenarios" through both engines.
*   **Regression Guard**: The CI pipeline will fail if the Optimized engine's output deviates from the Numerical engine's output.

---

## 5. Success Criteria
*   **Latency**: A 24-hour simulation should run in < 10ms.
*   **Scalability**: A 30-day simulation should run in < 100ms.
*   **Accuracy**: Results must remain mathematically identical (within epsilon) to the v1 implementation.
