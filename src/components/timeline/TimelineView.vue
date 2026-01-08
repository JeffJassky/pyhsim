<template>
  <div class="timeline-container">
    <div ref="container" class="timeline-vis" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { DataSet } from 'vis-data';
import { Timeline as VisTimeline, type TimelineOptions } from 'vis-timeline/standalone';
import '@/assets/vis-timeline.css';
import type { Minute, TimelineItem, UUID } from '@/types';

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
}>();

const container = ref<HTMLDivElement | null>(null);
let timeline: VisTimeline | null = null;
let dataset: DataSet<any> | null = null;
let playheadId = 'playhead-marker';

const tagPlayheadElement = () => {
  if (!container.value) return;
  const el = container.value.querySelector(`.vis-custom-time[data-custom-time="${playheadId}"]`);
  el?.classList.add('playhead-marker');
};

const toVisItems = (items: TimelineItem[]) =>
  items.map((item) => ({
    id: item.id,
    content: item.content ?? item.meta.labelOverride ?? item.meta.key,
    start: item.start,
    end: item.end,
    type: item.type,
    className: item.meta.locked ? 'timeline-item--locked' : undefined,
  }));

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

const updatePlayhead = (minute: number) => {
  if (!timeline) return;
  const time = new Date();
  time.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  let hasMarker = true;
  try {
    timeline.getCustomTime(playheadId);
  } catch {
    hasMarker = false;
  }
  if (!hasMarker) {
    timeline.addCustomTime(time, playheadId);
  } else {
    timeline.setCustomTime(time, playheadId);
  }
  tagPlayheadElement();
  timeline.setCustomTimeTitle(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), playheadId);
};

const getDayBounds = () => {
  const baseDate = props.dateIso ? new Date(props.dateIso + 'T00:00:00') : new Date();
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  // Offset by dayStartMin
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
    stack: false,
    selectable: true,
    multiselect: false,
    orientation: 'top',
    start,
    end,
    min: start,
    max: end,
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
  };
};

const initTimeline = () => {
  if (!container.value) return;
  dataset = new DataSet(toVisItems(props.items));
  timeline = new VisTimeline(container.value, dataset, options());
  timeline.on('select', (event) => {
    const id = (event.items?.[0] as UUID) || undefined;
    if (!id) return;
    emit('select', id);
  });
  const onTimeEvent = (event: any) => {
    if (event.id !== playheadId) return;
    const minute = event.time.getHours() * 60 + event.time.getMinutes();
    emit('playhead', minute as Minute);
  };
  timeline.on('timechange', onTimeEvent);
  timeline.on('timechanged', onTimeEvent);
  const shouldHandlePlayheadClick = (event: any) => {
    return event.what === 'background' || event.what === 'axis';
  };

  timeline.on('click', (event: any) => {
    if (!event.time || !shouldHandlePlayheadClick(event)) return;
    const minute = (event.time.getHours() * 60 + event.time.getMinutes()) as Minute;
    emit('playhead', minute);
  });
  if (props.selectedId) setSelection(props.selectedId);
  updatePlayhead(props.playheadMin);
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
  () => props.playheadMin,
  (minute) => updatePlayhead(minute),
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
}

.timeline-vis :deep(.vis-item .vis-item-content) {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-vis :deep(.vis-item .vis-item-content > *) {
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

.timeline-vis :deep(.vis-current-time),
.timeline-vis :deep(.vis-custom-time) {
  background: linear-gradient(180deg, #f8fafc 0%, rgba(248, 250, 252, 0.4) 100%);
  width: 2px;
}

.timeline-vis :deep(.vis-custom-time) {
  box-shadow: 0 0 12px rgba(248, 250, 252, 0.35);
}

.timeline-vis :deep(.vis-custom-time.playhead-marker) {
  pointer-events: none;
}
</style>
