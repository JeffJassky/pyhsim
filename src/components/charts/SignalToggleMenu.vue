<template>
  <div class="signal-menu">
    <div class="signal-menu__header">
      <div class="search-wrapper">
        <svg
          class="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Find signal..."
          class="search-input"
          @click.stop
        />
      </div>
    </div>

    <div class="signal-menu__list">
      <div
        v-for="sig in filteredSignals"
        :key="sig.key"
        class="signal-item"
        @click="userStore.toggleSignal(sig.key, !userStore.enabledSignals[sig.key])"
      >
        <div class="signal-item__info">
          <div class="signal-item__label">
            {{ sig.label }}
            <span
              v-if="sig.isPremium && userStore.subscriptionTier !== 'premium'"
              class="premium-tag"
              title="Premium Feature"
            >
              premium
            </span>
          </div>
          <div class="signal-item__group">{{ sig.group }}</div>
        </div>
        <label class="switch" @click.stop>
          <input
            type="checkbox"
            :checked="userStore.enabledSignals[sig.key]"
            @change="userStore.toggleSignal(sig.key, ($event.target as HTMLInputElement).checked)"
          />
          <span class="slider" />
        </label>
      </div>

      <div v-if="filteredSignals.length === 0" class="empty-state">
        No signals found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { getAllUnifiedDefinitions } from '@/models/engine';
import { BIOLOGICAL_SYSTEMS } from '@/models/physiology/systems';
import type { Signal } from '@/types';

const userStore = useUserStore();
const searchQuery = ref('');
const UNIFIED_DEFS = getAllUnifiedDefinitions();

// Helper to find group name for a signal
const getSystemName = (sigKey: string) => {
  const sys = BIOLOGICAL_SYSTEMS.find(s => s.signals.includes(sigKey as Signal));
  return sys?.label ?? 'Other';
};

const allSignals = computed(() => {
  return Object.values(UNIFIED_DEFS).map(def => ({
    key: def.key,
    label: def.label,
    isPremium: def.isPremium,
    group: getSystemName(def.key)
  })).sort((a, b) => a.label.localeCompare(b.label));
});

const filteredSignals = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return allSignals.value;
  return allSignals.value.filter(s =>
    s.label.toLowerCase().includes(q) ||
    s.group.toLowerCase().includes(q)
  );
});
</script>

<style scoped>
.signal-menu {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  width: 320px;
  max-height: 400px;
  overflow: hidden;
  z-index: 100;
}

.signal-menu__header {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-subtle);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 0.5rem 0.5rem 0.5rem 2.25rem;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--color-active);
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--color-active-rgb), 0.1);
}

.signal-menu__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.signal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  gap: 0.75rem;
  transition: background 0.1s;
  cursor: pointer;
}

.signal-item:hover {
  background: var(--color-bg-subtle);
}

.signal-item__info {
  flex: 1;
  min-width: 0;
}

.signal-item__label {
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.signal-item__group {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.premium-tag {
  display: inline-flex;
  text-transform: uppercase;
  align-items: center;
  gap: 0.2rem;
  background: linear-gradient(120deg, var(--amber-400), var(--amber-600));
  color: var(--neutral-900);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 800;
  text-shadow: none;
  margin-left: 0.4rem;
  vertical-align: middle;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Switch Component - reusing matching styles */
.switch {
  position: relative;
  display: inline-block;
  height: 20px;
  width: 36px;
  flex-shrink: 0;
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
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
  transition: 0.2s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: var(--color-text-muted);
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-success);
  border-color: var(--color-success);
}

input:checked + .slider:before {
  transform: translateX(16px);
  background-color: white;
}
</style>
