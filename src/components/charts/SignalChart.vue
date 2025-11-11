<template>
  <div class="chart">
    <div
      v-for="spec in seriesSpecs"
      :key="spec.key"
      class="series"
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
          {{ latestValue(spec.key).toFixed(2) }}
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
            <linearGradient :id="gradientId(spec)" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="gradientStops(spec)[0]" />
              <stop offset="100%" :stop-color="gradientStops(spec)[1]" />
            </linearGradient>
          </defs>
          <polyline
            :points="points(spec.key)"
            fill="none"
            :stroke="strokeUrl(spec)"
            stroke-width="1.5"
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

const props = defineProps<{
  grid: number[];
  seriesSpecs: ChartSeriesSpec[];
  seriesData: Record<string, number[]>;
  playheadMin: number;
  interventions?: Array<{ key: string; start: number; end: number; color?: string }>;
}>();

const emit = defineEmits<{ playhead: [number] }>();
const infoOpenKey = ref<string | null>(null);

const lineColor = (spec: ChartSeriesSpec) =>
  spec.color ?? TENDENCY_COLORS[spec.tendency ?? 'neutral'].line;

const fillColor = (spec: ChartSeriesSpec) => TENDENCY_COLORS[spec.tendency ?? 'neutral'].fill;

const gradientStops = (spec: ChartSeriesSpec) =>
  TENDENCY_LINE_GRADIENTS[spec.tendency ?? 'neutral'];

const gradientIdBase = Math.random().toString(36).slice(2);
const gradientId = (spec: ChartSeriesSpec) => `${gradientIdBase}-${spec.key}`;
const strokeUrl = (spec: ChartSeriesSpec) => `url(#${gradientId(spec)})`;

const latestValue = (key: string) => {
  const data = props.seriesData[key] ?? [];
  if (!data.length) return 0;
  const idx = Math.min(
    data.length - 1,
    Math.max(0, Math.round((props.playheadMin / (24 * 60)) * (data.length - 1)))
  );
  return data[idx] ?? 0;
};

const points = (key: string) => {
  const data = props.seriesData[key] ?? [];
  if (!data.length) return '';
  return data
    .map((value, idx) => `${(idx / Math.max(1, data.length - 1)) * 100},${30 - value * 20}`)
    .join(' ');
};

const playheadPercent = computed(() => `${(props.playheadMin / (24 * 60)) * 100}%`);

const normalizedBands = computed(() => {
  if (!props.interventions?.length) return [] as Array<{ key: string; left: string; width: string; color: string }>;
  return props.interventions.map((band) => {
    const left = `${(band.start / (24 * 60)) * 100}%`;
    const width = `${((band.end - band.start) / (24 * 60)) * 100}%`;
    return {
      key: band.key,
      left,
      width,
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
  const minutes = ratio * 24 * 60;
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
