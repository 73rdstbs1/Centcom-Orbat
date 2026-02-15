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
          <div class="stamp subtle">POC BUILD</div>
        </div>
      </header>

      <div class="terminal-body">
        <div class="filters">
          <div class="filter-block">
            <div class="filter-label">SEARCH</div>
            <input v-model="search" class="term-input" type="text" placeholder="Member / unit / award…" />
          </div>

          <div class="filter-block">
            <div class="filter-label">MIN AWARD LEVEL</div>
            <select v-model.number="minLevel" class="term-select">
              <option v-for="n in levelOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="filter-block meta-block">
            <div class="filter-label">INDUCTEES</div>
            <div class="meta-chip">{{ filteredInductees.length }}</div>
          </div>
        </div>

        <div class="grid">
          <article v-for="m in filteredInductees" :key="m.id" class="card">
            <div class="card-topline"></div>

            <header class="card-head">
              <div class="name">{{ m.name }}</div>
              <div class="unit">{{ m.unit || "—" }}</div>
            </header>

            <div class="card-body">
              <div class="section-label">QUALIFYING AWARDS</div>
              <div class="panel">
                <div v-if="qualifyingAwards(m).length" class="text">
                  {{ qualifyingAwards(m).join(", ") }}
                </div>
                <div v-else class="muted">—</div>
              </div>

              <div class="section-label" style="margin-top:12px;">CAMPAIGNS</div>
              <div class="panel">
                <div class="muted">{{ listOrDash(campaignsFor(m)) }}</div>
              </div>
            </div>
          </article>

          <div v-if="!filteredInductees.length" class="empty">
            <div class="muted">No inductees match the current filters.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { pocConfig, membersCatalog, awardsCatalog, awardById, campaignById } from "@/data/pocData";

export default {
  name: "HallOfFameView",
  data() {
    const max = Math.max(1, ...(awardsCatalog || []).map((a) => Number(a.level || 1)));
    const min = Number(pocConfig?.minHallOfFameAwardLevel || 3);

    return {
      members: membersCatalog,
      search: "",
      minLevel: min,
      maxLevel: max,
    };
  },
  computed: {
    levelOptions() {
      const out = [];
      for (let i = 1; i <= this.maxLevel; i += 1) out.push(i);
      return out;
    },
    filteredInductees() {
      const q = this.search.trim().toLowerCase();

      return (this.members || [])
        .filter((m) => this.hasQualifyingAward(m))
        .filter((m) => {
          if (!q) return true;

          const inName = (m.name || "").toLowerCase().includes(q);
          const inUnit = (m.unit || "").toLowerCase().includes(q);

          const inAwards = this.qualifyingAwards(m).some((a) => String(a).toLowerCase().includes(q));

          return inName || inUnit || inAwards;
        });
    },
  },
  methods: {
    hasQualifyingAward(m) {
      return this.qualifyingAwards(m).length > 0;
    },
    qualifyingAwards(m) {
      const raw = m?.awards || [];
      const qualifying = raw
        .map((x) => awardById?.[x] || (typeof x === "string" ? awardById?.[x] : null))
        .filter(Boolean)
        .filter((a) => Number(a.level || 0) >= Number(this.minLevel || 0))
        .map((a) => a.name)
        .filter(Boolean);

      return Array.from(new Set(qualifying));
    },
    campaignsFor(m) {
      const raw = m?.campaigns || [];
      const names = raw.map((cid) => campaignById?.[cid]?.name || cid).filter(Boolean);
      return names.length ? names : null;
    },
    listOrDash(v) {
      if (!v) return "—";
      if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
      return String(v);
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

/* Grid of inductees */
.grid{
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap:12px;
}
.card{
  position:relative;
  border-radius:14px;
  overflow:hidden;
  border:1px solid rgba(255,255,255,0.12);
  background:
    linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.32)),
    radial-gradient(900px 260px at 20% 0%, rgba(90,220,255,0.06), transparent 60%);
}
.card-topline{ height:2px; background: linear-gradient(90deg, rgba(90,220,255,0.5), transparent 70%); }
.card::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  opacity:0.35; background: linear-gradient(transparent 65%, rgba(0,0,0,0.28));
}
.card > *{ position:relative; z-index:1; }

.card-head{
  padding:12px 12px 0;
}
.name{
  font-size:14px;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color: var(--text-location, #e6fbff);
}
.unit{
  margin-top:6px;
  color: var(--text-pilot-header, rgba(214,241,255,0.7));
  font-size:12px;
}

.card-body{ padding:12px; }

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
.text{ color: var(--text-pilot-value, #d6f1ff); line-height:1.35; }
.muted{ color: var(--text-pilot-header, rgba(214,241,255,0.7)); }

.empty{ grid-column: 1 / -1; padding:16px; }

/* Responsive */
@media (max-width: 1200px){
  .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 820px){
  .filters{ grid-template-columns:1fr; }
  .grid{ grid-template-columns: 1fr; }
}
</style>
