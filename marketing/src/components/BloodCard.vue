<script setup lang="ts">
defineProps<{
  heading: string;
  ref: string;
  rangeLeft: number;
  rangeWidth: number;
  youAt: number;
  lo: string;
  mid: string;
  hi: string;
}>();
</script>

<template>
  <div class="blood-card">
    <div class="top">
      <h6>{{ heading }}</h6>
      <span class="ref" v-html="ref"></span>
    </div>
    <div class="bar">
      <span
        class="range"
        :style="{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }"
      ></span>
      <span class="you" :style="{ left: `${youAt}%` }"></span>
    </div>
    <div class="bar-meta">
      <span>{{ lo }}</span>
      <span>{{ mid }}</span>
      <span>{{ hi }}</span>
    </div>
  </div>
</template>
