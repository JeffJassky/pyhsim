<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';
import { computed, ref, nextTick } from 'vue';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

// Import the markdown content as a raw string
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

interface TocItem {
  id: string;
  title: string;
  level: number;
}

const parsedData = computed(() => {
  const tokens = md.parse(reportContent, {});
  const toc: TocItem[] = [];

  tokens.forEach((token, index) => {
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1));
      if (level >= 2 && level <= 3) {
        const inline = tokens[index + 1];
        if (inline && inline.content) {
          const title = inline.content;
          const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
          
          token.attrSet('id', slug);
          toc.push({ id: slug, title, level });
        }
      }
    }
  });

  return {
    html: md.renderer.render(tokens, md.options, {}),
    toc
  };
});

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

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

          <div class="science-layout">
            <aside class="science-toc">
              <div class="toc-sticky">
                <h4 class="toc-header">Contents</h4>
                <nav class="toc-nav">
                  <a
                    v-for="item in parsedData.toc"
                    :key="item.id"
                    :href="`#${item.id}`"
                    class="toc-link"
                    :class="`toc-level-${item.level}`"
                    @click.prevent="scrollToId(item.id)"
                  >
                    {{ item.title }}
                  </a>
                </nav>
              </div>
            </aside>

            <div
              class="modal-body markdown-body selectable"
              v-html="parsedData.html"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.science-content {
  max-width: 1100px; /* Increased width for sidebar */
  height: 90vh; /* Fixed height for sticky behavior */
}

.science-layout {
  display: flex;
  height: 100%;
  overflow: hidden; /* Prevent double scrollbars */
}

.science-toc {
  width: 260px;
  flex-shrink: 0;
  background: var(--color-bg-subtle);
  border-right: 1px solid var(--color-border-subtle);
  overflow-y: auto;
  padding: 3.5rem 1.5rem 2rem;
  display: none; /* Hidden on mobile by default */
}

@media (min-width: 800px) {
  .science-toc {
    display: block;
  }
}

.toc-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin: 0 0 1rem 0;
  font-weight: 800;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toc-link {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 0.25rem 0;
  border-left: 2px solid transparent;
  padding-left: 0.75rem;
  transition: all 0.2s;
  line-height: 1.4;
}

.toc-link:hover {
  color: var(--color-text-primary);
  border-left-color: var(--color-border-default);
}

.toc-level-3 {
  padding-left: 1.75rem;
  font-size: 0.8rem;
  opacity: 0.9;
}

.science-content :deep(.modal-body) {
  padding: 3.5rem 4rem 4rem;
  flex: 1;
  overflow-y: auto; /* Scrollable content area */
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
  scroll-margin-top: 2rem; /* Spacing for scroll jump */
}

:deep(.markdown-body h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  scroll-margin-top: 2rem;
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

@media (max-width: 800px) {
  .science-content :deep(.modal-body) {
    padding: 2.5rem 1.5rem 2rem;
  }
}
</style>
