import { defineStore } from 'pinia';
import type { Minute, PanelSizes, UIState, UUID } from '@/types';
import { toMinute } from '@/utils/time';

const PANEL_LAYOUT_KEY = 'physim-panel-layout';
const THEME_KEY = 'physim-theme';

const DEFAULT_PANEL_SIZES: PanelSizes = {
  timeline: 35,
  charts: 65,
  chatWidth: 25,
};

function loadPanelSizes(): PanelSizes {
  if (typeof window === 'undefined') return { ...DEFAULT_PANEL_SIZES };
  try {
    const stored = localStorage.getItem(PANEL_LAYOUT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        timeline: parsed.timeline ?? DEFAULT_PANEL_SIZES.timeline,
        charts: parsed.charts ?? DEFAULT_PANEL_SIZES.charts,
        chatWidth: parsed.chatWidth ?? DEFAULT_PANEL_SIZES.chatWidth,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_PANEL_SIZES };
}

function savePanelSizes(sizes: PanelSizes): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(sizes));
  } catch {
    // ignore storage errors
  }
}

function loadTheme(): UIState['theme'] {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore parse errors
  }
  return 'system';
}

function saveTheme(theme: UIState['theme']): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

interface UIStoreState extends UIState {}

export const useUIStore = defineStore('ui', {
  state: (): UIStoreState => ({
    playheadMin: toMinute(8),
    isScrubbing: false,
    zoomHours: 6,
    theme: loadTheme(),
    compareScenarioId: undefined,
    profileModalOpen: false,
    targetsModalOpen: false,
    tourActive: false,
    tourStep: 0,
    panelSizes: loadPanelSizes(),
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
      saveTheme(theme);
    },
    setCompareScenario(id?: UUID) {
      this.compareScenarioId = id;
    },
    setPanelSizes(sizes: Partial<PanelSizes>) {
      this.panelSizes = { ...this.panelSizes, ...sizes };
      savePanelSizes(this.panelSizes);
    },
  },
});
