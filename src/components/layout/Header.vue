<!-- FILE: src/components/layout/Header.vue -->
<template>
  <header class="app-header">
    <div class="left">
      <div class="brand">
        <div class="brand-top">CENTCOM</div>
        <div class="brand-sub">OPERATIONS HUB</div>
      </div>
    </div>

    <!-- Shows ONLY when an operation file has "start" on line 2 -->
    <div v-if="currentCampaign" class="right">
      <div class="active-panel" role="status" aria-label="Active campaign">
        <div class="panel-top">
          <div class="panel-kicker">ACTIVE CAMPAIGN</div>
          <span class="status-pill" :data-status="String(currentCampaign.status || 'active')">
            {{ String(currentCampaign.status || "active").toUpperCase() }}
          </span>
        </div>

        <div class="panel-title">
          {{ currentCampaign.name || currentCampaign.id || "UNNAMED CAMPAIGN" }}
        </div>

        <div class="panel-meta">
          <div class="meta-row">
            <span class="label">SYSTEM</span>
            <span class="value">{{ currentCampaign.system || "—" }}</span>
          </div>
          <div class="meta-row">
            <span class="label">PLANET</span>
            <span class="value">{{ currentCampaign.planet || "—" }}</span>
          </div>
          <div class="meta-row">
            <span class="label">AO</span>
            <span class="value">{{ currentCampaign.ao || currentCampaign.AO || "—" }}</span>
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
 * Active campaign detection (inline; no extra helper file)
 *
 * Folder model requested:
 * - src/campaigns/<campaignFolder>/
 *     - campaign.json          (overall campaign details for display + header)
 *     - operations/<op>.md     (each operation file; "start" on line 2 => active campaign)
 *
 * If "start" is not present as line 2 in ANY op file, the header panel hides.
 *
 * Notes:
 * - Vite can only read static files at build-time via import.meta.glob.
 * - "line 2" is interpreted as the SECOND line after normalizing CRLF -> LF.
 */

const campaignJsonLoaders = import.meta.glob("/src/campaigns/**/campaign.json", { as: "raw" });
const operationMdLoaders = import.meta.glob("/src/campaigns/**/operations/*.md", { as: "raw" });

function splitLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

function hasStartOnLine2(mdRaw) {
  const ls = splitLines(mdRaw);
  const line2 = String(ls[1] || "").trim().toLowerCase();
  return line2 === "start" || line2.includes(" start ") || line2.startsWith("start ");
}

function campaignFolderFromOpPath(opPath) {
  // /src/campaigns/<campaignFolder>/operations/<file>.md
  const parts = String(opPath || "").split("/");
  const idx = parts.lastIndexOf("campaigns");
  if (idx < 0) return null;
  return parts[idx + 1] || null;
}

async function loadCampaignJsonForFolder(folderName) {
  if (!folderName) return null;

  const exactPath = `/src/campaigns/${folderName}/campaign.json`;
  if (campaignJsonLoaders[exactPath]) {
    const raw = await campaignJsonLoaders[exactPath]();
    return JSON.parse(raw);
  }

  // Fallback: search any campaign.json whose folder matches
  for (const [path, loader] of Object.entries(campaignJsonLoaders)) {
    const folder = String(path).split("/campaigns/")[1]?.split("/")[0];
    if (folder && folder.toLowerCase() === String(folderName).toLowerCase()) {
      const raw = await loader();
      return JSON.parse(raw);
    }
  }

  return null;
}

export default {
  name: "Header",
  data() {
    return {
      currentCampaign: null,
    };
  },
  async created() {
    await this.refreshActiveCampaign();
  },
  watch: {
    "$route.path"() {
      // mission files are static; refreshing on navigation is enough for POC.
      this.refreshActiveCampaign();
    },
  },
  methods: {
    fmtDates(start, end) {
      if (!start && !end) return "—";
      if (start && !end) return start;
      if (!start && end) return end;
      return `${start} → ${end}`;
    },
    async refreshActiveCampaign() {
      try {
        // Sort so if multiple "start" entries exist, we pick the LAST one
        // (works well if you name ops with date prefixes).
        const opEntries = Object.entries(operationMdLoaders).sort(([a], [b]) => a.localeCompare(b));

        let activeOpPath = null;

        for (const [path, loader] of opEntries) {
          const md = await loader();
          if (hasStartOnLine2(md)) {
            activeOpPath = path;
            break; // there should only ever be one START op
          }
        }

        if (!activeOpPath) {
          this.currentCampaign = null;
          return;
        }

        const folder = campaignFolderFromOpPath(activeOpPath);
        const campaign = await loadCampaignJsonForFolder(folder);

        // If campaign.json isn't present yet, fail open with a minimal object.
        this.currentCampaign =
          campaign || {
            id: folder || "unknown",
            name: folder ? folder.replace(/[-_]/g, " ") : "Active Campaign",
            status: "active",
          };
      } catch (e) {
        // Fail closed: header hides if anything goes wrong.
        this.currentCampaign = null;
        // eslint-disable-next-line no-console
        console.warn("[Header] active campaign lookup failed:", e);
      }
    },
    openCampaignLog() {
      // If you keep the campaignId param behavior, this will deep-link to the campaign modal.
      const id = this.currentCampaign?.id;
      this.$router.push({ path: "/campaigns", query: id ? { campaignId: id } : {} });
    },
  },
};
</script>

<style scoped>
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
}
.status-pill[data-status="active"] {
  box-shadow: 0 0 18px rgba(90, 220, 255, 0.12);
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
}
</style>
