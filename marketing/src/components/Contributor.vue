<script setup lang="ts">
const props = defineProps<{
  dot: "gn" | "gy" | "am" | "cy";
  name: string;
  value: string;
  kind?: "neg";
}>();

const valColor =
  props.kind === "neg" ? "var(--neg)" : "var(--accent)";
</script>

<template>
  <div
    class="chip"
    style="position: static; transform: none; justify-content: space-between"
  >
    <span><span class="d" :class="dot"></span> {{ name }}</span>
    <span :style="{ color: valColor }">{{ value }}</span>
  </div>
</template>
