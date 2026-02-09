// FILE: src/router/index.js
/**
 * Vue Router configuration (POC)
 *
 * Fix for build failure:
 * - You deleted src/views/StatusView.vue, but the router still imported it.
 * - This router removes StatusView and routes only to the POC pages.
 */

import { createRouter, createWebHistory } from "vue-router";

import CampaignLogView from "@/views/CampaignLogView.vue";
import HallOfCommandersView from "@/views/HallOfCommandersView.vue";
import BackendRosterView from "@/views/BackendRosterView.vue";
import HallOfFameView from "@/views/HallOfFameView.vue";

const routes = [
  // Default route: send users to Campaigns
  { path: "/", redirect: "/campaigns" },

  { path: "/campaigns", name: "CampaignLog", component: CampaignLogView },
  { path: "/commanders", name: "HallOfCommanders", component: HallOfCommandersView },
  { path: "/backend-roster", name: "BackendRoster", component: BackendRosterView },
  { path: "/hall-of-fame", name: "HallOfFame", component: HallOfFameView },

  // Fallback: keep SPA routing working
  { path: "/:pathMatch(.*)*", redirect: "/campaigns" },
];

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
