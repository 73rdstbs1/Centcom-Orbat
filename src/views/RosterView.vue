<!-- src/views/RosterView.vue (or PilotsView.vue) -->
<template>
  <div id="rosterView" class="roster-shell">
    <!-- LEFT: ORBAT -->
    <section id="members" class="term-window">
      <div class="term-hdr">
        <span class="hdr-icon" aria-hidden="true"></span>
        <div class="term-title">
          UNSC ORDER OF BATTLE // UNIT ROSTER
        </div>
      </div>

      <div
        class="term-body"
        :class="{ animate: animateView }"
        :style="{ 'animation-delay': animationDelay }"
      >
        <div class="scanlines" aria-hidden="true"></div>
        <div class="flicker" aria-hidden="true"></div>

        <div class="logo-ghost" aria-hidden="true">
          <img src="/faction-logos/FUD_UNSC_Logo.png" alt="" />
        </div>

        <div class="content-scroll">
          <div class="orbat-wrapper">
            <div v-if="!orbat || !orbat.length" class="muted">Loading squads and members…</div>

            <div v-else class="hierarchy-container">
              <!-- BROADSWORD COMMAND -->
              <div v-if="hierarchy.broadswordCommand" class="orbat-row center-row actual-row">
                <div class="squad-row single">
                  <div class="squad-card" @click="openSquad(hierarchy.broadswordCommand)">
                    <div class="squad-header">
                      <div class="squad-insignia">
                        <span>{{ squadInitials(hierarchy.broadswordCommand.squad) }}</span>
                      </div>
                      <div class="squad-meta">
                        <h2>{{ hierarchy.broadswordCommand.squad }}</h2>
                        <p class="squad-subtitle">{{ squadDescriptor(hierarchy.broadswordCommand.squad) }}</p>
                        <p class="squad-count">{{ personnelCount(hierarchy.broadswordCommand) }} PERSONNEL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CHALK ACTUAL -->
              <div v-if="hierarchy.chalkActual" class="orbat-row center-row actual-row">
                <div class="squad-row single">
                  <div class="squad-card" @click="openSquad(hierarchy.chalkActual)">
                    <div class="squad-header">
                      <div class="squad-insignia">
                        <span>{{ squadInitials(hierarchy.chalkActual.squad) }}</span>
                      </div>
                      <div class="squad-meta">
                        <h2>{{ hierarchy.chalkActual.squad }}</h2>
                        <p class="squad-subtitle">{{ squadDescriptor(hierarchy.chalkActual.squad) }}</p>
                        <p class="squad-count">{{ personnelCount(hierarchy.chalkActual) }} PERSONNEL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CHALKS -->
              <div v-if="hierarchy.chalks.length" class="orbat-row chalk-row">
                <div class="squad-row three">
                  <div
                    v-for="sq in hierarchy.chalks"
                    :key="sq.squad"
                    class="squad-card"
                    @click="openSquad(sq)"
                  >
                    <div class="squad-header">
                      <div class="squad-insignia">
                        <span>{{ squadInitials(sq.squad) }}</span>
                      </div>
                      <div class="squad-meta">
                        <h2>{{ sq.squad }}</h2>
                        <p class="squad-subtitle">{{ squadDescriptor(sq.squad) }}</p>
                        <p class="squad-count">{{ personnelCount(sq) }} PERSONNEL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SUPPORT -->
              <div v-if="hierarchy.support.length" class="orbat-row">
                <div class="squad-row three">
                  <div
                    v-for="sq in hierarchy.support"
                    :key="sq.squad"
                    class="squad-card"
                    @click="openSquad(sq)"
                  >
                    <div class="squad-header">
                      <div class="squad-insignia">
                        <span>{{ squadInitials(sq.squad) }}</span>
                      </div>
                      <div class="squad-meta">
                        <h2>{{ sq.squad }}</h2>
                        <p class="squad-subtitle">{{ squadDescriptor(sq.squad) }}</p>
                        <p class="squad-count">{{ personnelCount(sq) }} PERSONNEL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- OTHER -->
              <div v-if="hierarchy.other.length" class="orbat-row">
                <div class="squad-row three">
                  <div
                    v-for="sq in hierarchy.other"
                    :key="sq.squad"
                    class="squad-card"
                    @click="openSquad(sq)"
                  >
                    <div class="squad-header">
                      <div class="squad-insignia">
                        <span>{{ squadInitials(sq.squad) }}</span>
                      </div>
                      <div class="squad-meta">
                        <h2>{{ sq.squad }}</h2>
                        <p class="squad-subtitle">{{ squadDescriptor(sq.squad) }}</p>
                        <p class="squad-count">{{ personnelCount(sq) }} PERSONNEL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> <!-- /hierarchy-container -->
          </div> <!-- /orbat-wrapper -->
        </div> <!-- /content-scroll -->
      </div> <!-- /term-body -->
    </section>

    <!-- RIGHT: TRAINERS -->
    <section id="trainers" class="term-window">
      <div class="term-hdr">
        <span class="hdr-icon" aria-hidden="true"></span>
        <div class="term-title">
          TRAINING & CONTACTS // REF DATA
        </div>
      </div>

      <div class="term-body trainers-body">
        <div class="scanlines" aria-hidden="true"></div>

        <div class="content-scroll">
          <div class="panel">
            <div v-if="trainersLoading" class="muted">Loading RefData…</div>
            <div v-else-if="trainersError" class="error">{{ trainersError }}</div>

            <div v-else class="cards-grid trainers-grid">
              <div v-for="role in trainers" :key="role.key" class="t-card">
                <div class="card-head">
                  <h3 class="title plain-title" :title="role.title">{{ role.title }}</h3>
                </div>

                <div class="body">
                  <div class="lead">
                    <span class="label">Contact:</span>
                    <span class="highlight">{{ role.lead || "—" }}</span>
                  </div>

                  <div class="divider" />

                  <div class="trainers-block">
                    <div class="label">Trainers</div>
                    <ul v-if="role.trainers.length" class="vlist">
                      <li v-for="n in role.trainers" :key="n" :title="n">{{ n }}</li>
                    </ul>
                    <div v-else class="muted">None listed</div>
                  </div>
                </div>
              </div>
            </div>
          </div> <!-- /panel -->
        </div> <!-- /content-scroll -->
      </div>
    </section>

    <!-- Modal (keeps your content/logic; restyled to match terminal theme) -->
    <div v-if="activeSquad" class="squad-overlay" @click.self="closeSquad">
      <div class="squad-modal">
        <div class="term-hdr modal-hdr">
          <span class="hdr-icon" aria-hidden="true"></span>
          <div class="term-title">SQUAD ROSTER // {{ activeSquad.squad }}</div>
          <button class="squad-close" @click="closeSquad" aria-label="Close">✕</button>
        </div>

        <div class="term-body modal-body">
          <div class="scanlines" aria-hidden="true"></div>

          <div class="squad-modal-meta">
            <div class="squad-title">
              <h2>{{ activeSquad.squad }}</h2>
              <p class="subtitle">
                {{ squadDescriptor(activeSquad.squad) }} ·
                {{ personnelCount(activeSquad) }} PERSONNEL
              </p>
            </div>

            <div class="squad-tag"><span>{{ squadInitials(activeSquad.squad) }}</span></div>
          </div>

          <div class="squad-modal-scroll">
            <div v-for="ft in activeFireteams" :key="ft.name" class="fireteam-block">
              <div class="fireteam-header">
                <span class="fireteam-title">{{ ft.name.toUpperCase() }}</span>
                <span class="fireteam-count">({{ ft.slots.length }} SLOTS)</span>
              </div>

              <div class="squad-members-grid">
                <div
                  v-for="(slot, idx) in ft.slots"
                  :key="slotKey(slot, idx)"
                  class="member-card"
                  :class="{ vacant: slot.status === 'VACANT', closed: slot.status === 'CLOSED' }"
                >
                  <!-- VACANT / CLOSED -->
                  <template v-if="slot.status === 'VACANT' || slot.status === 'CLOSED'">
                    <div class="member-header">
                      <div class="member-header-text">
                        <h3>{{ slot.status }}</h3>
                        <p class="rank-line">
                          <span class="rank">{{ slot.role }}</span>
                          <span class="id">UNFILLED SLOT</span>
                        </p>
                      </div>
                    </div>

                    <div class="member-body">
                      <div class="member-column left">
                        <p class="detail-line">
                          <strong>Role:</strong>
                          <span
                            class="role-accent"
                            :class="{ 'role-corpsman': isMedicalRank(slot.role) || isCorpsmanRole(slot.role) }"
                          >
                            {{ slot.role }}
                          </span>
                        </p>
                      </div>
                      <div class="member-column right">
                        <p><strong>Certifications:</strong></p>
                        <span class="cert-none">N/A</span>
                      </div>
                    </div>

                    <div class="member-footer">
                      <span>SLOT STATUS: {{ slot.status }}</span>
                      <span>UNSC SYSTEMS DATABASE</span>
                    </div>
                  </template>

                  <!-- FILLED -->
                  <template v-else>
                    <div class="member-header">
                      <div class="member-rank-insignia-wrapper" v-if="rankInsignia(slot.member?.rank)">
                        <img
                          :src="rankInsignia(slot.member.rank)"
                          :alt="slot.member.rank + ' insignia'"
                          class="member-rank-insignia"
                        />
                      </div>

                      <div class="member-header-text">
                        <h3>{{ (slot.member?.name || 'UNKNOWN').toUpperCase() }}</h3>
                        <p class="rank-line">
                          <span class="rank">{{ slot.member?.rank || 'N/A' }}</span>
                          <span class="id">ID: {{ slot.member?.id || 'N/A' }}</span>
                        </p>
                      
                        <p class="att-line" v-if="latestAttendanceFor(slot.member)">
                          <span class="att-label">LAST OP:</span>
                          <span
                            class="att-badge"
                            :class="attendanceClass(latestAttendanceFor(slot.member).code)"
                            :title="latestAttendanceFor(slot.member).label"
                          >
                            {{ attendanceBadgeText(latestAttendanceFor(slot.member)) }}
                          </span>
                        </p>

</div>
                    </div>

                    <div class="member-body">
                      <div class="member-column left">
                        <p class="detail-line">
                          <strong>Role:</strong>
                          <span
                            class="role-accent"
                            :class="{ 'role-corpsman': isMedicalRank(slot.member?.rank) || isCorpsmanRole(slot.role || slot.member?.slot) }"
                          >
                            {{ slot.role || slot.member?.slot || 'Unassigned' }}
                          </span>
                        </p>

                        <p class="detail-line">
                          <strong>Join Date:</strong>
                          <span class="date-accent join-date">{{ slot.member?.joinDate || 'Unknown' }}</span>
                        </p>

                        <div
                          class="ops-promo"
                          :class="{ imminent: opsToNextPromotion(slot.member) === 1 || opsToNextPromotion(slot.member) === 0 }"
                        >
                          <p class="detail-line">
                            <strong>Ops Attended:</strong>
                            <span class="accent-strong">{{ formatOps(getOps(slot.member)) }}</span>
                          </p>
                          <p class="detail-line next-rank-line">
                            <strong>Next Rank:</strong>
                            <span class="accent-strong">
                              {{ nextPromotion(slot.member)?.nextRank || '—' }}
                            </span>
                            <span v-if="opsToNextPromotion(slot.member) !== null" class="accent">
                              ({{ opsToNextPromotion(slot.member) }} ops)
                            </span>
                          </p>
                          <p v-if="nextPromotion(slot.member)?.misc" class="detail-line">
                            <strong>Requirements:</strong>
                            <span class="accent-strong">{{ nextPromotion(slot.member).misc }}</span>
                          </p>
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

              <div class="fireteam-divider"></div>
            </div>
          </div> <!-- /squad-modal-scroll -->
        </div> <!-- /term-body -->
      </div>
    </div>

    <audio ref="orbatClickAudio" preload="auto">
      <source src="/sound/Orbat Main Menu Click.ogg" type="audio/ogg" />
    </audio>
  </div>
</template>

<script>
import { getSheetUrls } from "@/config/runtimeConfig";

export default {
  // If this file is now RosterView.vue, you can rename this safely too.
  // Keeping it as-is will not break anything.
  name: "PilotsView",
  props: {
    animate: { type: Boolean, default: true },
    members: { type: Array, default: () => [] },
    orbat:   { type: Array, default: () => [] },
    attendance: { type: Array, default: () => [] },
  },
  data() {
    return {
      animateView: false,
      animationDelay: "0ms",

      // RefData (trainers list)
      trainersLoading: true,
      trainersError: "",
      refDataCsvUrl: getSheetUrls().refDataCsvUrl,
      trainers: [],

      // Attendance (latest op status per trooper)
      attendanceCsvUrl: getSheetUrls().opsCsvUrl,
      latestAttendance: Object.create(null),
      attendanceLoading: true,
      attendanceError: "",
      activeSquad: null,
      certLabels: [
        "Rifleman","Machine Gunner","Anti Tank","Corpsmen","Combat Engineer",
        "Marksman","Breacher","Grenadier","Pilot","RTO","PJ","NCO","Officer",
      ],
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
  created() {
    this.loadTrainerRefData();
    this.loadAttendanceRefData();
  },
  mounted() {
    this.triggerFlicker();
  },
  computed: {
attendanceMap() {
      const map = Object.create(null);
      (this.members || []).forEach(m => {
        const ops = Number(m.opsAttended);
        if (Number.isFinite(ops)) {
          if (m.id) map[`ID:${m.id}`] = ops;
          if (m.name) map[`NM:${this.nameKey(m.name)}`] = ops;
        }
      });
      (this.attendance || []).forEach(row => {
        const ops = Number(row?.ops ?? row?.attended ?? row?.value);
        if (!Number.isFinite(ops)) return;
        if (row?.id) map[`ID:${row.id}`] = ops;
        if (row?.name) map[`NM:${this.nameKey(row.name)}`] = ops;
      });
      return map;
    },
    hierarchy() {
      const groups = { broadswordCommand: null, chalkActual: null, chalks: [], support: [], other: [] };
      (this.orbat || []).forEach((sq) => {
        const n = String(sq.squad || "").trim().toLowerCase();
        if (n === "broadsword command") groups.broadswordCommand = sq;
        else if (n === "chalk actual") groups.chalkActual = sq;
        else if (["chalk 1","chalk 2","chalk 3","chalk 4"].includes(n)) groups.chalks.push(sq);
        else if (["broadsword","wyvern","wyvern air wing","caladrius","ifrit"].includes(n)) groups.support.push(sq);
        else groups.other.push(sq);
      });
      groups.chalks.sort((a,b)=>a.squad.localeCompare(b.squad, undefined, {numeric:true}));
      groups.support.sort((a,b)=>a.squad.localeCompare(b.squad));
      groups.other.sort((a,b)=>a.squad.localeCompare(b.squad));
      return groups;
    },
    activeFireteams() {
      if (!this.activeSquad) return [];
      if (this.activeSquad.fireteams && this.activeSquad.fireteams.length) {
        const sorted = this.activeSquad.fireteams.slice().map((ft) => ({
          name: this.prettyFireteamName(ft.name),
          slots: (ft.slots || []).slice(),
        }));
        const orderKey = (n) => {
          const t = String(n || "").toLowerCase();
          if (t === "fireteam 1" || t === "fireteam alpha") return 0;
          if (t === "fireteam 2" || t === "fireteam bravo") return 1;
          if (t === "fireteam 3") return 2;
          if (t === "fireteam 4") return 3;
          if (t === "element") return 90;
          return 50;
        };
        sorted.sort((a,b)=>{
          const ka = orderKey(a.name), kb = orderKey(b.name);
          if (ka !== kb) return ka - kb;
          return String(a.name).localeCompare(String(b.name), undefined, {numeric:true});
        });

        const rankOrder = [
          "MAJ","CAPT","1STLT","2NDLT",
          "CWO5","CWO4","CWO3","CWO2","WO",
          "GYSGT","SSGT","SGT","CPL","LCPL",
          "SPC4","SPC3","SPC2","SPC","PFC","PVT","RCT",
          "HMC","HM1","HM2","HM3","HN","HA","HR",
        ];
        const normalizeRank = (r) => String(r || "").trim().toUpperCase().replace(/\s+/g, "");
        const rankScore = (r) => { const rr = normalizeRank(r); const idx = rankOrder.indexOf(rr); return idx === -1 ? 999 : idx; };
        const statusScore = (s) => { const st = String(s || "").toUpperCase(); if (st === "FILLED") return 0; if (st === "VACANT") return 1; if (st === "CLOSED") return 2; return 3; };
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

        sorted.forEach((ft) => {
          ft.slots = (ft.slots || []).slice().sort((a, b) => {
            const as = statusScore(a.status), bs = statusScore(b.status);
            if (as !== bs) return as - bs;
            if (a.status !== "FILLED" || b.status !== "FILLED") return collator.compare(String(a.role || ""), String(b.role || ""));
            const ar = rankScore(a.member?.rank), br = rankScore(b.member?.rank);
            if (ar !== br) return ar - br;
            return collator.compare(String(a.member?.name || ""), String(b.member?.name || ""));
          });
        });
        return sorted.filter((ft) => ft.slots && ft.slots.length);
      }

      const map = {};
      (this.activeSquad.members || []).forEach((m) => {
        const ft = (m.fireteam || "Element").trim() || "Element";
        if (!map[ft]) map[ft] = [];
        map[ft].push({ status: "FILLED", role: m.slot || "Unassigned", member: m });
      });
      return Object.entries(map).map(([name, slots]) => ({ name, slots }));
    },
    squadLoadoutStatus() {
      if (!this.activeSquad) return { valid: true, points: 0, errors: [] };
      let points = 0; const errors = []; const explosiveTaken = new Set();
      this.activeFireteams.forEach((ft) => (ft.slots || []).forEach((slot) => {
        const member = slot.member; if (!member) return;
        const l = this.getLoadout(member);
        if (l.disposable) { points += 1; if (explosiveTaken.has("disposable")) errors.push("Duplicate explosive weapon: Disposable"); explosiveTaken.add("disposable"); }
        if (l.primary) { const def = this.loadoutOptions[l.primary]; if (def) { points += def.points; if (def.explosive) { if (explosiveTaken.has(l.primary)) errors.push(`Duplicate explosive weapon: ${def.label}`); explosiveTaken.add(l.primary); } } }
      }));
      if (points > 10) errors.push("Exceeds 10 point maximum");
      return { valid: errors.length === 0, points, errors };
    },
  },
  methods: {
    triggerFlicker(delayMs = 0) {
      this.animateView = false;
      this.animationDelay = `${delayMs}ms`;
      this.$nextTick(() => {
        requestAnimationFrame(() => { this.animateView = true; });
      });
    },

    async loadTrainerRefData() {
      try {
        this.trainersLoading = true;
        this.trainersError = "";

        const res = await fetch(this.refDataCsvUrl);
        if (!res.ok) throw new Error(`Failed to fetch RefData (HTTP ${res.status}).`);
        const csv = await res.text();
        const table = this.parseCsv(csv);

        const headerRow = table[1] || [];
        const TRAINER_COLS = this.range(21, 30); // V..AE

        const trainers = [];
        for (const c of TRAINER_COLS) {
          const title = this.cleanHeader(headerRow[c] || "");
          if (!title) continue;

          const raw = this.readDown(table, 2, c).filter(this.isRealName);
          const uniq = [];
          for (const n of raw) if (!uniq.includes(n)) uniq.push(n);

          const lead = uniq[0] || "";
          const trainersAll = uniq.slice(); // includes contact
          trainers.push({ key: `role-${c}`, title, lead, trainers: trainersAll });
        }

        this.trainers = trainers;
      } catch (e) {
        this.trainersError = String(e?.message || e);
        console.error("Trainer RefData load failed:", e);
      } finally {
        this.trainersLoading = false;
      }
    },

    async loadAttendanceRefData() {
      try {
        this.attendanceLoading = true;
        this.attendanceError = "";

        const res = await fetch(this.attendanceCsvUrl);
        if (!res.ok) throw new Error(`Failed to fetch Attendance (HTTP ${res.status}).`);
        const csv = await res.text();
        const table = this.parseCsv(csv);
        if (!table || table.length < 2) throw new Error("Attendance sheet is empty.");
        if (table.length < 3) console.warn("Attendance sheet: expected dates on Row 2, but sheet has < 3 rows.");

        const opHeader = (table[0] || []).map((h) => this.cleanHeader(h));
        const dateHeader = (table[1] || []).map((h) => this.cleanHeader(h));
        // Column A = trooper label; columns B.. = ops (latest = rightmost).
        // Dates live on Row 2 (index 1) per your sheet.
        const lastCol = Math.max(opHeader.length, dateHeader.length) - 1;

        const map = Object.create(null);

        for (let r = 2; r < table.length; r++) {
          const row = table[r] || [];
          const rawLabel = String(row[0] || "").trim();
          if (!rawLabel) continue;

          let code = "";
          let date = "";

          // Pick the most recent attendance by comparing the column's header date (Row 2).
          // This avoids relying on column order (some sheets end up reversed / ragged).
          let best = null;
          let bestTs = Number.NEGATIVE_INFINITY;
          let bestCol = -1;

          for (let c = 1; c <= lastCol; c++) {
            const headerDate = String(dateHeader[c] || opHeader[c] || "").trim();
            if (!headerDate) continue;

            const raw = String(row[c] || "");
            const v = raw.replace(/\u00A0/g, " ").trim();
            if (!v) continue;
            if (this.isAttendancePlaceholder(v)) continue;

            const ts = this.parseAttendanceDate(headerDate);
            const tsOk = Number.isFinite(ts);
            const bestOk = Number.isFinite(bestTs);

            const isBetter = tsOk
              ? (!bestOk || ts > bestTs)
              : (!bestOk && c > bestCol);

            if (!best || isBetter) {
              best = { code: v, date: headerDate };
              bestTs = tsOk ? ts : Number.NEGATIVE_INFINITY;
              bestCol = c;
            }
          }

          if (best) {
            code = best.code;
            date = best.date;
          }
          if (!code) continue;

          const rec = { code, date, label: rawLabel };

          // Index by service number if present (3+ digits)
          const idMatch = rawLabel.match(/\b(\d{3,})\b/);
          if (idMatch) {
            map[`ID:${idMatch[1]}`] = rec;
          }

          // Index by a few name keys to improve match reliability
          const keys = this.attendanceNameKeys(rawLabel);
          keys.forEach((k) => { map[`NM:${k}`] = rec; });
        }

        this.latestAttendance = map;
      } catch (e) {
        this.attendanceError = String(e?.message || e);
        console.error("Attendance load failed:", e);
      } finally {
        this.attendanceLoading = false;
      }
    },

    attendanceNameKeys(label) {
      const out = [];

      const full = this.nameKey(label);
      if (full) out.push(full);

      // Pull nickname/callsign if quoted: PFC "M. Jinter"
      const q = label.match(/"([^"]+)"/);
      if (q && q[1]) {
        const k = this.nameKey(q[1]);
        if (k) out.push(k);
      }

      // Remove leading rank token(s) and ID token(s) to get "Name" part
      const ranks = new Set([
        "RCT","PVT","PFC","SPC","SPC2","SPC3","SPC4","LCPL","CPL","SGT","SSGT","GYSGT",
        "WO","CWO2","CWO3","CWO4","CWO5","2NDLT","1STLT","CAPT","MAJ",
        "HR","HA","HN","HM3","HM2","HM1","HMC"
      ]);

      const parts = String(label || "").trim().split(/\s+/).filter(Boolean);
      while (parts.length && (ranks.has(parts[0].toUpperCase()) || /^\d{2,}$/.test(parts[0]) || /^#?\d{2,}$/.test(parts[0]))) {
        parts.shift();
      }
      if (parts.length) {
        const rest = this.nameKey(parts.join(" "));
        if (rest) out.push(rest);
      }

      return Array.from(new Set(out));
    },

    latestAttendanceFor(member) {
      if (!member) return null;

      if (member.id && this.latestAttendance[`ID:${member.id}`]) {
        return this.latestAttendance[`ID:${member.id}`];
      }

      if (member.name) {
        const nk = this.nameKey(member.name);
        if (this.latestAttendance[`NM:${nk}`]) {
          return this.latestAttendance[`NM:${nk}`];
        }
      }

      return null;
    },

    attendanceBadgeText(rec) {
      if (!rec) return "";
      const d = rec.date ? ` ${rec.date}` : "";
      return `${rec.code}${d}`;
    },
    isAttendanceCode(code) {
      const c = String(code || "").replace(/\u00A0/g, " ").trim().toUpperCase();
      return c === "AT" || c === "LOA" || c === "RES" || c === "RES." || c === "DIS" || c === "DNT" || c === "DNT.";
    },


    isAttendancePlaceholder(v) {


      const s = String(v || "").replace(/\u00A0/g, " ").trim();


      if (!s) return true;


      const u = s.toUpperCase();


      return u === "-" || u === "—" || u === "N/A" || u === "NA" || u === "NONE";


    },



    parseAttendanceDate(s) {


      const v = String(s || "").trim();


      if (!v) return NaN;



      // Prefer UK-style D/M/YYYY (e.g. 13/12/2025).


      let m = v.match(/^\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s*$/);


      if (m) {


        const dd = Number(m[1]);


        const mm = Number(m[2]);


        let yy = Number(m[3]);


        if (yy < 100) yy += 2000;


        if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) return Date.UTC(yy, mm - 1, dd);


      }



      // ISO YYYY-MM-DD


      m = v.match(/^\s*(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s*$/);


      if (m) {


        const yy = Number(m[1]);


        const mm = Number(m[2]);


        const dd = Number(m[3]);


        if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) return Date.UTC(yy, mm - 1, dd);


      }



      return NaN;


    },




    attendanceClass(code) {
      const c = String(code || "").trim().toUpperCase();
      if (c === "AT") return "att-at";
      if (c === "LOA") return "att-loa";
      if (c === "RES" || c === "RES.") return "att-res";
      if (c === "DIS") return "att-dis";
      if (c === "DNT") return "att-dnt";
      return "att-unk";
    },


    range(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; },
    readDown(table, startRow, col) {
      const out = [];
      for (let r = startRow; r < table.length; r++) {
        const v = this.cleanName(table[r]?.[col] || "");
        if (!v) break;
        out.push(v);
      }
      return out;
    },
    cleanHeader(s) { return String(s).replace(/^"+|"+$/g, "").replace(/\s+/g, " ").trim(); },
    cleanName(s) { return String(s).replace(/\s+/g, " ").trim(); },
    prettyFireteamName(name) {
      const t = String(name || "").replace(/\u00A0/g, " ").trim();
      const l = t.toLowerCase();
      if (l === "fireteam 1") return "Fireteam Alpha";
      if (l === "fireteam 2") return "Fireteam Bravo";
      return t || "Element";
    },

    isRealName(s) { const v = String(s || "").trim(); return v && v.toLowerCase() !== "vacant"; },

    parseCsv(text) {
      const rows = [];
      let cur = [];
      let val = "";
      let inQ = false;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQ) {
          if (ch === '"') {
            if (text[i + 1] === '"') { val += '"'; i += 1; }
            else inQ = false;
          } else { val += ch; }
        } else {
          if (ch === '"') inQ = true;
          else if (ch === ",") { cur.push(val); val = ""; }
          else if (ch === "\n") { cur.push(val); rows.push(cur); cur = []; val = ""; }
          else if (ch !== "\r") { val += ch; }
        }
      }

      cur.push(val);
      rows.push(cur);
      if (rows.length && rows[rows.length - 1].every((x) => String(x).length === 0)) rows.pop();
      return rows;
    },

    nameKey(name) {
      return String(name || "")
        .replace(/["'.]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
    },
    getOps(member) {
      if (member?.id && this.attendanceMap[`ID:${member.id}`] !== undefined) {
        return this.attendanceMap[`ID:${member.id}`];
      }
      if (member?.name) {
        const nk = this.nameKey(member.name);
        if (this.attendanceMap[`NM:${nk}`] !== undefined) {
          return this.attendanceMap[`NM:${nk}`];
        }
      }
      const direct = Number(member?.opsAttended);
      return Number.isFinite(direct) ? direct : null;
    },

    rankKey(rank) { return String(rank || "").trim().toUpperCase().replace(/[.\s]/g, ""); },
    nextPromotion(member) {
      const key = this.rankKey(member?.rank);
      const alias = {
        PRIVATE: "PVT", PRIVATEFIRSTCLASS: "PFC", SPECIALIST: "SPC",
        SPECIALIST2: "SPC2", SPECIALIST3: "SPC3", SPECIALIST4: "SPC4",
        LANCECORPORAL: "LCPL", CORPORAL: "CPL", SERGEANT: "SGT",
        STAFFSERGEANT: "SSGT", GUNNYSERGEANT: "GYSGT",
        SECONDLIEUTENANT: "2NDLT", FIRSTLIEUTENANT: "1STLT", CAPTAIN: "CAPT",
        HOSPITALMANAPPRENTICE: "HA", HOSPITALMAN: "HN",
        HOSPITALCORPSMANTHIRDCLASS: "HM3",
        HOSPITALCORPSMANSECONDCLASS: "HM2",
        HOSPITALCORPSMANFIRSTCLASS: "HM1",
        CHIEFHOSPITALCORPSMAN: "HMC",
        WARRANTOFFICER: "WO",
        CHIEFWARRANTOFFICER2: "CWO2", CHIEFWARRANTOFFICER3: "CWO3",
        CHIEFWARRANTOFFICER4: "CWO4", CHIEFWARRANTOFFICER5: "CWO5",
      };
      const rk = alias[key] || key;

      const rules = {
        PVT:  { nextRank: "PFC",  nextAt: 10,  misc: null },
        PFC:  { nextRank: "SPC",  nextAt: 20, misc: null },
        SPC:  { nextRank: "SPC2", nextAt: 30, misc: null },
        SPC2: { nextRank: "SPC3", nextAt: 40, misc: null },
        SPC3: { nextRank: "SPC4", nextAt: 50, misc: "Multiple Specialist Certs; Trainer / S-Shop personnel" },
        SPC4: { nextRank: "LCpl", nextAt: null, misc: "Junior NCO, RTO; NCOs in training / New FTLs" },
        LCPL: { nextRank: "Cpl",  nextAt: null, misc: "Junior NCO, RTO; Active FTLs & FTL experience" },
        CPL:  { nextRank: "Sgt",  nextAt: null, misc: "Senior NCO, RTO; Active SLs only" },
        SGT:  { nextRank: "SSgt", nextAt: null, misc: "Senior NCO, RTO; Active SLs only & SL experience / Platoon NCOIC" },
        SSGT: { nextRank: "GySgt",nextAt: null, misc: "Senior NCO, RTO; Active Platoon NCOIC & experience" },
        GYSGT:{ nextRank: "2ndLt",nextAt: null, misc: "Support staff / Platoon lead" },

        "2NDLT": { nextRank: "1stLt", nextAt: null, misc: null },
        "1STLT": { nextRank: "Capt",  nextAt: null, misc: null },
        CAPT:    { nextRank: null,    nextAt: null, misc: null },

        HA:  { nextRank: "HN",  nextAt: 10,  misc: null },
        HN:  { nextRank: "HM3", nextAt: 20, misc: null },
        HM3: { nextRank: "HM2", nextAt: 30, misc: null },
        HM2: { nextRank: "HM1", nextAt: null, misc: null },
        HM1: { nextRank: "HMC", nextAt: null, misc: "Assigned to Corpsman slot & Medic Trainer" },
        HMC: { nextRank: null,  nextAt: null, misc: null },

        WO:   { nextRank: "CWO2", nextAt: 10, misc: null },
        CWO2: { nextRank: "CWO3", nextAt: 20, misc: null },
        CWO3: { nextRank: "CWO4", nextAt: 30, misc: null },
        CWO4: { nextRank: "CWO5", nextAt: null, misc: null },
        CWO5: { nextRank: null,   nextAt: null, misc: "Flight Lead" },
      };
      return rules[rk] || { nextRank: null, nextAt: null, misc: null };
    },
    opsToNextPromotion(member) {
      const ops = this.getOps(member);
      const rule = this.nextPromotion(member);
      if (!Number.isFinite(ops)) return null;
      if (!Number.isFinite(rule.nextAt)) return null;
      return Math.max(0, rule.nextAt - ops);
    },

    isMedicalRank(rankOrRole) {
      const r = String(rankOrRole || "").toUpperCase();
      return ["HR","HA","HN","HM3","HM2","HM1","HMC"].includes(r);
    },
    isCorpsmanRole(role) {
      const s = String(role || "").toUpperCase();
      return /CORPSMAN|MEDIC|PJ/.test(s);
    },

    playOrbatClick() {
      const a = this.$refs.orbatClickAudio;
      if (!a || typeof a.play !== "function") return;
      try { a.currentTime = 0; a.play().catch(() => {}); } catch {}
    },
    openSquad(sq) { this.playOrbatClick(); this.activeSquad = sq; },
    closeSquad() { this.activeSquad = null; },

    personnelCount(sq) {
      if (sq.fireteams && sq.fireteams.length) {
        let count = 0;
        sq.fireteams.forEach((ft) => (ft.slots || []).forEach((s) => { if (s.status === "FILLED" && s.member) count++; }));
        return count;
      }
      return (sq.members || []).length;
    },
    slotKey(slot, idx) { return slot.member?.id || `${slot.status}-${slot.role}-${idx}`; },

    squadInitials(name) {
      if (!name) return "UNSC";
      const parts = String(name).trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
      return parts.map((p, i) => (i === parts.length - 1 && /\d+/.test(p) ? p : p[0]))
                  .join("").toUpperCase();
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
      return certs[idx] === "Y" || certs[idx] === true || certs[idx] === "1";
    },
    getLoadout(member) {
      const id = member?.id;
      if (!id) return { primary: "", disposable: false };
      if (!this.loadouts[id]) this.loadouts[id] = { primary: "", disposable: false };
      return this.loadouts[id];
    },
    toggleDisposable(member) {
      const id = member?.id; if (!id) return;
      const curr = this.getLoadout(member);
      this.loadouts[id] = { ...curr, disposable: !curr.disposable };
    },
    setPrimary(member, value) {
      const id = member?.id; if (!id) return;
      const curr = this.getLoadout(member);
      this.loadouts[id] = { ...curr, primary: value || "" };
    },
    loadoutLabel(key) { const def = this.loadoutOptions[key]; return def ? `${def.label} (${def.points}pt)` : key; },
    availableLoadouts(member) {
      const has = (label) => this.hasCert(member, this.certLabels.indexOf(label));
      const opts = [];
      if (has("Grenadier")) opts.push("grenadier");
      if (has("Anti Tank")) opts.push("antitank");
      if (has("Machine Gunner")) { opts.push("m247", "m247_50"); }
      if (has("Combat Engineer")) opts.push("engineer");
      if (has("Marksman")) opts.push("marksman");
      return opts;
    },

    rankCode(rank) {
      if (!rank) return null;
      const key = rank.trim().toUpperCase();
      const map = {
        RCT: "Rct", PVT: "Pvt", PFC: "PFC", SPC: "Spc", SPC2: "Spc2", SPC3: "Spc3", SPC4: "Spc4",
        LCPL: "LCpl", CPL: "Cpl", SGT: "Sgt", SSGT: "SSgt", GYSGT: "GySgt",
        WO: "WO", CWO2: "CWO2", CWO3: "CWO3", CWO4: "CWO4", CWO5: "CWO5",
        "2NDLT": "2ndLt", "1STLT": "1stLt", CAPT: "Capt", MAJ: "Maj",
        HR: "HR", HA: "HA", HN: "HN", HM3: "HM3", HM2: "HM2", HM1: "HM1", HMC: "HMC",
      };
      return map[key] || null;
    },
    rankInsignia(rank) { const base = this.rankCode(rank); return base ? `/ranks/${base}.png` : null; },

    formatOps(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : "—";
    },
  },
};
</script>

<style scoped>
/* ===== Unified UNSC Terminal Look ===== */

.roster-shell{
  display:grid;
  grid-template-columns: 1.7fr 0.8fr;
  gap: 1.2rem;
  height: calc(100vh - 128px);
  padding: 60px 18px 18px;
  overflow: hidden;
}

@media (max-width: 1200px){
  .roster-shell{
    grid-template-columns:1fr;
    height:auto;
    overflow:visible;
    padding: 18px 12px;
  }
}

/* Terminal window */
.term-window{
  border-radius: 16px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.92), rgba(3, 6, 10, 0.95));
  overflow:hidden;
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 26px rgba(120, 180, 255, 0.10),
    0 0 110px rgba(0, 0, 0, 0.6);
  color: rgba(190, 230, 255, 0.92);
  text-transform: uppercase;
  letter-spacing: 0.08em;

  display:flex;
  flex-direction:column;
  min-height: 0;
}

.term-hdr{
  display:flex;
  align-items:center;
  gap:10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
}
.dot{
  width:10px;height:10px;border-radius:50%;
  background: rgba(170, 220, 255, 0.22);
  box-shadow: 0 0 8px rgba(120, 180, 255, 0.12);
}
.term-title{
  font-size: 12px;
  opacity: 0.9;
  white-space: nowrap;
  overflow:hidden;
  text-overflow: ellipsis;
}

.term-body{
  position:relative;
  flex:1 1 auto;
  min-height:0;
}
.content-scroll{
  position:relative;
  z-index:2;
  height: 100%;
  overflow:auto;
  padding: 18px 18px 18px;
}

/* Background FX */
.scanlines{
  position:absolute; inset:0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.02) 1px,
    rgba(0, 0, 0, 0) 3px,
    rgba(0, 0, 0, 0) 6px
  );
  mix-blend-mode: overlay;
  opacity: 0.35;
  pointer-events:none;
}
.flicker{
  position:absolute; inset:-20%;
  background: radial-gradient(circle at 30% 20%, rgba(120, 180, 255, 0.07), transparent 55%);
  animation: flicker 2.6s infinite;
  pointer-events:none;
  opacity: 0.9;
}
@keyframes flicker{
  0%, 100% { transform: translate3d(0,0,0); opacity: .75; }
  10% { transform: translate3d(-1px, 1px, 0); opacity: .85; }
  20% { transform: translate3d(1px, -1px, 0); opacity: .70; }
  35% { transform: translate3d(0px, 2px, 0); opacity: .90; }
  60% { transform: translate3d(2px, 0px, 0); opacity: .78; }
}

.logo-ghost{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  pointer-events:none;
  opacity:0.09;
  filter: drop-shadow(0 0 24px rgba(0,0,0,.9));
}
.logo-ghost img{ width:min(520px, 74vw); height:auto; }

/* Minor text helpers */
.muted{ color:#9ec5e6; text-transform:none; letter-spacing:0; }
.error{ color:#ff9f9f; text-transform:none; letter-spacing:0; }

/* ===== Keep your existing ORBAT layouts, but nudge into terminal palette ===== */
.orbat-wrapper{ width:100%; margin-top: 0.25rem; padding-bottom: 2.5rem; }
.hierarchy-container{ width:100%; margin-top: 1.2rem; }
.orbat-row{ margin-bottom: 2.2rem; }
.center-row{ display:flex; justify-content:center; }
.squad-row.single{ display:flex; justify-content:center; }
.squad-row.three{ display:grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 1.35rem; }
@media (max-width: 1400px){ .squad-row.three{ grid-template-columns: repeat(2, minmax(260px, 1fr)); } }
@media (max-width: 900px){ .squad-row.three{ grid-template-columns: 1fr; } }

/* Connector lines */
@media (min-width: 900px){
  .actual-row{ position:relative; }
  .actual-row::after{
    content:"";
    position:absolute;
    bottom:-22px;
    left:50%;
    transform: translateX(-50%);
    width:3px;
    height:22px;
    background: rgba(170, 220, 255, 0.40);
    border-radius: 2px;
    pointer-events:none;
  }
  .chalk-row{ position:relative; margin-top: 2rem; padding-top: 1.2rem; }
  .chalk-row::before{
    content:"";
    position:absolute;
    top:0;
    left:8%;
    right:8%;
    height:3px;
    background: rgba(170, 220, 255, 0.35);
    border-radius:2px;
  }
}

/* Squad tiles */
.squad-card{
  background:
    radial-gradient(circle at top left, rgba(120, 180, 255, 0.14), transparent 62%),
    rgba(0, 0, 0, 0.38);
  border: 1px solid rgba(170, 220, 255, 0.26);
  border-radius: 14px;
  padding-right: 1rem;
  cursor:pointer;
  min-height: 180px;
  transition: transform 120ms ease, border-color 140ms ease, opacity 140ms ease;
  box-shadow: 0 0 0 1px rgba(170, 220, 255, 0.06) inset, 0 0 26px rgba(0,0,0,0.35);
}
.squad-card:hover{ border-color: rgba(170, 220, 255, 0.90); transform: translateY(-1px); }

.squad-header{ display:grid; grid-template-columns: auto 1fr; align-items:center; padding: 1.1rem 1.2rem; gap: 1rem; }
.squad-insignia{
  width:72px;height:72px;
  border-radius: 12px;
  border: 1px solid rgba(170, 220, 255, 0.35);
  display:flex; align-items:center; justify-content:center;
  font-size: 1.35rem;
  font-weight: 800;
  color: rgba(190, 230, 255, 0.92);
  background: rgba(0,0,0,0.35);
}
.squad-meta h2{ margin:0; font-size: 1.5rem; color: #e6f3ff; letter-spacing: .08em; }
.squad-subtitle{ margin:.25rem 0 0; font-size:.9rem; color:#9ec5e6; }
.squad-count{ margin:.35rem 0 0; font-size:.85rem; color:#7aa7c7; }

/* Trainers panel */
.panel{
  border: 1px dashed rgba(170,220,255,0.20);
  background: rgba(0, 0, 0, 0.28);
  border-radius: 14px;
  padding: 12px;
}
.cards-grid{ display:grid; gap: .7rem; }
.trainers-grid{ grid-template-columns: 1fr; }
@media (min-width: 1400px){ .trainers-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1750px){ .trainers-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.t-card{
  border: 1px solid rgba(170, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.26);
  border-radius: 14px;
  padding: 10px 12px;
  display:grid;
  gap: .5rem;
}
.title{
  margin:0;
  color:#d9ebff;
  font-size: 0.95rem;
  letter-spacing: .14em;
  overflow:hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plain-title{ background:none !important; clip-path:none !important; padding:0 !important; border:0 !important; }
.lead{ color:#9ec5e6; font-size:.9rem; }
.label{ color:#9ec5e6; font-size:.85rem; }
.highlight{ color:#79ffba; }
.divider{
  height:1px;
  background: linear-gradient(90deg, rgba(170,220,255,0.22), rgba(170,220,255,0.08) 60%, transparent);
}
.vlist{ list-style:none; margin:0; padding:0; display:grid; gap:.22rem; }
.vlist li{
  display:inline-block;
  width: fit-content;
  max-width: 100%;
  color:#e6f3ff;
  background: rgba(0,0,0,0.18);
  border: 1px solid rgba(170,220,255,0.14);
  border-radius: 10px;
  padding: .22rem .5rem;
  text-transform:none;
  letter-spacing:0;
}


/* --- Trainers layout overrides (keep theme, lock alignment) --- */
.cards-grid.trainers-grid{
  /* ensure strict grid (no masonry/columns) */
  display: grid !important;
  grid-auto-flow: row;
  align-items: stretch;
  align-content: start;
  column-count: initial !important;
  column-gap: normal !important;
}

/* Keep each tile as a simple vertical stack */
.cards-grid.trainers-grid .t-card{
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  min-width: 0;
}

/* Title: allow wrap to 2 lines (prevents clipping) */
.cards-grid.trainers-grid .t-card .card-head{
  flex: 0 0 auto;
  min-height: 44px;
  display:flex;
  align-items:center;
  min-width:0;
}
.cards-grid.trainers-grid .t-card .title{
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* BODY: fixed CONTACT block, then divider, then trainers block.
   This guarantees CONTACT/TRAINERS alignment across tiles in the same row. */
.cards-grid.trainers-grid .t-card .body{
  flex: 1 1 auto;
  min-height: 0;
  display: grid !important;
  grid-template-rows: 60px 1px auto;
  gap: .5rem;
  align-content: start;
}

/* CONTACT block fixed height so TRAINERS header aligns */
.cards-grid.trainers-grid .t-card .lead{
  height: 60px !important;
  min-width: 0;
  display: grid !important;
  grid-template-rows: auto 1fr;
  gap: .18rem;
}
.cards-grid.trainers-grid .t-card .lead .label{ white-space: nowrap; }
.cards-grid.trainers-grid .t-card .lead .highlight{
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
}

/* Divider should never add extra vertical wobble */
.cards-grid.trainers-grid .t-card .divider{
  height: 1px;
  margin: 0 !important;
}

/* Trainers header + list; list grows tile height naturally */
.cards-grid.trainers-grid .t-card .trainers-block{
  display: grid !important;
  grid-template-rows: auto auto;
  gap: .35rem;
  min-width: 0;
}

/* Pills wrap safely */
.cards-grid.trainers-grid .t-card .vlist li{
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
/* ===== Modal restyle to match terminal ===== */
.squad-overlay{
  position: fixed;
  inset:0;
  background: rgba(0,0,0,0.78);
  z-index: 9999;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 14px;
}
.squad-modal{
  width: min(1860px, 96vw);
  max-height: 92vh;
  border-radius: 16px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.95), rgba(3, 6, 10, 0.96));
  overflow:hidden;
  box-shadow: 0 0 0 1px rgba(170, 220, 255, 0.06) inset, 0 0 80px rgba(0,0,0,0.7);
  display:flex;
  flex-direction:column;
}
.modal-hdr{ gap: 10px; }
.squad-close{
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(170,220,255,0.26);
  color: rgba(190,230,255,0.92);
  border-radius: 999px;
  padding: 6px 10px;
  cursor:pointer;
}
.squad-close:hover{ border-color: rgba(170,220,255,0.85); }

.modal-body{ padding: 14px 16px 16px; }
.squad-modal-meta{
  display:flex;
  justify-content: space-between;
  align-items:center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(170,220,255,0.16);
}
.squad-title h2{ margin:0; color:#e6f3ff; letter-spacing:.12em; }
.subtitle{ margin:.2rem 0 0; color:#9ec5e6; font-size:.9rem; }
.squad-tag{
  width: 64px; height: 64px;
  border-radius: 14px;
  border: 1px solid rgba(170,220,255,0.22);
  background: rgba(0,0,0,0.28);
  display:grid; place-items:center;
  font-weight: 900;
}

.squad-modal-scroll{
  margin-top: 12px;
  overflow:auto;
  padding-right: .4rem;
  max-height: calc(92vh - 210px);
}

.fireteam-header{
  position: sticky;
  top: 0;
  display:flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 10px;
  background: rgba(0,0,0,0.38);
  border-top: 1px solid rgba(170,220,255,0.16);
  border-bottom: 1px solid rgba(170,220,255,0.10);
  backdrop-filter: blur(4px);
  z-index: 2;
}
.fireteam-title{ color:#e6f3ff; letter-spacing:.14em; font-weight: 800; }
.fireteam-count{ color:#9ec5e6; font-size:.9rem; }
.fireteam-divider{ height:1px; background: rgba(170,220,255,0.14); margin: 12px 0 16px; }

/* Cards grid (keep your responsiveness) */
.squad-members-grid{ display:grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .95rem; }
@media (max-width: 1680px){ .squad-members-grid{ grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 1350px){ .squad-members-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 980px){ .squad-members-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 620px){ .squad-members-grid{ grid-template-columns: 1fr; } }

.member-card{
  background: rgba(0,0,0,0.34);
  border: 1px solid rgba(170,220,255,0.18);
  border-left: 4px solid rgba(170,220,255,0.40);
  border-radius: 14px;
  padding: 12px 12px;
  box-shadow: 0 0 0 1px rgba(170,220,255,0.05) inset, 0 0 22px rgba(0,0,0,0.35);
  display:flex;
  flex-direction:column;
}
.member-card.vacant, .member-card.closed{
  border-left-color: rgba(170,220,255,0.18);
}
.member-card.vacant{
  background:
    repeating-linear-gradient(45deg, rgba(170,220,255,0.05) 0, rgba(170,220,255,0.05) 10px, transparent 10px, transparent 20px),
    rgba(0,0,0,0.28);
}
.member-card.closed{
  filter: grayscale(85%);
  opacity: 0.65;
  background:
    repeating-linear-gradient(45deg, rgba(220,220,220,0.05) 0, rgba(220,220,220,0.05) 8px, transparent 8px, transparent 16px),
    rgba(0,0,0,0.22);
}

.member-header{ display:grid; grid-template-columns:auto 1fr; align-items:center; gap: .75rem; }
.member-header h3{ margin:0; font-size: 1.02rem; color:#e6f3ff; word-break: break-word; }
.rank-line{ margin:.15rem 0 0; font-size:.85rem; color:#9ec5e6; display:flex; gap:.6rem; flex-wrap: wrap; }
.member-rank-insignia-wrapper{ width: 42px; height: 42px; display:grid; place-items:center; }
.member-rank-insignia{ max-width: 42px; max-height: 42px; object-fit: contain; }

.member-body{ display:grid; grid-template-columns: 1fr 1fr; gap: .85rem; margin-top: .6rem; font-size:.9rem; }
.member-column p{ margin: .18rem 0; }

/* Readability: prevent dark/black strong text in modal */
.member-column strong{ color:#e6f3ff; }
.member-column.right p{ color: rgba(230,243,255,.92); }

.detail-line strong{ color:#9ec5e6; }
.role-accent{ color:#79ffba; font-weight: 700; }
.role-corpsman{ color:#ff6b6b; font-weight: 800; }
.date-accent{ color:#79ffba; }
.accent{ color:#a3e7ff; }
.accent-strong{ color:#7fffd4; font-weight: 800; }

.join-date{ white-space: nowrap; }
.next-rank-line{ white-space: nowrap; }

.ops-promo{
  margin-top: .45rem;
  padding: .45rem .55rem;
  border: 1px dashed rgba(170,220,255,0.18);
  border-radius: 12px;
  background: rgba(0,0,0,0.22);
}
.ops-promo.imminent{
  border-color: rgba(120,255,170,0.45);
  background: rgba(0,50,20,0.22);
  color: rgba(120,255,170,0.95);
  box-shadow: 0 0 10px rgba(120,255,170,0.10) inset;
}

.primary-label{ display:block; margin-bottom: .15rem; font-size:.85rem; color:#9ec5e6; }
.loadout-select{
  width:100%;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(170,220,255,0.18);
  color: rgba(190,230,255,0.92);
  border-radius: 12px;
  padding: .35rem .45rem;
}

.cert-list{ display:grid; grid-template-columns: 20px 1fr; row-gap: .28rem; }
.cert-row{ display: contents; }
.cert-checkbox{
  width: 16px; height: 16px;
  border: 1px solid rgba(170,220,255,0.26);
  border-radius: 4px;
  display:inline-flex; align-items:center; justify-content:center;
}
.cert-checkbox.checked{
  border-color: rgba(120,255,170,0.55);
  box-shadow: 0 0 6px rgba(120,255,170,0.16) inset;
}
.checkbox-dot{ width:10px;height:10px;background: rgba(120,255,170,0.95); border-radius: 2px; }
.cert-label{ color: rgba(190,230,255,0.92); text-transform:none; letter-spacing:0; }
.cert-none{ font-size:.85rem; opacity:.75; }

.member-footer{
  margin-top: .6rem;
  font-size: .75rem;
  color:#7aa7c7;
  display:flex;
  justify-content: space-between;
}

/* Flicker entry animation (only within the left terminal body) */
.term-body.animate{
  animation: contentEntry 260ms ease-out both;
}
@keyframes contentEntry{
  0%   { opacity: 0; filter: brightness(1.15) saturate(1.05) blur(1px); }
  60%  { opacity: 1; filter: brightness(1.0)  saturate(1.0)  blur(0); }
  80%  { opacity: .98; filter: brightness(1.03); }
  100% { opacity: 1; filter: none; }
}

/* Safety belt */
:deep(.squad-modal img){ max-width: 100%; height:auto; }

/* Attendance badge */
.att-line{
  margin: .2rem 0 0;
  font-size: .78rem;
  color:#9ec5e6;
  display:flex;
  gap:.45rem;
  align-items:center;
  flex-wrap:wrap;
  text-transform: uppercase;
  letter-spacing: .12em;
}
.att-label{ opacity:.85; }
.att-badge{
  display:inline-flex;
  align-items:center;
  padding: .18rem .5rem;
  border-radius: 999px;
  border: 1px solid rgba(170,220,255,0.18);
  background: rgba(0,0,0,0.22);
  color: #e6f3ff;
  letter-spacing: .10em;
}
.att-badge.att-at{ border-color: rgba(120,255,190,0.35); color: rgba(120,255,190,0.92); }
.att-badge.att-loa{ border-color: rgba(163,231,255,0.35); color: rgba(163,231,255,0.95); }
.att-badge.att-res{ border-color: rgba(170,220,255,0.28); color: rgba(190,230,255,0.82); opacity: .9; }
.att-badge.att-dis{ border-color: rgba(255,160,128,0.35); color: rgba(255,180,150,0.92); }
.att-badge.att-dnt{ border-color: rgba(255,107,107,0.40); color: rgba(255,140,140,0.95); }


/* Match login terminal header (icon shell + title) */
#rosterView .term-hdr .term-title{
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(190, 230, 255, 0.92);
  opacity: 1;
}

</style>
