// src/composables/useAdminAuth.js
// Vue-reactive wrapper around adminAuth utils

import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  subscribe,
  adminLogin,
  adminLogout,
  isOfficerOrStaff as _isOfficerOrStaff,
  adminUser as _adminUser,
  adminRole as _adminRole,
  adminToken as _adminToken,
} from "@/utils/adminAuth";

export function useAdminAuth() {
  const token = ref("");
  const role  = ref("staff");
  const user  = ref(null);

  let unsub = null;

  const sync = () => {
    token.value = _adminToken();
    role.value  = _adminRole();
    user.value  = _adminUser();
  };

  onMounted(() => {
    sync();
    unsub = subscribe(() => sync());
  });
  onBeforeUnmount(() => {
    if (typeof unsub === "function") unsub();
  });

  const isOfficerOrStaff = computed(() => _isOfficerOrStaff());
  const isLoggedIn = isOfficerOrStaff; // alias

  return {
    // state
    token, role, user,
    // derived
    isOfficerOrStaff, isLoggedIn,
    // actions
    adminLogin, adminLogout,
  };
}
