import { defineStore } from 'pinia';
import type { ProfileKey, ProfileStateSnapshot } from '@/models/profiles';
import { PROFILE_LIBRARY } from '@/models';
import { DEFAULT_SUBJECT, DEFAULT_NUTRITION_TARGETS, type Subject, type NutritionTargets } from '@/models/subject';

const STORAGE_KEY = 'physim:profiles';

export interface ProfilesStoreState {
  profiles: Record<ProfileKey, ProfileStateSnapshot>;
  subject: Subject;
  nutritionTargets: NutritionTargets;
  selectedGoals: string[];
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
  }),
  actions: {
    persist() {
      if (typeof localStorage === 'undefined') return;
      const payload = {
        profiles: this.profiles,
        subject: this.subject,
        nutritionTargets: this.nutritionTargets,
        selectedGoals: this.selectedGoals,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    toggleGoal(goalId: string) {
      const idx = this.selectedGoals.indexOf(goalId);
      if (idx >= 0) {
        this.selectedGoals.splice(idx, 1);
      } else {
        this.selectedGoals.push(goalId);
      }
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
