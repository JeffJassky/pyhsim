<template>
  <div class="personalized-demo">
    <component :is="activeDemo" @next="$emit('next')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useOnboardingStore } from '@/stores/onboarding';
import DemoOptimizer from './personalized/DemoOptimizer.vue';
// For now, mapping other paths to Optimizer if they don't exist, or placeholders
import DemoSleep from './personalized/DemoOptimizer.vue'; // Placeholder
import DemoMood from './personalized/DemoOptimizer.vue';   // Placeholder
import DemoPractitioner from './personalized/DemoOptimizer.vue'; // Placeholder

const store = useOnboardingStore();
const emit = defineEmits(['next']);

const activeDemo = computed(() => {
  const goal = store.quickProfile.primaryGoal;
  // Simple mapping
  if (['energy', 'focus', 'performance'].includes(goal || '')) return DemoOptimizer;
  if (goal === 'sleep') return DemoSleep;
  if (goal === 'mood') return DemoMood;
  if (goal === 'exploring') return DemoPractitioner;
  
  return DemoOptimizer; // Default
});
</script>

<style scoped>
.personalized-demo {
  width: 100%;
  height: 100%;
}
</style>