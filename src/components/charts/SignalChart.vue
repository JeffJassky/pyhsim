<template>
  <div class="chart">
    <div
      v-for="spec in seriesSpecs"
      :key="spec.key"
      class="series"
      :class="{ 'series--premium': spec.isPremium }"
      @click="onChartClick"
    >
      <div
        class="series__canvas"
        :style="{
          '--line-color': lineColor(spec),
          '--fill-color': fillColor(spec),
        }"
      >
        <div class="series__overlay series__overlay--label">
          <span>{{ spec.label }}</span>
          <button
            v-if="spec.info"
            type="button"
            class="series__info-button"
            :aria-pressed="infoOpenKey === spec.key"
            :title="`More about ${spec.label}`"
            @click.stop="toggleInfo(spec.key)"
          >
            ⓘ
          </button>
        </div>
        <div
          v-if="spec.info && infoOpenKey === spec.key"
          class="series__info-card"
          @click.stop
        >
          <p>
            <strong>Physiology</strong>
            {{ spec.info.physiology }}
          </p>
          <p>
            <strong>Application</strong>
            {{ spec.info.application }}
          </p>
          <div v-if="spec.info.couplings?.length" class="series__couplings">
            <strong>Couplings</strong>
            <ul>
              <li v-for="edge in spec.info.couplings" :key="edge.source + edge.description">
                <span class="series__coupling-source">{{ edge.source }}</span>
                <span class="series__coupling-mapping">
                  {{ describeMapping(edge.mapping) }}
                </span>
                <span class="series__coupling-desc">{{ edge.description }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="series__overlay series__overlay--value">
          <template v-if="!spec.isPremium || (seriesData[spec.key] && seriesData[spec.key].length > 0)">
            {{ latestValue(spec.key).toFixed(2) }} <span class="unit">{{ spec.unit }}</span>
          </template>
          <span v-else class="premium-tag">
            <span class="premium-tag__icon">🔒</span>
            PREMIUM
          </span>
        </div>
        <div class="series__bands">
          <div
            v-for="band in normalizedBands"
            :key="band.key + spec.key"
            class="series__band"
            :style="{ left: band.left, width: band.width, background: band.color }"
          />
        </div>
        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient
              :id="gradientId(spec)"
              x1="0"
              y1="0"
              x2="0"
              y2="30"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" :stop-color="gradientStops(spec)[0]" />
              <stop offset="100%" :stop-color="gradientStops(spec)[1]" />
            </linearGradient>
          </defs>
          <polyline
            :points="points(spec)"
            fill="none"
            :stroke="strokeUrl(spec)"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polygon
            :points="fillPoints(spec)"
            :fill="strokeUrl(spec)"
            fill-opacity="0.12"
          />
        </svg>
        <div class="series__playhead" :style="{ left: playheadPercent }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ChartSeriesSpec, ResponseSpec } from '@/types';
import { TENDENCY_COLORS, TENDENCY_LINE_GRADIENTS } from '@/models/colors';

const props = withDefaults(
  defineProps<{
    grid: number[];
    seriesSpecs: ChartSeriesSpec[];
    seriesData: Record<string, number[]>;
    playheadMin: number;
    interventions?: Array<{ key: string; start: number; end: number; color?: string }>;
    dayStartMin?: number; // Minute of day where the view starts (e.g., 420 for 7 AM)
  }>(),
  { dayStartMin: 0 }
);

const emit = defineEmits<{ playhead: [number] }>();
const infoOpenKey = ref<string | null>(null);

const MINUTES_IN_DAY = 24 * 60;

// Convert a minute-of-day to display percentage, offset by dayStartMin
const minToPercent = (minute: number) => {
  const offset = ((minute - props.dayStartMin + MINUTES_IN_DAY) % MINUTES_IN_DAY);
  return (offset / MINUTES_IN_DAY) * 100;
};

// Convert a display percentage back to minute-of-day
const percentToMin = (percent: number) => {
  const offset = (percent / 100) * MINUTES_IN_DAY;
  return (offset + props.dayStartMin) % MINUTES_IN_DAY;
};

const lineColor = (spec: ChartSeriesSpec) =>
  spec.color ?? TENDENCY_COLORS[spec.tendency ?? 'neutral'].line;

const fillColor = (spec: ChartSeriesSpec) => TENDENCY_COLORS[spec.tendency ?? 'neutral'].fill;

const gradientStops = (spec: ChartSeriesSpec) =>
  TENDENCY_LINE_GRADIENTS[spec.tendency ?? 'neutral'];

const gradientId = (spec: ChartSeriesSpec) => `grad-${spec.key}`;
const strokeUrl = (spec: ChartSeriesSpec) => `url(#${gradientId(spec)})`;

const latestValue = (key: string) => {
  const data = props.seriesData[key] ?? [];
  if (!data.length) return 0;
  const idx = Math.min(
    data.length - 1,
    Math.max(0, Math.round((props.playheadMin / MINUTES_IN_DAY) * (data.length - 1)))
  );
  return data[idx] ?? 0;
};

const normalize = (val: number, spec: ChartSeriesSpec) => {
  const min = spec.yMin ?? 0;
  const max = spec.yMax ?? 1;
  const range = max - min;
  if (range === 0) return 0.5;
  // We allow clamping for the visual line so it stays in the box
  return Math.max(0, Math.min(1, (val - min) / range));
};

// Get reordered data starting from dayStartMin
const reorderedData = (data: number[]) => {
  if (!data.length) return [];
  const gridStep = props.grid.length > 1 ? props.grid[1] - props.grid[0] : 5;
  const startIdx = Math.round(props.dayStartMin / gridStep) % data.length;
  const result: { value: number; displayIdx: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const srcIdx = (startIdx + i) % data.length;
    result.push({ value: data[srcIdx], displayIdx: i });
  }
  return result;
};

const points = (spec: ChartSeriesSpec) => {
  const data = props.seriesData[spec.key] ?? [];
  if (!data.length) return '';
  const reordered = reorderedData(data);
  return reordered
    .map(({ value, displayIdx }) => {
      const norm = normalize(value, spec);
      return `${(displayIdx / Math.max(1, data.length - 1)) * 100},${28 - norm * 22}`;
    })
    .join(' ');
};

const fillPoints = (spec: ChartSeriesSpec) => {
  const data = props.seriesData[spec.key] ?? [];
  if (!data.length) return '';
  const reordered = reorderedData(data);
  const pts = reordered
    .map(({ value, displayIdx }) => {
      const norm = normalize(value, spec);
      return `${(displayIdx / Math.max(1, data.length - 1)) * 100},${28 - norm * 22}`;
    })
    .join(' ');
  return `0,30 ${pts} 100,30`;
};

const playheadPercent = computed(() => `${minToPercent(props.playheadMin)}%`);

const normalizedBands = computed(() => {
  if (!props.interventions?.length) return [] as Array<{ key: string; left: string; width: string; color: string }>;
  return props.interventions.map((band) => {
    const left = minToPercent(band.start);
    // Handle width carefully - if band wraps around, just show the duration directly
    const duration = band.end >= band.start
      ? band.end - band.start
      : (MINUTES_IN_DAY - band.start) + band.end;
    const width = (duration / MINUTES_IN_DAY) * 100;
    return {
      key: band.key,
      left: `${left}%`,
      width: `${width}%`,
      color: band.color || 'rgba(255,255,255,0.07)',
    };
  });
});

const onChartClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  if (!rect.width) return;
  const x = event.clientX - rect.left;
  const ratio = Math.min(1, Math.max(0, x / rect.width));
  const minutes = percentToMin(ratio * 100);
  emit('playhead', minutes);
};

const toggleInfo = (key: string) => {
  infoOpenKey.value = infoOpenKey.value === key ? null : key;
};

const describeMapping = (spec: ResponseSpec): string => {
  switch (spec.kind) {
    case 'linear':
      return `linear (${spec.gain >= 0 ? '+' : ''}${spec.gain.toFixed(2)})`;
    case 'hill':
      return `hill (Emax ${spec.Emax}, EC50 ${spec.EC50}, n ${spec.n})`;
    case 'ihill':
      return `ihill (Imax ${spec.Imax}, IC50 ${spec.IC50}, n ${spec.n})`;
    case 'logistic':
      return `logistic (L ${spec.L}, k ${spec.k})`;
    default:
      return 'nonlinear';
  }
};

watch(
  () => props.seriesSpecs,
  () => {
    infoOpenKey.value = null;
  },
  { deep: true }
);
</script>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.series__canvas {
  position: relative;
}

.series__bands {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.series__band {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 6px;
  opacity: 0.35;
}

.series__playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.6);
  z-index: 2;
}

svg {
  width: 100%;
  height: 60px;
  display: block;
  position: relative;
  z-index: 0;
}

.series__canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--fill-color, transparent);
  border-radius: 8px;
  z-index: 0;
}

.series__canvas svg,
.series__canvas .series__bands,
.series__canvas .series__playhead {
  z-index: 1;
}

.series__overlay {
  position: absolute;
  z-index: 2;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0;
  background: transparent;
  pointer-events: none;
  color: #f5f5f5;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

.series__overlay--label {
  top: 4px;
  left: 6px;
  opacity: 0.5;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  pointer-events: auto;
}

.series__overlay--value {
  top: 4px;
  right: 6px;
  opacity: 0.5;
}

.unit {
  font-size: 0.65rem;
  opacity: 0.7;
  margin-left: 1px;
}

.premium-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: linear-gradient(120deg, #fcd34d, #f59e0b);
  color: #111;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-shadow: none;
  opacity: 0.8;
}

.premium-tag__icon {
  font-size: 0.65rem;
}

.series--premium {
  cursor: pointer;
}

.series--premium .series__canvas::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.02) 10px,
    rgba(255, 255, 255, 0.02) 20px
  );
  border-radius: 8px;
  pointer-events: none;
}

.series__info-button {
  padding: 0.15rem 0.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  cursor: pointer;
  font-size: 0.65rem;
  line-height: 1;
}

.series__info-button[aria-pressed='true'],
.series__info-button:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #111;
}

.series__info-card {
  position: absolute;
  top: 26px;
  left: 6px;
  right: 6px;
  padding: 0.4rem 0.5rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(8, 13, 27, 0.85);
  color: #f8f8f8;
  font-size: 0.72rem;
  z-index: 3;
  pointer-events: auto;
}

.series__info-card p {
  margin: 0 0 0.25rem;
}

.series__info-card p:last-child {
  margin-bottom: 0;
}

.series__couplings {
  margin-top: 0.4rem;
  font-size: 0.7rem;
}

.series__couplings ul {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.series__couplings li {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.35rem;
  align-items: baseline;
}

.series__coupling-source {
  font-weight: 600;
}

.series__coupling-mapping {
  font-feature-settings: 'tnum';
  opacity: 0.7;
}

.series__coupling-desc {
  opacity: 0.85;
}
</style>
