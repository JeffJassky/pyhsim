<template>
  <transition name="float-fade">
    <aside v-if="visible" class="floating-inspector">
      <Panel title="Inspector" icon="🛠">
        <InspectorPanel
          :item="item"
          :def="def"
          :readonly="readonly"
          @change="$emit('change', $event)"
        />
      </Panel>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import Panel from '@/components/core/Panel.vue';
import InspectorPanel from '@/components/inspector/InspectorPanel.vue';
import type { InterventionDef, TimelineItem } from '@/types';

defineProps<{
  visible: boolean;
  item?: TimelineItem;
  def?: InterventionDef;
  readonly?: boolean;
}>();

defineEmits<{ change: [TimelineItem] }>();
</script>

<style scoped>
.floating-inspector {
  position: fixed;
  top: 64px;
  right: 24px;
  width: 340px;
  max-width: calc(100% - 32px);
  z-index: 30;
  background: rgba(5, 5, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 1em;
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
