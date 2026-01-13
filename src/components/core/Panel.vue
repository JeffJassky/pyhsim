<template>
  <section
    class="panel"
    :class="{ 'panel--collapsible': collapsible, 'panel--collapsed': isCollapsed }"
  >
    <header class="panel__header" v-if="title" @click="collapsible && toggle()">
      <div class="panel__title">
        <span v-if="icon" class="panel__icon">{{ icon }}</span>
        <slot name="icon"></slot>
        <h3>{{ title }}</h3>
      </div>
      <div class="panel__toolbar">
        <slot name="toolbar" />
        <button
          v-if="collapsible"
          @click.stop="toggle"
          class="ghost panel__toggle"
        >
          {{ isCollapsed ? '▼' : '▲' }}
        </button>
      </div>
    </header>
    <Transition name="collapse">
      <div v-show="!isCollapsed" class="panel__body">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title?: string;
  icon?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}>();

const emit = defineEmits<{ toggle: [collapsed: boolean] }>();

const isCollapsed = ref(props.defaultCollapsed ?? false);

const toggle = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('toggle', isCollapsed.value);
};
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel--collapsible .panel__header {
  cursor: pointer;
  user-select: none;
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
  h3{
	margin-top: 0;
  }
}

.panel__icon {
  font-size: 1.1em;
}

.panel__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel__toggle {
  font-size: 0.7rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.panel__toggle:hover {
  opacity: 1;
}

button.ghost {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
