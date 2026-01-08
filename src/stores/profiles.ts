import { defineStore } from 'pinia';
import type { ProfileKey, ProfileStateSnapshot } from '@/models/profiles';
import { PROFILE_LIBRARY, SIGNAL_LIBRARY, SIGNAL_DEFS } from '@/models';
import { DEFAULT_SUBJECT, DEFAULT_NUTRITION_TARGETS, type Subject, type NutritionTargets } from '@/models/subject';
import { SIGNALS_ALL, type Signal, type Goal } from '@/types';

const STORAGE_KEY = 'physim:profiles';

export interface ProfilesStoreState {
  profiles: Record<ProfileKey, ProfileStateSnapshot>;
  subject: Subject;
  nutritionTargets: NutritionTargets;
  selectedGoals: Goal[];
  enabledSignals: Record<Signal, boolean>;
  signalOrder: Signal[];
  subscriptionTier: 'free' | 'premium';
}

const loadPersisted = (): Partial<ProfilesStoreState> | null => {
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

export const useProfilesStore = defineStore('profiles', {
  state: (): ProfilesStoreState => ({
    profiles: PROFILE_LIBRARY.reduce((acc, profile) => {
      acc[profile.key] = {
        enabled: persisted?.profiles?.[profile.key]?.enabled ?? false,
        params: {
          ...Object.fromEntries(profile.params.map((p) => [p.key, p.default])),
          ...(persisted?.profiles?.[profile.key]?.params || {}),
        },
      };
      return acc;
    }, {} as Record<ProfileKey, ProfileStateSnapshot>),
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
      const def = SIGNAL_LIBRARY[sig];
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
        profiles: this.profiles,
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
      SIGNAL_DEFS.forEach((sig) => {
        if (!sig.goals?.includes(goalId)) return;

        if (!isRemoving) {
          nextEnabled[sig.key] = true;
        } else {
          const stillNeeded = this.selectedGoals.some((g) =>
            sig.goals?.includes(g)
          );
          if (!stillNeeded) nextEnabled[sig.key] = false;
        }
      });

      this.enabledSignals = nextEnabled;
      this.persist();
    },
    toggleSignal(signal: Signal, enabled: boolean) {
      this.enabledSignals[signal] = enabled;
      this.persist();
    },
    toggleProfile(key: ProfileKey, enabled: boolean) {
      if (!this.profiles[key]) return;
      this.profiles[key].enabled = enabled;
      this.persist();
    },
    updateParam(key: ProfileKey, paramKey: string, value: number) {
      if (!this.profiles[key]) return;
      this.profiles[key].params[paramKey] = value;
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
