<template>
  <input
    class="search"
    type="search"
    :value="modelValue"
    placeholder="Search"
    @input="onInput"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();
const onInput = (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value);
</script>

<style scoped>
.search {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
}
</style>
