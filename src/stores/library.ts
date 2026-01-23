import { defineStore } from 'pinia';
import type { InterventionDef, InterventionKey } from '@/types';
import { INTERVENTIONS } from '@physim/core';

interface LibraryState {
  defs: InterventionDef[];
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    defs: [...INTERVENTIONS],
  }),
  actions: {
    addDef(def: InterventionDef) {
      this.defs.push(def);
    },
    updateDef(key: InterventionKey, patch: Partial<InterventionDef>) {
      const idx = this.defs.findIndex((def) => def.key === key);
      if (idx >= 0) this.defs[idx] = { ...this.defs[idx], ...patch };
    },
    removeDef(key: InterventionKey) {
      this.defs = this.defs.filter((def) => def.key !== key);
    },
  },
});
