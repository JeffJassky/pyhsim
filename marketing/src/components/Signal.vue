<script setup lang="ts">
const props = defineProps<{
  name: string;
  val: string;
  klass: "accent" | "dim";
  points: string;
  valKlass?: "dim";
}>();

const lineColor = props.klass === "accent" ? "var(--accent)" : "var(--ink-dim)";
</script>

<template>
  <div class="sig">
    <div class="top">
      <span class="name">{{ name }}</span>
      <span class="val" :class="valKlass">{{ val }}</span>
    </div>
    <svg viewBox="0 0 120 28" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linejoin="round"
        :points="points"
        :style="{ color: lineColor }"
      />
    </svg>
  </div>
</template>
