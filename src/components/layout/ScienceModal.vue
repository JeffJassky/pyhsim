<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';
import { computed } from 'vue';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

// Import the markdown content as a raw string
// Note: This works in Vite for files outside src as long as they are within the project root
import reportContent from '../../../docs/science.md?raw';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
}).use(mk);

// Configure links to open in new tab
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    tokens[idx].attrs![aIndex][1] = '_blank';
  }
  const relIndex = tokens[idx].attrIndex('rel');
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  } else {
    tokens[idx].attrs![relIndex][1] = 'noopener noreferrer';
  }
  return defaultRender(tokens, idx, options, env, self);
};

const renderedContent = computed(() => {
  return md.render(reportContent);
});

const close = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content science-content">
          <button class="modal-close-btn" @click="close">✕</button>

          <div
            class="modal-body markdown-body selectable"
            v-html="renderedContent"
          ></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.science-content {
  max-width: 900px;
}

.science-content :deep(.modal-body) {
  padding: 3.5rem 4rem 4rem;
}

/* Markdown styling within the modal */
:deep(.markdown-body) {
  font-size: 1.05rem;
  color: var(--color-text-primary);
  line-height: 1.7;
}

:deep(.markdown-body h1) {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

:deep(.markdown-body h2) {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-accent);
  letter-spacing: -0.01em;
}

:deep(.markdown-body h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

:deep(.markdown-body p) {
  margin-bottom: 1.25rem;
  color: var(--color-text-secondary);
}

:deep(.markdown-body ul), :deep(.markdown-body ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
  color: var(--color-text-secondary);
}

:deep(.markdown-body li) {
  margin-bottom: 0.6rem;
}

:deep(.markdown-body li::marker) {
  color: var(--color-accent);
}

:deep(.markdown-body strong) {
  color: var(--color-text-primary);
  font-weight: 600;
}

:deep(.markdown-body a) {
  color: var(--color-active);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

:deep(.markdown-body a:hover) {
  border-bottom-color: var(--color-active);
}

:deep(.markdown-body code) {
  background: var(--color-bg-subtle);
  color: var(--color-metric-primary);
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  border: 1px solid var(--color-border-subtle);
}

:deep(.markdown-body blockquote) {
  border-left: 4px solid var(--color-active);
  background: var(--color-bg-subtle);
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
  border-radius: 0 12px 12px 0;
  font-style: italic;
  color: var(--color-text-primary);
}

:deep(.markdown-body hr) {
  border: none;
  border-top: 1px solid var(--color-border-subtle);
  margin: 3rem 0;
}

:deep(.markdown-body table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
}

:deep(.markdown-body th) {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 2px solid var(--color-border-default);
  color: var(--color-text-primary);
  font-weight: 600;
}

:deep(.markdown-body td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
}

:deep(.markdown-body tr:hover td) {
  background: var(--color-bg-subtle);
}

/* KaTeX specific tweaks */
:deep(.katex-display) {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

:deep(.katex) {
  font-size: 1.1em;
}

@media (max-width: 640px) {
  .science-content :deep(.modal-body) {
    padding: 2.5rem 1.5rem 2rem;
  }
}
</style>
