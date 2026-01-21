<template>
  <div class="param">
    <div class="header">
      <label>
        {{ paramDef.label }}
        <small v-if="paramDef.unit">{{ paramDef.unit }}</small>
      </label>
      <input
        v-if="paramDef.type === 'slider'"
        type="number"
        class="number-readout"
        :value="value"
        :min="paramDef.min"
        :max="paramDef.max"
        :step="paramDef.step ?? 'any'"
        @input="onInput"
      />
    </div>
    <component
      :is="inputType"
      v-bind="inputProps"
      :class="{ 'input-mono': paramDef.type === 'number' || paramDef.type === 'slider' }"
      :value="value"
      @input="onInput"
      @change="onInput"
    >
      <option
        v-if="paramDef.type === 'select'"
        v-for="opt in paramDef.options"
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
import type { ParamDef } from '@/types';

const props = defineProps<{ paramDef: ParamDef; value: string | number | boolean }>();
const emit = defineEmits<{ update: [string | number | boolean] }>();

const inputType = computed(() => {
  if (props.paramDef.type === 'slider') return 'input';
  if (props.paramDef.type === 'switch') return 'input';
  if (props.paramDef.type === 'select') return 'select';
  return 'input';
});

const inputProps = computed(() => {
  const base: Record<string, unknown> = {};
  if (props.paramDef.type === 'slider') {
    base.type = 'range';
    base.min = props.paramDef.min;
    base.max = props.paramDef.max;
    base.step = props.paramDef.step ?? 1;
  } else if (props.paramDef.type === 'number') {
    base.type = 'number';
  } else if (props.paramDef.type === 'text') {
    base.type = 'text';
  } else if (props.paramDef.type === 'switch') {
    base.type = 'checkbox';
    base.checked = Boolean(props.value);
  }
  return base;
});

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
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.number-readout {
  width: 60px;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: inherit;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  padding: 0.1rem 0.25rem;
  text-align: right;
}

.number-readout:focus {
  outline: none;
  border-color: var(--color-active);
}

.input-mono {
  font-family: var(--font-mono);
}
</style>
