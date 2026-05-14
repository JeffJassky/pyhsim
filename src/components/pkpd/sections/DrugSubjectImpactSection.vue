<template>
  <SubjectImpactCallout
    v-if="impact"
    :direction="impact.direction"
    :headline="impact.headline"
    :magnitude="impact.magnitude"
    :explanation="impact.explanation"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { PharmacologyDef } from '@kyneticbio/core';
import { useUserStore } from '@/stores/user';
import SubjectImpactCallout from '../atoms/SubjectImpactCallout.vue';
import { useDrugSubjectImpact } from '@/composables/useDrugSubjectImpact';

const props = defineProps<{
  pharmacology: PharmacologyDef | null | undefined;
}>();

const userStore = useUserStore();
const { subject } = storeToRefs(userStore);

const pharmacologyRef = computed(() => props.pharmacology ?? null);
const subjectRef = computed(() => subject.value);

const impact = useDrugSubjectImpact(pharmacologyRef, subjectRef);
</script>
