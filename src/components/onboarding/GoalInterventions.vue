<template>
  <div class="intervention-select">
    <div class="intervention-select__ambient"></div>

    <div class="intervention-select__content">
      <div class="intervention-select__header">
        <h2 class="intervention-select__title">Starting points for {{ goalLabel }}</h2>
        <p class="intervention-select__subtitle">
          Select any interventions you'd like to explore, or skip to start from scratch.
        </p>
      </div>

      <div class="intervention-select__grid">
        <button
          v-for="item in interventions"
          :key="item.key"
          class="intervention-card"
          :class="{ 'is-selected': selectedKeys.has(item.key) }"
          @click="toggle(item)"
        >
          <span class="intervention-card__icon">{{ item.icon }}</span>
          <span class="intervention-card__label">{{ item.label }}</span>
          <div v-if="selectedKeys.has(item.key)" class="intervention-card__check">✓</div>
        </button>
      </div>

      <transition name="fade-up" mode="out-in">
        <div v-if="lastSelectedItem" :key="lastSelectedItem.key" class="intervention-detail">
          <div class="intervention-detail__improvements">
            <div v-for="imp in lastSelectedItem.improvements" :key="imp" class="improvement-pill">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ imp }}
            </div>
          </div>
          
          <p class="intervention-detail__readout">
            {{ lastSelectedItem.readout }}
          </p>
        </div>
      </transition>

      <div class="intervention-select__actions">
        <button v-if="selectedKeys.size > 0" class="intervention-select__btn" @click="confirm">
          Add {{ selectedKeys.size }} to my day
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="intervention-select__skip" @click="$emit('next')">
          {{ selectedKeys.size > 0 ? 'Skip adding these' : 'Skip for now' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useOnboardingStore } from '@/stores/onboarding';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';
import { GOAL_CATEGORIES, type RecommendedIntervention } from '@/models/goals';
import { minuteToISO, toMinute } from '@/utils/time';

const emit = defineEmits(['next']);
const onboarding = useOnboardingStore();
const timeline = useTimelineStore();
const library = useLibraryStore();

const selectedKeys = ref<Set<string>>(new Set());
const lastSelectedKey = ref<string | null>(null);

const goalId = computed(() => onboarding.quickProfile.primaryGoal);
const goalCategory = computed(() => GOAL_CATEGORIES.find(g => g.id === goalId.value));
const goalLabel = computed(() => goalCategory.value?.label || 'Wellness');
const interventions = computed(() => goalCategory.value?.recommendedInterventions || []);

const lastSelectedItem = computed(() => 
  interventions.value.find(i => i.key === lastSelectedKey.value)
);

function toggle(item: RecommendedIntervention) {
  if (selectedKeys.value.has(item.key)) {
    selectedKeys.value.delete(item.key);
    if (lastSelectedKey.value === item.key) {
      lastSelectedKey.value = Array.from(selectedKeys.value).pop() || null;
    }
  } else {
    selectedKeys.value.add(item.key);
    lastSelectedKey.value = item.key;
  }
}

function confirm() {
  if (selectedKeys.value.size === 0) return emit('next');
  
  let offset = 0;
  for (const key of selectedKeys.value) {
    const def = library.defs.find(d => d.key === key);
    if (def) {
      // Stagger items starting at 8:00 AM
      const startMin = toMinute(480 + offset); 
      const endMin = toMinute(480 + offset + def.defaultDurationMin);
      timeline.addItem(minuteToISO(startMin), minuteToISO(endMin), {
        key: def.key,
        params: {},
        intensity: 1,
      });
      offset += 30; // Stagger by 30 mins
    }
  }
  
  emit('next');
}
</script>

<style scoped>
@import './onboarding.css';

.intervention-select {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--ob-bg-deep, #050509);
  overflow: hidden;
  color: #f0f0f5;
}

.intervention-select__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0, 212, 255, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 50% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%);
}

.intervention-select__content {
  width: 100%;
  max-width: 500px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.intervention-select__header {
  text-align: center;
}

.intervention-select__title {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
}

.intervention-select__subtitle {
  font-size: 1rem;
  color: #8888a0;
  margin: 0;
}

.intervention-select__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}

.intervention-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 0.5rem;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.intervention-card:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.intervention-card.is-selected {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);
}

.intervention-card__check {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #00d4ff;
  color: #050509;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.intervention-card__icon {
  font-size: 2rem;
}

.intervention-card__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #f0f0f5;
  text-align: center;
}

/* Detail view */
.intervention-detail {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.intervention-detail__improvements {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.improvement-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 999px;
  color: #c4b5fd;
  font-size: 0.8125rem;
  font-weight: 500;
}

.intervention-detail__readout {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: #c0c0d0;
  text-align: center;
  margin: 0;
  max-width: 400px;
}

.intervention-select__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.intervention-select__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #050509;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 24px rgba(0, 212, 255, 0.35);
}

.intervention-select__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.45);
}

.intervention-select__skip {
  background: transparent;
  border: none;
  color: #555570;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;
}

.intervention-select__skip:hover {
  color: #8888a0;
  text-decoration: underline;
}

/* Transitions */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 480px) {
  .intervention-select__grid {
    grid-template-columns: 1fr;
  }
  
  .intervention-card {
    flex-direction: row;
    padding: 1rem;
    justify-content: flex-start;
  }
}
</style>

<style scoped>
@import './onboarding.css';

.intervention-select {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--ob-bg-deep, #050509);
  overflow: hidden;
  color: #f0f0f5;
}

.intervention-select__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0, 212, 255, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 50% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%);
}

.intervention-select__content {
  width: 100%;
  max-width: 500px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.intervention-select__header {
  text-align: center;
}

.intervention-select__title {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
}

.intervention-select__subtitle {
  font-size: 1rem;
  color: #8888a0;
  margin: 0;
}

.intervention-select__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}

.intervention-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 0.5rem;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.intervention-card:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.intervention-card.is-selected {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);
}

.intervention-card__icon {
  font-size: 2rem;
}

.intervention-card__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #f0f0f5;
  text-align: center;
}

/* Detail view */
.intervention-detail {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.intervention-detail__improvements {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.improvement-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 999px;
  color: #c4b5fd;
  font-size: 0.8125rem;
  font-weight: 500;
}

.intervention-detail__readout {
  font-size: 1rem;
  line-height: 1.6;
  color: #c0c0d0;
  text-align: center;
  margin: 0;
  max-width: 400px;
}

.intervention-select__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #050509;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 24px rgba(0, 212, 255, 0.35);
  margin-top: 0.5rem;
}

.intervention-select__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.45);
}

.intervention-select__btn:active {
  transform: translateY(0);
}

/* Transitions */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 480px) {
  .intervention-select__grid {
    grid-template-columns: 1fr;
  }
  
  .intervention-card {
    flex-direction: row;
    padding: 1rem;
    justify-content: flex-start;
  }
}
</style>
