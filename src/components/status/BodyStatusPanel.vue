<script setup lang="ts">
import { computed } from 'vue';
import { useEngineStore } from '@/stores/engine';
import { usePlayhead } from '@/composables/usePlayhead';
import Panel from '@/components/core/Panel.vue';
import { getDisplayValue, SIGNAL_UNITS } from '@/models/unified/signal-units';
import type { Signal } from '@/types';

const engineStore = useEngineStore();
const { minute } = usePlayhead();

const series = computed(() => engineStore.series);
const auxSeries = computed(() => engineStore.auxiliarySeries);
const gridMins = computed(() => engineStore.gridMins);

// Find the index in the grid that corresponds to the current playhead minute
const playheadIndex = computed(() => {
  if (!gridMins.value.length) return 0;
  const m = minute.value;
  // Find closest index
  let closest = 0;
  let minDiff = Math.abs(gridMins.value[0] - m);
  for (let i = 1; i < gridMins.value.length; i++) {
    const diff = Math.abs(gridMins.value[i] - m);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
});

// Get value at playhead for a given series
const getValueAtPlayhead = (arr: Float32Array | undefined): number => {
  if (!arr || arr.length === 0) return 0;
  return arr[playheadIndex.value] ?? 0;
};

// Helper to format percentage
const pct = (value: number, max = 1) => {
  return Math.round((value / max) * 100);
};

// Color constants (CSS variables don't work in inline SVG attributes with scoped styles)
const COLOR_GOOD = '#22c55e';
const COLOR_WARNING = '#f59e0b';
const COLOR_DANGER = '#ef4444';

// Helper to get gauge color based on value and whether higher is better
const getColor = (value: number, higherIsBetter: boolean, thresholds = { low: 0.3, high: 0.7 }) => {
  if (higherIsBetter) {
    if (value >= thresholds.high) return COLOR_GOOD;
    if (value >= thresholds.low) return COLOR_WARNING;
    return COLOR_DANGER;
  } else {
    if (value <= thresholds.low) return COLOR_GOOD;
    if (value <= thresholds.high) return COLOR_WARNING;
    return COLOR_DANGER;
  }
};

// Build sparkline path from Float32Array
const buildSparklinePath = (data: Float32Array | undefined, yMin = 0, yMax = 1): string => {
  if (!data || data.length === 0) return '';

  const width = 100;
  const height = 24;
  const padding = 2;

  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  // Find actual data range if not specified
  let actualMin = yMin;
  let actualMax = yMax;
  if (yMin === 0 && yMax === 1) {
    // Auto-range for 0-1 normalized data
    actualMin = Math.min(...Array.from(data));
    actualMax = Math.max(...Array.from(data));
    // Add some padding to the range
    const range = actualMax - actualMin;
    if (range < 0.01) {
      // If nearly flat, center around the value
      actualMin = Math.max(0, actualMin - 0.1);
      actualMax = Math.min(1, actualMax + 0.1);
    }
  }

  const range = actualMax - actualMin;
  const safeRange = range < 0.001 ? 1 : range; // Prevent division by zero

  const points: string[] = [];
  const step = data.length > 1 ? effectiveWidth / (data.length - 1) : effectiveWidth;

  for (let i = 0; i < data.length; i++) {
    const x = padding + i * step;
    const normalized = (data[i] - actualMin) / safeRange;
    const clampedNorm = Math.max(0, Math.min(1, normalized));
    const y = padding + effectiveHeight - clampedNorm * effectiveHeight;
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(' ');
};

// Get playhead x position for sparkline
const playheadX = computed(() => {
  if (!series.value) return 0;
  const firstKey = 'glucose';
  const data = series.value[firstKey];
  if (!data || data.length === 0) return 0;

  const width = 100;
  const padding = 2;
  const effectiveWidth = width - padding * 2;
  const step = effectiveWidth / (data.length - 1);

  return padding + playheadIndex.value * step;
});

interface MetricDef {
  key: string;
  source: 'signal' | 'auxiliary';
  label: string;
  higherIsBetter: boolean;
  description: string;
  yMin?: number;
  yMax?: number;
}

// Metric definitions grouped by category
const energyMetrics: MetricDef[] = [
  { key: 'hepaticGlycogen', source: 'auxiliary', label: 'Liver Glycogen', higherIsBetter: true, description: 'Stored glucose in liver' },
  { key: 'glucose', source: 'signal', label: 'Blood Glucose', higherIsBetter: true, description: 'Circulating glucose (mg/dL)', yMin: 60, yMax: 140 },
];

const sleepMetrics: MetricDef[] = [
  { key: 'adenosinePressure', source: 'auxiliary', label: 'Sleep Pressure', higherIsBetter: false, description: 'Builds while awake, clears during sleep' },
];

const stressMetrics: MetricDef[] = [
  { key: 'adrenaline', source: 'signal', label: 'Adrenaline', higherIsBetter: false, description: 'Acute stress response', yMin: 0, yMax: 500 }, // Was adrenalineReserve
  { key: 'cortisol', source: 'signal', label: 'Cortisol Level', higherIsBetter: false, description: 'Current cortisol (µg/dL)', yMin: 0, yMax: 25 },
  { key: 'cortisolIntegral', source: 'auxiliary', label: 'Stress Load', higherIsBetter: false, description: 'Accumulated cortisol exposure', yMin: 0, yMax: 200 },
];

const neurotransmitterMetrics: MetricDef[] = [
  { key: 'dopamineVesicles', source: 'auxiliary', label: 'Dopamine Capacity', higherIsBetter: true, description: 'Presynaptic dopamine stores' },
  { key: 'norepinephrineVesicles', source: 'auxiliary', label: 'Norepinephrine Capacity', higherIsBetter: true, description: 'Presynaptic NE stores' },
  { key: 'serotoninPrecursor', source: 'auxiliary', label: 'Serotonin Precursor', higherIsBetter: true, description: 'Tryptophan availability' },
  { key: 'gabaPool', source: 'auxiliary', label: 'GABA Tone', higherIsBetter: true, description: 'Inhibitory activity' },
  { key: 'acetylcholine', source: 'signal', label: 'Acetylcholine', higherIsBetter: true, description: 'Cholinergic tone' },
];

const growthMetrics: MetricDef[] = [
  { key: 'bdnfExpression', source: 'auxiliary', label: 'BDNF Expression', higherIsBetter: true, description: 'Brain-derived neurotrophic factor' },
  { key: 'ghReserve', source: 'auxiliary', label: 'Growth Hormone Reserve', higherIsBetter: true, description: 'Pituitary GH stores' },
];

const hasData = computed(() => !!series.value && !!auxSeries.value);

// Helper to get metric value and path
const getMetricData = (metric: MetricDef) => {
  if (!series.value || !auxSeries.value) return { value: 0, normalizedValue: 0, path: '', color: 'var(--color-warning)', unit: '' };
  
  const data = metric.source === 'signal' 
    ? (series.value as any)[metric.key] 
    : (auxSeries.value as any)[metric.key];
    
  const rawValue = getValueAtPlayhead(data);
  const display = metric.source === 'signal' 
    ? getDisplayValue(metric.key as Signal, rawValue)
    : { value: rawValue, unit: '%' };

  const yMin = metric.yMin ?? (metric.source === 'signal' ? SIGNAL_UNITS[metric.key as Signal]?.min : 0) ?? 0;
  const yMax = metric.yMax ?? (metric.source === 'signal' ? SIGNAL_UNITS[metric.key as Signal]?.max : 1) ?? 1;
  
  const normalizedValue = (display.value - yMin) / (yMax - yMin);
  return {
    value: display.value,
    unit: display.unit,
    normalizedValue: Math.max(0, Math.min(1, normalizedValue)),
    path: buildSparklinePath(data, yMin / (display.value / rawValue || 1), yMax / (display.value / rawValue || 1)), // Path still uses raw data scale
    color: getColor(normalizedValue, metric.higherIsBetter),
  };
};
</script>

<template>
  <Panel title="Body Status" icon="🫀" :collapsible="true" :default-collapsed="true">
    <div v-if="!hasData" class="no-data">
      <p>Run a simulation to see body status data.</p>
    </div>

    <div v-else class="status-grid">
      <!-- Energy -->
      <section class="status-group">
        <h4 class="group-title">Energy</h4>
        <div class="metrics">
          <div v-for="metric in energyMetrics" :key="metric.key" class="metric">
            <div class="metric-header">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-value">
                {{ getMetricData(metric).unit === '%' ? Math.round(getMetricData(metric).value * 100) : getMetricData(metric).value.toFixed(1) }}
                <span class="unit-label">{{ getMetricData(metric).unit }}</span>
              </span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                <path
                  :d="getMetricData(metric).path"
                  fill="none"
                  :stroke="getMetricData(metric).color"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  :x1="playheadX"
                  y1="0"
                  :x2="playheadX"
                  y2="24"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1"
                  stroke-dasharray="2,2"
                />
                <circle
                  :cx="playheadX"
                  :cy="24 - 2 - getMetricData(metric).normalizedValue * 20"
                  r="3"
                  :fill="getMetricData(metric).color"
                />
              </svg>
            </div>
            <p class="metric-desc">{{ metric.description }}</p>
          </div>
        </div>
      </section>

      <!-- Sleep -->
      <section class="status-group">
        <h4 class="group-title">Sleep</h4>
        <div class="metrics">
          <div v-for="metric in sleepMetrics" :key="metric.key" class="metric">
            <div class="metric-header">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-value">
                {{ getMetricData(metric).unit === '%' ? Math.round(getMetricData(metric).value * 100) : getMetricData(metric).value.toFixed(1) }}
                <span class="unit-label">{{ getMetricData(metric).unit }}</span>
              </span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                <path
                  :d="getMetricData(metric).path"
                  fill="none"
                  :stroke="getMetricData(metric).color"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  :x1="playheadX"
                  y1="0"
                  :x2="playheadX"
                  y2="24"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1"
                  stroke-dasharray="2,2"
                />
                <circle
                  :cx="playheadX"
                  :cy="24 - 2 - getMetricData(metric).normalizedValue * 20"
                  r="3"
                  :fill="getMetricData(metric).color"
                />
              </svg>
            </div>
            <p class="metric-desc">{{ metric.description }}</p>
          </div>
        </div>
      </section>

      <!-- Stress -->
      <section class="status-group">
        <h4 class="group-title">Stress</h4>
        <div class="metrics">
          <div v-for="metric in stressMetrics" :key="metric.key" class="metric">
            <div class="metric-header">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-value">
                {{ getMetricData(metric).unit === '%' ? Math.round(getMetricData(metric).value * 100) : getMetricData(metric).value.toFixed(1) }}
                <span class="unit-label">{{ getMetricData(metric).unit }}</span>
              </span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                <path
                  :d="getMetricData(metric).path"
                  fill="none"
                  :stroke="getMetricData(metric).color"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  :x1="playheadX"
                  y1="0"
                  :x2="playheadX"
                  y2="24"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1"
                  stroke-dasharray="2,2"
                />
                <circle
                  :cx="playheadX"
                  :cy="24 - 2 - getMetricData(metric).normalizedValue * 20"
                  r="3"
                  :fill="getMetricData(metric).color"
                />
              </svg>
            </div>
            <p class="metric-desc">{{ metric.description }}</p>
          </div>
        </div>
      </section>

      <!-- Neurotransmitters -->
      <section class="status-group status-group--wide">
        <h4 class="group-title">Neurotransmitter Capacity</h4>
        <div class="metrics metrics--grid">
          <div v-for="metric in neurotransmitterMetrics" :key="metric.key" class="metric metric--compact">
            <div class="metric-header">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-value">
                {{ getMetricData(metric).unit === '%' ? Math.round(getMetricData(metric).value * 100) : getMetricData(metric).value.toFixed(1) }}
                <span class="unit-label">{{ getMetricData(metric).unit }}</span>
              </span>
            </div>
            <div class="sparkline-container sparkline-container--small">
              <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                  :d="getMetricData(metric).path"
                  fill="none"
                  :stroke="getMetricData(metric).color"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  :x1="playheadX"
                  y1="0"
                  :x2="playheadX"
                  y2="20"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="1"
                />
                <circle
                  :cx="playheadX"
                  :cy="20 - 2 - getMetricData(metric).normalizedValue * 16"
                  r="2.5"
                  :fill="getMetricData(metric).color"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Growth Factors -->
      <section class="status-group">
        <h4 class="group-title">Growth Factors</h4>
        <div class="metrics">
          <div v-for="metric in growthMetrics" :key="metric.key" class="metric">
            <div class="metric-header">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-value">
                {{ getMetricData(metric).unit === '%' ? Math.round(getMetricData(metric).value * 100) : getMetricData(metric).value.toFixed(1) }}
                <span class="unit-label">{{ getMetricData(metric).unit }}</span>
              </span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
                <path
                  :d="getMetricData(metric).path"
                  fill="none"
                  :stroke="getMetricData(metric).color"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  :x1="playheadX"
                  y1="0"
                  :x2="playheadX"
                  y2="24"
                  stroke="rgba(255,255,255,0.5)"
                  stroke-width="1"
                  stroke-dasharray="2,2"
                />
                <circle
                  :cx="playheadX"
                  :cy="24 - 2 - getMetricData(metric).normalizedValue * 20"
                  r="3"
                  :fill="getMetricData(metric).color"
                />
              </svg>
            </div>
            <p class="metric-desc">{{ metric.description }}</p>
          </div>
        </div>
      </section>
    </div>
  </Panel>
</template>

<style scoped>
.no-data {
  padding: 1rem;
  text-align: center;
  opacity: 0.6;
}

.no-data p {
  margin: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.status-group {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
}

.status-group--wide {
  grid-column: 1 / -1;
}

.group-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metrics--grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric--compact {
  gap: 0.25rem;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.metric-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.metric-value {
  font-size: 0.85rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.unit-label {
  font-size: 0.65rem;
  opacity: 0.5;
  font-weight: 400;
}

.sparkline-container {
  height: 32px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
  padding: 4px;
}

.sparkline-container--small {
  height: 28px;
  padding: 4px;
}

.sparkline {
  width: 100%;
  height: 100%;
}

.metric-desc {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.5;
  line-height: 1.3;
}
</style>
