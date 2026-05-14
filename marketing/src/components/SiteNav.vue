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
  <div class="promo">
    Use your HSA/FSA funds — Protokol Lab membership is eligible.
    <a href="#hsa">Learn more →</a>
  </div>
  <header class="nav">
    <div class="wrap nav-inner">
      <RouterLink class="brand" to="/">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" fill="#c4633c" />
            <path d="M3 14 L25 14" stroke="#fbf8f3" stroke-width="1.2" />
            <path d="M5 17 L23 17" stroke="#fbf8f3" stroke-width="1.2" opacity="0.85" />
            <path d="M7 20 L21 20" stroke="#fbf8f3" stroke-width="1.2" opacity="0.7" />
            <path d="M9 23 L19 23" stroke="#fbf8f3" stroke-width="1.2" opacity="0.55" />
          </svg>
        </span>
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
        <RouterLink to="/#what">What we model</RouterLink>
        <RouterLink to="/#pricing">Pricing</RouterLink>
        <RouterLink to="/#faq">FAQ</RouterLink>
      </nav>
      <div class="nav-cta">
        <a class="btn btn-ghost" href="#login">Sign in</a>
        <a class="btn btn-primary" href="#join">
          Join the lab <span class="arr">→</span>
        </a>
      </div>
    </div>
  </header>
</template>
