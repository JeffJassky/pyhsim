import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useEngineStore } from '@/stores/engine';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';
import { useUserStore } from '@/stores/user';

export const useEngine = () => {
  const engine = useEngineStore();
  const timeline = useTimelineStore();
  const library = useLibraryStore();
  const user = useUserStore();

  const compute = () => engine.recompute({ items: timeline.items, defs: library.defs });

  watch(
    () => [timeline.items, engine.gridStepMin],
    () => compute(),
    { deep: true, immediate: true }
  );
  watch(
    () => [user.conditions, user.subject],
    () => compute(),
    { deep: true }
  );

  return {
    ...storeToRefs(engine),
    user: storeToRefs(user),
    compute,
  };
};
