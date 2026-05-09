<script setup lang="ts">
defineProps<{ activeTitle: string }>();
</script>

<template>
  <div class="wrap" style="padding-top: 32px">
    <div class="crumb">
      <RouterLink to="/">Protokol Lab</RouterLink>
      <span class="sep">/</span>
      <RouterLink to="/#who">Use cases</RouterLink>
      <span class="sep">/</span>
      <span class="here">{{ activeTitle }}</span>
    </div>
  </div>
</template>
