<!-- /src/components/layout/Header.vue -->
<template>
  <div
    class="header-wrap"
    :style="{ '--auth-x': authOffsetX + 'px', '--auth-y': authOffsetY + 'px' }"
  >
    <header>
      <!-- LEFT: Logo + fixed CENTCOM title -->
      <div class="title clipped-x-large-forward">
        <img class="logo" :src="centcomLogo" alt="UNSC CENTCOM" />
        <div class="title-container">
          <div id="title-first-line" class="title-row">
            <span id="title-header">UNSC CENTRAL COMMAND</span>
          </div>
          <div class="title-row">
            <span id="subtitle-header">CENTCOM</span>
          </div>
        </div>
      </div>

      <div class="rhombus" aria-hidden="true"></div>

      <!-- CENTER: Status bar (from RefData CSV) -->
      <div class="header-status" aria-label="Current CENTCOM status">
        <div class="status-pill-lg" :data-status="normalizedHeaderStatus">
          <span class="status-label">{{ headerStatusLabel }}</span>
        </div>
      </div>

      <!-- RIGHT: Active campaign details (from Operations CSV -> campaign.json) -->
      <div v-if="showCampaignPanel" class="planet-location-container">
        <div class="location-info" aria-label="Current AO details">
          <!-- 2x2 stacked tiles + AO column spanning both rows:
               [ SYSTEM | PLANET | AO ]
               [ YEAR   | STATUS | AO ]
          -->
          <div class="meta-grid">
            <div class="meta-tile">
              <h4>SYSTEM</h4>
              <span class="subtitle">{{ campaignHeader.system }}</span>
            </div>

            <div class="meta-tile">
              <h4>PLANET</h4>
              <span class="subtitle">{{ campaignHeader.planet }}</span>
            </div>

            <div class="meta-tile meta-tile--ao">
              <h4>AO</h4>
              <span class="subtitle">{{ campaignHeader.ao }}</span>
            </div>

            <div class="meta-tile">
              <h4>YEAR</h4>
              <span class="subtitle">{{ campaignHeader.year }}</span>
            </div>

            <div class="meta-tile">
              <h4>STATUS</h4>
              <span class="subtitle">{{ campaignHeader.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AUTH (right edge, themed) -->
      <div class="auth-indicator" v-if="isLoggedIn">
        <div class="auth-line">
          <span class="auth-role" :data-variant="authVariant">{{ authLabel }}</span>
          <span v-if="displayName" class="auth-name">· {{ displayName }}</span>
        </div>
        <button class="auth-logout" @click="onLogout">{{ authLogoutLabel }}</button>
      </div>
    </header>

    <!-- Continuous Marquee News Ticker -->
    <div v-if="newsEnabled && normalizedNewsItems.length" class="news-ticker" aria-label="UNSC News Ticker">
      <div class="news-label">BROADCAST</div>

      <div class="news-viewport">
        <div class="news-track" :key="tickerKey" :style="{ '--ticker-duration': tickerDuration + 's' }">
          <span class="news-seq" ref="seq">{{ tickerSequence }}</span>
          <span class="news-seq" aria-hidden="true">{{ tickerSequence }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Header.vue
 *
 * Data sources:
 * - RefData CSV: reads "Header details:" cell (expects Active | Training | Rearming)
 * - Operations CSV: finds first row with STATUS == "Active"
 *     -> reads CAMPAIGN NAME from that row
 *     -> loads matching src/campaigns/**/campaign.json (matches by id/name/folder)
 *
 * Notes:
 * - Vite 6: use import.meta.glob with query '?raw' (NOT `as: 'raw'`)
 */
import { getConfig } from "../../config/runtimeConfig";
import { adminUser, isAdmin, adminLogout, subscribe as authSubscribe } from "@/utils/adminAuth";

const CAMPAIGN_JSON = import.meta.glob("/src/campaigns/**/campaign.json", {
  eager: true,
  query: "?raw",
  import: "default",
});

const defaultNewsItems = [
  "TACTICAL UPDATE: Slipspace comms stable across local AO. Maintain emission control.",
  "FLEETCOM: UNSC logistics convoy rerouted. Expect delayed resupply window.",
  "ONI ADVISORY: OPSEC reminders in effect. Avoid publishing mission details outside TACNET.",
  "SITREP: Patrol activity increased near contested sectors. Proceed with caution.",
  "SYSTEM NOTICE: Training rotations updated. Check your squad channel for timings.",
  "BREAKING: Marine promoted after surviving three drops and one briefing.",
];

function safeJson(raw) {
  try {
    return JSON.parse(String(raw || ""));
  } catch {
    return null;
  }
}

function csvSplit(line) {
  // Minimal CSV splitter that handles quoted fields.
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => String(s ?? "").trim());
}

function parseCsv(raw) {
  const text = String(raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter((l) => l.trim().length);
  if (!lines.length) return [];
  const header = csvSplit(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = csvSplit(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? "";
    rows.push(obj);
  }
  return rows;
}

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function folderFromCampaignPath(path) {
  const parts = String(path || "").split("/campaigns/");
  if (parts.length < 2) return "";
  return parts[1].split("/")[0] || "";
}

function loadAllCampaigns() {
  const out = [];
  for (const [path, raw] of Object.entries(CAMPAIGN_JSON)) {
    const json = safeJson(raw);
    if (!json) continue;
    out.push({
      __path: path,
      __folder: folderFromCampaignPath(path),
      ...json,
    });
  }
  return out;
}

function findCampaignByName(all, campaignName) {
  const q = norm(campaignName);
  if (!q) return null;

  // Match by id, name, folder (case-insensitive)
  const exact = all.find((c) => norm(c.id) === q) || all.find((c) => norm(c.name) === q) || all.find((c) => norm(c.__folder) === q);
  if (exact) return exact;

  // Loose contains match (helps if sheet uses "Operation: X" while folder is "operation_x")
  const contains = all.find((c) => norm(c.name).includes(q)) || all.find((c) => q.includes(norm(c.__folder)));
  return contains || null;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return await res.text();
}

async function readHeaderStatusFromRefData(refDataCsvUrl) {
  if (!refDataCsvUrl) return "";
  try {
    const raw = await fetchText(refDataCsvUrl);
    const rows = parseCsv(raw);
    if (!rows.length) return "";

    // Find a column header that equals "Header details:" (case-insensitive)
    const headers = Object.keys(rows[0] || {});
    const col = headers.find((h) => norm(h) === "header details:" || norm(h) === "header details");
    if (!col) return "";

    // First non-empty value in that column
    for (const r of rows) {
      const v = String(r[col] || "").trim();
      if (v) return v;
    }
    return "";
  } catch {
    return "";
  }
}

async function detectActiveCampaignFromOperationsCsv(operationsCsvUrl) {
  if (!operationsCsvUrl) return null;

  try {
    const raw = await fetchText(operationsCsvUrl);
    const rows = parseCsv(raw);
    if (!rows.length) return null;

    // Column names (case-insensitive match)
    const headers = Object.keys(rows[0] || {});
    const colCampaign = headers.find((h) => norm(h) === "campaign name");
    const colStatus = headers.find((h) => norm(h) === "status");

    if (!colCampaign || !colStatus) return null;

    // Find first active op
    const activeRow = rows.find((r) => norm(r[colStatus]) === "active");
    if (!activeRow) return null;

    const campaignName = String(activeRow[colCampaign] || "").trim();
    if (!campaignName) return null;

    const allCampaigns = loadAllCampaigns();
    const campaign = findCampaignByName(allCampaigns, campaignName);
    return campaign || null;
  } catch {
    return null;
  }
}

export default {
  name: "Header",
  inject: ["activeCampaignStore"],
  props: {
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

      headerStatus: "",

      tickerKey: 0,
      tickerSequence: "",
      tickerDuration: 28,

      _sequenceTimer: null,
      _resizeTimer: null,
      _lastPick: -1,
    };
  },
  computed: {
    centcomLogo() {
      // Hard-coded per your request.
      return "/faction-logos/UNSC_CENTCOM_LOGO.png";
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

    normalizedHeaderStatus() {
      const v = norm(this.headerStatus);
      if (v === "training") return "training";
      if (v === "rearming") return "rearming";
      return "active";
    },
    headerStatusLabel() {
      const v = this.normalizedHeaderStatus;
      if (v === "training") return "TRAINING";
      if (v === "rearming") return "REARMING";
      return "ACTIVE";
    },

    activeCampaign() {
      return this.activeCampaignStore?.activeCampaign || null;
    },
    showCampaignPanel() {
      return !!this.activeCampaign;
    },
    campaignHeader() {
      const c = this.activeCampaign || {};
      const system = c.system || this.header?.system || "—";
      const planet = c.planet || this.header?.planet || "—";
      const ao = c.ao || c.AO || this.header?.AO || "—";
      const year = (c.startDate || c.endDate || "").slice(0, 4) || "—";
      const status = (c.status || "—").toUpperCase();
      return { system, planet, ao, year, status };
    },

    normalizedNewsItems() {
      const items = Array.isArray(this.newsItems) ? this.newsItems : [];
      return items
        .map((x) => (typeof x === "string" ? x : String(x?.text || x || "")))
        .map((s) => s.trim())
        .filter(Boolean);
    },

    branding() {
      return getConfig().branding || {};
    },
  },
  async created() {
    // Auth
    this.readAuth();
    this.unsub = authSubscribe(() => this.readAuth());
    window.addEventListener("storage", this.onStorage);

    // Header status (RefData)
    const refUrl = getConfig().sheets?.refDataCsvUrl;
    this.headerStatus = await readHeaderStatusFromRefData(refUrl);

    // Active campaign from Operations CSV -> campaign.json
    const operationsUrl =
      getConfig().sheets?.operationsCsvUrl ||
      getConfig().sheets?.opsCsvUrl ||
      getConfig().sheets?.operationsPageCsvUrl ||
      "";
    const activeCampaign = await detectActiveCampaignFromOperationsCsv(operationsUrl);
    if (this.activeCampaignStore) this.activeCampaignStore.activeCampaign = activeCampaign;

    // Ticker
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
  position: relative;
  border-radius: 0 !important;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.9), rgba(3, 6, 10, 0.94));
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 26px rgba(120, 180, 255, 0.1),
    0 0 110px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  display: flex;
  align-items: center;
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

/* LEFT title block (existing shape) */
.title {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding-left: 12px;
  padding-right: 22px;
  height: 96px;
  background: rgba(31, 79, 70, 0.92);
  border-right: 1px solid rgba(170, 220, 255, 0.14);
}

.logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  image-rendering: auto;
  flex: 0 0 auto;
}

.title-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.title-row {
  width: 100%;
}
#title-first-line {
  border-bottom: 1px solid rgba(0, 0, 0, 0.55);
  padding-bottom: 2px;
  margin-bottom: 2px;
}

#title-header {
  font-size: 32px;
  font-family: "Big Shoulders Display", cursive;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(230, 251, 255, 0.95);
  white-space: nowrap;
}

#subtitle-header {
  font-size: 24px;
  font-family: "Big Shoulders Display", cursive;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(214, 241, 255, 0.92);
  white-space: nowrap;
}

/* CENTER status pill: doubled size + uses empty space */
.header-status {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  padding: 0 14px;
}

.status-pill-lg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 260px;
  padding: 12px 22px;
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: rgba(0, 0, 0, 0.22);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-family: "Titillium Web", sans-serif;
  font-weight: 800;
  font-size: 14px;
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 28px rgba(120, 180, 255, 0.08);
}

.status-pill-lg[data-status="active"] {
  border-color: rgba(120, 255, 190, 0.55);
  color: rgba(120, 255, 190, 0.95);
  box-shadow:
    0 0 0 1px rgba(120, 255, 190, 0.12) inset,
    0 0 26px rgba(120, 255, 190, 0.08);
}
.status-pill-lg[data-status="training"] {
  border-color: rgba(255, 210, 90, 0.55);
  color: rgba(255, 210, 90, 0.95);
  box-shadow:
    0 0 0 1px rgba(255, 210, 90, 0.12) inset,
    0 0 26px rgba(255, 210, 90, 0.08);
}
.status-pill-lg[data-status="rearming"] {
  border-color: rgba(255, 90, 90, 0.55);
  color: rgba(255, 90, 90, 0.95);
  box-shadow:
    0 0 0 1px rgba(255, 90, 90, 0.12) inset,
    0 0 26px rgba(255, 90, 90, 0.08);
}

/* RIGHT details + vertical divider like OG header */
header .planet-location-container {
  margin-left: auto !important;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  padding-left: 16px;
  padding-right: 12px;
  border-left: 1px solid rgba(170, 220, 255, 0.22);
}

/* Panel can grow leftward if content is long */
.location-info {
  min-width: 0;
  width: max-content;
  max-width: min(1120px, 46vw);
}

.meta-grid {
  display: grid;
  grid-template-columns: max-content max-content minmax(220px, 420px);
  grid-template-rows: auto auto;
  gap: 10px 14px;
  justify-content: end;
  align-items: end;
}

.meta-tile {
  min-width: 0;
  display: grid;
  gap: 4px;
  align-content: start;
}
.meta-tile--ao {
  grid-column: 3;
  grid-row: 1 / span 2;
}

.meta-tile h4 {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  margin: 0;
  color: rgba(214, 241, 255, 0.75);
}

.subtitle {
  display: block;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(230, 251, 255, 0.92);
}

/* AUTH: right edge */
.auth-indicator {
  position: absolute;
  right: 12px;
  top: 10px;
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
