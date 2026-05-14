<template>
  <Teleport to="body">
    <div
      v-if="open && enzymeName"
      class="enzyme-drawer-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <aside class="enzyme-drawer">
        <header class="enzyme-drawer__header">
          <div class="enzyme-drawer__title-block">
            <p class="enzyme-drawer__eyebrow">Enzyme activity</p>
            <h2 class="enzyme-drawer__title">{{ enzymeName }}</h2>
          </div>
          <div class="enzyme-drawer__actions">
            <button
              class="enzyme-drawer__pin"
              :class="{ 'enzyme-drawer__pin--pinned': pinnedToChart }"
              @click="togglePin"
              v-tooltip="pinnedToChart ? 'Remove from main chart' : 'Add to main chart'"
            >
              {{ pinnedToChart ? '★ Pinned' : '☆ Pin to chart' }}
            </button>
            <button class="enzyme-drawer__close" @click="emit('close')" aria-label="Close">×</button>
          </div>
        </header>

        <div class="enzyme-drawer__hero" v-if="liveValue !== undefined">
          <span class="enzyme-drawer__hero-value">{{ liveValue.toFixed(2) }}</span>
          <span class="enzyme-drawer__hero-label">current activity (1.00 = your baseline)</span>
          <EnzymeActivitySparkline
            :data="signalSeries"
            :grid="gridMins"
            :playhead-min="minute"
          />
        </div>

        <div class="enzyme-drawer__body">
          <section class="enzyme-drawer__section">
            <h3 class="enzyme-drawer__section-heading">How it's composed</h3>
            <EnzymeActivityBreakdownSection
              v-if="signalKey"
              :signal-key="signalKey"
              :live-value="liveValue"
              :playhead-min="minute"
            />
          </section>

          <section v-if="hasModulators" class="enzyme-drawer__section">
            <h3 class="enzyme-drawer__section-heading">Active modulators</h3>
            <SignalActiveModulatorsSection
              :modulators="modulators"
              @drug-click="handleDrugClick"
            />
          </section>
        </div>

        <footer class="enzyme-drawer__footer">
          Scrub the timeline to see how this evolves.
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import EnzymeActivityBreakdownSection from './sections/EnzymeActivityBreakdownSection.vue';
import SignalActiveModulatorsSection from './sections/SignalActiveModulatorsSection.vue';
import EnzymeActivitySparkline from './atoms/EnzymeActivitySparkline.vue';
import { useActiveModulators } from '@/composables/useActiveModulators';
import { useEngineStore } from '@/stores/engine';
import { usePlayhead } from '@/composables/usePlayhead';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';
import { useUserStore } from '@/stores/user';
import type { Signal } from '@kyneticbio/core';
import {
  auxSignalKeyToEnzyme,
  enzymeDisplayLabel,
} from '@/models/domain/enzyme-key-mapping';

const props = defineProps<{
  open: boolean;
  signalKey: string | null;
}>();

const emit = defineEmits<{ close: [] }>();

const engineStore = useEngineStore();
const { minute } = usePlayhead();
const timelineStore = useTimelineStore();
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const { items } = storeToRefs(timelineStore);
const { auxiliarySeries, gridMins } = storeToRefs(engineStore);

const pinnedToChart = computed(
  () => props.signalKey ? userStore.enabledSignals[props.signalKey as Signal] === true : false,
);

function togglePin() {
  if (!props.signalKey) return;
  const next = !pinnedToChart.value;
  userStore.toggleSignal(props.signalKey as Signal, next);
}

const signalKey = computed(() => props.signalKey);

const enzymeName = computed(() => {
  if (!props.signalKey) return null;
  const canon = auxSignalKeyToEnzyme(props.signalKey);
  if (!canon) return null;
  return enzymeDisplayLabel(canon);
});

const signalSeries = computed<Float32Array | undefined>(() => {
  if (!props.signalKey) return undefined;
  return auxiliarySeries.value?.[props.signalKey];
});

const liveValue = computed<number | undefined>(() => {
  const series = signalSeries.value;
  if (!series) return undefined;
  const grid = gridMins.value;
  if (!grid || grid.length < 2) return undefined;
  const step = grid[1] - grid[0];
  const idx = Math.max(0, Math.min(series.length - 1, Math.round((minute.value - grid[0]) / step)));
  return series[idx];
});

const playheadRef = computed(() => minute.value);
const itemsRef = computed(() => items.value);
const defsMapRef = computed(() => libraryStore.defsMap);
const signalKeyForModulators = computed(() => props.signalKey ?? undefined);

const modulators = useActiveModulators(signalKeyForModulators, playheadRef, itemsRef, defsMapRef);

const hasModulators = computed(
  () => modulators.value.inhibitors.length > 0 || modulators.value.inducers.length > 0,
);

function handleDrugClick(itemId: string) {
  timelineStore.select(itemId as any);
  emit('close');
}
</script>

<style scoped>
.enzyme-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 950;
}

.enzyme-drawer {
  background: var(--color-bg-base);
  width: min(420px, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-large);
  animation: slide-in 180ms ease-out;
}

@keyframes slide-in {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Header --------------------------------------------------- */
.enzyme-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0.75rem;
}

.enzyme-drawer__title-block {
  min-width: 0;
}

.enzyme-drawer__eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.enzyme-drawer__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
}

.enzyme-drawer__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.enzyme-drawer__pin {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.enzyme-drawer__pin:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.enzyme-drawer__pin--pinned {
  background: var(--color-text-primary);
  border-color: var(--color-text-primary);
  color: var(--color-text-inverted);
}

.enzyme-drawer__pin--pinned:hover {
  background: var(--color-text-primary);
  color: var(--color-text-inverted);
  opacity: 0.85;
}

.enzyme-drawer__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0.25rem 0.4rem;
  margin: -0.25rem -0.5rem 0 0;
  transition: color 0.12s ease;
}

.enzyme-drawer__close:hover {
  color: var(--color-text-primary);
}

/* Hero --------------------------------------------------- */
.enzyme-drawer__hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 1.25rem 1.25rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.enzyme-drawer__hero-value {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--color-text-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.enzyme-drawer__hero-label {
  margin-top: 0.4rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

/* Body --------------------------------------------------- */
.enzyme-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.enzyme-drawer__section {
  margin-bottom: 1.5rem;
}

.enzyme-drawer__section:last-child {
  margin-bottom: 0;
}

.enzyme-drawer__section-heading {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

/* Footer --------------------------------------------------- */
.enzyme-drawer__footer {
  padding: 0.75rem 1.25rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-style: italic;
  border-top: 1px solid var(--color-border-subtle);
  text-align: center;
}
</style>
