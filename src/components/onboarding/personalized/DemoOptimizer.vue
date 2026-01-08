<template>
  <div class="optimizer">
    <!-- Ambient background -->
    <div class="optimizer__ambient"></div>

    <!-- Content -->
    <div class="optimizer__content">
      <!-- AI Message -->
      <div class="optimizer__message">
        <div class="optimizer__message-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <transition name="text" mode="out-in">
          <p :key="message" class="optimizer__message-text">{{ message }}</p>
        </transition>
      </div>

      <!-- Phases -->
      <transition name="phase" mode="out-in">
        <!-- Calibrating phase -->
        <div v-if="phase === 'calibrating'" class="optimizer__phase" key="calibrating">
          <div class="optimizer__calibrate">
            <div class="optimizer__calibrate-ring">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  stroke-width="2"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="url(#calibrateGrad)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-dasharray="283"
                  :stroke-dashoffset="283 - (283 * calibrateProgress)"
                  class="optimizer__calibrate-progress"
                />
                <defs>
                  <linearGradient id="calibrateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00d4ff" />
                    <stop offset="100%" stop-color="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="optimizer__calibrate-inner">
                <span class="optimizer__calibrate-pct">{{ Math.round(calibrateProgress * 100) }}%</span>
              </div>
            </div>
            <p class="optimizer__calibrate-label">
              Calibrating for {{ store.quickProfile.ageRange || '26-35' }}y {{ store.quickProfile.sex || 'male' }}
            </p>
          </div>
        </div>

        <!-- Selection phase -->
        <div v-else-if="phase === 'selection'" class="optimizer__phase" key="selection">
          <h3 class="optimizer__section-title">Build your morning</h3>
          <p class="optimizer__section-desc">Select what you'd include in an ideal morning routine.</p>

          <div class="optimizer__grid">
            <button
              v-for="item in morningItems"
              :key="item.id"
              class="optimizer__item"
              :class="{ 'is-selected': selectedItems.has(item.id) }"
              @click="toggleItem(item.id)"
            >
              <span class="optimizer__item-icon">{{ item.icon }}</span>
              <span class="optimizer__item-label">{{ item.label }}</span>
              <div class="optimizer__item-check">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>

          <button
            class="optimizer__btn"
            :disabled="selectedItems.size === 0"
            @click="runSimulation"
          >
            See the impact
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Results phase -->
        <div v-else-if="phase === 'result'" class="optimizer__phase" key="result">
          <div class="optimizer__results">
            <div class="optimizer__result-card optimizer__result-card--positive">
              <div class="optimizer__result-value">+45<span class="optimizer__result-unit">min</span></div>
              <div class="optimizer__result-label">Deep focus window</div>
            </div>
            <div class="optimizer__result-card optimizer__result-card--shift">
              <div class="optimizer__result-value">-30<span class="optimizer__result-unit">min</span></div>
              <div class="optimizer__result-label">Cortisol peak shift</div>
            </div>
          </div>

          <button class="optimizer__btn" @click="$emit('next')">
            Start building my day
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOnboardingStore } from '@/stores/onboarding';

const emit = defineEmits(['next']);
const store = useOnboardingStore();

const phase = ref<'calibrating' | 'selection' | 'result'>('calibrating');
const message = ref("Applying your profile to the simulation model...");
const calibrateProgress = ref(0);
const selectedItems = ref(new Set<string>());

const morningItems = [
  { id: 'sunlight', label: 'Morning light', icon: '\u2600' },
  { id: 'exercise', label: 'Exercise', icon: '\u{1F3C3}' },
  { id: 'cold', label: 'Cold exposure', icon: '\u2744' },
  { id: 'protein', label: 'Protein breakfast', icon: '\u{1F373}' },
  { id: 'meditation', label: 'Meditation', icon: '\u{1F9D8}' },
  { id: 'delay', label: 'Delayed caffeine', icon: '\u2615' },
];

function toggleItem(id: string) {
  if (selectedItems.value.has(id)) {
    selectedItems.value.delete(id);
  } else {
    selectedItems.value.add(id);
  }
}

function runSimulation() {
  message.value = "Morning sunlight shifted your cortisol peak earlier\u2014extending your afternoon focus window.";
  phase.value = 'result';
}

onMounted(() => {
  // Animate calibration
  const duration = 2000;
  const startTime = performance.now();

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    calibrateProgress.value = progress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        message.value = "Your baseline is set. Now let's see what moves the needle.";
        setTimeout(() => {
          phase.value = 'selection';
        }, 1200);
      }, 400);
    }
  }

  requestAnimationFrame(animate);
});
</script>

<style scoped>
@import '../onboarding.css';

.optimizer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--ob-bg-deep, #050509);
  overflow: hidden;
}

.optimizer__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 40% 30%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 50% 35% at 60% 70%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
}

.optimizer__content {
  width: 100%;
  max-width: 480px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

/* Message */
.optimizer__message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(20, 20, 35, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.optimizer__message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #00d4ff;
}

.optimizer__message-text {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #c0c0d0;
  margin: 0;
}

/* Phases */
.optimizer__phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Calibrating */
.optimizer__calibrate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.optimizer__calibrate-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.optimizer__calibrate-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.optimizer__calibrate-progress {
  transition: stroke-dashoffset 0.1s ease;
}

.optimizer__calibrate-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.optimizer__calibrate-pct {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f0f0f5;
  font-variant-numeric: tabular-nums;
}

.optimizer__calibrate-label {
  font-size: 0.875rem;
  color: #8888a0;
  margin: 0;
}

/* Selection */
.optimizer__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f0f0f5;
  margin: 0;
  text-align: center;
}

.optimizer__section-desc {
  font-size: 0.9375rem;
  color: #8888a0;
  margin: -0.5rem 0 0;
  text-align: center;
}

.optimizer__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
  width: 100%;
}

.optimizer__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  color: inherit;
}

.optimizer__item:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
}

.optimizer__item.is-selected {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
}

.optimizer__item-icon {
  font-size: 1.5rem;
}

.optimizer__item-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #f0f0f5;
}

.optimizer__item-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s ease;
}

.optimizer__item.is-selected .optimizer__item-check {
  background: #00d4ff;
  color: #050509;
}

/* Results */
.optimizer__results {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.optimizer__result-card {
  flex: 1;
  padding: 1.25rem;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  text-align: center;
}

.optimizer__result-card--positive {
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(0, 212, 255, 0.05);
}

.optimizer__result-card--shift {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
}

.optimizer__result-value {
  font-size: 2rem;
  font-weight: 700;
  color: #f0f0f5;
  font-variant-numeric: tabular-nums;
}

.optimizer__result-card--positive .optimizer__result-value {
  color: #00d4ff;
}

.optimizer__result-card--shift .optimizer__result-value {
  color: #8b5cf6;
}

.optimizer__result-unit {
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.125rem;
}

.optimizer__result-label {
  font-size: 0.75rem;
  color: #8888a0;
  margin-top: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Button */
.optimizer__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #050509;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.optimizer__btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 212, 255, 0.4);
}

.optimizer__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transitions */
.phase-enter-active,
.phase-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.phase-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.phase-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.text-enter-active,
.text-leave-active {
  transition: all 0.3s ease;
}

.text-enter-from {
  opacity: 0;
}

.text-leave-to {
  opacity: 0;
}

/* Mobile */
@media (max-width: 400px) {
  .optimizer__grid {
    grid-template-columns: 1fr;
  }

  .optimizer__item {
    flex-direction: row;
    justify-content: flex-start;
    gap: 1rem;
    padding: 1rem 1.25rem;
  }

  .optimizer__results {
    flex-direction: column;
  }
}
</style>
