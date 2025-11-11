<template>
  <section class="scenarios">
    <header>
      <div>
        <h2>Scenarios</h2>
        <p>Save/load day blueprints, export JSON, or import from file.</p>
      </div>
      <div class="controls">
        <input v-model="name" placeholder="Scenario name" />
        <button @click="handleSave">Save snapshot</button>
        <label class="import">
          <input type="file" accept="application/json" @change="handleImport" />
          Import JSON
        </label>
      </div>
    </header>

    <table v-if="list.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Items</th>
          <th>Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="scenario in list" :key="scenario.id">
          <td>{{ scenario.name }}</td>
          <td>{{ scenario.items.length }}</td>
          <td>{{ formatDate(scenario.updatedAt) }}</td>
          <td class="row-actions">
            <button @click="loadScenario(scenario.id)">Load</button>
            <button @click="handleExport(scenario.id)">Export</button>
            <button class="ghost" @click="handleDelete(scenario.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="empty">No saved scenarios yet. Save the current timeline to create one.</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UUID } from '@/types';
import { useScenarios } from '@/composables/useScenarios';

const { list, saveScenario, loadScenario, exportScenario, importScenario, removeScenario } = useScenarios();
const name = ref('');

const handleSave = () => {
  saveScenario(name.value || undefined);
  name.value = '';
};

const handleExport = (id: UUID) => {
  const json = exportScenario(id);
  if (!json) return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const scenario = list.value.find((s) => s.id === id);
  anchor.download = `${scenario?.name || 'scenario'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const handleImport = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  importScenario(text);
  input.value = '';
};

const handleDelete = (id: UUID) => {
  removeScenario(id);
};

const formatDate = (iso: string) => new Date(iso).toLocaleString();
</script>

<style scoped>
.scenarios {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

input {
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  color: inherit;
  cursor: pointer;
}

button.ghost {
  border-color: rgba(255, 255, 255, 0.15);
  opacity: 0.8;
}

label.import {
  cursor: pointer;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
}

label.import input {
  display: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.row-actions {
  display: flex;
  gap: 0.4rem;
}

.empty {
  opacity: 0.6;
}
</style>
