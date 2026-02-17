import { createRouter, createWebHashHistory } from "vue-router";
import { useOnboardingStore } from "@/stores/onboarding";
import { useUserStore } from '@/stores/user';
import { useTimelineStore } from '@/stores/timeline';
import { SIMULATION_PRESETS } from '@/data/simulationPresets';
import { toMinuteISO, UUID } from '@kyneticbio/core';
import { v4 as uuid } from 'uuid';
import type { TimelineItem } from '@/types';

const StudioPage = () => import("@/pages/StudioPage.vue");
const OnboardingPage = () => import("@/pages/OnboardingPage.vue");

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { 
      path: "/", 
      name: "root", 
      component: StudioPage,
      beforeEnter: (to, from, next) => {
        const store = useOnboardingStore();
        if (!store.completed) {
          next({ name: 'onboarding' });
        } else {
          next();
        }
      }
    },
    {
      path: "/studio",
      name: "studio",
      component: StudioPage
    },
    {
      path: "/onboarding",
      name: "onboarding",
      component: OnboardingPage
    },
    {
      path: '/presets/:id',
      name: 'loadPreset',
      component: StudioPage,
      beforeEnter: async (to, from, next) => {
        const presetId = to.params.id as string;
        const preset = SIMULATION_PRESETS.find(p => p.id === presetId);

        if (preset) {
          const userStore = useUserStore();
          const timelineStore = useTimelineStore();

          // 1. Load user profile settings
          userStore.loadProfile(preset.userProfile);

          // 2. Clear existing timeline items and load new ones from preset
          const newTimelineItems = preset.timeline.map(ip => {
            const startISO = toMinuteISO(ip.startMin);
            const endDate = new Date(new Date(startISO).getTime() + ip.durationMin * 60 * 1000);
            return {
              id: uuid() as UUID,
              start: startISO,
              end: endDate.toISOString(),
              type: 'range', // Assuming all preset interventions are 'range' for now
              meta: {
                key: ip.key,
                params: ip.params || {},
                intensity: 1, // Default intensity
                labelOverride: ip.labelOverride,
                group: ip.group,
              },
            } as TimelineItem;
          });
          timelineStore.setItems(newTimelineItems);

          next({ name: 'studio' }); // Redirect to main studio page
        } else {
          console.warn(`Simulation Preset with ID '${presetId}' not found.`);
          next({ name: 'studio' }); // Go to studio with default state
        }
      },
    },
  ],
});

export default router;