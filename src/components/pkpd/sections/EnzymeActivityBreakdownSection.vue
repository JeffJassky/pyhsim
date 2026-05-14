<template>
  <div v-if="breakdown" class="enzyme-breakdown">
    <FactorBreakdown :factors="breakdown.rows" total-label="result" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import FactorBreakdown from '../atoms/FactorBreakdown.vue';
import { useUserStore } from '@/stores/user';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';
import { useEnzymeFactorBreakdown } from '@/composables/useEnzymeFactorBreakdown';

const props = defineProps<{
  signalKey: string;
  liveValue: number | undefined;
  playheadMin: number;
}>();

const userStore = useUserStore();
const timelineStore = useTimelineStore();
const libraryStore = useLibraryStore();
const { subject } = storeToRefs(userStore);
const { items } = storeToRefs(timelineStore);

const signalKeyRef = computed(() => props.signalKey);
const liveValueRef = computed(() => props.liveValue);
const subjectRef = computed(() => subject.value);
const playheadRef = computed(() => props.playheadMin);
const itemsRef = computed(() => items.value);
const defsMapRef = computed(() => libraryStore.defsMap);

const breakdown = useEnzymeFactorBreakdown(
  signalKeyRef,
  liveValueRef,
  subjectRef,
  playheadRef,
  itemsRef,
  defsMapRef,
);
</script>

<style scoped>
.enzyme-breakdown {
  margin-top: 0.5rem;
}
</style>
