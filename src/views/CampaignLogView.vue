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
            <input v-model="search" class="term-input" type="text" placeholder="Campaign / operation / OPORD…" />
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

        <div class="campaign-list">
          <article v-for="c in filteredCampaigns" :key="c.id" class="campaign-card">
            <div class="card-topline"></div>

            <header class="campaign-header">
              <div class="campaign-title">
                <span class="status-pill" :data-status="c.status">
                  {{ (c.status || "—").toUpperCase() }}
                </span>
                <h3>{{ c.name }}</h3>
              </div>

              <div class="campaign-meta">
                <div class="meta-line">
                  <span class="label">DATES</span>
                  <span class="value">{{ fmtDates(c.startDate, c.endDate) }}</span>
                </div>
</div>
            </header>

            <p class="desc">{{ c.overview }}</p>

            <div class="overview-snippets">
              <div class="snippet">
                <div class="section-label">OPS OVERVIEW</div>
                <ul class="mini-list">
                  <li v-for="op in (c.operations || []).slice(0, 2)" :key="op.id">
                    <span class="op-date">{{ op.date || "—" }}</span>
                    <span class="op-title">{{ op.title }}</span>
                    <span class="op-status" :data-op-status="op.status">
                      {{ op.status || "pending" }}
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
                  Participating units are managed by unit leads. Open details for org chart + unit links.
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
              {{ (activeCampaign.status || "—").toUpperCase() }}
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
</div>

          <section class="modal-section">
            <div class="section-label">TASK FORCE ORG CHART</div>

            <div v-if="activeCampaign.orgChart" class="orgchart">
              <div class="org-node root">
                <div class="node-title">{{ activeCampaign.orgChart.taskForceName || "Task Force" }}</div>
                <div v-if="activeCampaign.command?.commander" class="node-sub">
                  <span class="muted">COMMANDER:</span>
                  <span class="value">{{ activeCampaign.command.commander.name || "—" }}</span>
                </div>

                <div v-if="activeCampaign.command?.subCommanders?.length" class="node-sub">
                  <span class="muted">SUB-COMMANDER:</span>
                  <span class="value">{{ (activeCampaign.command.subCommanders && activeCampaign.command.subCommanders[0] && activeCampaign.command.subCommanders[0].name) || "—" }}</span>
                  <span class="muted">SUB-COMMANDER:</span>
                  <span class="value">{{ (activeCampaign.command.subCommanders && activeCampaign.command.subCommanders[1] && activeCampaign.command.subCommanders[1].name) || "—" }}</span>
                </div>
</div>

              <div class="org-children">
                <div
                  v-for="tu in activeCampaign.orgChart.taskUnits || []"
                  :key="tu.id || tu.name"
                  class="org-node"
                >
                  <div class="node-title">{{ tu.name }}</div>

                  <div class="node-sub">
                    <span class="muted">COMMANDER:</span>
                    <span class="value">{{ commanderLabel(activeCampaign, tu.commanderId) }}</span>
                  </div>

                  <div class="node-units">
                    <div class="muted">PARTICIPATING UNITS</div>
                    <ul class="unit-list">
                      <li v-for="u in unitsForTaskUnit(activeCampaign, tu)" :key="u.id">
                        <img
                          v-if="u.patch"
                          :src="u.patch"
                          :alt="`${u.name} patch`"
                          width="18"
                          height="18"
                          style="margin-right:6px; object-fit:contain; vertical-align:middle;"
                          loading="lazy"
                          decoding="async"
                        />
                        <a
                          v-if="u.backendUnitSlug"
                          class="unit-link"
                          href="#"
                          @click.prevent="openBackendUnit(u.backendUnitSlug)"
                        >
                          {{ u.name }}
                        </a>
                        <span v-else>{{ u.name }}</span>
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
                <div>LINKS</div>
              </div>

              <div v-for="op in activeCampaign.operations" :key="op.id" class="ops-row">
                <div class="op-date">{{ op.date || "—" }}</div>

                <div class="op-title-wrap">
                  <div class="op-title">{{ op.title }}</div>

                  <div class="op-links" v-if="op.commandersRef || op.hallOfFameRef">
                    <button
                      v-if="op.commandersRef"
                      class="mini-chip"
                      type="button"
                      @click="openHallOfCommanders(activeCampaign, op)"
                      :title="`Open Hall of Commanders for ${op.title}`"
                    >
                      COMMAND
                    </button>

                    <button
                      v-if="op.hallOfFameRef"
                      class="mini-chip"
                      type="button"
                      @click="openHallOfFame(activeCampaign, op)"
                      :title="`Open Hall of Fame for ${op.title}`"
                    >
                      AWARDS
                    </button>
                  </div>
                </div>

                <div>
                  <span class="op-status-pill" :data-op-status="op.status || 'pending'">
                    {{ op.status || "pending" }}
                  </span>
                </div>

                <div>
                  <div class="op-links-cell">
                  <template v-if="(op.links || []).length">
                    <a
                      v-for="(lnk, i) in op.links"
                      :key="(lnk.url || '') + i"
                      class="opord-link"
                      :href="lnk.url"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ lnk.label || lnk.title || 'LINK' }}
                    </a>
                  </template>
                  <a v-else-if="op.opordUrl" class="opord-link" :href="op.opordUrl" target="_blank" rel="noreferrer">
                    {{ op.opordTitle || "OPORD" }}
                  </a>
                  <span v-else class="muted">—</span>
                  <div v-if="op.summary || op.opordSummary" class="opord-summary">
                    {{ op.summary || op.opordSummary }}
                  </div>
                </div>
                </div>
              </div>

              <div class="ops-help muted">
                Tip: “COMMAND” and “AWARDS” are linked by simple IDs in campaign.json so they’re easy to swap.
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
import { getConfig } from "@/config/runtimeConfig";

/**
 * Content-driven campaign loader.
 *
 * Folder model:
 *   src/campaigns/<campaignFolder>/
 *     campaign.json
 *     operations/<op>.md (optional legacy)
 *
 * Operations (NEW):
 * - Prefer Google Sheets CSV (config: sheets.operationsCsvUrl)
 *   Columns expected (case-insensitive):
 *     CAMPAIGN NAME | OPERATIONS | OP LINKS | STATUS | SUMMARY | DATE (optional)
 * - Rows are grouped by campaign: when CAMPAIGN NAME cell is non-empty, it becomes the current campaign group.
 *   Subsequent rows belong to that campaign until the next CAMPAIGN NAME appears.
 *
 * Linking model:
 * - OP LINKS cell can contain:
 *     - a single URL
 *     - multiple URLs separated by comma or whitespace
 *     - optional label via "Label|https://..." (pipe-separated) per link
 * - If a link cell can't be parsed into URLs, it is ignored.
 *
 * Legacy fallback (if no CSV configured or fetch fails):
 * - campaign.json `operationsIndex[]` plus optional md overrides.
 */
const CAMPAIGN_JSON = import.meta.glob("/src/campaigns/**/campaign.json", { eager: true, query: "?raw", import: "default" });
const OPERATION_MD = import.meta.glob("/src/campaigns/**/operations/*.md", { eager: true, query: "?raw", import: "default" });

function safeJson(raw) {
  try {
    return JSON.parse(String(raw || ""));
  } catch {
    return null;
  }
}

function normalizeStatus(s) {
  const v = String(s || "").trim().toLowerCase();
  if (!v) return "pending";

  // Normalize common inputs (Sheets might use "Partial-Success", etc.)
  if (v === "partial success" || v === "partial-success" || v === "partial_success") return "partial-success";
  if (v === "success") return "success";
  if (v === "failure" || v === "failed") return "failure";
  if (v === "active") return "active";
  if (v === "training") return "training";
  if (v === "rearming" || v === "rest") return "rearming";
  return v;
}

function parseDateCell(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;

  // ISO-ish: YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // UK-ish: DD/MM/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dt = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // DD-MM-YYYY
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const dt = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    return isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatIsoDate(dt) {
  if (!dt || isNaN(dt.getTime())) return "";
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function deriveDateRangeFromOps(ops) {
  const list = Array.isArray(ops) ? ops : [];
  if (!list.length) return { start: "", end: "" };

  let minDt = null;
  let maxDt = null;

  for (const op of list) {
    const dt = parseDateCell(op?.date);
    if (!dt) continue;
    if (!minDt || dt.getTime() < minDt.getTime()) minDt = dt;
    if (!maxDt || dt.getTime() > maxDt.getTime()) maxDt = dt;
  }

  return {
    start: minDt ? formatIsoDate(minDt) : "",
    end: maxDt ? formatIsoDate(maxDt) : "",
  };
}

function normToken(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function toSafeString(v) {
  return String(v ?? "").trim();
}

/**
 * Unit patch lookup supports either:
 *  - campaign.unitPatches: { "1st Marines": "/patch.png" }
 *  - campaign.assets.unitPatches: { ... }
 */
function buildUnitPatchLookup(campaign) {
  const raw = campaign?.unitPatches || campaign?.assets?.unitPatches || {};
  const out = {};
  if (!raw || typeof raw !== "object") return out;

  for (const [k, v] of Object.entries(raw)) {
    const key = normToken(k);
    const src = toSafeString(v);
    if (key && src) out[key] = src;
  }
  return out;
}

function ensurePerson(obj, prefix) {
  if (!obj || typeof obj !== "object") return null;
  const name = toSafeString(obj.name || obj.fullName || obj.displayName);
  const callsign = toSafeString(obj.callsign);
  const id =
    toSafeString(obj.id) ||
    (callsign ? `${prefix}_${normToken(callsign)}` : "") ||
    (name ? `${prefix}_${normToken(name)}` : "");
  return { ...obj, id, name, callsign };
}

function buildCommandRosterFromCommand(campaign) {
  const cmd = ensurePerson(campaign?.command?.commander, "cmd");
  const subs = Array.isArray(campaign?.command?.subCommanders)
    ? campaign.command.subCommanders.map((x) => ensurePerson(x, "sub")).filter(Boolean)
    : [];
  return { commander: cmd, subCommanders: subs };
}

function normalizeUnitEntry(campaign, entry, patchLookup) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const name = toSafeString(entry);
    if (!name) return null;
    const id = `u_${normToken(name)}`;
    return {
      id,
      name,
      backendUnitSlug: name,
      patch: patchLookup[normToken(name)] || "",
    };
  }

  if (typeof entry !== "object") return null;

  const name = toSafeString(entry.name || entry.unitName || entry.title);
  if (!name) return null;

  const backendUnitSlug = toSafeString(entry.backendUnitSlug || entry.slug) || name;
  const id = toSafeString(entry.id) || backendUnitSlug || `u_${normToken(name)}`;

  const patch =
    toSafeString(entry.patch) ||
    patchLookup[normToken(name)] ||
    patchLookup[normToken(backendUnitSlug)] ||
    "";

  return { ...entry, id, name, backendUnitSlug, patch };
}

function deriveOrgChartFromTaskForces(campaign) {
  const tfs = Array.isArray(campaign?.taskForces) ? campaign.taskForces : [];
  if (!tfs.length) return null;

  const cmd = campaign?.command?.commander || null;
  const taskForceName =
    toSafeString(cmd?.unitName) ||
    toSafeString(campaign?.taskForceName) ||
    toSafeString(campaign?.name) ||
    "Task Force";

  const patchLookup = buildUnitPatchLookup(campaign);

  const taskForceHQ = {
    name: `${taskForceName} HQ`,
    commanderId: toSafeString(cmd?.id) || toSafeString(cmd?.name) || "",
  };

  const taskUnits = tfs
    .map((tf) => {
      const name = toSafeString(tf?.name);
      if (!name) return null;

      const unitsRaw = Array.isArray(tf?.units) ? tf.units : [];
      const units = unitsRaw.map((u) => normalizeUnitEntry(campaign, u, patchLookup)).filter(Boolean);

      return {
        id: toSafeString(tf?.id) || `div_${normToken(name)}`,
        name,
        hqName: toSafeString(tf?.hq || tf?.hqName) || `${name} HQ`,
        commanderId:
          toSafeString(tf?.commanderId) ||
          toSafeString(tf?.commanderName) ||
          toSafeString(tf?.commander) ||
          "",
        unitIds: units.map((u) => u.id),
        units,
      };
    })
    .filter(Boolean);

  return { taskForceName, taskForceHQ, taskUnits };
}

function splitLines(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n");
}

function firstNonEmptyLines(mdRaw, max = 40) {
  const out = [];
  for (const line of splitLines(mdRaw)) {
    const t = String(line || "").trim();
    if (!t) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function parseOpMdMeta(mdRaw) {
  const lines = firstNonEmptyLines(mdRaw);
  const meta = {};
  for (const l of lines) {
    const idx = l.indexOf(":");
    if (idx <= 0) continue;
    const key = l.slice(0, idx).trim().toLowerCase();
    const val = l.slice(idx + 1).trim();
    if (!key || !val) continue;

    if (["date", "status", "opord_title", "opord_url", "commanders_ref", "hall_of_fame_ref"].includes(key)) {
      meta[key] = val;
    }
  }
  return meta;
}

function campaignFolderFromPath(path) {
  const parts = String(path || "").split("/campaigns/");
  if (parts.length < 2) return null;
  return parts[1].split("/")[0] || null;
}

function buildOpMdIndex() {
  const out = {};
  for (const [path, raw] of Object.entries(OPERATION_MD)) {
    const folder = campaignFolderFromPath(path);
    if (!folder) continue;
    const rel = String(path).split(`/src/campaigns/${folder}/`)[1] || "";
    out[`${folder}/${rel}`] = raw;
  }
  return out;
}

/** Simple CSV parser (handles quotes). Returns array of rows (array of cells). */
function parseCsv(text) {
  const s = String(text || "");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = s[i + 1];
        if (next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (ch === "\r") continue;

    cell += ch;
  }

  // flush
  row.push(cell);
  rows.push(row);

  // trim empty trailing rows
  return rows.filter((r) => r.some((c) => String(c || "").trim() !== ""));
}

function normKey(s) {
  return String(s || "").trim().toLowerCase();
}

function buildHeaderMap(headerRow) {
  const map = {};
  (headerRow || []).forEach((h, idx) => {
    const k = normKey(h);
    if (!k) return;
    map[k] = idx;
  });
  return map;
}

function getCell(row, headerMap, key) {
  const idx = headerMap[key];
  if (idx === undefined) return "";
  return String(row[idx] ?? "").trim();
}

function parseLinks(cell) {
  const raw = String(cell || "").trim();
  if (!raw) return [];

  // Split on commas first, then on whitespace if still one chunk.
  const parts = raw.includes(",") ? raw.split(",") : raw.split(/\s+/);
  const out = [];

  for (const p of parts) {
    const t = String(p || "").trim();
    if (!t) continue;

    // Allow "LABEL|URL"
    const pipeIdx = t.indexOf("|");
    if (pipeIdx > 0) {
      const label = t.slice(0, pipeIdx).trim();
      const url = t.slice(pipeIdx + 1).trim();
      if (/^https?:\/\//i.test(url)) out.push({ label: label || "LINK", url });
      continue;
    }

    if (/^https?:\/\//i.test(t)) {
      out.push({ label: "LINK", url: t });
    }
  }

  // De-dupe by url
  const seen = new Set();
  return out.filter((x) => {
    const u = x.url || "";
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/**
 * Load operations grouped by campaign name from CSV.
 * Returns map { [normalizedCampaignName]: operations[] }
 */
async function loadOperationsFromCsv(csvUrl) {
  if (!csvUrl) return null;

  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch operations CSV (${res.status})`);
  const text = await res.text();

  const rows = parseCsv(text);
  if (!rows.length) return null;

  const headerMap = buildHeaderMap(rows[0]);
  // Required keys
  const kCampaign = headerMap["campaign name"] !== undefined ? "campaign name" : null;
  const kOp = headerMap["operations"] !== undefined ? "operations" : null;
  if (!kCampaign || !kOp) return null;

  const kLinks = headerMap["op links"] !== undefined ? "op links" : null;
  const kStatus = headerMap["status"] !== undefined ? "status" : null;
  const kSummary = headerMap["summary"] !== undefined ? "summary" : null;
  const kDate = headerMap["date"] !== undefined ? "date" : null;

  const out = {};
  let current = "";

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const campaignCell = getCell(row, headerMap, kCampaign);
    if (campaignCell) current = campaignCell;

    if (!current) continue;

    const opTitle = getCell(row, headerMap, kOp);
    if (!opTitle) continue;

    const linksCell = kLinks ? getCell(row, headerMap, kLinks) : "";
    const statusCell = kStatus ? getCell(row, headerMap, kStatus) : "";
    const summaryCell = kSummary ? getCell(row, headerMap, kSummary) : "";
    const dateCell = kDate ? getCell(row, headerMap, kDate) : "";

    const key = normKey(current);
    if (!out[key]) out[key] = [];

    out[key].push({
      id: `${key}__${r}`,
      title: opTitle,
      date: dateCell,
      status: normalizeStatus(statusCell || "pending"),
      summary: summaryCell,
      links: parseLinks(linksCell),
      // keep these for backwards compatibility with the view template
      opordTitle: "",
      opordUrl: "",
      opordSummary: "",
      commandersRef: "",
      hallOfFameRef: "",
      file: "",
    });
  }

  return out;
}

function loadCampaignsFromContent() {
  const mdIndex = buildOpMdIndex();

  return Object.entries(CAMPAIGN_JSON)
    .map(([path, raw]) => {
      const folder = campaignFolderFromPath(path);
      const json = safeJson(raw);
      if (!json || !folder) return null;

      const ops = (json.operationsIndex || []).map((op) => {
        const file = String(op.file || "").trim();
        const mdKey = file ? `${folder}/${file}` : "";
        const mdRaw = mdKey && mdIndex[mdKey] ? mdIndex[mdKey] : null;
        const meta = mdRaw ? parseOpMdMeta(mdRaw) : {};

        return {
          id: op.id || file || op.title,
          title: op.title || "—",
          date: meta.date || op.date || "",
          status: normalizeStatus(meta.status || op.status),
          opordTitle: op.opordTitle || meta.opord_title || "",
          opordUrl: op.opordUrl || meta.opord_url || "",
          opordSummary: op.opordSummary || "",

          commandersRef: op.commandersRef || meta.commanders_ref || "",
          hallOfFameRef: op.hallOfFameRef || meta.hall_of_fame_ref || "",

          file,
        };
      });

      const derivedOrgChart = deriveOrgChartFromTaskForces(json);
      const orgChart =
        json.orgChart && Array.isArray(json.orgChart.taskUnits) && json.orgChart.taskUnits.length
          ? json.orgChart
          : derivedOrgChart;

      const commandRoster = json.commandRoster || buildCommandRosterFromCommand(json);

      return {
        ...json,
        id: json.id || folder,
        status: normalizeStatus(json.status),
        operations: ops,
        orgChart: orgChart || json.orgChart || null,
        commandRoster,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")));
}

export default {
  name: "CampaignLogView",
  data() {
    return {
      campaigns: loadCampaignsFromContent(),
      search: "",
      statusFilter: "",
      activeCampaign: null,
      _opsCsvLoaded: false,
    };
  },
  computed: {
    filteredCampaigns() {
      const q = this.search.trim().toLowerCase();
      const status = this.statusFilter;

      return (this.campaigns || []).filter((c) => {
        if (status && normalizeStatus(c.status) !== status) return false;
        if (!q) return true;

        const inCampaign =
          (c.name || "").toLowerCase().includes(q) ||
          (c.overview || "").toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q) ||
          (c.system || "").toLowerCase().includes(q) ||
          (c.planet || "").toLowerCase().includes(q) ||
          (c.ao || "").toLowerCase().includes(q);

        const inOps = (c.operations || []).some((op) => {
          return (
            (op.title || "").toLowerCase().includes(q) ||
            (op.summary || op.opordSummary || "").toLowerCase().includes(q)
          );
        });

        return inCampaign || inOps;
      });
    },
  },
  async mounted() {
    window.addEventListener("keydown", this.onKeydown);

    // NEW: load operations from sheets and merge into campaigns
    const csvUrl = getConfig()?.sheets?.operationsCsvUrl || "";
    if (!csvUrl) return;

    try {
      const opsByCampaign = await loadOperationsFromCsv(csvUrl);
      if (!opsByCampaign) return;

            this.campaigns = (this.campaigns || []).map((c) => {
        const key = normKey(c.name || c.id || "");
        const ops = opsByCampaign[key];
        if (!ops || !ops.length) return c;

        const range = deriveDateRangeFromOps(ops);

        return {
          ...c,
          operations: ops,
          startDate: range.start || c.startDate || "",
          endDate: range.end || c.endDate || "",
        };
      });this._opsCsvLoaded = true;
    } catch (e) {
      // Silent fallback to campaign.json ops
      // (You can surface this in UI later if you want)
      this._opsCsvLoaded = false;
    }
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    fmtDates(start, end) {
      if (!start && !end) return "—";
      if (start && !end) return start;
      if (!start && end) return end;
      return `${start} → ${end}`;
    },
    openCampaign(c) {
      this.activeCampaign = c;
      this.$nextTick(() => {
        if (this.$refs.modalRef) this.$refs.modalRef.focus();
      });
    },
    closeCampaign() {
      this.activeCampaign = null;
    },
    onKeydown(e) {
      if (e.key === "Escape" && this.activeCampaign) this.closeCampaign();
    },

    commanderLabel(campaign, commanderId) {
      if (!campaign || !commanderId) return "—";

      const roster = campaign.commandRoster || {};
      const all = [roster.commander ? roster.commander : null, ...(Array.isArray(roster.subCommanders) ? roster.subCommanders : [])].filter(Boolean);

      const key = normToken(commanderId);

      const found = all.find((x) => normToken(x.id || "") === key || normToken(x.name || "") === key);
      if (!found) return "—";

      const callsign = found.callsign ? `CALLSIGN ${found.callsign}` : "";
      const name = found.name || "";
      return [callsign, name].filter(Boolean).join(" / ") || "—";
    },

    unitsForTaskUnit(campaign, taskUnit) {
      const embedded = Array.isArray(taskUnit?.units) ? taskUnit.units : [];
      if (embedded.length) return embedded;

      const units = campaign?.roster?.units || [];
      const ids = Array.isArray(taskUnit?.unitIds) ? taskUnit.unitIds : [];
      const patchLookup = buildUnitPatchLookup(campaign);

      return units
        .filter((u) => ids.includes(u.id))
        .map((u) => ({ ...u, patch: toSafeString(u.patch) || patchLookup[normToken(u.name)] || "" }));
    },

    openBackendUnit(unitSlug) {
      this.$router.push({ path: "/backend-roster", query: { unit: unitSlug } });
    },

    openHallOfCommanders(campaign, op) {
      const campaignId = campaign?.id || "";
      const opId = op?.id || "";
      const ref = op?.commandersRef || "";

      this.$router.push({
        path: "/command",
        query: {
          campaign: campaignId,
          op: opId,
          commanders: ref || undefined,
        },
      });
    },

    openHallOfFame(campaign, op) {
      const campaignId = campaign?.id || "";
      const opId = op?.id || "";
      const ref = op?.hallOfFameRef || "";

      this.$router.push({
        path: "/hall-of-fame",
        query: {
          campaign: campaignId,
          op: opId,
          fame: ref || undefined,
        },
      });
    },
  },
};
</script>

<style scoped>
/* UNSC-ish terminal styling (view-scoped) */
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
  box-shadow: 0 0 0 1px rgba(150, 240, 255, 0.08), 0 12px 40px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(90, 220, 255, 0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(90, 220, 255, 0.06), transparent 55%),
    linear-gradient(180deg, rgba(5, 15, 22, 0.92), rgba(3, 10, 16, 0.94));
  position: relative;
}

/* Scanlines + grid overlay */
.terminal-shell::before,
.terminal-shell::after {
  content: "";
  position: absolute;
  pointer-events: none;
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
  color: rgba(214, 241, 255, 0.75);
  text-transform: uppercase;
}
.terminal-title .title {
  margin-top: 2px;
  font-size: 16px;
  letter-spacing: 0.14em;
  color: #e6fbff;
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
  color: rgba(214, 241, 255, 0.75);
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
  color: #e6fbff;
  letter-spacing: 0.08em;
}

/* === UPDATED: terminal-themed inputs + selects (incl. dropdown menu) === */
.term-input,
.term-select {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(90, 220, 255, 0.22);

  /* closer to terminal shell */
  background: rgba(5, 15, 22, 0.82);

  color: rgba(230, 251, 255, 0.95);
  padding: 10px 12px;
  outline: none;

  /* strongly nudges browser to render native controls in dark mode */
  color-scheme: dark;
}

.term-input::placeholder {
  color: rgba(214, 241, 255, 0.55);
}

.term-input:focus,
.term-select:focus {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.14);
  border-color: rgba(90, 220, 255, 0.34);
}

/* Dropdown list items (works in most browsers) */
.term-select option,
.term-select optgroup {
  background-color: rgb(6, 16, 24);
  color: rgba(230, 251, 255, 0.95);
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
  color: #e6fbff;
}

.campaign-meta {
  display: grid;
  gap: 6px;
  text-align: right;
}
.meta-line .label {
  color: rgba(214, 241, 255, 0.7);
  margin-right: 8px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.meta-line .value {
  color: #d6f1ff;
  font-variant-numeric: tabular-nums;
}

.desc {
  margin: 10px 12px 12px;
  color: #d6f1ff;
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
  color: rgba(214, 241, 255, 0.75);
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
  color: rgba(214, 241, 255, 0.75);
  font-variant-numeric: tabular-nums;
}
.op-title {
  color: #d6f1ff;
}
.op-status {
  justify-self: end;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(214, 241, 255, 0.75);
  opacity: 0.95;
}

.muted {
  color: rgba(214, 241, 255, 0.7);
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
  color: #e6fbff;
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
  color: #d6f1ff;
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
  box-shadow: 0 0 0 1px rgba(150, 240, 255, 0.08), 0 18px 60px rgba(0, 0, 0, 0.7);
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
  color: rgba(214, 241, 255, 0.75);
}
.modal-title h2 {
  margin: 2px 0 0;
  font-size: 16px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #e6fbff;
}

.icon-button {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(90, 220, 255, 0.18);
  color: #d6f1ff;
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
  color: rgba(214, 241, 255, 0.7);
  margin-right: 8px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.modal-meta .value {
  color: #d6f1ff;
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



/* Org chart readability: spacing between labels/values */
.orgchart .node-sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 6px;
}

.orgchart .node-sub .muted {
  white-space: nowrap;
}

.orgchart .node-sub .value {
  min-width: 0;
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
  color: #e6fbff;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.node-sub {
  color: #d6f1ff;
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
  color: #d6f1ff;
}

.unit-link {
  color: #e6fbff;
  text-decoration: underline;
  text-underline-offset: 3px;
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
  color: #e6fbff;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 10px;
}

.op-title-wrap {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.op-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-chip {
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(230, 251, 255, 0.92);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 6px 10px;
  cursor: pointer;
}
.mini-chip:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

.ops-help {
  margin-top: 6px;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.op-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  color: #d6f1ff;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.16em;
  opacity: 0.95;
}

.op-status-pill[data-op-status="completed"] {
  box-shadow: 0 0 16px rgba(90, 220, 255, 0.12);
}
.op-status-pill[data-op-status="pending"] {
  opacity: 0.85;
}
.op-status-pill[data-op-status="failed"] {
  opacity: 0.75;
}

.opord-link {
  color: #e6fbff;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.opord-summary {
  margin-top: 8px;
  color: rgba(214, 241, 255, 0.72);
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
