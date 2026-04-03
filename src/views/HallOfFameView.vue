<!-- FILE: src/views/HallOfFameView.vue -->
<template>
  <div id="hallOfFame">
    <section class="section-container terminal-shell">
      <header class="terminal-header">
        <div class="terminal-badge">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>

        <div class="terminal-title">
          <div class="kicker">CENTCOM / HONORS</div>
          <div class="title">HALL OF FAME</div>
        </div>

        <div class="terminal-right">
          <div class="stamp">SECURE TERMINAL</div>
          <div class="stamp subtle">LIVE SHEETS</div>
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
              placeholder="Trooper / unit / award / campaign / operation…"
            />
          </div>

          <div class="filter-block">
            <div class="filter-label">AWARD CODE</div>
            <select v-model="awardCode" class="term-select">
              <option value="">All</option>
              <option v-for="c in awardOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="filter-block">
            <div class="filter-label">CAMPAIGN</div>
            <select v-model="campaignName" class="term-select">
              <option value="">All</option>
              <option v-for="c in campaignOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="filter-block meta-block">
            <div class="filter-label">ENTRIES</div>
            <div class="meta-chip">{{ filteredEntries.length }}</div>
          </div>
        </div>

        <div class="hof-scroll">
          <div v-if="loading" class="empty">
            <div class="muted">Loading awards from Operations sheet…</div>
          </div>

          <div v-else-if="error" class="empty">
            <div class="muted">{{ error }}</div>
          </div>

          <div v-else>
            <div v-if="filteredEntries.length" class="grid">
              <article v-for="e in filteredEntries" :key="e.id" class="card award-card">
                          <div class="card-topline"></div>

                          <header class="card-head">
                            <div class="identity">
                              <div class="unit-chip">{{ e.unit || "—" }}</div>
                              <div class="name">{{ e.trooper }}</div>
                            </div>
                          </header>

                          <div class="card-body">
                            <div class="section-label">AWARD</div>
                            <div class="panel award-panel">
                              <div class="award-codes">
                                <AwardRender :value="e.awardText || e.award" :link="true" />
                              </div>
                            </div>

<div class="section-label" style="margin-top:12px;">EARNED IN</div>
                            <div class="panel earned-panel">
                              <button v-if="e.campaign" class="link-chip" @click="openCampaign(e)">{{ e.campaign }}</button>
                              <button v-if="e.operation" class="link-chip op-chip" @click="openCampaign(e)">{{ e.operation }}</button>
                              <span v-if="!e.campaign && !e.operation" class="meta-chip">MANUAL ENTRY</span>
                            </div>
</article>
            </div>

            <div v-else class="empty">
              <div class="muted">No awards match the current filters.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { getConfig } from "@/config/runtimeConfig";
import AwardRender from "@/components/AwardRender.vue";
import { extractAwardCodes, normalizePersonKey, parseAwardsCell } from "@/utils/awards";

const AWARD_ORDER = ["MOH", "CC", "LOM", "SS", "DMSR", "DFC", "BS", "JSC", "JSA", "CSA", "JMUR"];
const HOF_AUTO_MIN_CODE = "BS";
const AUTO_HOF_CODES = new Set(
  AWARD_ORDER.slice(0, Math.max(0, AWARD_ORDER.indexOf(HOF_AUTO_MIN_CODE)) + 1)
);

function isAutoHallOfFameCode(code) {
  const c = String(code || "").toUpperCase().trim();
  return AUTO_HOF_CODES.has(c);
}

function normalizeStr(v) {
  return String(v ?? "").trim();
}

function parseCsv(text) {
  const out = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cur);
      out.push(row);
      row = [];
      cur = "";
      continue;
    }

    cur += ch;
  }

  row.push(cur);
  out.push(row);

  return out;
}

function buildHeaderMap(headerRow) {
  const idx = {};
  (headerRow || []).forEach((h, i) => {
    const key = normalizeStr(h).toLowerCase();
    if (key) idx[key] = i;
  });
  return idx;
}

function rosterRowsToObjects(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];

  const headers = (rows[0] || []).map((h) => normalizeStr(h));
  const out = [];

  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r] || [];
    const obj = {};
    for (let c = 0; c < headers.length; c += 1) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = normalizeStr(cells[c] ?? "");
    }
    const any = Object.values(obj).some((v) => String(v || "").trim());
    if (any) out.push(obj);
  }
  return out;
}

function parseRosterUnitHeader(nameRaw) {
  const name = normalizeStr(nameRaw);
  const m = name.match(/^(.*)\s*\(([^)]+)\)\s*$/);
  if (!m) return null;
  return {
    label: normalizeStr(m[1]),
    type: normalizeStr(m[2]),
    full: name,
  };
}

function isRosterUnitRow(row) {
  const name = normalizeStr(row?.["NAMES"]);
  const rank = normalizeStr(row?.["RANK / POSITION"]);
  const awards = normalizeStr(row?.["AWARDS"]);
  const details = normalizeStr(row?.["DETAILS"]);

  const hasHeader = !!parseRosterUnitHeader(name);
  const othersBlank = !rank && !awards && !details;

  return hasHeader && othersBlank;
}

function getCell(row, headerMap, key) {
  const i = headerMap[key];
  if (i === undefined) return "";
  return normalizeStr((row || [])[i]);
}

function toTs(dateStr) {
  const s = normalizeStr(dateStr);
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

async function loadRosterUnitMap(csvUrl) {
  if (!csvUrl) return {};
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) return {};
    const text = await res.text();

    const rows = rosterRowsToObjects(text);
    if (!rows.length) return {};

    const out = {};
    let currentUnit = "UNASSIGNED";

    for (const r of rows) {
      if (isRosterUnitRow(r)) {
        const parsed = parseRosterUnitHeader(r["NAMES"]);
        currentUnit = parsed?.label || parsed?.full || currentUnit;
        continue;
      }

      const name = normalizeStr(r["NAMES"]);
      if (!name) continue;

      const key = normalizePersonKey(name);
      if (key) out[key] = currentUnit || "";
    }

    return out;
  } catch {
    return {};
  }
}

async function loadAwardsFromOperationsCsv(csvUrl, rosterUnitMap) {
  if (!csvUrl) return [];
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch operations CSV (${res.status})`);

  const text = await res.text();
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const headerMap = buildHeaderMap(rows[0]);
  const kCampaign = headerMap["campaign name"] !== undefined ? "campaign name" : null;
  const kOp = headerMap["operations"] !== undefined ? "operations" : null;
  const kAwards = headerMap["awards"] !== undefined ? "awards" : null;
  const kDate = headerMap["date"] !== undefined ? "date" : null;

  if (!kCampaign || !kOp || !kAwards) return [];

  let currentCampaign = "";
  const out = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] || [];

    const campaignCell = getCell(row, headerMap, kCampaign);
    if (campaignCell) currentCampaign = campaignCell;

    const opTitle = getCell(row, headerMap, kOp);
    const awardsCell = getCell(row, headerMap, kAwards);
    const dateCell = kDate ? getCell(row, headerMap, kDate) : "";

    if (!currentCampaign || !opTitle || !awardsCell) continue;

    const key = normalizeStr(currentCampaign).toLowerCase().replace(/\s+/g, " ").trim();
    const entries = parseAwardsCell(awardsCell);

    for (let i = 0; i < entries.length; i += 1) {
      const e = entries[i] || {};
      const trooper = normalizeStr(e.trooper);
      const award = normalizeStr(e.award);
      if (!trooper || !award) continue;

      const nameKey = normalizePersonKey(trooper);
      const unit = normalizeStr(e.unit) || normalizeStr(rosterUnitMap?.[nameKey] || "");

      const codesAll = extractAwardCodes(award);
      const codes = codesAll.filter(isAutoHallOfFameCode);
      if (!codes.length) continue;
      const awardText = codes.join(" / ");

      out.push({
        id: `${key}__${r}__${i}`,
        campaign: currentCampaign,
        operation: opTitle,
        date: dateCell,
        ts: toTs(dateCell),
        unit,
        trooper,
        award,
        awardText,
        codes,
        opId: `${key}__${r}`,
      });
    }
  }

  out.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return out;
}

async function loadManualAwardsFromRosterCsv(csvUrl, rosterUnitMap, autoEntries) {
  if (!csvUrl) return [];

  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch roster CSV (${res.status})`);

  const text = await res.text();
  const rows = rosterRowsToObjects(text);
  if (!rows.length) return [];

  // Prevent duplicate “manual” entries when the same trooper+award already exists in campaign ops.
  const autoSet = new Set();
  for (const e of Array.isArray(autoEntries) ? autoEntries : []) {
    const tKey = normalizePersonKey(e?.trooper);
    if (!tKey) continue;
    for (const c of Array.isArray(e?.codes) ? e.codes : []) {
      const code = String(c || "").toUpperCase().trim();
      if (code) autoSet.add(`${tKey}|${code}`);
    }
  }

  const out = [];
  let currentUnit = "UNASSIGNED";

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r] || {};

    if (isRosterUnitRow(row)) {
      const parsed = parseRosterUnitHeader(row["NAMES"]);
      currentUnit = parsed?.label || parsed?.full || currentUnit;
      continue;
    }

    const trooper = normalizeStr(row["NAMES"]);
    if (!trooper) continue;

    const awardsCell = normalizeStr(row["AWARDS"]);
    if (!awardsCell) continue;

    const tKey = normalizePersonKey(trooper);
    const unit =
      currentUnit ||
      normalizeStr(rosterUnitMap?.[tKey] || "") ||
      "UNASSIGNED";

    const codesAll = extractAwardCodes(awardsCell).map((c) => String(c || "").toUpperCase().trim());
    const codes = codesAll.filter((c) => c && !(tKey && autoSet.has(`${tKey}|${c}`)));
    if (!codes.length) continue;

    out.push({
      id: `manual_roster__${r + 1}`,
      campaign: "",
      operation: "",
      date: "",
      ts: 0,
      unit,
      trooper,
      award: awardsCell,
      awardText: codes.join(" / "),
      codes,
      opId: "",
      source: "manual",
    });
  }

  return out;
}

export default {
  name: "HallOfFameView",
  components: { AwardRender },
  data() {
    return {
      loading: true,
      error: "",
      entries: [],
      search: "",
      awardCode: "",
      campaignName: "",
      rosterUnitMap: {},
    };
  },
  computed: {
    awardOptions() {
      const seen = new Set();
      const out = [];

      for (const e of this.entries || []) {
        for (const c of e.codes || []) {
          if (seen.has(c)) continue;
          seen.add(c);
          out.push(c);
        }
      }

      return out.sort();
    },
    campaignOptions() {
      const seen = new Set();
      const out = [];

      for (const e of this.entries || []) {
        const c = String(e.campaign || "").trim();
        if (!c || seen.has(c)) continue;
        seen.add(c);
        out.push(c);
      }

      return out.sort((a, b) => a.localeCompare(b));
    },
    filteredEntries() {
      const q = this.search.trim().toLowerCase();
      const award = String(this.awardCode || "").trim().toUpperCase();
      const campaign = String(this.campaignName || "").trim();

      return (this.entries || []).filter((e) => {
        if (award && !(e.codes || []).includes(award)) return false;
        if (campaign && String(e.campaign || "") !== campaign) return false;

        if (!q) return true;

        const hay = [
          e.trooper,
          e.unit,
          e.award,
          e.campaign,
          e.operation,
          e.date,
          (e.codes || []).join(" "),
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" | ");

        return hay.includes(q);
      });
    },
  },
  async mounted() {
    const cfg = getConfig() || {};
    const opsUrl = cfg?.sheets?.operationsCsvUrl || cfg?.sheets?.opsCsvUrl || "";

    try {
      const rosterUrl =
        cfg?.sheets?.rosterPageCsvUrl ||
        cfg?.sheets?.backendRosterCsvUrl ||
        cfg?.sheets?.membersCsvUrl ||
        "";

      this.rosterUnitMap = await loadRosterUnitMap(rosterUrl);
      const autoEntries = await loadAwardsFromOperationsCsv(opsUrl, this.rosterUnitMap);
      const manualEntries = await loadManualAwardsFromRosterCsv(rosterUrl, this.rosterUnitMap, autoEntries);

      this.entries = [...manualEntries, ...autoEntries].sort((a, b) => (b.ts || 0) - (a.ts || 0));

      this.applyRouteFilters();
      this.loading = false;
    } catch (e) {
      this.loading = false;
      this.error = String(e?.message || e || "Failed to load awards.");
    }
  },
  watch: {
    "$route.query": {
      deep: true,
      handler() {
        this.applyRouteFilters();
      },
    },
  },
  methods: {

    applyRouteFilters() {
      const q = this.$route?.query || {};
      const camp = String(q.campaign || "").trim();
      const op = String(q.operation || "").trim();

      if (camp && this.campaignOptions.includes(camp)) this.campaignName = camp;
      if (op) this.search = op;
    },
    openCampaign(e) {
      if (!e?.campaign && !e?.operation) return;
      this.$router.push({
        name: "CampaignLog",
        query: {
          campaign: e?.campaign || undefined,
          operation: e?.operation || undefined,
          opId: e?.opId || undefined,
        },
      });
    },
  },
};
</script>

<style scoped>
#hallOfFame{
  flex: 1;
  min-width: 0;
  box-sizing: border-box;

  padding: calc(24px + var(--app-ticker-height, 32px)) 24px 24px 24px;

  height: 100%;
  min-height: 0;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  color: var(--text-pilot-value, #d6f1ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
}

.terminal-shell{
  width:100%; max-width:none; margin:0; position:relative; overflow:hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-radius:14px; border:1px solid rgba(255,255,255,0.14);
  box-shadow: 0 0 0 1px rgba(150,240,255,0.08), 0 12px 40px rgba(0,0,0,0.55);
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(90,220,255,0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(90,220,255,0.06), transparent 55%),
    linear-gradient(180deg, rgba(5,15,22,0.92), rgba(3,10,16,0.94));
}
.terminal-shell::before{
  content:""; position:absolute; inset:0; pointer-events:none; opacity:0.22;
  background:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px) 0 0 / 100% 28px,
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px) 0 0 / 28px 100%;
}
.terminal-shell::after{
  content:""; position:absolute; inset:0; pointer-events:none; opacity:0.55;
  background: linear-gradient(transparent 60%, rgba(0,0,0,0.22));
}

.terminal-header{
  position:relative; z-index:1;
  display:grid; grid-template-columns:110px 1fr 180px; gap:12px; align-items:center;
  padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,0.12);
  background:
    linear-gradient(90deg, rgba(90,220,255,0.14), rgba(90,220,255,0.02) 35%, transparent 70%),
    rgba(0,0,0,0.22);
}
.terminal-badge{ display:flex; gap:8px; align-items:center; }
.dot{
  width:10px; height:10px; border-radius:999px;
  border:1px solid rgba(255,255,255,0.18);
  background: rgba(90,220,255,0.14);
  box-shadow: 0 0 12px rgba(90,220,255,0.16);
}
.terminal-title .kicker{
  font-size:11px; letter-spacing:0.18em; text-transform:uppercase;
  color: var(--text-pilot-header, rgba(214,241,255,0.75));
}
.terminal-title .title{
  font-size:24px; letter-spacing:0.04em; font-weight:700;
}
.terminal-right{ display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.stamp{
  font-size:10px; letter-spacing:0.18em; text-transform:uppercase;
  padding:6px 8px; border-radius:10px;
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.28);
}
.stamp.subtle{ opacity:0.7; }

.terminal-body{
  position: relative;
  z-index: 1;
  padding: 16px;

  display: flex;
  flex-direction: column;
  gap: 14px;

  flex: 1 1 auto;
  min-height: 0; /* critical so scroll child can shrink */
  overflow: hidden; /* keep header + filters fixed */
}

.filters{
  display:grid;
  grid-template-columns: 1.4fr 0.7fr 0.8fr 120px;
  gap:12px;
  margin-bottom: 14px;
}

.hof-scroll{
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;

  padding-right: 6px; /* room for scrollbar */
  scrollbar-gutter: stable;
}
.filter-block{ min-width:0; }
.filter-label{
  font-size:10px; letter-spacing:0.16em; text-transform:uppercase;
  color: rgba(214,241,255,0.72);
  margin-bottom:6px;
}
.term-input, .term-select{
  width:100%;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.22);
  color: rgba(230,251,255,0.92);
  outline:none;
  color-scheme: dark;
}

.term-select option,
.term-select optgroup{
  background: rgba(3,10,16,0.98);
  color: rgba(230,251,255,0.92);
}
.meta-block{ display:flex; flex-direction:column; align-items:flex-end; justify-content:flex-end; }
.meta-chip{
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(90,220,255,0.22);
  background: rgba(90,220,255,0.10);
  font-weight:700;
  min-width:72px;
  text-align:center;
}

.grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  align-content: start;
  padding-bottom: 8px;
}
.card{
  position:relative;
  border-radius:14px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.22);
  overflow:hidden;
  box-shadow: 0 0 0 1px rgba(90,220,255,0.06);
}
.card-topline{
  height:3px;
  background: linear-gradient(90deg, rgba(90,220,255,0.55), rgba(90,220,255,0.10), transparent 80%);
}
.card-head{
  padding: 12px 12px 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.10);

  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.identity{ min-width: 0; }
.unit-chip{
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(90,220,255,0.18);
  background: rgba(90,220,255,0.08);
  color: rgba(230,251,255,0.88);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.award-icons{
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 2px;
  flex: 0 0 auto;
}
.award-icons :deep(.award-icon){
  width: 20px;
  height: 20px;
}
.award-icons :deep(.award-render){
  gap: 6px;
}

.name{
  margin-top: 8px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: rgba(230,251,255,0.95);
  word-break: break-word;
}

.card-body{ padding:12px; }
.section-label{
  font-size:10px;
  letter-spacing:0.16em;
  text-transform:uppercase;
  color: rgba(214,241,255,0.72);
  margin-bottom:6px;
}
.earned-panel{
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.op-chip{ max-width: 100%; }

.panel{
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.18);
  padding:10px 10px;
}
.award-panel{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.award-codes{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  justify-content:center;
  align-items:center;
  margin: 2px 0 8px 0;
}

.award-codes :deep(.award-render){
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}
.award-codes :deep(.award-icon){
  height: clamp(22px, 2.6vw, 34px);
  width: auto;
  max-width: 140px;
  object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.45));
}
.award-codes :deep(a){
  display: inline-flex;
  align-items: center;
}

.award-ribbon{
  width: 72px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.45));
}

.award-details{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-top: 2px;
}

.award-full{
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgba(230,251,255,0.92);
}

.award-criteria{
  font-size: 12px;
  line-height: 1.35;
  color: rgba(214,241,255,0.72);
}
.award-text{ font-size:12px; }

.link-chip{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:8px 10px;
  margin: 0;
  border-radius:999px;
  border:1px solid rgba(90,220,255,0.24);
  background: rgba(90,220,255,0.10);
  color: rgba(230,251,255,0.95);
  cursor:pointer;
  font-family: inherit;
}
.link-chip:hover{
  background: rgba(90,220,255,0.14);
  border-color: rgba(90,220,255,0.35);
}

.meta-row{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:10px;
  margin-top:10px;
}
.meta-cell{
  border-radius:12px;
  border:1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.14);
  padding:10px;
}
.meta-label{
  font-size:10px;
  letter-spacing:0.16em;
  text-transform:uppercase;
  color: rgba(214,241,255,0.64);
  margin-bottom:4px;
}
.meta-value{
  font-size:12px;
  color: rgba(230,251,255,0.92);
}

.empty{
  padding: 26px 10px;
  min-height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.muted{ color: rgba(214,241,255,0.68); }

@media (max-width: 980px){
  .filters{
    grid-template-columns: 1fr 1fr;
  }
  .meta-block{ align-items:flex-start; }
}
</style>
