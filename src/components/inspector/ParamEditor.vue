<template>
  <div class="param">
    <div class="header">
      <label>{{ paramDef.label }}</label>
      <div
        v-if="paramDef.type === 'slider' || paramDef.type === 'number'"
        class="readout-group"
      >
        <input
          type="text"
          class="number-readout"
          :value="formattedValue"
          @input="onTextInput"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <span v-if="paramDef.unit" class="unit">{{ paramDef.unit }}</span>
      </div>
    </div>

    <PrecisionSlider
      v-if="paramDef.type === 'slider'"
      :value="Number(value)"
      :min="(paramDef as SliderParamDef).min"
      :max="(paramDef as SliderParamDef).max"
      :step="(paramDef as SliderParamDef).step || 1"
      :unit="paramDef.unit"
      @input="onInput"
    />

    <component
      v-else
      :is="inputType"
      v-bind="inputProps"
      :class="{ 'input-mono': paramDef.type === 'number' }"
      :value="value"
      @input="onInput"
      @change="onInput"
    >
      <option
        v-if="paramDef.type === 'select'"
        v-for="opt in (paramDef as SelectParamDef).options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ParamDef, SliderParamDef, SelectParamDef } from '@/types';
import PrecisionSlider from '../core/PrecisionSlider.vue';

const props = defineProps<{ paramDef: ParamDef; value: string | number | boolean }>();
const emit = defineEmits<{ update: [string | number | boolean] }>();

const inputType = computed(() => {
  if (props.paramDef.type === 'switch') return 'input';
  if (props.paramDef.type === 'select') return 'select';
  return 'input';
});

const inputProps = computed(() => {
  const base: Record<string, unknown> = {};
  if (props.paramDef.type === 'number') {
    base.type = 'text'; // Changed to text to support comma formatting
  } else if (props.paramDef.type === 'text') {
    base.type = 'text';
  } else if (props.paramDef.type === 'switch') {
    base.type = 'checkbox';
    base.checked = Boolean(props.value);
  }
  return base;
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    // Format with commas, respecting any decimal places
    return props.value.toLocaleString(undefined, {
      maximumFractionDigits: 10
    });
  }
  return String(props.value);
});

const onTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  // Remove commas before parsing as number
  const rawValue = target.value.replace(/,/g, '');
  const numValue = parseFloat(rawValue);

  if (!isNaN(numValue)) {
    emit('update', numValue);
  } else if (rawValue === '') {
    emit('update', 0);
  }
};

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  let next: string | number | boolean = target.value;
  if (props.paramDef.type === 'slider' || props.paramDef.type === 'number') {
    next = Number(target.value);
  } else if (props.paramDef.type === 'switch') {
    next = (target as HTMLInputElement).checked;
  }
  emit('update', next);
};
</script>

<style scoped>
.param {
	margin-top: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

label {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.readout-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.unit {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.number-readout {
  min-width: 40px;
  max-width: 100px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--color-metric-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-mono);
  padding: 2px 4px;
  text-align: right;
  transition: all 0.15s ease;
}

.number-readout:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-border-subtle);
}

.number-readout:focus {
  outline: 1px solid var(--color-active);
  background: var(--color-bg-active);
  color: var(--color-text-primary);
}

/* Chrome, Safari, Edge, Opera */
.number-readout::-webkit-outer-spin-button,
.number-readout::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.number-readout[type=number] {
  -moz-appearance: textfield;
}

.input-mono {
  font-family: var(--font-mono);
}
</style>
