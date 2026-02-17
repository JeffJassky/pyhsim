<template>
  <div class="hook" @click="handleSkip">
    <!-- Ambient background -->
    <div class="hook__ambient"></div>

    <!-- Central visualization -->
    <div class="hook__visual">
      <svg
        class="hook__body"
        viewBox="0 0 200 320"
        :class="{ 'is-visible': phase >= 1 }"
      >
        <!-- Abstract Bio-Network -->
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Neural network pathways -->
        <g class="hook__network" :class="{ 'is-active': phase >= 1 }">
          <line
            v-for="(line, i) in networkLines"
            :key="i"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
            stroke="rgba(0, 212, 255, 0.15)"
            stroke-width="1"
            class="hook__line"
            :style="{ animationDelay: `${i * 0.1}s` }"
          />
        </g>

        <!-- Signal nodes -->
        <g class="hook__signals" :class="{ 'is-active': phase >= 2 }">
          <circle
            v-for="(signal, i) in signals"
            :key="i"
            :cx="signal.x"
            :cy="signal.y"
            r="4"
            fill="#00d4ff"
            filter="url(#glow)"
            class="hook__signal"
            :style="{ animationDelay: `${i * 0.15}s` }"
          />
        </g>
      </svg>
    </div>

    <!-- Text content -->
    <div class="hook__text">
      <transition name="text-reveal" mode="out-in">
        <h1 v-if="phase >= 3" class="hook__headline" key="headline">
          See what happens<br />
          <span class="hook__headline-accent">before you try it.</span>
        </h1>
      </transition>

      <transition name="text-fade">
        <p v-if="phase >= 4" class="hook__subline" key="subline">
          Simulate how supplements, meds, and habits affect your biology - hour
          by hour.
        </p>
      </transition>
    </div>

    <!-- Skip control -->
    <button class="hook__skip" @click.stop="$emit('next')">Skip</button>

    <!-- Tap hint -->
    <transition name="fade">
      <p v-if="phase >= 4" class="hook__tap-hint">Tap to continue</p>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['next']);
const phase = ref(0);
let autoAdvanceTimer: number | null = null;

// Signal positions - abstract biological network
const signals = [
  { x: 100, y: 160 }, // Core
  { x: 140, y: 120 },
  { x: 60, y: 120 },
  { x: 140, y: 200 },
  { x: 60, y: 200 },
  { x: 100, y: 80 },
  { x: 100, y: 240 },
];

// Interconnected pathways
const networkLines = [
  { x1: 100, y1: 80, x2: 140, y2: 120 },
  { x1: 100, y1: 80, x2: 60, y2: 120 },
  { x1: 140, y1: 120, x2: 100, y2: 160 },
  { x1: 60, y1: 120, x2: 100, y2: 160 },
  { x1: 100, y1: 160, x2: 140, y2: 200 },
  { x1: 100, y1: 160, x2: 60, y2: 200 },
  { x1: 140, y1: 200, x2: 100, y2: 240 },
  { x1: 60, y1: 200, x2: 100, y2: 240 },
  { x1: 140, y1: 120, x2: 140, y2: 200 },
  { x1: 60, y1: 120, x2: 60, y2: 200 },
];

function handleSkip() {
  if (phase.value >= 4) {
    emit('next');
  }
}

onMounted(() => {
  // Choreographed reveal sequence
  const timings = [300, 800, 1600, 2400];

  timings.forEach((delay, i) => {
    setTimeout(() => {
      phase.value = i + 1;
    }, delay);
  });

  // Auto-advance after full animation
  autoAdvanceTimer = window.setTimeout(() => {
    emit('next');
  }, 6000);
});

onUnmounted(() => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
  }
});
</script>

<style scoped>
@import './onboarding.css';

.hook {
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
  cursor: pointer;
}

.hook__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% 30%, rgba(0, 212, 255, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 50% 70%, rgba(139, 92, 246, 0.04) 0%, transparent 50%);
  animation: ambientPulse 8s ease-in-out infinite;
}

@keyframes ambientPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.hook__visual {
  position: relative;
  width: 200px;
  height: 320px;
  margin-bottom: 2rem;
}

.hook__body {
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: translateY(20px);
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hook__body.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Signals animation */
.hook__signals {
  opacity: 0;
  transition: opacity 0.6s ease;
}

.hook__signals.is-active {
  opacity: 1;
}

.hook__signal {
  opacity: 0;
  animation: signalPulse 2.5s ease-in-out infinite;
}

@keyframes signalPulse {
  0%, 100% {
    opacity: 0.3;
    r: 3;
  }
  50% {
    opacity: 1;
    r: 5;
  }
}

/* Network lines */
.hook__network {
  opacity: 0;
  transition: opacity 0.8s ease 0.3s;
}

.hook__network.is-active {
  opacity: 1;
}

.hook__line {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: lineDraw 1.5s ease forwards;
}

@keyframes lineDraw {
  to { stroke-dashoffset: 0; }
}

/* Text */
.hook__text {
  text-align: center;
  z-index: 1;
  padding: 0 1.5rem;
}

.hook__headline {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: var(--ob-text-primary);
  margin: 0 0 1rem;
}

.hook__headline-accent {
  color: var(--ob-accent);
}

.hook__subline {
  font-size: 1.125rem;
  color: var(--ob-text-secondary);
  margin: 0;
  font-weight: 400;
}

/* Skip button */
.hook__skip {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: var(--ob-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  padding: 0.5rem 1rem;
  transition: color 0.2s ease;
}

.hook__skip:hover {
  color: var(--ob-text-primary);
}

/* Tap hint */
.hook__tap-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8125rem;
  color: var(--ob-text-muted);
  animation: tapPulse 2s ease-in-out infinite;
}

@keyframes tapPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Transitions */
.text-reveal-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.text-reveal-enter-from {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(10px);
}

.text-fade-enter-active {
  transition: all 0.6s ease 0.2s;
}

.text-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
