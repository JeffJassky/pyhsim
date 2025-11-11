<template>
  <AppShell always-show-sidebar>
    <template #sidebar>
      <Panel title="Profiles" icon="🧬">
        <ProfilePalette />
      </Panel>
      <Panel title="Influencers" icon="🎛">
        <InterventionSearch v-model="search" />
        <InterventionPalette :defs="filteredDefs" @select="handleCreate" />
      </Panel>
    </template>
    <section class="studio-grid">
      <Panel ref="timelinePanelRef" title="Timeline" icon="📅">
        <TimelineView
          :items="timeline.items"
          :selected-id="timeline.selectedId"
          :playhead-min="minute"
          @select="(id) => timeline.select(id)"
          @remove="timeline.removeItem"
          @update="handleTimelineMove"
          @playhead="setMinute"
        />
        <PlayheadBar :minute="minute" />
      </Panel>

      <Panel :title="panelTitle" :icon="panelIcon">
        <nav class="chart-tabs-nav" role="tablist" aria-label="View families">
          <button
            v-for="tab in rootTabOptions"
            :key="tab.key"
            class="chart-tabs-nav__button"
            :class="{ 'is-active': activeRootTab === tab.key }"
            type="button"
            role="tab"
            :aria-selected="activeRootTab === tab.key"
            @click="activeRootTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
        <p v-if="rootInfoText" class="chart-info-root">
          {{ rootInfoText }}
        </p>

        <nav
          class="chart-tabs-nav chart-tabs-nav--sub"
          role="tablist"
          aria-label="Detailed chart groups"
        >
          <div
            v-for="group in activeSubtabOptions"
            :key="group.key"
            class="chart-tabs-nav__item"
          >
            <button
              class="chart-tabs-nav__button"
              :class="{ 'is-active': activeGroupKey === group.key }"
              type="button"
              role="tab"
              :aria-selected="activeGroupKey === group.key"
              @click="setActiveGroup(group.key)"
            >
              {{ group.label }}
            </button>
          </div>
        </nav>
        <div v-if="activeGroupInfo" class="chart-info-card">
          <p>
            <strong>Physiology</strong>
            {{ activeGroupInfo.physiology }}
          </p>
          <p>
            <strong>Application</strong>
            {{ activeGroupInfo.application }}
          </p>
        </div>

        <SignalChart
          v-if="activeGroup"
          :grid="gridMins"
          :series-specs="activeGroupSpecs"
          :series-data="activeGroupSeriesData"
          :playhead-min="minute"
          :interventions="interventionBands"
          @playhead="(val) => setMinute(val as Minute)"
        />
      </Panel>
    </section>
    <FloatingInspector
      :visible="Boolean(selectedItem)"
      :item="selectedItem"
      :def="selectedDef"
      @change="handleInspectorChange"
      @close="timeline.select(undefined)"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance, ComputedRef } from 'vue';
import AppShell from '@/components/layout/AppShell.vue';
import Panel from '@/components/core/Panel.vue';
import PlayheadBar from '@/components/core/PlayheadBar.vue';
import InterventionSearch from '@/components/palette/InterventionSearch.vue';
import InterventionPalette from '@/components/palette/InterventionPalette.vue';
import ProfilePalette from '@/components/palette/ProfilePalette.vue';
import TimelineView from '@/components/timeline/TimelineView.vue';
import SignalChart from '@/components/charts/SignalChart.vue';
import FloatingInspector from '@/components/inspector/FloatingInspector.vue';
import { useLibraryStore } from '@/stores/library';
import { useTimelineStore } from '@/stores/timeline';
import { useMetersStore } from '@/stores/meters';
import { useEngine } from '@/composables/useEngine';
import { usePlayhead } from '@/composables/usePlayhead';
import { useMeters } from '@/composables/useMeters';
import { useArousal } from '@/composables/useArousal';
import { useArousalStore } from '@/stores/arousal';
import { useHeatmapStore } from '@/stores/heatmap';
import { useHeatmap } from '@/composables/useHeatmap';
import type {
  ChartSeriesSpec,
  InterventionDef,
  MeterKey,
  Minute,
  OrganKey,
  Signal,
  TimelineItem,
  UUID,
} from '@/types';
import { minuteToISO } from '@/utils/time';
import { toMinuteOfDay } from '@/core/serialization';
import { SIGNAL_LIBRARY } from '@/models';

const library = useLibraryStore();
const timeline = useTimelineStore();
const metersStore = useMetersStore();
const heatmapStore = useHeatmapStore();
const arousalStore = useArousalStore();

const engine = useEngine();
const { gridMins, series } = engine;
const { minute, setMinute } = usePlayhead();
useMeters();
useHeatmap();
useArousal();

const timelinePanelRef = ref<ComponentPublicInstance | null>(null);

const search = ref('');
const filteredDefs = computed(() =>
  library.defs.filter((def) => def.label.toLowerCase().includes(search.value.toLowerCase()))
);

const selectedItem = computed(() => timeline.items.find((item) => item.id === timeline.selectedId));
const selectedDef = computed(() => library.defs.find((def) => def.key === selectedItem.value?.meta.key));

const defaultParams = (def: InterventionDef) =>
  Object.fromEntries(def.params.map((param) => [param.key, param.default ?? 0]));

const scrollTimelineIntoView = () => {
  const panelEl = timelinePanelRef.value?.$el as HTMLElement | undefined;
  panelEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const handleCreate = (def: InterventionDef) => {
  const startMin = minute.value as Minute;
  const endMin = (startMin + def.defaultDurationMin) as Minute;
  timeline.addItem(minuteToISO(startMin), minuteToISO(endMin), {
    key: def.key,
    params: defaultParams(def),
    intensity: 1,
  });
  scrollTimelineIntoView();
};

const handleInspectorChange = (item: TimelineItem) => timeline.updateItem(item.id, item);
const handleTimelineMove = ({ id, start, end }: { id: UUID; start: string; end: string }) => {
  timeline.updateItem(id, { start, end });
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!target) return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const editableTags = ['INPUT', 'TEXTAREA', 'SELECT'];
  return editableTags.includes(target.tagName);
};

const handleTimelineDeleteShortcut = (event: KeyboardEvent) => {
  if (event.key !== 'Backspace' && event.key !== 'Delete') return;
  if (isEditableTarget(event.target)) return;
  const id = timeline.selectedId;
  if (!id) return;
  event.preventDefault();
  timeline.removeItem(id);
};

onMounted(() => {
  window.addEventListener('keydown', handleTimelineDeleteShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleTimelineDeleteShortcut);
});

const viewSignalSets = {
  scnCoupling: ['melatonin', 'vasopressin', 'vip'],
  neuroArousal: [
    'dopamine',
    'serotonin',
    'acetylcholine',
    'gaba',
    'norepi',
    'histamine',
    'orexin',
    'glutamate',
    'endocannabinoid',
  ],
  endocrine: [
    'cortisol',
    'adrenaline',
    'insulin',
    'glucagon',
    'ghrelin',
    'glp1',
    'leptin',
    'thyroid',
    'oxytocin',
    'prolactin',
    'growthHormone',
  ],
  metabolic: ['glucose', 'ketone', 'energy', 'vagal'],
  clock: ['melatonin', 'vasopressin', 'vip', 'orexin', 'histamine', 'serotonin', 'cortisol'],
  fuel: ['insulin', 'glucagon', 'glp1', 'ghrelin', 'leptin', 'glucose', 'ketone', 'energy'],
  recovery: ['gaba', 'melatonin', 'growthHormone', 'prolactin', 'oxytocin', 'vagal', 'cortisol'],
  emotional: ['dopamine', 'serotonin', 'endocannabinoid', 'adrenaline', 'cortisol', 'oxytocin'],
} as const;

const buildSpecs = (keys: readonly Signal[]): ChartSeriesSpec[] =>
  keys
    .map((key) => {
      const def = SIGNAL_LIBRARY[key];
      if (!def) return null;
      return {
        key: def.key,
        label: def.label,
        color: def.display.color,
        tendency: def.display.tendency,
        info: {
          physiology: def.description.physiology,
          application: def.description.application,
          couplings: def.couplings?.map((c) => ({
            source: SIGNAL_LIBRARY[c.source]?.label ?? c.source,
            mapping: c.mapping,
            description: c.description,
          })),
        },
      } as ChartSeriesSpec;
    })
    .filter((spec): spec is ChartSeriesSpec => spec !== null);

const scnCouplingSpecs = buildSpecs(viewSignalSets.scnCoupling);
const neurotransmitterSpecs = buildSpecs(viewSignalSets.neuroArousal);
const endocrineSpecs = buildSpecs(viewSignalSets.endocrine);
const metabolicSpecs = buildSpecs(viewSignalSets.metabolic);
const clockSpecs = buildSpecs(viewSignalSets.clock);
const fuelSpecs = buildSpecs(viewSignalSets.fuel);
const recoverySpecs = buildSpecs(viewSignalSets.recovery);
const emotionalSpecs = buildSpecs(viewSignalSets.emotional);

const toChartData = (record: Record<string, Float32Array | number[]> | undefined) => {
  const result: Record<string, number[]> = {};
  if (!record) return result;
  for (const [key, data] of Object.entries(record)) {
    result[key] = data ? Array.from(data) : [];
  }
  return result;
};

const signalSeriesData = computed(() => toChartData(series.value));

const meterTendency: Record<MeterKey, ChartSeriesSpec['tendency']> = {
  energy: 'higher',
  focus: 'higher',
  calm: 'mid',
  mood: 'higher',
  social: 'higher',
  overwhelm: 'lower',
  sleepPressure: 'mid',
};

const meterSeriesSpecs = computed<ChartSeriesSpec[]>(() =>
  Object.entries(metersStore.meters).map(([key, def]) => ({
    key: key as MeterKey,
    label: def.label,
    tendency: meterTendency[key as MeterKey] ?? 'neutral',
  }))
);

const meterSeriesData = computed(() => toChartData(metersStore.series));

const arousalSeriesSpecs: ChartSeriesSpec[] = [
  { key: 'sympathetic', label: 'Sympathetic', tendency: 'mid' },
  { key: 'parasympathetic', label: 'Parasympathetic', tendency: 'mid' },
  { key: 'overall', label: 'Overall', tendency: 'mid' },
];

const arousalSeriesData = computed(() => toChartData(arousalStore.series));

const organLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const organSeriesSpecs = computed<ChartSeriesSpec[]>(() =>
  Object.keys(heatmapStore.organWeights).map((key) => ({
    key: key as OrganKey,
    label: organLabel(key),
    tendency: 'neutral',
  }))
);

const organSeriesData = computed(() => toChartData(heatmapStore.organSeries));

type ChartGroupKey =
  | 'scnCoupling'
  | 'neuroArousal'
  | 'endocrine'
  | 'metabolic'
  | 'autonomic'
  | 'organDynamics'
  | 'experience'
  | 'clock'
  | 'fuel'
  | 'recovery'
  | 'emotional';

type RootTabKey = 'physiology' | 'application';

interface ChartGroupInfo {
  physiology: string;
  application: string;
}

interface ChartGroup {
  key: ChartGroupKey;
  label: string;
  icon: string;
  specs: ChartSeriesSpec[] | ComputedRef<ChartSeriesSpec[]>;
  data: ComputedRef<Record<string, number[]>>;
  info: ChartGroupInfo;
}

interface RootTabOption {
  key: RootTabKey;
  label: string;
  icon: string;
  groupKeys: ChartGroupKey[];
  info: string;
}

const chartGroups: Record<ChartGroupKey, ChartGroup> = {
  scnCoupling: {
    key: 'scnCoupling',
    label: 'SCN Coupling',
    icon: '🧠',
    specs: scnCouplingSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Outputs from the suprachiasmatic nucleus and pineal gland (melatonin, AVP, VIP) keep cellular clocks synchronized and set the phase for downstream systems.',
      application:
        'Use this chart to see how light, darkness, and melatonin supplements are shifting core Zeitgeber signals before they cascade into behavior.',
    },
  },
  neuroArousal: {
    key: 'neuroArousal',
    label: 'Neural Arousal',
    icon: '⚡',
    specs: neurotransmitterSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Fast neurotransmitters (dopamine, serotonin, acetylcholine, histamine, orexin, etc.) modulate motivation, attention, and immediate behavioral state.',
      application:
        'Check how interventions such as stimulants, food, or light shift arousal chemistry that ultimately changes focus, drive, and subjective meters.',
    },
  },
  endocrine: {
    key: 'endocrine',
    label: 'Endocrine Output',
    icon: '🩸',
    specs: endocrineSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Hormones from the HPA axis and metabolic organs (cortisol, insulin, GLP-1, leptin, growth hormone, etc.) broadcast instructions to tissues across the body.',
      application:
        'Correlate meal timing, stressors, or supplements with endocrine pulses to understand why energy, appetite, or recovery responses change.',
    },
  },
  metabolic: {
    key: 'metabolic',
    label: 'Metabolic & Autonomic',
    icon: '🍽️',
    specs: metabolicSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Composite metabolic proxies (glucose, ketones, energy availability, vagal tone) integrate hormonal and autonomic control into system-level readiness.',
      application:
        'Use this readout to see how a day of interventions shapes substrate availability, autonomic balance, and perceived capacity.',
    },
  },
  autonomic: {
    key: 'autonomic',
    label: 'Autonomic Balance',
    icon: '🌡️',
    specs: arousalSeriesSpecs,
    data: arousalSeriesData,
    info: {
      physiology:
        'Sympathetic vs. parasympathetic components summarize autonomic nervous system output that controls heart rate, blood pressure, and organ readiness.',
      application:
        'Track whether movement, cold/heat exposure, or relaxation practices are driving the sympathetic load you intended and what rebound you get afterward.',
    },
  },
  organDynamics: {
    key: 'organDynamics',
    label: 'Organ Dynamics',
    icon: '🫁',
    specs: organSeriesSpecs,
    data: organSeriesData,
    info: {
      physiology:
        'Heatmap-derived organ signals translate network outputs into estimated stress on the lungs, gut, liver, brain, and more.',
      application:
        'Use this to understand which organ systems are bearing the load of your interventions so you can rotate stress or recovery focus.',
    },
  },
  experience: {
    key: 'experience',
    label: 'Experience',
    icon: '🧠',
    specs: meterSeriesSpecs,
    data: meterSeriesData,
    info: {
      physiology:
        'Subjective meters blend neurotransmitter, endocrine, and autonomic signals into felt states like focus, mood, calm, and overwhelm.',
      application:
        'Correlate interventions with the metrics you care about most—helpful for planning routines around how you actually feel.',
    },
  },
  clock: {
    key: 'clock',
    label: 'Clock Alignment',
    icon: '⏰',
    specs: clockSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Combines master clock messengers (melatonin, AVP, VIP) with orexin, histamine, and cortisol to show the full circadian wave.',
      application:
        'Quickly see whether light, sleep, and melatonin timing are lining up with your target schedule before layering additional behaviors.',
    },
  },
  fuel: {
    key: 'fuel',
    label: 'Fuel & Appetite',
    icon: '🍽️',
    specs: fuelSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Insulin, glucagon, incretins, ghrelin, and leptin create the push-pull between feeding, satiety, and substrate selection.',
      application:
        'Use this to plan meals, fasts, or GLP-1-based strategies and to understand concurrent changes in glucose, ketones, and perceived energy.',
    },
  },
  recovery: {
    key: 'recovery',
    label: 'Recovery & Growth',
    icon: '🛌',
    specs: recoverySpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Sleep-promoting transmitters (GABA, melatonin) and anabolic hormones (growth hormone, prolactin, oxytocin) coordinate repair alongside vagal tone.',
      application:
        'Audit sleep hygiene, heat/sauna, or breathwork sessions by seeing whether you generated the restorative chemistry you were targeting.',
    },
  },
  emotional: {
    key: 'emotional',
    label: 'Emotional Regulation',
    icon: '💞',
    specs: emotionalSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Mood-relevant neuromodulators (dopamine, serotonin, endocannabinoids) interact with arousal hormones (adrenaline, cortisol, oxytocin).',
      application:
        'Use this perspective to understand why certain routines calm or energize you emotionally and to plan deliberate mood adjustments.',
    },
  },
};

const rootTabOptions: RootTabOption[] = [
  {
    key: 'physiology',
    label: 'Physiology',
    icon: '🧬',
    groupKeys: ['scnCoupling', 'neuroArousal', 'endocrine', 'metabolic', 'autonomic', 'organDynamics'],
    info:
      'Explore biologically-accurate groupings that trace the flow from the master clock, through neurotransmitters and hormones, into organ-level outputs.',
  },
  {
    key: 'application',
    label: 'Application',
    icon: '🧭',
    groupKeys: ['clock', 'fuel', 'recovery', 'emotional', 'experience'],
    info:
      'Cut the system into pragmatic views—clock alignment, fueling, recovery, emotional regulation, and subjective experience—to plan real-world routines.',
  },
];

const activeRootTab = ref<RootTabKey>('physiology');
const activeGroupByRoot = ref<Record<RootTabKey, ChartGroupKey>>({
  physiology: 'scnCoupling',
  application: 'clock',
});

const rootTabMap = new Map(rootTabOptions.map((tab) => [tab.key, tab]));

const getGroupKeysForRoot = (rootKey: RootTabKey) => rootTabMap.get(rootKey)?.groupKeys ?? [];

const ensureGroupForRoot = (rootKey: RootTabKey) => {
  const tab = rootTabMap.get(rootKey);
  if (!tab) return;
  const [firstKey] = tab.groupKeys;
  if (!firstKey) return;
  const current = activeGroupByRoot.value[rootKey];
  if (!current || !tab.groupKeys.includes(current)) {
    activeGroupByRoot.value = { ...activeGroupByRoot.value, [rootKey]: firstKey };
  }
};

rootTabOptions.forEach((tab) => ensureGroupForRoot(tab.key));

watch(
  activeRootTab,
  (newRoot) => {
    ensureGroupForRoot(newRoot);
  },
  { immediate: true }
);

const activeRootTabMeta = computed(() => rootTabMap.get(activeRootTab.value) ?? rootTabOptions[0]);

const activeGroupKey = computed<ChartGroupKey>(() => {
  const assigned = activeGroupByRoot.value[activeRootTab.value];
  if (assigned && chartGroups[assigned]) return assigned;
  const fallback = getGroupKeysForRoot(activeRootTab.value)[0];
  return (fallback ?? 'scnCoupling') as ChartGroupKey;
});

const activeSubtabOptions = computed(() =>
  getGroupKeysForRoot(activeRootTab.value).map((key) => chartGroups[key])
);

const activeGroup = computed(() => chartGroups[activeGroupKey.value]);

const resolveSpecs = (specsSource: ChartGroup['specs']) =>
  Array.isArray(specsSource) ? specsSource : specsSource.value;

const activeGroupSpecs = computed(() => resolveSpecs(activeGroup.value.specs));
const activeGroupSeriesData = computed(() => activeGroup.value.data.value);
const activeGroupInfo = computed(() => activeGroup.value.info);

const setActiveGroup = (groupKey: ChartGroupKey) => {
  activeGroupByRoot.value = { ...activeGroupByRoot.value, [activeRootTab.value]: groupKey };
};

const panelTitle = computed(() => `${activeRootTabMeta.value.label}: ${activeGroup.value.label}`);
const panelIcon = computed(() => activeGroup.value.icon);
const rootInfoText = computed(() => activeRootTabMeta.value.info);

const interventionBands = computed(() =>
  timeline.items.map((item) => {
    const def = library.defs.find((d) => d.key === item.meta.key);
    return {
      key: item.id,
      start: toMinuteOfDay(item.start),
      end: toMinuteOfDay(item.end),
      color: def?.color ? `${def.color}33` : 'rgba(255,255,255,0.1)',
    };
  })
);
</script>

<style scoped>
.studio-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.chart-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chart-tabs-nav--sub {
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
  gap: 0.35rem;
  opacity: 0.95;
}

.chart-tabs-nav__item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.chart-tabs-nav__button {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chart-tabs-nav__button.is-active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
}

.chart-info-root {
  margin: -0.25rem 0 0.5rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.chart-info-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.85rem;
}

.chart-info-card p {
  margin: 0 0 0.35rem;
}

.chart-info-card p:last-child {
  margin-bottom: 0;
}
</style>
