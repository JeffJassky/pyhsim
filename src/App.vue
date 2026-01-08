<template>
  <div class="app">
    <header class="app__header" v-if="!isOnboarding">
      <div class="header-left">
        <span class="logo">physim</span>
      </div>
      <div class="header-right">
        <button class="profile-link" @click="debugModalOpen = true" style="margin-right: 1.5rem">
          Dev Tools
        </button>
        <button class="profile-link" @click="uiStore.setProfileModalOpen(true)">
          My Profile
        </button>
      </div>
    </header>
    <main class="app__body">
      <div class="app__viewport">
        <RouterView />
      </div>
    </main>
    <DebugModal v-model="debugModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useUIStore } from '@/stores/ui';
import DebugModal from '@/components/admin/DebugModal.vue';

const uiStore = useUIStore();
const route = useRoute();
const isOnboarding = computed(() => route.name === 'onboarding');
const debugModalOpen = ref(false);
</script>

<style scoped>
.app {
  --header-height: 56px;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app__header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: rgba(13, 17, 23, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  z-index: 100;
}

.logo {
  font-weight: 700;
  text-transform: uppercase;
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
