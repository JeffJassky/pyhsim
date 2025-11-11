import { createRouter, createWebHashHistory } from "vue-router";

const StudioPage = () => import("@/pages/StudioPage.vue");
const LibraryPage = () => import("@/pages/LibraryPage.vue");
const ScenariosPage = () => import("@/pages/ScenariosPage.vue");

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "studio", component: StudioPage },
    { path: "/library", name: "library", component: LibraryPage },
    { path: "/scenarios", name: "scenarios", component: ScenariosPage },
  ],
});

export default router;
