import type {
  ItemForWorker,
  Minute,
  TimelineItem,
  WorkerComputeRequest,
} from '@/types';

export const toMinuteOfDay = (iso: string): Minute => {
  const date = new Date(iso);
  return (date.getHours() * 60 + date.getMinutes()) as Minute;
};

export const timelineItemToWorker = (item: TimelineItem): ItemForWorker => {
  const startMin = toMinuteOfDay(item.start);
  const endMin = toMinuteOfDay(item.end);
  return {
    id: item.id,
    startMin,
    durationMin: Math.max(1, endMin - startMin),
    meta: item.meta,
  };
};

export function buildWorkerRequest(
  gridMins: Minute[],
  items: TimelineItem[],
  defs: WorkerComputeRequest['defs'],
  base: Partial<WorkerComputeRequest> = {}
): WorkerComputeRequest {
  return {
    gridMins,
    items: items.map(timelineItemToWorker),
    defs,
    options: base.options,
  };
}
