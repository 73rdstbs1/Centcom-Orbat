<!-- /src/components/layout/Header.vue -->
<template>
  <div class="header-wrap">
    <header class="header">
      <!-- LEFT: Title -->
      <div class="title clipped-x-large-forward">
        <!-- Hard-coded CENTCOM logo (keep 120x120) -->
        <img class="logo" src="/faction-logos/UNSC_CENTCOM_LOGO.png" alt="UNSC Central Command" />
        <div class="title-container">
          <div class="title-row" id="title-first-line">
            <span id="title-header">UNSC CENTRAL COMMAND</span>
          </div>
          <div class="title-row">
            <span id="subtitle-header">CENTCOM</span>
          </div>
        </div>
      </div>

      <div class="rhombus" aria-hidden="true"></div>

      <!-- MIDDLE: Current status pill (from RefData CSV) -->
      <div class="status-center" aria-label="Current status">
        <div class="status-pill" :data-status="statusVariant">
          <span class="status-label">{{ headerStatusLabel }}</span>
        </div>
      </div>

      <!-- RIGHT: Campaign AO details -->
      <div v-if="showCampaignPanel" class="planet-location-container" aria-label="Current AO details">
        <div class="location-info">
          <!-- 2x2 stacked tiles + AO spanning both rows:
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

      <!-- FAR RIGHT: Auth (member/staff + logout) -->
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
import { getConfig } from "@/config/runtimeConfig";
import { adminUser, isAdmin, adminLogout, subscribe as authSubscribe } from "@/utils/adminAuth";

/**
 * Campaign data remains content-driven (campaign.json per folder),
 * but we detect the ACTIVE campaign by reading the Operations CSV:
 * - Find first row where STATUS == "Active"
 * - Resolve CAMPAIGN NAME (carry-forward from last non-empty campaign name above)
 + * - Match that to src/campaigns/<campaign>/campaign.json by (folder OR id OR name)
 *
 * NOTE (Vite 6): use query '?raw' instead of deprecated `as: "raw"`.
 */
const CAMPAIGN_JSON = import.meta.glob("/src/campaigns/**/campaign.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

const defaultNewsItems = [
  "TACTICAL UPDATE: Slipspace comms stable across local AO. Maintain emission control.",
  "FLEETCOM: UNSC logistics convoy rerouted. Expect delayed resupply window.",
  "ONI ADVISORY: OPSEC reminders in effect. Avoid publishing mission details outside TACNET.",
  "SITREP: Patrol activity increased near contested sectors. Proceed with caution.",
  "SYSTEM NOTICE: Training rotations updated. Check your squad channel for timings.",
];

function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s:-]/g, "");
}

function normalizeMatch(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Minimal CSV parser that handles quoted fields.
 */
function parseCsv(text) {
  const rows = [];
  const s = String(text || "");
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cur);
      cur = "";
      row = row.map((x) => (x && x.endsWith("\r") ? x.slice(0, -1) : x));
      if (row.some((c) => String(c || "").trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    cur += ch;
  }

  row.push(cur);
  row = row.map((x) => (x && x.endsWith("\r") ? x.slice(0, -1) : x));
  if (row.some((c) => String(c || "").trim() !== "")) rows.push(row);

  return rows;
}

function safeJson(raw) {
  try {
    return JSON.parse(String(raw || ""));
  } catch {
    return null;
  }
}

function campaignFolderFromJsonPath(path) {
  const parts = String(path || "").split("/campaigns/");
  if (parts.length < 2) return "";
  return parts[1].split("/")[0] || "";
}

function loadAllCampaigns() {
  return Object.entries(CAMPAIGN_JSON)
    .map(([path, raw]) => {
      const json = safeJson(raw);
      if (!json) return null;
      const folder = campaignFolderFromJsonPath(path);
      return { ...json, __folder: folder, __path: path };
    })
    .filter(Boolean);
}

async function fetchCsv(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) return null;
  return await res.text();
}

/**
 * RefData.csv:
 * - Find a column named "Header details:" (case-insensitive, punctuation-insensitive)
 * - Take the first non-empty cell in that column (top to bottom)
 */
async function readHeaderStatusFromRefData(refDataCsvUrl) {
  const raw = await fetchCsv(refDataCsvUrl);
  if (!raw) return "";

  const rows = parseCsv(raw);
  if (!rows.length) return "";

  const headerRow = rows[0];
  const idx = headerRow.findIndex((h) => normalizeKey(h) === normalizeKey("Header details:"));
  if (idx < 0) return "";

  for (let r = 1; r < rows.length; r++) {
    const v = String(rows[r][idx] ?? "").trim();
    if (v) return v;
  }
  return "";
}


/**
 * Returns first non-empty value from a list of possible key paths.
 * Supports nested keys like "header.system".
 */
function getAny(obj, paths) {
  const o = obj && typeof obj === "object" ? obj : null;
  if (!o) return "";

  for (const p of paths) {
    const parts = String(p || "").split(".").filter(Boolean);
    let cur = o;
    for (const k of parts) {
      if (!cur || typeof cur !== "object") {
        cur = null;
        break;
      }
      cur = cur[k];
    }
    const v = String(cur ?? "").trim();
    if (v) return v;
  }
  return "";
}

/**
 * Operations.csv:
 * Columns:
 * - CAMPAIGN NAME
 * - OPERATIONS
 * - OP LINKS
 * - STATUS
 * - SUMMARY
 *
 * Rule:
 * - Scan top-to-bottom, remembering the last non-empty CAMPAIGN NAME.
 * - When a row's STATUS == "Active", return that remembered campaign name.
 */
async function findActiveCampaignNameFromOperations(operationsCsvUrl) {
  const raw = await fetchCsv(operationsCsvUrl);
  if (!raw) return { name: "", meta: {} };

  const rows = parseCsv(raw);
  if (rows.length < 2) return { name: "", meta: {} };

  const header = rows[0];
  const idx = {};
  for (let i = 0; i < header.length; i++) idx[normalizeKey(header[i])] = i;

  const col = (label) => idx[normalizeKey(label)] ?? -1;

  const idxCampaign = col("CAMPAIGN NAME");
  const idxStatus = col("STATUS");
  if (idxCampaign < 0 || idxStatus < 0) return { name: "", meta: {} };

  // Optional meta columns (won't break if missing)
  const idxSystem = col("SYSTEM");
  const idxPlanet = col("PLANET");
  const idxAo = col("AO");
  const idxYear = col("YEAR");

  const readCell = (r, i) => (i >= 0 ? String(rows[r][i] ?? "").trim() : "");

  let lastCampaign = "";
  const lastMeta = { system: "", planet: "", ao: "", year: "" };

  const normalizeActiveStatus = (s) => {
    const v = String(s || "").trim().toLowerCase();
    if (!v) return "";
    if (v === "active") return "active";
    if (v.startsWith("active")) return "active";
    if (v === "in progress" || v === "ongoing") return "active";
    return v;
  };

  for (let r = 1; r < rows.length; r++) {
    const campCell = readCell(r, idxCampaign);
    if (campCell) lastCampaign = campCell;

    const sys = readCell(r, idxSystem);
    const pla = readCell(r, idxPlanet);
    const ao = readCell(r, idxAo);
    const yr = readCell(r, idxYear);

    if (sys) lastMeta.system = sys;
    if (pla) lastMeta.planet = pla;
    if (ao) lastMeta.ao = ao;
    if (yr) lastMeta.year = yr;

    const statusCell = normalizeActiveStatus(readCell(r, idxStatus));
    if (statusCell === "active") {
      return { name: lastCampaign || campCell || "", meta: { ...lastMeta, status: "active" } };
    }
  }

  return { name: "", meta: {} };
}

function matchCampaignByName(allCampaigns, campaignName) {
  const key = normalizeMatch(campaignName);
  if (!key) return null;

  // First pass: exact-ish matches
  for (const c of allCampaigns) {
    const folder = normalizeMatch(c.__folder);
    const id = normalizeMatch(c.id);
    const name = normalizeMatch(c.name);
    if (key === folder || key === id || key === name) return c;
  }

  // Second pass: containment (handles "Operation: X" vs "X")
  for (const c of allCampaigns) {
    const folder = normalizeMatch(c.__folder);
    const id = normalizeMatch(c.id);
    const name = normalizeMatch(c.name);
    if (
      folder.includes(key) ||
      id.includes(key) ||
      name.includes(key) ||
      key.includes(folder) ||
      key.includes(id) ||
      key.includes(name)
    ) {
      return c;
    }
  }

  return null;
}

export default {
  inject: ["activeCampaignStore"],
  props: {
    header: { type: Object, required: true },
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
      // auth
      role: null,
      staffUser: null,
      unsub: null,

      // header status (RefData)
      headerStatus: "",

      // ticker
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
      if (!c) return { system: "—", planet: "—", ao: "—", year: "—", status: "—" };

      const system = getAny(c, ["system", "System", "header.system"]);
      const planet = getAny(c, ["planet", "Planet", "header.planet"]);
      const ao = getAny(c, ["ao", "AO", "header.ao", "header.AO"]);
      const year = getAny(c, ["year", "Year", "header.year", "quarter", "Quarter"]);
      const statusRaw = getAny(c, ["status", "Status", "header.status"]);

      return {
        system: system || "—",
        planet: planet || "—",
        ao: ao || "—",
        year: year || "—",
        status: (statusRaw || "—").toString().toUpperCase(),
      };
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

    // Status bar
    headerStatusLabel() {
      const v = String(this.headerStatus || "").trim();
      return v ? v.toUpperCase() : "—";
    },
    statusVariant() {
      const v = String(this.headerStatus || "").trim().toLowerCase();
      if (v === "active") return "active";
      if (v === "training") return "training";
      if (v === "rearming" || v === "rest") return "rearming";
      return "unknown";
    },

    normalizedNewsItems() {
      const items = Array.isArray(this.newsItems) ? this.newsItems : [];
      return items
        .map((x) => (typeof x === "string" ? x : String(x?.text || x || "")))
        .map((s) => s.trim())
        .filter(Boolean);
    },
  },
  async created() {
    // Auth
    this.readAuth();
    this.unsub = authSubscribe(() => this.readAuth());
    window.addEventListener("storage", this.onStorage);

    // RefData status + Active campaign
    this.refreshHeaderStatus();
    this.refreshActiveCampaign();

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

    async refreshHeaderStatus() {
      const refUrl = getConfig().sheets?.refDataCsvUrl || "";
      if (!refUrl) return;
      try {
        const v = await readHeaderStatusFromRefData(refUrl);
        this.headerStatus = v || this.headerStatus;
      } catch {}
    },

    async refreshActiveCampaign() {
      const opsUrl = getConfig().sheets?.operationsCsvUrl || getConfig().sheets?.opsCsvUrl || "";
      if (!opsUrl) return;

      try {
        const resolved = await findActiveCampaignNameFromOperations(opsUrl);
        const activeCampaignName = resolved?.name || "";
        if (!activeCampaignName) return;

        const allCampaigns = loadAllCampaigns();
        const matched = matchCampaignByName(allCampaigns, activeCampaignName);
        if (!matched) return;

        const meta = resolved?.meta || {};
        const merged = { ...matched };

        // Only fill missing values; do not override campaign.json values.
        if (!getAny(merged, ["system", "System", "header.system"]) && meta.system) merged.system = meta.system;
        if (!getAny(merged, ["planet", "Planet", "header.planet"]) && meta.planet) merged.planet = meta.planet;
        if (!getAny(merged, ["ao", "AO", "header.ao", "header.AO"]) && meta.ao) merged.ao = meta.ao;
        if (!getAny(merged, ["year", "Year", "header.year", "quarter", "Quarter"]) && meta.year) merged.year = meta.year;
        if (!getAny(merged, ["status", "Status", "header.status"]) && meta.status) merged.status = meta.status;

        if (this.activeCampaignStore) this.activeCampaignStore.activeCampaign = merged;
      } catch {}
    },

    // ===== ticker =====
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

      const seq = picks.join(effectiveSep) + effectiveSep;
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
.header-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ===== Header base ===== */
.header {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 0 !important;
  border: 1

</style>
