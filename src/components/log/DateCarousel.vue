<template>
  <div class="dates">
    <button class="dates__arrow" type="button" @click="shift(-1)">‹</button>
    <div class="dates__track" ref="trackRef">
      <button
        v-for="date in visibleDates"
        :key="date.iso"
        type="button"
        class="dates__pill"
        :class="{ active: date.iso === modelValue }"
        @click="$emit('update:modelValue', date.iso)"
      >
        <span class="dates__dow">{{ date.dow }}</span>
        <strong class="dates__day">{{ date.day }}</strong>
      </button>
    </div>
    <button class="dates__arrow" type="button" @click="shift(1)">›</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const trackRef = ref<HTMLDivElement | null>(null);

const range = 3;

const buildDate = (iso: string, offset: number) => {
  const date = new Date(iso);
  date.setDate(date.getDate() + offset);
  const isoOut = date.toISOString().slice(0, 10);
  return {
    iso: isoOut,
    day: date.getDate(),
    dow: date.toLocaleDateString(undefined, { weekday: 'short' }),
  };
};

const visibleDates = computed(() => {
  const list = [];
  for (let i = -range; i <= range; i += 1) {
    list.push(buildDate(props.modelValue, i));
  }
  return list;
});

const shift = (delta: number) => {
  const nextDate = buildDate(props.modelValue, delta).iso;
  emit('update:modelValue', nextDate);
};

const scrollActiveIntoView = () => {
  const track = trackRef.value;
  if (!track) return;
  const active = track.querySelector('.dates__pill.active') as HTMLElement | null;
  if (!active) return;
  active.scrollIntoView({ inline: 'center', behavior: 'smooth' });
};

onMounted(scrollActiveIntoView);
watch(() => props.modelValue, scrollActiveIntoView);
</script>

<style scoped>
.dates {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dates__arrow {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  cursor: pointer;
}

.dates__track {
  display: grid;
  grid-auto-flow: column;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.25rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  touch-action: pan-x;
}

.dates__track::-webkit-scrollbar {
  display: none;
}

.dates__pill {
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 0.1rem;
  min-width: 64px;
  transition: all 0.2s ease;
}

.dates__pill.active {
  background: linear-gradient(120deg, #3b82f6, #22d3ee);
  border-color: transparent;
  color: black;
}

.dates__dow {
  font-size: 0.8rem;
  opacity: 0.8;
}

.dates__day {
  font-size: 1.1rem;
}
</style>
