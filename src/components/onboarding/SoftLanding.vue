<template>
  <div class="landing">
    <!-- Ambient background -->
    <div class="landing__ambient"></div>

    <!-- Content -->
    <div class="landing__content">
      <!-- Success indicator -->
      <div class="landing__success">
        <div class="landing__success-ring">
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="28" fill="none" stroke="url(#successGrad)" stroke-width="2" />
            <defs>
              <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00d4ff" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <svg class="landing__success-check" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- Heading -->
      <div class="landing__header">
        <h1 class="landing__title">You're ready</h1>
        <p class="landing__subtitle">
          Your simulation is calibrated. Start building your day, or explore these options later.
        </p>
      </div>

      <!-- Next steps cards -->
      <div class="landing__cards">
        <div class="landing__card" @click="openConditions">
          <div class="landing__card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div class="landing__card-content">
            <h3 class="landing__card-title">Add conditions</h3>
            <p class="landing__card-desc">Model specific conditions like ADHD, PCOS, or hypothyroidism</p>
          </div>
        </div>

        <div class="landing__card" @click="openTargets">
          <div class="landing__card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="currentColor"/>
            </svg>
          </div>
          <div class="landing__card-content">
            <h3 class="landing__card-title">Nutrition targets</h3>
            <p class="landing__card-desc">Set macro goals for more precise metabolic modeling</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <button class="landing__btn" @click="$emit('next')">
        Enter studio
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui';

const emit = defineEmits(['next']);
const uiStore = useUIStore();

function openConditions() {
  uiStore.setProfileModalOpen(true);
  emit('next');
}

function openTargets() {
  uiStore.setTargetsModalOpen(true);
  emit('next');
}
</script>

<style scoped>
@import './onboarding.css';

.landing {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--ob-bg-deep, #050509);
  overflow: hidden;
}

.landing__ambient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 20%, rgba(0, 212, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 50% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
}

.landing__content {
  width: 100%;
  max-width: 420px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

/* Success indicator */
.landing__success {
  margin-bottom: 0.5rem;
}

.landing__success-ring {
  position: relative;
  width: 60px;
  height: 60px;
  animation: successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.landing__success-ring svg:first-child {
  width: 100%;
  height: 100%;
}

.landing__success-check {
  position: absolute;
  inset: 0;
  margin: auto;
  color: #00d4ff;
  animation: checkDraw 0.4s ease 0.3s both;
}

@keyframes successPop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes checkDraw {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

/* Header */
.landing__header {
  text-align: center;
}

.landing__title {
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #f0f0f5;
  margin: 0 0 0.75rem;
}

.landing__subtitle {
  font-size: 1rem;
  line-height: 1.5;
  color: #8888a0;
  margin: 0;
  max-width: 320px;
}

/* Cards */
.landing__cards {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.landing__card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(20, 20, 35, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing__card:hover {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateY(-2px);
}

.landing__card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #00d4ff;
}

.landing__card-content {
  flex: 1;
  min-width: 0;
}

.landing__card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #f0f0f5;
  margin: 0 0 0.25rem;
}

.landing__card-desc {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: #8888a0;
  margin: 0;
}

/* CTA button */
.landing__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #050509;
  font-size: 1.0625rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 24px rgba(0, 212, 255, 0.35);
  margin-top: 0.5rem;
}

.landing__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.45);
}

.landing__btn:active {
  transform: translateY(0);
}

/* Mobile */
@media (max-width: 400px) {
  .landing__title {
    font-size: 1.75rem;
  }

  .landing__card {
    padding: 0.875rem 1rem;
  }
}
</style>
