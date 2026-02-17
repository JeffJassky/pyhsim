<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--sidebar-lock': alwaysShowSidebar }"
  >
    <header class="app-shell__header" v-if="!isOnboarding">
      <div class="header-left">
        <span class="logo">KYNETIC</span>
      </div>
      <div class="header-center">
        <slot name="header-center" />
      </div>
      <div class="header-right">
        <button class="profile-link" @click="debugModalOpen = true">
          Dev Tools
        </button>
        <button class="profile-link" @click="scienceModalOpen = true">
          Science
        </button>
        <a class="profile-link" href="https://discord.gg/yZQE4DPB" target="_blank" rel="noopener noreferrer">Discord</a>
        <button class="profile-link" @click="uiStore.setProfileModalOpen(true)">
          My Profile
        </button>
        <button
          v-if="userStore.subscriptionTier === 'free'"
          class="upgrade-btn"
          @click="uiStore.openProfileModal('subscription')"
        >
          Upgrade
        </button>
        <label class="theme-switch" :title="'Theme: ' + uiStore.theme">
          <input
            type="checkbox"
            :checked="uiStore.resolvedTheme === 'dark'"
            @change="toggleTheme"
          />
          <span class="switch-slider"></span>
        </label>
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
      <!-- Splitpanes layout when right sidebar is visible on desktop -->
      <Splitpanes
        v-if="showRightSidebar && !isMobile"
        class="app-shell__splitpanes"
        @resized="handlePaneResize"
      >
        <Pane :size="mainPaneSize" :min-size="50">
          <div class="app-shell__main-area">
            <main class="app-shell__main">
              <slot />
            </main>
            <div class="app-shell__floating">
              <slot name="floating" />
            </div>
          </div>
        </Pane>
        <Pane :size="chatPaneSize" :min-size="15" :max-size="40">
          <aside
            class="app-shell__sidebar app-shell__sidebar--right tour-ai-panel"
          >
            <slot name="right-sidebar" />
          </aside>
        </Pane>
      </Splitpanes>

      <!-- Standard layout without splitpanes -->
      <template v-else>
        <div class="app-shell__main-area">
          <main class="app-shell__main">
            <slot />
          </main>
          <div class="app-shell__floating">
            <slot name="floating" />
          </div>
        </div>
      </template>
      <div
        v-if="isMobile && isSidebarOpen"
        class="app-shell__overlay"
        @click="closeSidebar"
      ></div>
    </div>
    <DebugModal v-model="debugModalOpen" />
    <ScienceModal v-model="scienceModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import { useUIStore } from '@/stores/ui';
import { useUserStore } from '@/stores/user';
import DebugModal from '@/components/admin/DebugModal.vue';
import ScienceModal from '@/components/layout/ScienceModal.vue';

const uiStore = useUIStore();
const userStore = useUserStore();
const route = useRoute();
const isOnboarding = computed(() => route.name === 'onboarding');
const debugModalOpen = ref(false);
const scienceModalOpen = ref(false);

const toggleTheme = () => {
  // Toggle between light and dark (if currently system, use the resolved theme's opposite)
  const current = uiStore.resolvedTheme;
  uiStore.setTheme(current === 'dark' ? 'light' : 'dark');
};

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

const chatPaneSize = computed(() => uiStore.panelSizes.chatWidth);
const mainPaneSize = computed(() => 100 - uiStore.panelSizes.chatWidth);

const handlePaneResize = (panes: { size: number }[]) => {
  if (panes.length === 2) {
    uiStore.setPanelSizes({ chatWidth: panes[1].size });
  }
};
</script>

<style scoped>

.app-shell__header {
  height: 46px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--color-border-default);
  backdrop-filter: blur(12px);
  z-index: 100;
}

.header-left {
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-weight: 700;
  font-size: 1rem;
  opacity: 0.9;
  color: var(--color-text-primary);
}

.upgrade-btn {
  background: var(--color-active);
  color: white;
  border: none;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.upgrade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.profile-link {
  color: var(--color-text-secondary);
  font-weight: 600;
  opacity: 0.7;
  font-size: 0.9rem;
  background: transparent;
  border: none;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.profile-link:hover {
  opacity: 1;
  color: var(--color-text-primary);
}

.theme-switch {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 16px;
  flex-shrink: 0;
  cursor: pointer;
}

.theme-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-text-secondary);
  transition: .2s;
  border-radius: 20px;
  border: 1px solid var(--color-text-secondary);
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

input:checked + .switch-slider:before {
  transform: translateX(12px);
  background-color: white;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--color-text-primary);
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
  grid-template-columns: 280px minmax(0, 1fr);
}

.app-shell__body.has-right-sidebar:not(.has-sidebar) {
  grid-template-columns: minmax(0, 1fr);
}

.app-shell__splitpanes {
  height: 100%;
  min-height: 0;
}

.app-shell__splitpanes :deep(.splitpanes__pane) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* Style the splitter to appear inside the chat panel */
.app-shell__splitpanes :deep(.splitpanes__splitter) {
    width: 6px !important;
    min-width: 6px !important;
    border-left: none;
    border-right: none;
    position: relative;
    z-index: 1;
    margin-left: -6px;
    transform: translateX(7px);
}

.app-shell__splitpanes :deep(.splitpanes__splitter:hover) {
  background: var(--color-border-default);
}


.app-shell__sidebar {
  min-height: 0;
  padding: 1rem 0 1rem 2rem;
}

.app-shell__sidebar--right {
  padding: 0;
  height: 100%;
  min-width: 0;
  overflow: auto;
}

.app-shell__main-area {
  height: 100%;
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
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.app-shell__mobile-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: var(--color-accent);
  color: var(--color-text-inverted);
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
    background: var(--color-bg-base);
    backdrop-filter: blur(12px);
    border-right: 1px solid var(--color-border-subtle);
    box-shadow: var(--ob-shadow-lg);
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
    background: var(--color-bg-base);
    z-index: 30;
  }
}
</style>
