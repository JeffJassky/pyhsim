<script setup lang="ts">
defineProps<{
  ix: string;
  q: string;
  a: string;
  open?: boolean;
}>();
</script>

<template>
  <details :open="open">
    <summary>
      <span class="ix">Q · {{ ix }}</span>
      <span>{{ q }}</span>
      <span class="pm">+</span>
    </summary>
    <div class="a" v-html="a"></div>
  </details>
</template>
