<template>
  <Panel title="Bio-Pilot" icon="🤖" class="ai-chat-panel">
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="msg in aiStore.messages"
        :key="msg.id"
        class="message"
        :class="`message--${msg.role}`"
      >
        <div
          class="message__content markdown-body"
          v-html="renderMarkdown(msg.content || '')"
        ></div>
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
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true
});

// Configure links to open in new tab
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Add target="_blank"
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    tokens[idx].attrs![aIndex][1] = '_blank';
  }

  // Add rel="noopener noreferrer" for security
  const relIndex = tokens[idx].attrIndex('rel');
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  } else {
    tokens[idx].attrs![relIndex][1] = 'noopener noreferrer';
  }

  return defaultRender(tokens, idx, options, env, self);
};

const aiStore = useAIStore();
const input = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const renderMarkdown = (text: string) => {
  return md.render(text);
};

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
  background: rgba(18, 22, 32, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem 1.5rem;
}

/* Style the Panel header */
:deep(.panel__header) {
  padding-bottom: 0.75rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

:deep(.panel__title h3) {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  opacity: 1;
  color: #f0f0f5;
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
  word-wrap: break-word;
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

/* Markdown Styles */
:deep(.markdown-body p) {
  margin-bottom: 0.5rem;
}

:deep(.markdown-body p:first-child) {
  margin-top: 0;
}
:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-body a) {
  color: #60a5fa;
  text-decoration: underline;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}

:deep(.markdown-body ul) {
  list-style-type: disc;
}

:deep(.markdown-body ol) {
  list-style-type: decimal;
}

:deep(.markdown-body li) {
  margin-bottom: 0.25rem;
}

:deep(.markdown-body code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1em 0.3em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85em;
}

:deep(.markdown-body pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

:deep(.markdown-body pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4) {
  margin: 1rem 0 0.5rem;
  font-weight: 700;
  line-height: 1.2;
}

:deep(.markdown-body h1) { font-size: 1.4em; }
:deep(.markdown-body h2) { font-size: 1.25em; }
:deep(.markdown-body h3) { font-size: 1.1em; }
:deep(.markdown-body h4) { font-size: 1em; }

:deep(.markdown-body blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding-left: 0.75rem;
  margin-left: 0;
  color: rgba(255, 255, 255, 0.7);
}

:deep(.markdown-body table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.75rem;
  font-size: 0.85em;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.6rem;
  text-align: left;
}

:deep(.markdown-body th) {
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

:deep(.markdown-body img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5rem 0;
}

.message__meta {
  font-size: 0.7rem;
  opacity: 0.5;
  margin: 0 0.25rem;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: auto;
}

.chat-input input {
  flex: 1;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 0.625rem 1rem;
  color: #f0f0f5;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.chat-input input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.chat-input input:focus {
  outline: none;
  border-color: rgba(0, 212, 255, 0.4);
  background: rgba(0, 0, 0, 0.35);
}

.chat-input button {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #050509;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.25);
}

.chat-input button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.35);
}

.chat-input button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
