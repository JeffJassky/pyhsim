<script setup lang="ts">
defineProps<{
  label: string;
  habit: string;
  spreadsheet: string;
  us: string;
}>();
</script>

<template>
  <div class="row-l">{{ label }}</div>
  <div class="no">{{ habit }}</div>
  <div class="no">{{ spreadsheet }}</div>
  <div class="col-us yes">{{ us }}</div>
</template>
