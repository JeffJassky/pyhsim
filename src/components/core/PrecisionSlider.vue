<template>
  <div class="precision-slider">
    <div class="slider-container" ref="container">
      <div class="ticks-container">
        <div
          v-for="(tick, index) in ticks"
          :key="tick.value"
          class="tick"
          :class="{ 
            'tick--major': tick.isMajor,
            'tick--first': index === 0,
            'tick--last': index === ticks.length - 1
          }"
          :style="{ left: tick.percent + '%' }"
        >
          <span v-if="tick.isMajor" class="tick-label">{{ tick.label }}</span>
        </div>
      </div>

      <div class="track-area">
        <div class="track-line"></div>
        <div class="track-fill" :style="{ width: handlePercent + '%' }"></div>
      </div>

      <input
        type="range"
        class="native-slider"
        :min="min"
        :max="max"
        :step="step"
        :value="value"
        @input="onInput"
        @change="onInput"
      />

      <div class="custom-handle" :style="{ left: handlePercent + '%' }">
        <div class="handle-arrow"></div>
        <div class="handle-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  value: number;
  min: number;
  max: number;
  step?: number | 'any';
  unit?: string;
}>();

const emit = defineEmits<{
  input: [Event];
  change: [Event];
}>();

const handlePercent = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(100, ((props.value - props.min) / range) * 100));
});

const ticks = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return [];

  const stepVal = typeof props.step === 'number' ? props.step : range / 100;
  const totalSteps = Math.round(range / stepVal);

  // Always start with the min
  const result = [
    {
      value: props.min,
      percent: 0,
      label: formatValue(props.min) + (props.unit ? ' ' + props.unit : ''),
      isMajor: true,
    },
  ];

  // Determine how many intervals we want (1 to 4 intervals = 2 to 5 ticks)
  let numIntervals = 4;
  if (totalSteps <= 4) {
    numIntervals = totalSteps;
  } else {
    // Try to find a clean divisor for the steps (prefer 4, then 2, then 3)
    if (totalSteps % 4 === 0) numIntervals = 4;
    else if (totalSteps % 2 === 0) numIntervals = 2;
    else if (totalSteps % 3 === 0) numIntervals = 3;
    else numIntervals = 4; // Fallback to 4 even if not perfectly clean
  }

  // Generate intermediate ticks
  for (let i = 1; i < numIntervals; i++) {
    const stepCount = Math.round((totalSteps * i) / numIntervals);
    const val = props.min + stepCount * stepVal;

    // Avoid duplicates or being too close to the ends
    const percent = ((val - props.min) / range) * 100;
    if (percent > 5 && percent < 95) {
      result.push({
        value: val,
        percent: percent,
        label: formatValue(val) + (props.unit ? ' ' + props.unit : ''),
        isMajor: true,
      });
    }
  }

  // Always add the effective max (the highest reachable value given the step)
  const effectiveMax = props.min + totalSteps * stepVal;
  const maxPercent = ((effectiveMax - props.min) / range) * 100;

  // Only add if it's not already there (which can happen for small totalSteps)
  if (!result.find(t => Math.abs(t.percent - maxPercent) < 1)) {
    result.push({
      value: effectiveMax,
      percent: maxPercent,
      label: formatValue(effectiveMax) + (props.unit ? ' ' + props.unit : ''),
      isMajor: true,
    });
  }

  return result.sort((a, b) => a.percent - b.percent);
});

function formatValue(val: number) {
  if (typeof props.step === 'number') {
    const stepStr = props.step.toString();
    const decimalPlaces = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    // Format to the same precision as the step, but remove unnecessary trailing zeros
    const formatted = val.toFixed(decimalPlaces);
    return parseFloat(formatted).toString();
  }

  if (Math.abs(val) >= 100) return Math.round(val).toString();
  if (val % 1 === 0) return val.toString();
  return val.toFixed(1);
}

const onInput = (event: Event) => {
  emit('input', event);
};
</script>

<style scoped>
.precision-slider {
  padding-top: 1.5rem;
  padding-bottom: 0.5rem;
  user-select: none;
}

.slider-container {
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
}

.ticks-container {
  position: absolute;
  top: -1.2rem;
  left: 0;
  right: 0;
  height: 12px;
}

.tick {
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 3px;
  background: var(--color-border-strong);
  transform: translateX(-50%);
  transition: height 0.15s ease, background 0.15s ease;
}

.tick--major {
  height: 5px;
  background: var(--color-text-muted);
}

.tick-label {
  position: absolute;
  top: -0.9rem;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  letter-spacing: -0.02em;
}

.tick--first .tick-label {
  transform: translateX(0);
}

.tick--last .tick-label {
  transform: translateX(-100%);
}

.track-area {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  display: flex;
  align-items: flex-end;
}

.track-line {
  position: absolute;
  width: 100%;
  height: 1px;
  background: var(--color-border-default);
}

.track-fill {
  position: absolute;
  height: 1px;
  background: var(--color-active);
  opacity: 0.2;
  transition: opacity 0.15s ease;
}

.native-slider {
  position: absolute;
  top: -10px;
  left: 0;
  width: 100%;
  height: 32px;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
  margin: 0;
}

.custom-handle {
  position: absolute;
  bottom: 0;
  pointer-events: none;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
}

.handle-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid var(--color-active);
}

.handle-line {
  width: 1px;
  height: 4px;
  background: var(--color-active);
}

.native-slider:focus-visible ~ .custom-handle .handle-arrow {
  border-bottom-color: var(--color-text-active);
  filter: drop-shadow(0 0 2px var(--color-active));
}

.native-slider:focus-visible ~ .custom-handle .handle-line {
  background: var(--color-text-active);
}

/* Hover effects */
.slider-container:hover .handle-arrow {
  border-bottom-color: var(--color-text-active);
}

.slider-container:hover .track-fill {
  opacity: 0.4;
}
</style>
