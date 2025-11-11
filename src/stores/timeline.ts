import { defineStore } from 'pinia';
import { v4 as uuid } from 'uuid';
import type { InterventionKey, Minute, TimelineItem, TimelineItemMeta, UUID } from '@/types';
import { minuteToISO } from '@/utils/time';

interface TimelineStoreState {
  items: TimelineItem[];
  selectedId?: UUID;
  isDragging?: boolean;
}

const DEFAULT_WAKE_MINUTE: Minute = (7 * 60) as Minute;
const DEFAULT_SLEEP_START_MINUTE: Minute = (23 * 60) as Minute;
const DEFAULT_SLEEP_DURATION_MIN = 8 * 60;

const createRoutineItem = (key: InterventionKey, startMin: number, durationMin: number): TimelineItem => {
  const start = minuteToISO(startMin as Minute);
  const end = minuteToISO((startMin + durationMin) as Minute);
  return {
    id: uuid() as UUID,
    start,
    end,
    type: 'range',
    meta: {
      key,
      params: {},
      intensity: 1,
    },
  };
};

const createDefaultRoutineItems = (): TimelineItem[] => [
  createRoutineItem('wake', DEFAULT_WAKE_MINUTE, 15),
  createRoutineItem('sleep', DEFAULT_SLEEP_START_MINUTE, DEFAULT_SLEEP_DURATION_MIN),
];

export const useTimelineStore = defineStore('timeline', {
  state: (): TimelineStoreState => ({
    items: createDefaultRoutineItems(),
    selectedId: undefined,
    isDragging: false,
  }),
  actions: {
    ensureRoutineAnchors() {
      const hasWake = this.items.some((it) => it.meta.key === 'wake');
      if (!hasWake) {
        this.items.push(createRoutineItem('wake', DEFAULT_WAKE_MINUTE, 15));
      }
      const hasSleep = this.items.some((it) => it.meta.key === 'sleep');
      if (!hasSleep) {
        this.items.push(createRoutineItem('sleep', DEFAULT_SLEEP_START_MINUTE, DEFAULT_SLEEP_DURATION_MIN));
      }
    },
    addItem(start: string, end: string, meta: TimelineItemMeta) {
      const item: TimelineItem = {
        id: uuid() as UUID,
        start,
        end,
        type: 'range',
        meta,
      };
      this.items.push(item);
      this.selectedId = item.id;
    },
    updateItem(id: UUID, patch: Partial<TimelineItem>) {
      const idx = this.items.findIndex((it) => it.id === id);
      if (idx === -1) return;
      this.items[idx] = { ...this.items[idx], ...patch };
    },
    removeItem(id: UUID) {
      this.items = this.items.filter((it) => it.id !== id);
      if (this.selectedId === id) this.selectedId = undefined;
      this.ensureRoutineAnchors();
    },
    duplicate(id: UUID) {
      const item = this.items.find((it) => it.id === id);
      if (!item) return;
      const copy = { ...item, id: uuid() as UUID };
      this.items.push(copy);
      this.selectedId = copy.id;
    },
    select(id?: UUID) {
      this.selectedId = id;
    },
    setDragging(isDragging: boolean) {
      this.isDragging = isDragging;
    },
    setItems(items: TimelineItem[]) {
      this.items = items;
      this.ensureRoutineAnchors();
    },
  },
});
