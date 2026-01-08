<template>
  <div class="profile">
    <!-- Ambient background -->
    <div class="profile__ambient"></div>

    <!-- Progress bar -->
    <div class="profile__progress">
      <div
        class="profile__progress-bar"
        :style="{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }"
      ></div>
    </div>

    <!-- Back button -->
    <button
      v-if="currentQuestion > 0"
      class="profile__back"
      @click="prevQuestion"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 5L7 10L12 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Back
    </button>

    <!-- Content -->
    <div class="profile__content">
      <transition name="slide" mode="out-in">
        <div :key="currentQuestion" class="profile__question">
          <!-- AI guidance -->
          <div class="profile__ai">
            <div class="profile__ai-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <p class="profile__ai-text">{{ questions[currentQuestion].hint }}</p>
          </div>

          <!-- Question -->
          <h2 class="profile__title">{{ questions[currentQuestion].title }}</h2>

          <!-- Options grid -->
          <div
            class="profile__options"
            :class="`profile__options--${questions[currentQuestion].layout}`"
          >
            <button
              v-for="option in questions[currentQuestion].options"
              :key="option.value"
              class="profile__option"
              :class="{ 'is-selected': isSelected(option.value) }"
              @click="selectOption(option.value)"
            >
              <span v-if="option.icon" class="profile__option-icon">{{ option.icon }}</span>
              <div class="profile__option-content">
                <span class="profile__option-label">{{ option.label }}</span>
                <span v-if="option.desc" class="profile__option-desc">{{ option.desc }}</span>
              </div>
              <div class="profile__option-check">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfilesStore } from '@/stores/profiles';
import { GOAL_CATEGORIES } from '@/models/goals';
import { ARCHETYPES, type ArchetypeId } from '@/models/archetypes';

const emit = defineEmits(['next']);
const store = useOnboardingStore();
const profilesStore = useProfilesStore();

const currentQuestion = ref(0);

interface Option {
  value: string;
  label: string;
  icon?: string;
  desc?: string;
}

interface Question {
  id: string;
  hint: string;
  title: string;
  layout: 'row' | 'grid' | 'list';
  options: Option[];
}

const goalDescriptions: Record<string, string> = {
  energy: 'Avoid crashes, stay consistent',
  productivity: 'Optimize mental output',
  weightLoss: 'Metabolic flexibility & fat loss',
  mood: 'Reduce anxiety, feel balanced',
  focus: 'Deep work & concentration',
  recovery: 'Bounce back faster',
  sleep: 'Fall asleep faster, wake refreshed',
  digestion: 'Gut health & regularity',
  pain: 'Manage chronic pain & inflammation',
  cycle: 'Sync with your rhythm',
  calm: 'Stress resilience',
};

const questions = computed<Question[]>(() => {
  const archetype = ARCHETYPES.find(a => a.id === store.persona);
  const filteredGoals = archetype 
    ? GOAL_CATEGORIES.filter(g => archetype.commonGoals.includes(g.id))
        .sort((a, b) => archetype.commonGoals.indexOf(a.id) - archetype.commonGoals.indexOf(b.id))
    : GOAL_CATEGORIES;

  return [
    {
      id: 'archetype',
      hint: 'This helps us calibrate the simulation for your needs.',
      title: 'Which describes you best?',
      layout: 'grid',
      options: ARCHETYPES.map(a => ({
        value: a.id,
        label: a.label,
        icon: a.icon,
        desc: a.description
      }))
    },
    {
      id: 'goal',
      hint: 'We\'ll tailor the simulation to your primary objective.',
      title: 'Primary focus',
      layout: 'list',
      options: filteredGoals.map(g => ({
        value: g.id,
        label: g.label,
        icon: g.icon,
        desc: goalDescriptions[g.id] || ''
      }))
    },
    {
      id: 'sex',
      hint: 'This helps calibrate hormonal and metabolic baselines.',
      title: 'Biological sex',
      layout: 'row',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ]
    },
    {
      id: 'age',
      hint: 'Metabolism and recovery patterns shift with age.',
      title: 'Age range',
      layout: 'grid',
      options: [
        { value: '18-25', label: '18-25' },
        { value: '26-35', label: '26-35' },
        { value: '36-45', label: '36-45' },
        { value: '46-55', label: '46-55' },
        { value: '56+', label: '56+' },
      ]
    }
  ];
});

function isSelected(value: string) {
  if (currentQuestion.value === 0) return store.persona === value;
  if (currentQuestion.value === 1) return store.quickProfile.primaryGoal === value;
  if (currentQuestion.value === 2) return store.quickProfile.sex === value;
  if (currentQuestion.value === 3) return store.quickProfile.ageRange === value;
  return false;
}

function selectOption(value: string) {
  // Save to store
  if (currentQuestion.value === 0) {
    store.persona = value as ArchetypeId;
    // Auto-select female for cycle syncers if not set
    if (value === 'cycle_syncer') {
      store.quickProfile.sex = 'female';
      profilesStore.updateSubject({ sex: 'female' });
    }
  }
  if (currentQuestion.value === 1) {
    store.quickProfile.primaryGoal = value;
    // Ensure it's in the profile goals
    if (!profilesStore.selectedGoals.includes(value as any)) {
      profilesStore.toggleGoal(value as any);
    }
  }
  if (currentQuestion.value === 2) {
    store.quickProfile.sex = value as 'male' | 'female';
    profilesStore.updateSubject({ sex: value as 'male' | 'female' });
  }
  if (currentQuestion.value === 3) {
    store.quickProfile.ageRange = value;
    // Extract lower bound of age range as a simple numeric estimate
    const age = parseInt(value);
    if (!isNaN(age)) {
      profilesStore.updateSubject({ age });
    }
  }

  // Advance after brief delay for visual feedback
  setTimeout(() => {
    // Skip sex question if already determined by archetype
    if (currentQuestion.value === 1 && store.persona === 'cycle_syncer') {
      currentQuestion.value = 3; // Skip to Age
      return;
    }

    if (currentQuestion.value < questions.value.length - 1) {
      currentQuestion.value++;
    } else {
      emit('next');
    }
  }, 200);
}

function prevQuestion() {
  if (currentQuestion.value > 0) {
    // Handle skipping sex question backward
    if (currentQuestion.value === 3 && store.persona === 'cycle_syncer') {
      currentQuestion.value = 1;
    } else {
      currentQuestion.value--;
    }
  }
}
</script>

<style scoped>
@import './onboarding.css';

.profile {
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
}

.profile__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0, 212, 255, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 70% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%);
}

/* Progress */
.profile__progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
}

.profile__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #8b5cf6);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Back button */
.profile__back {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  color: #555570;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;
  z-index: 10;
}

.profile__back:hover {
  color: #f0f0f5;
}

/* Content */
.profile__content {
  width: 100%;
  max-width: 640px;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 1;
}

.profile__question {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* AI guidance */
.profile__ai {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.profile__ai-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #00d4ff;
}

.profile__ai-text {
  font-size: 0.9375rem;
  color: #8888a0;
  line-height: 1.5;
  margin: 0;
}

/* Title */
.profile__title {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #f0f0f5;
  margin: 0;
}

/* Options */
.profile__options {
  display: grid;
  gap: 0.625rem;
}

.profile__options--row {
  grid-template-columns: repeat(2, 1fr);
}

.profile__options--grid {
  grid-template-columns: repeat(3, 1fr);
}

.profile__options--list {
  grid-template-columns: 1fr;
}

.profile__option {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  color: inherit;
}

.profile__option:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
}

.profile__option.is-selected {
  background: rgba(0, 212, 255, 0.1);
  border-color: #00d4ff;
}

.profile__option-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.profile__option-content {
  flex: 1;
  min-width: 0;
}

.profile__option-label {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f0f0f5;
}

.profile__option-desc {
  display: block;
  font-size: 0.8125rem;
  color: #8888a0;
  margin-top: 0.25rem;
}

.profile__option-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #555570;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  color: transparent;
}

.profile__option.is-selected .profile__option-check {
  background: #00d4ff;
  border-color: #00d4ff;
  color: #050509;
}

/* Grid layout adjustments */
.profile__options--grid .profile__option,
.profile__options--row .profile__option {
  flex-direction: column;
  text-align: center;
  padding: 1.75rem 1rem;
}

.profile__options--grid .profile__option-check,
.profile__options--row .profile__option-check {
  display: none;
}

.profile__options--grid .profile__option.is-selected,
.profile__options--row .profile__option.is-selected {
  box-shadow: 0 0 0 1px #00d4ff, 0 0 20px rgba(0, 212, 255, 0.2);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Mobile */
@media (max-width: 480px) {
  .profile__options--grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile__title {
    font-size: 1.5rem;
  }
}
</style>
