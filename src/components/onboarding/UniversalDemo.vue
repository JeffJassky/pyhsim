<template>
  <div class="demo">
    <!-- Ambient background -->
    <div class="demo__ambient"></div>

    <!-- Content wrapper -->
    <div class="demo__wrapper">
      <!-- AI message -->
      <div class="demo__header">
        <transition name="message" mode="out-in">
          <div :key="messageKey" class="demo__message">
            <div class="demo__message-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <p class="demo__message-text">{{ currentMessage }}</p>
          </div>
        </transition>
      </div>

      <!-- Chart area -->
      <div class="demo__chart">
        <div class="demo__chart-inner">
          <SignalChart
            v-if="chartReady"
            :grid="grid"
            :seriesSpecs="currentSeriesSpecs"
            :seriesData="seriesData"
            :playheadMin="playheadMin"
            :interventions="interventions"
            :dayStartMin="420"
          />
        </div>

        <!-- Chart overlay for visual effect -->
        <div
          class="demo__chart-glow"
          :class="{ 'is-active': showCoffeeEffect }"
        ></div>
      </div>

      <!-- Timeline -->
      <div class="demo__timeline">
        <div class="demo__timeline-track">
          <!-- Time markers -->
          <div class="demo__timeline-markers">
            <span>7am</span>
            <span>12pm</span>
            <span>5pm</span>
            <span>10pm</span>
          </div>

          <!-- Events -->
          <div class="demo__timeline-events">
            <div
              v-for="item in timelineItems"
              :key="item.id"
              class="demo__event"
              :style="{ left: getTimePosition(item.time) }"
            >
              <div class="demo__event-dot"></div>
              <span class="demo__event-label">{{ item.label }}</span>
            </div>

            <!-- Add coffee button -->
            <transition name="pop">
              <button
                v-if="showAddCoffee"
                class="demo__add-coffee"
                :style="{ left: getTimePosition(900) }"
                @click="addCoffee"
              >
                <span class="demo__add-icon">+</span>
                <span class="demo__add-label">Add coffee</span>
              </button>
            </transition>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <transition name="fade-up">
        <div v-if="showCTA" class="demo__cta">
          <button class="demo__btn" @click="$emit('next')">
            Personalize my simulation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </transition>
    </div>

    <!-- Skip -->
    <button class="demo__skip" @click="$emit('next')">Skip demo</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SignalChart from '@/components/charts/SignalChart.vue';
import type { ChartSeriesSpec } from '@/types';

const emit = defineEmits(['next']);

// State
const playheadMin = ref(420);
const chartReady = ref(false);
const showAddCoffee = ref(false);
const showCTA = ref(false);
const showCoffeeEffect = ref(false);
const messageKey = ref(0);
const currentMessage = ref("Here's a typical Tuesday. Watch what happens to your energy.");

// Data
const grid = Array.from({ length: 24 }, (_, i) => i * 60);
const seriesData = ref<Record<string, number[]>>({});
const timelineItems = ref([
  { id: 1, time: 420, label: 'Wake' },
  { id: 2, time: 480, label: 'Coffee' },
  { id: 3, time: 750, label: 'Lunch' },
]);
const interventions = ref<{ key: string; start: number; end: number; color: string }[]>([]);

// Specs
const baseSpecs: ChartSeriesSpec[] = [
  { key: 'energy', label: 'Energy', tendency: 'higher', yMin: 0, yMax: 100, color: '#fbbf24' }
];

const advancedSpecs: ChartSeriesSpec[] = [
  { key: 'energy', label: 'Energy', tendency: 'higher', yMin: 0, yMax: 100, color: 'rgba(251, 191, 36, 0.3)' },
  { key: 'sleepPressure', label: 'Adenosine', tendency: 'lower', yMin: 0, yMax: 1, color: '#ef4444' },
  { key: 'cortisol', label: 'Cortisol', tendency: 'neutral', yMin: 0, yMax: 20, color: '#f97316' },
  { key: 'melatonin', label: 'Melatonin', tendency: 'neutral', yMin: 0, yMax: 50, color: '#8b5cf6' },
];

const currentSeriesSpecs = ref(baseSpecs);

function getTimePosition(minutes: number): string {
  const dayStart = 420; // 7am
  const dayEnd = 1380; // 11pm
  const pct = ((minutes - dayStart) / (dayEnd - dayStart)) * 100;
  return `${Math.max(0, Math.min(100, pct))}%`;
}

// ... (previous imports and state)

// Mock data generators
function generateEnergyCurve(hasAfternoonCoffee: boolean) {
  const data = [];
  for (let i = 0; i < 1440; i++) {
    let val = 20;
    if (i > 420 && i < 1380) {
      const timeAwake = i - 420;
      // Peak earlier in the day (around 11am-12pm)
      val += Math.sin(timeAwake / 280) * 40;

      // Persistent afternoon crash (Sigmoid)
      if (i > 600) {
        const drop = 55 / (1 + Math.exp(-(i - 960) / 90));
        val -= drop;
      }

      if (hasAfternoonCoffee && i >= 900) {
        const coffeeTime = i - 900;
        val += Math.max(0, 45 * Math.exp(-coffeeTime / 150));
      }
    }
    data.push(Math.max(0, Math.min(100, val + 50)));
  }
  return data;
}

function generateMelatoninCurve(hasCoffee: boolean) {
  return Array.from({ length: 1440 }, (_, i) => {
    // Normal: Onset 8pm (1200). With Coffee: Onset 9:30pm (1290)
    const onset = hasCoffee ? 1290 : 1200;
    // Suppressed peak with coffee
    const range = hasCoffee ? 25 : 40;
    if (i < onset) return 5;
    return 5 + range * Math.min(1, (i - onset) / 120);
  });
}

function generateData() {
  const energy = generateEnergyCurve(false);

  const sleepPressure = Array.from({ length: 1440 }, (_, i) => {
    if (i < 420) return 0.1;
    let val = (i - 420) / 1000;
    if (i >= 900) val *= 0.6;
    return Math.min(1, val);
  });

  const cortisol = Array.from({ length: 1440 }, (_, i) => {
    const dist = Math.abs(i - 480);
    return 15 * Math.exp(-dist / 200) + 2;
  });

  seriesData.value = {
    energy,
    sleepPressure,
    cortisol,
    melatonin: generateMelatoninCurve(false)
  };
}

function updateMessage(msg: string) {
  currentMessage.value = msg;
  messageKey.value++;
}

async function runSequence() {
  generateData();
  chartReady.value = true;

  // Animate playhead to 3PM
  const start = 420;
  const end = 900;
  const duration = 2500;
  const startTime = performance.now();

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Eased progress
    const eased = 1 - Math.pow(1 - progress, 3);
    playheadMin.value = start + (end - start) * eased;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      updateMessage("It's 3pm. Energy's crashing. What do most people do?");
      setTimeout(() => {
        showAddCoffee.value = true;
      }, 800);
    }
  }

  requestAnimationFrame(animate);
}

function addCoffee() {
  showAddCoffee.value = false;
  showCoffeeEffect.value = true;
  timelineItems.value.push({ id: 4, time: 900, label: 'Coffee' });
  interventions.value = [{ key: 'coffee', start: 900, end: 945, color: 'rgba(139, 92, 246, 0.3)' }];

  // Force reactivity by replacing the object
  seriesData.value = {
    ...seriesData.value,
    energy: generateEnergyCurve(true),
    melatonin: generateMelatoninCurve(true)
  };

  updateMessage("That 3pm coffee just cost you 45 minutes of deep sleep tonight.");
  currentSeriesSpecs.value = advancedSpecs;

  setTimeout(() => {
    showCoffeeEffect.value = false;
    updateMessage("There's a better way. Let's build one for your biology.");
    showCTA.value = true;
  }, 3500);
}

onMounted(() => {
  setTimeout(runSequence, 800);
});
</script>

<style scoped>
@import './onboarding.css';

.demo {
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

.demo__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0, 212, 255, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 50% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%);
}

.demo__wrapper {
  width: 100%;
  max-width: 640px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

/* Header / Message */
.demo__header {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo__message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(20, 20, 35, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  max-width: 420px;
  backdrop-filter: blur(10px);
}

.demo__message-avatar {
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

.demo__message-text {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #c0c0d0;
  margin: 0;
}

/* Chart */
.demo__chart {
  position: relative;
  height: 220px;
  background: rgba(15, 15, 25, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  overflow: hidden;
}

.demo__chart-inner {
  width: 100%;
  height: 100%;
  padding: 1rem;
}

.demo__chart-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 60% 50%, rgba(139, 92, 246, 0.15), transparent 60%);
  opacity: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
}

.demo__chart-glow.is-active {
  opacity: 1;
}

/* Timeline */
.demo__timeline {
  padding: 0 1rem;
}

.demo__timeline-track {
  position: relative;
  height: 80px;
  background: rgba(15, 15, 25, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 0 1rem;
}

.demo__timeline-markers {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  font-size: 0.6875rem;
  color: #555570;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.demo__timeline-events {
  position: relative;
  height: 40px;
  margin-top: 0.5rem;
}

.demo__event {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.demo__event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555570;
  border: 2px solid #1a1a28;
}

.demo__event-label {
  font-size: 0.6875rem;
  color: #8888a0;
  white-space: nowrap;
}

/* Add coffee button */
.demo__add-coffee {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  color: inherit;
  z-index: 10;
}

/* ... (middle content) ... */

/* Skip */
.demo__skip {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: #555570;
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;
  z-index: 10;
}

.demo__skip:hover {
  color: #f0f0f5;
}

/* Transitions */
.message-enter-active,
.message-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop-enter-from {
  opacity: 0;
  transform: translateX(-50%) scale(0.5);
}

.pop-leave-active {
  transition: all 0.2s ease;
}

.pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.8);
}

.fade-up-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile */
@media (max-width: 480px) {
  .demo__chart {
    height: 180px;
  }

  .demo__message {
    padding: 0.875rem 1rem;
  }

  .demo__message-text {
    font-size: 0.875rem;
  }
}
</style>
