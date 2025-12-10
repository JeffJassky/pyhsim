<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--sidebar-lock': alwaysShowSidebar }"
  >
    <div class="app-shell__body">
      <button
        v-if="isMobile"
        class="app-shell__mobile-toggle"
        type="button"
        aria-label="Toggle sidebar"
        aria-controls="app-shell-sidebar"
        :aria-expanded="isMobile && isSidebarOpen"
        @click="toggleSidebar"
      >
        <span class="app-shell__mobile-toggle-text"
          >+ Add Food, Exercise, etc...</span
        >
      </button>
      <aside
        id="app-shell-sidebar"
        class="app-shell__sidebar"
        :class="{ 'app-shell__sidebar--open': isMobile && isSidebarOpen }"
      >
        <slot name="sidebar">Sidebar</slot>
      </aside>
      <main class="app-shell__main">
        <slot />
      </main>
      <div
        v-if="isMobile && isSidebarOpen"
        class="app-shell__overlay"
        @click="closeSidebar"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

withDefaults(
  defineProps<{
    alwaysShowSidebar?: boolean;
  }>(),
  { alwaysShowSidebar: false }
);

const isSidebarOpen = ref(false);
const isMobile = ref(false);
const MOBILE_BREAKPOINT = 600;

const updateViewportMode = () => {
  if (typeof window === 'undefined') return;
  const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
  isMobile.value = mobile;
  if (!mobile) {
    isSidebarOpen.value = false;
  }
};

const toggleSidebar = () => {
  if (!isMobile.value) return;
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  if (!isMobile.value) return;
  isSidebarOpen.value = false;
};

onMounted(() => {
  if (typeof window === 'undefined') return;
  updateViewportMode();
  window.addEventListener('resize', updateViewportMode, { passive: true });
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('resize', updateViewportMode);
});
</script>

<style scoped>

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #e8ecf1;
}

.app-shell__body {
  flex: 1;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 2rem;
  padding: 1rem 2rem;
  overflow: hidden;
  position: relative;
}

.app-shell__sidebar,
.app-shell__main {
  min-height: 0;
  overflow-y: auto;
}

.app-shell__sidebar::-webkit-scrollbar,
.app-shell__main::-webkit-scrollbar {
  display: none;
}

.app-shell__sidebar {
  scrollbar-width: none;
}

.app-shell__main {
  scrollbar-width: none;
  padding-right: 0.5rem;
}

.app-shell__mobile-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: rgb(50, 101, 219);
  color: black;
  color: inherit;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.app-shell__hamburger {
  position: relative;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.app-shell__hamburger::before,
.app-shell__hamburger::after {
  content: '';
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.app-shell__hamburger::before {
  top: -6px;
}

.app-shell__hamburger::after {
  top: 6px;
}

.app-shell__overlay {
  display: none;
}

@media (max-width: 600px) {
  .app-shell__body {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0rem 1rem 1rem 1rem;
  }

  .app-shell__mobile-toggle {
    display: inline-flex;
    position: sticky;
    top: 0.5rem;
    z-index: 5;
  }

  .app-shell__sidebar {
    position: fixed;
    top: var(--app-header-height, 64px);
    bottom: 0;
    left: 0;
    width: min(320px, 80vw);
    max-width: calc(100vw - 3rem);
    padding: 1.25rem;
    background: rgba(18, 28, 51, 0.96);
    backdrop-filter: blur(12px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(2, 6, 23, 0.6);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 40;
  }

  .app-shell__sidebar--open {
    transform: translateX(0);
  }

  .app-shell__main {
    padding-right: 0;
  }

  .app-shell__overlay {
    display: block;
    position: fixed;
    top: var(--app-header-height, 64px);
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 6, 23, 0.65);
    z-index: 30;
  }
}
</style>
