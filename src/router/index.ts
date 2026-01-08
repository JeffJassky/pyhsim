import { createRouter, createWebHashHistory } from "vue-router";

const StudioPage = () => import("@/pages/StudioPage.vue");

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "studio", component: StudioPage },
  ],
});

export default router;