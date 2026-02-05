// /src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import Status from "@/views/StatusView.vue";
import Pilots from "@/views/RosterView.vue";
import AdminHome from "@/views/admin/AdminHome.vue";
import Deployment from "@/views/DeploymentView.vue";

import { isAdmin } from "@/utils/adminAuth";
import Config from "@/config/unit-config.json";

const DEFAULT_TITLE = Config.defaultTitle || "UNSC BRIEFING";

// Staff gate helper
function isStaff() {
  const role = sessionStorage.getItem("authRole");
  return role === "staff" || isAdmin();
}

const routes = [
  { path: "/", redirect: "/status" },

  { path: "/status", name: "Mission Status", component: Status, props: true, meta: { title: `${DEFAULT_TITLE} BRIEFING SYSTEM` } },
  { path: "/roster", name: "Unit Roster", component: Pilots, props: true, meta: { title: `${DEFAULT_TITLE} UNIT ROSTER` } },
  
  // NEW: Deployment (gate to staff/officer; change to public by removing requiresAdmin)
  { path: "/deployment", name: "Deployment", component: Deployment, props: true, meta: { title: `${DEFAULT_TITLE} DEPLOYMENT`, requiresAdmin: true } },

  { path: "/admin", name: "Admin", component: AdminHome, props: true, meta: { title: `${DEFAULT_TITLE} ADMIN`, requiresAdmin: true } },

  { path: "/admin/login", redirect: "/status" },
  { path: "/login", redirect: "/status" },

  { path: "/:pathMatch(.*)*", redirect: "/status" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to, _from, next) => {
  if (to.meta?.requiresAdmin && !isStaff()) return next("/status");
  if (to.meta?.title) document.title = String(to.meta.title);
  next();
});

export default router;
