<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  kind?: "neg";
}>();

const valColor = props.kind === "neg" ? "var(--neg)" : "var(--accent)";
</script>

<template>
  <div
    style="
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px 0;
      border-top: 1px solid var(--line);
    "
  >
    <span style="color: var(--ink-dim)">{{ label }}</span>
    <span :style="{ fontFamily: 'var(--mono)', color: valColor }">{{ value }}</span>
  </div>
</template>
