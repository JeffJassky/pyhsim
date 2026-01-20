import { defineStore } from 'pinia';
import type { Minute, UIState, UUID } from '@/types';
import { toMinute } from '@/utils/time';

interface UIStoreState extends UIState {}

export const useUIStore = defineStore('ui', {
  state: (): UIStoreState => ({
    playheadMin: toMinute(8),
    isScrubbing: false,
    zoomHours: 6,
    theme: 'system' as 'system' | 'light' | 'dark',
    compareScenarioId: undefined,
    profileModalOpen: false,
    targetsModalOpen: false,
    tourActive: false,
    tourStep: 0,
  }),
  getters: {
    resolvedTheme(state) {
      if (state.theme !== 'system') return state.theme;
      if (typeof window === 'undefined') return 'dark';
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
  },
  actions: {
    setProfileModalOpen(open: boolean) {
      this.profileModalOpen = open;
    },
    setTargetsModalOpen(open: boolean) {
      this.targetsModalOpen = open;
    },
    setTourActive(active: boolean) {
      this.tourActive = active;
    },
    setTourStep(step: number) {
      this.tourStep = step;
    },
    setPlayhead(minute: Minute) {
      this.playheadMin = minute;
    },
    setScrubbing(flag: boolean) {
      this.isScrubbing = flag;
    },
    setZoom(hours: number) {
      this.zoomHours = hours;
    },
    setTheme(theme: UIState['theme']) {
      this.theme = theme;
    },
    setCompareScenario(id?: UUID) {
      this.compareScenarioId = id;
    },
  },
});
