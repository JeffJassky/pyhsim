<template>
  <div v-if="item && def" class="inspector">
    <div class="header-row">
      <h3>{{ displayTitle }}</h3>
      <span v-if="isFood" class="total-kcal">{{ totalKcal }} kcal</span>
    </div>
    <p v-if="def.notes" class="def-notes">{{ def.notes }}</p>

    <!-- Title field -->
    <div class="field">
      <label class="field-label">Title</label>
      <input
        type="text"
        class="field-input"
        :placeholder="def.label"
        :value="local.labelOverride"
        @input="updateLabelOverride(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Time field -->
    <div class="field">
      <label class="field-label">Time</label>
      <input
        type="text"
        class="field-input"
        :value="timeDisplay"
        :placeholder="'e.g. 2:30pm, 14:30'"
        @blur="handleTimeBlur"
        @keydown.enter="($event.target as HTMLInputElement).blur()"
      />
    </div>

    <!-- Duration field (for continuous/infusion delivery types) -->
    <div v-if="showDurationField" class="field">
      <label class="field-label">Duration (minutes)</label>
      <input
        type="number"
        class="field-input"
        :value="durationMinutes"
        min="5"
        step="5"
        @input="updateDuration(Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- User notes -->
    <div class="field">
      <label class="field-label">Notes</label>
      <textarea
        class="field-textarea"
        :value="local.notes"
        placeholder="Add your own notes about this item..."
        rows="2"
        @input="updateNotes(($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <div v-if="isFood" class="macro-breakdown">
      <div class="macro-bar">
        <div
          class="macro-segment protein"
          :style="{ width: macroPercentages.protein + '%' }"
          title="Protein"
        ></div>
        <div
          class="macro-segment carbs"
          :style="{ width: macroPercentages.carbs + '%' }"
          title="Carbs"
        ></div>
        <div
          class="macro-segment fat"
          :style="{ width: macroPercentages.fat + '%' }"
          title="Fat"
        ></div>
      </div>
      <div class="macro-labels">
        <span class="macro-label protein"
          >P: {{ macroPercentages.protein }}%</span
        >
        <span class="macro-label carbs">C: {{ macroPercentages.carbs }}%</span>
        <span class="macro-label fat">F: {{ macroPercentages.fat }}%</span>
      </div>
    </div>

    <ParamEditor
      v-for="param in def.params"
      :key="param.key"
      :param-def="param"
      :value="local.params[param.key] ?? param.default"
      @update="(val) => updateParam(param.key, val)"
    />

    <div v-if="resolvedEffects.length" class="effects-section">
      <button
        v-if="!showEffects"
        class="effects-toggle-btn"
        @click="showEffects = true"
      >
        Read about {{ displayTitle }}
      </button>

      <div v-if="showEffects" class="effects">
        <div class="effects-header">
          <h4>Biological Effects</h4>
          <button class="effects-collapse-btn" @click="showEffects = false">
            Hide
          </button>
        </div>
        <div
          v-for="(effect, index) in resolvedEffects"
          :key="index"
          class="effect"
        >
          <span
            class="effect-signal"
            >{{ getTargetLabel(effect.target as any) }}</span
          >
          <p class="effect-desc">
            {{ effect.mechanism }}
            <template v-if="effect.intrinsicEfficacy">
              <span class="gain-value">
                ({{ effect.intrinsicEfficacy > 0 ? '+' : ''

                }}{{ (effect.intrinsicEfficacy * (UNIT_CONVERSIONS[effect.target as Signal]?.scaleFactor || 1)).toFixed(1) }}
                {{ SIGNAL_UNITS[effect.target as Signal]?.unit || '' }})
              </span>
            </template>
          </p>
          <p v-if="effect.description || getTargetDescription(effect.target as any)" class="effect-help">
            {{ effect.description || getTargetDescription(effect.target as any) }}
          </p>
        </div>
      </div>
    </div>
  </div>
  <p v-else class="empty">Select an item to edit parameters.</p>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import moment from 'moment';
import type { InterventionDef, ParamValues, TimelineItem, Signal, PharmacologyDef } from '@/types';
import ParamEditor from './ParamEditor.vue';
import { KCAL_PER_GRAM_CARB, KCAL_PER_GRAM_FAT, KCAL_PER_GRAM_PROTEIN } from '@/models/physiology/constants/nutrients';
import { UNIT_CONVERSIONS, SIGNAL_UNITS } from '@/models/engine/signal-units';
import { getTargetDescription, getTargetLabel } from '@/models/physiology/pharmacology/registry';

const props = defineProps<{ item?: TimelineItem; def?: InterventionDef; readonly?: boolean }>();
const emit = defineEmits<{ change: [TimelineItem] }>();

const showEffects = ref(false);

const local = reactive<{
  params: ParamValues;
  labelOverride: string;
  notes: string;
}>({
  params: {} as ParamValues,
  labelOverride: '',
  notes: '',
});

const isFood = computed(() => props.def?.key === 'food');

const resolvedEffects = computed(() => {
  if (!props.def) return [];

  let pharms: PharmacologyDef[] = [];

  if (typeof props.def.pharmacology === 'function') {
    const result = (props.def.pharmacology as any)(local.params);
    pharms = Array.isArray(result) ? result : [result];
  } else {
    pharms = [props.def.pharmacology];
  }

  // Aggregate all PD effects from all agents
  return pharms.flatMap(p => p.pd || []);
});

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

// Display title - uses labelOverride if set, otherwise def label
const displayTitle = computed(() => local.labelOverride || props.def?.label || '');

// Time display - formatted from item start time
const timeDisplay = computed(() => {
  if (!props.item) return '';
  return moment(props.item.start).format('h:mm A');
});

// Duration in minutes - calculated from start/end
const durationMinutes = computed(() => {
  if (!props.item) return 0;
  const start = moment(props.item.start);
  const end = moment(props.item.end);
  let duration = end.diff(start, 'minutes');
  if (duration < 0) duration += 24 * 60; // Handle day wrap
  return duration;
});

// Get the delivery type from pharmacology
const deliveryType = computed(() => {
  if (!props.def) return null;

  let pharms: PharmacologyDef[] = [];
  if (typeof props.def.pharmacology === 'function') {
    const result = (props.def.pharmacology as any)(local.params);
    pharms = Array.isArray(result) ? result : [result];
  } else {
    pharms = [props.def.pharmacology];
  }

  // Get delivery type from first pharmacology def that has pk
  for (const pharm of pharms) {
    if (pharm.pk?.delivery) {
      return pharm.pk.delivery;
    }
  }
  return null;
});

// Show duration field for continuous or infusion delivery types
const showDurationField = computed(() => {
  const delivery = deliveryType.value;
  return delivery === 'continuous' || delivery === 'infusion';
});

watch(
  () => props.item,
  (item) => {
    if (!item) return;
    local.params = { ...(item.meta.params as ParamValues) };
    local.labelOverride = item.meta.labelOverride || '';
    local.notes = item.meta.notes || '';
  },
  { immediate: true }
);

const pushChange = (overrides: Partial<TimelineItem> = {}) => {
  if (!props.item) return;
  emit('change', {
    ...props.item,
    ...overrides,
    meta: {
      ...props.item.meta,
      params: { ...local.params },
      labelOverride: local.labelOverride || undefined,
      notes: local.notes || undefined,
      ...(overrides.meta || {}),
    },
  });
};

const updateParam = (key: string, value: string | number | boolean) => {
  local.params = { ...local.params, [key]: value };
  pushChange();
};

const updateLabelOverride = (value: string) => {
  local.labelOverride = value;
  pushChange();
};

const updateNotes = (value: string) => {
  local.notes = value;
  pushChange();
};

// Parse time input with natural language support
const parseTimeInput = (input: string): moment.Moment | null => {
  if (!props.item) return null;

  const baseDate = moment(props.item.start).startOf('day');

  // Try various formats
  const formats = [
    'h:mm A',      // 2:30 PM
    'h:mmA',       // 2:30PM
    'h:mm a',      // 2:30 pm
    'h:mma',       // 2:30pm
    'H:mm',        // 14:30
    'HH:mm',       // 14:30
    'h A',         // 2 PM
    'hA',          // 2PM
    'h a',         // 2 pm
    'ha',          // 2pm
  ];

  // Try parsing with each format
  for (const format of formats) {
    const parsed = moment(input, format, true);
    if (parsed.isValid()) {
      return baseDate.clone().set({
        hour: parsed.hour(),
        minute: parsed.minute(),
      });
    }
  }

  // Try parsing more loosely
  const loose = moment(input, formats, false);
  if (loose.isValid()) {
    return baseDate.clone().set({
      hour: loose.hour(),
      minute: loose.minute(),
    });
  }

  return null;
};

const handleTimeBlur = (event: Event) => {
  const input = (event.target as HTMLInputElement).value;
  const parsed = parseTimeInput(input);

  if (parsed && props.item) {
    const currentDuration = durationMinutes.value;
    const newStart = parsed.toISOString();
    const newEnd = parsed.clone().add(currentDuration, 'minutes').toISOString();

    pushChange({ start: newStart, end: newEnd });
  }
};

const updateDuration = (minutes: number) => {
  if (!props.item || minutes < 5) return;

  // Snap to 5-minute increments
  const snapped = Math.round(minutes / 5) * 5;
  const start = moment(props.item.start);
  const newEnd = start.clone().add(snapped, 'minutes').toISOString();

  pushChange({ end: newEnd });
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

.effect-help {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  opacity: 0.7;
  color: #d1d5db;
  font-style: italic;
}

.effects-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.effects-toggle-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  background: rgba(167, 139, 250, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 8px;
  color: #a78bfa;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.effects-toggle-btn:hover {
  background: rgba(167, 139, 250, 0.2);
  border-color: rgba(167, 139, 250, 0.5);
}

.effects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.effects-header h4 {
  margin: 0;
}

.effects-collapse-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.effects-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.def-notes {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0;
  line-height: 1.4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.field-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.field-input:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-accent, #a78bfa);
  background: rgba(255, 255, 255, 0.08);
}

.field-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.field-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  color: inherit;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.field-textarea:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.field-textarea:focus {
  outline: none;
  border-color: var(--color-accent, #a78bfa);
  background: rgba(255, 255, 255, 0.08);
}

.field-textarea::placeholder {
  color: rgba(255, 255, 255, 0.35);
}
</style>
