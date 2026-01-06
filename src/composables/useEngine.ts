import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useEngineStore } from '@/stores/engine';
import { useTimelineStore } from '@/stores/timeline';
import { useLibraryStore } from '@/stores/library';
import { useProfilesStore } from '@/stores/profiles';

export const useEngine = () => {
  const engine = useEngineStore();
  const timeline = useTimelineStore();
  const library = useLibraryStore();
  const profiles = useProfilesStore();

  const compute = () => engine.recompute({ items: timeline.items, defs: library.defs });

  watch(
    () => [timeline.items, engine.gridStepMin],
    () => compute(),
    { deep: true, immediate: true }
  );
  watch(
    () => [profiles.profiles, profiles.subject],
    () => compute(),
    { deep: true }
  );

  return {
    ...storeToRefs(engine),
    profiles: storeToRefs(profiles),
    compute,
  };
};
