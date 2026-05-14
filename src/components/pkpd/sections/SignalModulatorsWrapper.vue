<template>
  <div v-if="isEnzymeOrTransporterSignal" class="signal-modulators">
    <h4 class="signal-modulators__heading">Active modulators (at playhead)</h4>
    <SignalActiveModulatorsSection
      :modulators="modulators"
      @drug-click="selectTimelineItem"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import SignalActiveModulatorsSection from './SignalActiveModulatorsSection.vue';
import { useActiveModulators } from '@/composables/useActiveModulators';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';

const props = defineProps<{
  signalKey: string;
  playheadMin: number;
}>();

function selectTimelineItem(itemId: string) {
  timelineStore.select(itemId as any);
}

const timelineStore = useTimelineStore();
const libraryStore = useLibraryStore();

const { items } = storeToRefs(timelineStore);

const signalKeyRef = computed(() => props.signalKey);
const playheadRef = computed(() => props.playheadMin);
const itemsRef = computed(() => items.value);
const defsMapRef = computed(() => libraryStore.defsMap);

const isEnzymeOrTransporterSignal = computed(() => {
  // Heuristic: only show modulators section for aux signals representing
  // enzyme/transporter activity. Keeps the panel uncluttered for ordinary
  // physiological signals like cortisol or glucose.
  return /Activity$/.test(props.signalKey);
});

const modulators = useActiveModulators(signalKeyRef, playheadRef, itemsRef, defsMapRef);
</script>

<style scoped>
.signal-modulators {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.signal-modulators__heading {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}
</style>
