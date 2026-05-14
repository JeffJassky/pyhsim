<template>
  <div v-if="hasData" class="sparkline">
    <svg
      class="sparkline__svg"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`Activity over time from ${formatTime(minTime)} to ${formatTime(maxTime)}`"
    >
      <!-- Baseline reference line at 1.0 -->
      <line
        v-if="baselineInRange"
        class="sparkline__baseline"
        :x1="0"
        :y1="yForValue(1.0)"
        :x2="width"
        :y2="yForValue(1.0)"
      />

      <!-- The trace -->
      <polyline class="sparkline__trace" :points="tracePoints" />

      <!-- Playhead marker -->
      <line
        class="sparkline__playhead"
        :x1="playheadX"
        :y1="0"
        :x2="playheadX"
        :y2="height"
      />
      <circle class="sparkline__dot" :cx="playheadX" :cy="playheadY" :r="3" />
    </svg>

    <div class="sparkline__labels">
      <span class="sparkline__edge">{{ formatValue(yMin) }}</span>
      <span class="sparkline__hint">over {{ spanLabel }}</span>
      <span class="sparkline__edge">{{ formatValue(yMax) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: Float32Array | undefined;
  grid: readonly number[];
  playheadMin: number;
}>();

const width = 360;
const height = 60;
const PADDING_Y = 4;

const hasData = computed(() => !!props.data && props.data.length > 1 && props.grid.length > 1);

const minTime = computed(() => props.grid[0] ?? 0);
const maxTime = computed(() => props.grid[props.grid.length - 1] ?? 0);

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  return `${h}h`;
}

const spanLabel = computed(() => {
  const totalMin = maxTime.value - minTime.value;
  if (totalMin >= 1440) {
    const days = totalMin / 1440;
    return `${days.toFixed(days >= 2 ? 0 : 1)} days`;
  }
  return `${Math.round(totalMin / 60)}h`;
});

const range = computed(() => {
  if (!hasData.value || !props.data) return { yMin: 0, yMax: 1 };
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < props.data.length; i++) {
    const v = props.data[i];
    if (Number.isFinite(v)) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  lo = Math.min(lo, 0.95);
  hi = Math.max(hi, 1.05);
  const span = hi - lo;
  return { yMin: lo - span * 0.1, yMax: hi + span * 0.1 };
});

const yMin = computed(() => range.value.yMin);
const yMax = computed(() => range.value.yMax);
const yRange = computed(() => Math.max(0.0001, yMax.value - yMin.value));

function yForValue(v: number): number {
  const t = (v - yMin.value) / yRange.value;
  const usable = height - 2 * PADDING_Y;
  return height - PADDING_Y - t * usable;
}

const baselineInRange = computed(() => yMin.value <= 1.0 && yMax.value >= 1.0);

const tracePoints = computed(() => {
  if (!hasData.value || !props.data) return '';
  const arr = props.data;
  const N = arr.length;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * width;
    const y = yForValue(arr[i]);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
});

const playheadIndex = computed(() => {
  if (!hasData.value || props.grid.length < 2) return 0;
  const step = props.grid[1] - props.grid[0];
  const idx = Math.round((props.playheadMin - props.grid[0]) / step);
  return Math.max(0, Math.min((props.data?.length ?? 1) - 1, idx));
});

const playheadX = computed(() => {
  const N = props.data?.length ?? 1;
  return (playheadIndex.value / Math.max(1, N - 1)) * width;
});

const playheadY = computed(() => {
  if (!props.data) return height / 2;
  return yForValue(props.data[playheadIndex.value]);
});

function formatValue(v: number): string {
  if (Math.abs(v - 1) < 0.005) return '1.00';
  return v.toFixed(2);
}
</script>

<style scoped>
.sparkline {
  margin: 1rem 0 0;
}

.sparkline__svg {
  display: block;
  width: 100%;
  height: 60px;
  overflow: visible;
}

.sparkline__baseline {
  stroke: var(--color-border-default);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.sparkline__trace {
  fill: none;
  stroke: var(--color-text-primary);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.sparkline__playhead {
  stroke: var(--color-text-active);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.sparkline__dot {
  fill: var(--color-text-active);
}

.sparkline__labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.35rem;
  font-size: 0.65rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--color-text-muted);
}

.sparkline__edge {
  letter-spacing: 0.02em;
}

.sparkline__hint {
  font-family: inherit;
  font-style: italic;
}
</style>
