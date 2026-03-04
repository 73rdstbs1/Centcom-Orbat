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
            <input v-model="search" class="term-input" type="text" placeholder="Trooper / unit / award / campaign / operation…" />
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

        <div v-if="loading" class="empty">
          <div class="muted">Loading awards from Operations sheet…</div>
        </div>

        <div v-else-if="error" class="empty">
          <div class="muted">{{ error }}</div>
        </div>

        <div v-else class="grid">
          <article v-for="e in filteredEntries" :key="e.id" class="card award-card">
            <div class="card-topline"></div>

            <header class="card-head">
              <div class="name">{{ e.trooper }}</div>
              <div class="unit">{{ e.unit || "—" }}</div>
            </header>

            <div class="card-body">
              <div class="section-label">AWARD</div>
              <div class="panel award-panel">
  <AwardRender :value="e.award" />

  <div v-if="(e.codes || []).length" class="award-codes">
    <span v-for="c in e.codes" :key="c" class="meta-chip">{{ c }}</span>
  </div>
  <span v-else-if="e.award" class="award-text muted">{{ e.award }}</span>

  <div v-if="awardInfos(e).length" class="award-details">
    <div v-for="i in awardInfos(e)" :key="i.code" class="award-detail">
      <div class="award-full">
        {{ i.name }}
        <span class="muted">({{ i.code }})</span>
      </div>
      <div class="award-criteria muted">{{ i.criteria }}</div>
    </div>
  </div>
</div>

              <div class="section-label" style="margin-top:12px;">EARNED IN</div>
              <div class="panel">
                <button class="link-chip" @click="openCampaign(e)">{{ e.campaign }}</button>
                <button class="link-chip" @click="openCampaign(e)">{{ e.operation }}</button>
              </div>

              <div class="meta-row">
                <div class="meta-cell">
                  <div class="meta-label">DATE</div>
                  <div class="meta-value">{{ e.date || "—" }}</div>
                </div>
                <div class="meta-cell">
                  <div class="meta-label">SOURCE</div>
                  <div class="meta-value">OPS.AWARDS</div>
                </div>
              </div>
            </div>
          </article>

          <div v-if="!filteredEntries.length" class="empty">
            <div class="muted">No awards match the current filters.</div>
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

const AWARD_INFO = {
  JMUA: {
    name: "Joint Meritorious Unit Ribbon",
    criteria: "50%+ Attendance",
  },
  CSA: {
    name: "Community Service Achievement",
    criteria: "Commendable service within an S/J/N-Shop",
  },
  JSAM: {
    name: "Joint Service Achievement",
    criteria: "Meritorious service or achievement during a Joint Op",
  },
  JCOM: {
    name: "Joint Service Commendation",
    criteria: "Significant impact upon a Joint Op in a combat environment",
  },
  BS: {
    name: "Bronze Star",
    criteria: "Heroic service. Actions impacted eventual outcome of the joint op",
  },
  DFC: {
    name: "Distinguished Flying Cross",
    criteria: "Heroic service in flight. Actions impacted eventual outcome of the joint op",
  },
  DMSM: {
    name: "Defense Meritorious Service Ribbon",
    criteria: "Extraordinary meritorious service in or out of a joint combat environment",
  },
  SS: {
    name: "Silver Star",
    criteria: "Heroic gallantry in combat. Actions of the member must be above and beyond their job.",
  },
  LOM: {
    name: "Legion of Merit",
    criteria: "If not for the action, the unit would not see success effectively. In or out of operation",
  },
  CC: {
    name: "Colonial Cross",
    criteria: "Heroic gallantry in combat. If not for action, the operation would have failed.",
  },
  MOH: {
    name: "Medal of Honor",
    criteria: "We all know this one.",
  },
};

function getAwardInfo(code) {
  const c = String(code || "").toUpperCase().trim();
  const info = AWARD_INFO[c];
  return info ? { code: c, ...info } : null;
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
    const rows = parseCsv(text);
    if (!rows.length) return {};

    const header = rows[0] || [];
    const headerMap = buildHeaderMap(header);

    const kName =
      headerMap["name"] !== undefined
        ? "name"
        : headerMap["trooper"] !== undefined
          ? "trooper"
          : headerMap["member"] !== undefined
            ? "member"
            : null;

    const kUnit =
      headerMap["unit"] !== undefined
        ? "unit"
        : headerMap["subunit"] !== undefined
          ? "subunit"
          : headerMap["squad"] !== undefined
            ? "squad"
            : null;

    if (!kName || !kUnit) return {};

    const out = {};
    for (let r = 1; r < rows.length; r += 1) {
      const row = rows[r] || [];
      const name = getCell(row, headerMap, kName);
      const unit = getCell(row, headerMap, kUnit);
      const key = normalizePersonKey(name);
      if (key && unit) out[key] = unit;
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

      const codes = extractAwardCodes(award);
      const awardText = codes.length ? codes.join(" / ") : award;

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
    const opsUrl = cfg?.sheets?.operationsCsvUrl || "";

    try {
      const rosterUrl =
        cfg?.sheets?.rosterPageCsvUrl ||
        cfg?.sheets?.backendRosterCsvUrl ||
        cfg?.sheets?.membersCsvUrl ||
        "";

      this.rosterUnitMap = await loadRosterUnitMap(rosterUrl);
      this.entries = await loadAwardsFromOperationsCsv(opsUrl, this.rosterUnitMap);

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
    awardInfos(entry) {
  const codes = Array.isArray(entry?.codes) ? entry.codes : [];
  const out = [];

  for (const c of codes) {
    const info = getAwardInfo(c);
    if (info) out.push(info);
  }

  return out;
},
    applyRouteFilters() {
      const q = this.$route?.query || {};
      const camp = String(q.campaign || "").trim();
      const op = String(q.operation || "").trim();

      if (camp && this.campaignOptions.includes(camp)) this.campaignName = camp;
      if (op) this.search = op;
    },
    openCampaign(e) {
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
  flex:1; min-width:0; box-sizing:border-box;
  padding: calc(var(--app-header-height, 72px) + 24px) 24px 24px 24px;
  color: var(--text-pilot-value, #d6f1ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
}

.terminal-shell{
  width:100%; max-width:none; margin:0; position:relative; overflow:hidden;
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

.terminal-body{ position:relative; z-index:1; padding:16px; }

.filters{
  display:grid;
  grid-template-columns: 1.4fr 0.7fr 0.8fr 120px;
  gap:12px;
  margin-bottom: 14px;
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
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
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
  padding:12px 12px 10px 12px;
  border-bottom:1px solid rgba(255,255,255,0.10);
}
.name{ font-size:16px; font-weight:800; letter-spacing:0.02em; }
.unit{ margin-top:4px; font-size:12px; opacity:0.78; }

.card-body{ padding:12px; }
.section-label{
  font-size:10px;
  letter-spacing:0.16em;
  text-transform:uppercase;
  color: rgba(214,241,255,0.72);
  margin-bottom:6px;
}
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
  gap:8px;
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
  margin-right:8px;
  margin-top:2px;
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
  display:flex;
  justify-content:center;
  align-items:center;
}

.muted{ color: rgba(214,241,255,0.68); }

@media (max-width: 980px){
  .filters{
    grid-template-columns: 1fr 1fr;
  }
  .meta-block{ align-items:flex-start; }
}
</style>
