import { defineStore } from 'pinia';
import type { InterventionDef, InterventionKey } from '@/types';
import { INTERVENTIONS } from '@kyneticbio/core';

interface LibraryState {
  defs: InterventionDef[];
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    defs: [...INTERVENTIONS],
  }),
  getters: {
    defsMap: (state): Map<string, InterventionDef> =>
      new Map(state.defs.map((d) => [d.key, d])),
  },
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
