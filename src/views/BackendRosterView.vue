<!-- FILE: src/views/BackendRosterView.vue -->
<template>
  <div id="backendRoster">
    <section class="section-container terminal-shell">
      <header class="terminal-header">
        <div class="terminal-badge">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>

        <div class="terminal-title">
          <div class="kicker">CENTCOM / PERSONNEL</div>
          <div class="title">BACKEND ROSTER</div>
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
            <input v-model="search" class="term-input" type="text" placeholder="Name / unit / position / award…" />
          </div>

          <div class="filter-block">
            <div class="filter-label">UNIT</div>
            <select v-model="unitFilter" class="term-select">
              <option value="">All</option>
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>

          <div class="filter-block meta-block">
            <div class="filter-label">RECORDS</div>
            <div class="meta-chip">{{ filteredMembers.length }} member{{ filteredMembers.length === 1 ? "" : "s" }}</div>
          </div>
        </div>

        <div class="table">
          <div class="trow thead">
            <div>NAME</div>
            <div>UNIT</div>
            <div>POSITIONS</div>
            <div>AWARDS</div>
            <div>CAMPAIGNS</div>
            <div></div>
          </div>

          <div v-for="m in filteredMembers" :key="m.id" class="trow">
            <div class="tcell strong">{{ m.name }}</div>
            <div class="tcell">{{ m.unit || "—" }}</div>
            <div class="tcell">{{ listOrDash(m.positions) }}</div>
            <div class="tcell">{{ listOrDash(awardsFor(m)) }}</div>
            <div class="tcell">{{ listOrDash(campaignsFor(m)) }}</div>
            <div class="tcell actions">
              <button class="term-button terminal-button small" type="button" @click="toggle(m.id)">
                {{ expandedId === m.id ? "HIDE" : "VIEW" }}
              </button>
            </div>

            <div v-if="expandedId === m.id" class="expand">
              <div class="expand-grid">
                <div class="panel">
                  <div class="section-label">DETAIL</div>
                  <div class="muted">
                    Placeholder for bio, role notes, citations, and officer records.
                  </div>
                </div>

                <div class="panel">
                  <div class="section-label">ROSTER FLAGS</div>
                  <div class="muted">
                    Placeholder for: formal position held, awards above threshold, special access, etc.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!filteredMembers.length" class="empty">
            <div class="muted">No matching records.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { membersCatalog, awardById, campaignById } from "@/data/pocData";

export default {
  name: "BackendRosterView",
  data() {
    return {
      members: membersCatalog,
      search: "",
      unitFilter: "",
      expandedId: null,
    };
  },
  computed: {
    units() {
      const set = new Set((this.members || []).map((m) => m.unit).filter(Boolean));
      return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
    },
    filteredMembers() {
      const q = this.search.trim().toLowerCase();
      const unit = this.unitFilter;

      return (this.members || []).filter((m) => {
        if (unit && m.unit !== unit) return false;
        if (!q) return true;

        const inName = (m.name || "").toLowerCase().includes(q);
        const inUnit = (m.unit || "").toLowerCase().includes(q);
        const inPos = (m.positions || []).some((p) => String(p).toLowerCase().includes(q));
        const inAwards = (m.awards || []).some((a) => String(a).toLowerCase().includes(q));
        const inCampaigns = (m.campaigns || []).some((cid) =>
          String(campaignById?.[cid]?.name || cid).toLowerCase().includes(q)
        );

        return inName || inUnit || inPos || inAwards || inCampaigns;
      });
    },
  },
  methods: {
    toggle(id) {
      this.expandedId = this.expandedId === id ? null : id;
    },
    listOrDash(v) {
      if (!v) return "—";
      if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
      return String(v);
    },
    awardsFor(m) {
      const raw = m?.awards || [];
      const names = raw.map((x) => awardById?.[x]?.name || x).filter(Boolean);
      return names.length ? names : null;
    },
    campaignsFor(m) {
      const raw = m?.campaigns || [];
      const names = raw.map((cid) => campaignById?.[cid]?.name || cid).filter(Boolean);
      return names.length ? names : null;
    },
  },
};
</script>

<style scoped>
#backendRoster{
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
  margin-top:2px; font-size:16px; letter-spacing:0.14em; text-transform:uppercase;
  color: var(--text-location, #e6fbff);
}
.terminal-right{ display:grid; justify-items:end; gap:4px; }
.stamp{
  font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
  color: rgba(214,241,255,0.9);
  border:1px solid rgba(90,220,255,0.18);
  padding:4px 8px; border-radius:999px;
  background: rgba(0,0,0,0.22);
}
.stamp.subtle{ opacity:0.7; }

.terminal-body{ position:relative; z-index:1; padding:16px; }

/* Filters */
.filters{
  display:grid;
  grid-template-columns: 1.4fr 0.8fr 0.3fr;
  gap:12px;
  align-items:end;
  margin-bottom:14px;
}
.filter-label{
  font-size:10px; letter-spacing:0.22em; text-transform:uppercase;
  margin-bottom:6px;
  color: var(--text-pilot-header, rgba(214,241,255,0.75));
}
.meta-chip{
  display:inline-flex; align-items:center; justify-content:center;
  min-height:38px; padding:0 12px;
  border-radius:10px;
  border:1px solid rgba(90,220,255,0.18);
  background: rgba(0,0,0,0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing:0.08em;
}
.term-input,
.term-select {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.78), rgba(0, 0, 0, 0.28));
  color: var(--text-location, #e6fbff);
  padding: 10px 12px;
  outline: none;
  color-scheme: dark;
}

.term-input::placeholder {
  color: rgba(214, 241, 255, 0.58);
}

.term-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 38px;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='rgba(214,241,255,0.85)' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.term-input:focus,
.term-select:focus {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.18);
  border-color: rgba(90, 220, 255, 0.34);
}

:deep(select.term-select option) {
  background: rgba(5, 15, 22, 0.98);
  color: rgba(230, 251, 255, 0.92);
}

/* Table */
.table{
  border-radius:14px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.18);
  overflow:hidden;
}
.trow{
  display:grid;
  grid-template-columns: 1.1fr 0.8fr 1.2fr 1.1fr 1.2fr 110px;
  gap:10px;
  padding:12px;
  border-top:1px solid rgba(255,255,255,0.08);
  align-items:center;
}
.thead{
  border-top:none;
  background: rgba(0,0,0,0.28);
  color: var(--text-location, #e6fbff);
  letter-spacing:0.18em;
  text-transform:uppercase;
  font-size:10px;
  font-weight:700;
}
.tcell{ color: var(--text-pilot-value, #d6f1ff); }
.strong{
  letter-spacing:0.12em;
  text-transform:uppercase;
  color: var(--text-location, #e6fbff);
}
.actions{ display:flex; justify-content:flex-end; }

.expand{
  grid-column: 1 / -1;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.12);
}
.expand-grid{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:12px;
}
.section-label{
  color: var(--text-pilot-header, rgba(214,241,255,0.75));
  margin-bottom:8px;
  font-size:10px; letter-spacing:0.22em; text-transform:uppercase;
}
.panel{
  border-radius:14px;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.22);
  padding:12px;
}
.muted{ color: var(--text-pilot-header, rgba(214,241,255,0.7)); }

.terminal-button{
  border-radius:12px;
  border:1px solid rgba(90,220,255,0.22);
  background: rgba(0,0,0,0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing:0.16em; text-transform:uppercase;
  padding:10px 14px;
}
.terminal-button.small{
  padding:8px 12px;
  font-size:12px;
}
.terminal-button:hover{ box-shadow: 0 0 0 2px rgba(90,220,255,0.12); }

.empty{ padding:16px; }

/* Responsive */
@media (max-width: 1100px){
  .filters{ grid-template-columns:1fr; }
  .trow{ grid-template-columns: 1fr; }
  .actions{ justify-content:flex-start; }
  .expand-grid{ grid-template-columns: 1fr; }
}
</style>
