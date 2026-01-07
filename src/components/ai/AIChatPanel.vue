<template>
  <Panel title="Bio-Pilot" icon="🤖" class="ai-chat-panel">
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="msg in aiStore.messages"
        :key="msg.id"
        class="message"
        :class="`message--${msg.role}`"
      >
        <div class="message__content">
          {{ msg.content }}
        </div>
        <div class="message__meta">
          {{ formatTime(msg.timestamp) }}
        </div>
      </div>
      <div v-if="aiStore.isGenerating" class="message message--assistant">
        <div class="message__content typing-indicator">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
    <form @submit.prevent="handleSubmit" class="chat-input">
      <input
        v-model="input"
        type="text"
        placeholder="Ask anything..."
        :disabled="aiStore.isGenerating"
      />
      <button type="submit" :disabled="!input.trim() || aiStore.isGenerating">
        ➤
      </button>
    </form>
  </Panel>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import Panel from '@/components/core/Panel.vue';
import { useAIStore } from '@/stores/ai';

const aiStore = useAIStore();
const input = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const handleSubmit = () => {
  if (!input.value.trim()) return;
  aiStore.sendMessage(input.value);
  input.value = '';
};

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

watch(() => aiStore.messages.length, scrollToBottom);
onMounted(scrollToBottom);
</script>

<style scoped>
.ai-chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Override Panel's body to fill height */
:deep(.panel__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.5rem;
  margin-bottom: 1rem;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 90%;
  font-size: 0.9rem;
}

.message--user {
  align-self: flex-end;
  align-items: flex-end;
}

.message--assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.message__content {
  padding: 0.75rem;
  border-radius: 12px;
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.05);
}

.message--user .message__content {
  background: rgba(50, 101, 219, 0.2);
  border: 1px solid rgba(50, 101, 219, 0.3);
  border-bottom-right-radius: 2px;
}

.message--assistant .message__content {
  background: rgba(255, 255, 255, 0.1);
  border-bottom-left-radius: 2px;
}

.message__meta {
  font-size: 0.7rem;
  opacity: 0.5;
  margin: 0 0.25rem;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: white;
  font-size: 0.9rem;
}

.chat-input input:focus {
  outline: none;
  border-color: rgba(50, 101, 219, 0.5);
}

.chat-input button {
  background: rgba(50, 101, 219, 0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-input button:hover:not(:disabled) {
  background: rgb(50, 101, 219);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  gap: 2px;
}

.typing-indicator span {
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
