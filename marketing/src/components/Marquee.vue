<script setup lang="ts">
const items = [
  "Tirzepatide",
  "Semaglutide",
  "Retatrutide",
  "BPC-157",
  "TB-500",
  "Methylene Blue",
  "Creatine",
  "Magnesium L-Threonate",
  "NAD+",
  "Berberine",
  "Metformin",
  "Rapamycin",
  "Lion's Mane",
  "L-Theanine",
  "Caffeine",
  "Ashwagandha",
  "Cold Exposure",
  "Zone 2",
  "HRV-paced breathing",
  "Continuous glucose",
];
</script>

<template>
  <div class="marquee">
    <div class="marquee-track">
      <span v-for="(s, i) in items" :key="`a${i}`">{{ s }}</span>
      <span v-for="(s, i) in items" :key="`b${i}`">{{ s }}</span>
    </div>
  </div>
</template>
