<template>
  <div
    ref="chartContainer"
    class="chart"
    :class="{ 'is-grid': layout === 'grid' }"
  >
    <div
      v-for="spec in seriesSpecs"
      :key="spec.key"
      class="series-container"
      :class="{
        'is-dimmed': isDimmed(spec.key),
	'is-selected': isSelected(spec.key),
		'is-highlighted': isHighlighted(spec.key),
      }"
      :data-id="spec.key"
    >
      <div class="series-wrapper">
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
            :class="[
              { 'is-flashing': flashStates[spec.key] },
              `tendency-${spec.idealTendency || 'none'}`
            ]"
          >
            <div class="loading-spinner" :class="{ 'is-active': loading }" />
            <div class="series__overlay series__overlay--value">
              <template v-if="!isLocked(spec.key)">
                {{ latestValue(spec.key).toFixed(latestValue(spec.key) < 1 ? 2 : 1) }}
                <span class="unit">{{ getUnit(spec.key) }}</span>
              </template>
              <span v-else class="premium-tag"> PREMIUM </span>
            </div>
            <div class="series__bands">
              <div
                v-for="band in normalizedBands"
                :key="band.key + spec.key"
                class="series__band"
                :style="{ left: band.left, width: band.width }"
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
                  <stop offset="0%" stop-color="var(--grad-0)" />
                  <stop offset="100%" stop-color="var(--grad-1)" />
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

            <!-- Change Indicators -->
            <Transition name="fade">
              <div
                v-if="indicators[spec.key]"
                :key="indicators[spec.key].id"
                class="series__indicator"
                :class="[`series__indicator--${indicators[spec.key].type}`]"
                :style="{
                  left: indicators[spec.key].x + '%',
                  top: indicators[spec.key].y + '%',
                }"
              >
                <span
                  class="series__indicator-arrow"
                  >{{ indicators[spec.key].type === 'up' ? '▲' : '▼' }}</span
                >
                <span class="series__indicator-value">
                  {{ indicators[spec.key].value.toFixed(indicators[spec.key].value < 1 ? 2 : 1) }}
                  <span
                    class="series__indicator-unit"
                    >{{ indicators[spec.key].unit }}</span
                  >
                </span>
              </div>
            </Transition>

            <div class="series__playhead" :style="{ left: playheadPercent }" />

            <!-- Monitor Dots -->
            <VDropdown
              v-for="dot in getMonitorDots(spec)"
              :key="dot.id"
              class="monitor-dot-wrapper"
              :style="{ left: dot.x + '%', top: dot.y + '%' }"
              :triggers="['hover']"
              placement="top"
              :distance="10"
            >
              <div class="monitor-dot" :class="`monitor-dot--${dot.outcome}`" />

              <template #popper>
                <div class="monitor-popover">
                  <div class="monitor-popover__header">
                    <span class="monitor-popover__icon">{{ dot.icon }}</span>
                    <span
                      class="monitor-popover__title"
                      >{{ dot.message }}</span
                    >
                  </div>
                  <div class="monitor-popover__value">
                    <span class="value-number">{{ dot.formattedValue }}</span>
                    <span class="value-unit">{{ dot.unit }}</span>
                    <span class="value-time">at {{ dot.detectedAtTime }}</span>
                  </div>
                  <div v-if="dot.description" class="monitor-popover__desc">
                    {{ dot.description }}
                  </div>
                </div>
              </template>
            </VDropdown>
          </div>
        </div>
      </div>

      <!-- Expanded Info Section -->
      <Transition name="expand">
        <div
          v-if="spec.info && infoOpenKey === spec.key"
          class="series-info-expanded selectable"
        >
          <div class="series-info-expanded__content">
            <div class="info-grid">
              <div class="info-section">
                <h4>{{  spec.label  }}</h4>
                <p>{{ spec.info.description }}</p>
              </div>
            </div>

            <div
              class="series__monitors"
              v-if="getSignalMonitors(spec.key).length"
            >
              <h4>MONITOR ALERTS</h4>
              <div class="monitors-list">
                <div
                  v-for="res in getSignalMonitors(spec.key)"
                  :key="res.monitor.id"
                  class="monitor-item"
                  :class="`monitor-item--${res.monitor.outcome}`"
                >
                  <div class="monitor-main">
                    <span class="monitor-icon">
                      {{ res.monitor.outcome === 'critical' ? '🚨' : res.monitor.outcome === 'warning' ? '⚠️' : '✅' }}
                    </span>
                    <span class="monitor-label">{{ res.monitor.message }}</span>
                  </div>
                  <div v-if="res.monitor.description" class="monitor-desc">
                    {{ res.monitor.description }}
                  </div>
                </div>
              </div>
            </div>

            <div
              class="series__contributors"
              v-if="getSignalConditions(spec.key).length"
            >
              <h4>YOUR CONDITIONS</h4>
              <div
                v-if="getSignalConditions(spec.key).length"
                class="contributors-list"
              >
                <div
                  v-for="cond in getSignalConditions(spec.key)"
                  :key="cond.label"
                  class="contributor-item contributor-item--condition"
                >
                  <div class="contributor-main">
                    <span class="contributor-icon">🧬</span>
                    <span class="contributor-label">{{ cond.label }}</span>
                  </div>
                  <div class="contributor-effect">
                    <span v-if="cond.value !== 0" class="contributor-value">
                      {{ cond.value > 0 ? '+' : ''











































































                      }}{{ (cond.value * 100).toFixed(0) }}%
                    </span>
                    <span
                      class="contributor-badge"
                      v-for="mechanism in cond.mechanisms"
                      >{{ mechanism }}</span
                    >
                  </div>
                </div>
              </div>
              <p v-else class="no-contributors">
                No active conditions are currently modifying this pathway.
              </p>
            </div>

            <div class="series__contributors">
              <h4>ACTIVE CONTRIBUTORS</h4>
              <div
                v-if="getSignalContributors(spec.key).length"
                class="contributors-list"
              >
                <div
                  v-for="item in getSignalContributors(spec.key)"
                  :key="item.id + item.label"
                  class="contributor-item"
                >
                  <div class="contributor-main">
                    <span class="contributor-icon">{{ item.icon }}</span>
                    <span class="contributor-label">{{ item.label }}</span>
                  </div>
                  <div class="contributor-effect">
                    <span class="contributor-value">
                      {{ item.value > 0 ? '+' : ''}}{{ item.value.toFixed(1) }}
                      <span class="contributor-unit">
                        {{ item.unit }}
                      </span>
                    </span>
                    <span v-if="item.isIndirect" class="contributor-badge"
                      >via {{ item.via }}</span
                    >
                  </div>
                </div>
              </div>
              <p v-else class="no-contributors">
                No active interventions are currently affecting this pathway.
              </p>
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
import { Dropdown as VDropdown } from 'floating-vue';
import type { ChartSeriesSpec, ResponseSpec, Signal, Minute, MonitorResult } from '@/types';
import { getAllUnifiedDefinitions } from '@kyneticbio/core';
import { getDisplayValue, SIGNAL_UNITS, minuteToLabel } from '@kyneticbio/core';
import Sortable from 'sortablejs';
import { useUserStore } from '@/stores/user';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';
import {
  isReceptor, isTransporter, isEnzyme,
  RECEPTORS, TRANSPORTERS, ENZYMES
} from '@kyneticbio/core';
import { CONDITION_LIBRARY, RECEPTOR_SIGNAL_MAP, RECEPTOR_SENSITIVITY_GAIN } from '@kyneticbio/core';
import { UNIT_CONVERSIONS } from '@kyneticbio/core';
import { EnzymeKey, ReceptorKey, TransporterKey, ProductionTerm, DynamicCoupling } from '@kyneticbio/core';

const UNIFIED_DEFS = getAllUnifiedDefinitions();

interface Props {
  grid: Minute[];
  seriesSpecs: ChartSeriesSpec[];
  seriesData: Record<string, number[]>;
  playheadMin: number;
  interventions?: Array<{
    key: string;
    start: number;
    end: number;
    color?: string;
  }>;
  dayStartMin: number;
  viewMinutes: number;
  loading?: boolean;
  layout?: 'list' | 'grid';
  highlightedKeys?: string[];
  selectedKeys?: string[];
  monitorResults?: MonitorResult[];
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'list',
});
const emit = defineEmits<{ (e: 'playhead', min: number): void }>();

const userStore = useUserStore();
const timelineStore = useTimelineStore();
const libraryStore = useLibraryStore();

const isSelected = (key: string) => props.selectedKeys?.includes(key);
const isDimmed = (key: string) => (props.highlightedKeys?.length && !props.highlightedKeys.includes(key)) || (props.selectedKeys?.length && !props.selectedKeys.includes(key));
const isHighlighted = (key: string) => props.highlightedKeys?.includes(key);

const getSignalMonitors = (key: string) => {
  if (!props.monitorResults) return [];
  // Sort by outcome severity: critical > warning > win
  const severity = { critical: 3, warning: 2, win: 1 };
  return props.monitorResults
    .filter(r => r.monitor.signal === key)
    .sort((a, b) => severity[b.monitor.outcome] - severity[a.monitor.outcome]);
};

const getMonitorDots = (spec: ChartSeriesSpec) => {
  const results = getSignalMonitors(spec.key);
  const dots: Array<{
    id: string;
    x: number;
    y: number;
    outcome: string;
    message: string;
    description?: string;
	formattedValue: string;
	detectedAtTime: string;
    unit: string;
    icon: string;
  }> = [];

  for (const res of results) {
    if (res.detectedAt < props.dayStartMin || res.detectedAt > props.dayStartMin + props.viewMinutes) continue;

    // Find the closest index in grid to detectedAt
    const idx = props.grid.findIndex(m => Math.abs(m - res.detectedAt) < 1);
    if (idx === -1) continue;

    const val = props.seriesData[spec.key]?.[idx];
    if (val === undefined) continue;

    const norm = normalize(val, spec);
    const x = minToPercent(res.detectedAt);

    // Y position calculation matching points() logic: 28 - norm * 22
    // This is in SVG units (0-30). Convert to percentage for CSS top.
    const yPosSvg = 28 - norm * 22;
    const y = (yPosSvg / 30) * 100;

    // Format trigger value
    let formattedValue = '';
    let unit = '';

    // triggerValue can be number or number[]
    if (Array.isArray(res.triggerValue)) {
        const v1 = getDisplayValue(spec.key as Signal, res.triggerValue[0]);
        const v2 = getDisplayValue(spec.key as Signal, res.triggerValue[res.triggerValue.length - 1]);
        formattedValue = `${v1.value.toFixed(1)} → ${v2.value.toFixed(1)}`;
        unit = v1.unit;
    } else {
        const v = getDisplayValue(spec.key as Signal, res.triggerValue);
        formattedValue = v.value.toFixed(v.value < 1 ? 2 : 1);
        unit = v.unit;
    }

    const icon = res.monitor.outcome === 'critical' ? '🚨' : res.monitor.outcome === 'warning' ? '⚠️' : '✅';

    dots.push({
      id: res.monitor.id + '_' + res.detectedAt,
      x,
      y,
      outcome: res.monitor.outcome,
      message: res.monitor.message,
      description: res.monitor.description,
      formattedValue,
      unit,
      icon,
      detectedAtTime: minuteToLabel(res.detectedAt as Minute)
    });
  }
  return dots;
};

const getSignalConditions = (signalKey: string) => {
  const contributors = [];
  const targetSignal = signalKey as Signal;

  for (const condition of CONDITION_LIBRARY) {
    const state = userStore.conditions[condition.key];
    if (!state?.enabled) continue;

    let totalGain = 0;
    const mechanisms: string[] = [];

    // 1. Check receptor modifiers
    for (const mod of condition.receptorModifiers ?? []) {
      const densityMappings = RECEPTOR_SIGNAL_MAP[mod.receptor] ?? [];
      for (const mapping of densityMappings) {
        if (mapping.signal === targetSignal) {
          const intensity = mod.paramKey ? (state.params[mod.paramKey] ?? 1) : 1;
          const gain = (mod.density ?? 0) * intensity * mapping.gainPerDensity;
          if (gain !== 0) {
            totalGain += gain;
            mechanisms.push(`${mod.receptor} density`);
          }
        }
      }

      const sensitivityMappings = RECEPTOR_SENSITIVITY_GAIN[mod.receptor] ?? [];
      for (const mapping of sensitivityMappings) {
        if (mapping.signal === targetSignal) {
          const intensity = mod.paramKey ? (state.params[mod.paramKey] ?? 1) : 1;
          const gain = (mod.sensitivity ?? 0) * intensity * mapping.gainPerSensitivity;
          if (gain !== 0) {
            totalGain += gain;
            mechanisms.push(`${mod.receptor} sensitivity`);
          }
        }
      }
    }

    // 2. Check transporter modifiers
    for (const mod of condition.transporterModifiers ?? []) {
      if (TRANSPORTERS[mod.transporter as TransporterKey]?.primarySignal === targetSignal) {
        // Transporters handle signal levels dynamically, but for educational purposes
        // we can describe the intended effect on the baseline.
        mechanisms.push(`${mod.transporter} activity`);
      }
    }

    // 3. Check enzyme modifiers
    for (const mod of condition.enzymeModifiers ?? []) {
      if (ENZYMES[mod.enzyme as EnzymeKey]?.substrates.includes(targetSignal)) {
        mechanisms.push(`${mod.enzyme} activity`);
      }
    }

    // 4. Check legacy signal modifiers
    for (const mod of condition.signalModifiers ?? []) {
      if (mod.key === targetSignal) {
        const intensity = mod.paramKey ? (state.params[mod.paramKey] ?? 1) : 1;
        if (mod.baseline?.amplitudeGain) {
          totalGain += mod.baseline.amplitudeGain * intensity;
          mechanisms.push('Baseline adjustment');
        }
      }
    }

    if (mechanisms.length > 0) {
      contributors.push({
        label: condition.label,
        mechanisms: [...new Set(mechanisms)],
        value: totalGain,
        unit: '%' // Conditions usually scale baselines by percentage
      });
    }
  }

  return contributors.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
};

const getSignalContributors = (signalKey: string) => {
  const contributors = [];
  const targetSignal = signalKey as Signal;
  const signalDef = UNIFIED_DEFS[targetSignal as Signal];

  // Identify signals that directly drive this one via production terms or couplings
  const upstreamSignals = new Set<Signal>();
  if (signalDef) {
    signalDef.dynamics.production.forEach((p: ProductionTerm) => {
      if (typeof p.source === 'string' && p.source !== 'constant' && p.source !== 'circadian') {
        upstreamSignals.add(p.source as Signal);
      }
    });
    signalDef.dynamics.couplings.forEach((c: DynamicCoupling) => {
      upstreamSignals.add(c.source as Signal);
    });
  }

  for (const item of timelineStore.items) {
    const def = libraryStore.defs.find((d) => d.key === item.meta.key);
    if (!def) continue;

    let pharms: any[] = [];
    if (typeof def.pharmacology === 'function') {
      const result = (def.pharmacology as any)(item.meta.params);
      pharms = Array.isArray(result) ? result : [result];
    } else {
      pharms = [def.pharmacology];
    }

    for (const pharm of pharms) {
      if (!pharm.pd) continue;
      for (const effect of pharm.pd) {
        let affects = false;
        let isIndirect = false;
        let via: string | undefined = undefined;
        let sign = 1;

        if (effect.target === signalKey) {
          affects = true;
        } else if (isReceptor(effect.target)) {
          const coupling = RECEPTORS[effect.target as ReceptorKey].couplings.find((c) => c.signal === signalKey);
          if (coupling) {
            affects = true;
            sign = coupling.sign;
          }
        } else if (isTransporter(effect.target)) {
          if (TRANSPORTERS[effect.target as TransporterKey].primarySignal === signalKey) {
            affects = true;
            sign = -1;
          }
        } else if (isEnzyme(effect.target)) {
          if (ENZYMES[effect.target as EnzymeKey].substrates.includes(targetSignal)) {
            affects = true;
            sign = -1;
          }
        }

        // Check for indirect effects via upstream signals
        if (!affects) {
          const directTarget = effect.target as Signal;
          if (upstreamSignals.has(directTarget)) {
            affects = true;
            isIndirect = true;
            via = UNIFIED_DEFS[directTarget]?.label || directTarget;
          } else if (isReceptor(effect.target)) {
            const upCouplings = RECEPTORS[effect.target as ReceptorKey].couplings;
            const match = upCouplings.find(c => upstreamSignals.has(c.signal));
            if (match) {
              affects = true;
              isIndirect = true;
              via = UNIFIED_DEFS[match.signal]?.label || match.signal;
            }
          }
        }

        if (affects) {
          let mech = effect.mechanism;
          let magnitude = effect.intrinsicEfficacy || 0;

          if (mech === 'antagonist' && sign === -1) {
            magnitude = Math.abs(magnitude);
          } else if (mech === 'agonist' && sign === -1) {
            magnitude = -Math.abs(magnitude);
          } else if (mech === 'antagonist') {
            magnitude = -Math.abs(magnitude);
          } else {
            magnitude = Math.abs(magnitude);
          }

          const scale = UNIT_CONVERSIONS[targetSignal]?.scaleFactor || 1;

          contributors.push({
            id: item.id,
            label: def.label,
            icon: def.icon,
            mechanism: effect.mechanism,
            value: magnitude * scale,
            unit: SIGNAL_UNITS[targetSignal as Signal]?.unit || '',
            isIndirect,
            via
          });
        }
      }
    }
  }

  // Deduplicate and sort by absolute magnitude
  return contributors
    .filter((v, i, a) => a.findIndex(t => t.id === v.id && t.label === v.label) === i)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
};

const infoOpenKey = ref<string | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const sortable = ref<Sortable | null>(null);

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
  const val = data[Math.min(idx, data.length - 1)] ?? 0;

  return getDisplayValue(key as Signal, val).value;
};

const getUnit = (key: string) => {
  return SIGNAL_UNITS[key as Signal]?.unit ?? 'x';
};

const normalize = (val: number, spec: ChartSeriesSpec) => {
  const min = spec.yMin ?? 0;
  const max = spec.yMax ?? 1;
  const range = max - min;
  if (range === 0) return 0.5;
  // We allow clamping for the visual line so it stays in the box
  return Math.max(0, Math.min(1, (val - min) / range));
};

// --- Change Tracking & Indicators ---
const indicators = ref<Record<string, { type: 'up' | 'down'; x: number; y: number; id: number; value: number; unit: string }>>({});
const flashStates = ref<Record<string, boolean>>({});
const previousData = new Map<string, number[]>();
const updatedKeysInCycle = new Set<string>();

watch(
  () => props.loading,
  (isLoading, wasLoading) => {
    if (isLoading && !wasLoading) {
      updatedKeysInCycle.clear();
    } else if (!isLoading && wasLoading) {
      // Finished loading, wipe indicators that didn't change in this cycle
      Object.keys(indicators.value).forEach((key) => {
        if (!updatedKeysInCycle.has(key)) {
          delete indicators.value[key];
        }
      });
      updatedKeysInCycle.clear();
    }
  }
);

watch(
  () => props.seriesData,
  (newData) => {
    if (!newData) return;

    const { start, end } = getSliceIndices();

    Object.keys(newData).forEach((key) => {
      const newArr = newData[key];
      const oldArr = previousData.get(key);
      const spec = props.seriesSpecs.find((s) => s.key === key);

      if (oldArr && newArr && oldArr.length === newArr.length && spec) {
        let maxDelta = 0;
        let maxIdx = -1;

        // Find position of most significant change in visible window
        for (let i = start; i < Math.min(end, newArr.length); i++) {
          const normNew = normalize(newArr[i], spec);
          const normOld = normalize(oldArr[i], spec);
          const delta = normNew - normOld;

          if (Math.abs(delta) > Math.abs(maxDelta)) {
            maxDelta = delta;
            maxIdx = i;
          }
        }

        // Threshold of ~1.5% visual change to trigger indicator
        if (Math.abs(maxDelta) > 0.015) {
          const relativeIdx = maxIdx - start;
          const count = end - start;
          const x = (relativeIdx / Math.max(1, count - 1)) * 100;

          const norm = normalize(newArr[maxIdx], spec);
          const yPos = 28 - norm * 22;
          const y = (yPos / 30) * 100;

          const id = Math.random();
          const display = getDisplayValue(key as Signal, newArr[maxIdx]);

          indicators.value[key] = {
            type: maxDelta > 0 ? 'up' : 'down',
            x,
            y,
            id,
            value: display.value,
            unit: display.unit
          };
          updatedKeysInCycle.add(key);

          // Trigger gentle flash
          flashStates.value[key] = true;
          setTimeout(() => {
            flashStates.value[key] = false;
          }, 1000);

          // Clear indicator after 60 seconds
          setTimeout(() => {
            if (indicators.value[key]?.id === id) {
              delete indicators.value[key];
            }
          }, 60000);
        }
      }

      // Update cache
      if (newArr) {
        previousData.set(key, [...newArr]);
      }
    });
  },
  { deep: true }
);

watch(
  () => props.grid.length,
  () => previousData.clear()
);

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
      const norm = normalize(value as number, spec);
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
      const norm = normalize(value as number, spec);
      return `${(i / Math.max(1, sliced.length - 1)) * 100},${28 - norm * 22}`;
    })
    .join(' ');
  return `0,30 ${pts} 100,30`;
};

const playheadPercent = computed(() => `${minToPercent(props.playheadMin)}%`);

const normalizedBands = computed(() => {
  if (!props.interventions?.length) return [] as Array<{ key: string; left: string; width: string }>;
  return props.interventions.map((band) => {
    const startRel = band.start - props.dayStartMin;
    const endRel = band.end - props.dayStartMin;

    const left = (startRel / props.viewMinutes) * 100;
    const width = ((band.end - band.start) / props.viewMinutes) * 100;

    return {
      key: band.key,
      left: `${left}%`,
      width: `${width}%`
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
  userStore.toggleSignal(key as Signal, false);
};

const describeMapping = (spec: ResponseSpec): string => {
  switch (spec.kind) {
    case 'linear':
      const gain = spec.gain ?? 0;
      return `linear (${gain >= 0 ? '+' : ''}${gain.toFixed(2)})`;
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
      handle: '.series-sidebar',
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        if (evt.oldIndex === evt.newIndex) return;

        const currentOrder = [...userStore.signalOrder];
        const movedId = evt.item.dataset.id as Signal;

        // Remove from old pos
        const oldIdx = currentOrder.indexOf(movedId);
        if (oldIdx > -1) currentOrder.splice(oldIdx, 1);

        // Insert at new relative pos among the CURRENTLY VISIBLE specs
        const visibleOrder = props.seriesSpecs.map(s => s.key as Signal);
        const neighborId = visibleOrder[evt.newIndex!];
        const neighborGlobalIdx = currentOrder.indexOf(neighborId);

        currentOrder.splice(neighborGlobalIdx, 0, movedId);
        userStore.updateSignalOrder(currentOrder);
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

<style>
/* Override Floating Vue theme with our design tokens */
.v-popper--theme-dropdown .v-popper__inner {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  border-radius: 6px;
  box-shadow: var(--shadow-large);
  padding: 0; /* Let our content handle padding */
}

.v-popper--theme-dropdown .v-popper__arrow-inner {
  border-color: var(--color-bg-elevated);
}

.v-popper--theme-dropdown .v-popper__arrow-outer {
  border-color: var(--color-border-subtle);
}
</style>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.chart.is-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-items: flex-start;
}

.chart.is-grid .series-container {
  min-width: 0;
  max-width: 100%;
}

.series-container {
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 6px;
  background: var(--color-bg-base);
  box-shadow: var(--shadow-large);
  transition: opacity 0.4s ease-out, filter 0.4s ease-out, transform 0.4s ease-out
}

.series-container.is-dimmed {
  opacity: 0.25;
  filter: grayscale(1);
  transform: scale(0.95);
}

.series-container.is-selected .series-sidebar {
  z-index: 10;
}

.loading-spinner {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 0.75em;
  height: 0.75em;
  border: 2px solid var(--color-text-secondary);
  border-top-color: var(--color-bg-base);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  opacity: 0;
  transition: opacity 200ms ease-out;
  z-index: 50;
  pointer-events: none;
}

.loading-spinner.is-active {
  opacity: 1;
  transition: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  background: var(--color-bg-base);
  border-right: 1px solid var(--color-border-subtle);
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  cursor: grab;
  user-select: none;
}

.series-sidebar:active {
  cursor: grabbing;
}

.series-sidebar__actions {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.series-sidebar__btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
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
  background: var(--color-bg-active);
  color: var(--color-text-primary);
}

.series-sidebar__btn.is-active {
  color: var(--color-text-active);
  opacity: 1;
}

.series-sidebar__hide:hover {
  color: var(--color-danger);
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

.series__canvas.tendency-higher {
  --line-color: var(--chart-line-higher);
  --fill-color: var(--chart-fill-higher);
  --grad-0: var(--chart-grad-higher-0);
  --grad-1: var(--chart-grad-higher-1);
}

.series__canvas.tendency-lower {
  --line-color: var(--chart-line-lower);
  --fill-color: var(--chart-fill-lower);
  --grad-0: var(--chart-grad-lower-0);
  --grad-1: var(--chart-grad-lower-1);
}

.series__canvas.tendency-mid,
.series__canvas.tendency-none {
  --line-color: var(--chart-line-neutral);
  --fill-color: var(--chart-fill-neutral);
  --grad-0: var(--chart-grad-neutral-0);
  --grad-1: var(--chart-grad-neutral-1);
}

.series__canvas.is-flashing::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
  animation: flash-animation 0.8s ease-out forwards;
  z-index: 5;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

@keyframes flash-animation {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.series__indicator {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  animation: indicator-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
}

.series__indicator-arrow {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-primary);
  text-shadow: 1px 1px 4px var(--color-text-inverted);
}

.series__indicator-value {
  position: absolute;
  top: 0;
  left: 10px;
  transform: translateY(-50%);
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-metric-primary);
  background: color-mix(in srgb, var(--color-bg-base) 70%, transparent);
  padding: 1px 4px;
  border-radius: 4px;
  backdrop-filter: blur(2px);
  display: flex;
  align-items: baseline;
  gap: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.series__indicator-unit {
  font-size: 0.55rem;
  opacity: 0.8;
  font-weight: 700;
  color: var(--color-text-secondary);
}

@keyframes indicator-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Expanded Info Section */
.series-info-expanded {
  border: 1px solid var(--color-border-subtle);
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin-top: -4px;
  padding-top: 4px;
  overflow: hidden;
}

.chart.is-grid .series-info-expanded__content {
  padding: 1rem;
  padding-left: 1rem;
}
.series-info-expanded__content {
  padding: 1rem;
  padding-left: 132px; /* Sidebar width + gap */
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-section h4 {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-active);
  margin: 0 0 0.5rem 0;
}

.info-section p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  margin: 0;
}

.series__contributors,
.series__couplings {
  margin-top: 1.25rem;
}

.series__contributors h4,
.series__couplings h4,
.series__monitors h4 {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}

.contributors-list,
.monitors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.monitor-item {
  background: var(--color-bg-elevated);
  border-radius: 5px;
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  border-left: 3px solid var(--color-text-muted);
}

.monitor-item--critical {
  border-left-color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 10%, var(--color-bg-elevated));
}

.monitor-item--warning {
  border-left-color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-elevated));
}

.monitor-item--win {
  border-left-color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 10%, var(--color-bg-elevated));
}

.monitor-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.monitor-icon {
  font-size: 1rem;
}

.monitor-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.monitor-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-top: 0.2rem;
}

.contributor-item {
  background: var(--color-bg-elevated);
  border-radius: 5px;
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 140px;
}

.contributor-item--condition {
  border-left: 3px solid var(--color-active);
}

.contributor-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.contributor-icon {
  font-size: 0.9rem;
}

.contributor-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

.contributor-badge {
  font-size: 0.6rem;
  text-transform: uppercase;
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.contributor-effect {
  display: flex;
  gap: 0.35rem;
  font-size: 0.75rem;
  align-items: baseline;
}

.contributor-mech {
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.contributor-value {
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--color-metric-secondary);
}

.contributor-unit {
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  float: right;
  margin-left: 0.25em;
}

.no-contributors {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0 0 1.5rem 0;
}

.couplings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.coupling-item {
  background: var(--color-bg-elevated);
  border-radius: 5px;
  padding: 0.6rem 0.8rem;
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
  color: var(--color-text-primary);
}

.series__coupling-mapping {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-metric-primary);
}

.series__coupling-desc {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
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
  top: 1px;
  bottom: 1px;
  height: auto;
  opacity: 0.35;
  border-radius: 4px;
  background: var(--color-bg-elevated);
}

.series__playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(  --color-active);
  box-shadow: 0 0 10px var(--color-active);
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
  font-weight: 800;
  font-family: var(--font-mono);
  padding: 0;
  background: transparent;
  pointer-events: none;
  text-shadow: 1px 1px 4px var(--color-text-inverted);
  color: var(--color-metric-primary);
}

.series__overlay--value {
  top: 4px;
  right: 6px;
  font-weight: var(--weight-bold);
}

.unit {
  margin-left: 1px;
  font-weight: 700;
  color: var(--color-text-muted);
  float: right;
  margin-left: 0.25em;
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

.monitor-dot-wrapper {
  position: absolute;
  z-index: 20;
  transform: translate(-50%, -50%);
  line-height: 0;
}

.monitor-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: help;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
}

.monitor-dot--critical {
  background: var(--color-danger);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.monitor-dot--warning {
  background: var(--color-warning);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
}

.monitor-dot--win {
  background: var(--color-success);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.monitor-popover {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 260px;
  padding: 0.75rem;
}

.monitor-popover__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  font-size: 0.85rem;
  line-height: 1.2;
}

.monitor-popover__value {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: var(--color-bg-subtle);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  align-self: flex-start;
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
  border: 1px solid var(--color-border-subtle);
  font-weight: 700;
}

.value-number {
  color: var(--color-metric-primary);
}

.value-unit {
  color: var(--color-text-muted);
}

.value-time {
  color: var(--color-text-secondary);
  margin-left: 0.25rem;
}

.monitor-popover__desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>
