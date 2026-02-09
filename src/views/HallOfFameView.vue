<!-- /src/views/HallOfFameView.vue -->
<template>
  <div id="hallOfFame" class="content-container">
    <section class="section-container">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/mission-success.svg')` }"></span>
        <div class="term-title">HALL OF FAME</div>
      </div>

      <div class="section-content-container term-window">
        <div class="term-body">
          <div class="scanlines" aria-hidden="true"></div>
          <div class="flicker" aria-hidden="true"></div>

          <div class="toolbar">
            <input v-model="q" class="term-input" placeholder="Search by member or award…" />
            <label class="threshold">
              <span class="muted">Min award level</span>
              <select v-model.number="minLevel" class="term-select">
                <option v-for="lvl in levels" :key="lvl" :value="lvl">{{ lvl }}+</option>
              </select>
            </label>
          </div>

          <div class="muted pad">
            Clarification needed: “award higher than a certain threshold” — this POC uses an editable numeric award level.
            Set levels per award in <code>src/data/pocData.js</code>.
          </div>

          <div v-if="rows.length === 0" class="muted pad">No members match the current threshold.</div>

          <div v-else class="cards">
            <article v-for="r in rows" :key="r.memberId" class="card">
              <header class="card-hdr">
                <div class="who">
                  <div class="name">{{ r.memberName }}</div>
                  <div class="meta muted">{{ r.unit }}</div>
                </div>
                <div class="count">{{ r.awards.length }} award{{ r.awards.length === 1 ? "" : "s" }}</div>
              </header>

              <div class="card-body">
                <div class="award-list">
                  <div v-for="a in r.awards" :key="a.id" class="award">
                    <span class="badge">{{ a.label }}</span>
                    <span class="muted">Lvl {{ a.level }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="note muted">
            POC note: this is generated from <code>membersCatalog</code> + <code>awardsCatalog</code>.
            Later we can compute it directly from a Sheet (and optionally allow per-unit Hall of Fame pages).
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { pocConfig, awardsCatalog, membersCatalog } from "@/data/pocData";

export default {
  name: "HallOfFameView",
  data() {
    return {
      q: "",
      minLevel: pocConfig.minHallOfFameAwardLevel,
    };
  },
  computed: {
    levels() {
      const max = Math.max(1, ...(awardsCatalog || []).map(a => Number(a.level) || 0));
      const list = [];
      for (let i = 1; i <= max; i++) list.push(i);
      return list.reverse();
    },
    rows() {
      const q = this.q.trim().toLowerCase();
      const awardMap = new Map((awardsCatalog || []).map(a => [a.id, a]));
      return (membersCatalog || [])
        .map(m => {
          const awards = (m.awards || [])
            .map(id => awardMap.get(id))
            .filter(a => a && Number(a.level) >= Number(this.minLevel))
            .sort((a, b) => Number(b.level) - Number(a.level));
          return { memberId: m.id, memberName: m.name, unit: m.unit, awards };
        })
        .filter(r => r.awards.length > 0)
        .filter(r => {
          if (!q) return true;
          const hay = [r.memberName, r.unit, ...(r.awards || []).map(a => a.label)].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(q);
        })
        .slice()
        .sort((a, b) => b.awards[0].level - a.awards[0].level || a.memberName.localeCompare(b.memberName));
    },
  },
};
</script>

<style scoped>
.toolbar{ display:flex; gap:10px; align-items:center; padding: 8px 8px 14px; flex-wrap: wrap; }
.threshold{ display:flex; gap:8px; align-items:center; }
.term-input, .term-select{
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.25);
  color: inherit;
  padding: 10px 12px;
  border-radius: 10px;
  outline: none;
}
.term-input{ flex: 1 1 280px; min-width: 240px; }
.term-select{ width: 120px; }
.cards{ display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; padding: 0 8px 14px; }
.card{
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background: rgba(0,0,0,.18);
  overflow:hidden;
}
.card-hdr{
  display:flex; justify-content:space-between; gap:12px; align-items:flex-start;
  padding: 12px 12px; border-bottom: 1px solid rgba(255,255,255,.08);
}
.name{ font-weight:800; letter-spacing:.3px; }
.count{ font-size: 12px; opacity:.8; }
.card-body{ padding: 12px; }
.award-list{ display:flex; flex-direction:column; gap:8px; }
.award{ display:flex; justify-content:space-between; gap:10px; align-items:center; }
.badge{
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  opacity: .95;
}
.muted{ opacity:.75; }
.pad{ padding: 0 8px 14px; }
.note{ padding: 0 8px 14px; }
</style>
