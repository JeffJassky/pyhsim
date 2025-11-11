<template>
  <div class="profile-palette">
    <div v-for="profile in profiles" :key="profile.key" class="profile-card">
      <div class="profile-card__header">
        <div class="profile-card__title-bar">
          <h4>{{ profile.label }}</h4>
          <label class="switch">
            <input
              type="checkbox"
              :checked="state[profile.key].enabled"
              @change="toggle(profile.key, $event)"
            />
            <span class="slider" />
          </label>
        </div>
        <p>{{ profile.description.physiology }}</p>
      </div>
      <div
        v-if="state[profile.key].enabled && profile.params.length"
        class="profile-card__params"
      >
        <div
          v-for="param in profile.params"
          :key="param.key"
          class="profile-param"
        >
          <div class="profile-param__label">
            <span>{{ param.label }}</span>
            <span>{{ state[profile.key].params[param.key].toFixed(2) }}</span>
          </div>
          <input
            type="range"
            :min="param.min"
            :max="param.max"
            :step="param.step"
            :value="state[profile.key].params[param.key]"
            @input="update(profile.key, param.key, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PROFILE_LIBRARY } from '@/models';
import { useProfilesStore } from '@/stores/profiles';
import type { ProfileKey } from '@/models/profiles';

const profilesStore = useProfilesStore();
const profiles = PROFILE_LIBRARY;
const state = computed(() => profilesStore.profiles);

const toggle = (key: ProfileKey, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  profilesStore.toggleProfile(key, Boolean(target?.checked));
};

const update = (key: ProfileKey, paramKey: string, event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  profilesStore.updateParam(key, paramKey, Number(target.value));
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
