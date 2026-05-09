import {
  createRouter,
  createWebHashHistory,
  type RouteLocationNormalized,
} from "vue-router";
import HomeView from "@/views/HomeView.vue";
import AudienceView from "@/views/AudienceView.vue";
import { AUDIENCES } from "@/data/audiences";

const audienceSlugs = AUDIENCES.map((a) => a.slug);

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    {
      path: "/:slug",
      name: "audience",
      component: AudienceView,
      props: true,
      beforeEnter: (to) => {
        const slug = to.params.slug as string;
        if (!audienceSlugs.includes(slug)) return { path: "/" };
        return true;
      },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior(to: RouteLocationNormalized) {
    if (to.hash) {
      const id = to.hash.slice(1);
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const el = document.getElementById(id);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 70;
            resolve({ left: 0, top, behavior: "smooth" });
          } else {
            resolve({ left: 0, top: 0 });
          }
        });
      });
    }
    return { left: 0, top: 0 };
  },
});
