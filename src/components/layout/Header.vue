<!-- FILE: src/components/layout/Header.vue -->
<template>
  <header class="app-header">
    <div class="left">
      <div class="brand">
        <div class="brand-top">CENTCOM</div>
        <div class="brand-sub">OPERATIONS HUB</div>
      </div>
    </div>

    <!-- DEBUG banner (only when ?debugHeader=1) -->
    <div v-if="debugEnabled" class="debug-banner">
      <div class="debug-title">HEADER DEBUG</div>
      <div class="debug-line">ops seen: {{ debug.opsCount }}</div>
      <div class="debug-line">campaign.json seen: {{ debug.campaignCount }}</div>
      <div class="debug-line">start found: {{ debug.startFound ? "YES" : "NO" }}</div>
      <div v-if="debug.startOpPath" class="debug-line">start op: {{ debug.startOpPath }}</div>
      <div v-if="debug.campaignFolder" class="debug-line">folder: {{ debug.campaignFolder }}</div>
      <div v-if="debug.campaignJsonPath" class="debug-line">campaign.json: {{ debug.campaignJsonPath }}</div>
      <div v-if="debug.error" class="debug-error">error: {{ debug.error }}</div>
    </div>

    <!-- Existing layout preserved: campaign panel appears only when START detected -->
    <div v-if="showCampaignPanel" class="right">
      <div class="active-panel" role="status" aria-label="Active campaign">
        <div class="panel-top">
          <div class="panel-kicker">ACTIVE CAMPAIGN</div>
          <span class="status-pill" data-status="active">ACTIVE</span>
        </div>

        <div class="panel-title">
          {{ campaignHeader?.name || "—" }}
        </div>

        <div class="panel-meta">
          <div class="meta-row">
            <span class="label">SYSTEM</span>
            <span class="value">{{ campaignHeader?.system || "—" }}</span>
          </div>
          <div class="meta-row">
            <span class="label">PLANET</span>
            <span class="value">{{ campaignHeader?.planet || "—" }}</span>
          </div>
          <div class="meta-row">
            <span class="label">AO</span>
            <span class="value">{{ campaignHeader?.ao || "—" }}</span>
          </div>
          <div class="meta-row">
            <span class="label">YEAR</span>
            <span class="value">TBD</span>
          </div>
          <div class="meta-row">
            <span class="label">STATUS</span>
            <span class="value">TBD</span>
          </div>
        </div>

        <div class="panel-actions">
          <button class="term-button" type="button" @click="openCampaignLog">
            OPEN CAMPAIGN LOG
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
/**
 * BUGFIX-FIRST header detector
 *
 * Why this version:
 * - No async imports. No runtime chunk fetch. No loader functions.
 * - Uses eager + raw, so content is embedded at build time.
 * - Adds an ON-PAGE debug banner via ?debugHeader=1 (works even if console is noisy/minified).
 *
 * Expected layout:
 *   src/campaigns/<campaignFolder>/
 *     campaign.json
 *     operations/<op>.md
 *
 * Detection:
 * - Scan ALL op md files under operations/
 * - Find FIRST where 2nd NON-EMPTY line contains "start" (case-insensitive)
 */

const campaignJson = import.meta.glob("./src/campaigns/**/campaign.json", {
  as: "raw",
  eager: true,
});
const operationMd = import.meta.glob("./src/campaigns/**/operations/*.md", {
  as: "raw",
  eager: true,
});

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
  // ./src/campaigns/<campaignFolder>/operations/<file>.md
  const parts = String(opPath || "").split("/campaigns/");
  if (parts.length < 2) return null;
  return parts[1].split("/")[0] || null;
}

function resolveCampaignJsonPath(folder) {
  if (!folder) return null;
  const exact = `./src/campaigns/${folder}/campaign.json`;
  if (campaignJson[exact]) return exact;

  // fallback search by folder segment
  for (const path of Object.keys(campaignJson)) {
    const f = String(path).split("/campaigns/")[1]?.split("/")[0];
    if (f && f.toLowerCase() === String(folder).toLowerCase()) return path;
  }
  return null;
}

function loadCampaignJsonByPath(jsonPath) {
  if (!jsonPath) return null;
  try {
    return JSON.parse(campaignJson[jsonPath]);
  } catch {
    return null;
  }
}

function detectActiveCampaign(debug) {
  const ops = Object.entries(operationMd).sort(([a], [b]) => a.localeCompare(b));
  debug.opsCount = ops.length;
  debug.campaignCount = Object.keys(campaignJson).length;

  for (const [path, mdRaw] of ops) {
    if (!hasStartOnLine2(mdRaw)) continue;

    debug.startFound = true;
    debug.startOpPath = path;

    const folder = campaignFolderFromOpPath(path);
    debug.campaignFolder = folder;

    const jsonPath = resolveCampaignJsonPath(folder);
    debug.campaignJsonPath = jsonPath;

    const campaign =
      loadCampaignJsonByPath(jsonPath) || {
        id: folder || "unknown",
        name: folder ? folder.replace(/[-_]/g, " ") : "Active Campaign",
        system: "—",
        planet: "—",
        ao: "—",
      };

    return campaign;
  }

  debug.startFound = false;
  return null;
}

export default {
  name: "Header",
  data() {
    return {
      activeCampaign: null,
      debugEnabled: false,
      debug: {
        opsCount: 0,
        campaignCount: 0,
        startFound: false,
        startOpPath: "",
        campaignFolder: "",
        campaignJsonPath: "",
        error: "",
      },
    };
  },
  computed: {
    showCampaignPanel() {
      return Boolean(this.activeCampaign);
    },
    campaignHeader() {
      const c = this.activeCampaign;
      if (!c) return null;
      return {
        name: c.name || c.id || "—",
        system: c.system || "—",
        planet: c.planet || "—",
        ao: c.ao || c.AO || "—",
      };
    },
  },
  created() {
    try {
      const url = new URL(window.location.href);
      this.debugEnabled = url.searchParams.get("debugHeader") === "1";

      this.activeCampaign = detectActiveCampaign(this.debug);
    } catch (e) {
      this.activeCampaign = null;
      this.debug.error = String(e?.message || e || "unknown error");
    }
  },
  methods: {
    openCampaignLog() {
      this.$router.push({ path: "/campaigns" });
    },
  },
};
</script>

<style scoped>
/* Same header styling as your existing approved version */
.app-header {
  height: var(--app-header-height, 72px);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
}

.left {
  min-width: 0;
}

.brand {
  display: grid;
  gap: 2px;
}
.brand-top {
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(230, 251, 255, 0.92);
}
.brand-sub {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(214, 241, 255, 0.7);
}

.right {
  min-width: 0;
}

.active-panel {
  min-width: 420px;
  max-width: 820px;
  border-radius: 14px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px 12px;
  box-shadow: 0 0 0 1px rgba(150, 240, 255, 0.06);
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}
.panel-kicker {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(214, 241, 255, 0.72);
}

.panel-title {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(230, 251, 255, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-meta {
  display: grid;
  gap: 4px;
  margin-top: 6px;
}
.meta-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  align-items: center;
}
.label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(214, 241, 255, 0.65);
}
.value {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(214, 241, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.term-button {
  border-radius: 12px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(230, 251, 255, 0.92);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 10px;
}
.term-button:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(214, 241, 255, 0.9);
  font-size: 10px;
  letter-spacing: 0.18em;
  box-shadow: 0 0 18px rgba(90, 220, 255, 0.12);
}

/* Debug banner */
.debug-banner {
  justify-self: end;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
  padding: 8px 10px;
  max-width: 520px;
}
.debug-title {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(230, 251, 255, 0.92);
  margin-bottom: 6px;
}
.debug-line {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(214, 241, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.debug-error {
  margin-top: 6px;
  font-size: 10px;
  color: rgba(255, 170, 170, 0.95);
}

@media (max-width: 980px) {
  .app-header {
    grid-template-columns: 1fr;
    height: auto;
  }
  .active-panel {
    min-width: 0;
    width: 100%;
  }
  .debug-banner {
    max-width: none;
  }
}
</style>
