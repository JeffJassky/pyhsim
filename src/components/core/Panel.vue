<template>
  <section class="panel" :class="{ 'panel--collapsible': collapsible }">
    <header class="panel__header">
      <div class="panel__title">
        <slot name="icon"><span v-if="icon">{{ icon }}</span></slot>
        <h3>{{ title }}</h3>
      </div>
      <div class="panel__toolbar">
        <slot name="toolbar" />
        <button v-if="collapsible" @click="toggle" class="ghost">⟲</button>
      </div>
    </header>
    <div class="panel__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string; icon?: string; collapsible?: boolean }>();
const emit = defineEmits<{ toggle: [] }>();
const toggle = () => emit('toggle');
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.8;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

button.ghost {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
