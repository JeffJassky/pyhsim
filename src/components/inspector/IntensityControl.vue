<template>
  <div class="intensity">
    <label>Intensity {{ (value * 100).toFixed(0) }}%</label>
    <input type="range" min="0" max="1" step="0.05" :value="value" @input="onInput" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ value: number }>();
const emit = defineEmits<{ 'update:value': [number] }>();
const onInput = (event: Event) => emit('update:value', Number((event.target as HTMLInputElement).value));
</script>

<style scoped>
.intensity {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
