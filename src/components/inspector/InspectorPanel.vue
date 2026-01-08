<template>
  <div v-if="item && def" class="inspector">
    <div class="header-row">
      <h3>{{ def.label }}</h3>
      <span v-if="isFood" class="total-kcal">{{ totalKcal }} kcal</span>
    </div>
    <p>{{ def.notes }}</p>

    <div v-if="isFood" class="macro-breakdown">
      <div class="macro-bar">
        <div class="macro-segment protein" :style="{ width: macroPercentages.protein + '%' }" title="Protein"></div>
        <div class="macro-segment carbs" :style="{ width: macroPercentages.carbs + '%' }" title="Carbs"></div>
        <div class="macro-segment fat" :style="{ width: macroPercentages.fat + '%' }" title="Fat"></div>
      </div>
      <div class="macro-labels">
        <span class="macro-label protein">P: {{ macroPercentages.protein }}%</span>
        <span class="macro-label carbs">C: {{ macroPercentages.carbs }}%</span>
        <span class="macro-label fat">F: {{ macroPercentages.fat }}%</span>
      </div>
    </div>

    <IntensityControl
      :value="local.intensity"
      @update:value="updateIntensity"
    />
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
        <p class="effect-desc">{{ spec?.desc }}</p>
      </div>
    </div>
  </div>
  <p v-else class="empty">Select an item to edit parameters.</p>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { InterventionDef, ParamValues, TimelineItem } from '@/types';
import IntensityControl from './IntensityControl.vue';
import ParamEditor from './ParamEditor.vue';
import { KCAL_PER_GRAM_CARB, KCAL_PER_GRAM_FAT, KCAL_PER_GRAM_PROTEIN } from '@/models/constants/nutrients';

const props = defineProps<{ item?: TimelineItem; def?: InterventionDef; readonly?: boolean }>();
const emit = defineEmits<{ change: [TimelineItem] }>();

const local = reactive<{ params: ParamValues; intensity: number }>({
  params: {} as ParamValues,
  intensity: 1,
});

const isFood = computed(() => props.def?.key === 'food');

const totalKcal = computed(() => {
  if (!isFood.value) return 0;
  const p = Number(local.params.protein || 0);
  const f = Number(local.params.fat || 0);
  const c = Number(local.params.carbSugar || 0) + Number(local.params.carbStarch || 0);
  return Math.round(p * KCAL_PER_GRAM_PROTEIN + f * KCAL_PER_GRAM_FAT + c * KCAL_PER_GRAM_CARB);
});

const macroPercentages = computed(() => {
  if (!isFood.value) return { protein: 0, carbs: 0, fat: 0 };
  const pKcal = Number(local.params.protein || 0) * KCAL_PER_GRAM_PROTEIN;
  const fKcal = Number(local.params.fat || 0) * KCAL_PER_GRAM_FAT;
  const cKcal = (Number(local.params.carbSugar || 0) + Number(local.params.carbStarch || 0)) * KCAL_PER_GRAM_CARB;
  const total = pKcal + fKcal + cKcal;
  
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
  
  return {
    protein: Math.round((pKcal / total) * 100),
    carbs: Math.round((cKcal / total) * 100),
    fat: Math.round((fKcal / total) * 100),
  };
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

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.total-kcal {
  font-weight: 700;
  color: #8fbf5f;
  font-size: 1.1rem;
}

.macro-breakdown {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.macro-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 0.5rem;
}

.macro-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.macro-segment.protein { background: #22c55e; }
.macro-segment.carbs { background: #38bdf8; }
.macro-segment.fat { background: #fbbf24; }

.macro-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
}

.macro-label.protein { color: #22c55e; }
.macro-label.carbs { color: #38bdf8; }
.macro-label.fat { color: #fbbf24; }

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
