<template>
  <div class="tutorial">
    <AppShell :show-right-sidebar="false">
      <section class="tutorial__grid">
        <Panel title="" icon="" class="tutorial__timeline-panel" ref="timelinePanelRef">
          <div class="tutorial__panel-header">
            <h2>Your Day</h2>
          </div>

          <TimelineView
            :items="timeline.items"
            :selected-id="timeline.selectedId"
            :playhead-min="minute"
            :date-iso="timeline.selectedDate"
            :day-start-min="420"
            @select="timeline.select"
            @update="(d) => timeline.updateItem(d.id, { start: d.start, end: d.end })"
            @playhead="setMinute"
          />
          <PlayheadBar :minute="minute" />
        </Panel>

        <Panel title="Real-time Response" icon="" class="tutorial__chart-panel" ref="chartPanelRef">
          <SignalChart
            :grid="gridMins"
            :seriesSpecs="chartSpecs"
            :seriesData="signalSeriesData"
            :playheadMin="minute"
            :interventions="interventionBands"
            :dayStartMin="420"
          />
        </Panel>
      </section>

      <AddItemModal
        v-model="addItemModalOpen"
        :recents="[]"
        @select="handleCreate"
      />
    </AppShell>

    <!-- FAB -->
    <div class="tutorial__fab" ref="fabRef" :class="{ 'is-highlighted': isFabTarget }">
      <button class="tutorial__fab-btn" type="button" @click="openAddModal">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3V15M3 9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Add item
      </button>
    </div>

    <!-- Tutorial overlay -->
    <div class="tutorial__overlay" v-if="step < 3">
      <!-- Spotlight mask -->
      <div class="tutorial__mask" :style="highlightStyle"></div>

      <!-- Instruction card -->
      <div class="tutorial__card" :style="cardStyle">
        <div class="tutorial__card-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="tutorial__card-content">
          <h3>{{ currentInstruction.title }}</h3>
          <p>{{ currentInstruction.text }}</p>
        </div>
        <button v-if="currentInstruction.nextBtn" @click="advanceStep" class="tutorial__card-btn">
          {{ currentInstruction.nextBtn }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import AppShell from '@/components/layout/AppShell.vue';
import Panel from '@/components/core/Panel.vue';
import PlayheadBar from '@/components/core/PlayheadBar.vue';
import TimelineView from '@/components/timeline/TimelineView.vue';
import SignalChart from '@/components/charts/SignalChart.vue';
import AddItemModal from '@/components/launcher/AddItemModal.vue';

import { useTimelineStore } from '@/stores/timeline';
import { useEngine } from '@/composables/useEngine';
import { usePlayhead } from '@/composables/usePlayhead';
import { toMinuteOfDay } from '@/core/serialization';
import { minuteToISO } from '@/utils/time';
import type { ChartSeriesSpec, InterventionDef, Minute } from '@/types';

const emit = defineEmits(['next']);

const timeline = useTimelineStore();
const engine = useEngine();
const { minute, setMinute } = usePlayhead();
const { gridMins, series } = engine;

const step = ref(0);
const addItemModalOpen = ref(false);

// Refs for highlighting
const fabRef = ref<HTMLElement | null>(null);
const timelinePanelRef = ref<{ $el: HTMLElement } | null>(null);
const chartPanelRef = ref<{ $el: HTMLElement } | null>(null);

// Chart specs
const chartSpecs = ref<ChartSeriesSpec[]>([
  { key: 'energy', label: 'Energy', tendency: 'higher', yMin: 0, yMax: 100, color: '#fbbf24' },
  { key: 'cortisol', label: 'Cortisol', tendency: 'neutral', yMin: 0, yMax: 20, color: '#f97316' }
]);

const signalSeriesData = computed(() => {
  const result: Record<string, number[]> = {};
  if (!series.value) return result;
  for (const [key, data] of Object.entries(series.value)) {
    result[key] = data ? Array.from(data) : [];
  }
  return result;
});

const interventionBands = computed(() =>
  timeline.items.map((item) => ({
    key: item.id,
    start: toMinuteOfDay(item.start),
    end: toMinuteOfDay(item.end),
    color: 'rgba(255,255,255,0.1)',
  }))
);

// Tutorial instructions
const instructions = [
  {
    title: "Add to your timeline",
    text: "Tap the button to add an intervention like a walk, meal, or coffee.",
    target: 'fab' as const
  },
  {
    title: "Adjust timing",
    text: "Drag items to move them, or drag edges to change duration.",
    target: 'timeline' as const,
    nextBtn: "Got it"
  },
  {
    title: "Watch the response",
    text: "See how your signals change in real-time as you adjust.",
    target: 'chart' as const,
    nextBtn: "Finish"
  }
];

const currentInstruction = computed(() => instructions[step.value]);

const targetRect = ref({ top: 0, left: 0, width: 0, height: 0 });

async function updateHighlight(attempts = 0) {
  await nextTick();
  let el: HTMLElement | null = null;

  if (currentInstruction.value.target === 'fab') {
    el = fabRef.value;
  } else if (currentInstruction.value.target === 'timeline') {
    el = timelinePanelRef.value?.$el ?? null;
  } else if (currentInstruction.value.target === 'chart') {
    el = chartPanelRef.value?.$el ?? null;
  }

  if (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      targetRect.value = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
      return;
    }
  }

  if (attempts < 5) {
    setTimeout(() => updateHighlight(attempts + 1), 200);
  }
}

const isFabTarget = computed(() => currentInstruction.value.target === 'fab' && step.value === 0);

const highlightStyle = computed(() => ({
  '--spotlight-top': `${targetRect.value.top}px`,
  '--spotlight-left': `${targetRect.value.left}px`,
  '--spotlight-width': `${targetRect.value.width}px`,
  '--spotlight-height': `${targetRect.value.height}px`,
}));

const cardStyle = computed(() => {
  const rect = targetRect.value;
  if (rect.width === 0) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  // Position card near the target
  const top = rect.top > 300 ? rect.top - 140 : rect.top + rect.height + 20;
  return {
    top: `${top}px`,
    left: '50%',
    transform: 'translateX(-50%)'
  };
});

function openAddModal() {
  if (step.value === 0) {
    addItemModalOpen.value = true;
  }
}

function handleCreate(def: InterventionDef) {
  const startMin = minute.value as Minute;
  const endMin = (startMin + def.defaultDurationMin) as Minute;
  timeline.addItem(minuteToISO(startMin), minuteToISO(endMin), {
    key: def.key,
    params: {},
    intensity: 1,
  });

  if (step.value === 0) {
    advanceStep();
  }
}

function advanceStep() {
  if (step.value < 2) {
    step.value++;
    updateHighlight();
  } else {
    emit('next');
  }
}

watch(step, () => updateHighlight());

onMounted(() => {
  updateHighlight();
});
</script>

<style scoped>
.tutorial {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #0a0a12;
}

.tutorial__grid {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.tutorial__panel-header {
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.tutorial__panel-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #f0f0f5;
  margin: 0;
}

/* FAB */
.tutorial__fab {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 50;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tutorial__fab.is-highlighted {
  z-index: 10002;
  transform: scale(1.05);
}

.tutorial__fab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #050509;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.35);
  transition: all 0.2s ease;
}

.tutorial__fab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 212, 255, 0.45);
}

/* Overlay */
.tutorial__overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.tutorial__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  /* Create spotlight effect using radial gradient mask */
  mask-image: radial-gradient(
    ellipse calc(var(--spotlight-width) * 0.6) calc(var(--spotlight-height) * 0.6) at
    calc(var(--spotlight-left) + var(--spotlight-width) / 2)
    calc(var(--spotlight-top) + var(--spotlight-height) / 2),
    transparent 70%,
    black 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse calc(var(--spotlight-width) * 0.6) calc(var(--spotlight-height) * 0.6) at
    calc(var(--spotlight-left) + var(--spotlight-width) / 2)
    calc(var(--spotlight-top) + var(--spotlight-height) / 2),
    transparent 70%,
    black 100%
  );
}

/* Instruction card */
.tutorial__card {
  position: absolute;
  width: 300px;
  background: rgba(20, 20, 35, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  backdrop-filter: blur(20px);
  pointer-events: auto;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.tutorial__card-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d4ff;
}

.tutorial__card-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #f0f0f5;
  margin: 0 0 0.375rem;
}

.tutorial__card-content p {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #8888a0;
  margin: 0;
}

.tutorial__card-btn {
  align-self: flex-end;
  padding: 0.5rem 1rem;
  background: #00d4ff;
  color: #050509;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tutorial__card-btn:hover {
  background: #00bfe8;
}
</style>
