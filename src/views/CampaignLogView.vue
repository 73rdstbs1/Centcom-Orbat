<!-- /src/views/CampaignLogView.vue -->
<template>
  <div id="campaignLog" class="content-container">
    <section class="section-container">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/campaign.svg')` }"></span>
        <div class="term-title">HISTORICAL CAMPAIGN LOG</div>
      </div>

      <div class="section-content-container term-window">
        <div class="term-body">
          <div class="scanlines" aria-hidden="true"></div>
          <div class="flicker" aria-hidden="true"></div>

          <div class="toolbar">
            <input v-model="q" class="term-input" placeholder="Search campaigns / operations / OPORD…" />
            <select v-model="status" class="term-select" aria-label="Filter by status">
              <option value="">All status</option>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div v-if="filteredCampaigns.length === 0" class="muted">No campaigns match your filters.</div>

          <div v-else class="campaigns">
            <article v-for="c in filteredCampaigns" :key="c.id" class="campaign-card">
              <header class="campaign-hdr" @click="toggle(c.id)">
                <div class="campaign-title">
                  <span class="pill" :class="`pill--${c.status}`">{{ c.status }}</span>
                  <h3>{{ c.title }}</h3>
                  <span class="sub">{{ dateRange(c.startDate, c.endDate) }}<span v-if="c.era"> · {{ c.era }}</span></span>
                </div>
                <div class="chev" aria-hidden="true">{{ open[c.id] ? "▾" : "▸" }}</div>
              </header>

              <div v-if="open[c.id]" class="campaign-body">
                <p v-if="c.description" class="desc">{{ c.description }}</p>

                <h4 class="section-label">Operations</h4>
                <div v-if="!c.operations?.length" class="muted">No operations yet.</div>
                <ol v-else class="ops">
                  <li v-for="op in c.operations" :key="op.id" class="op">
                    <div class="op-top">
                      <div class="op-title">
                        <span class="op-date">{{ op.date }}</span>
                        <strong>{{ op.title }}</strong>
                      </div>
                      <span class="opord">{{ op.opord?.title || "OPORD" }}</span>
                    </div>
                    <div class="opord-box">
                      <div class="opord-title">OPORD</div>
                      <div class="opord-summary">{{ op.opord?.summary || "—" }}</div>
                      <a v-if="op.opord?.link" class="opord-link" :href="op.opord.link" target="_blank" rel="noreferrer">Open</a>
                    </div>
                    <ul v-if="op.outcomes?.length" class="outcomes">
                      <li v-for="(o, idx) in op.outcomes" :key="idx">{{ o }}</li>
                    </ul>
                  </li>
                </ol>

                <h4 class="section-label">Per-unit roster (managed by unit leads)</h4>
                <div v-if="!c.rostersByUnit || Object.keys(c.rostersByUnit).length === 0" class="muted">
                  No rosters defined.
                </div>
                <div v-else class="rosters">
                  <div v-for="(r, unitKey) in c.rostersByUnit" :key="unitKey" class="roster">
                    <div class="roster-hdr">
                      <img class="roster-icon" src="/icons/squad.svg" alt="" />
                      <div class="roster-title">{{ r.unitName }}</div>
                      <div class="roster-count">{{ r.members?.length || 0 }} members</div>
                    </div>

                    <ul class="roster-list">
                      <li v-for="m in r.members" :key="m.memberId" class="roster-row">
                        <span class="roster-name">{{ memberName(m.memberId) }}</span>
                        <span class="roster-role muted">{{ m.role || "—" }}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div class="note muted">
                  POC note: this data currently lives in <code>src/data/pocData.js</code>. Later we can load it from a Google Sheet CSV.
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { campaigns, memberById } from "@/data/pocData";

export default {
  name: "CampaignLogView",
  data() {
    return {
      q: "",
      status: "",
      open: Object.create(null),
    };
  },
  computed: {
    filteredCampaigns() {
      const q = this.q.trim().toLowerCase();
      return (campaigns || [])
        .filter(c => (this.status ? c.status === this.status : true))
        .filter(c => {
          if (!q) return true;
          const hay = [
            c.title,
            c.id,
            c.status,
            c.era,
            c.description,
            ...(c.operations || []).flatMap(op => [op.title, op.date, op.opord?.title, op.opord?.summary]),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
        .slice()
        .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    },
  },
  created() {
    // Open the newest campaign by default (nice demo effect).
    const newest = this.filteredCampaigns?.[0];
    if (newest?.id) this.open[newest.id] = true;
  },
  methods: {
    toggle(id) {
      this.open[id] = !this.open[id];
    },
    memberName(memberId) {
      return memberById(memberId)?.name || memberId;
    },
    dateRange(start, end) {
      if (!start) return "—";
      return end ? `${start} → ${end}` : `${start} → ongoing`;
    },
  },
};
</script>

<style scoped>
.toolbar{ display:flex; gap:10px; align-items:center; padding: 8px 8px 14px; }
.term-input, .term-select{
  width: 100%;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.25);
  color: inherit;
  padding: 10px 12px;
  border-radius: 10px;
  outline: none;
}
.term-select{ max-width: 220px; }

.campaigns{ display:flex; flex-direction:column; gap:12px; padding: 0 8px 14px; }
.campaign-card{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 14px;
  background: rgba(0,0,0,.18);
  overflow: hidden;
}
.campaign-hdr{
  display:flex; justify-content:space-between; align-items:center;
  padding: 12px 14px;
  cursor: pointer;
}
.campaign-title h3{ margin: 0; font-size: 16px; letter-spacing: .4px; }
.sub{ display:block; margin-top: 4px; font-size: 12px; opacity:.8; }
.chev{ opacity:.8; font-size: 18px; padding-left: 10px; }
.campaign-body{ padding: 0 14px 14px; }
.desc{ margin: 8px 0 10px; opacity:.9; }
.section-label{ margin: 14px 0 8px; font-size: 13px; letter-spacing: .35px; opacity:.95; }

.pill{
  display:inline-flex; align-items:center; justify-content:center;
  padding: 3px 9px; border-radius: 999px;
  font-size: 11px; text-transform: uppercase;
  border: 1px solid rgba(255,255,255,.14);
  margin-right: 8px;
}
.pill--planned{ opacity:.85; }
.pill--active{ opacity: 1; }
.pill--completed{ opacity:.75; }
.pill--abandoned{ opacity:.6; }

.ops{ margin:0; padding-left: 18px; display:flex; flex-direction:column; gap:12px; }
.op{ padding: 10px 10px; border: 1px dashed rgba(255,255,255,.12); border-radius: 12px; }
.op-top{ display:flex; justify-content:space-between; gap:10px; align-items:baseline; }
.op-title{ display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; }
.op-date{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; opacity:.85; font-size: 12px; }
.opord{ font-size: 12px; opacity:.8; }
.opord-box{ margin-top:8px; padding: 10px; border: 1px solid rgba(255,255,255,.10); border-radius: 12px; background: rgba(0,0,0,.18); position: relative; }
.opord-title{ font-size: 12px; opacity:.8; margin-bottom: 6px; letter-spacing: .3px; }
.opord-summary{ opacity:.95; }
.opord-link{ position:absolute; right: 10px; top: 10px; font-size: 12px; opacity:.9; }

.outcomes{ margin: 8px 0 0; padding-left: 16px; opacity:.9; }
.rosters{ display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px; }
.roster{ border: 1px solid rgba(255,255,255,.10); border-radius: 14px; background: rgba(0,0,0,.12); overflow:hidden; }
.roster-hdr{ display:flex; gap:10px; align-items:center; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.08); }
.roster-icon{ width: 18px; height: 18px; opacity:.9; }
.roster-title{ font-size: 13px; letter-spacing:.3px; }
.roster-count{ margin-left:auto; font-size: 12px; opacity:.75; }
.roster-list{ margin:0; padding: 10px 12px; list-style:none; display:flex; flex-direction:column; gap:8px; }
.roster-row{ display:flex; justify-content:space-between; gap:12px; }
.roster-name{ font-weight:600; }
.note{ margin-top: 12px; }
.muted{ opacity:.75; }
</style>
