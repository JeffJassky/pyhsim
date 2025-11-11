import { defineStore } from 'pinia';
import type { ProfileKey, ProfileStateSnapshot } from '@/models/profiles';
import { PROFILE_LIBRARY } from '@/models';

export interface ProfilesStoreState {
  profiles: Record<ProfileKey, ProfileStateSnapshot>;
}

export const useProfilesStore = defineStore('profiles', {
  state: (): ProfilesStoreState => ({
    profiles: PROFILE_LIBRARY.reduce((acc, profile) => {
      acc[profile.key] = {
        enabled: false,
        params: Object.fromEntries(profile.params.map((p) => [p.key, p.default])),
      };
      return acc;
    }, {} as Record<ProfileKey, ProfileStateSnapshot>),
  }),
  actions: {
    toggleProfile(key: ProfileKey, enabled: boolean) {
      if (!this.profiles[key]) return;
      this.profiles[key].enabled = enabled;
    },
    updateParam(key: ProfileKey, paramKey: string, value: number) {
      if (!this.profiles[key]) return;
      this.profiles[key].params[paramKey] = value;
    },
  },
});
