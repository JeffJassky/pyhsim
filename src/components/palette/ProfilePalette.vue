<template>
  <div class="profile-palette">
    <!-- Physiology Section -->
    <div class="profile-card">
      <div class="profile-card__header">
        <div class="profile-card__title-bar">
          <h4>My Physiology</h4>
        </div>
        <p>Set biological baselines for metabolism and hormones.</p>
      </div>
      <div class="profile-card__params">
        
        <!-- Biological Sex -->
        <div class="profile-param">
          <div class="profile-param__label">
            <span>Biological Sex</span>
            <span>{{ subject.sex }}</span>
          </div>
          <div class="profile-param__select-wrapper">
            <select :value="subject.sex" @change="updateSubject('sex', $event)">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <!-- Age -->
        <div class="profile-param">
          <div class="profile-param__label">
            <span>Age</span>
            <span>{{ subject.age }} yr</span>
          </div>
          <input
            type="range"
            min="18"
            max="90"
            step="1"
            :value="subject.age"
            @input="updateSubject('age', $event)"
          />
        </div>

        <!-- Weight -->
        <div class="profile-param">
          <div class="profile-param__label">
            <span>Weight</span>
            <span>{{ subject.weight }} kg</span>
          </div>
          <input
            type="range"
            min="40"
            max="150"
            step="1"
            :value="subject.weight"
            @input="updateSubject('weight', $event)"
          />
        </div>

        <!-- Female Cycle Params -->
        <template v-if="subject.sex === 'female'">
          <div class="profile-param">
            <div class="profile-param__label">
              <span>Cycle Length</span>
              <span>{{ subject.cycleLength }} days</span>
            </div>
            <input
              type="range"
              min="21"
              max="35"
              step="1"
              :value="subject.cycleLength"
              @input="updateSubject('cycleLength', $event)"
            />
          </div>
          <div class="profile-param">
            <div class="profile-param__label">
              <span>Current Day</span>
              <span>Day {{ subject.cycleDay }}</span>
            </div>
            <input
              type="range"
              min="0"
              :max="subject.cycleLength"
              step="1"
              :value="subject.cycleDay"
              @input="updateSubject('cycleDay', $event)"
            />
          </div>
        </template>

      </div>
    </div>

    <div v-for="condition in conditions" :key="condition.key" class="profile-card">
      <div class="profile-card__header">
        <div class="profile-card__title-bar">
          <h4>{{ condition.label }}</h4>
          <label class="switch">
            <input
              type="checkbox"
              :checked="state[condition.key].enabled"
              @change="toggle(condition.key, $event)"
            />
            <span class="slider" />
          </label>
        </div>
        <p>{{ condition.description.physiology }}</p>
      </div>
      <div
        v-if="state[condition.key].enabled && condition.params.length"
        class="profile-card__params"
      >
        <div
          v-for="param in condition.params"
          :key="param.key"
          class="profile-param"
        >
          <div class="profile-param__label">
            <span>{{ param.label }}</span>
            <span>{{ state[condition.key].params[param.key].toFixed(2) }}</span>
          </div>
          <input
            type="range"
            :min="param.min"
            :max="param.max"
            :step="param.step"
            :value="state[condition.key].params[param.key]"
            @input="update(condition.key, param.key, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CONDITION_LIBRARY } from '@/models';
import { useUserStore } from '@/stores/user';
import type { ConditionKey } from '@kyneticbio/core';
import type { Subject } from '@/types';

const userStore = useUserStore();
const conditions = CONDITION_LIBRARY;
const state = computed(() => userStore.conditions);
const subject = computed(() => userStore.subject);

const toggle = (key: ConditionKey, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  userStore.toggleCondition(key, Boolean(target?.checked));
};

const update = (key: ConditionKey, paramKey: string, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  userStore.updateParam(key, paramKey, Number(target.value));
};

const updateSubject = (key: keyof Subject, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement | null;
  if (!target) return;
  let value: string | number = target.value;
  if (key !== 'sex') {
    value = Number(value);
  }
  userStore.updateSubject({ [key]: value });
};
</script>

<style scoped>
.profile-palette {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 0.65rem;
  background: rgba(255, 255, 255, 0.03);
}

.profile-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.profile-card__title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.profile-card__header h4 {
  margin: 0;
  font-size: 0.95rem;
}

.profile-card__header p {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  opacity: 0.75;
}

.profile-card__params {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-param__label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
}

input[type='range'] {
  width: 100%;
}

.profile-param__select-wrapper select {
  width: 100%;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 0.85rem;
}

.switch {
  position: relative;
  display: inline-block;
  height: 20px;
  width: 40px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.25);
  transition: 0.2s;
  border-radius: 34px;
  width: 40px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4ade80;
}

input:checked + .slider:before {
  transform: translateX(16px);
}
</style>
