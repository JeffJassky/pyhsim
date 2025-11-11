<template>
  <div class="app">
    <header class="app__header">
      <nav class="app-nav">
        <span class="logo">physim</span>
        <RouterLink to="/">Studio</RouterLink>
        <RouterLink to="/library">Library</RouterLink>
        <RouterLink to="/scenarios">Scenarios</RouterLink>
      </nav>
    </header>
    <main class="app__body">
      <div class="app__viewport">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<style scoped>
.app {
  --app-header-height: 64px;
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-rows: var(--app-header-height) 1fr;
  overflow: hidden;
}

.app__body {
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

.app__header {
  height: var(--app-header-height);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

a {
  color: inherit;
  text-decoration: none;
  opacity: 0.7;
}

a.router-link-active {
  opacity: 1;
}

:deep(h3){
  margin: 1.5em 0 0 0;
  padding: 0 !important;
  color: white;
  opacity: 0.5;
  font-size: 0.9em;
}
</style>
