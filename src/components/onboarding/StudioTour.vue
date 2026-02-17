<template>
  <teleport to="body">
    <div v-if="isActive" class="tour-overlay">
      <!-- Spotlight mask -->
      <div class="tour-mask" :style="spotlightStyle"></div>

      <!-- Glow ring -->
      <div class="tour-glow" :style="glowStyle"></div>

      <!-- Instruction card -->
      <div class="tour-card" :style="cardStyle">
        <div class="tour-card__header">
          <div class="tour-card__avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h3>{{ currentStepData.title }}</h3>
        </div>

        <p class="tour-card__text">{{ currentStepData.text }}</p>

        <div class="tour-card__actions">
          <button
            v-if="currentStepData.skip"
            @click="skipTour"
            class="tour-btn tour-btn--text"
          >
            Skip
          </button>
          <button @click="next" class="tour-btn tour-btn--primary">
            {{ currentStepData.btnText || 'Next' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, StyleValue } from 'vue';
import { useUIStore } from '@/stores/ui';
import { useOnboardingStore, OnboardingState } from '@/stores/onboarding';

const uiStore = useUIStore();
const onboardingStore = useOnboardingStore();

console.log('[Tour] StudioTour component script setup executing');

const isActive = computed(() => uiStore.tourActive);

interface TourStep {
  id: string;
  onboardingState: OnboardingState;
  target: string;
  title: string;
  text: string;
  btnText?: string;
  position: 'right' | 'left' | 'top-left' | 'center';
  skip?: boolean;
  shape?: 'rect' | 'circle' | 'pill';
}

// We map onboarding states to tour steps
// The tour steps might be more granular than onboarding states
const tourSteps: TourStep[] = [
  {
    id: 'timeline',
    onboardingState: OnboardingState.TIMELINE_TUTORIAL,
    target: '.tour-timeline-panel',
    title: 'Build Your Protocol',
    text: 'Drag supplements, meals, exercise, and sleep onto the timeline. The simulation runs in real time as you add them.',
    btnText: 'Next',
    position: 'right',
    skip: true,
    shape: 'rect'
  },
  {
    id: 'charts',
    onboardingState: OnboardingState.TIMELINE_TUTORIAL,
    target: '.tour-charts-panel',
    title: 'Watch Your Biology Respond',
    text: 'Every signal - dopamine, cortisol, glucose, melatonin - updates live as you change your protocol. This is where you see what\'s actually happening.',
    btnText: 'Next',
    position: 'left',
    shape: 'rect'
  },
  {
    id: 'ai',
    onboardingState: OnboardingState.AI_INTRODUCTION,
    target: '.tour-ai-panel', // AI Chat Panel
    title: 'Ask the AI',
    text: 'Not sure what\'s happening? Ask it. "Why did my dopamine drop?" or "What should I take for focus?" It reads your simulation and gives specific answers.',
    btnText: 'Got it',
    position: 'left',
    shape: 'rect'
  },
  {
    id: 'finish',
    onboardingState: OnboardingState.SOFT_LANDING,
    target: 'center', // Center screen
    title: "You're ready.",
    text: 'Start by adding what you took today. The simulation will show you what happened - and what to try next.',
    btnText: 'Start Building My Day',
    position: 'center'
  }
];

const currentStepIndex = ref(0);
const currentStepData = computed(() => tourSteps[currentStepIndex.value]);

// Watch for external state changes to sync tour
watch(() => onboardingStore.currentStep, (newStep) => {
  // Find the first tour step that matches this onboarding state
  const index = tourSteps.findIndex(s => s.onboardingState === newStep);
  if (index !== -1 && index !== currentStepIndex.value) {
    currentStepIndex.value = index;
  }
}, { immediate: true });

function next() {
  const currentStep = tourSteps[currentStepIndex.value];

  if (currentStepIndex.value < tourSteps.length - 1) {
    currentStepIndex.value++;

    // Sync back to onboarding store if we crossed a state boundary
    const nextStep = tourSteps[currentStepIndex.value];
    if (nextStep.onboardingState !== currentStep.onboardingState) {
      onboardingStore.skipTo(nextStep.onboardingState);
    }
  } else {
    finishTour();
  }
}

function skipTour() {
  finishTour();
}

function finishTour() {
  uiStore.setTourActive(false);
  onboardingStore.complete();
}

// Spotlight logic
const targetRect = ref({ top: 0, left: 0, width: 0, height: 0 });
const isTargetVisible = ref(false);
let resizeObserver: ResizeObserver | null = null;

function updateRect() {
  const targetSelector = currentStepData.value.target;
  console.log('[Tour] updateRect for', targetSelector);

  if (targetSelector === 'center') {
    targetRect.value = { top: 0, left: 0, width: 0, height: 0 };
    isTargetVisible.value = true;
    return;
  }

  const el = document.querySelector(targetSelector);
  if (el) {
    const rect = el.getBoundingClientRect();
    targetRect.value = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    // Panels should be at least 100px to be considered "rendered" for the tour
    const minSize = targetSelector.includes('panel') ? 100 : 1;
    const isBigEnough = rect.width >= minSize && rect.height >= minSize;

    console.log('[Tour] Dimensions:', rect.width, 'x', rect.height, 'Target min:', minSize, 'Big enough:', isBigEnough);

    if (isBigEnough) {
      isTargetVisible.value = true;
    }
  } else {
    console.warn('[Tour] Target not found in DOM:', targetSelector);
  }
}

async function updateHighlight(attempts = 0) {
  if (!isActive.value) {
    console.log('[Tour] updateHighlight called but tour not active');
    return;
  }
  await nextTick();

  const targetSelector = currentStepData.value.target;
  console.log('[Tour] updateHighlight for', targetSelector, 'attempt', attempts);

  if (targetSelector === 'center') {
    targetRect.value = { top: 0, left: 0, width: 0, height: 0 };
    isTargetVisible.value = true;
    return;
  }

  const el = document.querySelector(targetSelector);
  if (el) {
    console.log('[Tour] Target found, setting up ResizeObserver');
    // Found it! Start observing immediately regardless of size
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => {
      console.log('[Tour] ResizeObserver trigger');
      updateRect();
    });
    resizeObserver.observe(el);

    // Initial check
    updateRect();
    return;
  }

  // Debug: list all tour elements in DOM
  const allTourEls = document.querySelectorAll('[class*="tour"]');
  console.log('[Tour] Target not found. All elements with "tour" in class:', Array.from(allTourEls).map(e => e.className));

  // Retry if not found in DOM yet (retry for much longer now)
  if (attempts < 100) {
    setTimeout(() => updateHighlight(attempts + 1), 100);
  } else {
    console.error('[Tour] Failed to find target after 100 attempts:', targetSelector);
  }
}

watch(currentStepIndex, () => {
  isTargetVisible.value = false; // Hide while switching/searching
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  updateHighlight();
});

watch(isActive, (active) => {
  console.log('[Tour] isActive changed:', active);
  if (active) {
    updateHighlight();
  } else {
    isTargetVisible.value = false;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  }
}, { immediate: true });

onMounted(() => {
  console.log('[Tour] StudioTour mounted, isActive:', isActive.value);
  window.addEventListener('resize', () => updateRect());
  window.addEventListener('scroll', () => updateRect());
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => updateRect());
  window.removeEventListener('scroll', () => updateRect());
  if (resizeObserver) resizeObserver.disconnect();
});

const spotlightStyle = computed<StyleValue>(() => {
  if (currentStepData.value.target === 'center') {
    return {
      top: '50%',
      left: '50%',
      width: '0',
      height: '0',
      opacity: isTargetVisible.value ? '1' : '0'
    };
  }

  const shape = currentStepData.value.shape || 'rect';
  let radius = '12px';
  if (shape === 'circle') radius = '50%';
  if (shape === 'pill') radius = '999px';

  return {
    top: `calc(${targetRect.value.top}px - 10px)`,
    left: `calc(${targetRect.value.left}px - 10px)`,
    width: `calc(${targetRect.value.width}px + 20px)`,
    height: `calc(${targetRect.value.height}px + 20px)`,
    borderRadius: radius,
    opacity: isTargetVisible.value ? '1' : '0',
    visibility: isTargetVisible.value ? 'visible' : 'hidden'
  };
});

const glowStyle = computed(() => {
  if (currentStepData.value.target === 'center' || !isTargetVisible.value) return { display: 'none' };

  const shape = currentStepData.value.shape || 'rect';
  let radius = '12px';
  if (shape === 'circle') radius = '50%';
  if (shape === 'pill') radius = '999px';

  return {
    top: `calc(${targetRect.value.top}px - 10px)`,
    left: `calc(${targetRect.value.left}px - 10px)`,
    width: `calc(${targetRect.value.width}px + 20px)`,
    height: `calc(${targetRect.value.height}px + 20px)`,
    borderRadius: radius
  };
});

const cardStyle = computed<StyleValue>(() => {
  const rect = targetRect.value;
  const pos = currentStepData.value.position;

  if (currentStepData.value.target === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: isTargetVisible.value ? '1' : '0'
    };
  }

  // Basic positioning logic
  let top = rect.top;
  let left = rect.left;
  let transform = '';

  if (pos === 'right') {
    left = rect.left + rect.width + 20;
    top = rect.top + 20;
  } else if (pos === 'left') {
    left = rect.left - 340; // Card width + gap
    top = rect.top + 20;
  } else if (pos === 'top-left') {
    top = rect.top - 200; // Above
    left = rect.left - 280;
  } else {
    // Default to bottom center
    top = rect.top + rect.height + 20;
    left = rect.left + rect.width / 2;
    transform = 'translateX(-50%)';
  }

  // Boundary checks (very basic)
  if (left < 20) left = 20;
  if (window.innerWidth - left < 340) left = window.innerWidth - 340;

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform,
    opacity: isTargetVisible.value ? '1' : '0',
    visibility: isTargetVisible.value ? 'visible' : 'hidden'
  };
});
</script>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.tour-mask {
  position: absolute;
  background: transparent;
  box-shadow: 0 0 40px 9999px rgba(5, 5, 10, 0.75);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: 9999;
}

.tour-glow {
  position: absolute;
  pointer-events: none;
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.5), 0 0 30px rgba(0, 212, 255, 0.25);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10000;
}

/* Ensure the mask doesn't block clicks on the target if needed,
   but generally we want the user to interact with the tour card first */

.tour-card {
  position: absolute;
  width: 320px;
  background: rgba(20, 20, 35, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  pointer-events: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10001;
}

.tour-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tour-card__avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d4ff;
  flex-shrink: 0;
}

.tour-card__header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.tour-card__text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #a0a0b0;
}

.tour-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.tour-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.tour-btn--text {
  background: transparent;
  color: #888;
}

.tour-btn--text:hover {
  color: #fff;
}

.tour-btn--primary {
  background: #00d4ff;
  color: #050509;
  font-weight: 600;
}

.tour-btn--primary:hover {
  background: #33ddff;
  transform: translateY(-1px);
}
</style>
