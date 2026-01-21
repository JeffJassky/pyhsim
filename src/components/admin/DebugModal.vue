<script setup lang="ts">
import { useOnboardingStore } from '@/stores/onboarding';
import { useEngineStore } from '@/stores/engine';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const onboardingStore = useOnboardingStore();
const engineStore = useEngineStore();
const router = useRouter();

const close = () => {
  emit('update:modelValue', false);
};

const handleResetOnboarding = () => {
  if (confirm('Are you sure you want to reset all onboarding progress? This cannot be undone.')) {
    onboardingStore.reset();
    close();
    // Redirect to home/root to trigger the onboarding flow check
    window.location.href = '/';
  }
};

const finalStateJson = computed(() => {
  // Accessing finalHomeostasisState from the store (needs to be added to store state)
  // For now, let's assume we'll add it to the store shortly.
  return (engineStore as any).finalHomeostasisState
    ? JSON.stringify((engineStore as any).finalHomeostasisState, null, 2)
    : 'No simulation data yet.';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content debug-modal-content">
          <button class="modal-close-btn" @click="close">✕</button>

          <header class="modal-header">
            <h2 class="modal-title">Admin / Debug Tools</h2>
          </header>

          <div class="modal-body">
            <!-- Signal Simulation Controls -->
            <div class="tool-group">
              <h3 class="group-title">Signal Simulation</h3>
              <p class="group-desc">
                Isolate components of the signal generation pipeline.
              </p>

              <div class="toggles">
                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Baselines</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableBaselines"
                      @change="engineStore.updateDebug({ enableBaselines: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Circadian and ultradian setpoint drivers.
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Interventions</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableInterventions"
                      @change="engineStore.updateDebug({ enableInterventions: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    External forcing functions (food, drugs, exercise).
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Conditions</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableConditions"
                      @change="engineStore.updateDebug({ enableConditions: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Receptor, transporter, and enzyme modifications (e.g. ADHD,
                    PCOS).
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Couplings</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableCouplings"
                      @change="engineStore.updateDebug({ enableCouplings: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Signal-to-signal interactions and feedback loops.
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Auxiliary Dynamics</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableHomeostasis"
                      @change="engineStore.updateDebug({ enableHomeostasis: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Internal state pools (vesicles, sleep pressure, glycogen).
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Receptors</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableReceptors"
                      @change="engineStore.updateDebug({ enableReceptors: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Dynamic receptor sensitivity and density adaptation.
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Transporters</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableTransporters"
                      @change="engineStore.updateDebug({ enableTransporters: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Reuptake transporter activity modulation.
                  </p>
                </div>

                <div class="toggle-item">
                  <label class="toggle-row">
                    <span class="toggle-label">Enzymes</span>
                    <input
                      type="checkbox"
                      :checked="engineStore.debug.enableEnzymes"
                      @change="engineStore.updateDebug({ enableEnzymes: ($event.target as HTMLInputElement).checked })"
                    />
                  </label>
                  <p class="toggle-desc">
                    Metabolic enzyme activity modulation.
                  </p>
                </div>
              </div>
            </div>

            <!-- Internal State Inspection -->
            <div class="tool-group">
              <h3 class="group-title">Internal State</h3>
              <p class="group-desc">Final snapshot of homeostasis variables.</p>
              <pre class="json-dump">{{ finalStateJson }}</pre>
            </div>

            <!-- Onboarding Controls -->
            <div class="tool-group">
              <h3 class="group-title">Onboarding</h3>
              <p class="group-desc">Manage onboarding state and progress.</p>

              <div class="actions">
                <button
                  class="action-btn danger"
                  @click="handleResetOnboarding"
                >
                  <span class="icon">🔄</span>
                  Reset Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.debug-modal-content {
  max-width: 500px;
}

.tool-group {
  margin-bottom: 2rem;
}

.tool-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.group-desc {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  width: 100%;
}

.action-btn:hover {
  background: var(--color-bg-elevated);
}

.action-btn.danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger), transparent 90%);
}

.action-btn.danger:hover {
  background: color-mix(in srgb, var(--color-danger), transparent 80%);
}

.icon {
  font-size: 1.2rem;
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.toggle-item {
  background: var(--color-bg-subtle);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  transition: background 0.2s;
  border: 1px solid var(--color-border-subtle);
}

.toggle-item:hover {
  background: var(--color-bg-elevated);
}

.toggle-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.toggle-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.3;
}

.toggle-row input[type="checkbox"] {
  accent-color: var(--color-active);
  transform: scale(1.1);
}

.json-dump {
  background: var(--color-bg-subtle);
  padding: 1rem;
  border-radius: 12px;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
}
</style>
