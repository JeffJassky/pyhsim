import { defineStore } from 'pinia';
import type { ConditionKey, ConditionStateSnapshot } from '@/models/registry/conditions';
import { CONDITION_LIBRARY } from '@/models';
import { getAllUnifiedDefinitions } from '@/models/engine';
import { DEFAULT_SUBJECT, DEFAULT_NUTRITION_TARGETS, type Subject, type NutritionTargets } from '@/models/domain/subject';
import { GOAL_CATEGORIES } from '@/models/domain/goals';
import { SIGNALS_ALL, type Signal, type Goal } from '@/types';

const STORAGE_KEY = 'physim:user';
const UNIFIED_DEFS = getAllUnifiedDefinitions();

export interface UserStoreState {
  conditions: Record<ConditionKey, ConditionStateSnapshot>;
  subject: Subject;
  nutritionTargets: NutritionTargets;
  selectedGoals: Goal[];
  enabledSignals: Record<Signal, boolean>;
  signalOrder: Signal[];
  subscriptionTier: 'free' | 'premium';
}

const loadPersisted = (): Partial<UserStoreState> | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const persisted = loadPersisted();

export const useUserStore = defineStore('user', {
  state: (): UserStoreState => ({
    conditions: CONDITION_LIBRARY.reduce((acc, condition) => {
      acc[condition.key] = {
        enabled: persisted?.conditions?.[condition.key]?.enabled ?? false,
        params: {
          ...Object.fromEntries(condition.params.map((p) => [p.key, p.default])),
          ...(persisted?.conditions?.[condition.key]?.params || {}),
        },
      };
      return acc;
    }, {} as Record<ConditionKey, ConditionStateSnapshot>),
    subject: { ...DEFAULT_SUBJECT, ...(persisted?.subject || {}) },
    nutritionTargets: {
      ...DEFAULT_NUTRITION_TARGETS,
      ...(persisted?.nutritionTargets || {}),
      macros: {
        ...DEFAULT_NUTRITION_TARGETS.macros,
        ...(persisted?.nutritionTargets?.macros || {}),
      },
    },
    selectedGoals: persisted?.selectedGoals || [],
    enabledSignals: SIGNALS_ALL.reduce((acc, sig) => {
      const def = UNIFIED_DEFS[sig];
      const defaultEnabled = def ? !def.isPremium : true;
      acc[sig] = persisted?.enabledSignals?.[sig] ?? defaultEnabled;
      return acc;
    }, {} as Record<Signal, boolean>),
    signalOrder: [...(persisted?.signalOrder || SIGNALS_ALL)],
    subscriptionTier: persisted?.subscriptionTier ?? 'free',
  }),
  actions: {
    persist() {
      if (typeof localStorage === 'undefined') return;
      const payload = {
        conditions: this.conditions,
        subject: this.subject,
        nutritionTargets: this.nutritionTargets,
        selectedGoals: this.selectedGoals,
        enabledSignals: this.enabledSignals,
        signalOrder: this.signalOrder,
        subscriptionTier: this.subscriptionTier,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    setSubscriptionTier(tier: 'free' | 'premium') {
      this.subscriptionTier = tier;
      this.persist();
    },
    updateSignalOrder(newOrder: Signal[]) {
      // Merge new order with any missing signals to ensure SIGNALS_ALL is covered
      const orderSet = new Set(newOrder);
      const missing = SIGNALS_ALL.filter(s => !orderSet.has(s));
      this.signalOrder = [...newOrder, ...missing];
      this.persist();
    },
    toggleGoal(goalId: Goal) {
      const idx = this.selectedGoals.indexOf(goalId);
      const isRemoving = idx >= 0;

      if (isRemoving) {
        this.selectedGoals.splice(idx, 1);
      } else {
        this.selectedGoals.push(goalId);
      }

      // Sync signals: enable if goal added, disable if goal removed (and not needed elsewhere)
      const nextEnabled = { ...this.enabledSignals };
      
      const goalCategory = GOAL_CATEGORIES.find(g => g.id === goalId);
      const signalsToToggle = goalCategory?.signals || [];

      signalsToToggle.forEach((sig) => {
        if (!isRemoving) {
          nextEnabled[sig] = true;
        } else {
          // Check if this signal is needed by ANY other selected goal
          const neededByOther = this.selectedGoals.some(otherGoalId => {
            const otherCat = GOAL_CATEGORIES.find(g => g.id === otherGoalId);
            return otherCat?.signals.includes(sig);
          });
          
          if (!neededByOther) {
            // Also check if it's "manually" enabled? 
            // For now, we assume if it was only enabled by this goal, we disable it.
            // A smarter system might track "manual override" vs "goal implied".
            // But preserving previous behavior:
            nextEnabled[sig] = false;
          }
        }
      });

      this.enabledSignals = nextEnabled;
      this.persist();
    },
    toggleSignal(signal: Signal, enabled: boolean) {
      this.enabledSignals[signal] = enabled;
      this.persist();
    },
    toggleCondition(key: ConditionKey, enabled: boolean) {
      if (!this.conditions[key]) return;
      this.conditions[key].enabled = enabled;
      this.persist();
    },
    updateParam(key: ConditionKey, paramKey: string, value: number) {
      if (!this.conditions[key]) return;
      this.conditions[key].params[paramKey] = value;
      this.persist();
    },
    updateSubject(patch: Partial<Subject>) {
      this.subject = { ...this.subject, ...patch };
      this.persist();
    },
    updateNutritionTargets(patch: Partial<NutritionTargets>) {
      this.nutritionTargets = {
        ...this.nutritionTargets,
        ...patch,
        macros: {
          ...this.nutritionTargets.macros,
          ...(patch.macros || {}),
        },
      };
      this.persist();
    },
  },
});

