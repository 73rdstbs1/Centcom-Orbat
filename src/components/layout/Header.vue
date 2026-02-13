<!-- /src/components/layout/Header.vue -->
<template>
  <div class="header-wrap" :style="{ '--auth-x': authOffsetX + 'px', '--auth-y': authOffsetY + 'px' }">
    <header>
      <!-- Auth Indicator -->
      <div class="auth-indicator" v-if="isLoggedIn">
        <div class="auth-line">
          <span class="auth-role" :data-variant="authVariant">{{ authLabel }}</span>
          <span v-if="displayName" class="auth-name">· {{ displayName }}</span>
        </div>
        <button class="auth-logout" @click="onLogout">{{ authLogoutLabel }}</button>
      </div>

      <div class="title clipped-x-large-forward">
        <img class="logo" :src="branding.headerLogo" />
        <div class="title-container">
          <div id="title-first-line" class="title-row">
            <span id="title-header">{{ branding.networkTitle }}</span>
          </div>
          <div class="title-row">
            <span id="subtitle-header">{{ header.subheaderTitle }}</span>
            <span id="subtitle-subheader">// {{ header.subheaderSubtitle }}</span>
          </div>
        </div>
      </div>

      <div class="rhombus"></div>

      <!-- Details panel only appears when an operation has START on line 2 -->
      <div v-if="showCampaignPanel" class="planet-location-container">
        <video class="planet-vid" autoplay muted loop width="90px" height="90px">
          <source :src="`${planetPath}`" type="video/webm" />
        </video>

        <div class="location-info" aria-label="Current AO details">
          <!-- SYSTEM > PLANET > AO -->
          <div class="meta-grid meta-grid--primary">
            <div class="meta-tile">
              <h4>SYSTEM</h4>
              <span class="subtitle">{{ campaignHeader?.system }}</span>
            </div>

            <div class="meta-tile">
              <h4>PLANET</h4>
              <span class="subtitle">{{ campaignHeader?.planet }}</span>
            </div>

            <div class="meta-tile meta-tile--wide">
              <h4>AO</h4>
              <span class="subtitle">{{ campaignHeader?.ao }}</span>
            </div>
          </div>

          <!-- placeholders -->
          <div class="meta-grid meta-grid--secondary">
            <div class="meta-tile">
              <h4>YEAR</h4>
              <span class="subtitle">TBD</span>
            </div>

            <div class="meta-tile meta-tile--wide">
              <h4>STATUS</h4>
              <span class="subtitle">TBD</span>
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
 * ACTIVE CAMPAIGN (content-driven)
 * - Find FIRST operation file where the 2nd NON-EMPTY line includes "start" (case-insensitive)
 * - Load that campaign's campaign.json
 */
import { getConfig } from "../../config/runtimeConfig";
import { adminUser, isAdmin, adminLogout, subscribe as authSubscribe } from "@/utils/adminAuth";

const CAMPAIGN_JSON = import.meta.glob("/src/campaigns/**/campaign.json", { as: "raw", eager: true });
const OPERATION_MD = import.meta.glob("/src/campaigns/**/operations/*.md", { as: "raw", eager: true });

function splitLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}
function firstNonEmptyLines(mdRaw, max = 30) {
  const out = [];
  for (const line of splitLines(mdRaw)) {
    const t = String(line || "").trim();
    if (!t) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
function hasStartOnLine2(mdRaw) {
  const ls = firstNonEmptyLines(mdRaw);
  const line2 = String(ls[1] || "").trim().toLowerCase();
  return line2.includes("start");
}
function campaignFolderFromOpPath(opPath) {
  const parts = String(opPath || "").split("/campaigns/");
  if (parts.length < 2) return null;
  return parts[1].split("/")[0] || null;
}
function resolveCampaignJsonPath(folder) {
  if (!folder) return null;
  const exact = `/src/campaigns/${folder}/campaign.json`;
  if (CAMPAIGN_JSON[exact]) return exact;

  for (const path of Object.keys(CAMPAIGN_JSON)) {
    const f = String(path).split("/campaigns/")[1]?.split("/")[0];
    if (f && f.toLowerCase() === String(folder).toLowerCase()) return path;
  }
  return null;
}
function loadCampaignJsonByPath(jsonPath) {
  if (!jsonPath) return null;
  try {
    return JSON.parse(CAMPAIGN_JSON[jsonPath]);
  } catch {
    return null;
  }
}
function detectActiveCampaign() {
  const ops = Object.entries(OPERATION_MD).sort(([a], [b]) => a.localeCompare(b));
  for (const [path, mdRaw] of ops) {
    if (!hasStartOnLine2(mdRaw)) continue;
    const folder = campaignFolderFromOpPath(path);
    const jsonPath = resolveCampaignJsonPath(folder);

    const campaign =
      loadCampaignJsonByPath(jsonPath) || {
        id: folder || "unknown",
        system: "—",
        planet: "—",
        ao: "—",
      };

    if (!campaign.status) campaign.status = "active";
    return campaign;
  }
  return null;
}

const defaultNewsItems = [
  "TACTICAL UPDATE: Slipspace comms stable across local AO. Maintain emission control.",
  "FLEETCOM: UNSC logistics convoy rerouted. Expect delayed resupply window.",
  "ONI ADVISORY: OPSEC reminders in effect. Avoid publishing mission details outside TACNET.",
  "SITREP: Patrol activity increased near contested sectors. Proceed with caution.",
  "SYSTEM NOTICE: Training rotations updated. Check your squad channel for timings.",
  "BREAKING: Marine promoted after surviving three drops and one briefing.",
];

export default {
  inject: ["activeCampaignStore"],
  props: {
    planetPath: { type: String, required: true },
    header: { type: Object, required: true },
    authOffsetX: { type: Number, default: 330 },
    authOffsetY: { type: Number, default: 10 },
    newsEnabled: { type: Boolean, default: true },
    newsItems: { type: Array, default: () => defaultNewsItems },
    tickerItemsPerLoop: { type: Number, default: 10 },
    tickerSeparator: { type: String, default: " // " },
    tickerSeparatorToken: { type: String, default: "//" },
    tickerSeparatorPad: { type: Number, default: 10 },
    tickerPxPerSecond: { type: Number, default: 45 },
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
    activeCampaign() {
      return this.activeCampaignStore?.activeCampaign || null;
    },
    showCampaignPanel() {
      return !!this.activeCampaign;
    },
    campaignHeader() {
      const c = this.activeCampaign;
      if (!c) return null;
      return {
        system: c.system || this.header?.system || "—",
        planet: c.planet || this.header?.planet || "—",
        ao: c.ao || c.AO || this.header?.AO || "—",
      };
    },
    branding() {
      return getConfig().branding || {};
    },
    authLogoutLabel() {
      return getConfig().ui?.auth?.logoutLabel || "Logout";
    },
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
    const active = detectActiveCampaign();
    if (this.activeCampaignStore) this.activeCampaignStore.activeCampaign = active;

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
      try {
        adminLogout();
      } catch {}
      try {
        sessionStorage.removeItem("authRole");
      } catch {}
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
        Math.max(5000, Number(this.sequenceRefreshMs) || 45000)
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

      const sequenceSep = effectiveSep || sep;
      const seq = picks.join(sequenceSep) + sequenceSep;

      this.tickerSequence = seq;
      this.tickerKey += 1;
      this.$nextTick(() => this.recalcTickerDuration());
    },
    recalcTickerDuration() {
      const seqEl = this.$refs.seq;
      if (!seqEl || !seqEl.scrollWidth) return;
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
.header-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Header spans top edge: no rounding */
header {
  border-radius: 0 !important;
}

/* Keep planet/location panel on the right — expand LEFT if long */
header .header-container,
header .inner,
header .topbar {
  display: flex;
  align-items: center;
}
header .planet-location-container {
  margin-left: auto !important;
  flex: 1 1 auto;
  min-width: 0;

  display: flex;
  flex-direction: row; /* force normal flow */
  direction: ltr; /* prevent RTL flips */
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-right: 12px;
}

.planet-vid {
  border-radius: 12px;
  border: 1px solid rgba(170, 220, 255, 0.16);
  background: rgba(0, 0, 0, 0.18);
}

/* Panel can grow/shrink while staying neat */
.location-info {
  min-width: 0;
  width: clamp(560px, 56vw, 1100px);
  direction: ltr;
}

/* SIMPLE GRID: evenly spaced, grows LEFT because it's right-aligned */
.meta-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content; /* each tile sizes to its content */
  justify-content: end; /* grid hugs right and expands left */
  align-items: end;
  column-gap: 14px; /* small, consistent gap */
  row-gap: 6px;
}

.meta-grid--secondary {
  margin-top: 8px;
}

.meta-tile {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.meta-tile--wide {
  max-width: 420px;
}

.meta-tile h4 {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  margin: 0;
}

.subtitle {
  display: block;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =========================
   UNSC TERMINAL HEADER THEME
   ========================= */

header {
  position: relative;
  border-radius: 0px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.9), rgba(3, 6, 10, 0.94));
  box-shadow: 0 0 0 1px rgba(170, 220, 255, 0.06) inset, 0 0 26px rgba(120, 180, 255, 0.1),
    0 0 110px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

header::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.02) 1px,
    rgba(0, 0, 0, 0) 3px,
    rgba(0, 0, 0, 0) 6px
  );
  mix-blend-mode: overlay;
  opacity: 0.22;
  z-index: 0;
}
header::after {
  content: "";
  position: absolute;
  inset: -20%;
  pointer-events: none;
  background: radial-gradient(circle at 30% 20%, rgba(120, 180, 255, 0.07), transparent 58%);
  opacity: 0.85;
  animation: headerFlicker 3.1s infinite;
  z-index: 0;
}
@keyframes headerFlicker {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 0.7;
  }
  12% {
    transform: translate3d(-1px, 1px, 0);
    opacity: 0.86;
  }
  25% {
    transform: translate3d(1px, -1px, 0);
    opacity: 0.68;
  }
  42% {
    transform: translate3d(0, 2px, 0);
    opacity: 0.9;
  }
  70% {
    transform: translate3d(2px, 0, 0);
    opacity: 0.76;
  }
}
header > * {
  position: relative;
  z-index: 1;
}

.rhombus {
  opacity: 0.18;
}

/* Auth indicator pill (position via CSS variables) */
.auth-indicator {
  position: absolute;
  left: var(--auth-x, 315px);
  top: var(--auth-y, 10px);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(170, 255, 210, 0.35);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(170, 255, 210, 0.92);
  font-family: "Titillium Web", sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1;
  z-index: 2;
}
.auth-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.auth-role {
  font-weight: 800;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(170, 255, 210, 0.35);
}
.auth-role[data-variant="member"] {
  opacity: 0.9;
}
.auth-role[data-variant="staff"] {
  border-color: rgba(30, 144, 255, 0.75);
}
.auth-name {
  font-size: 12px;
  opacity: 0.9;
}
.auth-logout {
  background: transparent;
  border: 1px solid rgba(170, 255, 210, 0.35);
  border-radius: 999px;
  padding: 2px 10px;
  color: rgba(170, 255, 210, 0.92);
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.auth-logout:hover {
  border-color: rgba(170, 255, 210, 0.9);
}

/* =========================
   News Ticker (continuous loop)
   ========================= */
.news-ticker {
  height: 32px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid rgba(170, 220, 255, 0.14);
  border-top: none;
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.75), rgba(3, 6, 10, 0.88));
  box-shadow: 0 0 0 1px rgba(170, 220, 255, 0.06) inset, 0 0 26px rgba(120, 180, 255, 0.08);
}

.news-label {
  font-family: "Titillium Web", sans-serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(190, 230, 255, 0.92);
  border: 1px solid rgba(170, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
}

.news-viewport {
  overflow: hidden;
  width: 100%;
  mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
}

.news-track {
  --ticker-duration: 28s;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  will-change: transform;
  animation: tickerLoop var(--ticker-duration) linear infinite;
}

.news-seq {
  font-family: "Titillium Web", sans-serif;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: rgba(226, 243, 255, 0.92);
  text-transform: uppercase;
  text-shadow: 0 0 14px rgba(120, 180, 255, 0.1);
  padding-right: 48px;
}

@keyframes tickerLoop {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
