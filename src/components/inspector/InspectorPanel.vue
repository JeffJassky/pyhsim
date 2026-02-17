<template>
  <div
    v-if="props.selectedCount && props.selectedCount > 0"
    class="inspector"
    :class="{ 'inspector--disabled': isBulkDisabled }"
  >
    <!-- Shared Header with Toggle -->
    <div class="header-row">
      <div v-if="props.selectedCount > 1" class="multi-title">
        <h3>{{ props.selectedCount }} items selected</h3>
      </div>
      <div v-else-if="item && def" class="title-with-toggle">
        <input
          type="text"
          class="title-input seamless-input"
          :class="{ 'is-disabled': local.disabled }"
          :placeholder="def.label"
          :value="local.labelOverride"
          @input="updateLabelOverride(($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="header-actions">
        <span
          v-if="props.selectedCount === 1 && isFood"
          class="total-kcal"
          :class="{ 'is-disabled': local.disabled }"
        >
          {{ totalKcal }} kcal
        </span>
        <label
          class="switch-container"
          v-tooltip="isBulkDisabled ? `Enable ${props.selectedCount} items` : `Disable ${props.selectedCount} items`"
        >
          <input
            type="checkbox"
            :checked="!isBulkDisabled"
            @change="updateDisabled(!($event.target as HTMLInputElement).checked)"
          />
          <span class="switch-slider"></span>
        </label>
      </div>
    </div>

    <!-- Multi-select body -->
    <div v-if="props.selectedCount > 1" class="multi-select-summary">
      <div class="summary-icon"></div>
      <p>Select a single item to edit its parameters.</p>
    </div>

    <!-- Single-select body -->
    <div v-else-if="item && def" class="inspector-body">
      <h3 v-if="local.labelOverride" class="normal-title">{{ def.label }}</h3>
      <p v-if="def.notes" class="def-notes selectable">{{ def.notes }}</p>

      <!-- Meta row for Time and Duration -->
      <div class="meta-section">
        <div class="meta-field">
          <label class="meta-label">Time</label>
          <input
            type="text"
            class="seamless-input meta-input mono"
            :value="timeDisplay"
            :placeholder="'e.g. 2:30pm'"
            @blur="handleTimeBlur"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
        </div>
        <div v-if="showDurationField" class="meta-field">
          <label class="meta-label">Duration</label>
          <div class="duration-control">
            <input
              type="number"
              class="seamless-input meta-input mono duration-input"
              :value="durationMinutes"
              min="5"
              step="5"
              @input="updateDuration(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="meta-unit">min</span>
          </div>
        </div>
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
          <span class="macro-label carbs"
            >C: {{ macroPercentages.carbs }}%</span
          >
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

      <!-- User notes -->
      <div class="notes-field">
        <label v-if="local.notes" class="notes-label">My Notes</label>
        <textarea
          ref="notesTextarea"
          class="seamless-input notes-textarea"
          :value="local.notes"
          placeholder="Add notes..."
          rows="1"
          @input="updateNotes(($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div v-if="resolvedEffects.length" class="effects-section">
        <button
          v-if="!showEffects"
          class="effects-toggle-btn"
          @click="showEffects = true"
        >
          Read about {{ props.def?.label }}
        </button>

        <div v-if="showEffects" class="effects selectable">
          <div class="effects-header">
            <h4>Biological Effects of {{ props.def?.label }}</h4>
            <button class="effects-collapse-btn" @click="showEffects = false">
              Hide
            </button>
          </div>
          <div
            v-for="(effect, index) in resolvedEffects"
            :key="index"
            class="effect"
          >
            <span class="effect-signal">
              {{ getTargetLabel(effect.target as any) }}
            </span>
            <span v-if="effect.intrinsicEfficacy" class="gain-value">
              {{ 
				((effect.mechanism === 'antagonist' || effect.mechanism === 'NAM' ? -1 : 1) * effect.intrinsicEfficacy > 0 ? '+' : '') +
	(((effect.mechanism === 'antagonist' || effect.mechanism === 'NAM' ? -1 : 1) * effect.intrinsicEfficacy * (UNIT_CONVERSIONS[effect.target as Signal]?.scaleFactor || 1)).toFixed(1))
              }}
              <span class="gain-unit">
                {{ SIGNAL_UNITS[effect.target as Signal]?.unit || '' }}
              </span>
            </span>
            <p
              v-if="effect.description || getTargetDescription(effect.target as any)"
              class="effect-help"
            >
              {{ effect.description || getTargetDescription(effect.target as any) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <!-- Close inspector-body -->
  </div>
  <p v-else class="empty">Select an item to edit parameters.</p>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue';
import moment from 'moment';
import type { InterventionDef, ParamValues, TimelineItem, PharmacologyDef } from '@/types';
import type { Signal } from '@kyneticbio/core';
import ParamEditor from './ParamEditor.vue';
const KCAL_PER_GRAM_CARB = 4;
const KCAL_PER_GRAM_PROTEIN = 4;
const KCAL_PER_GRAM_FAT = 9;
import { UNIT_CONVERSIONS, SIGNAL_UNITS } from '@kyneticbio/core';
import { getTargetDescription, getTargetLabel } from '@kyneticbio/core';

const props = defineProps<{
  item?: TimelineItem;
  def?: InterventionDef;
  readonly?: boolean;
  selectedCount?: number;
  selectedItems?: TimelineItem[];
}>();
const emit = defineEmits<{ change: [TimelineItem]; bulkChange: [TimelineItem[]] }>();

const showEffects = ref(false);
const notesTextarea = ref<HTMLTextAreaElement | null>(null);

const local = reactive<{
  params: ParamValues;
  labelOverride: string;
  notes: string;
  disabled: boolean;
}>({
  params: {} as ParamValues,
  labelOverride: '',
  notes: '',
  disabled: false,
});

const isBulkDisabled = computed(() => {
  if (props.selectedItems && props.selectedItems.length > 1) {
    return props.selectedItems.every(i => i.meta.disabled);
  }
  return local.disabled;
});

const isFood = computed(() => props.def?.key === 'food');

const adjustNotesHeight = () => {
  if (notesTextarea.value) {
    notesTextarea.value.style.height = 'auto';
    notesTextarea.value.style.height = notesTextarea.value.scrollHeight + 'px';
  }
};

watch(() => local.notes, () => {
  nextTick(adjustNotesHeight);
});

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
  return (pharms as any[]).flatMap(p => p.pd || []);
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
    local.disabled = item.meta.disabled || false;
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
      disabled: local.disabled || undefined,
      ...(overrides.meta || {}),
    },
  });
};

const updateParam = (key: string, value: string | number | boolean) => {
  local.params = { ...local.params, [key]: value };
  pushChange();
};

const updateDisabled = (disabled: boolean) => {
  if (props.selectedItems && props.selectedItems.length > 1) {
    const updated = props.selectedItems.map(item => ({
      ...item,
      meta: { ...item.meta, disabled: disabled || undefined }
    }));
    emit('bulkChange', updated);
  } else {
    local.disabled = disabled;
    pushChange();
  }
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
  padding: 4px; /* Give room for outlines */
  overflow: visible;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.title-with-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.multi-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Switch Styling */
.switch-container {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 16px;
  flex-shrink: 0;
}

.switch-container input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-warning);
  transition: .2s;
  border-radius: 20px;
  border: 1px solid var(--color-warning);
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: var(--color-success);
  border-color: var(--color-success);
}

input:checked + .switch-slider:before {
  transform: translateX(12px);
  background-color: white;
}

.is-disabled {
  opacity: 0.5;
  filter: grayscale(1);
}

.inspector--disabled > *:not(.header-row),
.inspector--disabled .title-input,
.inspector--disabled .total-kcal,
.inspector--disabled .multi-title {
  filter: grayscale(1);
  opacity: 0.6;
  pointer-events: none; /* Prevent editing while disabled */
}

.inspector--disabled .header-actions {
  pointer-events: auto; /* Ensure toggle still works */
}

.total-kcal {
  font-weight: 700;
  color: var(--color-text-active);
  font-size: 1.1rem;
  font-family: var(--font-mono);
  white-space: nowrap;
}

.macro-breakdown {
  background: var(--color-bg-subtle);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.macro-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-bg-active);
  margin-bottom: 0.5rem;
}

.macro-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.macro-segment.protein { background: var(--color-success); }
.macro-segment.carbs { background: var(--color-macro-carbs); }
.macro-segment.fat { background: var(--color-warning); }

.macro-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-mono);
}

.macro-label.protein { color: var(--color-success); }
.macro-label.carbs { color: var(--color-macro-carbs); }
.macro-label.fat { color: var(--color-warning); }

.empty {
  color: var(--color-text-muted);
}

.effects {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

h4 {
  font-size: 0.75rem;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
}

.effect {
  margin-bottom: 0.75rem;
}

.effect-signal {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-active);
}

.effect-desc {
  margin: 0.1rem 0 0;
  font-size: 0.85rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.gain-value{
  font-size: 0.7rem;
  line-height: 1.4;
  color: var(--color-metric-primary);
  font-weight: 600;
  font-family: var(--font-mono);
  margin-left: 0.25rem;
  background: var(--color-bg-subtle);
  padding: 0.2rem 0.4rem;
  float: right;
  border-radius: 6px;
}

.gain-unit{
	color: var(--color-text-muted);
}

.effect-help {
  margin: .25em 0 1em 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.effects-section {
  margin-top: 1rem;
  padding-top: 1rem;
}

.effects-toggle-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  color: var(--color-text-active);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.effects-toggle-btn:hover {
  border-color: var(--color-active);
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
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.effects-collapse-btn:hover {
  background: var(--color-bg-active);
  color: var(--color-text-primary);
}

.def-notes {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.normal-title {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

/* Seamless Input Base */
.seamless-input {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 6px;
  margin: -4px -6px; /* Align text with surrounding content */
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  transition: all 0.15s ease;
  width: 100%;
}

.seamless-input:hover,
.seamless-input:focus {
  background: var(--color-bg-subtle);
  border-color: var(--color-border-subtle);
  color: var(--color-text-primary);
}

.seamless-input:focus {
  outline: 1px solid var(--color-active);
  background: var(--color-bg-active);
  color: var(--color-text-primary);
}

.seamless-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

/* Specific Seamless Overrides */
.title-input {
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
}

.mono {
  font-family: var(--font-mono);
}

/* Meta Section (Time/Duration) */
.meta-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.meta-input {
  font-size: 0.9rem;
  width: 90px;
}

.duration-control {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.duration-input {
  width: 40px;
  text-align: left;
}

/* Chrome, Safari, Edge, Opera */
.duration-input::-webkit-outer-spin-button,
.duration-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.duration-input[type=number] {
  -moz-appearance: textfield;
}

.meta-unit {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

/* Notes Field */
.notes-field {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notes-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.notes-textarea {
  font-size: 0.85rem;
  line-height: 1.4;
  resize: none;
  min-height: 1.4em;
  display: block;
  overflow: hidden;
}

.multi-select-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
  height: 100%;
}

.summary-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.multi-select-summary h3 {
  margin: 0 0 0.5rem;
  color: var(--color-text-primary);
}

.multi-select-summary p {
  font-size: 0.9rem;
  margin: 0;
}
</style>
