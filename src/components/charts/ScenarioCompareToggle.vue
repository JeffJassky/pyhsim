<template>
  <div class="compare">
    <label>
      Mode
      <select :value="mode" @change="onMode">
        <option value="overlay">Overlay</option>
        <option value="side">Side-by-side</option>
      </select>
    </label>
    <label>
      Opacity
      <input type="range" min="0" max="1" step="0.05" :value="opacity" @input="onOpacity" />
    </label>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ mode: 'overlay' | 'side'; opacity: number }>();
const emit = defineEmits<{ 'update:mode': ['overlay' | 'side']; 'update:opacity': [number] }>();
const onMode = (event: Event) => emit('update:mode', (event.target as HTMLSelectElement).value as 'overlay' | 'side');
const onOpacity = (event: Event) => emit('update:opacity', Number((event.target as HTMLInputElement).value));
</script>

<style scoped>
.compare {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
