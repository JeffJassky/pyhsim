<template>
  <div ref="chartContainer" class="chart">
    <div
      v-for="spec in seriesSpecs"
      :key="spec.key"
      class="series-container"
      :data-id="spec.key"
    >
      <div class="series-wrapper">
        <div class="series-sidebar__drag">☰</div>
        <div class="series-sidebar">
          <div class="series-sidebar__label" :title="spec.label">
            {{ spec.label }}
          </div>
          <div class="series-sidebar__actions">
            <button
              type="button"
              class="series-sidebar__btn series-sidebar__hide"
              v-tooltip="'Hide'"
              @click="hideSignal(spec.key)"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button
              v-if="spec.info"
              type="button"
              class="series-sidebar__btn series-sidebar__info"
              :class="{ 'is-active': infoOpenKey === spec.key }"
              v-tooltip="'Learn more'"
              @click="toggleInfo(spec.key)"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        </div>
        <div
          class="series"
          :class="{ 'series--premium': isLocked(spec.key) }"
          @click="onChartClick"
        >
          <div
            class="series__canvas"
            :style="{
              '--line-color': lineColor(spec),
              '--fill-color': fillColor(spec),
            }"
          >
            <div class="series__overlay series__overlay--value">
              <template v-if="!isLocked(spec.key)">
                {{ latestValue(spec.key).toFixed(2) }}
                <span class="unit">{{ spec.unit }}</span>
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

      <!-- Expanded Info Section -->
      <Transition name="expand">
        <div
          v-if="spec.info && infoOpenKey === spec.key"
          class="series-info-expanded"
        >
          <div class="series-info-expanded__content">
            <div class="info-grid">
              <div class="info-section">
                <h4>Physiology</h4>
                <p>{{ spec.info.physiology }}</p>
              </div>
              <div class="info-section">
                <h4>Application</h4>
                <p>{{ spec.info.application }}</p>
              </div>
            </div>

            <div v-if="spec.info.couplings?.length" class="series__couplings">
              <h4>PATHWAY COUPLINGS</h4>
              <div class="couplings-grid">
                <div
                  v-for="edge in spec.info.couplings"
                  :key="edge.source + edge.description"
                  class="coupling-item"
                >
                  <div class="coupling-item__header">
                    <span
                      class="series__coupling-source"
                      >{{ edge.source }}</span
                    >
                    <span
                      class="series__coupling-mapping"
                      >{{ describeMapping(edge.mapping) }}</span
                    >
                  </div>
                  <div class="series__coupling-desc">
                    {{ edge.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { ChartSeriesSpec, ResponseSpec, Signal } from '@/types';
import { TENDENCY_COLORS, TENDENCY_LINE_GRADIENTS } from '@/models/colors';
import { getAllUnifiedDefinitions } from '@/models/unified';
import Sortable from 'sortablejs';
import { useProfilesStore } from '@/stores/profiles';

const UNIFIED_DEFS = getAllUnifiedDefinitions();

const props = withDefaults(
  defineProps<{
    grid: number[];
    seriesSpecs: ChartSeriesSpec[];
    seriesData: Record<string, number[]>;
    playheadMin: number;
    interventions?: Array<{ key: string; start: number; end: number; color?: string }>;
    dayStartMin?: number; // Minute of day where the view starts (e.g., 420 for 7 AM)
    viewMinutes?: number;
  }>(),
  { dayStartMin: 0, viewMinutes: 1440 }
);

const emit = defineEmits<{ playhead: [number] }>();
const infoOpenKey = ref<string | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const sortable = ref<Sortable | null>(null);
const profilesStore = useProfilesStore();

const MINUTES_IN_DAY = 24 * 60;

const isLocked = (key: string) => {
  const data = props.seriesData[key];
  return UNIFIED_DEFS[key as Signal]?.isPremium && (!data || data.length === 0);
};

// Convert a minute-of-day to display percentage
const minToPercent = (minute: number) => {
  const rel = minute - props.dayStartMin;
  return (rel / props.viewMinutes) * 100;
};

// Convert a display percentage back to minute-of-day
const percentToMin = (percent: number) => {
  return props.dayStartMin + (percent / 100) * props.viewMinutes;
};

const lineColor = (spec: ChartSeriesSpec) =>
  spec.color ?? TENDENCY_COLORS[spec.tendency ?? 'neutral'].line;

const fillColor = (spec: ChartSeriesSpec) => TENDENCY_COLORS[spec.tendency ?? 'neutral'].fill;

const gradientStops = (spec: ChartSeriesSpec) =>
  TENDENCY_LINE_GRADIENTS[spec.tendency ?? 'neutral'];

const gradientId = (spec: ChartSeriesSpec) => `grad-${spec.key}`;
const strokeUrl = (spec: ChartSeriesSpec) => `url(#${gradientId(spec)})`;

const getStep = () => {
  if (props.grid.length < 2) return 5;
  return props.grid[1] - props.grid[0];
};

const latestValue = (key: string) => {
  const data = props.seriesData[key] ?? [];
  if (!data.length) return 0;
  const step = getStep();
  const idx = Math.max(0, Math.floor(props.playheadMin / step));
  return data[Math.min(idx, data.length - 1)] ?? 0;
};

const normalize = (val: number, spec: ChartSeriesSpec) => {
  const min = spec.yMin ?? 0;
  const max = spec.yMax ?? 1;
  const range = max - min;
  if (range === 0) return 0.5;
  // We allow clamping for the visual line so it stays in the box
  return Math.max(0, Math.min(1, (val - min) / range));
};

const getSliceIndices = () => {
  const step = getStep();
  const startIdx = Math.floor(props.dayStartMin / step);
  const count = Math.ceil(props.viewMinutes / step);
  return { start: startIdx, end: startIdx + count };
};

const points = (spec: ChartSeriesSpec) => {
  const data = props.seriesData[spec.key] ?? [];
  if (!data.length) return '';
  
  const { start, end } = getSliceIndices();
  const sliced = Array.from(data.slice(start, end));
  
  return sliced
    .map((value, i) => {
      const norm = normalize(value, spec);
      return `${(i / Math.max(1, sliced.length - 1)) * 100},${28 - norm * 22}`;
    })
    .join(' ');
};

const fillPoints = (spec: ChartSeriesSpec) => {
  const data = props.seriesData[spec.key] ?? [];
  if (!data.length) return '';
  
  const { start, end } = getSliceIndices();
  const sliced = Array.from(data.slice(start, end));
  
  const pts = sliced
    .map((value, i) => {
      const norm = normalize(value, spec);
      return `${(i / Math.max(1, sliced.length - 1)) * 100},${28 - norm * 22}`;
    })
    .join(' ');
  return `0,30 ${pts} 100,30`;
};

const playheadPercent = computed(() => `${minToPercent(props.playheadMin)}%`);

const normalizedBands = computed(() => {
  if (!props.interventions?.length) return [] as Array<{ key: string; left: string; width: string; color: string }>;
  return props.interventions.map((band) => {
    const startRel = band.start - props.dayStartMin;
    const endRel = band.end - props.dayStartMin;
    
    const left = (startRel / props.viewMinutes) * 100;
    const width = ((band.end - band.start) / props.viewMinutes) * 100;
    
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

const hideSignal = (key: string) => {
  profilesStore.toggleSignal(key as Signal, false);
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

onMounted(() => {
  if (chartContainer.value) {
    sortable.value = new Sortable(chartContainer.value, {
      animation: 150,
      handle: '.series-sidebar__drag',
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        if (evt.oldIndex === evt.newIndex) return;

        const currentOrder = [...profilesStore.signalOrder];
        const movedId = evt.item.dataset.id as Signal;

        // Remove from old pos
        const oldIdx = currentOrder.indexOf(movedId);
        if (oldIdx > -1) currentOrder.splice(oldIdx, 1);

        // Insert at new relative pos among the CURRENTLY VISIBLE specs
        const visibleOrder = props.seriesSpecs.map(s => s.key as Signal);
        const neighborId = visibleOrder[evt.newIndex!];
        const neighborGlobalIdx = currentOrder.indexOf(neighborId);

        currentOrder.splice(neighborGlobalIdx, 0, movedId);
        profilesStore.updateSignalOrder(currentOrder);
      }
    });
  }
});

onBeforeUnmount(() => {
  sortable.value?.destroy();
});

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

.series-container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.series-wrapper {
  display: flex;
  gap: 0;
  align-items: stretch;
  transition: background 0.2s ease;
  border-radius: 8px;
}

.series-wrapper:hover {
  background: rgba(255, 255, 255, 0.02);
}

.series-sidebar__drag {
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  opacity: 0;
  font-size: 0.9rem;
  padding: 4px;
  transition: opacity 0.2s ease;
  color: rgba(248, 250, 252, 0.35);
  user-select: none;
}

.series-container:hover .series-sidebar__drag {
  opacity: 1;
}

.series-sidebar__drag:active {
  cursor: grabbing;
}

.series-sidebar {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
  padding: 0 10px;
  background: rgba(32, 53, 95, 0.6);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  color: rgba(248, 250, 252, 0.65);
  transition: all 0.2s ease;
}

.series-sidebar__actions {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.series-sidebar__btn {
  background: transparent;
  border: none;
  color: rgba(248, 250, 252, 0.3);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.series-wrapper:hover .series-sidebar__btn {
  opacity: 1;
}

.series-sidebar__btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.series-sidebar__btn.is-active {
  color: #8fbf5f;
  opacity: 1;
}

.series-sidebar__hide:hover {
  color: #ef4444;
}

.series-sidebar__label {
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 2px;
  text-align: right;
}

.series {
  flex: 1;
  min-width: 0;
}

.series__canvas {
  position: relative;
}

/* Expanded Info Section */
.series-info-expanded {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin-top: -4px;
  padding-top: 4px;
  overflow: hidden;
}

.series-info-expanded__content {
  padding: 1rem;
  padding-left: 132px; /* Sidebar width + gap */
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-section h4 {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8fbf5f;
  margin: 0 0 0.5rem 0;
}

.info-section p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(248, 250, 252, 0.8);
  margin: 0;
}

.series__couplings h4 {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(248, 250, 252, 0.4);
  margin: 0 0 0.75rem 0;
}

.couplings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.coupling-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 0.6rem;
}

.coupling-item__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.25rem;
}

.series__coupling-source {
  font-weight: 700;
  font-size: 0.8rem;
  color: #f8fafc;
}

.series__coupling-mapping {
  font-size: 0.7rem;
  font-family: monospace;
  color: #8fbf5f;
}

.series__coupling-desc {
  font-size: 0.75rem;
  line-height: 1.4;
  color: rgba(248, 250, 252, 0.6);
}

/* Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
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

.series__canvas svg {
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
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
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
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  pointer-events: none;
}

.sortable-ghost {
  opacity: 0.2;
  background: rgba(143, 191, 95, 0.1);
}
</style>
