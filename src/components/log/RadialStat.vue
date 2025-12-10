<template>
  <div class="radial" :class="[`radial--${size}`]">
    <div class="radial__svg">
      <svg viewBox="0 0 120 120">
        <circle class="radial__track" cx="60" cy="60" r="52" />
        <circle
          class="radial__progress"
          :style="{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            stroke: color,
          }"
          cx="60"
          cy="60"
          r="52"
        />
      </svg>
      <div class="radial__content">
        <div class="radial__value">
          <strong>{{ roundedRemaining }}</strong>
          <span>{{ unit }}</span>
        </div>
        <small class="radial__remaining">remaining</small>
      </div>
    </div>
    <div class="radial__meta">
      <p class="radial__label">{{ label }}</p>
      <p v-if="showTarget" class="radial__target">{{ targetLabel }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    total: number;
    goal: number;
    unit?: string;
    color?: string;
    sublabel?: string;
    min?: number;
    size?: 'sm' | 'md' | 'lg';
    showTarget?: boolean;
  }>(),
  {
    unit: '',
    color: '#4ade80',
    min: 0,
    sublabel: '',
    size: 'md',
    showTarget: true,
  }
);

const circumference = 2 * Math.PI * 52;
const clampedGoal = computed(() => Math.max(props.goal || 0, 1));
const remaining = computed(() => props.goal - props.total);
const progress = computed(() => Math.min(1, Math.max(0, props.total / clampedGoal.value)));
const offset = computed(() => circumference * (1 - progress.value));
const roundedRemaining = computed(() => Math.round(remaining.value));
const targetLabel = computed(() => {
  const hasMin = props.min && props.min > 0;
  const hasMax = props.goal && props.goal > 0;
  if (!hasMin && !hasMax) return 'Goal: not set';
  if (hasMin && hasMax) return `Goal: ${props.min}-${props.goal}${props.unit}`;
  if (hasMax) return `Goal: ${props.goal}${props.unit}`;
  return `Goal: ${props.min}${props.unit}`;
});
</script>

<style scoped>
.radial {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.25rem 0;
}

.radial__svg {
  position: relative;
  width: 100%;
  max-width: 140px;
  aspect-ratio: 1;
  margin: 0 auto;
}

svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.radial__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 8;
}

.radial__progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease, stroke 0.2s ease;
}

.radial__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.radial__value {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 1.5rem;
}

.radial__value strong {
  font-size: 2.2rem;
}

.radial__meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  text-align: center;
}

.radial__label {
  margin: 0;
  opacity: 0.85;
}

.radial__target {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.65;
}

.radial--lg .radial__svg {
  max-width: 180px;
}

.radial--sm .radial__svg {
  max-width: 95px;
}

.radial--sm .radial__value {
  font-size: 1.1rem;
}

.radial--sm .radial__value strong {
  font-size: 1.5rem;
}

.radial--sm .radial__remaining,
.radial--sm .radial__target,
.radial--sm .radial__label {
  font-size: 0.6rem;
}
</style>
