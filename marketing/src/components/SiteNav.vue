<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { AUDIENCES } from "@/data/audiences";

const open = ref(false);
const menuEl = ref<HTMLElement | null>(null);

function toggle(e: MouseEvent) {
  e.stopPropagation();
  open.value = !open.value;
}
function close() {
  open.value = false;
}
function onDocClick(e: MouseEvent) {
  if (menuEl.value && !menuEl.value.contains(e.target as Node)) close();
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <header class="nav">
    <div class="wrap nav-inner">
      <RouterLink class="brand" to="/">
        <span class="brand-mark"></span>
        <span class="brand-name"><b>Protokol</b> Lab</span>
        <span class="brand-tag">v0.4 · INVITE BETA</span>
      </RouterLink>
      <nav class="nav-links">
        <div class="menu" :class="{ open }" ref="menuEl" id="useCasesMenu">
          <button
            class="menu-trigger"
            type="button"
            :aria-expanded="open"
            @click="toggle"
          >
            Use cases
          </button>
          <div class="menu-panel" role="menu">
            <RouterLink
              v-for="a in AUDIENCES"
              :key="a.slug"
              class="menu-item"
              :to="`/${a.slug}`"
              @click="close"
            >
              <span class="ic">{{ a.code }}</span>
              <span>
                <span class="tt">{{ a.title }}</span>
                <span class="ds">{{ a.blurb }}</span>
              </span>
              <span class="ar">→</span>
            </RouterLink>
          </div>
        </div>
        <RouterLink to="/#how">How it works</RouterLink>
        <RouterLink to="/#features">The lab</RouterLink>
        <RouterLink to="/#science">Science</RouterLink>
        <RouterLink to="/#pricing">Pricing</RouterLink>
        <RouterLink to="/#faq">FAQ</RouterLink>
      </nav>
      <div class="nav-cta">
        <a class="btn btn-ghost" href="#login">Sign in</a>
        <a class="btn btn-primary" href="#waitlist">
          Request access <span class="arr">→</span>
        </a>
      </div>
    </div>
  </header>
</template>
