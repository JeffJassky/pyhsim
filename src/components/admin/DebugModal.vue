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
      <div v-if="modelValue" class="debug-overlay" @click.self="close">
        <div class="debug-content">
          <button class="close-btn" @click="close">✕</button>

          <header class="debug-header">
            <h2 class="section-title">Admin / Debug Tools</h2>
          </header>

          <div class="debug-body">
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
                  <p class="toggle-desc">Circadian and ultradian setpoint drivers.</p>
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
                  <p class="toggle-desc">External forcing functions (food, drugs, exercise).</p>
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
                  <p class="toggle-desc">Receptor, transporter, and enzyme modifications (e.g. ADHD, PCOS).</p>
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
                  <p class="toggle-desc">Signal-to-signal interactions and feedback loops.</p>
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
                  <p class="toggle-desc">Internal state pools (vesicles, sleep pressure, glycogen).</p>
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
                  <p class="toggle-desc">Dynamic receptor sensitivity and density adaptation.</p>
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
                  <p class="toggle-desc">Reuptake transporter activity modulation.</p>
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
                  <p class="toggle-desc">Metabolic enzyme activity modulation.</p>
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
.debug-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000; /* Higher than normal modals */
  background: rgba(10, 10, 15, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.debug-content {
  width: 100%;
  max-width: 500px;
  background: #1e1e23;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  color: white;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.debug-header {
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.debug-body {
  padding: 2rem;
  overflow-y: auto;
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
  color: #fff;
}

.group-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  width: 100%;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.danger {
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  transition: background 0.2s;
}

.toggle-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.toggle-item--optimized {
  border: 1px solid rgba(143, 191, 95, 0.3);
  background: rgba(143, 191, 95, 0.05);
}

.toggle-item--optimized .toggle-label {
  color: #8fbf5f;
}

.toggle-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.toggle-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.3;
}

.toggle-row input[type="checkbox"] {
  transform: scale(1.2);
}

.json-dump {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
