<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--sidebar-lock': alwaysShowSidebar }"
  >
    <header class="app-shell__header" v-if="!isOnboarding">
      <div class="header-left">
        <span class="logo">PhySim</span>
      </div>
      <div class="header-center">
        <slot name="header-center" />
      </div>
      <div class="header-right">
        <button
          class="profile-link"
          @click="debugModalOpen = true"
          style="margin-right: 1.5rem"
        >
          Dev Tools
        </button>
        <button class="profile-link" @click="uiStore.setProfileModalOpen(true)">
          My Profile
        </button>
      </div>
    </header>
    <div
      class="app-shell__body"
      :class="{ 
        'has-right-sidebar': showRightSidebar && !isMobile,
        'has-sidebar': (alwaysShowSidebar || !!$slots.sidebar) && !isMobile
      }"
    >
      <button
        v-if="isMobile && !!$slots.sidebar"
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
        v-if="alwaysShowSidebar || !!$slots.sidebar"
        id="app-shell-sidebar"
        class="app-shell__sidebar"
        :class="{ 'app-shell__sidebar--open': isMobile && isSidebarOpen }"
      >
        <slot name="sidebar">Sidebar</slot>
      </aside>
      <div class="app-shell__main-area">
        <main class="app-shell__main">
          <slot />
        </main>
        <div class="app-shell__floating">
          <slot name="floating" />
        </div>
      </div>
      <aside
        v-if="showRightSidebar && !isMobile"
        class="app-shell__sidebar app-shell__sidebar--right"
      >
        <slot name="right-sidebar" />
      </aside>
      <div
        v-if="isMobile && isSidebarOpen"
        class="app-shell__overlay"
        @click="closeSidebar"
      ></div>
    </div>
    <DebugModal v-model="debugModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUIStore } from '@/stores/ui';
import DebugModal from '@/components/admin/DebugModal.vue';

const uiStore = useUIStore();
const route = useRoute();
const isOnboarding = computed(() => route.name === 'onboarding');
const debugModalOpen = ref(false);

withDefaults(
  defineProps<{
    alwaysShowSidebar?: boolean;
    showRightSidebar?: boolean;
  }>(),
  { alwaysShowSidebar: false, showRightSidebar: false }
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

.app-shell__header {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
  background: rgba(13, 17, 23, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  z-index: 100;
}

.header-left {
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  min-width: 0;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.logo {
  font-weight: 700;
  letter-spacing: 0.2em;
  font-size: 1rem;
  opacity: 0.9;
}

.profile-link {
  color: white;
  font-weight: 500;
  opacity: 0.7;
  font-size: 0.9rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.profile-link:hover {
  opacity: 1;
  text-decoration: underline;
}

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
  grid-template-columns: 1fr;
  gap: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  transition: grid-template-columns 0.3s ease;
}

.app-shell__body.has-sidebar {
  grid-template-columns: 280px minmax(0, 1fr);
}

.app-shell__body.has-sidebar.has-right-sidebar {
  grid-template-columns: 280px minmax(0, 1fr) 300px;
}

.app-shell__body.has-right-sidebar:not(.has-sidebar) {
  grid-template-columns: minmax(0, 1fr) 300px;
}


.app-shell__sidebar {
  min-height: 0;
  padding: 1rem 0 1rem 2rem;
}

.app-shell__sidebar--right {
  padding: 0;
}

.app-shell__main-area {
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.app-shell__floating {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.app-shell__floating > * {
  pointer-events: auto;
}

.app-shell__sidebar::-webkit-scrollbar,
.app-shell__main::-webkit-scrollbar {
  display: none;
}

.app-shell__sidebar {
  scrollbar-width: none;
}

.app-shell__main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 1rem 2rem 6rem 2rem;
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
    gap: 0;
    padding: 0;
  }

  .app-shell__main {
    padding: 0 1rem 1rem 1rem;
  }

  .app-shell__mobile-toggle {
    display: inline-flex;
    position: sticky;
    top: 0.5rem;
    z-index: 5;
  }

  .app-shell__sidebar {
    position: fixed;
    top: 0;
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

  .app-shell__overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 6, 23, 0.65);
    z-index: 30;
  }
}
</style>
