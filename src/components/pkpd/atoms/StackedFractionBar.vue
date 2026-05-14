<template>
  <div class="stacked-bar" :aria-label="ariaLabel">
    <div class="stacked-bar__track">
      <button
        v-for="(seg, idx) in normalizedSegments"
        :key="seg.key"
        type="button"
        class="stacked-bar__segment"
        :style="{ width: seg.widthPct + '%', '--segment-tone': seg.tone }"
        :class="{ 'stacked-bar__segment--first': idx === 0, 'stacked-bar__segment--last': idx === normalizedSegments.length - 1 }"
        @click="emit('click', seg.key)"
        v-tooltip="`${seg.key} — ${Math.round(seg.fraction * 100)}%. Click to inspect.`"
      >
        <span class="stacked-bar__label" v-if="seg.widthPct >= 18">
          {{ seg.key }}
          <span class="stacked-bar__pct">{{ Math.round(seg.fraction * 100) }}%</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  segments: { key: string; fraction: number }[];
  ariaLabel?: string;
}>();

const emit = defineEmits<{ click: [key: string] }>();

/**
 * Tonal shade per segment — uses neutral grays from light → dark for visual
 * ordering. Matches the lab's monochromatic palette; emphasis comes from
 * tonal contrast rather than hue.
 */
const TONES = [
  'var(--neutral-600)',
  'var(--neutral-500)',
  'var(--neutral-400)',
  'var(--neutral-300)',
  'var(--neutral-200)',
];

const normalizedSegments = computed(() => {
  const total = props.segments.reduce((s, x) => s + x.fraction, 0) || 1;
  // Sort by descending fraction so the largest contributor gets the darkest tone
  const sorted = [...props.segments].sort((a, b) => b.fraction - a.fraction);
  return sorted.map((s, idx) => ({
    ...s,
    widthPct: (s.fraction / total) * 100,
    tone: TONES[Math.min(idx, TONES.length - 1)],
  }));
});
</script>

<style scoped>
.stacked-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stacked-bar__track {
  display: flex;
  width: 100%;
  height: 1.75rem;
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-bg-subtle);
}

.stacked-bar__segment {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border: none;
  padding: 0 0.4rem;
  cursor: pointer;
  background: var(--segment-tone);
  color: var(--color-text-inverted);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  transition: filter 0.12s ease;
}

.stacked-bar__segment:hover {
  filter: brightness(1.15);
}

.stacked-bar__label {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  letter-spacing: 0.02em;
}

.stacked-bar__pct {
  font-weight: 400;
  opacity: 0.85;
  font-size: 0.65rem;
}
</style>
