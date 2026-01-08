<template>
  <div class="onboarding">
    <transition name="step" mode="out-in">
      <component :is="currentStepComponent" :key="store.currentStep" @next="advance" />
    </transition>

    <!-- Dev controls (hidden in production) -->
    <div class="onboarding__dev">
      <button @click="store.reset()">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useOnboardingStore, OnboardingState } from '@/stores/onboarding';
import { useUIStore } from '@/stores/ui';
import { useRouter } from 'vue-router';

// Components
import HookAnimation from '@/components/onboarding/HookAnimation.vue';
import QuickProfile from '@/components/onboarding/QuickProfile.vue';
import GoalInterventions from '@/components/onboarding/GoalInterventions.vue';

const store = useOnboardingStore();
const uiStore = useUIStore();
const router = useRouter();

const currentStepComponent = computed(() => {
  switch (store.currentStep) {
    case OnboardingState.HOOK_ANIMATION: return HookAnimation;
    case OnboardingState.QUICK_PROFILE: return QuickProfile;
    case OnboardingState.GOAL_INTERVENTIONS: return GoalInterventions;
    default: return null;
  }
});

function advance() {
  store.advance();
}

watch(() => store.currentStep, (step) => {
  if (step === OnboardingState.TIMELINE_TUTORIAL ||
      step === OnboardingState.AI_INTRODUCTION ||
      step === OnboardingState.SOFT_LANDING) {
    uiStore.setTourActive(true);
    router.push({ name: 'studio' });
  }
}, { immediate: true });

watch(() => store.completed, (isCompleted) => {
  if (isCompleted) {
    router.push({ name: 'studio' });
  }
}, { immediate: true });
</script>

<style scoped>
.onboarding {
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  background: #050509;
  color: #f0f0f5;
  overflow: hidden;
  position: relative;
}

/* Dev controls - subtle and hidden by default */
.onboarding__dev {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.2s ease;
  /* Override generic child styles */
  width: auto !important;
  height: auto !important;
  pointer-events: none;
}

.onboarding__dev:hover {
  opacity: 1;
}

.onboarding__dev button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #555570;
  font-size: 0.6875rem;
  padding: 0.375rem 0.625rem;
  border-radius: 4px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: auto;
}

.onboarding__dev button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #8888a0;
}

/* Step transitions - smooth crossfade with subtle motion */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.step-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.step-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Ensure full height for child components */
.onboarding :deep(> *) {
  width: 100%;
  height: 100%;
}
</style>
