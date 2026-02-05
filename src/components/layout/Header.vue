<!-- /src/components/layout/Header.vue -->
<template>
  <div class="header-wrap" :style="{'--auth-x': authOffsetX + 'px', '--auth-y': authOffsetY + 'px'}">
    <header>
      <!-- Auth Indicator -->
      <div class="auth-indicator" v-if="isLoggedIn">
        <div class="auth-line">
          <span class="auth-role" :data-variant="authVariant">{{ authLabel }}</span>
          <span v-if="displayName" class="auth-name">· {{ displayName }}</span>
        </div>
        <button class="auth-logout" @click="onLogout">Logout</button>
      </div>

      <div class="title clipped-x-large-forward">
        <img class="logo" src="/faction-logos/Broadsword111.png" />
        <div class="title-container">
          <div id="title-first-line" class="title-row">
            <span id="title-header">UNSC TACNET</span>
          </div>
          <div class="title-row">
            <span id="subtitle-header">{{ header.subheaderTitle }}</span>
            <span id="subtitle-subheader">// {{ header.subheaderSubtitle }}</span>
          </div>
        </div>
      </div>

      <div class="rhombus"></div>

      <div class="planet-location-container">
        <video autoplay muted loop width="90px" height="90px">
          <source :src="`${planetPath}`" type="video/webm" />
        </video>

        <div class="location-info">
          <div class="location-row grid">
            <div id="year">
              <h4>Year</h4>
              <span class="subtitle">{{ header.year }}</span>
            </div>

            <div id="status" class="span-2">
              <h4>Status</h4>
              <span class="subtitle">{{ header.status }}</span>
            </div>
          </div>

          <div class="location-row grid">
            <div id="AO">
              <h4>AO</h4>
              <span class="subtitle">{{ header.AO }}</span>
            </div>

            <div id="planet">
              <h4>Planet</h4>
              <span class="subtitle">{{ header.planet }}</span>
            </div>

            <div id="system">
              <h4>System</h4>
              <span class="subtitle">{{ header.system }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Continuous Marquee News Ticker -->
    <div v-if="newsEnabled && normalizedNewsItems.length" class="news-ticker" aria-label="UNSC News Ticker">
      <div class="news-label">BROADCAST</div>

      <div class="news-viewport">
        <div
          class="news-track"
          :key="tickerKey"
          :style="{ '--ticker-duration': tickerDuration + 's' }"
          ref="track"
        >
          <span class="news-seq" ref="seq">{{ tickerSequence }}</span>
          <span class="news-seq" aria-hidden="true">{{ tickerSequence }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * /src/components/layout/Header.vue
 * Add broadcasts by editing `defaultNewsItems` or by passing the `newsItems` prop.
 *
 * This ticker is a continuous marquee:
 * - renders the same random "sequence" twice for seamless looping
 * - scroll speed is constant via tickerPxPerSecond
 * - sequence refreshes every sequenceRefreshMs to keep it ambient/random
 */
import {
  adminUser,
  isAdmin,
  adminLogout,
  subscribe as authSubscribe,
} from "@/utils/adminAuth";

const defaultNewsItems = [
  "TACTICAL UPDATE: Slipspace comms stable across local AO. Maintain emission control.",
  "FLEETCOM: UNSC logistics convoy rerouted. Expect delayed resupply window.",
  "ONI ADVISORY: OPSEC reminders in effect. Avoid publishing mission details outside TACNET.",
  "SITREP: Patrol activity increased near contested sectors. Proceed with caution.",
  "SYSTEM NOTICE: Training rotations updated. Check your squad channel for timings.",
  "TACTICAL ALERT: Orbital traffic control temporarily suspended pending debris clearance.",
  "FLEETCOM: Capital ship movements classified. Expect irregular patrol coverage.",
  "SITREP: Long-range sensors reporting intermittent contacts—no IFF confirmation.",
  "NAVWARN: Slipspace turbulence detected along primary transit lanes. Plot alternates.",
  "COMMAND NOTICE: Boarding drills reinstated fleet-wide. Review zero-g protocols.",
  "TACTICAL UPDATE: Orbital denial assets detected in fringe systems. ROE unchanged.",
  "ONI BULLETIN: Disinformation spike detected on civilian channels. Verify sources.",
  "ONI ADVISORY: Unscheduled asset loss under review. No further comment.",
  "SECSTATE: Elevated threat posture following attempted assassination of colonial governor.",
  "INTEL FLASH: Insurrectionist funding traced to off-world shell corporations.",
  "CLASSIFIED BRIEF: Data leak contained. Personnel interviews ongoing.",
  "COLONY WATCH: Labor strikes escalate into armed standoff on outer rim world.",
  "CIVIL ALERT: Martial law declared after attacks on spaceport infrastructure.",
  "NEWSNET: Protest leaders call for planetary referendum amid troop deployments.",
  "SYSTEM UPDATE: Power grid sabotage leaves multiple arcologies offline.",
  "LOCAL REPORT: Separatist banners raised over former UNSC administrative hub.",
  "EMERGENCY FEED: Evacuation corridors established following urban bombardment.",
  "MARKET WATCH: Titanium prices surge as shipyard demand spikes.",
  "TRAVEL NOTICE: Interstellar passenger routes suspended pending security review.",
  "HEALTHNET: Low-G adaptation clinics overwhelmed on frontier worlds.",
  "MEDIA: Popular war correspondent embedded with frontline units—again.",
  "CULTURE: Museum opens exhibit on early Insurrection conflicts.",
  "LOCAL CRIME: Man arrested for succulent Sangheili meal.",
  "SAFETY REMINDER: EVA tethers are not optional, no matter your confidence.",
  "FLEET GOSSIP: Officer insists plasma burns are 'barely second degree'.",
  "MESS HALL UPDATE: Dehydrated eggs reclassified as biological hazard.",
  "ADMIN NOTE: Whoever labeled the crate 'definitely not explosives'—report in.",
  "BREAKING: Marine promoted after surviving three drops and one briefing."
];

export default {
  props: {
    planetPath: { type: String, required: true },
    header: { type: Object, required: true },
    authOffsetX: { type: Number, default: 330 },
    authOffsetY: { type: Number, default: 10 },

    newsEnabled: { type: Boolean, default: true },
    newsItems: { type: Array, default: () => defaultNewsItems },

    // How many headlines to stitch together per loop
    tickerItemsPerLoop: { type: Number, default: 10 },

    /**
     * Separator between headlines.
     * NOTE: HTML collapses normal spaces, so large gaps should be driven by tickerSeparatorPad.
     */
    tickerSeparator: { type: String, default: " // " },

    /**
     * Extra visual spacing around the separator token.
     * Implemented using NBSP so the spacing is preserved.
     * Example with pad=10 and token="//": "          //          "
     */
    tickerSeparatorToken: { type: String, default: "//" },
    tickerSeparatorPad: { type: Number, default: 10 },

    // Constant scroll speed (lower = slower)
    tickerPxPerSecond: { type: Number, default: 45 },

    // Refresh sequence periodically so it feels ambient/random
    sequenceRefreshMs: { type: Number, default: 45000 },
  },
  data() {
    return {
      role: null,
      staffUser: null,
      unsub: null,

      tickerKey: 0,
      tickerSequence: "",
      tickerDuration: 28,

      _sequenceTimer: null,
      _resizeTimer: null,
      _lastPick: -1,
    };
  },
  computed: {
    isLoggedIn() {
      return this.role === "member" || this.isStaff;
    },
    isStaff() {
      return isAdmin();
    },
    authVariant() {
      return this.isStaff ? "staff" : "member";
    },
    authLabel() {
      return this.isStaff ? "Staff" : "Member";
    },
    displayName() {
      if (!this.isStaff) return "";
      return (this.staffUser && this.staffUser.displayName) || "";
    },

    normalizedNewsItems() {
      const items = Array.isArray(this.newsItems) ? this.newsItems : [];
      return items
        .map((x) => (typeof x === "string" ? x : String(x?.text || x || "")))
        .map((s) => s.trim())
        .filter(Boolean);
    },
  },
  created() {
    this.readAuth();
    this.unsub = authSubscribe(() => this.readAuth());
    window.addEventListener("storage", this.onStorage);

    this.startTicker();
    window.addEventListener("resize", this.onResize);
  },
  mounted() {
    this.recalcTickerDuration();
  },
  beforeUnmount() {
    if (this.unsub) this.unsub();
    window.removeEventListener("storage", this.onStorage);
    window.removeEventListener("resize", this.onResize);
    this.stopTicker();
  },
  watch: {
    newsEnabled() {
      this.startTicker();
    },
    normalizedNewsItems() {
      this.startTicker();
    },
    tickerPxPerSecond() {
      this.recalcTickerDuration();
    },
    tickerItemsPerLoop() {
      this.startTicker();
    },
    tickerSeparator() {
      this.startTicker();
    },
    tickerSeparatorToken() {
      this.startTicker();
    },
    tickerSeparatorPad() {
      this.startTicker();
    },
  },
  methods: {
    readAuth() {
      this.role = sessionStorage.getItem("authRole") || null;
      this.staffUser = adminUser();
    },
    onStorage(e) {
      if (!e) return;
      if (["admin:user", "admin:role", "admin:token", "admin:exp", "authRole"].includes(e.key)) {
        this.readAuth();
      }
    },
    async onLogout() {
      try { adminLogout(); } catch {}
      try { sessionStorage.removeItem("authRole"); } catch {}
      this.readAuth();
      if (this.$router?.currentRoute?.value?.path !== "/status") {
        this.$router.push("/status");
      }
    },

    onResize() {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.recalcTickerDuration(), 120);
    },

    startTicker() {
      this.stopTicker();
      if (!this.newsEnabled) return;
      if (!this.normalizedNewsItems.length) return;

      this.buildNewSequence();
      this._sequenceTimer = setInterval(
        () => this.buildNewSequence(),
        Math.max(5000, Number(this.sequenceRefreshMs) || 45000),
      );
    },
    stopTicker() {
      if (this._sequenceTimer) clearInterval(this._sequenceTimer);
      this._sequenceTimer = null;
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    },

    buildNewSequence() {
      const items = this.normalizedNewsItems;
      const n = items.length;
      const k = Math.max(2, Number(this.tickerItemsPerLoop) || 10);

      const padCount = Math.max(0, Number(this.tickerSeparatorPad) || 0);
      const pad = "\u00A0".repeat(padCount);
      const token = String(this.tickerSeparatorToken || "//").trim() || "//";
      const sep = `${pad}${token}${pad}`;

      // Back-compat: if user sets tickerSeparator explicitly, respect it,
      // but still pad around it if they configured padding.
      const baseSep = String(this.tickerSeparator ?? " // ");
      const effectiveSep = padCount > 0 ? `${pad}${baseSep.trim() || token}${pad}` : baseSep;

      const picks = [];
      let last = this._lastPick;

      for (let i = 0; i < k; i++) {
        const idx = this.randomIndex(n, last);
        last = idx;
        picks.push(items[idx]);
      }

      this._lastPick = last;

      // Ensure there’s ALWAYS a separator between end->start (since we duplicate)
      const seq = picks.join(effectiveSep || sep) + (effectiveSep || sep);

      this.tickerSequence = seq;
      this.tickerKey += 1; // restart animation cleanly
      this.$nextTick(() => this.recalcTickerDuration());
    },

    recalcTickerDuration() {
      const seqEl = this.$refs.seq;
      if (!seqEl || !seqEl.scrollWidth) return;

      // With two identical sequences, one loop distance is exactly the first sequence width.
      const widthPx = seqEl.scrollWidth;
      const speed = Math.max(10, Number(this.tickerPxPerSecond) || 45);
      const seconds = widthPx / speed;

      this.tickerDuration = Math.max(12, Math.round(seconds * 10) / 10);
    },

    randomIndex(n, avoid) {
      if (n <= 1) return 0;
      let idx = Math.floor(Math.random() * n);
      if (idx === avoid) idx = (idx + 1 + Math.floor(Math.random() * (n - 1))) % n;
      return idx;
    },
  },
};
</script>

<style scoped>
/* Wrapper lets ticker sit below header without changing/overlapping header internals */
.header-wrap{
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Header spans top edge: no rounding */
header{ border-radius: 0 !important; }

/* Keep planet/location panel on the right */
header .header-container,
header .inner,
header .topbar{
  display: flex;
  align-items: center;
}
header .planet-location-container{
  margin-left: auto !important;
  flex: 0 0 auto;
}

/* =========================
   UNSC TERMINAL HEADER THEME
   ========================= */

header{
  position: relative;
  border-radius: 0px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8,14,20,0.90), rgba(3,6,10,0.94));
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 26px rgba(120,180,255,0.10),
    0 0 110px rgba(0,0,0,0.55);
  overflow: hidden;
}

header::before{
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
  opacity: 0.22;
  z-index: 0;
}
header::after{
  content:"";
  position:absolute;
  inset:-20%;
  pointer-events:none;
  background: radial-gradient(circle at 30% 20%, rgba(120,180,255,0.07), transparent 58%);
  opacity: .85;
  animation: headerFlicker 3.1s infinite;
  z-index: 0;
}
@keyframes headerFlicker{
  0%,100%{ transform: translate3d(0,0,0); opacity:.70; }
  12%{ transform: translate3d(-1px,1px,0); opacity:.86; }
  25%{ transform: translate3d(1px,-1px,0); opacity:.68; }
  42%{ transform: translate3d(0,2px,0); opacity:.90; }
  70%{ transform: translate3d(2px,0,0); opacity:.76; }
}
header > *{ position: relative; z-index: 1; }

.rhombus{ opacity: .18; }

/* Auth indicator pill (position via CSS variables) */
.auth-indicator {
  position: absolute;
  left: var(--auth-x, 315px);
  top: var(--auth-y, 10px);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(170,255,210,.35);
  border-radius: 999px;
  background: rgba(0,0,0,.35);
  color: rgba(170,255,210,.92);
  font-family: "Titillium Web", sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1;
  z-index: 2;
}
.auth-line { display: inline-flex; align-items: center; gap: 6px; }
.auth-role {
  font-weight: 800;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(170,255,210,.35);
}
.auth-role[data-variant="member"] { opacity: .9; }
.auth-role[data-variant="staff"]  { border-color: rgba(30,144,255,.75); }
.auth-name { font-size: 12px; opacity: .9; }
.auth-logout {
  background: transparent;
  border: 1px solid rgba(170,255,210,.35);
  border-radius: 999px;
  padding: 2px 10px;
  color: rgba(170,255,210,.92);
  cursor: pointer;
  font-size: 11px;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.auth-logout:hover { border-color: rgba(170,255,210,.9); }

/* Existing layout styles */
.location-row.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 1.2rem;
  align-items: end;
}
.span-2 { grid-column: span 2; }
.location-row h4 {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
}
.subtitle { font-size: 0.85rem; letter-spacing: 0.08em; }

/* =========================
   News Ticker (continuous loop)
   ========================= */
.news-ticker{
  height: 32px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid rgba(170,220,255,0.14);
  border-top: none;
  background: linear-gradient(180deg, rgba(8,14,20,0.75), rgba(3,6,10,0.88));
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 26px rgba(120,180,255,0.08);
}

.news-label{
  font-family: "Titillium Web", sans-serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(190,230,255,0.92);
  border: 1px solid rgba(170,220,255,0.18);
  background: rgba(0,0,0,0.18);
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
}

.news-viewport{
  overflow: hidden;
  width: 100%;
  mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
}

/* Track contains TWO identical sequences => total width ~200% of one sequence */
.news-track{
  --ticker-duration: 28s;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
  animation: tickerLoop var(--ticker-duration) linear infinite;
}

/* Each sequence is inline and identical; second one makes loop seamless */
.news-seq{
  font-family: "Titillium Web", sans-serif;
  font-size: 12px;
  letter-spacing: 0.10em;
  color: rgba(226,243,255,0.92);
  text-transform: uppercase;
  text-shadow: 0 0 14px rgba(120,180,255,0.10);
  padding-right: 48px;
}

/* Move left by exactly one sequence width (half of the duplicated content) */
@keyframes tickerLoop{
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}
</style>
