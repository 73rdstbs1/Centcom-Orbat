<!-- /src/views/BackendRosterView.vue -->
<template>
  <div id="backendRoster" class="content-container">
    <section class="section-container">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/license.svg')` }"></span>
        <div class="term-title">BACKEND ROSTER</div>
      </div>

      <div class="section-content-container term-window">
        <div class="term-body">
          <div class="scanlines" aria-hidden="true"></div>
          <div class="flicker" aria-hidden="true"></div>

          <div class="toolbar">
            <input v-model="q" class="term-input" placeholder="Search by name, unit, position, award…" />
            <select v-model="unit" class="term-select" aria-label="Filter by unit">
              <option value="">All units</option>
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>

          <div v-if="rows.length === 0" class="muted pad">No members match your filters.</div>

          <div v-else class="table-wrap">
            <table class="term-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit</th>
                  <th>CENTCOM Positions</th>
                  <th>Awards</th>
                  <th>Campaigns Attended</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="m in rows" :key="m.id">
                  <tr class="row" @click="toggle(m.id)">
                    <td class="strong">{{ m.name }}</td>
                    <td>{{ m.unit }}</td>
                    <td class="muted">{{ compact(m.centcomPositions) }}</td>
                    <td>
                      <div class="award-badges">
                        <span v-if="m.awardLabels.length === 0" class="muted">—</span>
                        <span v-for="a in m.awardLabels" :key="a" class="badge">{{ a }}</span>
                      </div>
                    </td>
                    <td class="muted">{{ compact(m.campaignTitles) }}</td>
                  </tr>

                  <tr v-if="open[m.id]" class="details">
                    <td colspan="5">
                      <div class="details-box">
                        <div class="grid">
                          <div>
                            <div class="label">Member ID</div>
                            <div class="mono">{{ m.id }}</div>
                          </div>
                          <div>
                            <div class="label">Positions</div>
                            <ul class="list">
                              <li v-for="(p, idx) in m.centcomPositions" :key="idx">{{ p }}</li>
                              <li v-if="m.centcomPositions.length === 0" class="muted">—</li>
                            </ul>
                          </div>
                          <div>
                            <div class="label">Awards</div>
                            <ul class="list">
                              <li v-for="(a, idx) in m.awardLabels" :key="idx">{{ a }}</li>
                              <li v-if="m.awardLabels.length === 0" class="muted">—</li>
                            </ul>
                          </div>
                          <div>
                            <div class="label">Campaigns</div>
                            <ul class="list">
                              <li v-for="(c, idx) in m.campaignTitles" :key="idx">{{ c }}</li>
                              <li v-if="m.campaignTitles.length === 0" class="muted">—</li>
                            </ul>
                          </div>
                        </div>
                        <div class="note muted">
                          Click row to collapse. POC note: this roster represents “members who held a formal position or received an award”.
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>

            <div class="note muted">
              POC note: later we can auto-generate this from a single “Members” Google Sheet tab + join it to Campaigns/Awards.
            </div>
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
    return { q: "", unit: "", open: Object.create(null) };
  },
  computed: {
    units() {
      return Array.from(new Set((membersCatalog || []).map(m => m.unit).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    },
    rows() {
      const q = this.q.trim().toLowerCase();
      return (membersCatalog || [])
        .map(m => {
          const awardLabels = (m.awards || []).map(id => awardById(id)?.label).filter(Boolean);
          const campaignTitles = (m.campaignsAttended || [])
            .map(id => campaignById(id)?.title || id)
            .filter(Boolean);
          return { ...m, awardLabels, campaignTitles };
        })
        .filter(m => (this.unit ? m.unit === this.unit : true))
        .filter(m => {
          if (!q) return true;
          const hay = [
            m.name,
            m.id,
            m.unit,
            ...(m.centcomPositions || []),
            ...(m.awardLabels || []),
            ...(m.campaignTitles || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  methods: {
    toggle(id) {
      this.open[id] = !this.open[id];
    },
    compact(arr) {
      const list = (arr || []).filter(Boolean);
      if (list.length === 0) return "—";
      if (list.length <= 2) return list.join(" · ");
      return `${list[0]} · ${list[1]} · +${list.length - 2}`;
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
.table-wrap{ padding: 0 8px 14px; }
.term-table{
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.term-table th, .term-table td{
  text-align:left;
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255,255,255,.10);
  vertical-align: top;
}
.term-table th{ font-size: 12px; opacity:.85; letter-spacing: .35px; }
.row{ cursor: pointer; }
.row:hover{ background: rgba(255,255,255,.03); }
.details td{ padding: 0; border-bottom: none; }
.details-box{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 14px;
  background: rgba(0,0,0,.14);
  margin: 8px 10px 14px;
  padding: 12px;
}
.grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.label{ font-size: 12px; opacity:.8; margin-bottom: 6px; letter-spacing: .3px; }
.list{ margin:0; padding-left: 16px; }
.strong{ font-weight:700; }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.award-badges{ display:flex; flex-wrap:wrap; gap:6px; }
.badge{
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  opacity: .95;
}
.muted{ opacity:.75; }
.pad{ padding: 0 8px 14px; }
.note{ margin-top: 12px; }
</style>
