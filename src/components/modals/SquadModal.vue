<!-- src/components/modals/SquadModal.vue -->
<!-- This is the GROUPED modal: expects :squad (object with fireteams->slots) -->
<template>
  <div class="squad-overlay" @click.self="$emit('close')">
    <div class="squad-modal">
      <div class="squad-modal-header">
        <div class="section-header clipped-medium-backward-bio">
          <img src="/icons/license.svg" alt="" />
          <h1>SQUAD ROSTER</h1>
        </div>
        <button class="squad-close" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="squad-meta" :class="{ invalid: !squadLoadoutStatus.valid }">
        <div>
          <h2 class="squad-title">{{ squad?.squad || 'UNSC ELEMENT' }}</h2>
          <p class="squad-subtitle">
            {{ squadDescriptor(squad?.squad) }} · {{ personnelCount }} PERSONNEL
          </p>
          <div class="loadout-status">
            <span class="points">LOADOUT: {{ squadLoadoutStatus.points }}/10 PTS</span>
            <span v-if="!squadLoadoutStatus.valid" class="warn" :title="squadLoadoutStatus.errors.join(' • ')">⚠ INVALID</span>
            <span v-else class="ok">✓ VALID</span>
          </div>
        </div>
        <div class="squad-tag"><span>{{ squadInitials(squad?.squad) }}</span></div>
      </div>

      <div class="squad-scroll">
        <div v-for="ft in fireteamsSorted" :key="ft.name" class="fireteam-block">
          <div class="fireteam-header">
            <span class="fireteam-title">{{ ft.name.toUpperCase() }}</span>
            <span class="fireteam-count">{{ ft.slots.length }} SLOTS</span>
          </div>

          <div class="squad-members-grid">
            <div
              v-for="(slot, idx) in ft.slots"
              :key="slotKey(slot, idx)"
              class="member-card"
              :class="{ vacant: slot.status === 'VACANT', closed: slot.status === 'CLOSED' }"
            >
              <template v-if="slot.status !== 'FILLED'">
                <div class="member-header">
                  <div class="member-header-text">
                    <h3>{{ slot.status }}</h3>
                    <p class="rank-line">
                      <span class="rank">{{ slot.role || 'Slot' }}</span>
                      <span class="id">UNFILLED</span>
                    </p>
                  </div>
                </div>
                <div class="member-body">
                  <div class="member-column left">
                    <p><strong>Squad:</strong> {{ squad?.squad }}</p>
                    <p><strong>Fireteam:</strong> {{ ft.name }}</p>
                    <p><strong>Role:</strong> {{ slot.role || '—' }}</p>
                  </div>
                  <div class="member-column right">
                    <p><strong>Certifications:</strong> <span class="cert-none">N/A</span></p>
                  </div>
                </div>
                <div class="member-footer">
                  <span>SLOT STATUS: {{ slot.status }}</span>
                  <span>UNSC ORBAT</span>
                </div>
              </template>

              <template v-else>
                <div class="member-header">
                  <div v-if="rankInsignia(slot.member?.rank)" class="member-rank-insignia-wrapper">
                    <img :src="rankInsignia(slot.member?.rank)" :alt="slot.member?.rank + ' insignia'" class="member-rank-insignia" />
                  </div>
                  <div class="member-header-text">
                    <h3>{{ (slot.member?.name || 'UNKNOWN').toUpperCase() }}</h3>
                    <p class="rank-line">
                      <span class="rank">{{ slot.member?.rank || 'N/A' }}</span>
                      <span class="id">ID: {{ slot.member?.id || 'N/A' }}</span>
                    </p>
                  </div>
                </div>

                <div class="member-body">
                  <div class="member-column left">
                    <p><strong>Squad:</strong> {{ slot.member?.squad || squad?.squad }}</p>
                    <p><strong>Fireteam:</strong> {{ slot.member?.fireteam || ft.name }}</p>
                    <p><strong>Role:</strong> {{ slot.role || slot.member?.slot || 'Unassigned' }}</p>

                    <div class="loadout-row">
                      <label class="disposable">
                        <input type="checkbox" :checked="getLoadout(slot.member).disposable" @change="toggleDisposable(slot.member)" />
                        Disposable Rocket (1pt)
                      </label>
                    </div>

                    <div class="loadout-row">
                      <label class="primary-label">Assigned Loadout</label>
                      <select class="loadout-select" :value="getLoadout(slot.member).primary" @change="setPrimary(slot.member, $event.target.value)">
                        <option value="">None / Standard</option>
                        <option v-for="opt in availableLoadouts(slot.member)" :key="opt" :value="opt">
                          {{ loadoutLabel(opt) }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="member-column right">
                    <p><strong>Certifications:</strong></p>
                    <div class="cert-list">
                      <div v-for="(label, cidx) in certLabels" :key="label" class="cert-row">
                        <span class="cert-checkbox" :class="{ checked: hasCert(slot.member, cidx) }">
                          <span v-if="hasCert(slot.member, cidx)" class="checkbox-dot"></span>
                        </span>
                        <span class="cert-label">{{ label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="member-footer">
                  <span>BIOMETRIC RECORD VALID</span>
                  <span>UNSC SYSTEMS DATABASE</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div> <!-- scroll -->
    </div> <!-- modal -->
  </div>
</template>

<script>
export default {
  name: "SquadModal",
  props: {
    squad: { type: Object, required: true },
    certLabels: {
      type: Array,
      default: () => [
        "Rifleman","Machine Gunner","Anti Tank","Corpsmen","Combat Engineer",
        "Marksman","Breacher","Grenadier","Pilot","RTO","PJ","NCO","Officer",
      ],
    },
  },
  data() {
    return {
      loadouts: {},
      loadoutOptions: {
        grenadier: { label: "Grenadier", points: 2, explosive: true },
        antitank:  { label: "Anti-Tank", points: 3, explosive: true },
        m247:      { label: "M247 SAW", points: 3 },
        m247_50:   { label: "M247 .50", points: 5 },
        engineer:  { label: "Combat Engineer", points: 2 },
        marksman:  { label: "Marksman", points: 2 },
      },
    };
  },
  computed: {
    fireteamsSorted() {
      const fts = (this.squad?.fireteams || []).map(ft => ({ name: ft.name || "Element", slots: (ft.slots || []).slice() }));
      const orderKey = (n) => { const t = String(n || "").toLowerCase();
        if (t === "fireteam 1") return 0; if (t === "fireteam 2") return 1;
        if (t === "fireteam 3") return 2; if (t === "fireteam 4") return 3;
        if (t === "element") return 90; return 50; };
      const rankOrder = ["MAJ","CAPT","1STLT","2NDLT","CWO5","CWO4","CWO3","CWO2","WO","GYSGT","SSGT","SGT","CPL","LCPL","SPC4","SPC3","SPC2","SPC","PFC","PVT","RCT","HMC","HM1","HM2","HM3","HN","HA","HR"];
      const rScore = (r) => { const k = String(r || "").trim().toUpperCase().replace(/\s+/g,""); const i = rankOrder.indexOf(k); return i === -1 ? 999 : i; };
      const sScore = (s) => { const k = String(s || "").toUpperCase(); return k === "FILLED" ? 0 : k === "VACANT" ? 1 : k === "CLOSED" ? 2 : 3; };
      const cmp = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

      fts.forEach(ft => {
        ft.slots.sort((a, b) => {
          const as = sScore(a.status), bs = sScore(b.status);
          if (as !== bs) return as - bs;
          if (a.status !== "FILLED" || b.status !== "FILLED") return cmp.compare(String(a.role || ""), String(b.role || ""));
          const ar = rScore(a.member?.rank), br = rScore(b.member?.rank);
          if (ar !== br) return ar - br;
          return cmp.compare(String(a.member?.name || ""), String(b.member?.name || ""));
        });
      });

      fts.sort((a, b) => { const ak = orderKey(a.name), bk = orderKey(b.name);
        if (ak !== bk) return ak - bk; return String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });

      return fts;
    },
    personnelCount() {
      let c = 0; this.fireteamsSorted.forEach(ft => (ft.slots || []).forEach(s => { if (s.status === "FILLED" && s.member) c++; }));
      return c;
    },
    squadLoadoutStatus() {
      let points = 0; const errors = []; const explosiveTaken = new Set();
      this.fireteamsSorted.forEach(ft => (ft.slots || []).forEach(slot => {
        if (slot.status !== "FILLED" || !slot.member) return;
        const l = this.getLoadout(slot.member);
        if (l.disposable) { points += 1; if (explosiveTaken.has("disposable")) errors.push("Duplicate explosive weapon: Disposable"); explosiveTaken.add("disposable"); }
        if (l.primary) { const def = this.loadoutOptions[l.primary]; if (def) { points += def.points; if (def.explosive) { if (explosiveTaken.has(l.primary)) errors.push(`Duplicate explosive weapon: ${def.label}`); explosiveTaken.add(l.primary); } } }
      }));
      if (points > 10) errors.push("Exceeds 10 point maximum");
      return { valid: errors.length === 0, points, errors };
    },
  },
  methods: {
    slotKey(slot, idx) { return slot.member?.id || `${slot.status}-${slot.role}-${idx}`; },
    squadInitials(name) {
      if (!name) return "UNSC";
      const parts = String(name).trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0,3).toUpperCase();
      return parts.map((p,i)=> (i===parts.length-1 && /\d+/.test(p) ? p : p[0])).join("").toUpperCase();
    },
    squadDescriptor(name) {
      const n = String(name || "").toLowerCase();
      if (n.includes("chalk")) return "INFANTRY ELEMENT";
      if (n.includes("air") || n.includes("wing") || n.includes("wyvern")) return "AVIATION SUPPORT";
      if (n.includes("command") || n.includes("actual")) return "COMMAND ELEMENT";
      return "UNSC ELEMENT";
    },
    hasCert(member, idx) {
      const certs = member?.certifications || [];
      const v = certs[idx];
      return v === "Y" || v === true || v === "1";
    },
    getLoadout(member) {
      const id = member?.id; if (!id) return { primary: "", disposable: false };
      if (!this.loadouts[id]) this.loadouts[id] = { primary: "", disposable: false };
      return this.loadouts[id];
    },
    toggleDisposable(member) { const id = member?.id; if (!id) return; const curr = this.getLoadout(member); this.loadouts[id] = { ...curr, disposable: !curr.disposable }; },
    setPrimary(member, value) { const id = member?.id; if (!id) return; const curr = this.getLoadout(member); this.loadouts[id] = { ...curr, primary: value || "" }; },
    loadoutLabel(key) { const def = this.loadoutOptions[key]; return def ? `${def.label} (${def.points}pt)` : key; },
    availableLoadouts(member) {
      const has = (label) => this.hasCert(member, this.certLabels.indexOf(label));
      const o = [];
      if (has("Grenadier")) o.push("grenadier");
      if (has("Anti Tank")) o.push("antitank");
      if (has("Machine Gunner")) o.push("m247","m247_50");
      if (has("Combat Engineer")) o.push("engineer");
      if (has("Marksman")) o.push("marksman");
      return o;
    },
    rankCode(rank) {
      if (!rank) return null;
      const k = rank.trim().toUpperCase();
      const map = {
        RCT: "Rct", PVT: "Pvt", PFC: "PFC", SPC: "Spc", SPC2: "Spc2", SPC3: "Spc3", SPC4: "Spc4",
        LCPL: "LCpl", CPL: "Cpl", SGT: "Sgt", SSGT: "SSgt", GYSGT: "GySgt",
        WO: "WO", CWO2: "CWO2", CWO3: "CWO3", CWO4: "CWO4", CWO5: "CWO5",
        "2NDLT": "2ndLt", "1STLT": "1stLt", CAPT: "Capt", MAJ: "Maj",
        HR: "HR", HA: "HA", HN: "HN", HM3: "HM3", HM2: "HM2", HM1: "HM1", HMC: "HMC",
      };
      return map[k] || null;
    },
    rankInsignia(rank) { const base = this.rankCode(rank); return base ? `/ranks/${base}.png` : null; },
  },
};
</script>

<style scoped>
.squad-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.squad-modal   { width: min(94vw, 1680px); max-height: 92vh; overflow: hidden; background: #050811; color: #dce6f1; border-radius: .8rem; box-shadow: 0 0 28px rgba(0,0,0,.9); display: flex; flex-direction: column; padding: 1.2rem 1.6rem 1.6rem; }
.squad-modal-header { display: flex; justify-content: space-between; align-items: center; }
.squad-close { background: transparent; border: 1px solid rgba(220,230,241,.35); color: #dce6f1; border-radius: 999px; padding: .2rem .6rem; cursor: pointer; }

.squad-meta { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; border-bottom: 1px solid rgba(30,144,255,.6); padding-bottom: .6rem; margin-top: .6rem; }
.squad-meta.invalid { border-bottom-color: rgba(255,190,80,.9); }
.squad-title { margin: 0; font-size: 1.8rem; letter-spacing: .08em; }
.squad-subtitle { margin: .25rem 0 0; font-size: .95rem; color: #9ec5e6; text-transform: uppercase; }
.loadout-status { margin-top: .35rem; display: flex; gap: .75rem; align-items: center; font-size: .85rem; text-transform: uppercase; }
.loadout-status .points { color: #9ec5e6; }
.loadout-status .warn { color: rgba(255,190,80,.95); }
.loadout-status .ok   { color: rgba(120,255,170,.9); }
.squad-tag { border: 2px solid #1e90ff; color: #1e90ff; border-radius: .4rem; padding: .35rem .8rem; white-space: nowrap; }

.squad-scroll { overflow: auto; padding-right: .4rem; margin-top: .8rem; }
.fireteam-block { margin-bottom: 1.2rem; }
.fireteam-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .5rem; }
.fireteam-title { font-weight: 700; letter-spacing: .06em; color: #e0f0ff; }
.fireteam-count { color: #9ec5e6; font-size: .9rem; }

.squad-members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: .9rem; }
.member-card { background: rgba(0,10,30,.95); border-radius: .4rem; border-left: 4px solid #1e90ff; box-shadow: 0 0 10px rgba(0,0,0,.6); padding: .9rem 1.1rem; display: flex; flex-direction: column; min-height: 180px; }
.member-card.vacant, .member-card.closed { border-left-color: rgba(30,144,255,.35); opacity: .9; }
.member-header { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .8rem; }
.member-header h3 { margin: 0; font-size: 1.05rem; color: #e0f0ff; word-break: break-word; }
.rank-line { margin: .15rem 0 0; font-size: .88rem; color: #9ec5e6; display: flex; gap: .6rem; flex-wrap: wrap; }
.member-rank-insignia-wrapper { width: 46px; height: 46px; display: grid; place-items: center; }
.member-rank-insignia { max-width: 46px; max-height: 46px; object-fit: contain; }

.member-body { display: grid; grid-template-columns: 1fr 1fr; gap: .9rem; margin-top: .6rem; font-size: .9rem; }
.member-column p { margin: .18rem 0; }

.loadout-row { margin-top: .4rem; }
.disposable { user-select: none; }
.primary-label { display: block; margin-bottom: .15rem; font-size: .85rem; color: #9ec5e6; }
.loadout-select { width: 100%; background: #040a14; border: 1px solid rgba(30,144,255,.45); color: #dce6f1; border-radius: .3rem; padding: .25rem .35rem; }

.cert-list { display: grid; grid-template-columns: 20px 1fr; row-gap: .28rem; }
.cert-row { display: contents; }
.cert-checkbox { width: 16px; height: 16px; border: 1px solid rgba(30,144,255,.6); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; margin-right: 6px; }
.cert-checkbox.checked { border-color: rgba(120,255,170,.9); box-shadow: 0 0 6px rgba(120,255,170,.25) inset; }
.checkbox-dot { width: 10px; height: 10px; background: rgba(120,255,170,.95); border-radius: 2px; display: block; }
.cert-label { color: #dce6f1; }
.cert-none { font-size: .85rem; opacity: .75; }

.member-footer { margin-top: .6rem; font-size: .75rem; color: #7aa7c7; display: flex; justify-content: space-between; }
:deep(img) { max-width: 100%; height: auto; }
</style>
