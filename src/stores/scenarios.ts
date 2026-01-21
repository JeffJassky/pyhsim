import { defineStore } from 'pinia';
import type { Scenario, UUID } from '@/types';
import { v4 as uuid } from 'uuid';
import { useTimelineStore } from './timeline';

interface ScenariosState {
  items: Scenario[];
  activeId?: UUID;
}

type ScenarioSnapshot = Pick<Scenario, 'gridStepMin' | 'items' | 'personal' | 'notes'> & {
  name: string;
};

export const useScenariosStore = defineStore('scenarios', {
  state: (): ScenariosState => ({
    items: [],
    activeId: undefined,
  }),
  getters: {
    active(state): Scenario | undefined {
      return state.items.find((scenario) => scenario.id === state.activeId);
    },
  },
  actions: {
    init() {
      if (this.items.length === 0) {
        const timeline = useTimelineStore();
        this.create({
          name: 'Scenario A',
          gridStepMin: 5,
          items: [...timeline.items],
        });
      } else if (!this.activeId) {
        this.activeId = this.items[0].id;
      }
    },
    create(payload: Partial<ScenarioSnapshot>) {
      const now = new Date().toISOString();
      const scenario: Scenario = {
        id: uuid() as UUID,
        name: payload.name || 'New Scenario',
        createdAt: now,
        updatedAt: now,
        gridStepMin: payload.gridStepMin || 5,
        items: payload.items || [],
        personal: payload.personal,
        notes: payload.notes,
      };
      this.items.push(scenario);
      this.activeId = scenario.id;
      return scenario;
    },
    ingest(raw: Scenario) {
      const now = new Date().toISOString();
      const scenario: Scenario = {
        id: uuid() as UUID,
        name: raw.name || `Imported ${new Date().toLocaleString()}`,
        createdAt: raw.createdAt ?? now,
        updatedAt: now,
        gridStepMin: raw.gridStepMin ?? 5,
        items: raw.items ?? [],
        personal: raw.personal,
        notes: raw.notes,
      };
      this.items.push(scenario);
      this.activeId = scenario.id;
      return scenario;
    },
    saveActiveToScenario() {
      if (!this.activeId) return;
      const timeline = useTimelineStore();
      const idx = this.items.findIndex((item) => item.id === this.activeId);
      if (idx !== -1) {
        this.items[idx].items = [...timeline.items];
        this.items[idx].updatedAt = new Date().toISOString();
      }
    },
    setActive(id: UUID) {
      // 1. Save current timeline to active scenario
      this.saveActiveToScenario();

      // 2. Set new active ID
      this.activeId = id;

      // 3. Load new items into timeline store
      const scenario = this.items.find(s => s.id === id);
      if (scenario) {
        const timeline = useTimelineStore();
        timeline.setItems([...scenario.items]);
      }
    },
    update(id: UUID, patch: Partial<Scenario>) {
      const idx = this.items.findIndex((item) => item.id === id);
      if (idx === -1) return;
      this.items[idx] = { ...this.items[idx], ...patch, updatedAt: new Date().toISOString() };
    },
    remove(id: UUID) {
      const wasActive = this.activeId === id;
      this.items = this.items.filter((scenario) => scenario.id !== id);
      if (wasActive) {
        this.activeId = this.items.length > 0 ? this.items[0].id : undefined;
        if (this.activeId) {
          const scenario = this.items.find(s => s.id === this.activeId);
          if (scenario) {
            const timeline = useTimelineStore();
            timeline.setItems([...scenario.items]);
          }
        }
      }
    },
  },
});
