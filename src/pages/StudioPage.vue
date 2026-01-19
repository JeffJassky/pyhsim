<template>
  <AppShell :show-right-sidebar="showChat">
    <template #right-sidebar>
      <AIChatPanel />
    </template>
    <section class="studio-grid">
      <Panel ref="timelinePanelRef" title="" icon="📅">
        <TimelineView
          :items="timeline.items"
          :selected-id="timeline.selectedId"
          :playhead-min="minute"
          :day-start-min="dayStartMin"
          @select="handleTimelineSelect"
          @remove="timeline.removeItem"
          @update="handleTimelineMove"
          @playhead="setMinute"
          @trigger-add="handlePlayheadAdd"
        />
        <PlayheadBar :minute="minute" />
      </Panel>

      <NutritionCarousel
        v-if="timeline.foodItems.length > 0"
        class="studio-nutrition"
        :calories-goal="user.nutritionTargets.calories"
        :calories-total="foodTotals.calories"
        :macros="macroTotals"
        :macro-targets="user.nutritionTargets.macros"
        :macros-enabled="user.nutritionTargets.macrosEnabled"
      />

      <Panel title="Charts" :icon="panelIcon">
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
          v-if="activeSubtabOptions.length > 1"
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
        <div
          v-if="activeGroupInfo.physiology || activeGroupInfo.application"
          class="chart-info-card"
        >
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
          :day-start-min="dayStartMin"
          :view-minutes="viewMinutes"
          @playhead="(val: number) => setMinute(val as Minute)"
        />
      </Panel>
    </section>

    <template #floating>
      <FloatingInspector
        :visible="inspectorVisible"
        :item="selectedItem"
        :def="selectedDef"
        @change="handleInspectorChange"
        @close="handleInspectorClose"
      />
      <div class="fab-group">
        <button
          class="studio-fab studio-fab--comprehensive"
          type="button"
          @click="addComprehensiveDay"
        >
          📅 Comprehensive Day
        </button>
        <button
          class="studio-fab"
          type="button"
          @click="addItemModalOpen = true"
        >
          ➕ Add Item
        </button>
        <button
          class="studio-fab studio-fab--secondary"
          type="button"
          title="Toggle Bio-Pilot AI"
          @click="showChat = !showChat"
        >
          🤖 Bio-Pilot AI
        </button>
      </div>
    </template>

    <AddItemModal
      v-model="addItemModalOpen"
      :recents="recentFoods"
      @select="handleCreate"
      @select-food="handleFoodSelect"
    />
    <UserProfileModal v-model="profileModalOpen" />
    <TargetsModal v-model="targetsModalOpen" />
    <StudioTour />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentPublicInstance, ComputedRef } from 'vue';
import AppShell from '@/components/layout/AppShell.vue';
import Panel from '@/components/core/Panel.vue';
import PlayheadBar from '@/components/core/PlayheadBar.vue';
import ProfilePalette from '@/components/palette/ProfilePalette.vue';
import TimelineView from '@/components/timeline/TimelineView.vue';
import SignalChart from '@/components/charts/SignalChart.vue';
import FloatingInspector from '@/components/inspector/FloatingInspector.vue';
import AIChatPanel from '@/components/ai/AIChatPanel.vue';
import NutritionCarousel from '@/components/log/NutritionCarousel.vue';
import AddItemModal from '@/components/launcher/AddItemModal.vue';
import UserProfileModal from '@/components/launcher/UserProfileModal.vue';
import TargetsModal from '@/components/log/TargetsModal.vue';
import StudioTour from '@/components/onboarding/StudioTour.vue';
import { useLibraryStore } from '@/stores/library';
import { useTimelineStore } from '@/stores/timeline';
import { useUserStore } from '@/stores/user';
import { useMetersStore } from '@/stores/meters';
import { useUIStore } from '@/stores/ui';
import { useEngineStore } from '@/stores/engine';
import { useEngine } from '@/composables/useEngine';
import { usePlayhead } from '@/composables/usePlayhead';
import { useMeters } from '@/composables/useMeters';
import { useArousal } from '@/composables/useArousal';
import { useArousalStore } from '@/stores/arousal';
import { useHeatmapStore } from '@/stores/heatmap';
import { useHeatmap } from '@/composables/useHeatmap';
import type {
  ChartSeriesSpec,
  FoodSearchHit,
  Goal,
  InterventionDef,
  MeterKey,
  Minute,
  OrganKey,
  Signal,
  TimelineItem,
  UUID,
  PharmacologyDef,
  ParamValues,
} from '@/types';
import { minuteToISO } from '@/utils/time';
import { toMinuteOfDay } from '@/core/serialization';
import { getAllUnifiedDefinitions, AUXILIARY_DEFINITIONS } from '@/models/engine';

const UNIFIED_DEFS = getAllUnifiedDefinitions();

const library = useLibraryStore();
const timeline = useTimelineStore();
const user = useUserStore();
const metersStore = useMetersStore();
const heatmapStore = useHeatmapStore();
const arousalStore = useArousalStore();
const uiStore = useUIStore();
const engineStore = useEngineStore();

const viewMinutes = computed(() => engineStore.durationDays * 1440);

// Day view starts at the wake event's time
const dayStartMin = computed(() => {
  const sleepItem = timeline.items.find((it) => it.meta.key === 'sleep');
  if (!sleepItem) return 7 * 60; // Default to 7 AM if no sleep event
  return toMinuteOfDay(sleepItem.end);
});

const foodTotals = computed(() => timeline.currentFoodTotals);
const macroTotals = computed(() => ({
  protein: foodTotals.value.protein,
  fat: foodTotals.value.fat,
  carbs: foodTotals.value.carbs,
}));

// Macro target editing
const macroFields = [
  { key: 'protein' as const, label: 'Protein', color: '#22c55e' },
  { key: 'carbs' as const, label: 'Carbs', color: '#38bdf8' },
  { key: 'fat' as const, label: 'Fat', color: '#fbbf24' },
];

const updateMacro = (key: 'protein' | 'carbs' | 'fat', field: 'min' | 'max', value: number) => {
  const current = user.nutritionTargets.macros[key];
  const next = { ...current, [field]: Math.max(0, value) };
  user.updateNutritionTargets({ macros: { ...user.nutritionTargets.macros, [key]: next } });
};

const engine = useEngine();
const { gridMins, series } = engine;
const { minute, setMinute } = usePlayhead();
useMeters();
useHeatmap();
useArousal();

const timelinePanelRef = ref<ComponentPublicInstance | null>(null);

const selectedItem = computed(() => timeline.items.find((item) => item.id === timeline.selectedId));
const selectedDef = computed(() => library.defs.find((def) => def.key === selectedItem.value?.meta.key));
const inspectorVisible = ref(false);
const showChat = ref(true);
const addItemModalOpen = ref(false);
const profileModalOpen = computed({
  get: () => uiStore.profileModalOpen,
  set: (val: boolean) => uiStore.setProfileModalOpen(val),
});
const targetsModalOpen = computed({
  get: () => uiStore.targetsModalOpen,
  set: (val: boolean) => uiStore.setTargetsModalOpen(val),
});
const recentFoods = ref<FoodSearchHit[]>([]);

const handleFoodSelect = (food: FoodSearchHit, quantity: number) => {
  // Add food at current playhead time on the selected date
  const startDate = new Date(timeline.selectedDate);
  startDate.setHours(Math.floor(minute.value / 60), minute.value % 60, 0, 0);
  timeline.addFood(startDate.toISOString(), food.nutrients, quantity, food.name);
  // Track recent foods
  recentFoods.value = [food, ...recentFoods.value.filter(f => f.id !== food.id)].slice(0, 15);
};

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

const handlePlayheadAdd = (m: Minute) => {
  setMinute(m);
  addItemModalOpen.value = true;
};

const handleInspectorChange = (item: TimelineItem) => timeline.updateItem(item.id, item);
const handleTimelineMove = ({ id, start, end, group }: { id: UUID; start: string; end: string; group?: string | number }) => {
  timeline.updateItem(id, { start, end, group });
};
const handleTimelineSelect = (id?: UUID) => {
  timeline.select(id);
  inspectorVisible.value = Boolean(id);
};
const handleInspectorClose = () => {
  inspectorVisible.value = false;
};

const addComprehensiveDay = () => {
  const date = new Date(timeline.selectedDate + 'T00:00:00');

  const interventions = [
    { key: 'caffeine', start: 495, duration: 240, params: { mg: 100 } },
    { key: 'omega3', start: 510, duration: 720, params: { mg: 2000 } },
    { key: 'exercise_cardio', start: 600, duration: 45, params: { intensity: 1 } },
    { key: 'food', start: 660, duration: 30, params: {
      carbSugar: 35, carbStarch: 40, protein: 30, fat: 20, fiber: 5,
      glycemicIndex: 60, waterMl: 200, temperature: 'warm'
    } },
    { key: 'exercise_resistance', start: 840, duration: 60, params: { intensity: 1 } },
    { key: 'alphaGPC', start: 930, duration: 360, params: { mg: 300 } },
    { key: 'ltheanine', start: 960, duration: 300, params: { mg: 200 } },
    { key: 'social', start: 1050, duration: 60, params: {} },
    { key: 'vitaminD', start: 1080, duration: 1440, params: { iu: 5000 } },
    { key: 'food', start: 1140, duration: 30, params: {
      carbSugar: 15, carbStarch: 50, protein: 40, fat: 30, fiber: 10,
      glycemicIndex: 40, waterMl: 200, temperature: 'warm'
    } },
    { key: 'meditation', start: 1230, duration: 20, params: {} },
    { key: 'magnesium', start: 1260, duration: 480, params: { mg: 400 } },
    { key: 'melatonin', start: 1320, duration: 360, params: { mg: 3 } },
  ];

  interventions.forEach(iv => {
    const start = minuteToISO(iv.start as Minute, date);
    const end = minuteToISO((iv.start + iv.duration) as Minute, date);
    timeline.addItem(start, end, {
      key: iv.key as any,
      params: iv.params as ParamValues,
      intensity: 1
    });
  });

  scrollTimelineIntoView();
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

watch(
  () => timeline.selectedId,
  (id, prev) => {
    if (!id) {
      inspectorVisible.value = false;
      return;
    }
    if (id !== prev) {
      inspectorVisible.value = true;
    }
  }
);

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
    'bdnf',
    'sensoryLoad',
    'dopamineVesicles',
    'norepinephrineVesicles',
    'serotoninPrecursor',
    'gabaPool',
    'bdnfExpression',
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
    'testosterone',
    'estrogen',
    'progesterone',
    'lh',
    'fsh',
    'shbg',
    'dheas',
    'vitaminD3',
    'ghReserve',
  ],
  metabolic: [
    'glucose',
    'ketone',
    'energy',
    'vagal',
    'hrv',
    'bloodPressure',
    'ethanol',
    'acetaldehyde',
    'hepaticGlycogen',
    'insulinAction',
  ],
  clock: ['melatonin', 'vasopressin', 'vip', 'orexin', 'histamine', 'serotonin', 'cortisol', 'adenosinePressure'],
  fuel: ['insulin', 'glucagon', 'glp1', 'ghrelin', 'leptin', 'glucose', 'ketone', 'energy', 'mtor', 'ampk', 'ferritin', 'hepaticGlycogen'],
  recovery: ['gaba', 'melatonin', 'growthHormone', 'prolactin', 'oxytocin', 'vagal', 'hrv', 'cortisol', 'inflammation', 'adenosinePressure'],
  emotional: ['dopamine', 'serotonin', 'endocannabinoid', 'adrenaline', 'cortisol', 'oxytocin', 'sensoryLoad', 'cortisolIntegral'],
  reproductive: ['testosterone', 'estrogen', 'progesterone', 'lh', 'fsh', 'shbg'],
  biomarkers: ['inflammation', 'bdnf', 'magnesium', 'vitaminD3', 'ferritin', 'hrv', 'bloodPressure', 'cortisolIntegral'],
  liverKidney: ['alt', 'ast', 'egfr', 'ethanol', 'acetaldehyde', 'inflammation'],
} as const;

const enabledSignals = computed(() => user.enabledSignals);
const subscriptionTier = computed(() => user.subscriptionTier);

const buildSpecs = (keys: readonly string[], filterByEnabled = true): ChartSeriesSpec[] =>
  keys
    .filter((key) => !filterByEnabled || enabledSignals.value[key as Signal] !== false)
    .map((key) => {
      const def = UNIFIED_DEFS[key as Signal];
      const auxDef = AUXILIARY_DEFINITIONS[key];

      if (def) {
        return {
          key: def.key,
          label: def.label,
          isPremium: def.isPremium,
          unit: def.unit,
          yMin: def.min ?? 0,
          yMax: def.max ?? 100,
          idealTendency: def.idealTendency,
          info: {
            description: def.description,
            couplings: def.dynamics.couplings?.map((c) => ({
              source: UNIFIED_DEFS[c.source]?.label ?? c.source,
              mapping: { kind: 'linear', gain: c.strength }, // Approximate for display
              description: `${c.effect} (strength ${c.strength})`,
            })),
          },
        } as ChartSeriesSpec;
      } else if (auxDef) {
        return {
          key: auxDef.key,
          label: auxDef.key, // Auxiliary defs might not have pretty labels yet
          unit: 'activity',
          yMin: 0,
          yMax: 2,
          color: '#94a3b8',
          idealTendency: 'none',
          info: {
            description: 'Mechanistic state tracking for auxiliary variable (enzyme, transporter, or pool)'
          }
        } as ChartSeriesSpec;
      }
      return null;
    })
    .filter((spec): spec is ChartSeriesSpec => spec !== null);

const scnCouplingSpecs = computed(() => buildSpecs(viewSignalSets.scnCoupling));
const neurotransmitterSpecs = computed(() => buildSpecs(viewSignalSets.neuroArousal));
const endocrineSpecs = computed(() => buildSpecs(viewSignalSets.endocrine));
const metabolicSpecs = computed(() => buildSpecs(viewSignalSets.metabolic));
const clockSpecs = computed(() => buildSpecs(viewSignalSets.clock));
const fuelSpecs = computed(() => buildSpecs(viewSignalSets.fuel));
const recoverySpecs = computed(() => buildSpecs(viewSignalSets.recovery));
const emotionalSpecs = computed(() => buildSpecs(viewSignalSets.emotional));
const reproductiveSpecs = computed(() => buildSpecs(viewSignalSets.reproductive));
const biomarkerSpecs = computed(() => buildSpecs(viewSignalSets.biomarkers));
const liverKidneySpecs = computed(() => buildSpecs(viewSignalSets.liverKidney));

const toChartData = (record: Record<string, Float32Array | number[]> | undefined) => {
  const result: Record<string, number[]> = {};
  if (!record) return result;
  for (const [key, data] of Object.entries(record)) {
    result[key] = data ? Array.from(data) : [];
  }
  return result;
};

const signalSeriesData = computed(() => {
  const main = toChartData(series.value);
  const aux = toChartData(engineStore.auxiliarySeries);

  return { ...main, ...aux };
});

const meterTendency: Record<MeterKey, ChartSeriesSpec['idealTendency']> = {
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
    idealTendency: meterTendency[key as MeterKey],
  }))
);

const meterSeriesData = computed(() => toChartData(metersStore.series));

const arousalSeriesSpecs: ChartSeriesSpec[] = [
  { key: 'sympathetic', label: 'Sympathetic', idealTendency: 'mid' },
  { key: 'parasympathetic', label: 'Parasympathetic', idealTendency: 'mid' },
  { key: 'overall', label: 'Overall', idealTendency: 'mid' },
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
    idealTendency: 'none'
  }))
);

const organSeriesData = computed(() => toChartData(heatmapStore.organSeries));

type ChartGroupKey =
  | 'auto'
  | 'goals'
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
  | 'emotional'
  | 'reproductive'
  | 'biomarkers'
  | 'liverKidney';

type RootTabKey = 'goals' | 'auto' | 'physiology' | 'application';

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

const goalSpecs = computed(() => {
  const relevantKeys = (Object.values(UNIFIED_DEFS) as any[])
    .map(sig => sig.key as Signal)
    .filter(key => enabledSignals.value[key] === true);
  return buildSpecs(relevantKeys, true);
});

// Maps PD targets (receptors, transporters) to the signals they affect
const targetToSignalsMap: Record<string, Signal[]> = {
  // Transporters (reuptake inhibitors affect these signals)
  'DAT': ['dopamine'],
  'NET': ['norepi'],
  'SERT': ['serotonin'],
  // Adenosine receptors (antagonism disinhibits these)
  'Adenosine_A2a': ['dopamine'],
  'Adenosine_A1': ['dopamine', 'acetylcholine'],
  // Other receptors
  'GABA_A': ['gaba'],
  'NMDA': ['glutamate'],
  'Beta_Adrenergic': ['norepi', 'adrenaline'],
  'MT1': ['melatonin'],
  'MT2': ['melatonin'],
  'H1': ['histamine'],
  'OX1R': ['orexin'],
  'OX2R': ['orexin'],
};

const autoSpecs = computed(() => {
  // Use selected item(s) if active, otherwise use all items on timeline
  const sourceItems = timeline.selectedId
    ? timeline.items.filter((it) => it.id === timeline.selectedId)
    : timeline.items;

  const activeInterventionKeys = new Set(sourceItems.map((it) => it.meta.key));
  const directSignals = new Set<Signal>();

  sourceItems.forEach((item) => {
    const def = library.defs.find((d) => d.key === item.meta.key);
    if (!def) return;

    let pharms: PharmacologyDef[] = [];
    if (typeof def.pharmacology === 'function') {
      const result = (def.pharmacology as any)(item.meta.params || {});
      pharms = Array.isArray(result) ? result : [result];
    } else {
      pharms = [def.pharmacology];
    }

    pharms.forEach((pharm) => {
      if (pharm.pd) {
        pharm.pd.forEach((effect) => {
          // Add the target itself if it's a signal
          directSignals.add(effect.target as Signal);
          // Also add signals affected by this target (for transporters/receptors)
          const affectedSignals = targetToSignalsMap[effect.target];
          if (affectedSignals) {
            affectedSignals.forEach((sig) => directSignals.add(sig));
          }
        });
      }
    });
  });

  const signalsToShow = new Set(directSignals);

  // Include signals that are coupled to the directly modified signals (downstream effects)
  Object.values(UNIFIED_DEFS).forEach((def) => {
    if (!def.dynamics.couplings) return;
    const isCoupled = def.dynamics.couplings.some((c) => directSignals.has(c.source));
    if (isCoupled) {
      signalsToShow.add(def.key);
    }
  });

  return buildSpecs(Array.from(signalsToShow));
});

const chartGroups: Record<ChartGroupKey, ChartGroup> = {
  auto: {
    key: 'auto',
    label: 'Timeline Smart View',
    icon: '🪄',
    specs: autoSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Analyzes the interventions currently on your timeline and automatically surfaces all biological pathways they are interacting with.',
      application:
        'Add items to your day to see their physiological impact reflected here in real-time.',
    },
  },
  goals: {
    key: 'goals',
    label: 'Goal Focus',
    icon: '✨',
    specs: goalSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        '',
      application:
        '',
    },
  },
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
  reproductive: {
    key: 'reproductive',
    label: 'Reproductive Health',
    icon: '🧬',
    specs: reproductiveSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Sex hormones (testosterone, estrogen, progesterone) and regulatory hormones (LH, FSH) control reproductive cycles and secondary characteristics.',
      application:
        'Use this to track hormone cycles across the month (for females) or diurnal testosterone rhythms (for males).',
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
  biomarkers: {
    key: 'biomarkers',
    label: 'Biomarkers',
    icon: '🧪',
    specs: biomarkerSpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Key blood and tissue markers (inflammation, BDNF, magnesium, ferritin) that provide a window into systemic health and cognitive potential.',
      application:
        'Monitor long-term health markers and ensure your interventions are supporting brain health and lowering systemic inflammation.',
    },
  },
  liverKidney: {
    key: 'liverKidney',
    label: 'Liver & Kidney',
    icon: '🧪',
    specs: liverKidneySpecs,
    data: signalSeriesData,
    info: {
      physiology:
        'Proxies for hepatic and renal stress (ALT, AST, eGFR) along with ethanol metabolism signals.',
      application:
        'Track the impact of supplements, toxins, and high metabolic demand on your core filtration and detox organs.',
    },
  },
};

const rootTabOptions: RootTabOption[] = [
  {
    key: 'goals',
    label: 'My Goals',
    icon: '✨',
    groupKeys: ['goals'],
    info: '',
  },
  {
    key: 'auto',
    label: 'Auto',
    icon: '🪄',
    groupKeys: ['auto'],
    info: 'Intelligent view that surfaces all signals affected by items currently on your timeline.',
  },
  {
    key: 'physiology',
    label: 'Physiology',
    icon: '🧬',
    groupKeys: [
      'scnCoupling',
      'neuroArousal',
      'endocrine',
      'metabolic',
      'autonomic',
      'organDynamics',
      'biomarkers',
      'liverKidney',
    ],
    info:
      'Explore biologically-accurate groupings that trace the flow from the master clock, through neurotransmitters and hormones, into organ-level outputs.',
  },
  {
    key: 'application',
    label: 'Application',
    icon: '🧭',
    groupKeys: ['clock', 'fuel', 'recovery', 'emotional', 'reproductive', 'experience'],
    info:
      'Cut the system into pragmatic views—clock alignment, fueling, recovery, emotional regulation, and reproductive health—to plan real-world routines.',
  },
];

const activeRootTab = ref<RootTabKey>('goals');
const activeGroupByRoot = ref<Record<RootTabKey, ChartGroupKey>>({
  goals: 'goals',
  auto: 'auto',
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

const activeGroupSpecs = computed(() => {
  const specs = resolveSpecs(activeGroup.value.specs);
  const orderMap = new Map(user.signalOrder.map((key, idx) => [key, idx]));

  return [...specs].sort((a, b) => {
    const aPremium = !!a.isPremium;
    const bPremium = !!b.isPremium;
    if (aPremium && !bPremium) return 1;
    if (!aPremium && bPremium) return -1;

    // Fall back to custom order
    const aIdx = orderMap.get(a.key as Signal) ?? 999;
    const bIdx = orderMap.get(b.key as Signal) ?? 999;
    return aIdx - bIdx;
  });
});
const activeGroupSeriesData = computed(() => {
  const data = activeGroup.value.data.value;
  const specs = activeGroupSpecs.value;
  const redacted: Record<string, number[]> = {};
  const isPremiumUser = subscriptionTier.value === 'premium';

  for (const spec of specs) {
    const raw = data[spec.key];
    if (spec.isPremium && !isPremiumUser) {
      redacted[spec.key] = [];
    } else {
      redacted[spec.key] = raw ? Array.from(raw) : [];
    }
  }
  return redacted;
});
const activeGroupInfo = computed(() => activeGroup.value.info);

const setActiveGroup = (groupKey: ChartGroupKey) => {
  activeGroupByRoot.value = { ...activeGroupByRoot.value, [activeRootTab.value]: groupKey };
};

const panelTitle = computed(() => `${activeRootTabMeta.value.label}: ${activeGroup.value.label}`);
const panelIcon = computed(() => activeGroup.value.icon);
const rootInfoText = computed(() => activeRootTabMeta.value.info);

const interventionBands = computed(() => {
  const bands: any[] = [];
  const days = engineStore.durationDays;

  for (let d = 0; d < days; d++) {
    timeline.items.forEach((item) => {
      const def = library.defs.find((it) => it.key === item.meta.key);
      const startMin = toMinuteOfDay(item.start);
      let endMin = toMinuteOfDay(item.end);
      if (endMin < startMin) endMin = (endMin + 1440) as Minute; // Handle wrap

      bands.push({
        key: `${item.id}_${d}`,
        start: startMin + (d * 1440),
        end: endMin + (d * 1440),
        color: 'rgba(255,255,255,0.1)'
      });
    });
  }
  return bands;
});
</script>

<style scoped>
.studio-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.studio-nutrition {
  width: 100%;
}

.fab-group {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  z-index: 50;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.studio-fab {
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: linear-gradient(120deg, #8fbf5f, #6aa32f);
  color: black;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.studio-fab--comprehensive {
  background: linear-gradient(120deg, #38bdf8, #0ea5e9);
  color: white;
}

.studio-fab--secondary {
  background: rgba(30, 41, 59, 0.7);
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.studio-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.4);
}

.targets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field input[type='number'] {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  width: 100%;
}

.field--switch {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.targets__macros {
  display: grid;
  gap: 0.5rem;
}

.targets__macros.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.targets__macro {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.5rem;
}

.targets__label {
  margin: 0 0 0.25rem;
  font-weight: 700;
  font-size: 0.85rem;
}

.targets__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}

.targets__inputs label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  opacity: 0.8;
}

.targets__inputs input[type='number'] {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  border-radius: 6px;
  padding: 0.3rem 0.4rem;
  font-size: 0.9rem;
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

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 0.5rem;
}

.profile-link {
  color: white !important;
  font-weight: 500;
  opacity: 0.7;
  padding: 0 !important;
  font-size: 0.9rem;
  background: transparent !important;
  border: none !important;
}

.profile-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.logo--inline {
  font-size: 0.95rem;
}

.logo {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  opacity: 0.8;
}
</style>
