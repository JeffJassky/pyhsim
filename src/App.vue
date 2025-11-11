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
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app__body {
  flex: 1;
}

.app__header {
  padding: 0.75rem 1.5rem;
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
