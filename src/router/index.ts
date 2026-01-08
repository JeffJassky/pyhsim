import { createRouter, createWebHashHistory } from "vue-router";
import { useOnboardingStore } from "@/stores/onboarding";

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
    }
  ],
});

export default router;