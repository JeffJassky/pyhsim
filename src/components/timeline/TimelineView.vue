<template>
  <div class="timeline-container" @mousemove="handleMouseMove" @mouseleave="hoverMinute = null">
    <div ref="container" class="timeline-vis" />
    
    <!-- Hover Playhead -->
    <div 
      v-if="hoverMinute !== null" 
      class="playhead-line hover-line" 
      :style="{ left: `${getMinutePercent(hoverMinute)}%` }"
    >
      <button class="playhead-add-btn hover-add-btn" @click="handlePlayheadAdd(hoverMinute)">
        <span class="btn-icon">+</span>
        <span class="btn-label">Add Item</span>
      </button>
    </div>

    <!-- Active Playhead -->
    <div 
      class="playhead-line active-line" 
      :style="{ left: `${getMinutePercent(playheadMin)}%` }"
    >
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, h, render, withDirectives } from 'vue';
import { DataSet } from 'vis-data';
import { Timeline as VisTimeline, type TimelineOptions } from 'vis-timeline/standalone';
import { VTooltip } from 'floating-vue';
import '@/assets/vis-timeline.css';
import type { Minute, TimelineItem, UUID } from '@/types';
import { useLibraryStore } from '@/stores/library';

const props = withDefaults(
  defineProps<{
    items: TimelineItem[];
    selectedId?: UUID;
    editable?: boolean;
    zoomHours?: number;
    playheadMin: Minute;
    dateIso?: string; // YYYY-MM-DD to anchor the visible window
    dayStartMin?: number; // Minute of day where the view starts (e.g., 420 for 7 AM)
  }>(),
  { editable: true, zoomHours: 6, dayStartMin: 0 }
);

const emit = defineEmits<{
  select: [UUID | undefined];
  remove: [UUID];
  update: [{ id: UUID; start: string; end: string }];
  playhead: [Minute];
  triggerAdd: [Minute];
}>();

const container = ref<HTMLDivElement | null>(null);
const hoverMinute = ref<number | null>(null);
let timeline: VisTimeline | null = null;
let dataset: DataSet<any> | null = null;
const library = useLibraryStore();

const MINUTES_IN_DAY = 24 * 60;

const getMinutePercent = (minute: number) => {
  const offset = ((minute - props.dayStartMin + MINUTES_IN_DAY) % MINUTES_IN_DAY);
  return (offset / MINUTES_IN_DAY) * 100;
};

const handleMouseMove = (event: MouseEvent) => {
  if (!timeline || !container.value) return;
  const props = timeline.getEventProperties(event);
  if (props.time) {
    const m = props.time.getHours() * 60 + props.time.getMinutes();
    hoverMinute.value = m;
  }
};

const handlePlayheadAdd = (m: number) => {
  emit('triggerAdd', m as Minute);
};

const toVisItems = (items: TimelineItem[]) =>
  items.map((item) => {
    const def = library.defs.find((d) => d.key === item.meta.key);
    const icon = def?.icon ? `${def.icon} ` : '';
    const label = item.content ?? item.meta.labelOverride ?? def?.label ?? item.meta.key;
    return {
      id: item.id,
      content: `${icon}${label}`,
      start: item.start,
      end: item.end,
      type: item.type,
      _tooltip: label,
      className: item.meta.locked ? 'timeline-item--locked' : undefined,
    };
  });

const syncItems = () => {
  if (!dataset) return;
  const selectedId = props.selectedId;
  dataset.clear();
  dataset.add(toVisItems(props.items));
  if (selectedId) {
    nextTick(() => setSelection(selectedId));
  }
};

const toISO = (value: any) => new Date(value).toISOString();

const setSelection = (id?: UUID) => {
  if (!timeline) return;
  if (id) timeline.setSelection(id);
  else timeline.setSelection([]);
};

const getDayBounds = () => {
  const baseDate = props.dateIso ? new Date(props.dateIso + 'T00:00:00') : new Date();
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const startHours = Math.floor(props.dayStartMin / 60);
  const startMins = props.dayStartMin % 60;
  start.setHours(startHours, startMins, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const options = (): TimelineOptions => {
  const { start, end } = getDayBounds();
  return {
    stack: true,
    selectable: true,
    multiselect: false,
    orientation: 'top',
    start,
    end,
    min: start,
    max: end,
    showCurrentTime: false,
    format: {
      minorLabels: {
        minute: 'h:mm A',
        hour: 'h A',
        day: 'ddd h A',
      },
      majorLabels: {
        minute: 'MMM D',
        hour: 'MMM D',
        day: 'MMMM YYYY',
      },
    },
    zoomable: false,
    moveable: false,
    editable: props.editable
      ? {
          updateTime: true,
          overrideItems: false,
        }
      : false,
    onMove: (item, callback) => {
      emit('update', {
        id: item.id as UUID,
        start: toISO(item.start),
        end: toISO(item.end ?? item.start),
      });
      callback(item);
    },
    onRemove: (item, callback) => {
      emit('remove', item.id as UUID);
      callback(item);
    },
    template: (item: any, element: any, data: any) => {
      const container = document.createElement('div');
      
      const vnode = h('div', {
        innerHTML: item.content,
        style: { width: '100%', height: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
      });
      
      const tooltip = item._tooltip;
      if (tooltip) {
        const vnWithTooltip = withDirectives(vnode, [[VTooltip, {
          content: tooltip,
          placement: 'top',
          theme: 'tooltip'
        }]]);
        render(vnWithTooltip, container);
      } else {
        render(vnode, container);
      }
      
      return container;
    },
  };
};

const initTimeline = () => {
  if (!container.value) return;
  dataset = new DataSet(toVisItems(props.items));
  timeline = new VisTimeline(container.value, dataset, options());
  timeline.on('select', (event) => {
    const id = (event.items?.[0] as UUID) || undefined;
    emit('select', id);
  });
  
  const shouldHandlePlayheadClick = (event: any) => {
    return event.what === 'background' || event.what === 'axis';
  };

  timeline.on('click', (event: any) => {
    if (!event.time || !shouldHandlePlayheadClick(event)) return;
    const minute = (event.time.getHours() * 60 + event.time.getMinutes()) as Minute;
    emit('playhead', minute);
  });
  if (props.selectedId) setSelection(props.selectedId);
};

onMounted(() => {
  initTimeline();
});

onBeforeUnmount(() => {
  timeline?.destroy();
  timeline = null;
  dataset = null;
});

watch(
  () => props.items,
  () => {
    syncItems();
  },
  { deep: true }
);

watch(
  () => props.selectedId,
  (id) => setSelection(id),
  { immediate: true }
);

watch(
  () => props.editable,
  () => {
    timeline?.setOptions(options());
  }
);

watch(
  () => props.dateIso,
  () => {
    timeline?.setOptions(options());
  }
);

watch(
  () => props.dayStartMin,
  () => {
    timeline?.setOptions(options());
  }
);
</script>

<style scoped>
.timeline-container {
  position: relative;
  border-radius: 16px;
}

.timeline-vis {
  border-radius: 14px;
  overflow: hidden;
}

.timeline-vis :deep(.vis-timeline) {
  border: none;
  background: rgba(32, 53, 95, 0.85);
  border-radius: 14px;
}

.timeline-vis :deep(.vis-panel) {
  background: transparent;
}

.timeline-vis :deep(.vis-item) {
  border: none;
  border-radius: 12px;
  padding: 6px;
  font-weight: 600;
  color: #f8fafc;
  background: rgba(96, 165, 250, 0.2);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.5);
  min-width: 50px;
  overflow: hidden;
  transition: left 0.2s ease, right 0.2s ease, width 0.2s ease, top 0.2s ease;
}

.timeline-vis :deep(.vis-item .vis-item-content) {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-vis :deep(.vis-item.timeline-item--locked) {
  opacity: 0.65;
  background: rgba(226, 232, 240, 0.18);
}

.timeline-vis :deep(.vis-item.vis-selected) {
  box-shadow: 0 0 0 2px rgba(125, 211, 252, 0.7), 0 10px 25px rgba(14, 165, 233, 0.4);
}

.timeline-vis :deep(.vis-time-axis .vis-grid) {
  border-color: rgba(248, 250, 252, 0.05);
}

.timeline-vis :deep(.vis-time-axis .vis-text) {
  color: rgba(248, 250, 252, 0.65);
  font-weight: 500;
}

.playhead-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  pointer-events: none;
  z-index: 10;
  transition: left 0.1s linear;
}

.active-line {
  background: linear-gradient(180deg, #f8fafc 0%, rgba(248, 250, 252, 0.4) 100%);
  box-shadow: 0 0 12px rgba(248, 250, 252, 0.35);
}

.hover-line {
  background: rgba(255, 255, 255, 0.25);
  width: 1px;
}

.playhead-add-btn {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 20px;
  background: #8fbf5f;
  color: black;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: width 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s ease, box-shadow 0.2s ease;
  line-height: 1;
  padding: 0;
  pointer-events: auto;
  overflow: hidden;
  white-space: nowrap;
}

.btn-icon {
  flex-shrink: 0;
}

.btn-label {
  display: inline-block;
  max-width: 0;
  opacity: 0;
  font-size: 0.75rem;
  font-weight: 700;
  transition: max-width 0.25s ease, opacity 0.2s ease, margin 0.2s ease;
  overflow: hidden;
}

.playhead-add-btn:hover {
  width: 90px;
  background: #a3d977;
  box-shadow: 0 0 15px rgba(143, 191, 95, 0.6);
}

.playhead-add-btn:hover .btn-label {
  max-width: 60px;
  opacity: 1;
  margin-left: 4px;
}

.hover-add-btn {
  opacity: 0.6;
}

.hover-line:hover .hover-add-btn {
  opacity: 1;
}
</style>