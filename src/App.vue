<template>
  <div class="app">
    <main class="app__body">
      <div class="app__viewport">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.app__viewport {
  height: 100%;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.app__viewport :deep(> *) {
  flex: 1;
  min-height: 0;
}

:deep(h3){
  margin: 1.5em 0 0 0;
  padding: 0 !important;
  color: white;
  opacity: 0.5;
  font-size: 0.9em;
}
</style>
