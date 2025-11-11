<template>
  <div class="chips">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="{ active: modelValue.includes(option.value) }"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ options: Array<{ label: string; value: string }>; modelValue: string[] }>(),
  { modelValue: () => [] }
);
const emit = defineEmits<{ 'update:modelValue': [string[]] }>();

const toggle = (value: string) => {
  const next = props.modelValue.includes(value)
    ? props.modelValue.filter((v) => v !== value)
    : [...props.modelValue, value];
  emit('update:modelValue', next);
};
</script>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: transparent;
  padding: 0.25rem 0.75rem;
  color: inherit;
  cursor: pointer;
}

button.active {
  background: rgba(255, 255, 255, 0.1);
}
</style>
