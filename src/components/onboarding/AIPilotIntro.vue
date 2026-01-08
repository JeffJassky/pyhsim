<template>
  <div class="ai-tutorial">
    <!-- Full studio interface with chat open -->
    <AppShell :show-right-sidebar="true">
      <template #right-sidebar>
        <div ref="chatPanelRef" class="ai-tutorial__chat-wrapper">
          <AIChatPanel />
        </div>
      </template>

      <section class="ai-tutorial__grid">
        <Panel title="" icon="">
          <div class="ai-tutorial__panel-header">
            <h2>Your Day</h2>
          </div>
          <TimelineView
            :items="timeline.items"
            :selected-id="timeline.selectedId"
            :playhead-min="minute"
            :date-iso="timeline.selectedDate"
            :day-start-min="420"
            @select="timeline.select"
            @update="(d) => timeline.updateItem(d.id, { start: d.start, end: d.end })"
            @playhead="setMinute"
          />
          <PlayheadBar :minute="minute" />
        </Panel>

        <Panel title="Charts" icon="">
          <SignalChart
            :grid="gridMins"
            :seriesSpecs="chartSpecs"
            :seriesData="signalSeriesData"
            :playheadMin="minute"
            :interventions="interventionBands"
            :dayStartMin="420"
          />
        </Panel>
      </section>
    </AppShell>

    <!-- Tutorial overlay -->
    <div class="ai-tutorial__overlay" v-if="!hasInteracted">
      <!-- Spotlight mask -->
      <div class="ai-tutorial__mask" :style="spotlightStyle"></div>

      <!-- Instruction card -->
      <div class="ai-tutorial__card" :style="cardStyle">
        <div class="ai-tutorial__card-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.5 9H22L16 14L18.5 21L12 17L5.5 21L8 14L2 9H9.5L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="ai-tutorial__card-content">
          <h3>Meet your co-pilot</h3>
          <p>Ask questions about your simulation, get explanations, or request optimizations. Try one of these:</p>
        </div>

        <div class="ai-tutorial__suggestions">
          <button
            v-for="prompt in suggestedPrompts"
            :key="prompt"
            class="ai-tutorial__suggestion"
            @click="sendPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>

        <button class="ai-tutorial__skip" @click="skipTutorial">
          Skip for now
        </button>
      </div>
    </div>

    <!-- Continue button after interaction -->
    <transition name="fade-up">
      <div v-if="hasInteracted && canContinue" class="ai-tutorial__continue-bar">
        <button class="ai-tutorial__continue-btn" @click="$emit('next')">
          Continue
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import AppShell from '@/components/layout/AppShell.vue';
import Panel from '@/components/core/Panel.vue';
import PlayheadBar from '@/components/core/PlayheadBar.vue';
import TimelineView from '@/components/timeline/TimelineView.vue';
import SignalChart from '@/components/charts/SignalChart.vue';
import AIChatPanel from '@/components/ai/AIChatPanel.vue';

import { useTimelineStore } from '@/stores/timeline';
import { useEngine } from '@/composables/useEngine';
import { usePlayhead } from '@/composables/usePlayhead';
import { useAIStore } from '@/stores/ai';
import { useOnboardingStore } from '@/stores/onboarding';
import { toMinuteOfDay } from '@/core/serialization';
import type { ChartSeriesSpec } from '@/types';

const emit = defineEmits(['next']);

const timeline = useTimelineStore();
const engine = useEngine();
const { minute, setMinute } = usePlayhead();
const { gridMins, series } = engine;
const aiStore = useAIStore();
const onboardingStore = useOnboardingStore();

const hasInteracted = ref(false);
const canContinue = ref(false);
const chatPanelRef = ref<HTMLElement | null>(null);

// Chart specs for display
const chartSpecs = ref<ChartSeriesSpec[]>([
  { key: 'energy', label: 'Energy', tendency: 'higher', yMin: 0, yMax: 100, color: '#fbbf24' },
  { key: 'cortisol', label: 'Cortisol', tendency: 'neutral', yMin: 0, yMax: 20, color: '#f97316' }
]);

const signalSeriesData = computed(() => {
  const result: Record<string, number[]> = {};
  if (!series.value) return result;
  for (const [key, data] of Object.entries(series.value)) {
    result[key] = data ? Array.from(data) : [];
  }
  return result;
});

const interventionBands = computed(() =>
  timeline.items.map((item) => ({
    key: item.id,
    start: toMinuteOfDay(item.start),
    end: toMinuteOfDay(item.end),
    color: 'rgba(255,255,255,0.1)',
  }))
);

// Suggested prompts based on goal
const suggestedPrompts = computed(() => {
  const goal = onboardingStore.quickProfile.primaryGoal;
  if (goal === 'energy') return ["Why do I crash at 2pm?", "How can I boost morning energy?"];
  if (goal === 'sleep') return ["How do I fall asleep faster?", "What's hurting my sleep?"];
  if (goal === 'focus') return ["When's my best focus window?", "Does coffee help or hurt?"];
  if (goal === 'mood') return ["What affects my mood?", "How can I reduce anxiety?"];
  return ["What can you help with?", "Explain my energy curve"];
});

// Spotlight positioning
const chatRect = ref({ top: 0, left: 0, width: 0, height: 0 });

async function updateSpotlight() {
  await nextTick();
  const el = chatPanelRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      chatRect.value = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    }
  }
}

const spotlightStyle = computed(() => ({
  '--spotlight-top': `${chatRect.value.top}px`,
  '--spotlight-left': `${chatRect.value.left}px`,
  '--spotlight-width': `${chatRect.value.width}px`,
  '--spotlight-height': `${chatRect.value.height}px`,
}));

const cardStyle = computed(() => {
  const rect = chatRect.value;
  if (rect.width === 0) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  // Position card to the left of the chat panel
  return {
    top: `${rect.top + 60}px`,
    right: `${rect.width + 40}px`,
  };
});

function sendPrompt(text: string) {
  hasInteracted.value = true;
  aiStore.sendMessage(text);
}

function skipTutorial() {
  hasInteracted.value = true;
  canContinue.value = true;
}

// Initialize AI with intro message
onMounted(() => {
  aiStore.messages = [];
  setTimeout(() => {
    aiStore.messages.push({
      id: 'intro-msg',
      role: 'assistant',
      content: "I'm your biological co-pilot. Ask me anything about your simulation, and I'll explain what's happening or suggest optimizations.",
      timestamp: Date.now()
    });
  }, 300);

  // Update spotlight position
  setTimeout(updateSpotlight, 100);
  window.addEventListener('resize', updateSpotlight);
});

// Watch for AI response to enable continue
watch(() => aiStore.messages.length, (len) => {
  if (len > 2 && hasInteracted.value) {
    // User sent message and got response
    setTimeout(() => {
      canContinue.value = true;
    }, 1500);
  }
});
</script>

<style scoped>
.ai-tutorial {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #0a0a12;
}

.ai-tutorial__grid {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.ai-tutorial__panel-header {
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.ai-tutorial__panel-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #f0f0f5;
  margin: 0;
}

.ai-tutorial__chat-wrapper {
  height: 100%;
  position: relative;
  z-index: 10003;
}

/* Overlay */
.ai-tutorial__overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.ai-tutorial__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  /* Spotlight on chat panel */
  mask-image: radial-gradient(
    ellipse calc(var(--spotlight-width) * 0.6) calc(var(--spotlight-height) * 0.55) at
    calc(var(--spotlight-left) + var(--spotlight-width) / 2)
    calc(var(--spotlight-top) + var(--spotlight-height) / 2),
    transparent 80%,
    black 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse calc(var(--spotlight-width) * 0.6) calc(var(--spotlight-height) * 0.55) at
    calc(var(--spotlight-left) + var(--spotlight-width) / 2)
    calc(var(--spotlight-top) + var(--spotlight-height) / 2),
    transparent 80%,
    black 100%
  );
}

/* Instruction card */
.ai-tutorial__card {
  position: absolute;
  width: 320px;
  background: rgba(20, 20, 35, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  backdrop-filter: blur(20px);
  pointer-events: auto;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.ai-tutorial__card-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d4ff;
}

.ai-tutorial__card-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f0f0f5;
  margin: 0 0 0.5rem;
}

.ai-tutorial__card-content p {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #8888a0;
  margin: 0;
}

/* Suggestions */
.ai-tutorial__suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ai-tutorial__suggestion {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  color: #00d4ff;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-tutorial__suggestion:hover {
  background: rgba(0, 212, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.4);
  transform: translateX(4px);
}

.ai-tutorial__skip {
  background: transparent;
  border: none;
  color: #555570;
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-top: 0.25rem;
  transition: color 0.2s ease;
  align-self: center;
}

.ai-tutorial__skip:hover {
  color: #8888a0;
}

/* Continue bar */
.ai-tutorial__continue-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(to top, rgba(10, 10, 18, 0.98), rgba(10, 10, 18, 0.9), transparent);
  display: flex;
  justify-content: center;
  z-index: 100;
}

.ai-tutorial__continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  color: #050509;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.35);
}

.ai-tutorial__continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 212, 255, 0.45);
}

/* Transitions */
.fade-up-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile - hide overlay on small screens, just show interface */
@media (max-width: 900px) {
  .ai-tutorial__overlay {
    display: none;
  }

  .ai-tutorial__continue-bar {
    padding: 1rem;
  }
}
</style>
