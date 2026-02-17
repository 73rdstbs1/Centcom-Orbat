<!-- FILE: src/views/BackendRosterView.vue -->
<template>
  <div id="backendRoster">
    <section class="section-container terminal-shell">
      <header class="terminal-header">
        <div class="terminal-badge">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>

        <div class="terminal-title">
          <div class="kicker">CENTCOM / PERSONNEL</div>
          <div class="title">BACKEND ROSTER</div>
        </div>

        <div class="terminal-right">
          <div class="stamp">SECURE TERMINAL</div>
          <div class="stamp subtle">LIVE SHEET</div>
        </div>
      </header>

      <div class="terminal-body">
        <div class="filters">
          <div class="filter-block">
            <div class="filter-label">SEARCH</div>
            <input v-model="search" class="term-input" type="text" placeholder="Name / unit / award / detail…" />
          </div>

          <div class="filter-block">
            <div class="filter-label">UNIT</div>
            <select v-model="unitFilter" class="term-select">
              <option value="">All</option>
              <option v-for="u in unitOptions" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>

          <div class="filter-block meta-block">
            <div class="filter-label">RECORDS</div>
            <div class="meta-chip">
              {{ filteredCount }} record{{ filteredCount === 1 ? "" : "s" }}
            </div>
          </div>
        </div>

        <div v-if="loading" class="muted">Loading roster…</div>
        <div v-else-if="error" class="muted">{{ error }}</div>

        <div v-else class="roster-groups">
          <article
            v-for="g in filteredGroups"
            :key="g.key"
            class="unit-group"
          >
            <header class="unit-header">
              <div class="unit-name">
                <span class="unit-title">{{ g.label }}</span>
                <span v-if="g.type" class="unit-type-pill" :data-type="g.type">{{ g.type }}</span>
              </div>
              <div class="unit-count muted">{{ g.members.length }} member{{ g.members.length === 1 ? "" : "s" }}</div>
            </header>

            <div class="roster-table">
              <div class="row head">
                <div>NAME</div>
                <div>RANK / POSITION</div>
                <div>AWARDS</div>
                <div>DETAILS</div>
              </div>

              <div v-for="(m, idx) in g.members" :key="m._key || idx" class="row">
                <div class="cell name">{{ m.name || "—" }}</div>
                <div class="cell rank">{{ m.rank || "—" }}</div>
                <div class="cell awards">{{ m.awards || "—" }}</div>
                <div class="cell details">{{ m.details || "—" }}</div>
              </div>
            </div>
          </article>

          <div v-if="!filteredGroups.length" class="muted">
            No matching records.
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
/**
 * BackendRosterView.vue (CENTCOM)
 *
 * NEW Roster Sheet format ("Roster Page"):
 * Columns:
 *   - NAMES
 *   - RANK / POSITION
 *   - AWARDS
 *   - DETAILS
 *
 * Unit headers are embedded in the NAMES column by adding a type token in brackets:
 *   "6th Shock Troops Battalion (ODST)"
 *   "73rd Marine Force Recon (Marine)"
 *   "Joint Detachment (Marine/ODST)"
 *
 * Rules:
 * - A row is considered a UNIT header when:
 *     - NAMES ends with "(...)" AND
 *     - the other columns are blank (rank/awards/details)
 * - All subsequent rows are treated as personnel until the next unit header.
 *
 * Linking fallback (for other pages):
 * - This view supports `?unit=<UNIT NAME>` query param.
 * - If the unit is not found, the view simply shows "All".
 */

import { getConfig } from "@/config/runtimeConfig";

function normalizeStr(v) {
  return String(v ?? "").trim();
}

function parseCsv(text) {
  const rows = [];
  const s = String(text ?? "");
  let i = 0, field = "", row = [], inQuotes = false;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  while (i < s.length) {
    const c = s[i];

    if (inQuotes) {
      if (c === '"') {
        const next = s[i + 1];
        if (next === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += c; i += 1; continue;
    }

    if (c === '"') { inQuotes = true; i += 1; continue; }
    if (c === ",") { pushField(); i += 1; continue; }
    if (c === "\n") { pushField(); pushRow(); i += 1; continue; }
    if (c === "\r") { i += 1; continue; }

    field += c; i += 1;
  }

  // last field
  pushField();
  pushRow();

  // Remove trailing empty row (common in CSV exports)
  const last = rows[rows.length - 1] || [];
  const allEmpty = last.every((x) => !String(x ?? "").trim());
  if (allEmpty) rows.pop();

  return rows;
}

function rowsToObjects(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];

  const headers = rows[0].map((h) => normalizeStr(h));
  const out = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r] || [];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = normalizeStr(cells[c] ?? "");
    }
    // Skip fully empty lines
    const any = Object.values(obj).some((v) => String(v || "").trim());
    if (any) out.push(obj);
  }
  return out;
}

function parseUnitHeader(nameRaw) {
  const name = normalizeStr(nameRaw);
  const m = name.match(/^(.*)\s*\(([^)]+)\)\s*$/);
  if (!m) return null;
  return {
    label: normalizeStr(m[1]),
    type: normalizeStr(m[2]),
    full: name,
  };
}

function isUnitRow(row) {
  const name = normalizeStr(row["NAMES"]);
  const rank = normalizeStr(row["RANK / POSITION"]);
  const awards = normalizeStr(row["AWARDS"]);
  const details = normalizeStr(row["DETAILS"]);

  const hasHeader = !!parseUnitHeader(name);
  const othersBlank = !rank && !awards && !details;

  return hasHeader && othersBlank;
}

function buildGroups(rows) {
  const groups = [];
  let current = null;

  const ensureUnassigned = () => {
    if (!current) {
      current = { key: "unassigned", label: "UNASSIGNED", type: "", members: [] };
      groups.push(current);
    }
  };

  for (const r of rows) {
    if (isUnitRow(r)) {
      const parsed = parseUnitHeader(r["NAMES"]);
      const key = (parsed?.label || parsed?.full || "unit").toLowerCase();

      current = {
        key,
        label: parsed?.label || parsed?.full || normalizeStr(r["NAMES"]) || "UNIT",
        type: parsed?.type || "",
        members: [],
      };
      groups.push(current);
      continue;
    }

    ensureUnassigned();

    current.members.push({
      _key: `${current.key}__${normalizeStr(r["NAMES"]).toLowerCase()}`,
      name: normalizeStr(r["NAMES"]),
      rank: normalizeStr(r["RANK / POSITION"]),
      awards: normalizeStr(r["AWARDS"]),
      details: normalizeStr(r["DETAILS"]),
    });
  }

  // Remove empty groups
  return groups.filter((g) => (g.members || []).length > 0);
}

export default {
  name: "BackendRosterView",
  data() {
    return {
      loading: true,
      error: "",
      search: "",
      unitFilter: "",
      groups: [],
    };
  },
  computed: {
    unitOptions() {
      return (this.groups || []).map((g) => g.label);
    },
    filteredGroups() {
      const q = this.search.trim().toLowerCase();
      const unit = this.unitFilter;

      const match = (txt) => String(txt || "").toLowerCase().includes(q);

      return (this.groups || [])
        .filter((g) => {
          if (unit && g.label !== unit) return false;
          if (!q) return true;

          // Search hits on unit name/type OR any member cell
          if (match(g.label) || match(g.type)) return true;
          return (g.members || []).some((m) => match(m.name) || match(m.rank) || match(m.awards) || match(m.details));
        })
        .map((g) => {
          if (!q) return g;
          // When searching, keep only matching members, but still show the unit header
          const members = (g.members || []).filter((m) => match(m.name) || match(m.rank) || match(m.awards) || match(m.details));
          // If unit itself matched, keep all members
          const unitMatched = match(g.label) || match(g.type);
          return unitMatched ? g : { ...g, members };
        })
        .filter((g) => (g.members || []).length > 0 || !q); // if q and unit matched, members retained; otherwise remove empties
    },
    filteredCount() {
      return (this.filteredGroups || []).reduce((sum, g) => sum + (g.members?.length || 0), 0);
    },
  },
  async mounted() {
    // Support deep-linking to a unit filter
    const unitQ = this.$route?.query?.unit ? String(this.$route.query.unit) : "";
    if (unitQ) this.unitFilter = unitQ;

    await this.loadRoster();
  },
  watch: {
    // Keep query param in sync (nice for sharing links)
    unitFilter() {
      const unit = this.unitFilter || undefined;
      try {
        this.$router.replace({ query: { ...this.$route.query, unit } });
      } catch {}
    },
  },
  methods: {
    async loadRoster() {
      this.loading = true;
      this.error = "";

      try {
        const cfg = getConfig() || {};
        const url =
          cfg?.sheets?.rosterPageCsvUrl ||
          cfg?.sheets?.backendRosterCsvUrl ||
          cfg?.sheets?.membersCsvUrl ||
          "";

        if (!url) {
          this.error = "No roster CSV configured. Add sheets.rosterPageCsvUrl in src/config/unit-config.json.";
          this.groups = [];
          return;
        }

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch roster CSV (HTTP ${res.status})`);

        const csvText = await res.text();
        const rows = rowsToObjects(csvText);
        const groups = buildGroups(rows);

        this.groups = groups;

        // If unit filter doesn't exist, clear it (fallback behavior requested)
        if (this.unitFilter && !groups.some((g) => g.label === this.unitFilter)) {
          this.unitFilter = "";
        }
      } catch (e) {
        this.error = e?.message || "Failed to load roster.";
        this.groups = [];
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>


/* Theming aligns with CampaignLogView terminal aesthetic */

#backendRoster{
  flex: 1;
  min-width: 0;
  box-sizing: border-box;

  /* router-view-container is already offset by header height.
     Add extra spacing for the news ticker below the header. */
  padding: calc(24px + var(--app-ticker-height, 32px)) 24px 24px 24px;

  height: 100%;
  min-height: 0;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}
.terminal-shell{
  width: 100%;
  flex: 1;
  min-height: 0;

  max-width: none;
  margin: 0;

  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: 0 0 0 1px rgba(150,240,255,0.08), 0 12px 40px rgba(0,0,0,0.55);
  overflow: hidden;

  display: flex;
  flex-direction: column;

  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(90,220,255,0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(90,220,255,0.06), transparent 55%),
    linear-gradient(180deg, rgba(5,15,22,0.92), rgba(3,10,16,0.94));
  position: relative;
}
.terminal-shell::before,
.terminal-shell::after{
  content:"";
  position:absolute;
  pointer-events:none;
}
.terminal-shell::before{
  inset:0;
  background:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px) 0 0 / 100% 28px,
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px) 0 0 / 28px 100%;
  opacity: 0.22;
}
.terminal-shell::after{
  inset:0;
  background: linear-gradient(transparent 60%, rgba(0,0,0,0.22));
  opacity: 0.55;
}

.terminal-header{
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 110px 1fr 180px;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  background:
    linear-gradient(90deg, rgba(90,220,255,0.14), rgba(90,220,255,0.02) 35%, transparent 70%),
    rgba(0,0,0,0.22);
}

.terminal-badge{ display:flex; gap:8px; align-items:center; }
.dot{
  width: 10px; height: 10px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(90,220,255,0.14);
  box-shadow: 0 0 12px rgba(90,220,255,0.16);
}

.terminal-title .kicker{
  font-size: 11px;
  letter-spacing: 0.18em;
  color: rgba(214,241,255,0.75);
  text-transform: uppercase;
}
.terminal-title .title{
  margin-top: 2px;
  font-size: 16px;
  letter-spacing: 0.14em;
  color: #e6fbff;
  text-transform: uppercase;
}

.terminal-right{ display:grid; justify-items:end; gap:4px; }
.stamp{
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(214,241,255,0.9);
  border: 1px solid rgba(90,220,255,0.18);
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0,0,0,0.22);
}
.stamp.subtle{ opacity: 0.7; }

.terminal-body{
  position: relative;
  z-index: 1;
  padding: 16px;

  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0; /* critical so the scroll child can shrink */
  overflow: hidden; /* keep header + filters fixed */
}

.filters{
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.3fr;
  gap: 12px;
  align-items: end;
  margin-bottom: 14px;
}

.filter-label{
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: rgba(214,241,255,0.75);
}

.meta-chip{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(90,220,255,0.18);
  background: rgba(0,0,0,0.22);
  color: #e6fbff;
  letter-spacing: 0.08em;
}

.term-input,
.term-select{
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(90,220,255,0.18);
  background: rgba(5,15,22,0.92);
  color: rgba(226,243,255,0.92);
  padding: 10px 12px;
  outline: none;
}
.term-input::placeholder{ color: rgba(214,241,255,0.5); }
.term-input:focus,
.term-select:focus{
  box-shadow: 0 0 0 2px rgba(90,220,255,0.14);
  border-color: rgba(90,220,255,0.28);
}

/* Option palette (best-effort across browsers) */
.term-select option{
  background: #061019;
  color: rgba(226,243,255,0.92);
}


.muted{ color: rgba(214,241,255,0.7); opacity: 0.95; }

.roster-groups{
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 18px; /* extra separation between unit sections */
  padding-right: 4px; /* breathing room for scrollbar */
}

.unit-group{
  border-radius: 14px;
  overflow: hidden; /* keep rounded corners; content size is auto */
  border: 1px solid rgba(255,255,255,0.12);
  overflow: hidden; /* keep rounded corners; content size is auto */
  background:
    linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.28)),
    radial-gradient(900px 260px at 20% 0%, rgba(90,220,255,0.05), transparent 60%);
}

.unit-header{
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(170,220,255,0.16);
  background: linear-gradient(90deg, rgba(90,220,255,0.08), transparent 55%), rgba(5,15,22,0.72);
  overflow: hidden;
}
.unit-header::before{
  content:"";
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:4px;
  background: rgba(90,220,255,0.60); /* default */
  box-shadow: 0 0 18px rgba(90,220,255,0.20);
}
.unit-header[data-type="Marine"]::before,
.unit-header[data-type="MARINE"]::before{
  background: rgba(120,255,190,0.55);
  box-shadow: 0 0 18px rgba(120,255,190,0.18);
}
.unit-header[data-type="ODST"]::before{
  background: rgba(126,201,255,0.62);
  box-shadow: 0 0 18px rgba(126,201,255,0.20);
}
.unit-header[data-type="Marine/ODST"]::before,
.unit-header[data-type="MARINE/ODST"]::before,
.unit-header[data-type="ODST/Marine"]::before,
.unit-header[data-type="ODST/MARINE"]::before{
  background: rgba(255,190,80,0.55);
  box-shadow: 0 0 18px rgba(255,190,80,0.18);
}
.unit-header > *{ position: relative; z-index: 1; }

.unit-name{ display:flex; align-items:center; gap: 10px; min-width: 0; }
.unit-title{
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(230,251,255,0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unit-type-pill{
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(170,220,255,0.22);
  background: rgba(0,0,0,0.26);
  color: rgba(226,243,255,0.92);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  box-shadow: 0 0 16px rgba(90,220,255,0.10);
}

.unit-type-pill[data-type="ODST"]{
  box-shadow: 0 0 18px rgba(90,220,255,0.10);
}
.unit-type-pill[data-type="Marine"]{
  box-shadow: 0 0 18px rgba(120,255,190,0.08);
}
.unit-type-pill[data-type="Marine/ODST"]{
  box-shadow: 0 0 18px rgba(255,190,80,0.08);
}

.roster-table{
  display: grid;
  gap: 10px;
  padding: 12px;
}

.row{
  display: grid;
  grid-template-columns: 1.1fr 0.9fr 0.8fr 1.4fr;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 14px;
  background: rgba(0,0,0,0.18);
  min-width: 0;
}

.row.head{
  background: rgba(0,0,0,0.26);
  color: rgba(230,251,255,0.95);
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 10px;
}

.cell{
  min-width: 0;
  color: rgba(214,241,255,0.92);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell.details{ white-space: normal; overflow: visible; }
.cell.awards{ white-space: normal; overflow: visible; }

@media (max-width: 980px){
  .filters{ grid-template-columns: 1fr; }
  .row{ grid-template-columns: 1fr; }
  .unit-title{ white-space: normal; }
}



/* =========================
   SCROLL + LAYOUT FIX
   - Keep header + filters fixed inside the window.
   - Only the unit list area scrolls.
   - Preserve terminal window background without blocking scroll.
   ========================= */

/* Ensure the view fills the router container */
#backendRoster{
  flex: 1;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;

  /* Router container already starts under header; add a little extra to clear ticker */
  padding: 24px 24px 24px 24px;
  padding-top: calc(24px + var(--app-ticker-height, 32px));
  height: 100%;
  display: flex;
}

/* Make the window fill available height */
.terminal-shell{
  width: 100%;
  max-width: none;
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  /* Window background lives here (no extra overlay elements that can block scroll) */
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

/* Keep scanlines/overlay behind content */
.terminal-shell::before,
.terminal-shell::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:0;
}
.terminal-shell::before{
  background:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 100% 28px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px) 0 0 / 28px 100%;
  opacity: 0.22;
}
.terminal-shell::after{
  background: linear-gradient(transparent 60%, rgba(0, 0, 0, 0.22));
  opacity: 0.55;
}

/* Ensure all direct content is above overlays */
.terminal-shell > *{
  position: relative;
  z-index: 1;
}

/* Body is a flex column so the roster list can take remaining height */
.terminal-body{
  position: relative;
  z-index: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden; /* prevents window from scrolling */
}

/* The scrollable area: ONLY the unit list */
.roster-groups{
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 6px; /* room for scrollbar */
  display: grid;
  gap: 18px; /* more space between unit sections */
}

/* Keep unit cards fully visible; avoid internal clipping */
.unit-group{
  overflow: visible;
}


</style>
