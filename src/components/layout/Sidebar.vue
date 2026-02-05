<!-- src/components/layout/Sidebar.vue -->
<template>
  <div class="sidebar-page">
    <section class="sidebar-layout">
      <o-sidebar
        id="sidebar"
        position="static"
        :animate="animate"
        :mobile="mobile"
        :expand-on-hover="expandOnHover"
        :reduce="reduce"
        open
      >
        <router-link class="clipped-bottom-right" to="/status" @click.native="playBrowse">
          <img src="/icons/orbital.svg" />
          <span>Status</span>
        </router-link>

        <router-link class="clipped-bottom-right" to="/roster" @click.native="playBrowse">
          <img src="/icons/license.svg" />
          <span>Roster</span>
        </router-link>

        <!-- NEW: Deployment (Officer/Staff only) -->
        <router-link
          v-if="isOfficerOrStaff"
          class="clipped-bottom-right"
          to="/deployment"
          @click.native="playBrowse"
        >
          <img src="/icons/deployable.svg" />
          <span>Deployment</span>
        </router-link>

        <router-link
          v-if="isOfficerOrStaff"
          class="clipped-bottom-right"
          to="/admin"
          @click.native="playBrowse"
        >
          <img src="/icons/protocol.svg" />
          <span>Admin</span>
        </router-link>
      </o-sidebar>
    </section>
  </div>
</template>

<script>
import { useAdminAuth } from "@/composables/useAdminAuth";
let browseAudio;

export default {
  name: "Sidebar",
  props: { animate: { type: Boolean, required: true } },
  setup() {
    const { isOfficerOrStaff } = useAdminAuth();
    return { isOfficerOrStaff };
  },
  data() {
    return { expandOnHover: false, mobile: "reduced", reduce: false };
  },
  mounted() {
    browseAudio = new Audio("/sound/Orbat Main Menu Browse.ogg");
    browseAudio.volume = 0.6;
  },
  methods: {
    playBrowse() {
      if (!browseAudio) return;
      try { browseAudio.currentTime = 0; browseAudio.play().catch(() => {}); } catch {}
    },
  },
};
</script>

<style scoped>
/* =========================
   UNSC TERMINAL SIDEBAR THEME
   (safe: minimal overrides, keep icon sizing as original)
   ========================= */

.sidebar-page{ position: relative; }
.sidebar-layout{ height: 100%; }

/* Oruga container: kill theme background (the green rail) */
#sidebar :deep(.o-sidebar__wrapper),
#sidebar :deep(.o-sidebar__container),
#sidebar :deep(.o-sidebar__content),
#sidebar :deep(.o-sidebar__items){
  background: transparent !important;
}

/* Paint the rail */
#sidebar{
  position: relative;
  border-right: 1px solid rgba(170,220,255,0.14);
  background: linear-gradient(180deg, rgba(8,14,20,0.92), rgba(3,6,10,0.96)) !important;
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 28px rgba(120,180,255,0.08);
  overflow: hidden;
}

/* Scanlines */
#sidebar::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255,255,255,0.02),
    rgba(255,255,255,0.02) 1px,
    rgba(0,0,0,0) 3px,
    rgba(0,0,0,0) 6px
  );
  mix-blend-mode: overlay;
  opacity: 0.20;
  z-index: 0;
}
#sidebar::after{
  content:"";
  position:absolute;
  inset:-30%;
  pointer-events:none;
  background: radial-gradient(circle at 30% 30%, rgba(120,180,255,0.06), transparent 55%);
  opacity: .85;
  z-index: 0;
}

/* Keep links above effects */
#sidebar :deep(a){ position: relative; z-index: 1; }

/* Keep your clipped shape; just unify color palette */
#sidebar :deep(.clipped-bottom-right){
  border: 1px solid rgba(170,220,255,0.18);
  background: rgba(0,0,0,0.16);
  color: rgba(190,230,255,0.92);
  box-shadow: 0 0 0 1px rgba(170,220,255,0.05) inset;
}

/* Hover / active */
#sidebar :deep(.clipped-bottom-right:hover){
  border-color: rgba(170,220,255,0.55);
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.08) inset,
    0 0 20px rgba(120,180,255,0.10);
}
#sidebar :deep(.router-link-active){
  border-color: rgba(120,255,190,0.45);
  box-shadow:
    0 0 0 1px rgba(120,255,190,0.10) inset,
    0 0 22px rgba(120,255,190,0.10);
}

/* Text: prevent clipping */
#sidebar :deep(a span){
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Active indicator bar (if present) */
#sidebar :deep(.o-sidebar__item.is-active::before),
#sidebar :deep(.o-sidebar__item--active::before),
#sidebar :deep(.o-sidebar__item--active > a::before){
  background: rgba(170,220,255,0.55) !important;
  box-shadow: 0 0 16px rgba(120,180,255,0.16) !important;
}
</style>
