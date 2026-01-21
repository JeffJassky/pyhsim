<template>
  <div class="scenario-selector">
    <div class="scenario-list">
      <div
        v-for="(scenario, index) in scenarios.items"
        :key="scenario.id"
        class="scenario-item"
        :class="{ active: scenarios.activeId === scenario.id }"
        @click="scenarios.setActive(scenario.id)"
        v-tooltip="{
          content: `<strong>${scenario.name || 'Untitled'}</strong><br/><span style='color: var(--color-text-muted)'>${scenario.items.length} items</span>`,
          html: true,
          delay: { show: 500, hide: 0 }
        }"
      >
        <input
          v-if="editingId === scenario.id"
          ref="editInput"
          v-model="editName"
          class="scenario-input"
          @blur="saveEdit"
          @keydown.enter="saveEdit"
          @click.stop
        />
        <span v-else class="scenario-label" @dblclick="startEdit(scenario)">
          {{ scenario.name || `Scenario ${String.fromCharCode(65 + index)}` }}
        </span>
        <button
          v-if="scenarios.items.length > 1"
          class="remove-btn"
          @click.stop="scenarios.remove(scenario.id)"
          title="Remove scenario"
        >
          ×
        </button>
      </div>
      <button class="add-btn" @click="addNew" title="Add new scenario">
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useScenariosStore } from '@/stores/scenarios';
import type { Scenario } from '@/types';

const scenarios = useScenariosStore();
const editingId = ref<string | null>(null);
const editName = ref('');
const editInput = ref<HTMLInputElement | null>(null);

const startEdit = (scenario: Scenario) => {
  editingId.value = scenario.id;
  editName.value = scenario.name;
  nextTick(() => {
    editInput.value?.focus();
    editInput.value?.select();
  });
};

const saveEdit = () => {
  if (editingId.value && editName.value.trim()) {
    scenarios.update(editingId.value, { name: editName.value.trim() });
  }
  editingId.value = null;
};

const addNew = () => {
  const nextLetter = String.fromCharCode(65 + scenarios.items.length);
  scenarios.create({ name: `Scenario ${nextLetter}` });
};
</script>

<style scoped>
.scenario-selector {
  display: flex;
  align-items: flex-end;
  height: 44px; /* Match header height */
  margin-bottom: -1px; /* Align with header border */
}

.scenario-list {
  display: flex;
  background: transparent;
  border-radius: 0;
  padding: 0;
  gap: 4px;
  border: none;
}

.scenario-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
  border: 1px solid var(--color-border-subtle);
  border-bottom: none;
  background: var(--color-bg-subtle);
  max-width: 140px;
}

.scenario-item:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.scenario-item.active {
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  box-shadow: none;
  border-color: var(--color-border-default);
  border-width: 1px 1px 0 1px;
  padding-bottom: 7px; /* Cover the header border */
  margin-bottom: -1px;
  z-index: 1;
}

.scenario-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.scenario-input {
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  width: 100%;
  padding: 0;
  outline: none;
}

.add-btn {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-bottom: none;
  color: var(--color-text-muted);
  padding: 0 10px;
  cursor: pointer;
  font-size: 1.1rem;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
  align-self: stretch;
  display: flex;
  align-items: center;
}

.add-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.remove-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 0 2px;
  cursor: pointer;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
  line-height: 1;
  margin-left: 4px;
}

.scenario-item:hover .remove-btn {
  opacity: 0.6;
}

.remove-btn:hover {
  color: var(--color-danger);
  opacity: 1 !important;
}
</style>
