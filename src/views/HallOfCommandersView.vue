<!-- FILE: src/views/HallOfCommandersView.vue -->
<template>
  <div id="hallOfCommanders">
    <section class="section-container terminal-shell">
      <header class="terminal-header">
        <div class="terminal-badge">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>

        <div class="terminal-title">
          <div class="kicker">CENTCOM / PERSONNEL</div>
          <div class="title">HALL OF COMMANDERS</div>
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
              placeholder="Commander / position / campaign…"
            />
          </div>

          <div class="filter-block">
            <div class="filter-label">CAMPAIGN STATUS</div>
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
            <div class="meta-chip">{{ filteredCommanders.length }} entry{{ filteredCommanders.length === 1 ? "" : "ies" }}</div>
          </div>
        </div>

        <div class="list">
          <article v-for="c in filteredCommanders" :key="c.id" class="row-card">
            <div class="card-topline"></div>

            <header class="row-head">
              <div class="left">
                <span class="rank-chip">CMD</span>
                <div class="name-block">
                  <div class="name">{{ c.name }}</div>
                  <div class="sub">{{ c.position }} · {{ c.unit }}</div>
                </div>
              </div>

              <div class="right">
                <span class="status-pill" :data-status="campaignStatus(c)">
                  {{ campaignStatus(c).toUpperCase() }}
                </span>
              </div>
            </header>

            <div class="row-body">
              <div class="kv">
                <div class="k">CAMPAIGN</div>
                <div class="v">{{ campaignName(c) }}</div>
              </div>
              <div class="kv">
                <div class="k">AWARDS</div>
                <div class="v">
                  <span v-if="awardsFor(c).length">{{ awardsFor(c).join(", ") }}</span>
                  <span v-else class="muted">—</span>
                </div>
              </div>
            </div>

            <footer class="row-actions">
              <button class="term-button terminal-button" type="button" @click="openDetails(c)">
                VIEW RECORD
              </button>
            </footer>
          </article>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="activeCommander" class="modal-overlay" role="presentation" @click.self="closeDetails">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Commander record: ${activeCommander.name}`"
        tabindex="-1"
        ref="modalRef"
      >
        <header class="modal-header">
          <div class="modal-title">
            <span class="rank-chip">CMD</span>
            <div>
              <div class="kicker">PERSONNEL RECORD</div>
              <h2>{{ activeCommander.name }}</h2>
            </div>
          </div>

          <button class="icon-button" type="button" @click="closeDetails" aria-label="Close">✕</button>
        </header>

        <div class="modal-body">
          <div class="modal-meta">
            <div><span class="label">UNIT</span><span class="value">{{ activeCommander.unit }}</span></div>
            <div><span class="label">POSITION</span><span class="value">{{ activeCommander.position }}</span></div>
            <div><span class="label">CAMPAIGN</span><span class="value">{{ campaignName(activeCommander) }}</span></div>
            <div><span class="label">STATUS</span><span class="value">{{ campaignStatus(activeCommander).toUpperCase() }}</span></div>
          </div>

          <section class="modal-section">
            <div class="section-label">AWARDS</div>
            <div class="panel">
              <div v-if="awardsFor(activeCommander).length" class="text">
                {{ awardsFor(activeCommander).join(", ") }}
              </div>
              <div v-else class="muted">No recorded awards.</div>
            </div>
          </section>

          <section class="modal-section">
            <div class="section-label">NOTES</div>
            <div class="panel">
              <div class="muted">
                Placeholder for citations, commendations, or campaign-specific command notes.
              </div>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="term-button terminal-button" type="button" @click="closeDetails">CLOSE</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { commanders, awardById, campaignById } from "@/data/pocData";

export default {
  name: "HallOfCommandersView",
  data() {
    return {
      commanders,
      search: "",
      statusFilter: "",
      activeCommander: null,
    };
  },
  computed: {
    filteredCommanders() {
      const q = this.search.trim().toLowerCase();
      const status = this.statusFilter;

      return (this.commanders || []).filter((c) => {
        const cStatus = this.campaignStatus(c);
        if (status && cStatus !== status) return false;

        if (!q) return true;

        const inCommander =
          (c.name || "").toLowerCase().includes(q) ||
          (c.position || "").toLowerCase().includes(q) ||
          (c.unit || "").toLowerCase().includes(q);

        const camp = campaignById?.[c.campaignId];
        const inCampaign =
          (camp?.name || "").toLowerCase().includes(q) ||
          (camp?.overview || "").toLowerCase().includes(q);

        const inAwards = (c.awards || []).some((a) =>
          String(a || "").toLowerCase().includes(q)
        );

        return inCommander || inCampaign || inAwards;
      });
    },
  },
  mounted() {
    window.addEventListener("keydown", this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    campaignName(c) {
      return campaignById?.[c.campaignId]?.name || "—";
    },
    campaignStatus(c) {
      return c.campaignStatus || campaignById?.[c.campaignId]?.status || "archived";
    },
    awardsFor(c) {
      const raw = c?.awards || [];
      return raw
        .map((x) => awardById?.[x]?.name || x)
        .filter(Boolean);
    },
    openDetails(c) {
      this.activeCommander = c;
      this.$nextTick(() => this.$refs.modalRef?.focus?.());
    },
    closeDetails() {
      this.activeCommander = null;
    },
    onKeydown(e) {
      if (e.key === "Escape" && this.activeCommander) this.closeDetails();
    },
  },
};
</script>

<style scoped>
/* View-level layout */
#hallOfCommanders{
  flex:1; min-width:0; box-sizing:border-box;
  padding: calc(var(--app-header-height, 72px) + 24px) 24px 24px 24px;
  color: var(--text-pilot-value, #d6f1ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
}

/* Terminal shell (same language as Campaign page) */
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
.term-input, .term-select{
  width:100%; min-height:38px;
  border-radius:10px;
  border:1px solid rgba(90,220,255,0.18);
  background: rgba(0,0,0,0.22);
  color: var(--text-pilot-value, #d6f1ff);
  padding:10px 12px;
  outline:none;
}
.term-input::placeholder{ color: rgba(214,241,255,0.5); }
.term-input:focus, .term-select:focus{
  box-shadow: 0 0 0 2px rgba(90,220,255,0.14);
  border-color: rgba(90,220,255,0.28);
}

/* List cards */
.list{ display:grid; grid-template-columns:1fr; gap:12px; }
.row-card{
  position:relative; border-radius:14px; overflow:hidden;
  border:1px solid rgba(255,255,255,0.12);
  background:
    linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.32)),
    radial-gradient(900px 260px at 20% 0%, rgba(90,220,255,0.06), transparent 60%);
}
.card-topline{ height:2px; background: linear-gradient(90deg, rgba(90,220,255,0.5), transparent 70%); }
.row-card::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  opacity:0.35; background: linear-gradient(transparent 65%, rgba(0,0,0,0.28));
}
.row-card > *{ position:relative; z-index:1; }

.row-head{
  padding:12px 12px 0;
  display:flex; justify-content:space-between; gap:14px; align-items:flex-start;
}
.left{ display:flex; gap:12px; align-items:center; }
.name{ font-size:14px; letter-spacing:0.12em; text-transform:uppercase; color: var(--text-location, #e6fbff); }
.sub{ margin-top:4px; color: var(--text-pilot-header, rgba(214,241,255,0.7)); font-size:12px; }

.right{ display:flex; align-items:center; gap:10px; }

.row-body{
  padding:12px;
  display:grid; grid-template-columns: 1fr 1fr; gap:12px;
}
.kv .k{
  font-size:10px; letter-spacing:0.22em; text-transform:uppercase;
  color: var(--text-pilot-header, rgba(214,241,255,0.75));
  margin-bottom:6px;
}
.kv .v{
  border-radius:12px; border:1px solid rgba(255,255,255,0.08);
  background: rgba(0,0,0,0.22);
  padding:10px 12px;
  color: var(--text-pilot-value, #d6f1ff);
  min-height:40px;
  display:flex; align-items:center;
}

.row-actions{ padding: 0 12px 12px; display:flex; justify-content:flex-end; }

/* Chips/buttons */
.rank-chip{
  display:inline-flex; align-items:center; justify-content:center;
  width:44px; height:34px; border-radius:12px;
  border:1px solid rgba(90,220,255,0.18);
  background: rgba(0,0,0,0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing:0.16em; font-size:12px;
}
.status-pill{
  display:inline-flex; align-items:center;
  padding:4px 10px; border-radius:999px;
  border:1px solid rgba(90,220,255,0.18);
  background: rgba(0,0,0,0.18);
  color: var(--text-pilot-value, #d6f1ff);
  font-size:10px; letter-spacing:0.18em;
}
.status-pill[data-status="active"]{ box-shadow: 0 0 18px rgba(90,220,255,0.12); }

.terminal-button{
  border-radius:12px;
  border:1px solid rgba(90,220,255,0.22);
  background: rgba(0,0,0,0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing:0.16em; text-transform:uppercase;
  padding:10px 14px;
}
.terminal-button:hover{ box-shadow: 0 0 0 2px rgba(90,220,255,0.12); }

.muted{ color: var(--text-pilot-header, rgba(214,241,255,0.7)); }

/* Modal */
.modal-overlay{
  position:fixed; inset:0; z-index:9999;
  background: rgba(0,0,0,0.72);
  display:grid; place-items:center; padding:18px;
}
.modal{
  width: min(1200px, 100%);
  max-height: 90vh;
  overflow:auto;
  border-radius:14px;
  border:1px solid rgba(255,255,255,0.14);
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(90,220,255,0.08), transparent 60%),
    linear-gradient(180deg, rgba(5,15,22,0.92), rgba(3,10,16,0.94));
  box-shadow: 0 0 0 1px rgba(150,240,255,0.08), 0 18px 60px rgba(0,0,0,0.7);
  outline:none;
}
.modal-header, .modal-footer{
  display:flex; justify-content:space-between; align-items:center;
  padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.22);
}
.modal-footer{ border-top:1px solid rgba(255,255,255,0.12); border-bottom:none; }
.modal-title{ display:flex; gap:12px; align-items:center; }
.modal-title .kicker{
  font-size:10px; letter-spacing:0.22em; text-transform:uppercase;
  color: var(--text-pilot-header, rgba(214,241,255,0.75));
}
.modal-title h2{
  margin:2px 0 0;
  font-size:16px; letter-spacing:0.14em; text-transform:uppercase;
  color: var(--text-location, #e6fbff);
}
.icon-button{
  background: rgba(0,0,0,0.2);
  border:1px solid rgba(90,220,255,0.18);
  color: var(--text-pilot-value, #d6f1ff);
  border-radius:12px;
  padding:8px 12px;
  cursor:pointer;
}
.icon-button:hover{ box-shadow: 0 0 0 2px rgba(90,220,255,0.12); }
.modal-body{ padding:16px; }
.modal-meta{
  display:flex; gap:18px; flex-wrap:wrap; margin-bottom:14px;
  padding:10px 12px;
  border-radius:12px;
  border:1px solid rgba(90,220,255,0.14);
  background: rgba(0,0,0,0.22);
}
.modal-meta .label{
  color: var(--text-pilot-header, rgba(214,241,255,0.7));
  margin-right:8px;
  font-size:10px; letter-spacing:0.18em; text-transform:uppercase;
}
.modal-meta .value{ color: var(--text-pilot-value, #d6f1ff); }
.modal-section{ margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.12); }
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

/* Responsive */
@media (max-width: 980px){
  .filters{ grid-template-columns:1fr; }
  .row-body{ grid-template-columns:1fr; }
  .row-head{ flex-direction:column; }
  .campaign-meta{ text-align:left; }
}
</style>
