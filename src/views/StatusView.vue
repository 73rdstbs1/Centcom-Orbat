<!-- src/views/StatusView.vue -->
<template>
  <div
    id="status"
    :class="{ animate: animateView }"
    :style="{ 'animation-delay': animationDelay }"
    class="content-container"
  >
    <!-- Mission Log -->
    <section id="missions" class="section-container" :style="{ 'animation-delay': animationDelay }">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/campaign.svg')` }"></span>
        <div class="term-title">MISSION LOG</div>
      </div>
      <div class="section-content-container">
        
<div class="mission-list-container">
  <div v-for="group in campaignGroups" :key="group.key" class="campaign-group">
    <div class="campaign" :class="[{ open: isCampaignOpen(group.key) }, group.status]" @click="toggleCampaign(group.key)">
      <div class="name">
        <h1>Campaign</h1>
        <h2>{{ group.name }}</h2>
      </div>

      <div class="status" :class="group.status">
        {{ campaignStatusText(group.status) }}
        <img :src="`/icons/mission-${group.status}.svg`" />
      </div>

      <div class="toggle" aria-hidden="true">
        <span class="chevron" :class="{ open: isCampaignOpen(group.key) }">▾</span>
      </div>
    </div>

    <div v-show="isCampaignOpen(group.key)" class="campaign-missions">
      <Mission
        v-for="item in group.missions"
        :key="item.slug"
        :mission="item"
        :selected="missionSlug"
        @click.stop="selectMission(item.slug)"
      />
    </div>
  </div>
</div>
      </div>
    </section>


    <!-- Current Assignment -->
    <section id="assignment" class="section-container" :style="{ 'animation-delay': animationDelay }">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/deployable.svg')` }"></span>
        <div class="term-title">CURRENT ASSIGNMENT</div>
      </div>
      <div class="section-content-container">
        <vue-markdown-it :source="missionMarkdown" :options="markdownOptions" class="markdown" :style="markdownStyle" />
      </div>
    </section>

    <!-- Status Overview -->
    <section id="overview" class="section-container" :style="{ 'animation-delay': animationDelay }">
      <div class="term-hdr view-hdr">
        <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/orbital.svg')` }"></span>
        <div class="term-title">CURRENT STATUS</div>
      </div>
      <div class="section-content-container">
        <div class="status-grid">
          <!-- Block 1 -->
          <div class="status-block">
            <p><strong>Active Members:</strong> <span class="stat-num">{{ stats.activeMembers }}</span></p>
            <p><strong>Reserves:</strong> <span class="stat-num">{{ stats.reservesMembers }}</span></p>
            <p><strong>Elements:</strong> <span class="stat-num">{{ stats.totalElements }}</span></p>
          </div>

          
          <!-- Block 1B: Available Deployment Resources -->
          <div class="status-block resources-block">
            <p class="block-title"><strong>Available Deployment Resources</strong></p>
            <ul class="resources-list">
              <li v-for="r in deploymentResources" :key="r.label" class="resources-item">
                <span class="stat-num">{{ r.count }}</span>
                <span class="resources-label">{{ r.label }}</span>
              </li>
            </ul>
          </div>


          <!-- Block 2: Fill % by Element -->
          <div class="status-block">
            <p class="block-title"><strong>Fill % by Element</strong></p>
            <div v-if="elementFillStats.length" class="element-fill-list">
              <div
                v-for="row in elementFillStats.slice(0, 8)"
                :key="row.name"
                class="element-row"
                :title="`${row.filled}/${row.total} filled`"
              >
                <span class="el-name">{{ row.name }}</span>
                <div class="el-bar">
                  <div class="el-bar-fill" :style="{ width: row.percent + '%' }"></div>
                </div>
                <span class="el-percent">{{ row.percent }}%</span>
              </div>
              <p v-if="elementFillStats.length > 8" class="muted">(+{{ elementFillStats.length - 8 }} more)</p>
            </div>
            <div v-else class="muted">No elements with slots detected.</div>
          </div>

          <!-- Block 3 -->
          <div class="status-block">
            <p><strong>Total Personnel:</strong> <span class="stat-num">{{ stats.totalMembers }}</span></p>
            <p><strong>Filled Slots:</strong> <span class="stat-num">{{ stats.filledSlots }}</span></p>
            <p><strong>Free Slots:</strong> <span class="stat-num">{{ stats.vacantSlots }}</span></p>
            <p><strong>Fill Rate:</strong> <span class="stat-num">{{ stats.fillRate }}%</span></p>
            <p><strong>Active Mission:</strong> <span class="stat-num">{{ activeStartMissionLabel }}</span></p>
          </div>
        </div>

        <div class="promotions">
          <h3 class="promotions-title">Upcoming Promotions</h3>
          <div v-if="upcomingPromotions.length" class="promotions-list">
            <div
              v-for="(p, i) in upcomingPromotions"
              :key="p.id || p.name + i"
              class="promotion-row"
              :class="{ eligible: p.opsToNext === 0, imminent: p.opsToNext === 1 }"
              title="Ops attended pulled from Attendance sheet"
            >
              <span class="p-name">{{ p.name }}</span>
              <span class="p-ranks">{{ p.rank }} → {{ p.nextRank || '—' }}</span>
              <span class="p-ops" v-if="p.opsToNext > 0">{{ p.opsToNext }} ops</span>
              <span class="p-ops" v-else>ELIGIBLE</span>
            </div>
          </div>
          <div v-else class="promotions-empty">No upcoming promotions detected.</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { getSheetUrls } from "@/config/runtimeConfig";

import { VueMarkdownIt } from '@f3ve/vue-markdown-it';
import Mission from "@/components/Mission.vue";

export default {
  name: "StatusView",
  components: { VueMarkdownIt, Mission },
  props: {
    animate: { type: Boolean, required: true },
    initialSlug: { type: String, required: true },
    missions: { type: Array, required: true },
    events: { type: Array, required: true },
    members: { type: Array, default: () => [] },
    orbat: { type: Array, default: () => [] },
    reserves: { type: Array, default: () => [] },
  },
  data() {
    return {
      missionSlug: this.initialSlug,
      animateView: this.animate,
      animationDelay: "1.75s",
      missionMarkdown: "",
      missionTheme: {},
      expandedCampaigns: Object.create(null),


      // Editable list (shown on Status -> Current Status)
      deploymentResources: [
        { label: "Reinforcements", count: 30 },
        { label: "D77-TC Pelicans", count: 2 },
        { label: "UH-144 Falcons", count: 4 },
        { label: "M12R LAV Warthogs", count: 4 },
        { label: "Softskin Ground Transports", count: 4 },
        { label: "M313 Elephant", count: 1 },
      ],

      // RefData CSV (STRICT: Troop List + Troop Status)
      troopStatusCsvUrl: getSheetUrls().refDataCsvUrl,
      csvStatusIndex: Object.create(null), // nameKey -> status
      csvTroopIndex: Object.create(null),  // nameKey -> present in Troop List
    };
  },
  
computed: {
  markdownOptions() {
    return {
      html: true,
      linkify: true,
      typographer: true,
    };
  },
  markdownStyle() {
    const theme = this.missionTheme || {};
    const style = {};
    if (theme.accent) style["--markdown-accent"] = String(theme.accent);
    if (theme.strong) style["--markdown-strong-color"] = String(theme.strong);
    if (theme.link) style["--markdown-link-color"] = String(theme.link);
    return style;
  },
  campaignGroups() {
    const missions = (this.missions || []).slice();

    const byCampaign = new Map();
    for (const m of missions) {
      const name = String(m.campaign || "Unassigned").trim() || "Unassigned";
      const key = String(m.campaignKey || name).trim().toUpperCase() || name.toUpperCase();
      if (!byCampaign.has(key)) byCampaign.set(key, { key, name, missions: [] });
      byCampaign.get(key).missions.push(m);
    }

    const summarizeStatus = (ms) => {
      const statuses = ms.map((x) => String(x.status || "").trim());
      if (statuses.includes("start")) return "start";
      if (statuses.includes("failure")) return "failure";
      if (statuses.includes("partial-success")) return "partial-success";
      if (statuses.length && statuses.every((s) => s === "success")) return "success";
      return "start";
    };

    const groups = Array.from(byCampaign.values()).map((g) => {
      const ms = g.missions.slice();
      ms.sort((a, b) => {
        const ao = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.POSITIVE_INFINITY;
        const bo = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return String(a.slug || "").localeCompare(String(b.slug || ""));
      });
      return { key: g.key, name: g.name, missions: ms, status: summarizeStatus(ms) };
    });

    groups.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  },
    /* ---- CSV-based membership / status helpers ---- */
    nameKey() {
      return (name) =>
        String(name || "")
          .replace(/["'.]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();
    },
    cleanMemberName() {
      return (name) =>
        String(name || "").replace(/\s*[\(\[].*?[\)\]]\s*$/g, "").trim();
    },
    normalizeStatus() {
      const pretty = {
        ACTIVE: "Active",
        RESERVE: "Reserve",
        ELOA: "ELOA",
        OTHER: "Other",
        INACTIVE: "Inactive",
        DISCHARGED: "Discharged",
        UNKNOWN: "Unknown",
      };
      return (raw) => pretty[String(raw || "").trim().toUpperCase()] || "Unknown";
    },
    memberStatusOf() {
      return (m) => {
        const nk = this.nameKey(this.cleanMemberName(m?.name));
        return this.csvStatusIndex[nk] || "Unknown";
      };
    },
    isDischarged() {
      return (status) => String(status || "").toLowerCase() === "discharged";
    },
    isInTroopList() {
      return (m) => {
        const nk = this.nameKey(this.cleanMemberName(m?.name));
        const hasCsv = Object.keys(this.csvTroopIndex).length > 0; // only enforce after CSV loads
        return hasCsv ? !!this.csvTroopIndex[nk] : true;
      };
    },

    /* Filtered members: only Troop List & not Discharged */
    filteredMembers() {
      return (this.members || []).filter((m) => {
        const inList = this.isInTroopList(m);
        const status = this.memberStatusOf(m);
        return inList && !this.isDischarged(status);
      });
    },

    currentAssignment() {
      const ms = (this.missions || []).slice();
      const active = ms.find((m) =>
        String(m.status || "").toUpperCase().includes("ACTIVE")
      );
      return active || (ms.length ? ms[ms.length - 1] : null);
    },

    activeStartMission() {
      const missions = Array.isArray(this.missions) ? this.missions : [];
      const starts = missions.filter((m) => String(m?.status || "").trim().toLowerCase() === "start");
      if (!starts.length) return null;

      const score = (m) => {
        const slug = String(m?.slug || "");
        const id = String(m?.id || "");
        const digits = (slug.match(/\d+/g)?.join("") || id.match(/\d+/g)?.join("") || "");
        const n = digits ? Number.parseInt(digits, 10) : Number.NaN;
        return Number.isFinite(n) ? n : -1;
      };

      starts.sort((a, b) => score(a) - score(b));
      return starts[starts.length - 1] || null;
    },

    activeStartMissionLabel() {
      const m = this.activeStartMission;
      if (!m) return "NONE";

      const name =
        String(m?.name || m?.title || "").trim() ||
        (() => {
          const html = String(m?.content || "");
          const mt = html.match(/<div\s+class=["']briefing-title["']>\s*([^<]+)\s*<\/div>/i);
          return mt ? mt[1].trim() : "";
        })();

      return name || "NONE";
    },

    stats() {
      const members = this.filteredMembers; // filtered
      const orbat = this.orbat || [];

      // Only count by Troop Status (not squad name)
      const activeMembers = members.filter(
        (m) => this.memberStatusOf(m) === "Active"
      ).length;
      const reservesMembers = members.filter(
        (m) => this.memberStatusOf(m) === "Reserve"
      ).length;

      // Slot accounting (treat CLOSED as VACANT)
      let totalFireteams = 0,
        filledSlots = 0,
        vacantSlots = 0;
      orbat.forEach((sq) => {
        (sq.fireteams || []).forEach((ft) => {
          const slots = ft.slots || [];
          if (slots.length) totalFireteams += 1;
          slots.forEach((s) => {
            const st = String(s.status || "").toUpperCase();
            if (st === "FILLED" && s.member) filledSlots += 1;
            else if (st === "VACANT" || st === "CLOSED") vacantSlots += 1; // why: CLOSED counts as free
          });
        });
      });

      const totalSlots = filledSlots + vacantSlots;
      const fillRate =
        totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 100;

      return {
        totalMembers: members.length,
        totalElements: orbat.length,
        totalFireteams,
        filledSlots,
        vacantSlots,
        fillRate,
        activeMembers,
        reservesMembers,
      };
    },

    /* Per-element fill (CLOSED = VACANT) */
    elementFillStats() {
      const out = [];
      (this.orbat || []).forEach((sq) => {
        let filled = 0,
          vacant = 0,
          hasSlots = false;
        (sq.fireteams || []).forEach((ft) => {
          const slots = ft.slots || [];
          if (slots.length) hasSlots = true;
          slots.forEach((s) => {
            const st = String(s.status || "").toUpperCase();
            if (st === "FILLED" && s.member) filled += 1;
            else if (st === "VACANT" || st === "CLOSED") vacant += 1; // why: CLOSED counts as free
          });
        });
        if (!hasSlots) return;
        const total = filled + vacant;
        const percent = total > 0 ? Math.round((filled / total) * 100) : 100;
        out.push({ name: sq.squad || "Element", filled, total, percent });
      });
      out.sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name));
      return out;
    },

    /* Promotions list filtered to active roster only */
    upcomingPromotions() {
      const list = [];
      this.filteredMembers.forEach((m) => {
        const opsToNext = this.opsToNextPromotion(m);
        const nextRank = this.nextPromotionRank(m);
        if (opsToNext === null || nextRank === null) return;
        list.push({
          id: m.id,
          name: m.name || "Unknown",
          rank: m.rank || "N/A",
          nextRank,
          opsToNext,
          opsAttended: Number(m.opsAttended ?? NaN),
        });
      });
      list.sort((a, b) => {
        if (a.opsToNext !== b.opsToNext) return a.opsToNext - b.opsToNext;
        if (Number.isFinite(b.opsAttended) && Number.isFinite(a.opsAttended)) {
          if (b.opsAttended !== a.opsAttended)
            return b.opsAttended - a.opsAttended;
        }
        return String(a.name).localeCompare(String(b.name));
      });
      return list.slice(0, 10);
    },
  },
  created() {
    this.setAnimate();
    this.fetchTroopStatusCsv(); // load CSV early
  },
  beforeUpdate() {
    this.selectMission(this.missionSlug);
  },
  mounted() {
    if (this.missions.length > 0) {
      this.selectMission(this.missions[0].slug);
    }
  },
  
methods: {
  campaignStatusText(status) {
    switch (String(status || "").trim()) {
      case "start":
        return "In\nProgress";
      case "partial-success":
        return "Partial\nSuccess";
      case "success":
        return "Campaign\nSuccess";
      case "failure":
        return "Campaign\nFailure";
      default:
        return "Unknown";
    }
  },
  isCampaignOpen(key) {
    const k = String(key || "").toUpperCase();
    return !!this.expandedCampaigns[k];
  },
  toggleCampaign(key) {
    const k = String(key || "").toUpperCase();
    const next = !this.expandedCampaigns[k];
    this.expandedCampaigns = { ...this.expandedCampaigns, [k]: next };
  },
  expandCampaignForMission(mission) {
    const key = String(mission?.campaignKey || mission?.campaign || "Unassigned").toUpperCase();
    if (!key) return;
    if (this.expandedCampaigns[key]) return;
    this.expandedCampaigns = { ...this.expandedCampaigns, [key]: true };
  },
    
selectMission(slug) {
  this.missionSlug = slug;
  const m = this.missions.find((x) => x.slug === this.missionSlug);
  this.expandCampaignForMission(m);
  this.missionTheme = m?.theme || {};
  this.missionMarkdown = this.buildAssignmentMarkdown(m);
},
    
buildAssignmentMarkdown(mission) {
  if (!mission) return "";
  return String(mission.content || "").trim();
},
    setAnimate() {
      if (this.animate) this.animateView = true;
      const statusAnimated = window.sessionStorage.getItem("statusAnimated");
      if (statusAnimated) this.animationDelay = "0s";
      if (statusAnimated === null) window.sessionStorage.setItem("statusAnimated", true);
    },

    /* Promotion helpers (unchanged) */
    rankKey(rank) { return String(rank || "").trim().toUpperCase().replace(/[.\s]/g, ""); },
    promotionLadderFor(rank) {
      const r = this.rankKey(rank);
      const alias = {
        PRIVATE: "PVT", PVT: "PVT",
        "PRIVATEFIRSTCLASS": "PFC", PFC: "PFC",
        SPECIALIST: "SPC", SPC: "SPC",
        "SPECIALIST2": "SPC2", SPC2: "SPC2",
        "SPECIALIST3": "SPC3", SPC3: "SPC3",
        "SPECIALIST4": "SPC4", SPC4: "SPC4",
        HOSPITALMANAPPRENTICE: "HA", HA: "HA",
        HOSPITALMAN: "HN", HN: "HN",
        "HOSPITALCORPSMANTHIRDCLASS": "HM3", HM3: "HM3",
        "HOSPITALCORPSMANSECONDCLASS": "HM2", HM2: "HM2",
        WARRANTOFFICER: "WO", WO: "WO",
        "CHIEFWARRANTOFFICER2": "CWO2", CWO2: "CWO2",
        "CHIEFWARRANTOFFICER3": "CWO3", CWO3: "CWO3",
        "CHIEFWARRANTOFFICER4": "CWO4", CWO4: "CWO4",
      };
      const key = alias[r] || r;

      const ladders = {
        PVT:  { nextAt: 2,  nextRank: "PFC" },
        PFC:  { nextAt: 10, nextRank: "SPC" },
        SPC:  { nextAt: 20, nextRank: "SPC2" },
        SPC2: { nextAt: 30, nextRank: "SPC3" },
        SPC3: { nextAt: 40, nextRank: "SPC4" },
        SPC4: { nextAt: null, nextRank: null },

        HA:   { nextAt: 2,  nextRank: "HN" },
        HN:   { nextAt: 10, nextRank: "HM3" },
        HM3:  { nextAt: 20, nextRank: "HM2" },
        HM2:  { nextAt: 30, nextRank: null },

        WO:   { nextAt: null, nextRank: null },
        CWO2: { nextAt: 10, nextRank: "CWO3" },
        CWO3: { nextAt: 20, nextRank: "CWO4" },
        CWO4: { nextAt: 30, nextRank: null },
      };

      return ladders[key] || null;
    },
    opsToNextPromotion(member) {
      const ops = Number(member?.opsAttended);
      if (!Number.isFinite(ops)) return null;
      const ladder = this.promotionLadderFor(member?.rank);
      if (!ladder || !Number.isFinite(ladder.nextAt)) return null;
      return Math.max(0, ladder.nextAt - ops);
    },
    nextPromotionRank(member) {
      const ladder = this.promotionLadderFor(member?.rank);
      return ladder?.nextRank || null;
    },

    /* CSV load & parse */
    async fetchTroopStatusCsv() {
      try {
        const res = await fetch(this.troopStatusCsvUrl, { method: "GET" });
        const csvText = await res.text();
        const rows = this.parseCsv(csvText);
        if (!rows.length) return;

        const header = rows[0].map((h) => String(h || "").trim());
        const hdrLower = header.map((h) =>
          h.toLowerCase().replace(/\s+/g, " ").trim()
        );
        const nameIdx = hdrLower.findIndex((h) => h === "troop list");
        const statusIdx = hdrLower.findIndex((h) => h === "troop status");
        if (nameIdx === -1 || statusIdx === -1) return;

        const statusMap = Object.create(null);
        const troopMap = Object.create(null);
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const rawName = String(r[nameIdx] || "").trim();
          if (!rawName) continue;
          const nk = this.nameKey(this.cleanMemberName(rawName));
          troopMap[nk] = true;
          statusMap[nk] = this.normalizeStatus(String(r[statusIdx] || "").trim());
        }
        this.csvStatusIndex = statusMap;
        this.csvTroopIndex = troopMap;
      } catch (e) {
        console.warn("CSV status load failed:", e);
      }
    },
    parseCsv(text) {
      const rows = [];
      let cur = [];
      let val = "";
      let inQ = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQ) {
          if (ch === '"') {
            if (text[i + 1] === '"') { val += '"'; i++; } else { inQ = false; }
          } else { val += ch; }
        } else {
          if (ch === '"') inQ = true;
          else if (ch === ",") { cur.push(val); val = ""; }
          else if (ch === "\n") { cur.push(val); rows.push(cur); cur = []; val = ""; }
          else if (ch === "\r") { /* ignore */ }
          else { val += ch; }
        }
      }
      cur.push(val);
      rows.push(cur);
      if (rows.length && rows[rows.length - 1].every((x) => String(x).length === 0)) rows.pop();
      return rows;
    },
  },
};
</script>

<style scoped>
/* =========================
   UNSC TERMINAL THEME PASS
   (visual-only; no logic changes)
   ========================= */

#status .section-container{
  border-radius: 16px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.92), rgba(3, 6, 10, 0.95));
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 26px rgba(120, 180, 255, 0.10),
    0 0 110px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Scanlines + soft glow per window */
#status .section-container::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.02) 1px,
    rgba(0, 0, 0, 0) 3px,
    rgba(0, 0, 0, 0) 6px
  );
  mix-blend-mode: overlay;
  opacity: 0.28;
  z-index: 0;
}
#status .section-container::after{
  content:"";
  position:absolute;
  inset:-20%;
  pointer-events:none;
  background: radial-gradient(circle at 30% 20%, rgba(120, 180, 255, 0.07), transparent 55%);
  opacity: 0.9;
  animation: statusFlicker 2.6s infinite;
  z-index: 0;
}
@keyframes statusFlicker{
  0%, 100% { transform: translate3d(0,0,0); opacity: .75; }
  10% { transform: translate3d(-1px, 1px, 0); opacity: .85; }
  20% { transform: translate3d(1px, -1px, 0); opacity: .70; }
  35% { transform: translate3d(0px, 2px, 0); opacity: .90; }
  60% { transform: translate3d(2px, 0px, 0); opacity: .78; }
}

/* Ensure header/content sit above effects */
#status .section-header,
#status .section-content-container{ position: relative; z-index: 1; }

/* Header bar -> terminal chrome */
#status .section-header{
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
}

/* Neutralize clipped header shape to match terminal window */
#status .section-header.clipped-medium-backward{
  clip-path: none !important;
  background: rgba(0, 0, 0, 0.16) !important;
  border-radius: 0 !important;
}

/* Add "window dots" without changing template */
#status .section-header::before{
  content:"";
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(170, 220, 255, 0.22);
  box-shadow:
    16px 0 0 rgba(170, 220, 255, 0.22),
    32px 0 0 rgba(170, 220, 255, 0.22);
  margin-right: 8px;
  flex: 0 0 auto;
  opacity: .95;
}

/* Header icon + title */
#status .section-header img{
  width: 18px;
  height: 18px;
  opacity: .9;
  filter: drop-shadow(0 0 10px rgba(120,180,255,0.18));
}
#status .section-header h1{
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: rgba(190, 230, 255, 0.92);
  letter-spacing: 0.12em;
}

/* Content padding to match terminal rhythm */
#status .section-content-container{
  padding: 48px 16px 18px;
}

/* Mission Log (campaign list) theming (light touch, keeps existing behaviors) */
#missions .campaign{
  border: 1px solid rgba(170,220,255,0.18) !important;
  background: rgba(0,0,0,0.26) !important;
  border-radius: 14px !important;
  box-shadow: 0 0 0 1px rgba(170,220,255,0.05) inset, 0 0 22px rgba(0,0,0,0.28);
}
#missions .campaign:hover{
  border-color: rgba(170,220,255,0.75) !important;
}
#missions .campaign .name h1{
  font-size: 11px !important;
  opacity: .7;
  margin: 0;
}
#missions .campaign .name h2{
  margin: 0;
  color: #e6f3ff;
}
#missions .campaign .status{
  border-left: 1px solid rgba(170,220,255,0.12);
  padding-left: 10px;
}

/* Current Assignment markdown container */
#assignment .markdown{
  border: 1px dashed rgba(170,220,255,0.20);
  background: rgba(0,0,0,0.22);
  border-radius: 14px;
  padding: 12px 12px;
}

/* Status Overview blocks: switch to terminal palette */
.status-block,
.promotion-row{
  border-color: rgba(170,220,255,0.22) !important;
  background: rgba(0,0,0,0.26) !important;
  border-radius: 14px !important;
  box-shadow: 0 0 0 1px rgba(170,220,255,0.05) inset, 0 0 22px rgba(0,0,0,0.28);
}


/* View layout: make all three windows reach near the bottom of the viewport */
#status.content-container {
  display: grid;
  grid-template-columns: 1.05fr 1.55fr 1.05fr;
  gap: 1.2rem;
  align-items: stretch;

  height: calc(100vh - 128px);
  padding: 60px 18px 18px;
  overflow: hidden;
}

/* Stop base.css fixed-width sections from constraining StatusView */
#status > .section-container {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;

  height: 100%;
  max-height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}

/* Header stays fixed, content scrolls inside each window */
#status > .section-container > .section-content-container {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 0.35rem; /* why: keep scrollbar off text */
}

/* Make markdown fill and scroll cleanly inside Current Assignment */
#assignment .markdown {
  min-height: 0;
}

/* Responsive: stack windows and let page scroll naturally */
@media (max-width: 1200px) {
  #status.content-container {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
    padding-left: 12px;
    padding-right: 12px;
  }
  #status > .section-container {
    height: auto;
    max-height: none;
  }
}

/* Overview layout */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: .8rem;
  margin-top: .2rem;
}
.status-block {
  border: 1px dashed rgba(30,144,255,0.35);
  background: rgba(0,0,0,0.15);
  border-radius: .35rem;
  padding: .5rem .6rem;
  color: #dce6f1;
}
.status-block p { margin: .25rem 0; color: #dce6f1; }
.status-block strong { color: #e0f0ff; }
.block-title { margin-bottom: .35rem; }

/* Pop the numbers with a themed accent */
.stat-num {
  color: #7ec9ff;
  font-weight: 700;
}

/* Fill % by Element list */
.element-fill-list { display: grid; gap: .38rem; }
.element-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr auto;
  gap: .5rem;
  align-items: center;
  font-size: .95rem;
}
.el-name { color: #cfe6ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.el-bar {
  height: 8px;
  background: rgba(30,144,255,0.18);
  border: 1px solid rgba(30,144,255,0.35);
  border-radius: 999px;
  overflow: hidden;
}
.el-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(126,201,255,0.95), rgba(126,201,255,0.65));
}
.el-percent { color: #a9d3ff; font-weight: 700; min-width: 3ch; text-align: right; }
.muted { color: #9ec5e6; opacity: .8; font-size: .9rem; }

/* Promotions list */
.promotions { margin-top: 1rem; }
.promotions-title { margin: 0 0 .4rem; letter-spacing: .06em; color: #dce6f1; }
.promotions-list { display: grid; gap: .35rem; }
.promotion-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: .6rem;
  align-items: center;
  border: 1px dashed rgba(30,144,255,0.35);
  background: rgba(0,0,0,0.15);
  border-radius: .35rem;
  padding: .35rem .5rem;
  color: #dce6f1;
}
.promotion-row.eligible {
  border-color: rgba(120,255,170,0.85);
  box-shadow: 0 0 8px rgba(120,255,170,0.15) inset;
}
.promotion-row.imminent {
  border-color: rgba(255,190,80,0.85);
  box-shadow: 0 0 8px rgba(255,190,80,0.12) inset;
}
.p-name { color: #e0f0ff; }
.p-ranks { color: #9ec5e6; }
.p-ops { color: #cfdcea; }

/* Markdown h3 override (leave h1/h2 as-is) */
.markdown :deep(h3) { color: #9ec5e6; }

/* Match login terminal header (icon shell + title) */
#status .term-hdr.view-hdr .term-title{
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(190, 230, 255, 0.92);
  opacity: 1;
}


/* Match login terminal header (icon shell + title) for all section headers */
#status .term-hdr.view-hdr .term-title{
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(190, 230, 255, 0.92);
  opacity: 1;
}


/* Deployment resources list */
.resources-list{
  list-style: none;
  padding: 0;
  margin: .35rem 0 0;
  display: grid;
  gap: .25rem;
}
.resources-item{
  display: flex;
  align-items: baseline;
  gap: .5rem;
}
.resources-label{ opacity: .95; }
</style>
