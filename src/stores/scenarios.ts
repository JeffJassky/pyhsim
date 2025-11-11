import { defineStore } from 'pinia';
import type { Scenario, UUID } from '@/types';
import { v4 as uuid } from 'uuid';

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
    create(payload: ScenarioSnapshot) {
      const now = new Date().toISOString();
      const scenario: Scenario = {
        id: uuid() as UUID,
        name: payload.name,
        createdAt: now,
        updatedAt: now,
        gridStepMin: payload.gridStepMin,
        items: payload.items,
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
    setActive(id: UUID) {
      this.activeId = id;
    },
    update(id: UUID, patch: Partial<Scenario>) {
      const idx = this.items.findIndex((item) => item.id === id);
      if (idx === -1) return;
      this.items[idx] = { ...this.items[idx], ...patch, updatedAt: new Date().toISOString() };
    },
    remove(id: UUID) {
      this.items = this.items.filter((scenario) => scenario.id !== id);
      if (this.activeId === id) this.activeId = undefined;
    },
  },
});
