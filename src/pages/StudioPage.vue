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
      </Panel>

      <Panel
        style="background: var(--color-bg-subtle); padding: 1em 1em 5em 1em "
      >
        <div class="chart-header-row">
          <div class="header-controls">
            <!-- Filter By -->
            <div class="control-group">
              <span class="control-label">Filter</span>
              <div class="toggle-pill">
                <button
                  class="toggle-pill__btn"
                  :class="{ 'is-active': chartFilter === 'goals' }"
                  v-tooltip="'Show charts related to your goals'"
                  @click="chartFilter = 'goals'"
                >
                  My Goals
                </button>
                <button
                  class="toggle-pill__btn"
                  :class="{ 'is-active': chartFilter === 'auto' }"
                  v-tooltip="'Only show charts that are modified by items on the timeline'"
                  @click="chartFilter = 'auto'"
                >
                  Active
                </button>
                <button
                  class="toggle-pill__btn"
                  :class="{ 'is-active': chartFilter === 'all' }"
                  v-tooltip="'Show all available physiological signals'"
                  @click="chartFilter = 'all'"
                >
                  All
                </button>
              </div>
            </div>

            <!-- Group By -->
            <div class="control-group">
              <span class="control-label">Group</span>
              <div class="toggle-pill">
                <button
                  class="toggle-pill__btn"
                  :class="{ 'is-active': chartGroupBy === 'system' }"
                  v-tooltip="'Group charts by physiological system (e.g. Nervous, Endocrine)'"
                  @click="chartGroupBy = 'system'"
                >
                  Biological System
                </button>
                <button
                  class="toggle-pill__btn"
                  :class="{ 'is-active': chartGroupBy === 'goals' }"
                  v-tooltip="'Group charts by Goal'"
                  @click="chartGroupBy = 'goals'"
                >
                  Goal
                </button>
                <button
                  class="toggle-pill__btn"
                  :class="{ 'is-active': chartGroupBy === 'none' }"
                  v-tooltip="'Display charts in a flat list without grouping'"
                  @click="chartGroupBy = 'none'"
                >
                  None
                </button>
              </div>
            </div>
          </div>

          <div class="layout-toggle">
            <button
              class="layout-toggle__btn"
              :class="{ 'is-active': chartLayout === 'list' }"
              title="List View"
              v-tooltip="'View charts as a list'"
              @click="chartLayout = 'list'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <button
              class="layout-toggle__btn"
              :class="{ 'is-active': chartLayout === 'grid' }"
              title="Grid View"
              v-tooltip="'View charts as grid'"
              @click="chartLayout = 'grid'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>

        <div class="grouped-charts">
          <div
            v-for="group in groupedSpecs"
            :key="group.id"
            class="chart-system-group"
          >
            <div v-if="chartGroupBy !== 'none'" class="system-group-header-row">
              <h3 class="system-group-header">
                {{ group.label }}
              </h3>
              <button
                v-if="group.description"
                class="group-info-btn"
                :class="{ 'is-active': openGroupIds.includes(group.id) }"
                @click="toggleGroupDescription(group.id)"
                v-tooltip="'What is this system?'"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>

            <Transition name="expand">
              <div
                v-if="group.description && openGroupIds.includes(group.id)"
                class="system-group-description"
              >
                {{ group.description }}
              </div>
            </Transition>

            <SignalChart
              :grid="gridMins"
              :series-specs="group.specs"
              :series-data="activeChartData"
              :playhead-min="minute"
              :interventions="interventionBands"
              :day-start-min="dayStartMin"
              :view-minutes="viewMinutes"
              :loading="busy"
              :layout="chartLayout"
              @playhead="(val: number) => setMinute(val as Minute)"
            />
          </div>
        </div>
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
          + Comprehensive Day
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
          title="Toggle Chat"
          @click="showChat = !showChat"
        >
          AI Icon here
        </button>
      </div>
    </template>

    <AddItemModal
      v-model="addItemModalOpen"
      :recents="recentFoods"
      :initial-group="addItemInitialGroup"
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
import { BIOLOGICAL_SYSTEMS } from '@/models/physiology/systems';
import type { BioSystemDef } from '@/models/physiology/systems';
import { GOAL_CATEGORIES } from '@/models/domain/goals';
import type { GoalCategory } from '@/models/domain/goals';
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

// ... (rest of imports and setup)

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
  { key: 'protein' as const, label: 'Protein', color: 'var(--color-macro-protein)' },
  { key: 'carbs' as const, label: 'Carbs', color: 'var(--color-macro-carbs)' },
  { key: 'fat' as const, label: 'Fat', color: 'var(--color-macro-fat)' },
];

const updateMacro = (key: 'protein' | 'carbs' | 'fat', field: 'min' | 'max', value: number) => {
  const current = user.nutritionTargets.macros[key];
  const next = { ...current, [field]: Math.max(0, value) };
  user.updateNutritionTargets({ macros: { ...user.nutritionTargets.macros, [key]: next } });
};

const engine = useEngine();
const { gridMins, series, busy } = engine;
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
const addItemInitialGroup = ref<string | number | undefined>(undefined);
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

const handlePlayheadAdd = (m: Minute, group?: string | number) => {
  setMinute(m);
  addItemInitialGroup.value = group;
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

const getSpecsForSystem = (systemId: string) => {
  const system = BIOLOGICAL_SYSTEMS.find(s => s.id === systemId);
  return buildSpecs(system?.signals ?? []);
};

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

import { getReceptorSignals } from '@/models/physiology/pharmacology';

const chartFilter = ref<'auto' | 'goals' | 'all'>('goals');
const chartGroupBy = ref<'none' | 'system' | 'goals'>('system');
const chartLayout = ref<'list' | 'grid'>('grid');

const panelIcon = computed(() => {
  if (chartFilter.value === 'goals') return '✨';
  if (chartFilter.value === 'all') return '📊';
  return '🪄';
});

const activeSpecs = computed(() => {
  let keys: string[] = [];

  if (chartFilter.value === 'auto') {
    // Logic from old autoSpecs
    const sourceItems = timeline.selectedId
      ? timeline.items.filter((it) => it.id === timeline.selectedId)
      : timeline.items;

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
            const affected = getReceptorSignals(effect.target);
            affected.forEach(mapping => directSignals.add(mapping.signal));
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
    keys = Array.from(signalsToShow);
  } else if (chartFilter.value === 'goals') {
    // Show signals relevant to SELECTED goals
    const selectedGoalIds = user.selectedGoals;
    const signalSet = new Set<Signal>();

    selectedGoalIds.forEach(goalId => {
      const category = GOAL_CATEGORIES.find(c => c.id === goalId);
      if (category) {
        category.signals.forEach(s => signalSet.add(s));
      }
    });

    keys = Array.from(signalSet);
  } else {
    // 'all' - Show all enabled signals
    keys = (Object.values(UNIFIED_DEFS) as any[]).map((sig) => sig.key as Signal);
  }

  const specs = buildSpecs(keys, true);
  const orderMap = new Map(user.signalOrder.map((key, idx) => [key, idx]));

  return specs.sort((a, b) => {
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

const groupedSpecs = computed(() => {
  const specs = activeSpecs.value;
	const result: Array<{ id: string; label: string; description?: string; icon: string; specs: ChartSeriesSpec[] }> = [];
  const usedKeys = new Set<string>();

  if (chartGroupBy.value === 'system') {
    BIOLOGICAL_SYSTEMS.forEach((system) => {
      const systemSpecs = specs.filter((s) => system.signals.includes(s.key as Signal));
      if (systemSpecs.length > 0) {
        result.push({
          id: system.id,
			label: system.label,
		  description: system.description,
          icon: system.icon,
          specs: systemSpecs,
        });
        systemSpecs.forEach((s) => usedKeys.add(s.key));
      }
    });
  } else if (chartGroupBy.value === 'goals') {
    const categories = chartFilter.value === 'goals'
      ? GOAL_CATEGORIES.filter(g => user.selectedGoals.includes(g.id))
      : GOAL_CATEGORIES;

    categories.forEach((goalCat) => {
       // Find specs that are in this goal category
       const goalSpecs = specs.filter(s => {
          return goalCat.signals.includes(s.key as Signal);
       });

       if (goalSpecs.length > 0) {
         result.push({
           id: goalCat.id,
           label: goalCat.label,
           icon: goalCat.icon,
           specs: goalSpecs
         });
         goalSpecs.forEach(s => usedKeys.add(s.key));
       }
    });
  } else {
    // None: just one big group
    return [{
      id: 'all',
      label: 'All Signals',
      icon: '📈',
      specs: specs
    }];
  }

  // Any remaining specs
  const remaining = specs.filter((s) => !usedKeys.has(s.key));
  if (remaining.length > 0) {
    result.push({
      id: 'other',
      label: 'Other',
      icon: '⚙️',
      specs: remaining,
    });
  }

  return result;
});

const activeChartData = computed(() => {
  const data = signalSeriesData.value;
  const specs = activeSpecs.value;
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

const openGroupIds = ref<string[]>([]);
const toggleGroupDescription = (id: string) => {
  const idx = openGroupIds.value.indexOf(id);
  if (idx > -1) {
    openGroupIds.value.splice(idx, 1);
  } else {
    openGroupIds.value.push(id);
  }
};
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
  background: var(--color-accent);
  color: var(--color-text-inverted);
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.studio-fab--comprehensive {
  background: var(--color-accent);
  color: var(--color-text-inverted);
}

.studio-fab--secondary {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle);
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
}

.chart-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: nowrap;
}

.control-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  opacity: 0.4;
  margin-right: 0.5rem;
  white-space: nowrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.toggle-pill {
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 2px;
  border: 1px solid var(--color-border-default);
  white-space: nowrap;
}

.toggle-pill__btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-pill__btn:hover {
  color: var(--color-text-secondary);
}

.toggle-pill__btn.is-active {
  background: var(--color-bg-elevated);
  color: var(--color-accent);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.layout-toggle {
  display: flex;
  background: var(--color-bg-subtle);
  border-radius: 8px;
  padding: 2px;
  border: 1px solid var(--color-border-subtle);
}

.layout-toggle__btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.layout-toggle__btn:hover {
  color: var(--color-text-secondary);
}

.layout-toggle__btn.is-active {
  background: var(--color-bg-elevated);
  color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
  border: 1px solid var(--color-border-subtle);
  background: transparent;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chart-tabs-nav__button.is-active {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-strong);
}

.chart-info-root {
  margin: -0.25rem 0 0.5rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.chart-info-card {
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--color-bg-subtle);
  font-size: 0.85rem;
}

.chart-info-card p {
  margin: 0 0 0.35rem;
}

.chart-info-card p:last-child {
  margin-bottom: 0;
}

.grouped-charts {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-system-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.system-group-header-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-info-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.group-info-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.group-info-btn.is-active {
  color: var(--color-accent);
  background: var(--color-bg-elevated);
}

.system-group-description {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  padding: 0.75rem 1rem;
  background: var(--color-bg-subtle);
  border-left: 2px solid var(--color-success);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.system-group-header {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.system-group-icon {
  font-size: 1rem;
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 0.5rem;
}

.profile-link {
  color: var(--color-text-primary) !important;
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
