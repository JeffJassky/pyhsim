<script setup lang="ts">
import { AUDIENCES } from "@/data/audiences";

defineProps<{ activeSlug: string }>();
</script>

<template>
  <div class="aud-switch">
    <div class="wrap">
      <div class="aud-switch-inner">
        <RouterLink
          v-for="a in AUDIENCES"
          :key="a.slug"
          :to="`/${a.slug}`"
          :class="{ on: a.slug === activeSlug }"
        >
          {{ a.code }} · {{ a.label }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
