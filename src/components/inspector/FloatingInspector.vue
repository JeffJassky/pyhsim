<template>
  <transition name="float-fade">
    <aside v-if="visible" ref="inspectorEl" class="floating-inspector">
      <Panel>
        <InspectorPanel
          :item="item"
          :def="def"
          :readonly="readonly"
          :selected-count="selectedCount"
          :selected-items="selectedItems"
          @change="$emit('change', $event)"
          @bulk-change="$emit('bulkChange', $event)"
        />
      </Panel>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Panel from '@/components/core/Panel.vue';
import InspectorPanel from '@/components/inspector/InspectorPanel.vue';
import type { InterventionDef, TimelineItem } from '@/types';

const props = defineProps<{
  visible: boolean;
  item?: TimelineItem;
  def?: InterventionDef;
  readonly?: boolean;
  selectedCount?: number;
  selectedItems?: TimelineItem[];
}>();

const emit = defineEmits<{ change: [TimelineItem]; bulkChange: [TimelineItem[]]; close: [] }>();

const inspectorEl = ref<HTMLElement | null>(null);

const handlePointerDown = (event: PointerEvent) => {
  if (!props.visible) return;
  const root = inspectorEl.value;
  if (!root) return;
  const target = event.target instanceof Node ? event.target : null;
  if (target && root.contains(target)) return;
  emit('close');
};

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown);
});
</script>

<style scoped>
.floating-inspector {
  position: absolute;
  top: 64px;
  right: 24px;
  width: 340px;
  max-width: calc(100% - 32px);
  z-index: 30;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  box-shadow: var(--shadow-large);
  backdrop-filter: blur(15px);
  overflow: auto;
  max-height: calc(100vh - 260px);
  color: var(--color-text-primary);
}

.floating-inspector :deep(.panel__body) {

  padding: 1.25rem;
}

.float-fade-enter-active,
.float-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.float-fade-enter-from,
.float-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
