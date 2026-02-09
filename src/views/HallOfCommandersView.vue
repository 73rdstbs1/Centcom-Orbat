<!-- /src/views/HallOfCommandersView.vue -->
<template>
  <div id="hallOfCommanders" class="content-container">
    <section class="section-container">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/portrait.svg')` }"></span>
        <div class="term-title">HALL OF COMMANDERS</div>
      </div>

      <div class="section-content-container term-window">
        <div class="term-body">
          <div class="scanlines" aria-hidden="true"></div>
          <div class="flicker" aria-hidden="true"></div>

          <div class="toolbar">
            <input v-model="q" class="term-input" placeholder="Search by name, unit, campaign…" />
            <select v-model="status" class="term-select">
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="kia">KIA</option>
              <option value="mia">MIA</option>
              <option value="relieved">Relieved</option>
            </select>
          </div>

          <div v-if="rows.length === 0" class="muted pad">No commanders match your filters.</div>

          <div v-else class="table-wrap">
            <table class="term-table">
              <thead>
                <tr>
                  <th>Commander</th>
                  <th>Unit</th>
                  <th>Position</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Awards</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rows" :key="r.id">
                  <td class="strong">{{ r.name }}</td>
                  <td>{{ r.unit }}</td>
                  <td>{{ r.position }}</td>
                  <td>
                    <span class="mono">{{ r.campaignId }}</span>
                    <span class="muted"> · </span>
                    <span>{{ r.campaignTitle }}</span>
                  </td>
                  <td><span class="pill" :class="`pill--${r.status}`">{{ r.status }}</span></td>
                  <td>
                    <div class="award-badges">
                      <span v-if="r.awardLabels.length === 0" class="muted">—</span>
                      <span v-for="a in r.awardLabels" :key="a" class="badge">{{ a }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="note muted">
              POC note: commanders + awards + campaign links come from <code>src/data/pocData.js</code>.
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { commanders, awardById, campaignById } from "@/data/pocData";

export default {
  name: "HallOfCommandersView",
  data() {
    return { q: "", status: "" };
  },
  computed: {
    rows() {
      const q = this.q.trim().toLowerCase();
      return (commanders || [])
        .filter(c => (this.status ? c.status === this.status : true))
        .map(c => {
          const camp = campaignById(c.campaignId);
          return {
            ...c,
            campaignTitle: camp?.title || "Unknown campaign",
            awardLabels: (c.awards || []).map(id => awardById(id)?.label).filter(Boolean),
          };
        })
        .filter(r => {
          if (!q) return true;
          const hay = [r.name, r.unit, r.position, r.campaignId, r.campaignTitle, r.status, ...(r.awardLabels || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
        .slice()
        .sort((a, b) => String(b.campaignId).localeCompare(String(a.campaignId)));
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
.pill{
  display:inline-flex; align-items:center; justify-content:center;
  padding: 3px 9px; border-radius: 999px;
  font-size: 11px; text-transform: uppercase;
  border: 1px solid rgba(255,255,255,.14);
}
.pill--active{ opacity: 1; }
.pill--completed{ opacity: .75; }
.pill--kia, .pill--mia{ opacity: .7; }
.pill--relieved{ opacity: .65; }
.muted{ opacity:.75; }
.pad{ padding: 0 8px 14px; }
.note{ margin-top: 12px; }
</style>
