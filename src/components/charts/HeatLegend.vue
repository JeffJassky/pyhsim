<template>
  <div class="legend">
    <span>-</span>
    <div class="bar"></div>
    <span>+</span>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #f97316);
}
</style>
