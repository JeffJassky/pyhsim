<template>
  <div v-if="item && def" class="inspector">
    <h3>{{ def.label }}</h3>
    <p>{{ def.notes }}</p>
    <IntensityControl :value="local.intensity" @update:value="updateIntensity" />
    <ParamEditor
      v-for="param in def.params"
      :key="param.key"
      :param-def="param"
      :value="local.params[param.key] ?? param.default"
      @update="(val) => updateParam(param.key, val)"
    />

    <div v-if="Object.keys(def.kernels).length" class="effects">
      <h4>Biological Effects</h4>
      <div v-for="(spec, signal) in def.kernels" :key="signal" class="effect">
        <span class="effect-signal">{{ signal }}</span>
        <p class="effect-desc">{{ spec.desc }}</p>
      </div>
    </div>
  </div>
  <p v-else class="empty">Select an item to edit parameters.</p>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { InterventionDef, ParamValues, TimelineItem } from '@/types';
import IntensityControl from './IntensityControl.vue';
import ParamEditor from './ParamEditor.vue';
import { SIGNALS_ALL } from '@/types';

const props = defineProps<{ item?: TimelineItem; def?: InterventionDef; readonly?: boolean }>();
const emit = defineEmits<{ change: [TimelineItem] }>();

const local = reactive<{ params: ParamValues; intensity: number }>({
  params: {} as ParamValues,
  intensity: 1,
});

watch(
  () => props.item,
  (item) => {
    if (!item) return;
    local.params = { ...(item.meta.params as ParamValues) };
    local.intensity = item.meta.intensity;
  },
  { immediate: true }
);

const pushChange = () => {
  if (!props.item) return;
  emit('change', {
    ...props.item,
    meta: {
      ...props.item.meta,
      params: { ...local.params },
      intensity: local.intensity,
    },
  });
};

const updateParam = (key: string, value: string | number | boolean) => {
  local.params = { ...local.params, [key]: value };
  pushChange();
};

const updateIntensity = (value: number) => {
  local.intensity = value;
  pushChange();
};
</script>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty {
  opacity: 0.6;
}

.effects {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

h4 {
  font-size: 0.75rem;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
  opacity: 0.6;
  letter-spacing: 0.05em;
}

.effect {
  margin-bottom: 0.75rem;
}

.effect-signal {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #a78bfa;
}

.effect-desc {
  margin: 0.1rem 0 0;
  font-size: 0.85rem;
  line-height: 1.3;
  opacity: 0.85;
}
</style>
