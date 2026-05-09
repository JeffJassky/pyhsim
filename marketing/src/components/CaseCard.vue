<script setup lang="ts">
defineProps<{
  ix: string;
  heading: string;
  body: string;
  tags: string[];
}>();
</script>

<template>
  <div class="case">
    <span class="ix">CASE · {{ ix }}</span>
    <div>
      <h5>{{ heading }}</h5>
      <p v-html="body"></p>
      <div class="tags">
        <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
      </div>
    </div>
  </div>
</template>
