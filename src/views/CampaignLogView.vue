<!-- FILE: src/views/CampaignLogView.vue -->
<template>
  <div id="campaignLog">
    <section class="section-container terminal-shell">
      <header class="terminal-header">
        <div class="terminal-badge">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>

        <div class="terminal-title">
          <div class="kicker">CENTCOM / ARCHIVES</div>
          <div class="title">HISTORICAL CAMPAIGN LOG</div>
        </div>

        <div class="terminal-right">
          <div class="stamp">SECURE TERMINAL</div>
          <div class="stamp subtle">POC BUILD</div>
        </div>
      </header>

      <div class="terminal-body">
        <div class="filters">
          <div class="filter-block">
            <div class="filter-label">SEARCH</div>
            <input
              v-model="search"
              class="term-input"
              type="text"
              placeholder="Campaign / operation / OPORD…"
            />
          </div>

          <div class="filter-block">
            <div class="filter-label">STATUS</div>
            <select v-model="statusFilter" class="term-select">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="training">Training</option>
              <option value="deployed">Deployed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="filter-block meta-block">
            <div class="filter-label">RECORDS</div>
            <div class="meta-chip">
              {{ filteredCampaigns.length }} campaign{{ filteredCampaigns.length === 1 ? "" : "s" }}
            </div>
          </div>
        </div>

        <div v-if="loadError" class="load-error">
          {{ loadError }}
        </div>

        <div class="campaign-list">
          <article v-for="c in filteredCampaigns" :key="c.id" class="campaign-card">
            <div class="card-topline"></div>

            <header class="campaign-header">
              <div class="campaign-title">
                <span class="status-pill" :data-status="c.status">
                  {{ String(c.status || "active").toUpperCase() }}
                </span>
                <h3>{{ c.name }}</h3>
              </div>

              <div class="campaign-meta">
                <div class="meta-line">
                  <span class="label">DATES</span>
                  <span class="value">{{ fmtDates(c.startDate, c.endDate) }}</span>
                </div>
                <div class="meta-line">
                  <span class="label">QTR</span>
                  <span class="value">{{ c.quarter || "—" }}</span>
                </div>
              </div>
            </header>

            <p class="desc">{{ c.overview || "—" }}</p>

            <div class="overview-snippets">
              <div class="snippet">
                <div class="section-label">OPS OVERVIEW</div>
                <ul class="mini-list">
                  <li v-for="op in (c.operations || []).slice(0, 2)" :key="op.id">
                    <span class="op-date">{{ op.date || "—" }}</span>
                    <span class="op-title">{{ op.title }}</span>
                    <span class="op-status" :data-op-status="op.status">
                      {{ op.status }}
                    </span>
                  </li>
                </ul>
                <div v-if="(c.operations || []).length > 2" class="muted">
                  + {{ (c.operations || []).length - 2 }} additional entries
                </div>
              </div>

              <div class="snippet">
                <div class="section-label">ROSTER</div>
                <div class="muted">
                  Per-unit roster is managed by unit leads. Open details for task force structure.
                </div>
              </div>
            </div>

            <footer class="campaign-actions">
              <button class="term-button terminal-button" type="button" @click="openCampaign(c)">
                VIEW DETAILS
              </button>
            </footer>
          </article>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="activeCampaign" class="modal-overlay" role="presentation" @click.self="closeCampaign">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Campaign details: ${activeCampaign.name}`"
        tabindex="-1"
        ref="modalRef"
      >
        <header class="modal-header">
          <div class="modal-title">
            <span class="status-pill" :data-status="activeCampaign.status">
              {{ String(activeCampaign.status || "active").toUpperCase() }}
            </span>
            <div>
              <div class="kicker">CAMPAIGN RECORD</div>
              <h2>{{ activeCampaign.name }}</h2>
            </div>
          </div>

          <button class="icon-button" type="button" @click="closeCampaign" aria-label="Close">
            ✕
          </button>
        </header>

        <div class="modal-body">
          <div class="modal-meta">
            <div>
              <span class="label">DATES</span>
              <span class="value">{{ fmtDates(activeCampaign.startDate, activeCampaign.endDate) }}</span>
            </div>
            <div>
              <span class="label">QTR</span>
              <span class="value">{{ activeCampaign.quarter || "—" }}</span>
            </div>
          </div>

          <section class="modal-section">
            <div class="section-label">TASK FORCE ORG CHART</div>

            <div v-if="activeCampaign.orgChart" class="orgchart">
              <div class="org-node root">
                <div class="node-title">{{ activeCampaign.orgChart.taskForceName }}</div>
                <div class="node-sub">
                  <span class="muted">HQ</span>
                  <span class="value">{{ activeCampaign.orgChart.taskForceHQ?.name }}</span>
                  <span class="muted">/</span>
                  <span class="value">{{ activeCampaign.orgChart.taskForceHQ?.commander }}</span>
                </div>
              </div>

              <div class="org-children">
                <div v-for="tu in activeCampaign.orgChart.taskUnits || []" :key="tu.name" class="org-node">
                  <div class="node-title">{{ tu.name }}</div>
                  <div class="node-sub">
                    <span class="muted">HQ</span>
                    <span class="value">{{ tu.hq?.name }}</span>
                    <span class="muted">/</span>
                    <span class="value">{{ tu.hq?.commander }}</span>
                  </div>

                  <div class="node-units">
                    <div class="muted">PARTICIPATING UNITS</div>
                    <ul class="unit-list">
                      <li v-for="u in (tu.units || [])" :key="u">
                        <button
                          class="unit-link"
                          type="button"
                          @click="goToUnit(u)"
                          :title="`Open backend roster for ${u}`"
                        >
                          {{ u }}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="muted">No org chart data yet.</div>
          </section>

          <section class="modal-section">
            <div class="section-label">OPERATIONS</div>

            <div v-if="(activeCampaign.operations || []).length" class="ops-table">
              <div class="ops-row ops-head">
                <div>DATE</div>
                <div>OPERATION</div>
                <div>STATUS</div>
                <div>OPORD</div>
              </div>

              <div v-for="op in activeCampaign.operations" :key="op.id" class="ops-row">
                <div class="op-date">{{ op.date || "—" }}</div>
                <div class="op-title">{{ op.title }}</div>
                <div>
                  <span class="op-status-pill" :data-op-status="op.status">
                    {{ op.status }}
                  </span>
                </div>
                <div>
                  <a
                    v-if="op.opordUrl"
                    class="opord-link"
                    :href="op.opordUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ op.opordTitle || "OPORD" }}
                  </a>
                  <span v-else class="muted">—</span>
                  <div v-if="op.opordSummary" class="opord-summary">
                    {{ op.opordSummary }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="muted">No operations logged yet.</div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="term-button terminal-button" type="button" @click="closeCampaign">
            CLOSE
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
// Content-driven campaigns (Vite requires literal globs)
const campaignJsonLoaders = import.meta.glob("/src/campaigns/**/campaign.json", { as: "raw", eager: true });
const operationMdLoaders = import.meta.glob("/src/campaigns/**/operations/*.md", { as: "raw", eager: true });

// Change this once the backend roster route is finalized.
const BACKEND_ROSTER_PATH = "/backend-roster";

function splitLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

function firstNonEmptyLines(mdRaw, max = 20) {
  const out = [];
  const ls = splitLines(mdRaw);
  for (const line of ls) {
    const t = String(line || "").trim();
    if (!t) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}


function campaignFolderFromPath(path) {
  const parts = String(path || "").split("/");
  const idx = parts.lastIndexOf("campaigns");
  if (idx < 0) return null;
  return parts[idx + 1] || null;
}

function fileStem(path) {
  const name = String(path || "").split("/").pop() || "";
  return name.replace(/\.[^.]+$/, "");
}

function normalizeOpStatus(token) {
  const v = String(token || "").trim().toLowerCase();
  if (!v) return "pending";
  if (v === "start") return "active";
  if (["pending", "completed", "failed", "success", "failure", "partial-success"].includes(v)) return v;
  return v;
}

function parseOpord(mdRaw) {
  // Supported:
  // - "opord: https://..." (anywhere)
  // - Markdown link: [OPORD](https://...)
  const text = String(mdRaw || "");
  const m1 = text.match(/\bopord\s*:\s*(https?:\/\/\S+)/i);
  if (m1?.[1]) return { url: m1[1] };

  const m2 = text.match(/\[([^\]]*opord[^\]]*)\]\((https?:\/\/[^)]+)\)/i);
  if (m2?.[2]) return { url: m2[2], title: m2[1] };

  return null;
}

function parseDate(mdRaw, path) {
  // Supported:
  // - "date: YYYY-MM-DD"
  // - fallback: YYYY-MM-DD in filename
  const text = String(mdRaw || "");
  const m1 = text.match(/\bdate\s*:\s*(\d{4}-\d{2}-\d{2})\b/i);
  if (m1?.[1]) return m1[1];

  const stem = fileStem(path);
  const m2 = stem.match(/(\d{4}-\d{2}-\d{2})/);
  if (m2?.[1]) return m2[1];

  return "";
}

function parseTitle(mdRaw, path) {
  const ls = firstNonEmptyLines(mdRaw);
  const h = String(ls[0] || "").trim();
  if (h.startsWith("#")) return h.replace(/^#+\s*/, "").trim();
  return fileStem(path).replace(/[-_]/g, " ").trim() || "Operation";
}

function parseOpSummary(mdRaw) {
  // Quick POC: first non-empty paragraph after line 2.
  const ls = splitLines(mdRaw).slice(2);
  const para = [];
  for (const line of ls) {
    const t = String(line || "").trim();
    if (!t) {
      if (para.length) break;
      continue;
    }
    if (t.startsWith("#")) continue;
    para.push(t);
    if (para.join(" ").length > 180) break;
  }
  const s = para.join(" ").trim();
  return s ? s : "";
}

async function loadCampaignsFromContent() {
  const campaigns = [];
  const campaignEntries = Object.entries(campaignJsonLoaders).sort(([a], [b]) => a.localeCompare(b));

  for (const [path, loader] of campaignEntries) {
    const raw = loader;
    const obj = JSON.parse(raw);

    const folder = campaignFolderFromPath(path) || obj.id || obj.slug || "unknown";
    const id = obj.id || folder;

    campaigns.push({
      id,
      folder,
      name: obj.name || id,
      status: obj.status || "active",
      startDate: obj.startDate || "",
      endDate: obj.endDate || "",
      quarter: obj.quarter || "",
      overview: obj.overview || "",
      orgChart: obj.orgChart || null,
      // carry-through extra fields for future use
      ...obj,
      operations: [],
    });
  }

  // Map ops into each campaign by folder
  const byFolder = new Map(campaigns.map((c) => [String(c.folder).toLowerCase(), c]));
  const opEntries = Object.entries(operationMdLoaders).sort(([a], [b]) => a.localeCompare(b));

  for (const [path, loader] of opEntries) {
    const folder = campaignFolderFromPath(path);
    const key = String(folder || "").toLowerCase();
    const campaign = byFolder.get(key);
    if (!campaign) continue;

    const md = loader;
    const ls = firstNonEmptyLines(md);

    const statusToken = String(ls[1] || "").trim();
    const status = normalizeOpStatus(statusToken);
    const title = parseTitle(md, path);
    const date = parseDate(md, path);
    const opord = parseOpord(md);

    campaign.operations.push({
      id: fileStem(path),
      title,
      date,
      status,
      opordUrl: opord?.url || "",
      opordTitle: opord?.title || "",
      opordSummary: parseOpSummary(md),
      sourcePath: path,
    });
  }

  // Derive campaign status: if any operation is active, campaign is active.
  for (const c of campaigns) {
    const hasActive = (c.operations || []).some((op) => op.status === "active");
    if (hasActive) c.status = "active";
  }

  // Sort ops by date if present, otherwise by id
  for (const c of campaigns) {
    c.operations = (c.operations || []).slice().sort((a, b) => {
      const ad = a.date || "";
      const bd = b.date || "";
      if (ad && bd) return ad.localeCompare(bd);
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  // Sort campaigns by startDate then name
  return campaigns.slice().sort((a, b) => {
    const ad = a.startDate || "";
    const bd = b.startDate || "";
    if (ad && bd) return ad.localeCompare(bd);
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return String(a.name).localeCompare(String(b.name));
  });
}

export default {
  name: "CampaignLogView",
  data() {
    return {
      campaigns: [],
      search: "",
      statusFilter: "",
      activeCampaign: null,
      loadError: "",
      _loadedOnce: false,
    };
  },
  computed: {
    filteredCampaigns() {
      const q = this.search.trim().toLowerCase();
      const status = this.statusFilter;

      return (this.campaigns || []).filter((c) => {
        if (status && c.status !== status) return false;
        if (!q) return true;

        const inCampaign =
          (c.name || "").toLowerCase().includes(q) ||
          (c.overview || "").toLowerCase().includes(q);

        const inOps = (c.operations || []).some((op) => {
          return (
            (op.title || "").toLowerCase().includes(q) ||
            (op.opordTitle || "").toLowerCase().includes(q) ||
            (op.opordSummary || "").toLowerCase().includes(q)
          );
        });

        return inCampaign || inOps;
      });
    },
  },
  watch: {
    "$route.query.campaignId"() {
      this.openFromRoute();
    },
  },
  async created() {
    try {
      this.campaigns = await loadCampaignsFromContent();
      this._loadedOnce = true;
      this.openFromRoute();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[CampaignLogView] failed to load campaigns:", e);
      this.loadError =
        "Campaign content could not be loaded. Ensure src/campaigns/<campaign>/campaign.json exists and operations are under src/campaigns/<campaign>/operations/*.md";
      this.campaigns = [];
      this._loadedOnce = true;
    }
  },
  mounted() {
    window.addEventListener("keydown", this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    backendRosterHref(unitName) {
      const unit = String(unitName || "").trim();
      if (!unit) return BACKEND_ROSTER_PATH;
      return `${BACKEND_ROSTER_PATH}?unit=${encodeURIComponent(unit)}`;
    },
    goToUnit(unitName) {
      const href = this.backendRosterHref(unitName);
      this.$router.push(href);
    },
    openFromRoute() {
      if (!this._loadedOnce) return;
      const id = this.$route?.query?.campaignId;
      if (!id) return;
      const match = (this.campaigns || []).find((c) => String(c.id) === String(id) || String(c.folder) === String(id));
      if (match) this.openCampaign(match);
    },
    fmtDates(start, end) {
      if (!start && !end) return "—";
      if (start && !end) return start;
      if (!start && end) return end;
      return `${start} → ${end}`;
    },
    openCampaign(c) {
      this.activeCampaign = c;
      // Make link shareable
      const q = { ...(this.$route?.query || {}) };
      if (c?.id) q.campaignId = c.id;
      this.$router.replace({ query: q });

      this.$nextTick(() => {
        if (this.$refs.modalRef) this.$refs.modalRef.focus();
      });
    },
    closeCampaign() {
      this.activeCampaign = null;
      const q = { ...(this.$route?.query || {}) };
      if (q.campaignId) {
        delete q.campaignId;
        this.$router.replace({ query: q });
      }
    },
    onKeydown(e) {
      if (e.key === "Escape" && this.activeCampaign) this.closeCampaign();
    },
  },
};
</script>

<style scoped>
/* UNSC-ish terminal styling (view-scoped)
   - Strong container background
   - Subtle scanlines + grid
   - Hard borders + soft glow
   - Compact, military UI typography
*/
#campaignLog {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;

  padding: calc(var(--app-header-height, 72px) + 24px) 24px 24px 24px;

  color: var(--text-pilot-value, #d6f1ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
}

/* Shell */
.terminal-shell {
  width: 100%;
  max-width: none;
  margin: 0;

  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 0 0 1px rgba(150, 240, 255, 0.08),
    0 12px 40px rgba(0, 0, 0, 0.55);
  overflow: hidden;

  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(90, 220, 255, 0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(90, 220, 255, 0.06), transparent 55%),
    linear-gradient(180deg, rgba(5, 15, 22, 0.92), rgba(3, 10, 16, 0.94));
}

/* Scanlines + grid overlay */
.terminal-shell::before,
.terminal-shell::after {
  content: "";
  position: absolute;
  pointer-events: none;
}
.terminal-shell {
  position: relative;
}
.terminal-shell::before {
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 100% 28px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px) 0 0 / 28px 100%;
  opacity: 0.22;
}
.terminal-shell::after {
  inset: 0;
  background: linear-gradient(transparent 60%, rgba(0, 0, 0, 0.22));
  opacity: 0.55;
}

/* Header bar */
.terminal-header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 110px 1fr 180px;
  gap: 12px;
  align-items: center;

  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  background:
    linear-gradient(90deg, rgba(90, 220, 255, 0.14), rgba(90, 220, 255, 0.02) 35%, transparent 70%),
    rgba(0, 0, 0, 0.22);
}

.terminal-badge {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(90, 220, 255, 0.14);
  box-shadow: 0 0 12px rgba(90, 220, 255, 0.16);
}

.terminal-title .kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
  text-transform: uppercase;
}
.terminal-title .title {
  margin-top: 2px;
  font-size: 16px;
  letter-spacing: 0.14em;
  color: var(--text-location, #e6fbff);
  text-transform: uppercase;
}

.terminal-right {
  display: grid;
  justify-items: end;
  gap: 4px;
}
.stamp {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(214, 241, 255, 0.9);
  border: 1px solid rgba(90, 220, 255, 0.18);
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
}
.stamp.subtle {
  opacity: 0.7;
}

/* Body */
.terminal-body {
  position: relative;
  z-index: 1;
  padding: 16px;
}

/* Filters */
.filters {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 0.3fr;
  gap: 12px;
  align-items: end;
  margin-bottom: 14px;
}

.filter-label {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing: 0.08em;
}

.term-input,
.term-select {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-pilot-value, #d6f1ff);
  padding: 10px 12px;
  outline: none;
}
.term-input::placeholder {
  color: rgba(214, 241, 255, 0.5);
}
.term-input:focus,
.term-select:focus {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.14);
  border-color: rgba(90, 220, 255, 0.28);
}

.load-error {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.26);
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 12px;
  color: rgba(230, 251, 255, 0.92);
}

/* Cards */
.campaign-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.campaign-card {
  position: relative;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;

  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.32)),
    radial-gradient(900px 260px at 20% 0%, rgba(90, 220, 255, 0.06), transparent 60%);
}

.card-topline {
  height: 2px;
  background: linear-gradient(90deg, rgba(90, 220, 255, 0.5), transparent 70%);
}

.campaign-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background: linear-gradient(transparent 65%, rgba(0, 0, 0, 0.28));
}

.campaign-card > * {
  position: relative;
  z-index: 1;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 12px 12px 0;
}

.campaign-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.campaign-title h3 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-location, #e6fbff);
}

.campaign-meta {
  display: grid;
  gap: 6px;
  text-align: right;
}

.meta-line .label {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.7));
  margin-right: 8px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.meta-line .value {
  color: var(--text-pilot-value, #d6f1ff);
  font-variant-numeric: tabular-nums;
}

.desc {
  margin: 10px 12px 12px;
  color: var(--text-pilot-value, #d6f1ff);
  line-height: 1.35;
  opacity: 0.95;
}

.overview-snippets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 12px 12px;
}

.section-label {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
  margin-bottom: 8px;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.mini-list li {
  display: grid;
  grid-template-columns: 120px 1fr 92px;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;

  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.22);
}

.op-date {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
  font-variant-numeric: tabular-nums;
}
.op-title {
  color: var(--text-pilot-value, #d6f1ff);
}
.op-status {
  justify-self: end;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
  opacity: 0.95;
}

.muted {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.7));
  opacity: 0.95;
}

.campaign-actions {
  padding: 0 12px 12px;
  display: flex;
  justify-content: flex-end;
}

/* Buttons */
.terminal-button {
  border-radius: 12px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 10px 14px;
}
.terminal-button:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

/* Pills (status) */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  color: var(--text-pilot-value, #d6f1ff);
  font-size: 10px;
  letter-spacing: 0.18em;
}
.status-pill[data-status="active"] {
  box-shadow: 0 0 18px rgba(90, 220, 255, 0.12);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}

.modal {
  width: min(1200px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(90, 220, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(5, 15, 22, 0.92), rgba(3, 10, 16, 0.94));
  box-shadow:
    0 0 0 1px rgba(150, 240, 255, 0.08),
    0 18px 60px rgba(0, 0, 0, 0.7);
  outline: none;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
}
.modal-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: none;
}

.modal-title {
  display: flex;
  gap: 12px;
  align-items: center;
}
.modal-title .kicker {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
}
.modal-title h2 {
  margin: 2px 0 0;
  font-size: 16px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-location, #e6fbff);
}

.icon-button {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(90, 220, 255, 0.18);
  color: var(--text-pilot-value, #d6f1ff);
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
}
.icon-button:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

.modal-body {
  padding: 16px;
}

.modal-meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(90, 220, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
}
.modal-meta .label {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.7));
  margin-right: 8px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.modal-meta .value {
  color: var(--text-pilot-value, #d6f1ff);
  font-variant-numeric: tabular-nums;
}

.modal-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

/* Org chart */
.orgchart {
  display: grid;
  gap: 12px;
}

.org-node {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.22);
}

.org-node.root {
  border-color: rgba(90, 220, 255, 0.18);
}

.node-title {
  color: var(--text-location, #e6fbff);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.node-sub {
  color: var(--text-pilot-value, #d6f1ff);
  opacity: 0.95;
}

.org-children {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.unit-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--text-pilot-value, #d6f1ff);
}

.unit-link {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--text-location, #e6fbff);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font: inherit;
}

.unit-link:hover {
  opacity: 0.9;
}

.unit-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.18);
  border-radius: 8px;
}

.node-units .muted {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* Operations table */
.ops-table {
  display: grid;
  gap: 10px;
}

.ops-row {
  display: grid;
  grid-template-columns: 120px 1fr 140px 1.2fr;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.22);
}

.ops-head {
  background: rgba(0, 0, 0, 0.28);
  color: var(--text-location, #e6fbff);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 10px;
}

.op-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  color: var(--text-pilot-value, #d6f1ff);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.16em;
  opacity: 0.95;
}

.op-status-pill[data-op-status="completed"],
.op-status-pill[data-op-status="success"] {
  box-shadow: 0 0 16px rgba(90, 220, 255, 0.12);
}
.op-status-pill[data-op-status="pending"],
.op-status-pill[data-op-status="active"] {
  opacity: 0.85;
}
.op-status-pill[data-op-status="failed"],
.op-status-pill[data-op-status="failure"] {
  opacity: 0.75;
}

.opord-link {
  color: var(--text-location, #e6fbff);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.opord-summary {
  margin-top: 8px;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.72));
  line-height: 1.25;
}

/* Responsive */
@media (max-width: 980px) {
  .filters {
    grid-template-columns: 1fr;
  }
  .overview-snippets {
    grid-template-columns: 1fr;
  }
  .mini-list li {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .campaign-meta {
    text-align: left;
  }
  .campaign-header {
    flex-direction: column;
  }
  .org-children {
    grid-template-columns: 1fr;
  }
  .ops-row {
    grid-template-columns: 1fr;
  }
}
</style>
