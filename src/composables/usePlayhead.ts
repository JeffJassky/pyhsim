import { computed } from 'vue';
import type { Minute } from '@/types';
import { useUIStore } from '@/stores/ui';

export const usePlayhead = () => {
  const ui = useUIStore();
  const minute = computed(() => ui.playheadMin);
  const setMinute = (value: Minute) => ui.setPlayhead(value);
  const onScrub = (value: Minute) => {
    ui.setScrubbing(true);
    ui.setPlayhead(value);
    requestAnimationFrame(() => ui.setScrubbing(false));
  };
  return { minute, setMinute, onScrub };
};
