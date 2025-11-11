<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--sidebar-lock': alwaysShowSidebar }"
  >
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

<script setup lang="ts">
withDefaults(
  defineProps<{
    alwaysShowSidebar?: boolean;
  }>(),
  { alwaysShowSidebar: false }
);
</script>

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
  gap: 2rem;
  padding: 1rem 2rem;
}

@media (max-width: 1200px) {
  .app-shell:not(.app-shell--sidebar-lock) .app-shell__body {
    grid-template-columns: 1fr;
  }
  .app-shell:not(.app-shell--sidebar-lock) .app-shell__sidebar,
  .app-shell:not(.app-shell--sidebar-lock) .app-shell__inspector {
    display: none;
  }
}
</style>
