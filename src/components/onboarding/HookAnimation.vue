<template>
  <div class="hook" @click="handleSkip">
    <!-- Ambient background -->
    <div class="hook__ambient"></div>

    <!-- Central visualization -->
    <div class="hook__visual">
      <svg
        class="hook__body"
        viewBox="0 0 200 400"
        :class="{ 'is-visible': phase >= 1 }"
      >
        <!-- Human form - minimal, abstract -->
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(0, 212, 255, 0.15)" />
            <stop offset="100%" stop-color="rgba(139, 92, 246, 0.08)" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Body silhouette -->
        <ellipse
          cx="100" cy="60" rx="28" ry="32"
          fill="url(#bodyGrad)"
          class="hook__head"
        />
        <path
          d="M60,100 Q55,180 60,280 L140,280 Q145,180 140,100 Q120,85 100,85 Q80,85 60,100 Z"
          fill="url(#bodyGrad)"
          class="hook__torso"
        />

        <!-- Signal pathways - flowing energy -->
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

        <!-- Neural network hints -->
        <g class="hook__network" :class="{ 'is-active': phase >= 2 }">
          <line
            v-for="(line, i) in networkLines"
            :key="i"
            :x1="line.x1" :y1="line.y1"
            :x2="line.x2" :y2="line.y2"
            stroke="rgba(139, 92, 246, 0.3)"
            stroke-width="1"
            class="hook__line"
            :style="{ animationDelay: `${i * 0.1}s` }"
          />
        </g>
      </svg>
    </div>

    <!-- Text content -->
    <div class="hook__text">
      <transition name="text-reveal" mode="out-in">
        <h1 v-if="phase >= 3" class="hook__headline" key="headline">
          Understand your body.<br/>
          <span class="hook__headline-accent">Minute by minute.</span>
        </h1>
      </transition>

      <transition name="text-fade">
        <p v-if="phase >= 4" class="hook__subline" key="subline">
          Real-time simulation of your biology.
        </p>
      </transition>
    </div>

    <!-- Skip control -->
    <button class="hook__skip" @click.stop="$emit('next')">
      Skip
    </button>

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

// Signal positions flowing through the body
const signals = [
  { x: 100, y: 55 },   // Brain
  { x: 95, y: 90 },    // Throat
  { x: 105, y: 130 },  // Heart
  { x: 100, y: 170 },  // Core
  { x: 98, y: 210 },   // Gut
  { x: 102, y: 250 },  // Lower
];

// Abstract network lines
const networkLines = [
  { x1: 85, y1: 55, x2: 70, y2: 100 },
  { x1: 115, y1: 55, x2: 130, y2: 100 },
  { x1: 100, y1: 90, x2: 80, y2: 150 },
  { x1: 100, y1: 90, x2: 120, y2: 150 },
  { x1: 90, y1: 150, x2: 80, y2: 220 },
  { x1: 110, y1: 150, x2: 120, y2: 220 },
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

.hook__head,
.hook__torso {
  transition: opacity 0.8s ease;
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
  font-size: clamp(1.75rem, 6vw, 2.75rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #f0f0f5;
  margin: 0 0 1rem;
}

.hook__headline-accent {
  background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hook__subline {
  font-size: 1.125rem;
  color: #8888a0;
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
  color: #555570;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  padding: 0.5rem 1rem;
  transition: color 0.2s ease;
}

.hook__skip:hover {
  color: #f0f0f5;
}

/* Tap hint */
.hook__tap-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8125rem;
  color: #555570;
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
