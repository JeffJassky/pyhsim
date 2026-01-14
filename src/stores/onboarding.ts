import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ArchetypeId } from '@/models/domain/archetypes';

export enum OnboardingState {
  HOOK_ANIMATION = 'HOOK_ANIMATION',
  QUICK_PROFILE = 'QUICK_PROFILE',
  GOAL_INTERVENTIONS = 'GOAL_INTERVENTIONS',
  TIMELINE_TUTORIAL = 'TIMELINE_TUTORIAL',
  AI_INTRODUCTION = 'AI_INTRODUCTION',
  SOFT_LANDING = 'SOFT_LANDING',
  COMPLETE = 'COMPLETE'
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref<OnboardingState>(OnboardingState.HOOK_ANIMATION);
  const completed = ref(false);
  const skippedSteps = ref<Set<OnboardingState>>(new Set());
  
  // Profile data
  const persona = ref<ArchetypeId | null>(null);
  const quickProfile = ref({
    sex: null as 'male' | 'female' | null,
    ageRange: null as string | null,
    primaryGoal: null as string | null 
  });

  // Actions
  function advance() {
    const steps = Object.values(OnboardingState);
    const currentIndex = steps.indexOf(currentStep.value);
    
    // If next step is COMPLETE, or we are at the end
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1] as OnboardingState;
      if (nextStep === OnboardingState.COMPLETE) {
        complete();
      } else {
        currentStep.value = nextStep;
      }
    } else {
      complete();
    }
    saveState();
  }

  function skipTo(step: OnboardingState) {
    currentStep.value = step;
    saveState();
  }

  function complete() {
    completed.value = true;
    currentStep.value = OnboardingState.COMPLETE;
    saveState();
  }
  
  function reset() {
      completed.value = false;
      currentStep.value = OnboardingState.HOOK_ANIMATION;
      skippedSteps.value.clear();
      persona.value = null;
      quickProfile.value = {
          sex: null,
          ageRange: null,
          primaryGoal: null
      };
      saveState();
  }
  
  function saveState() {
      localStorage.setItem('physim-onboarding', JSON.stringify({
          completed: completed.value,
          currentStep: currentStep.value,
      }));
  }
  
  function loadState() {
      const stored = localStorage.getItem('physim-onboarding');
      if (stored) {
          const parsed = JSON.parse(stored);
          completed.value = parsed.completed;
          if (parsed.completed) {
               currentStep.value = OnboardingState.COMPLETE;
          } else {
              currentStep.value = parsed.currentStep || OnboardingState.HOOK_ANIMATION;
          }
      }
  }

  // Initialize
  loadState();

  return {
    currentStep,
    completed,
    skippedSteps,
    persona,
    quickProfile,
    advance,
    skipTo,
    complete,
    reset
  };
});
