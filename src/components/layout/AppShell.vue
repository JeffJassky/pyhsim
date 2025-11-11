<template>
  <div class="app-shell">
    <div class="app-shell__body">
      <aside class="app-shell__sidebar">
        <slot name="sidebar">Sidebar</slot>
      </aside>
      <main class="app-shell__main">
        <slot />
      </main>
    </div>
    <footer class="app-shell__footer">
      <slot name="footer">Status: idle</slot>
    </footer>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: #e8ecf1;
}

.app-shell__header,
.app-shell__footer {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-shell__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 0;
}

.app-shell__body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem 1.5rem;
}

aside,
main {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1rem;
}

@media (max-width: 1200px) {
  .app-shell__body {
    grid-template-columns: 1fr;
  }
  .app-shell__sidebar,
  .app-shell__inspector {
    display: none;
  }
}
</style>
