<!-- File: src/views/DeploymentView.vue -->
<template>
  <div id="deploymentView" class="content-container">
    <section class="section-container deployment-window">
      <div class="header-shell">
        <div class="term-hdr view-hdr">
          <span class="hdr-icon" aria-hidden="true" :style="{ backgroundImage: `url('/icons/deployable.svg')` }"></span>
          <div class="term-title">DEPLOYMENT — {{ currentUnit?.title || 'Chalk' }}</div>
        </div>
        <div class="rhombus-back">&nbsp;</div>
      </div>

      <div class="section-content-container deploy-scroll" :class="{ animate: animateView }" :style="{ 'animation-delay': animationDelay }">
        <div class="panel">
          <!-- Top actions: prominent Overview -->
          <div class="top-actions">
            <button type="button" class="btn primary large" :disabled="!apiBase" @click="openOverview">
              Overview
            </button>
          </div>

          <!-- Toolbar -->
          <div class="detail-toolbar">
            <div class="toolbar-left">
              <label class="muted small">Chalk</label>
              <select class="select chalk-picker" v-model="detailKey">
                <option v-for="u in chalkUnits" :key="u.key" :value="u.key">{{ u.title }}</option>
              </select>              <button class="btn ghost small" @click="clearGroup(detailKey)">Clear</button>
            </div>

            <div class="toolbar-right">
              <span class="muted small">{{ filledCount(currentUnit) }} / {{ currentUnit?.slots.length || 0 }} assigned</span>
              <span class="divider" />
              <span v-if="currentUnit" class="pts big" :class="{ over: pointsUsed > SQUAD_POINT_CAP }">
                Points: {{ pointsUsed }} / {{ SQUAD_POINT_CAP }}
                <span v-if="pointsUsed > SQUAD_POINT_CAP" class="warn-inline">⚠ OVER CAP</span>
              </span>
              <span class="divider" />
              <span class="muted small">{{ authModeLabel }}</span>
            </div>
          </div>

          <!-- Exec URL warning -->
          <div v-if="!apiBase" class="warn">
            Apps Script /exec URL missing. Use your Netlify proxy to avoid CORS:
            <ul style="margin:.3rem 0 .1rem .9rem">
              <li><code>&lt;DeploymentView :execUrl="'/.netlify/functions/gas'" /&gt;</code></li>
              <li><code>window.DEPLOYMENT_EXEC_URL = "/.netlify/functions/gas"</code></li>
              <li><code>localStorage.setItem('deploymentExecUrl','/.netlify/functions/gas')</code></li>
              <li class="muted">Legacy: meta <code>apps-script-exec</code>, <code>window.APP_EXEC_URL</code>, <code>localStorage.execUrl</code></li>
            </ul>
          </div>

          <div v-if="debugInfo" class="muted small" style="opacity:.8">Status: {{ debugInfo }}</div>
          <div v-if="apiError" class="warn">{{ apiError }}</div>
          <div v-if="!currentUnit" class="muted">No chalk selected.</div>

          <!-- Cards grid -->
          <div v-else class="group-card">
            <div v-if="detailError" class="warn">{{ detailError }}</div>

            <div class="squad-modal-meta" :class="{ invalid: pointsUsed > SQUAD_POINT_CAP }">
              <div class="squad-title">
                <h2 style="margin:0">{{ currentUnit.title }}</h2>
                <p class="subtitle">{{ filledCount(currentUnit) }} / {{ currentUnit.slots.length }} PERSONNEL</p>
                <div class="loadout-status">
                  <span class="points">LOADOUT: {{ pointsUsed }}/{{ SQUAD_POINT_CAP }} PTS</span>
                  <span v-if="pointsUsed > SQUAD_POINT_CAP" class="warn">⚠ EXCEEDS CAP</span>
                  <span v-else class="ok">✓ VALID</span>
                </div>
              </div>
              <div class="squad-tag"><span>{{ squadInitials(currentUnit.title) }}</span></div>
            </div>

            <div class="squad-members-grid">
              <template v-for="(slot, sIdx) in currentUnit.slots" :key="`wrap-${detailKey}-${sIdx}`">
              <div v-if="isFireteamHeader(slot, sIdx, currentUnit.slots)" class="fireteam-row">
                <span class="fireteam-title">{{ fireteamLabel(slot) }}</span>
              </div>
              <div
                class="member-card"
                :class="{ vacant: slot.origStatus === 'VACANT' && !slot.id, closed: slot.origStatus === 'CLOSED' }"
              >
                <!-- VACANT / CLOSED -->
                <template v-if="slot.origStatus === 'VACANT' && !slot.id || slot.origStatus === 'CLOSED'">
                  <div class="member-header">
                    <div class="member-header-text">
                      <h3>{{ (slot.origStatus || 'VACANT').toUpperCase() }}</h3>
                      <p class="rank-line">
                        <span class="rank">{{ slot.role || 'Slot' }}</span>
                        <span class="id">UNFILLED SLOT</span>
                      </p>
                    </div>
                    <div style="display:flex; gap:.35rem; margin-left:auto;">
                      <button
                        type="button"
                        class="btn ghost xsmall"
                        :disabled="slot.origStatus === 'CLOSED'"
                        @click.stop="openPicker(detailKey, sIdx)"
                      >
                        {{ slot.origStatus === 'CLOSED' ? 'Closed' : 'Assign' }}
                      </button>
                      <button type="button" class="btn ghost xsmall" @click.stop="removeSlot(detailKey, sIdx)">–</button>
                    </div>
                  </div>

                  <div class="member-body">
                    <div class="member-column left">
                      <p class="detail-line">
                        <strong>Role:</strong>
                        <span class="role-accent">{{ slot.role || 'Slot' }}</span>
                      </p>
                    </div>
                    <div class="member-column right">
                      <p><strong>Certifications:</strong></p>
                      <span class="cert-none">N/A</span>
                    </div>
                  </div>

                  <div class="member-footer">
                    <span>SLOT STATUS: {{ slot.origStatus || 'VACANT' }}</span>
                    <span>UNSC SYSTEMS DATABASE</span>
                  </div>
                </template>

                <!-- FILLED -->
                <template v-else>
                  <div class="member-header">
                    <div class="member-header-text">
                      <div class="name-line">
                        <img
                          v-if="rankFor(slot.id)"
                          class="rank-icon"
                          :src="rankIcon(rankFor(slot.id))"
                          :alt="rankFor(slot.id)"
                          :title="rankFor(slot.id)"
                          @error="onRankImgError($event)"
                        />
                        <h3>{{ displayNameWithRank(slot.name || 'UNKNOWN', rankFor(slot.id)).toUpperCase() }}</h3>
                      </div>
                      <p class="rank-line">
                        <span class="rank">{{ slot.role || 'N/A' }}</span>
                        <span class="id">ID: {{ slot.id || 'N/A' }}</span>
                      </p>
                    </div>
                    <div style="display:flex; gap:.35rem; margin-left:auto;">
                      <button v-if="slot.id" type="button" class="btn ghost xsmall" @click.stop="clearSlot(detailKey, sIdx)">Clear</button>
                      <button type="button" class="btn ghost xsmall" @click.stop="removeSlot(detailKey, sIdx)">–</button>
                    </div>
                  </div>

                  <div class="member-body">
                    <div class="member-column left">
                      <p class="detail-line">
                        <strong>Role:</strong>
                        <span class="role-accent">{{ slot.role || 'Unassigned' }}</span>
                      </p>

                      <div class="loadout-row">
                        <label class="disposable">
                          <input
                            type="checkbox"
                            :checked="!!slot.disposable"
                            @change="onToggleDisposable(detailKey, sIdx, $event.target.checked)"
                          />
                          Disposable Rocket ({{ DISPOSABLE_COST }}pt)
                        </label>
                      </div>

                      <div class="loadout-row">
                        <label class="primary-label">Assigned Certification</label>
                        <select
                          class="loadout-select"
                          :value="slot.cert || ''"
                          @change="onChangeCert(detailKey, sIdx, $event.target.value)"
                        >
                          <option value="">None / Standard</option>
                          <option v-for="c in getAssignableCertsForPersonId(slot.id)" :key="c" :value="c">
                            {{ c }}{{ certPointSuffix(c) }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div class="member-column right">
                      <p><strong>Certifications:</strong></p>
                      <div class="cert-list">
                        <div v-for="(label, cidx) in certLabels" :key="label" class="cert-row">
                          <span class="cert-checkbox" :class="{ checked: (slot.cert || '') === label || hasCertId(slot.id, cidx) }">
                            <span v-if="(slot.cert || '') === label || hasCertId(slot.id, cidx)" class="checkbox-dot"></span>
                          </span>
                          <span class="cert-label">{{ label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="member-footer">
                    <button
                      type="button"
                      class="btn primary small"
                      :disabled="slot.origStatus === 'CLOSED'"
                      @click.stop="openPicker(detailKey, sIdx)"
                    >
                      {{ slot.id ? 'Swap' : (slot.origStatus === 'CLOSED' ? 'Closed' : 'Assign') }}
                    </button>
                    <span>UNSC SYSTEMS DATABASE</span>
                  </div>
                </template>
              </div>
            </template>
            </div>

            <div class="actions-row">
              <button type="button" class="btn ghost" @click.stop="addSlot(detailKey, '1')">Add Alpha slot</button>
              <button type="button" class="btn ghost" @click.stop="addSlot(detailKey, '2')">Add Bravo slot</button>

              <span class="divider" />
              <button
                type="button"
                class="btn primary"
                :disabled="busy || !apiBase"
                @click="saveRemote(detailKey)"
              >
                {{ busy ? 'Saving…' : 'Save Chalk (Remote)' }}
              </button>
              <button type="button" class="btn" :disabled="busy || !apiBase" @click="loadRemote(detailKey)">
                Load Chalk (Remote)
              </button>
              <span v-if="remoteMeta[detailKey]?.savedBy" class="muted small">Last saved by {{ remoteMeta[detailKey].savedBy }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Assign/Swap Picker (compact) -->
    <div v-if="picker.open" class="squad-overlay" @click.self="closePicker">
      <div class="squad-modal compact">
        <div class="compact-header">
          <h3>Assign to {{ currentSlotTitle }}</h3>
          <button class="squad-close" @click="closePicker">✕</button>
        </div>

        <div class="picker-toolbar">
          <input v-model="picker.query" placeholder="Search by name / callsign / role" class="search" @keydown.stop />
          <label class="check smallish">
            <input type="checkbox" v-model="picker.onlyFree" />
            <span class="check-label">Only unassigned</span>
          </label>
          <select v-model="picker.sort" class="sort">
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="role_asc">Role A–Z</option>
            <option value="rank_desc">Rank (senior→junior)</option>
            <option value="rank_asc">Rank (junior→senior)</option>
            <option value="assigned_first">Assigned first</option>
            <option value="assigned_last">Assigned last</option>
          </select>
        </div>

        <div class="squad-modal-scroll compact-list">
          <div
            v-for="p in filteredAndSortedPersonnel"
            :key="p.id"
            class="pick-row compact"
            :class="{ assigned: !!findAssignment(p.id) }"
          >
            <div class="row-left">
              <img
                v-if="rankLabel(p.rank)"
                class="rank-icon small"
                :src="rankIcon(rankLabel(p.rank))"
                :alt="rankLabel(p.rank)"
                :title="rankLabel(p.rank)"
                @error="onRankImgError($event)"
              />
              <span class="name">{{ displayNameWithRank(p.name || 'UNKNOWN', rankLabel(p.rank)).toUpperCase() }}</span>
            </div>
            <div class="row-mid">
              <span class="role">{{ p.role || '—' }}</span>
              <span v-if="p.element" class="element">Element: {{ p.element }}</span>
              <span v-if="findAssignment(p.id)" class="chip">Assigned: {{ formatAssignment(findAssignment(p.id)) }}</span>
            </div>
            <div class="row-right">
              <button type="button" class="btn primary small" @click.stop="selectPersonnel(p)">Select</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Modal -->
    <div v-if="overview.open" class="squad-overlay" @click.self="closeOverview">
      <div class="squad-modal overview">
        <div class="compact-header">
          <h3>Chalk Loadouts Overview</h3>
          <div style="display:flex; gap:.5rem;">
            <button class="btn ghost small" @click="refreshOverview" :disabled="overview.loading">
              {{ overview.loading ? 'Refreshing…' : 'Refresh' }}
            </button>
            <button class="btn small" @click="clearAllSaved" :disabled="overview.loading">Clear All Saved</button>
            <button class="squad-close" @click="closeOverview">✕</button>
          </div>
        </div>

        <div v-if="overview.error" class="warn" style="margin-top:.5rem">{{ overview.error }}</div>

        <div class="squad-modal-scroll">
          <div class="overview-grid two-by-two">
            <div v-for="u in chalkUnits" :key="u.key" class="overview-card">
              <div class="overview-head">
                <div class="left">
                  <div class="title">{{ u.title }}</div>
                  <div class="meta">
                    <template v-if="ovItem(u.key)">
                      <span v-if="ovItem(u.key).savedBy">by {{ ovItem(u.key).savedBy }}</span>
                      <span v-if="ovItem(u.key).savedAt">at {{ formatDate(ovItem(u.key).savedAt) }}</span>
                      <span v-if="ovItem(u.key).points !== undefined">· {{ ovItem(u.key).points }} pts</span>
                      <span v-if="!ovItem(u.key).slots?.length" class="chip muted">Saved record found but empty — showing default</span>
                    </template>
                    <template v-else>
                      <span class="chip muted">Not saved — showing default</span>
                      <span>· {{ slotsPoints(u.slots) }} pts</span>
                    </template>
                  </div>
                </div>
                <div class="right">
                  <button class="btn small" :disabled="!apiBase || overview.loading" @click="loadRemote(u.key)">
                    Load Saved
                  </button>
                </div>
              </div>

              <div class="overview-body">
                <div
                  class="slot-row"
                  v-for="(s, idx) in (ovItem(u.key) && ovItem(u.key).slots?.length ? ovItem(u.key).slots : u.slots)"
                  :key="idx"
                >
                  <div class="slot-left">
                    <span class="slot-name">{{ s.name || 'VACANT' }}</span>
                    <span class="slot-id" v-if="s.id">ID: {{ s.id }}</span>
                  </div>
                  <div class="slot-right">
                    <span class="slot-role">{{ s.role || '—' }}</span>
                    <span class="slot-cert" v-if="s.cert">{{ s.cert }}</span>
                    <span class="slot-disp" v-if="s.disposable">Disp</span>
                  </div>
                </div>
                <div v-if="!((ovItem(u.key) && ovItem(u.key).slots?.length) || u.slots?.length)" class="overview-empty">—</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getDeploymentConfig, getSheetUrls } from "@/config/runtimeConfig";

/* cookie reader */
function readCookie(name) {
  try {
    const target = `${name}=`;
    const parts = document.cookie ? document.cookie.split(';') : [];
    for (let i = 0; i < parts.length; i++) {
      const v = parts[i].trim();
      if (v.startsWith(target)) return decodeURIComponent(v.substring(target.length));
    }
    return '';
  } catch { return ''; }
}




/* optional Netlify Identity */
async function netlifyIdentityToken() {
  try {
    const id = window.netlifyIdentity;
    if (!id) return '';
    const user = id.currentUser();
    if (!user) return '';
    const token = await user.jwt();
    return token || '';
  } catch { return ''; }
}

export default {
  name: "DeploymentView",
  props: {
    animate: { type: Boolean, default: true },
    orbat: { type: Array, default: () => [] },
    execUrl: { type: String, default: "" },
    secret: { type: String, default: "PLEX" },
    token:  { type: String, default: "" },
    defaultsCsvUrl: { type: String, default: () => getSheetUrls().refDataCsvUrl },
    rankIconBase: { type: String, default: () => getDeploymentConfig().rankIconBase },
    rankIconExt: { type: String, default: () => getDeploymentConfig().rankIconExt },
  },
  data() {
    return {
      animateView: false,
      animationDelay: "0ms",
      detailKey: "",
      detailError: "",
      apiError: "",
      busy: false,
      plan: { units: [] },
      picker: { open: false, unitKey: "", slotIdx: -1, query: "", onlyFree: false, sort: "name_asc" },
      personnel: [],
      troopRoster: [],
      troopRosterRows: [],
      rankByTroopKey: {},
      troopStatusByKey: {},
      STORAGE_KEY: "deploymentPlan2",
      versions: {},
      remoteMeta: {},
      deviceId: "",
      debugInfo: "",
      MIN_CHALK_SLOTS: 12,
      ROLE_ORDER: ["squad lead", "team leader", "corpsman 1", "corpsman 2"],
      SQUAD_POINT_CAP: 10,
      DISPOSABLE_COST: 1,
      CERT_POINTS: {
        Rifleman: 0, Grenadier: 1, Breacher: 1, RTO: 1,
        "Machine Gunner": 2, ".50 cal machinegunner": 5, Marksman: 2, "Combat Engineer": 2,
        "Anti Tank": 3, Corpsmen: 0, PJ: 3, Pilot: 3, NCO: 0, Officer: 0,
      },
      certLabels: [
        "Rifleman","Machine Gunner","Anti Tank","Corpsmen","Combat Engineer",
        "Marksman","Breacher","Grenadier","Pilot","RTO","PJ","NCO","Officer",
      ],
      identityToken: "",
      RANK_ORDER: {
        "GEN": 1, "COL": 2, "MAJ": 3, "CPT": 4, "1LT": 5, "2LT": 6,
        "CWO4": 7, "CWO3": 8, "CWO2": 9, "WO": 10,
        "GYSGT": 11, "SSGT": 12, "SSG": 13, "SGT": 14, "CPL": 15, "LCPL": 16, "PFC": 17, "PV2": 18, "PVT": 19
      },
      overview: {
        open: false,
        loading: false,
        error: "",
        items: {} // key -> { version, savedBy, savedAt, slots[], points }
      }
    };
  },
  async created() {
    this.ensureDeviceId();
    this.personnel = this.buildPersonnelPool(this.orbat);
    this.ensureUnitsBuilt(this.orbat);
    await this.hydrateDefaultsFromRefData();
    this.identityToken = await netlifyIdentityToken();
  },
  mounted() { this.triggerFlicker(0); },
  computed: {
    chalkUnits() { return this.plan.units; },
    currentUnit() { return this.plan.units.find(u => u.key === this.detailKey) || null; },
    currentSlotTitle() {
      if (!this.picker.open) return "";
      const g = this.plan.units.find(u => u.key === this.picker.unitKey);
      return g ? `${g.title} #${this.picker.slotIdx + 1}` : "";
    },
    filteredPersonnel() {
      const q = this.picker.query.trim().toLowerCase();
      const pool = (Array.isArray(this.troopRoster) && this.troopRoster.length) ? this.troopRoster : this.personnel;
      const active = (pool || []).filter(p => String(p.status || "").trim().toLowerCase() !== "discharged");
      const base = active.filter(
        p => !q ||
          (p.name || "").toLowerCase().includes(q) ||
          (p.callsign || "").toLowerCase().includes(q) ||
          (p.role || "").toLowerCase().includes(q)
      );
      return this.picker.onlyFree ? base.filter(p => !this.findAssignment(p.id)) : base;
    },
    filteredAndSortedPersonnel() {
      const list = this.filteredPersonnel.slice();
      const sort = this.picker.sort || "name_asc";
      const rankVal = (r) => {
        const code = this.rankLabel(r || "");
        return this.RANK_ORDER[code] || 999;
      };
      const assignedWeight = (p) => (this.findAssignment(p.id) ? 0 : 1);

      if (sort === "name_asc" || sort === "name_desc") {
        list.sort((a,b) => (a.name||"").localeCompare(b.name||"", undefined, {sensitivity:"base"}));
        if (sort === "name_desc") list.reverse();
      } else if (sort === "role_asc") {
        list.sort((a,b) => (a.role||"").localeCompare(b.role||"", undefined, {sensitivity:"base"}));
      } else if (sort === "rank_desc") {
        list.sort((a,b) => rankVal(a.rank) - rankVal(b.rank));
      } else if (sort === "rank_asc") {
        list.sort((a,b) => rankVal(b.rank) - rankVal(a.rank));
      } else if (sort === "assigned_first") {
        list.sort((a,b) => assignedWeight(a) - assignedWeight(b));
      } else if (sort === "assigned_last") {
        list.sort((a,b) => assignedWeight(b) - assignedWeight(a));
      }
      return list;
    },
    authToken() {
      const tProp = (this.token || "").trim();
      if (tProp) return tProp;
      const tId = (this.identityToken || "").trim();
      if (tId) return tId;
      try {
        const ls = typeof localStorage !== "undefined" ? localStorage : null;
        const ss = typeof sessionStorage !== "undefined" ? sessionStorage : null;
        const keys = ["token","authToken","jwt","access_token","userToken","GAS_TOKEN","GAS_JWT"];
        for (const k of keys) {
          const v = (ls?.getItem(k) || ss?.getItem(k) || "").trim();
          if (v) return v;
        }
      } catch {}
      try {
        const ck = ["token","authToken","jwt","access_token"];
        for (const c of ck) {
          const v = (readCookie(c) || "").trim();
          if (v) return v;
        }
      } catch {}
      return "";
    },
    authModeLabel() { return this.authToken ? "User mode (token)" : "Device mode (anonymous)"; },
    apiBase() {
      const direct = (this.execUrl || "").trim();
      if (direct) return direct;
      try { const v = getDeploymentConfig().execUrl; if (v) return String(v).trim(); } catch {}
      try {
        const ls = typeof localStorage !== "undefined" ? localStorage : null;
        const ss = typeof sessionStorage !== "undefined" ? sessionStorage : null;
        const ns = ls?.getItem("deploymentExecUrl") || ss?.getItem("deploymentExecUrl") || "";
        if (ns && ns.trim()) return ns.trim();
      } catch {}
      try {
        const meta = document?.querySelector('meta[name="apps-script-exec"]')?.content || "";
        if (meta && meta.trim()) return meta.trim();
      } catch {}
      try {
        if (typeof APP_EXEC_URL !== "undefined" && APP_EXEC_URL) return String(APP_EXEC_URL).trim();
        if (typeof window !== "undefined" && window.APP_EXEC_URL) return String(window.APP_EXEC_URL).trim();
      } catch {}
      try {
        const ls = typeof localStorage !== "undefined" ? localStorage : null;
        const ss = typeof sessionStorage !== "undefined" ? sessionStorage : null;
        const a = ls?.getItem("execUrl") || ss?.getItem("execUrl") || "";
        if (a && a.trim()) return a.trim();
      } catch {}
      return "";
    },
    pointsUsed() { return this.calcUnitPoints(this.currentUnit); },
  },
  methods: {
    /* rank helpers */
    rankLabel(raw) {
      const t = String(raw || "").trim();
      if (!t) return "";
      const map = {
        pvt:"PVT", pv2:"PV2", pfc:"PFC", lcpl:"LCPL", cpl:"CPL", sgt:"SGT",
        ssg:"SSG", ssgt:"SSGT", gysgt:"GYSGT",
        "2lt":"2LT", "1lt":"1LT", lt:"LT", cpt:"CPT", capt:"CPT", maj:"MAJ",
        col:"COL", gen:"GEN", wo:"WO", cwo2:"CWO2", cwo3:"CWO3", cwo4:"CWO4"
      };
      const k = t.toLowerCase();
      return map[k] || t.toUpperCase();
    },
    extractRank(member) {
      const r = member?.rank || member?.grade;
      if (r) return this.rankLabel(r);
      const candidates = [member?.name, member?.callsign].filter(Boolean);
      for (const c of candidates) {
        const tok = String(c).trim().split(/\s+/)[0] || "";
        const norm = this.rankLabel(tok);
        if (norm && /^[A-Z0-9]{2,6}$/.test(norm)) {
          const known = ["PVT","PV2","PFC","LCPL","CPL","SGT","SSG","SSGT","GYSGT","2LT","1LT","LT","CPT","MAJ","COL","GEN","WO","CWO2","CWO3","CWO4"];
          if (known.includes(norm)) return norm;
        }
      }
      return "";
    },
    rankFor(personId) {
      const p = this.personnel.find(pp => String(pp.id) === String(personId));
      return p?.rank ? this.rankLabel(p.rank) : "";
    },

    displayNameWithRank(name, rank) {
      const n = String(name || "UNKNOWN").trim() || "UNKNOWN";
      const r = this.rankLabel(rank);
      if (!r) return n;

      // Avoid double-prefix if name already starts with same rank.
      const firstToken = (n.split(/\s+/)[0] || "").replace(/[^a-z0-9]/gi, "");
      const firstRank = this.rankLabel(firstToken);
      if (firstRank && firstRank === r) return n;

      return `${r} ${n}`;
    },
    rankIcon(code) {
      if (!code) return "";
      const base = (this.rankIconBase || "/ranks").replace(/\/+$/,"");
      const ext = (this.rankIconExt || "png").replace(/^\.+/,"");
      return `${base}/${code}.${ext}`;
    },
    onRankImgError(ev) { ev.target.style.display = 'none'; },

    squadInitials(name) {
      if (!name) return "UNSC";
      const parts = String(name).trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
      return parts.map((p, i) => (i === parts.length - 1 && /\d+/.test(p) ? p : p[0]))
                  .join("").toUpperCase();
    },

    /* ===== STRICT configJSON parser (matches how chalks save/load) ===== */
    parseConfigJSONSlots(rec) {
      const txt = typeof rec?.configJSON === 'string' ? rec.configJSON
                : typeof rec?.data?.configJSON === 'string' ? rec.data.configJSON
                : null;
      if (!txt) return [];
      try {
        const obj = JSON.parse(txt);
        const slots = obj?.slots || obj?.config?.slots || [];
        if (!Array.isArray(slots)) return [];
        return slots.map(s => ({
          id: s?.id ?? null,
          name: s?.name ?? null,
          role: s?.role || "",
          fireteam: this.normalizeFireteamKey(s?.fireteam || s?.fireTeam || s?.ft || ""),
          cert: s?.cert || "",
          disposable: !!s?.disposable,
        }));
      } catch {
        return [];
      }
    },

    /* ===== Fallback extractor (very tolerant) ===== */
    extractSlotsFromAny(rec) {
      const normSlots = (arr) => (Array.isArray(arr) ? arr : []).map(s => ({
        id: s?.id ?? null,
        name: s?.name ?? null,
        role: s?.role || "",
        fireteam: this.normalizeFireteamKey(s?.fireteam || s?.fireTeam || s?.ft || ""),
        cert: s?.cert || "",
        disposable: !!s?.disposable
      }));
      const tryParse = (val) => {
        if (!val) return null;
        if (typeof val === "string") {
          try { return JSON.parse(val); } catch { return null; }
        }
        if (typeof val === "object") return val;
        return null;
      };

      if (Array.isArray(rec?.slots)) return normSlots(rec.slots);

      const topConfigJSON = tryParse(rec?.configJSON || rec?.loadoutJSON);
      if (topConfigJSON) {
        if (Array.isArray(topConfigJSON.slots)) return normSlots(topConfigJSON.slots);
        if (Array.isArray(topConfigJSON?.config?.slots)) return normSlots(topConfigJSON.config.slots);
      }
      const topConfig = tryParse(rec?.config);
      if (topConfig) {
        if (Array.isArray(topConfig.slots)) return normSlots(topConfig.slots);
        if (Array.isArray(topConfig?.config?.slots)) return normSlots(topConfig.config.slots);
      }

      const d = rec?.data || {};
      if (Array.isArray(d.slots)) return normSlots(d.slots);
      const dConfigJSON = tryParse(d.configJSON || d.loadoutJSON);
      if (dConfigJSON) {
        if (Array.isArray(dConfigJSON.slots)) return normSlots(dConfigJSON.slots);
        if (Array.isArray(dConfigJSON?.config?.slots)) return normSlots(dConfigJSON.config.slots);
      }
      const dConfig = tryParse(d.config);
      if (dConfig) {
        if (Array.isArray(dConfig.slots)) return normSlots(dConfig.slots);
        if (Array.isArray(dConfig?.config?.slots)) return normSlots(dConfig.config.slots);
      }

      const recordish = rec?.record || rec?.item || {};
      if (Array.isArray(recordish.slots)) return normSlots(recordish.slots);
      const rConfigJSON = tryParse(recordish.configJSON);
      if (rConfigJSON) {
        if (Array.isArray(rConfigJSON.slots)) return normSlots(rConfigJSON.slots);
        if (Array.isArray(rConfigJSON?.config?.slots)) return normSlots(rConfigJSON.config.slots);
      }
      const rConfig = tryParse(recordish.config);
      if (rConfig) {
        if (Array.isArray(rConfig.slots)) return normSlots(rConfig.slots);
        if (Array.isArray(rConfig?.config?.slots)) return normSlots(rConfig.config.slots);
      }

      return [];
    },

    /* Overview helpers */
    ovItem(key) { return this.overview.items[key]; },
    formatDate(ts) {
      try { const d = new Date(ts); if (!isFinite(d)) return String(ts); return d.toLocaleString(); }
      catch { return String(ts); }
    },

    async openOverview() { this.overview.open = true; await this.refreshOverview(); },
    closeOverview() { this.overview.open = false; },

    async refreshOverview() {
      if (!this.apiBase) { this.overview.error = "execUrl missing"; return; }
      this.overview.loading = true; this.overview.error = "";
      try {
        const results = await Promise.allSettled(
          this.chalkUnits.map(u => this.apiPost("config:get", { unitId: u.key }))
        );

        const map = {};
        results.forEach((r, idx) => {
          const unitKey = this.chalkUnits[idx].key;
          if (r.status === "fulfilled" && r.value && r.value.ok && r.value.data) {
            const it = r.value.data;
            let slots = this.parseConfigJSONSlots(it);
            if (!slots.length) slots = this.extractSlotsFromAny(it);
            map[unitKey] = {
              version: Number(it.version || 0),
              savedBy: it.user || it.savedBy || "",
              savedAt: it.savedAt || it.updatedAt || it.timestamp || "",
              slots,
              points: this.slotsPoints(slots)
            };
          }
        });

        this.overview.items = map;
      } catch (e) {
        this.overview.error = String(e.message || e);
      } finally {
        this.overview.loading = false;
      }
    },

    async clearAllSaved() {
      if (!confirm("Clear ALL saved loadouts for all Chalks? This cannot be undone.")) return;
      this.overview.loading = true; this.overview.error = "";
      try {
        const res = await this.apiPost("config:clearAll", {});
        if (!res || res.ok !== true) {
          await Promise.allSettled(this.chalkUnits.map(u => this.apiPost("config:clear", { unitId: u.key })));
        }
        await this.refreshOverview();
      } catch (e) {
        this.overview.error = String(e.message || e);
      } finally {
        this.overview.loading = false;
      }
    },

    slotsPoints(slots) {
      return (slots || []).reduce((sum, s) => {
        if (!s.id) return sum;
        const certPts = this.CERT_POINTS[s.cert] ?? 0;
        const dispPts = s.disposable ? this.DISPOSABLE_COST : 0;
        return sum + certPts + dispPts;
      }, 0);
    },

    async resetPlan() {
      // Reset should behave exactly like a fresh page load.
      this.detailError = "";
      this.apiError = "";
      this.debugInfo = "";

      this.ensureDeviceId();
      this.personnel = this.buildPersonnelPool(this.orbat);
      this.ensureUnitsBuilt(this.orbat);

      await this.hydrateDefaultsFromRefData();

      // Canonicalize fireteams and ordering after presets are applied.
      this.plan.units = (this.plan.units || []).map(u => ({
        ...u,
        slots: this.sortSlotsForUnit(u, u.slots || [])
      }));

      this.persistPlan();
      this.triggerFlicker(0);
      if (!this.debugInfo) this.debugInfo = "Reset to ORBAT + RefData defaults.";
    },


    async hydrateDefaultsFromRefData() {
      try {
        const url = this.defaultsCsvUrl || DEFAULT_REF_DATA_CSV_URL;
        if (!url) return;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`CSV HTTP ${res.status}`);
        const text = await res.text();
        const troopRows = this.parseRefDataTroopRows(text);
        if (troopRows && troopRows.length) {
          this.troopRosterRows = troopRows.slice();
          this.troopRoster = this.buildTroopRoster(troopRows);
        }
        const troopMeta = this.parseRefDataTroopMeta(text);
        if (troopMeta && Object.keys(troopMeta).length) {
          this.troopStatusByKey = troopMeta;
          this.applyRefDataTroopMeta(troopMeta);
        }
        await this.hydrateRanksFromMembersMaster();
        if (this.troopRosterRows && this.troopRosterRows.length) {
          this.troopRoster = this.buildTroopRoster(this.troopRosterRows);
          if (this.rankByTroopKey && Object.keys(this.rankByTroopKey).length) this.applyRankMapToTroopRoster(this.rankByTroopKey);
        }
        const defaults = this.parseRefDataDefaults(text);
        const updated = this.applyRefDataDefaults(defaults);
        if (!updated) throw new Error("No matching chalks in RefData CSV.");
        this.persistPlan();
        this.triggerFlicker(0);
        if (!this.debugInfo) this.debugInfo = "Loaded chalk presets from RefData sheet.";
      } catch (e) {
        if (!this.apiError) this.apiError = `RefData presets: ${String(e.message || e)}`;
      }
    },

    parseChalkFireteamCtx(text) {
      const raw = String(text || "");
      let rest = raw;
      let chalk = null;
      let fireteam = null;

      const cm = rest.match(/chalk\s*(\d+)/i);
      if (cm) {
        chalk = parseInt(cm[1], 10);
        rest = rest.replace(cm[0], " ");
      }
      const fm = rest.match(/fire\s*team\s*(\d+)/i) || rest.match(/\bft\s*(\d+)/i);
      if (fm) {
        fireteam = parseInt(fm[1], 10);
        rest = rest.replace(fm[0], " ");
      }

      rest = rest.replace(/[|\-–—:]+/g, " ").replace(/\s+/g, " ").trim();
      return { chalk, fireteam, rest };
    },

    normalizeNameForMatch(raw) {
      return String(raw || "")
        .replace(/[“”]/g, '"')
        .replace(/[’]/g, "'")
        .toLowerCase()
        .replace(/[^a-z0-9"'.\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    },


    normalizeTroopKey(raw) {
      return this.normalizeNameForMatch(this.stripLeadingRank(raw)).replace(/"/g, "").trim();
    },


    parseRefDataTroopRows(csvText) {
      const rows = this.csvToRows(String(csvText || ""));
      if (rows.length < 2) return [];
      const headers = rows[0].map(h => String(h || "").trim());
      const troopIdx = this.findHeader(headers, /^\s*troop\s*list\s*$/i);
      const statusIdx = this.findHeader(headers, /^\s*troop\s*status\s*$/i, true);
      if (troopIdx < 0) return [];
      const out = [];
      for (let i = 1; i < rows.length; i++) {
        const name = String(rows[i]?.[troopIdx] || "").trim();
        if (!name) continue;
        if (/^\s*chalk\s*\d+\s*fire\s*team\s*\d+\s*$/i.test(name)) continue;
        const status = statusIdx >= 0 ? String(rows[i]?.[statusIdx] || "").trim() : "";
        out.push({ name, status: status || "Active" });
      }
      return out;
    },

    buildTroopRoster(troopRows) {
      const rows = Array.isArray(troopRows) ? troopRows : [];
      const existing = Array.isArray(this.personnel) ? this.personnel : [];
      const byKey = new Map();
      for (const p of existing) {
        const k = this.normalizeTroopKey(p?.name || "");
        if (k) byKey.set(k, p);
      }

      const rankMap = this.rankByTroopKey || {};
      const out = [];
      const seen = new Set();

      for (const t of rows) {
        const nameRaw = String(t?.name || "").trim();
        if (!nameRaw) continue;
        const status = String(t?.status || "").trim() || "Active";
        if (String(status).trim().toLowerCase() === "discharged") continue;

        const key = this.normalizeTroopKey(nameRaw);
        const found = key ? byKey.get(key) : null;
        const id = found?.id ? String(found.id) : `troop:${key || this.keyFromName(nameRaw)}`;
        const uniq = key || id;
        if (seen.has(uniq)) continue;
        seen.add(uniq);

        const rank = (key && rankMap[key]) ? String(rankMap[key]) : (found?.rank ? String(found.rank) : "");

        out.push({
          id,
          name: found?.name ? String(found.name) : nameRaw,
          rank,
          status,
          statusNorm: String(status || "").trim().toLowerCase(),
          callsign: found?.callsign ? String(found.callsign) : "",
          role: found?.role ? String(found.role) : "",
        });
      }

      return out;
    },

    applyRankMapToTroopRoster(rankMap) {
      const map = rankMap || {};
      if (!Array.isArray(this.troopRoster)) return false;
      this.troopRoster = this.troopRoster.map(p => {
        const key = this.normalizeTroopKey(p?.name || "");
        const r = key ? map[key] : "";
        return r ? { ...p, rank: String(r) } : p;
      });
      return true;
    },

    mergeTroopListIntoPersonnel(troopRows) {
      const rows = Array.isArray(troopRows) ? troopRows : [];
      if (!rows.length) return false;

      const existing = Array.isArray(this.personnel) ? this.personnel : [];
      const byKey = new Map();
      for (const p of existing) {
        const k = this.normalizeTroopKey(p?.name || "");
        if (k) byKey.set(k, p);
      }

      const merged = [];
      for (const t of rows) {
        const name = String(t?.name || "").trim();
        if (!name) continue;
        const status = String(t?.status || "").trim() || "Active";
        if (status.toLowerCase() === "discharged") continue;

        const key = this.normalizeTroopKey(name);
        const found = key ? byKey.get(key) : null;
        const id = found?.id ? String(found.id) : `troop:${key || this.keyFromName(name)}`;

        merged.push({
          ...(found || {}),
          id,
          name: found?.name ? String(found.name) : name,
          status,
        });
      }

      this.personnel = merged;
      if (typeof this.purgeDischargedAssignments === "function") this.purgeDischargedAssignments();
      return true;
    },

    async hydrateRanksFromMembersMaster() {
      try {
        const res = await fetch(getSheetUrls().membersCsvUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`MembersMaster HTTP ${res.status}`);
        const text = await res.text();
        const rankMap = this.parseMembersMasterRankMap(text);
        if (rankMap && Object.keys(rankMap).length) {
          this.rankByTroopKey = rankMap;
          this.applyRankMapToPersonnel(rankMap);
          this.applyRankMapToTroopRoster(rankMap);
        }
      } catch (e) {
        // Non-fatal: presets + picker should still work without ranks.
        if (!this.apiError) this.apiError = `MembersMaster ranks: ${String(e.message || e)}`;
      }
    },

    parseMembersMasterRankMap(csvText) {
      const rows = this.csvToRows(String(csvText || ""));
      if (rows.length < 2) return {};
      let headerRow = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const r = rows[i].map(c => String(c || "").trim());
        const hasName = r.some(c => /^name$/i.test(c));
        const hasRank = r.some(c => /^rank$/i.test(c));
        if (hasName && hasRank) { headerRow = i; break; }
      }
      if (headerRow < 0) return {};
      const headers = rows[headerRow].map(h => String(h || "").trim());
      const rankIdx = this.findHeader(headers, /^\s*rank\s*$/i);
      const nameIdx = this.findHeader(headers, /^\s*name\s*$/i);
      if (rankIdx < 0 || nameIdx < 0) return {};

      const out = {};
      for (let i = headerRow + 1; i < rows.length; i++) {
        const name = String(rows[i]?.[nameIdx] || "").trim();
        const rank = String(rows[i]?.[rankIdx] || "").trim();
        if (!name || !rank) continue;
        const key = this.normalizeTroopKey(name);
        if (!key) continue;
        out[key] = rank;
      }
      return out;
    },

    applyRankMapToPersonnel(rankMap) {
      const map = rankMap || {};
      if (!Array.isArray(this.personnel)) return false;
      this.personnel = this.personnel.map(p => {
        const key = this.normalizeTroopKey(p?.name || "");
        const r = key ? map[key] : "";
        return r ? { ...p, rank: r } : p;
      });
      return true;
    },
    parseRefDataTroopMeta(csvText) {
      const rows = this.csvToRows(csvText);
      if (rows.length < 2) return {};
      const headers = rows[0].map(h => String(h || "").trim());
      const troopIdx = this.findHeader(headers, /^\s*troop\s*list\s*$/i);
      const statusIdx = this.findHeader(headers, /^\s*troop\s*status\s*$/i);
      if (troopIdx < 0) return {};

      const out = {};
      for (let i = 1; i < rows.length; i++) {
        const n = String(rows[i]?.[troopIdx] || "").trim();
        if (!n) continue;
        const s = statusIdx >= 0 ? String(rows[i]?.[statusIdx] || "").trim() : "";
        out[this.normalizeTroopKey(n)] = s;
      }
      return out;
    },

    purgeDischargedAssignments(dischargedIds) {
      if (!dischargedIds || dischargedIds.size === 0) return;
      this.plan.units = (this.plan.units || []).map(u => {
        const slots = (u.slots || []).map(s => {
          const id = s?.id != null ? String(s.id) : "";
          if (!id || !dischargedIds.has(id)) return s;
          return { ...s, id: null, name: null, cert: "", disposable: false, origStatus: "VACANT" };
        });
        return { ...u, slots };
      });
    },

    applyRefDataTroopMeta(metaByTroopKey) {
      const meta = metaByTroopKey || {};
      this.personnel = (this.personnel || []).map(p => {
        const key = this.normalizeTroopKey(p?.name || "");
        const status = meta[key] != null && String(meta[key]).trim() ? String(meta[key]).trim() : (p.status || "");
        return { ...p, status, statusNorm: String(status || "").trim().toLowerCase() };
      });

      const discharged = new Set();
      for (const p of (this.personnel || [])) {
        if (String(p.statusNorm || "").trim().toLowerCase() === "discharged" && p.id != null) {
          discharged.add(String(p.id));
        }
      }
      this.purgeDischargedAssignments(discharged);
      return discharged;
    },
    stripLeadingRank(raw) {
      const s = String(raw || "").trim();
      const parts = s.split(/\s+/).filter(Boolean);
      if (!parts.length) return s;
      const token = parts[0].replace(/[^a-z0-9]/gi, "").toUpperCase();
      const known = new Set([
        "PVT","PV2","PFC","LCPL","CPL","SGT","SSG","SSGT","GYSGT","SFC","MSG","1SG","SMA",
        "WO1","CWO2","CWO3","CWO4","CWO5",
        "2LT","1LT","LT","CPT","MAJ","LTC","COL","GEN",
        "HM3","HM2","HM1","HMC","HMSC",
        "SPC","SPC2","SPC3","SPC4","SPC5","SPC6","SPC7"
      ]);
      if (!known.has(token)) return s;
      return parts.slice(1).join(" ").trim();
    },

    parseRefDataDefaults(csvText) {
      const rows = this.csvToRows(csvText);
      if (rows.length < 2) return {};
      const headers = rows[0].map(h => String(h || "").trim());
      const nameIdx = this.findHeader(headers, /^\s*squad\s*slots\s*$/i);
      const roleIdx = this.findHeader(headers, /^\s*squad\s*roles\s*$/i);
      if (nameIdx < 0 || roleIdx < 0) return {};

      let curChalk = null;
      let curFireteam = null;
      const out = {};

      for (let i = 1; i < rows.length; i++) {
        const nameCell = String(rows[i]?.[nameIdx] || "").trim();
        const roleCell = String(rows[i]?.[roleIdx] || "").trim();

        if (!nameCell && !roleCell) continue;

        // Hard stop: ignore everything below Chalk blocks (Broadsword Command and below)
        if (/^\s*broadsword command\s*$/i.test(nameCell) || /^\s*broadsword command\s*$/i.test(roleCell)) break;

        // Section header rows like: "Chalk 1 Fireteam 2" (never a trooper)
        const nameHdr = this.parseChalkFireteamCtx(nameCell);
        const roleHdr = this.parseChalkFireteamCtx(roleCell);
        const isNameHeader = nameHdr.chalk != null && !String(nameHdr.rest || "").trim();
        const isRoleHeader = roleHdr.chalk != null && !String(roleHdr.rest || "").trim();
        if (isNameHeader || isRoleHeader) {
          const ctx = isNameHeader ? nameHdr : roleHdr;
          if (ctx.chalk != null) curChalk = ctx.chalk;
          if (ctx.fireteam != null) curFireteam = ctx.fireteam;
          continue;
        }

        const roleCtx = this.parseChalkFireteamCtx(roleCell);
        const nameCtx = this.parseChalkFireteamCtx(nameCell);

        const chalk = roleCtx.chalk ?? nameCtx.chalk ?? curChalk;
        const fireteam = roleCtx.fireteam ?? nameCtx.fireteam ?? curFireteam;
        if (roleCtx.chalk != null) curChalk = roleCtx.chalk;
        else if (nameCtx.chalk != null) curChalk = nameCtx.chalk;
        if (roleCtx.fireteam != null) curFireteam = roleCtx.fireteam;
        else if (nameCtx.fireteam != null) curFireteam = nameCtx.fireteam;

        if (chalk == null) continue;

        const key = `chalk ${chalk}`.toLowerCase();
        const role = (roleCtx.rest || roleCell).trim();
        const isVacant = /^\s*(vacant|tbd|open)\s*$/i.test(nameCell) || (!nameCell && !!role);
        const cleanName = isVacant ? "" : nameCell;
        if (!cleanName && !isVacant) continue;

        if (!out[key]) out[key] = [];
        out[key].push({ name: cleanName, role, fireteam: fireteam != null ? String(fireteam) : "" });
      }

      return out;
    },

    applyRefDataDefaults(defaultsByChalk) {
      const people = this.personnel || [];
      const exact = new Map();
      const norank = new Map();
      const shortMap = new Map();
      for (const p of people) {
        const k1 = this.normalizeNameForMatch(p.name);
        if (k1) exact.set(k1, p);
        const k2 = this.normalizeNameForMatch(this.stripLeadingRank(p.name));
        if (k2) norank.set(k2, p);
        const k3 = this.normalizeTroopKey(p.name);
        if (k3) shortMap.set(k3, p);
      }

      const findPerson = (sheetName) => {
        const raw = String(sheetName || "").trim();
        if (!raw) return null;

        const k = this.normalizeNameForMatch(raw);
        if (exact.has(k)) return exact.get(k);
        if (norank.has(k)) return norank.get(k);

        const kNoRank = this.normalizeNameForMatch(this.stripLeadingRank(raw));
        if (exact.has(kNoRank)) return exact.get(kNoRank);
        if (norank.has(kNoRank)) return norank.get(kNoRank);

        const kShort = this.normalizeTroopKey(raw);
        if (shortMap.has(kShort)) return shortMap.get(kShort);

        for (const [kk, pp] of exact.entries()) {
          if (kk.includes(k) || k.includes(kk) || kk.includes(kNoRank) || kNoRank.includes(kk)) return pp;
        }
        return null;
      };

      let touched = 0;
      const nextUnits = (this.plan.units || []).map(u => {
        const key = String(u.title || "").trim().toLowerCase();
        const rows = defaultsByChalk[key];
        if (!rows) return u;

        const slots = rows.map(r => {
          const rawName = String(r?.name || "").trim();
          const found = rawName ? findPerson(rawName) : null;
          const person = found && String(found.statusNorm || "").trim().toLowerCase() === "discharged" ? null : found;
          const slot = {
            id: person?.id ? String(person.id) : null,
            name: person?.name ? String(person.name) : (rawName ? rawName : null),
            role: this.titleCase(String(r.role || "")),
            fireteam: String(r.fireteam || ""),
            origStatus: (person?.id || rawName) ? "FILLED" : "VACANT",
            cert: "",
            disposable: false,
          };
          slot.cert = this.ensureSlotCert(slot, slot.role);
          return slot;
        });

        const padded = this.isChalk(u.title)
          ? slots.map(s => ({ ...s, fireteam: String(s.fireteam || "") }))
          : slots;

        touched++;
        return { ...u, slots: padded };
      });

      if (touched > 0) {
        this.plan.units = nextUnits;
        if (!this.plan.units.find(x => x.key === this.detailKey) && this.plan.units.length) {
          this.detailKey = this.plan.units[0].key;
        }
        return true;
      }
      return false;
    },

    parseCsvDefaults(csvText) {
      const rows = this.csvToRows(csvText);
      if (!rows.length) return {};
      const headers = rows[0].map(h => String(h || "").trim());
      const idx = {
        chalk: this.findHeader(headers, /(chalk|unit)/i),
        slot:  this.findHeader(headers, /(slot|index|position|#)/i, true),
        role:  this.findHeader(headers, /(role)/i),
        cert:  this.findHeader(headers, /(cert)/i, true),
        disp:  this.findHeader(headers, /(disp(osable)?|launcher)/i, true),
      };
      if (idx.chalk < 0 || idx.role < 0) throw new Error("Missing required columns (Chalk/Unit and Role).");
      const out = {};
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]; if (!row || !row.length) continue;
        const chalkName = String(row[idx.chalk] || "").trim(); if (!chalkName) continue;
        const role = String(row[idx.role] || "").trim();
        const slotNumRaw = idx.slot >= 0 ? String(row[idx.slot] || "").trim() : "";
        const cert = idx.cert >= 0 ? String(row[idx.cert] || "").trim() : "";
        const dispRaw = idx.disp >= 0 ? String(row[idx.disp] || "").trim().toUpperCase() : "";
        const disposable = ["Y","YES","TRUE","1"].includes(dispRaw);
        const key = chalkName.toLowerCase();
        if (!out[key]) out[key] = [];
        out[key].push({ idx: Number(slotNumRaw) || out[key].length + 1, role, cert, disposable: !!disposable });
      }
      Object.keys(out).forEach(k => out[k].sort((a,b)=> (a.idx||9999) - (b.idx||9999)));
      return out;
    },

    applyCsvDefaults(defaultsByChalk) {
      let touched = 0;
      const nextUnits = this.plan.units.map(u => {
        const key = String(u.title || "").trim().toLowerCase();
        const rows = defaultsByChalk[key];
        if (!rows) return u;
        const slots = rows.map(row => ({
          id: null, name: null, role: this.titleCase(row.role || ""), origStatus: "VACANT",
          cert: row.cert || "", disposable: !!row.disposable,
        }));
        const padded = this.isChalk(u.title) ? slots : slots;
        touched++;
        return { ...u, slots: this.sortSlotsForUnit(curr, padded) };
      });
      if (touched > 0) {
        this.plan.units = nextUnits;
        if (!this.plan.units.find(x => x.key === this.detailKey) && this.plan.units.length) {
          this.detailKey = this.plan.units[0].key;
        }
        return true;
      }
      return false;
    },

    csvToRows(text) {
      const rows = []; let i = 0, field = "", row = [], inQuotes = false;
      const pushField = () => { row.push(field); field = ""; };
      const pushRow = () => { rows.push(row); row = []; };
      while (i < text.length) {
        const ch = text[i];
        if (inQuotes) {
          if (ch === '"') { if (text[i+1] === '"') { field += '"'; i += 2; continue; } inQuotes = false; i++; continue; }
          field += ch; i++; continue;
        } else {
          if (ch === '"') { inQuotes = true; i++; continue; }
          if (ch === ',') { pushField(); i++; continue; }
          if (ch === '\n') { pushField(); pushRow(); i++; continue; }
          if (ch === '\r') { i++; continue; }
          field += ch; i++; continue;
        }
      }
      (field !== "" || row.length) && (pushField(), pushRow());
      return rows.filter(r => r.some(c => String(c).trim() !== ""));
    },

    findHeader(headers, regex, optional = false) {
      const idx = headers.findIndex(h => regex.test(String(h || "")));
      if (idx === -1 && !optional) return -1;
      return idx;
    },

    ensureUnitsBuilt(orbat) {
      const built = this.buildUnitsFromOrbat(orbat).filter(u => this.isPointsUnit(u.title));
      if (built.length === 0) {
        this.plan.units = this.makeDefaultChalks(4, this.MIN_CHALK_SLOTS);
        this.detailKey = this.plan.units[0].key;
        this.debugInfo = "Fallback to default Chalk 1–4 (no/invalid ORBAT).";
        return;
      }
      built.forEach(u => u.slots.forEach(s => { if (typeof s.disposable === "undefined") s.disposable = false; }));
      this.plan.units = built;
      if (!this.detailKey && this.plan.units.length) this.detailKey = this.plan.units[0].key;
      this.debugInfo = `Loaded ${this.plan.units.length} chalk(s) from ORBAT.`;
    },

    makeDefaultChalks(count, size) {
      const arr = [];
      for (let i = 1; i <= count; i++) {
        const title = `Chalk ${i}`;
        const key = this.keyFromName(title);
        const slots = [];
arr.push({ key, title, slots });
      }
      return arr;
    },

    ensureDeviceId() {
      try {
        const key = "orbatDeviceId";
        const existing = localStorage.getItem(key);
        if (existing && /^[a-zA-Z0-9_.-]{8,}$/.test(existing)) { this.deviceId = existing; return; }
        const id = this.makeDeviceId();
        localStorage.setItem(key, id);
        this.deviceId = id;
      } catch { this.deviceId = this.makeDeviceId(); }
    },

    makeDeviceId() {
      const r = (crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(12)) : Array.from({length:12},()=>Math.floor(Math.random()*256));
      return Array.from(r).map(b => b.toString(16).padStart(2,'0')).join('');
    },

    async apiPost(action, body, raw = false) {
  if (!this.apiBase) throw new Error("execUrl missing");

  const ls = typeof localStorage !== "undefined" ? localStorage : null;
  const ss = typeof sessionStorage !== "undefined" ? sessionStorage : null;

  const readJson = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
  const readStr = (k) => String(ss?.getItem(k) || ls?.getItem(k) || "").trim();

  const decodeJwtPayload = (token) => {
    try {
      const rawTok = String(token || "").replace(/^Bearer\s+/i, "").trim();
      const parts = rawTok.split(".");
      if (parts.length < 2) return null;
      const b64url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
      const json = atob(b64url + pad);
      return JSON.parse(json);
    } catch { return null; }
  };

  // Preferred: staff/admin session created by src/utils/adminAuth.js
  const adminUser = readJson(ss?.getItem("admin:user") || "");
  const adminRole = (readStr("admin:role") || readStr("authRole") || String(adminUser?.role || "")).trim();
  const adminTokenRaw = (readStr("admin:token") || readStr("authToken") || "").trim();
  const adminAuth = adminTokenRaw
    ? (adminTokenRaw.toLowerCase().startsWith("bearer ") ? adminTokenRaw : `Bearer ${adminTokenRaw}`)
    : "";

  const jwtPayload = decodeJwtPayload(adminAuth || adminTokenRaw);
  const jwtUserMeta = jwtPayload?.user_metadata || jwtPayload?.user_metadata || {};
  const jwtAppMeta = jwtPayload?.app_metadata || {};

  const adminDisplay =
    String(
      adminUser?.displayName ||
      adminUser?.display_name ||
      adminUser?.full_name ||
      adminUser?.fullName ||
      adminUser?.name ||
      adminUser?.username ||
      adminUser?.user ||
      adminUser?.email ||
      jwtUserMeta?.full_name ||
      jwtUserMeta?.name ||
      jwtUserMeta?.display_name ||
      jwtUserMeta?.user_name ||
      jwtPayload?.name ||
      jwtPayload?.email ||
      ""
    ).trim();

  const jwtRoles = Array.isArray(jwtAppMeta?.roles) ? jwtAppMeta.roles : [];
  const jwtRole = String(jwtRoles[0] || "").trim();

  // Optional: Netlify Identity widget (if present on site)
  let niUser = null;
  try { niUser = window?.netlifyIdentity?.currentUser?.() || null; } catch {}
  const niDisplay = String(
    niUser?.user_metadata?.full_name ||
    niUser?.user_metadata?.name ||
    niUser?.user_metadata?.display_name ||
    niUser?.email ||
    ""
  ).trim();
  const niAuth = niUser?.token?.access_token ? `Bearer ${niUser.token.access_token}` : "";

  // Legacy fallback
  const legacyUser = readJson(readStr("user"));
  const legacyDisplay = String(
    legacyUser?.displayName ||
    legacyUser?.fullName ||
    legacyUser?.name ||
    legacyUser?.username ||
    legacyUser?.login ||
    legacyUser?.email ||
    ""
  ).trim();
  const legacyRole = String(legacyUser?.role || "").trim();
  const legacyAuth = readStr("Authorization");

  const candidateUser = adminDisplay || niDisplay || legacyDisplay;
  const candidateRole = (adminRole || jwtRole || legacyRole).trim();
  const authHeader = adminAuth || legacyAuth || niAuth;

  const payload = {
    secret: this.secret || "PLEX",
    action,
    deviceId: this.deviceId,
    ...body,
  };

  const urlObj = new URL(this.apiBase, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  const isDirectGAS = /script\.google\.com|googleusercontent\.com/.test(urlObj.hostname);
  if (isDirectGAS) {
    // Apps Script web apps often do not expose request headers; pass role/user via query for compatibility.
    if (candidateRole) urlObj.searchParams.set("X-Role", candidateRole);
    if (candidateUser) urlObj.searchParams.set("X-User", candidateUser);
    if (authHeader && !candidateRole) urlObj.searchParams.set("Authorization", authHeader);
  }
  const url = urlObj.toString();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(candidateUser ? { "X-User": candidateUser } : {}),
      ...(candidateRole ? { "X-Role": candidateRole } : {}),
    },
    body: JSON.stringify(payload),
  });

  return raw ? res : res.json();
},


    unitPayload(unit) {
  return {
    title: unit.title,
    slots: (unit.slots || []).map(s => ({
      id: s?.id ?? null,
      name: s?.name ?? null,
      role: s?.role || "",
      fireteam: this.normalizeFireteamKey(s?.fireteam || s?.fireTeam || s?.ft || ""),
      cert: s?.cert || "",
      disposable: !!s?.disposable,
    })),
  };
},


    async fetchRemoteMeta(unitKey) {
  if (!this.apiBase || !unitKey) return;
  try {
    const resp = await this.apiPost("config:get", { unitId: unitKey });
    const { ok, data } = resp || {};
    if (!ok || !data) return;
    this.remoteMeta = {
      ...this.remoteMeta,
      [unitKey]: {
        savedBy: (data.user || data.savedBy || "").trim(),
        savedAt: data.savedAt || data.updatedAt || data.timestamp || "",
      },
    };
    this.versions = { ...this.versions, [unitKey]: Number(data.version || 0) };
  } catch {}
},

async loadRemote(unitKey) {
      if (!unitKey) return;
      this.apiError = ""; this.busy = true;
      try {
        const resp = await this.apiPost("config:get", { unitId: unitKey });
        const { ok, data, error } = resp || {};
        if (!ok) throw new Error(error || "Load failed");
        if (!data) { this.apiError = "No remote config yet for this Chalk."; return; }
        let nextSlots = this.parseConfigJSONSlots(data);
        if (!nextSlots.length) nextSlots = this.extractSlotsFromAny(data);
        const idx = this.plan.units.findIndex(u => u.key === unitKey);
        if (idx === -1) return;
        const curr = this.plan.units[idx];
        const toApply = (nextSlots.length ? nextSlots : curr.slots).map(s => ({
          ...s,
          fireteam: this.normalizeFireteamKey(s?.fireteam || s?.fireTeam || s?.ft || ""),
          origStatus: s.id ? "FILLED" : "VACANT"
        }));
        const padded = this.isChalk(curr.title) ? toApply : toApply;
        const nextUnit = { ...curr, slots: this.sortSlotsForUnit(curr, padded) };
        this.plan.units = this.plan.units.map((u, i) => (i === idx ? nextUnit : u));
        this.versions = { ...this.versions, [unitKey]: Number(data.version || 0) };
        this.triggerFlicker(0);
      } catch (e) {
        this.apiError = String(e.message || e);
      } finally { this.busy = false; }
    },

    async saveRemote(unitKey) {
      if (!unitKey) return;
      const unit = this.plan.units.find(u => u.key === unitKey);
      if (!unit) return;
      this.apiError = ""; this.busy = true;
      try {
        const expectedVersion = this.versions[unitKey];
        const payload = this.unitPayload(unit);
        const res = await this.apiPost("config:save", { unitId: unitKey, config: payload, expectedVersion });
        if (res.conflict && res.current) {
          this.apiError = "Remote conflict. Reload the remote chalk, then Save again to overwrite.";
          this.versions = { ...this.versions, [unitKey]: Number(res.current.version || 0) };
          return;
        }
        if (!res.ok) throw new Error(res.error || "Save failed");
        this.versions = { ...this.versions, [unitKey]: Number(res.data?.version || 0) };
      } catch (e) {
        const msg = String(e.message || e);
        if (/FORBIDDEN/i.test(msg)) this.apiError = "You are not authorized to save.";
        else if (/UNAUTHORIZED/i.test(msg)) this.apiError = "Save rejected (unauthorized). If your execUrl points directly to Apps Script, use /.netlify/functions/gas (proxy) so staff headers reach the backend.";
        else this.apiError = msg;
      } finally { this.busy = false; }
    },

    /* helpers & transforms */
    isPointsUnit(title) { const t = String(title || "").toLowerCase(); return /\bchalk\s*[1-4]\b/.test(t); },
    triggerFlicker(delayMs = 0) { this.animateView = false; this.animationDelay = `${delayMs}ms`; this.$nextTick(() => requestAnimationFrame(() => (this.animateView = true))); },
    switchUnit(key) { if (!key || key === this.detailKey) return; this.detailKey = key; this.detailError = ""; this.triggerFlicker(0); },
    persistPlan() { try { sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.plan)); } catch {} },
    normalizeRole(txt) {
      const t = String(txt || "").toLowerCase().trim();
      if (/\bsquad\s*lead(er)?\b|\bsl\b|\bactual\b/.test(t)) return "squad lead";
      if (/\bteam\s*lead(er)?\b|\btl\b/.test(t)) return "team leader";
      if (/\b(corps?man|medic)\b/.test(t)) {
        const m = t.match(/\b(corps?man|medic)\s*(\d+)\b/);
        if (m && m[2]) return Number(m[2]) === 2 ? "corpsman 2" : "corpsman 1";
        return "corpsman 1";
      }
      return t;
    },
    rolePriority(role) { const key = this.normalizeRole(role); const idx = this.ROLE_ORDER.indexOf(key); return idx === -1 ? 10000 : idx; },
    sortSlotsByRole(slots) { return slots.map((s,i)=>({s,i,p:this.rolePriority(s.role)})).sort((a,b)=>a.p-b.p||a.i-b.i).map(x=>x.s); },

    sortSlotsByFireteam(slots, fireteams) {
      const list = Array.isArray(slots) ? slots.slice() : [];
      const unassignedKey = "__unassigned__";

      const normalize = (v) => this.normalizeFireteamKey(v);
      const orderRaw = (Array.isArray(fireteams) ? fireteams : []).map(x => String(x || "").trim()).filter(Boolean);
      const orderNorm = [];
      const seenOrder = new Set();
      orderRaw.forEach(ft => {
        const k = normalize(ft);
        if (!k) return;
        if (seenOrder.has(k)) return;
        seenOrder.add(k);
        orderNorm.push(k);
      });

      // Force Alpha (1) then Bravo (2) at the top if present anywhere.
      const preferred = [];
      const has1 = orderNorm.includes("1") || list.some(s => normalize(s?.fireteam) === "1");
      const has2 = orderNorm.includes("2") || list.some(s => normalize(s?.fireteam) === "2");
      if (has1) preferred.push("1");
      if (has2) preferred.push("2");
      orderNorm.forEach(k => { if (!preferred.includes(k)) preferred.push(k); });

      const orderSet = new Set(preferred);
      const groups = new Map();

      const push = (k, s) => {
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(s);
      };

      list.forEach(s => {
        const ftKey = normalize(String(s?.fireteam || "").trim());
        push(ftKey || unassignedKey, s);
      });

      const unknown = [];
      for (const k of groups.keys()) {
        if (k !== unassignedKey && !orderSet.has(k)) unknown.push(k);
      }
      unknown.sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        const aIsNum = Number.isFinite(na) && String(a).trim() === String(na);
        const bIsNum = Number.isFinite(nb) && String(b).trim() === String(nb);
        if (aIsNum && bIsNum) return na - nb;
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return String(a).localeCompare(String(b));
      });

      const finalOrder = [...preferred, ...unknown, unassignedKey];
      const out = [];
      finalOrder.forEach(k => {
        const g = groups.get(k);
        if (!g || !g.length) return;
        const sorted = typeof this.sortSlotsWithinFireteam === "function" ? this.sortSlotsWithinFireteam(g) : g;
        out.push(...sorted);
      });

      return out;
    },

    sortSlotsForUnit(unit, slots) {
      const u = unit || {};
      const title = String(u.title || u.squad || "").trim();
      const list = Array.isArray(slots) ? slots : [];
      if (this.isChalk(title)) {
        const fireteams = Array.isArray(u.fireteams) ? u.fireteams : [];
        return this.sortSlotsByFireteam(list, fireteams);
      }
      return this.sortSlotsByRole(list);
    },

    extractCertsFromMember(member) {
      const arr = member?.certifications;
      if (Array.isArray(arr) && arr.length) {
        const out = [];
        for (let i = 0; i < Math.min(arr.length, this.certLabels.length); i++) {
          const v = arr[i];
          const truthy = v === true || v === 1 || v === "1" || String(v).toUpperCase() === "Y";
          if (truthy) out.push(this.certLabels[i]);
        }
        return [...new Set(out)];
      }
      if (arr && typeof arr === "object") {
        const out = [];
        for (const [k, v] of Object.entries(arr)) {
          const truthy = v === true || v === 1 || v === "1" || String(v).toUpperCase() === "Y";
          if (!truthy) continue;
          const label = this.bestCertLabelMatch(k);
          if (label) out.push(label);
        }
        return [...new Set(out)];
      }
      const raw = member?.certs || member?.skills || member?.cert || "";
      if (typeof raw === "string" && raw.trim()) {
        const tokens = raw.split(/[;,/|]/g).map(s => s.trim()).filter(Boolean);
        return [...new Set(tokens.map(this.bestCertLabelMatch).filter(Boolean))];
      }
      if (Array.isArray(raw)) { return [...new Set(raw.map(this.bestCertLabelMatch).filter(Boolean))]; }
      return [];
    },
    bestCertLabelMatch(name) {
      const n = String(name || "").trim().toLowerCase();
      const map = {
        rifleman:"Rifleman", mg:"Machine Gunner", machinegunner:"Machine Gunner","machine gunner":"Machine Gunner",
        "anti tank":"Anti Tank", at:"Anti Tank", corpsman:"Corpsmen", medic:"Corpsmen","combat engineer":"Combat Engineer",
        engineer:"Combat Engineer", marksman:"Marksman", breacher:"Breacher", grenadier:"Grenadier", pilot:"Pilot",
        rto:"RTO", pj:"PJ", nco:"NCO", officer:"Officer",
      };
      if (map[n]) return map[n];
      for (const label of this.certLabels) if (n.includes(label.toLowerCase())) return label;
      return "";
    },
    getCertsForPersonId(personId) { const p = this.personnel.find(pp => String(pp.id) === String(personId)); return p?.certs || []; },
    getAssignableCertsForPersonId(personId) {
      const certs = Array.isArray(this.getCertsForPersonId(personId)) ? this.getCertsForPersonId(personId) : [];
      const out = [...new Set(certs.map(c => String(c || "").trim()).filter(Boolean))];
      const mgIdx = out.indexOf("Machine Gunner");
      if (mgIdx >= 0 && !out.includes(".50 cal machinegunner")) out.splice(mgIdx + 1, 0, ".50 cal machinegunner");
      return out;
    },

    hasCertId(personId, idx) {
      const p = this.personnel.find(pp => String(pp.id) === String(personId));
      if (!p) return false;
      const label = this.certLabels[idx];
      return (p.certs || []).includes(label);
    },
    certPointSuffix(label) { const pts = this.CERT_POINTS[label] ?? 0; return pts ? ` (+${pts})` : ""; },
    ensureSlotCert(slot, fallbackRole = "") {
      const existing = String(slot?.cert || "").trim();
      const labels = Array.isArray(this.certLabels) ? this.certLabels : [];

      if (existing && labels.includes(existing)) return existing;

      const r = String(fallbackRole || slot?.role || "").trim().toLowerCase();

      // Enforced defaults
      if (r.includes("squad lead") || r.includes("fireteam lead") || r.includes("team leader")) return "NCO";
      if (r.includes("corpsman")) return "Corpsmen";

      const certs = this.getCertsForPersonId(slot?.id) || [];
      if (certs[0] && labels.includes(certs[0])) return certs[0];

      const title = this.titleCase(String(fallbackRole || slot?.role || ""));
      if (title && labels.includes(title)) return title;
      return "";
    },
    titleCase(s) { const t = String(s || "").replace(/[_-]+/g, " ").trim(); if (!t) return ""; return t.replace(/\s+/g," ").toLowerCase().replace(/\b\w/g,m=>m.toUpperCase()); },

    rankWeight(rankRaw) {
      const r = this.rankLabel(rankRaw);
      if (!r) return 0;
      const k = String(r).replace(/[^a-z0-9]/gi, "").toUpperCase();

      // Enlisted / Marine-ish
      const map = {
        PVT: 1, PV2: 2, PFC: 3, LCPL: 4, CPL: 5, SGT: 6,
        SSG: 7, SSGT: 7, GYSGT: 8, GYSG: 8,
        SFC: 9, MSG: 10, MSgt: 10, "1SG": 10, FIRSTSGT: 10,
        MGYSGT: 11, MGYSG: 11, SGTMAJ: 12, SGM: 12, SMA: 13
      };

      // Navy corpsman ranks commonly used in sheets
      const navy = { HN: 3, HM3: 4, HM2: 5, HM1: 6, HMC: 7, HMCS: 8, HSC: 9, HSM: 10 };

      // Officers (generic)
      const off = { WO1: 20, CWO2: 21, CWO3: 22, CWO4: 23, CWO5: 24, "2LT": 25, "1LT": 26, LT: 26, CPT: 27, MAJ: 28, LTC: 29, COL: 30, GEN: 31 };

      return map[k] || navy[k] || off[k] || 0;
    },

    slotSortPriority(roleRaw) {
      const r = String(roleRaw || "").trim().toLowerCase();
      if (!r) return 10;
      if (r.includes("squad lead")) return 0;
      if (r.includes("fireteam lead") || r.includes("team leader")) return 1;
      if (r.includes("corpsman")) return 2;
      return 10;
    },

    sortSlotsWithinFireteam(slots) {
      const list = Array.isArray(slots) ? slots.slice() : [];
      return list.sort((a, b) => {
        const aVac = (!a?.id) || String(a?.origStatus || "").toUpperCase() === "VACANT";
        const bVac = (!b?.id) || String(b?.origStatus || "").toUpperCase() === "VACANT";
        if (aVac !== bVac) return aVac ? 1 : -1;

        const pa = this.slotSortPriority(a?.role);
        const pb = this.slotSortPriority(b?.role);
        if (pa !== pb) return pa - pb;

        // After role-priority: higher rank first.
        const ra = this.rankWeight(this.rankFor(a?.id));
        const rb = this.rankWeight(this.rankFor(b?.id));
        if (ra !== rb) return rb - ra;

        const na = String(a?.name || "").toLowerCase();
        const nb = String(b?.name || "").toLowerCase();
        return na.localeCompare(nb);
      });
    },


    normalizeFireteamKey(raw) {
      const s = String(raw || "").trim();
      if (!s) return "";
      const k = s.toLowerCase();
      if (k === "1" || k === "alpha" || /\bfire\s*team\s*1\b/.test(k) || /\bft\s*1\b/.test(k)) return "1";
      if (k === "2" || k === "bravo" || /\bfire\s*team\s*2\b/.test(k) || /\bft\s*2\b/.test(k)) return "2";
      const n = k.match(/^\s*(\d+)\s*$/);
      if (n && n[1]) return String(n[1]);
      return s;
    },

    fireteamLabel(slot) {
      const ftRaw = String(slot?.fireteam || "").trim();
      const key = this.normalizeFireteamKey(ftRaw);
      if (key === "1") return "FIRETEAM ALPHA";
      if (key === "2") return "FIRETEAM BRAVO";
      return ftRaw ? `FIRETEAM ${ftRaw}` : "UNASSIGNED";
    },

    isFireteamHeader(slot, idx, slots) {
      const list = slots || this.currentUnit?.slots || [];
      if (idx === 0) return true;
      const prev = list[idx - 1];

      const a = this.normalizeFireteamKey(prev?.fireteam);
      const b = this.normalizeFireteamKey(slot?.fireteam);

      return a !== b;
    },

    buildPersonnelPool(orbat) {
      const pool = [];
      (orbat || []).forEach(sq => {
        (sq.fireteams || []).forEach(ft => {
          (ft.slots || []).forEach((s, idx) => {
            if (s?.member) {
              const id = String(s.member.id ?? `${sq.squad}-${ft.name}-${idx}`);
              const certs = this.extractCertsFromMember(s.member);
              const rank = this.extractRank(s.member);
              const element = String(ft?.name || ft?.element || "").trim();
              pool.push({ id, name: String(s.member.name || "Unknown"), callsign: String(s.member.callsign || ""), role: String(s.role || s.member.slot || ""), certs, rank, element });
            }
          });
        });
      });
      const seen = new Set(); const out = [];
      for (const p of pool) if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
      return out;
    },
    isChalk(title) { return /\bchalk\s*\d+\b/i.test(String(title || "")); },
    padSlots(arr, min) { const out = arr.slice(); while (out.length < min) out.push({ id:null, name:null, role:"", origStatus:"VACANT", cert:"", disposable:false }); return out; },
    keyFromName(name) { return String(name || "").trim().toLowerCase().replace(/\s+/g, "-"); },
    filledCount(g) { if(!g) return 0; return g.slots.reduce((n, s) => n + (s.id ? 1 : 0), 0); },
    displayName(slot) { return slot.name || (slot.origStatus === "VACANT" ? "— Vacant —" : "— Empty —"); },

    buildUnitsFromOrbat(orbat) {
      const units = [];
      (orbat || []).forEach(sq => {
        const key = this.keyFromName(sq.squad);
        const fireteams = (sq.fireteams || []).map(ft => String(ft.name || "").trim()).filter(Boolean);
        const slots = [];
        (sq.fireteams || []).forEach(ft => {
          (ft.slots || []).forEach(s => {
            const status = String(s?.status || (s?.member ? "FILLED" : "VACANT")).toUpperCase();
            const origStatus = ["VACANT", "CLOSED"].includes(status) ? status : "FILLED";
            const member = s?.member || null;
            const slot = { id: member?.id ? String(member.id) : null, name: member?.name || null, role: s?.role || member?.slot || "", fireteam: String(ft.name || "").trim(), origStatus, cert: "", disposable: false };
            if (slot.id) slot.cert = this.ensureSlotCert(slot, slot.role);
            slots.push(slot);
          });
        });
        let finalSlots = this.sortSlotsByFireteam(slots, fireteams);
        if (this.isChalk(sq.squad)) finalSlots = finalSlots;
        if (this.isPointsUnit(sq.squad)) units.push({ key, title: sq.squad, slots: finalSlots, fireteams });
      });
      return units;
    },

    buildUnitFromOrbatByKey(orbat, unitKey) {
      const unit = (orbat || []).find(sq => this.keyFromName(sq.squad) === unitKey);
      if (!unit) return null;
      const slots = [];
      (unit.fireteams || []).forEach(ft => {
        (ft.slots || []).forEach(s => {
          const status = String(s?.status || (s?.member ? "FILLED" : "VACANT")).toUpperCase();
          const origStatus = ["VACANT", "CLOSED"].includes(status) ? status : "FILLED";
          const member = s?.member || null;
          const slot = { id: member?.id ? String(member.id) : null, name: member?.name || null, role: s?.role || member?.slot || "", fireteam: String(ft.name || "").trim(), origStatus, cert: "", disposable: false };
          if (slot.id) slot.cert = this.ensureSlotCert(slot, slot.role);
          slots.push(slot);
        });
      });
      let finalSlots = this.sortSlotsByRole(slots);
      if (this.isChalk(unit.squad)) finalSlots = finalSlots;
      return { key: unitKey, title: unit.squad, slots: finalSlots };
    },

    calcUnitPoints(unit) {
      if (!unit || !unit.slots) return 0;
      return unit.slots.reduce((sum, s) => {
        if (!s.id) return sum;
        const certKey = String(s.cert || "").trim();
        const certPts = this.CERT_POINTS[certKey] ?? 0;
        const dispPts = s.disposable ? this.DISPOSABLE_COST : 0;
        return sum + certPts + dispPts;
      }, 0);
    },


    wouldExceedCap(unitKey, delta) {
      const unit = this.plan.units.find(u => u.key === unitKey);
      if (!unit) return false;
      return this.calcUnitPoints(unit) + delta > this.SQUAD_POINT_CAP;
    },

    openPicker(unitKey, slotIdx) {
      const g = this.plan.units.find(u => u.key === unitKey);
      if (!g || g.slots[slotIdx]?.origStatus === "CLOSED") return;
      this.picker = { ...this.picker, open: true, unitKey, slotIdx, query: "", onlyFree: false, sort: this.picker.sort || "name_asc" };
    },

    closePicker() { this.picker.open = false; },

    findAssignment(personId) {
      for (const g of this.plan.units) {
        const idx = g.slots.findIndex(s => String(s.id) === String(personId));
        if (idx >= 0) return { unitKey: g.key, slotIdx: idx, title: g.title };
      }
      return null;
    },

    formatAssignment(a) { return `${a.title} #${a.slotIdx + 1}`; },

    selectPersonnel(p) {
      if (!this.picker.open) return;
      const from = this.findAssignment(p.id);
      const gIdx = this.plan.units.findIndex(u => u.key === this.picker.unitKey);
      if (gIdx < 0) return;
      const g = this.plan.units[gIdx];
      const target = g.slots[this.picker.slotIdx];

      const available = this.getAssignableCertsForPersonId(p.id);
      const chosenCertDefault = available.includes(target.cert) ? target.cert : (available[0] || target.role || p.role || "");

      const prevPts = (this.CERT_POINTS[target.cert] ?? 0) + (target.disposable ? this.DISPOSABLE_COST : 0);
      const nextPts = (this.CERT_POINTS[chosenCertDefault] ?? 0);
      const delta = nextPts - prevPts;
      // Soft cap: allow over-cap; UI displays warnings.
      this.detailError = "";

      if (from && target?.id && !(from.unitKey === g.key && from.slotIdx === this.picker.slotIdx)) {
        const srcIdx = this.plan.units.findIndex(u => u.key === from.unitKey);
        const srcGroup = this.plan.units[srcIdx];
        const tmp = { ...target };
        const newTarget = { ...target, id: p.id, name: p.name, role: target.role || p.role || "", cert: chosenCertDefault, disposable: false };

        const newSrcSlots = srcGroup.slots.slice();
        newSrcSlots[from.slotIdx] = { ...newSrcSlots[from.slotIdx], id: tmp.id, name: tmp.name, cert: tmp.cert || this.ensureSlotCert(tmp, tmp.role), disposable: !!tmp.disposable };
        const newSrc = { ...srcGroup, slots: this.sortSlotsForUnit(srcGroup, newSrcSlots) };

        const newGSlots = g.slots.slice();
        newGSlots[this.picker.slotIdx] = newTarget;
        const newG = { ...g, slots: this.sortSlotsForUnit(g, newGSlots) };

        this.plan.units = this.plan.units.map((u, i) => (i === gIdx ? newG : i === srcIdx ? newSrc : u));
      } else {
        const newSlots = g.slots.slice();
        newSlots[this.picker.slotIdx] = { ...target, id: p.id, name: p.name, role: target.role || p.role || "", cert: chosenCertDefault, disposable: false };
        const newG = { ...g, slots: this.sortSlotsForUnit(g, newSlots) };
        this.plan.units = this.plan.units.map((u, i) => (i === gIdx ? newG : u));
      }

      this.persistPlan();
      this.closePicker();
    },

    clearCurrentSlot() { if (!this.picker.open) return; this.clearSlot(this.picker.unitKey, this.picker.slotIdx); },

    clearSlot(unitKey, slotIdx) {
      const idx = this.plan.units.findIndex(u => u.key === unitKey);
      if (idx < 0) return;

      const g = this.plan.units[idx];
      const slots = g.slots.slice();
      const prev = slots[slotIdx];
      if (!prev) return;

      const cleared = { ...prev, id: null, name: null, cert: "", disposable: false, origStatus: "VACANT" };
      const ft = String(prev?.fireteam || "").trim();

      // Remove from current position.
      slots.splice(slotIdx, 1);

      // Re-insert at the end of its fireteam group (or absolute end if unassigned).
      let insertAt = slots.length;
      if (ft) {
        for (let i = slots.length - 1; i >= 0; i--) {
          if (String(slots[i]?.fireteam || "").trim() === ft) { insertAt = i + 1; break; }
        }
      }
      slots.splice(insertAt, 0, cleared);

      // Keep ordering tidy inside fireteams.
      let ordered = this.sortSlotsByFireteam(slots, g.fireteams || []);

      // Ensure the cleared slot is at the very back of its fireteam.
      const cIdx = ordered.indexOf(cleared);
      if (cIdx >= 0) {
        ordered.splice(cIdx, 1);
        if (ft) {
          let after = ordered.length;
          for (let i = ordered.length - 1; i >= 0; i--) {
            if (String(ordered[i]?.fireteam || "").trim() === ft) { after = i + 1; break; }
          }
          ordered.splice(after, 0, cleared);
        } else {
          ordered.push(cleared);
        }
      }

      const newG = { ...g, slots: ordered };
      this.plan.units = this.plan.units.map((u, i) => (i === idx ? newG : u));
      this.persistPlan();
      this.detailError = "";
    },

    clearGroup(unitKey) {
      const idx = this.plan.units.findIndex(u => u.key === unitKey);
      if (idx < 0) return;

      const g = this.plan.units[idx];
      const emptied = g.slots.map(s => ({
        ...s,
        id: null,
        name: null,
        cert: "",
        disposable: false,
        origStatus: s.origStatus === "CLOSED" ? "CLOSED" : "VACANT",
      }));

      const newG = { ...g, slots: this.sortSlotsByFireteam(emptied, g.fireteams || []) };
      this.plan.units = this.plan.units.map((u, i) => (i === idx ? newG : u));
      this.persistPlan();
      this.detailError = "";
    },

    addSlot(unitKey, fireteamKey) {
      const idx = this.plan.units.findIndex(u => u.key === unitKey);
      if (idx < 0) return;
      const g = this.plan.units[idx];
      const newSlots = g.slots.slice();

      const ft = this.normalizeFireteamKey(fireteamKey);
      newSlots.push({
        id: null,
        name: null,
        role: "",
        fireteam: ft || "",
        origStatus: "VACANT",
        cert: "",
        disposable: false
      });

      const fireteams = Array.isArray(g.fireteams) ? g.fireteams : [];
      const sorted = this.isChalk(g.title)
        ? this.sortSlotsByFireteam(newSlots, fireteams)
        : this.sortSlotsByRole(newSlots);

      const newG = { ...g, slots: sorted };
      this.plan.units = this.plan.units.map((u, i) => (i === idx ? newG : u));
      this.persistPlan();
      this.triggerFlicker(idx);
    },

    removeSlot(unitKey, slotIdx) {
      const idx = this.plan.units.findIndex(u => u.key === unitKey);
      if (idx < 0) return;
      const g = this.plan.units[idx];
      const newSlots = g.slots.slice();
      newSlots.splice(slotIdx, 1);
      const newG = { ...g, slots: this.sortSlotsForUnit(g, newSlots) };
      this.plan.units = this.plan.units.map((u, i) => (i === idx ? newG : u));
      this.persistPlan();
      this.detailError = "";
    },

    onChangeCert(unitKey, slotIdx, nextCert) {
      const uIdx = this.plan.units.findIndex(u => u.key === unitKey);
      if (uIdx < 0) return;

      const unit = this.plan.units[uIdx];
      const slot = unit.slots[slotIdx];

      const prevKey = String(slot?.cert || "").trim();
      const nextKey = String(nextCert || "").trim();

      const prevPts = (this.CERT_POINTS[prevKey] ?? 0) + (slot.disposable ? this.DISPOSABLE_COST : 0);
      const nextPts = (this.CERT_POINTS[nextKey] ?? 0) + (slot.disposable ? this.DISPOSABLE_COST : 0);

      const delta = nextPts - prevPts;
      this.detailError = "";
      const newSlots = unit.slots.slice();
      newSlots[slotIdx] = { ...slot, cert: nextKey };

      const newU = { ...unit, slots: this.sortSlotsForUnit(unit, newSlots) };
      this.plan.units = this.plan.units.map((u, i) => (i === uIdx ? newU : u));
      this.persistPlan();
    },


    onToggleDisposable(unitKey, slotIdx, checked) {
      const uIdx = this.plan.units.findIndex(u => u.key === unitKey);
      if (uIdx < 0) return;
      const unit = this.plan.units[uIdx];
      const slot = unit.slots[slotIdx];
      const add = checked ? this.DISPOSABLE_COST : 0;
      const remove = !checked ? this.DISPOSABLE_COST : 0;
      const delta = add - remove;
      // Soft cap: allow over-cap; UI displays warnings.
      this.detailError = "";
      const newSlots = unit.slots.slice();
      newSlots[slotIdx] = { ...slot, disposable: checked === true };
      const newU = { ...unit, slots: newSlots };
      this.plan.units = this.plan.units.map((u, i) => (i === uIdx ? newU : u));
      this.persistPlan();
    },

    fillFromRoster(unitKey) {
      const rebuilt = this.buildUnitFromOrbatByKey(this.orbat, unitKey);
      if (!rebuilt) { this.detailError = "No matching unit in ORBAT."; return; }
      const idx = this.plan.units.findIndex(u => u.key === unitKey);
      if (idx < 0) return;
      const keepLen = Math.max(this.plan.units[idx].slots.length, rebuilt.slots.length);
      while (rebuilt.slots.length < keepLen) rebuilt.slots.push({ id: null, name: null, role: "", origStatus: "VACANT", cert: "", disposable: false });
      this.plan.units = this.plan.units.map((u, i) => (i === idx ? rebuilt : u));
      this.persistPlan();
      this.detailError = "";
      this.triggerFlicker(0);
    },
  },
  watch: {
    orbat: { deep: true, handler(newV) {
      this.personnel = this.buildPersonnelPool(newV || []);
      if (this.troopStatusByKey && Object.keys(this.troopStatusByKey).length) this.applyRefDataTroopMeta(this.troopStatusByKey);
      if (this.rankByTroopKey && Object.keys(this.rankByTroopKey).length) this.applyRankMapToPersonnel(this.rankByTroopKey);
      if (Array.isArray(this.troopRosterRows) && this.troopRosterRows.length) {
        this.troopRoster = this.buildTroopRoster(this.troopRosterRows);
        if (this.rankByTroopKey && Object.keys(this.rankByTroopKey).length) this.applyRankMapToTroopRoster(this.rankByTroopKey);
      }
      const oldKey = this.detailKey;
      this.ensureUnitsBuilt(newV || []);
      if (!this.plan.units.find(u => u.key === oldKey) && this.plan.units.length) {
        this.detailKey = this.plan.units[0].key;
      }
    }},
    detailKey: { immediate: true, handler(k) { if (k) this.fetchRemoteMeta(k); } },
  },
};
</script>

<style scoped>

/* Overview modal: remove any badge/background behind chalk titles */
#deploymentView .squad-modal.overview .overview-head .title{
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  border: 0 !important;
}
#deploymentView .squad-modal.overview .overview-head .left,
#deploymentView .squad-modal.overview .overview-head .meta{
  background: transparent !important;
}

/* =========================
   UNSC TERMINAL THEME PASS
   Visual-only: NO template/script changes.
   ========================= */

/* Window shell */
#deploymentView .deployment-window.section-container{
  border-radius: 16px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.92), rgba(3, 6, 10, 0.95));
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 26px rgba(120, 180, 255, 0.10),
    0 0 110px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  position: relative;
}

/* Scanlines + soft glow */
#deploymentView .deployment-window.section-container::before{
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
  opacity: 0.26;
  z-index: 0;
}
#deploymentView .deployment-window.section-container::after{
  content:"";
  position:absolute;
  inset:-20%;
  pointer-events:none;
  background: radial-gradient(circle at 30% 20%, rgba(120, 180, 255, 0.07), transparent 55%);
  opacity: .9;
  animation: depFlicker 2.8s infinite;
  z-index: 0;
}
@keyframes depFlicker{
  0%, 100% { transform: translate3d(0,0,0); opacity: .72; }
  12% { transform: translate3d(-1px, 1px, 0); opacity: .86; }
  24% { transform: translate3d(1px, -1px, 0); opacity: .70; }
  40% { transform: translate3d(0px, 2px, 0); opacity: .90; }
  65% { transform: translate3d(2px, 0px, 0); opacity: .78; }
}

/* Keep content above effects */
#deploymentView .header-shell,
#deploymentView .section-header,
#deploymentView .section-content-container{
  position: relative;
  z-index: 1;
}

/* Header chrome */
#deploymentView .header-shell{
  border-bottom: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0,0,0,0.16);
}

/* Neutralize clipped shape so it matches terminal window */
#deploymentView .section-header.clipped-medium-backward-pilot{
  clip-path: none !important;
  background: transparent !important;
}

/* Add window dots (no template change) */
#deploymentView .section-header::before{
  content:"";
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(170, 220, 255, 0.22);
  box-shadow:
    16px 0 0 rgba(170, 220, 255, 0.22),
    32px 0 0 rgba(170, 220, 255, 0.22);
  margin-right: 10px;
  flex: 0 0 auto;
  opacity: .95;
}
#deploymentView .section-header{
  padding: 12px 14px !important;
  gap: 10px !important;
}
#deploymentView .section-header img{
  width: 18px;
  height: 18px;
  opacity: .9;
  filter: drop-shadow(0 0 10px rgba(120,180,255,0.18));
}
#deploymentView .section-header h1{
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: rgba(190, 230, 255, 0.92);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* Remove rhombus flourish (visual only) */
#deploymentView .rhombus-back{ opacity: .15; filter: saturate(.9); }

/* Panel styling -> terminal glass */
#deploymentView .panel{
  border: 1px dashed rgba(170, 220, 255, 0.20) !important;
  background: rgba(0,0,0,0.22) !important;
  border-radius: 14px !important;
  box-shadow: 0 0 0 1px rgba(170,220,255,0.05) inset, 0 0 22px rgba(0,0,0,0.28);
}

/* Toolbar + dividers */
#deploymentView .detail-toolbar{
  border: 1px solid rgba(170, 220, 255, 0.14);
  background: rgba(0,0,0,0.14);
  border-radius: 12px;
  padding: 10px 10px;
}
#deploymentView .divider{
  background: rgba(170,220,255,0.18) !important;
}

/* Inputs/selects */
#deploymentView .select,
#deploymentView select,
#deploymentView .search,
#deploymentView .sort{
  background: rgba(5, 12, 20, 0.85) !important;
  border: 1px solid rgba(170,220,255,0.22) !important;
  color: rgba(226, 243, 255, 0.95) !important;
  border-radius: 10px !important;
  outline: none;
  box-shadow: 0 0 0 1px rgba(170,220,255,0.04) inset;
}
#deploymentView .select:focus,
#deploymentView select:focus,
#deploymentView .search:focus,
#deploymentView .sort:focus{
  box-shadow: 0 0 0 2px rgba(120,180,255,0.22);
}

/* Buttons: keep your existing styles but add terminal glow */
#deploymentView .btn{
  border-color: rgba(170,220,255,0.22) !important;
  background: linear-gradient(180deg, rgba(8,14,20,0.65), rgba(3,6,10,0.72)) !important;
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 18px rgba(120,180,255,0.08);
}
#deploymentView .btn:hover{
  border-color: rgba(170,220,255,0.55) !important;
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.08) inset,
    0 0 22px rgba(120,180,255,0.12);
}
#deploymentView .btn.primary{
  border-color: rgba(120,255,190,0.38) !important;
  background: linear-gradient(180deg, rgba(12,40,26,0.86), rgba(6,20,14,0.90)) !important;
  box-shadow:
    0 0 0 1px rgba(120,255,190,0.10) inset,
    0 0 22px rgba(120,255,190,0.08);
}
#deploymentView .btn.primary:hover{
  border-color: rgba(120,255,190,0.62) !important;
}

/* Chalk meta block */
#deploymentView .squad-modal-meta{
  border-bottom-color: rgba(170,220,255,0.22) !important;
}
#deploymentView .squad-tag{
  border-color: rgba(170,220,255,0.55) !important;
  color: rgba(190, 230, 255, 0.92) !important;
  background: transparent !important;
}

/* Member cards -> terminal tiles */
#deploymentView .member-card{
  border-left-color: rgba(170,220,255,0.55) !important;
  border-radius: 14px !important;
  background: rgba(0,0,0,0.26) !important;
  border: 1px solid rgba(170,220,255,0.14);
  box-shadow: 0 0 0 1px rgba(170,220,255,0.05) inset, 0 0 22px rgba(0,0,0,0.30);
}
#deploymentView .member-card.vacant{
  border-left-color: rgba(170,220,255,0.22) !important;
  background:
    repeating-linear-gradient(45deg, rgba(170,220,255,0.06) 0, rgba(170,220,255,0.06) 10px, transparent 10px, transparent 20px),
    rgba(0,0,0,0.22) !important;
}
#deploymentView .member-card.closed{
  background:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 8px, transparent 8px, transparent 16px),
    rgba(0,0,0,0.20) !important;
  border-left-color: rgba(170,220,255,0.16) !important;
}

/* Text palette */
#deploymentView .muted{ color: rgba(158, 197, 230, 0.90) !important; }
#deploymentView .member-header h3{ color: rgba(226, 243, 255, 0.95) !important; }
#deploymentView .rank-line{ color: rgba(158, 197, 230, 0.90) !important; }
#deploymentView .role-accent{ color: rgba(120,255,190,0.92) !important; }
#deploymentView .member-footer{ color: rgba(158,197,230,0.78) !important; }

/* Modals */
#deploymentView .squad-overlay{
  background: rgba(0,0,0,0.82) !important;
  backdrop-filter: blur(2px);
}
#deploymentView .squad-modal{
  border: 1px solid rgba(170,220,255,0.18);
  background: linear-gradient(180deg, rgba(8,14,20,0.92), rgba(3,6,10,0.96)) !important;
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 30px rgba(0,0,0,0.65);
}
#deploymentView .squad-close{
  border-color: rgba(170,220,255,0.22) !important;
  background: rgba(0,0,0,0.10) !important;
}

/* Pick rows / Overview cards */
#deploymentView .pick-row.compact,
#deploymentView .overview-card{
  border-color: rgba(170,220,255,0.18) !important;
  background: rgba(0,0,0,0.22) !important;
  border-radius: 14px !important;
}
#deploymentView .overview-head{
  background: rgba(0,0,0,0.14) !important;
  border-bottom-color: rgba(170,220,255,0.12) !important;
}

/* Scrollbars (match login/status) */
#deploymentView .deploy-scroll::-webkit-scrollbar,
#deploymentView .squad-modal-scroll::-webkit-scrollbar{
  width: 10px;
}
#deploymentView .deploy-scroll::-webkit-scrollbar-thumb,
#deploymentView .squad-modal-scroll::-webkit-scrollbar-thumb{
  background: rgba(90,140,180,0.55);
  border-radius: 999px;
}
#deploymentView .deploy-scroll::-webkit-scrollbar-track,
#deploymentView .squad-modal-scroll::-webkit-scrollbar-track{
  background: rgba(0,0,0,0.22);
}


#deploymentView { color: #e6f3ff; }

/* Shell / toolbar */
#deploymentView{
  display:grid;
  grid-template-columns:1fr;
  gap:1.2rem;
  align-items:stretch;
  width:calc(100dvw - 90px);
  height:calc(100dvh - 95px);
  min-height:0;
  overflow:hidden;
  padding:28px 18px calc(18px + env(safe-area-inset-bottom, 0px)) 18px;
  box-sizing:border-box;
}
.deployment-window.section-container{
  max-width:none !important;
  width:auto;
  height:100%;
  max-height:100%;
  min-height:0;
  margin:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  box-sizing:border-box; /* why: padding shouldn't push past viewport */
}
.header-shell{height:52px;overflow:hidden}
.section-header,.section-content-container{width:100%}
.deploy-scroll{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  scrollbar-gutter:stable both-edges;
  padding-right:.35rem;
  padding-bottom:calc(12px + env(safe-area-inset-bottom, 0px));
}

@media (max-width: 900px){
  #deploymentView{
    width:100%;
    height:auto;
    overflow:visible;
    padding-left:12px;
    padding-right:12px;
  }
  .deployment-window.section-container{height:auto;max-height:none}
  .deploy-scroll{overflow:visible;padding-right:0}
}


.panel{border:1px dashed rgba(30,144,255,0.35);background:rgba(0,10,30,0.18);border-radius:.6rem;padding:.8rem .9rem;overflow:visible}
.top-actions{display:flex;justify-content:flex-end;margin-bottom:.5rem}
.muted{color:#9ec5e6}.small{font-size:.86rem}
.detail-toolbar{display:flex;gap:.8rem;align-items:center;flex-wrap:wrap;margin-bottom:.8rem;justify-content:space-between}
.toolbar-left{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}
.toolbar-right{display:flex;gap:.6rem;align-items:center}
.chalk-picker{min-width:160px}
.divider{width:1px;height:18px;background:rgba(158,197,230,0.35);display:inline-block}
.warn{border:1px solid rgba(255,120,120,.5);background:rgba(90,0,0,.25);color:#ffdcdc;border-radius:.5rem;padding:.4rem .6rem}
.btn{appearance:none;border:1px solid rgba(30,144,255,0.35);background:linear-gradient(180deg,rgba(6,18,30,.75),rgba(2,10,20,.6));color:#dbeeff;padding:.42rem .7rem;border-radius:.5rem;font-size:.92rem;letter-spacing:.02em;cursor:pointer;transition:transform 80ms ease,background 120ms ease,border-color 120ms ease,box-shadow 120ms ease,opacity 120ms ease;box-shadow:inset 0 0 0 1px rgba(120,200,255,0.08)}
.btn:hover{background:linear-gradient(180deg,rgba(10,28,44,.85),rgba(2,12,20,.7));border-color:rgba(120,200,255,0.5)}
.btn:active{transform:translateY(1px) scale(0.995)}
.btn:focus-visible{outline:none;box-shadow:0 0 0 2px rgba(120,200,255,0.35)}
.btn[disabled]{opacity:.45;cursor:not-allowed}
.btn.small{padding:.32rem .55rem;font-size:.86rem;border-radius:.45rem}
.btn.xsmall{padding:.22rem .45rem;font-size:.80rem;border-radius:.42rem}
.btn.large{padding:.5rem 1rem;font-size:1.02rem;border-radius:.6rem;font-weight:700;letter-spacing:.02em}
.btn.primary{background:linear-gradient(180deg,rgba(8,40,22,.9),rgba(6,28,18,.85));border-color:rgba(90,220,160,0.45);box-shadow:inset 0 0 0 1px rgba(90,220,160,0.15)}
.btn.primary:hover{border-color:rgba(120,255,190,0.6);background:linear-gradient(180deg,rgba(10,50,28,.95),rgba(6,32,20,.9))}
.btn.ghost{background:rgba(0,10,30,0.25)}
.pts.big{color:#caffe9;border:1px solid rgba(120,255,190,.45);border-radius:.45rem;padding:.12rem .5rem}
.pts.big.over{color:#ffd4d4;border-color:rgba(255,140,140,.55)}
.section-content-container.animate{animation:contentEntry 260ms ease-out both}
@keyframes contentEntry{
  0%{opacity:0;filter:brightness(1.1) saturate(1.03) blur(1px)}
  60%{opacity:1;filter:brightness(1.0) saturate(1.0) blur(0)}
  80%{opacity:.98;filter:brightness(1.03)}
  100%{opacity:1;filter:none}
}

/* Cards */
.squad-modal-meta{display:flex;justify-content:space-between;align-items:center;margin:.2rem 0 .6rem;border-bottom:1px solid rgba(30,144,255,0.6);padding-bottom:.4rem}
.squad-modal-meta.invalid{border-bottom-color:rgba(255,190,80,0.9)}
.squad-title .subtitle{margin:.15rem 0 0;font-size:.95rem;color:#9ec5e6}
.loadout-status{margin-top:.35rem;display:flex;gap:.75rem;align-items:center;font-size:.85rem;text-transform:uppercase}
.loadout-status .points{color:#9ec5e6}.loadout-status .warn{color:rgba(255,190,80,0.95)}.loadout-status .ok{color:rgba(120,255,170,0.9)}
.squad-tag{border:2px solid #1e90ff;border-radius:.6rem;padding:.35rem .6rem;color:#1e90ff;font-weight:700}

/* grid */
.squad-members-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.95rem}
@media (max-width:1680px){.squad-members-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:1350px){.squad-members-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:980px){.squad-members-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:620px){.squad-members-grid{grid-template-columns:1fr}}

/* card */
.member-card{position:relative;background:rgba(0,10,30,0.95);border-radius:.4rem;border-left:4px solid #1e90ff;box-shadow:0 0 10px rgba(0,0,0,0.6);padding:.9rem 1.1rem;display:flex;flex-direction:column}
.member-card.vacant,.member-card.closed{border-left-color:rgba(30,144,255,0.35)}
.member-card.vacant{background:repeating-linear-gradient(45deg,rgba(30,144,255,0.06) 0,rgba(30,144,255,0.06) 10px,transparent 10px,transparent 20px),rgba(0,12,25,0.9);border-left-style:dashed}
.member-card.closed{filter:grayscale(85%);opacity:.6;background:repeating-linear-gradient(45deg,rgba(200,200,200,0.06) 0,rgba(200,200,200,0.06) 8px,transparent 8px,transparent 16px),repeating-linear-gradient(-45deg,rgba(200,200,200,0.04) 0,rgba(200,200,200,0.04) 8px,transparent 8px,transparent 16px),rgba(1,6,14,0.9)}
.member-card.closed .member-header h3,.member-card.closed .rank-line,.member-card.closed .detail-line,.member-card.closed .cert-label,.member-card.closed .cert-none,.member-card.closed .member-footer{opacity:.75}

/* header/body/footer */
.member-header{display:grid;grid-template-columns:1fr auto;align-items:center;gap:.9rem}
.member-header h3{margin:0;font-size:1.1rem;color:#e0f0ff;word-break:break-word}
.name-line{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.rank-line{margin:.15rem 0 0;font-size:.88rem;color:#9ec5e6;display:flex;gap:.6rem;flex-wrap:wrap}
.member-body{display:grid;grid-template-columns:1fr 1fr;gap:.9rem;margin-top:.6rem;font-size:.9rem}
.member-column p{margin:.18rem 0}
.member-footer{margin-top:.6rem;font-size:.75rem;color:#7aa7c7;display:flex;justify-content:space-between}

/* rank icons */
.rank-icon{ width: 44px; height: 44px; object-fit: contain; filter: drop-shadow(0 0 2px rgba(0,0,0,.5)); user-select:none; -webkit-user-drag:none; }
.rank-icon.small{ width:28px; height:28px; }

/* cert list */
.detail-line strong{color:#9ec5e6}
.role-accent{color:#55ff88;font-weight:600}
.primary-label{display:block;margin-bottom:.15rem;font-size:.85rem;color:#9ec5e6}
.loadout-row{margin-top:.4rem}
.loadout-select{width:100%;background:#040a14;border:1px solid rgba(30,144,255,.45);color:#dce6f1;border-radius:.3rem;padding:.25rem .35rem}
.cert-list{display:grid;grid-template-columns:20px 1fr;row-gap:.28rem}
.cert-row{display:contents}
.cert-checkbox{width:16px;height:16px;border:1px solid rgba(30,144,255,.6);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;margin-right:6px}
.cert-checkbox.checked{border-color:rgba(120,255,170,.9);box-shadow:0 0 6px rgba(120,255,170,.25) inset}
.checkbox-dot{width:10px;height:10px;background:rgba(120,255,170,.95);border-radius:2px;display:block}

/* picker */
.squad-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center}
.squad-modal{background-color:#050811;color:#dce6f1;width:95vw;max-width:1200px;max-height:90vh;border-radius:.8rem;box-shadow:0 0 24px rgba(0,0,0,0.9);padding:1.1rem 1.2rem 1.2rem;display:flex;flex-direction:column}
.squad-modal.compact{max-width:1000px}
.squad-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem}
.squad-close{background:transparent;border:1px solid rgba(220,230,241,0.4);color:#dce6f1;border-radius:999px;padding:.2rem .75rem;font-size:1rem;cursor:pointer}
.compact-header{display:flex;justify-content:space-between;align-items:center}
.picker-toolbar{display:flex;gap:.8rem;align-items:center;padding:.4rem 0 .2rem}
.search{flex:1;min-width:260px;padding:.4rem .6rem;border:1px solid rgba(30,144,255,.45);border-radius:.35rem;background:#040a14;color:#e6f3ff}
.sort{min-width:180px;background:#040a14;border:1px solid rgba(30,144,255,.45);color:#e6f3ff;border-radius:.35rem;padding:.3rem .4rem}
.check{display:flex;align-items:center;gap:.4rem}.check .check-label{opacity:.9}
.smallish{font-size:.9rem}
.pick-row.compact{display:grid;grid-template-columns:1fr 1fr auto;align-items:center;gap:.6rem;background:rgba(10,18,30,0.55);border:1px solid rgba(30,144,255,.25);border-radius:.5rem;padding:.45rem .6rem;margin:.35rem 0}
.pick-row.assigned{background:rgba(30,144,255,0.08)}
.row-left{display:flex;align-items:center;gap:.5rem}
.row-left .name{font-weight:700;letter-spacing:.02em}
.row-mid{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;color:#9ec5e6}
.row-mid .chip{border:1px solid rgba(30,144,255,.45);border-radius:.35rem;padding:.05rem .4rem}
.row-right{display:flex;justify-content:flex-end}

/* Overview */
.squad-modal.overview{max-width:1400px}
.overview-grid.two-by-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
@media (max-width:1080px){.overview-grid.two-by-two{grid-template-columns:1fr}}
.overview-card{background:rgba(6,12,24,.7);border:1px solid rgba(30,144,255,.35);border-radius:.6rem;overflow:hidden;display:flex;flex-direction:column}
.overview-head{display:flex;justify-content:space-between;gap:.6rem;align-items:center;padding:.6rem .8rem;background:rgba(8,18,30,.85);border-bottom:1px solid rgba(30,144,255,.25)}
.overview-head .title{font-weight:800;letter-spacing:.03em}
.overview-head .meta{display:flex;gap:.45rem;flex-wrap:wrap;color:#9ec5e6}
.overview-body{padding:.6rem .8rem}
.slot-row{display:flex;justify-content:space-between;border-bottom:1px dashed rgba(30,144,255,.2);padding:.28rem 0}
.slot-row:last-child{border-bottom:none}
.slot-left{display:flex;gap:.5rem;align-items:center}
.slot-name{font-weight:600}
.slot-id{color:#9ec5e6;font-size:.9rem}
.slot-right{display:flex;gap:.5rem;align-items:center}
.slot-cert{color:#9ec5e6}
.slot-disp{border:1px solid rgba(120,255,170,.45);color:#caffe9;border-radius:.3rem;padding:.05rem .35rem;font-size:.8rem}
.overview-empty{text-align:center;color:#9ec5e6;padding:.5rem 0}


/* Picker list: show a real scrollbar */
.squad-modal-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;scrollbar-gutter:stable both-edges;padding-right:.35rem}
.squad-modal-scroll::-webkit-scrollbar{width:10px}
.squad-modal-scroll::-webkit-scrollbar-thumb{background:rgba(158,197,230,0.35);border-radius:999px}
.squad-modal-scroll::-webkit-scrollbar-track{background:rgba(0,0,0,0.22)}

/* Fireteam separators inside the grid */
.fireteam-row{grid-column:1 / -1;display:flex;align-items:center;gap:.6rem;padding:.35rem .55rem;border:1px solid rgba(158,197,230,0.22);border-radius:.55rem;background:rgba(3,8,16,0.55)}
.fireteam-title{font-weight:700;letter-spacing:.08em;font-size:.9rem;color:#bfe3ff}

#deploymentView{
  margin-top: 32px;
}


/* Match login terminal header (icon shell + title) */
#deploymentView .term-hdr.view-hdr .term-title{
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(190, 230, 255, 0.92);
  opacity: 1;
}


.warn-inline{ margin-left: .5rem; font-weight: 800; }
</style>
