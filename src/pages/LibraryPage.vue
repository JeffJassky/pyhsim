<template>
  <section class="library">
    <header>
      <h2>Intervention Library</h2>
      <button @click="reset">Reset</button>
    </header>
    <table>
      <thead>
        <tr>
          <th>Label</th>
          <th>Group</th>
          <th>Params</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="def in library.defs" :key="def.key">
          <td>{{ def.label }}</td>
          <td>{{ def.group }}</td>
          <td>{{ def.params.length }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { useLibraryStore } from '@/stores/library';
import { INTERVENTIONS } from '@/models';

const library = useLibraryStore();
const reset = () => (library.defs = [...INTERVENTIONS]);
</script>

<style scoped>
.library {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
