<!-- /src/App.vue -->
<template>
  <div v-if="showLogin" class="login-overlay" :class="{ fading: isFading }">
    <div class="term">
      <div class="term-hdr">
        <span class="hdr-icon" aria-hidden="true"></span>
        <div class="term-title">{{ branding.loginTerminalTitle }}</div>
        <div class="term-stamp">{{ stamp }}</div>
      </div>

      <div class="term-body">
        <div class="scanlines" aria-hidden="true"></div>
        <div class="flicker" aria-hidden="true"></div>

        <div class="logo-ghost" aria-hidden="true">
          <img :src="branding.ghostLogo" alt="" />
        </div>

        <!-- Ambient terminal feed (scrolls after 5 lines) -->
        <div class="typed-window">
          <div class="typed" v-html="typedHtml"></div>
        </div>

        <div class="gate">
          <div class="gate-title">{{ loginUi.gateTitle }}</div>

          <div class="login-options-wrap">
            <div class="login-options">
              <button class="login-option" :disabled="isFading" @click="memberLogin">
                <div class="opt-title">{{ loginUi.memberTitle }}</div>
                <div class="opt-desc">{{ loginUi.memberDesc }}</div>
              </button>

              <button class="login-option" :disabled="isFading" @click="openAdminLogin">
                <div class="opt-title">{{ loginUi.staffTitle }}</div>
                <div class="opt-desc">{{ loginUi.staffDesc }}</div>
              </button>
            </div>
          </div>

          <div class="hint dim">
            {{ loginUi.legalHint }}
          </div>
        </div>
      </div>

      <div class="term-ftr dim">
        <span>{{ loginFooter[0] }}</span>
        <span>{{ loginFooter[1] }}</span>
        <span>{{ loginFooter[2] }}</span>
        <span>{{ loginFooter[3] }}</span>
      </div>
    </div>

    <AdminLoginModal
      v-if="showAdminModal"
      @close="closeAdminLogin"
      @success="onAdminLoginSuccess"
    />
  </div>

  <template v-else>
    <div class="page-wrapper">
      <Header :planet-path="planetPath" :class="{ animate: animate }" :header="header" />
      <Sidebar :animate="animate" :class="{ animate: animate }" />
    </div>

    <div id="router-view-container">
      <!-- transition intentionally removed -->
      <router-view
        :key="$route.fullPath"
        :animate="animate"
        :initial-slug="initialSlug"
        :missions="missions"
        :events="events"
        :members="members"
        :orbat="orbat"
        :reserves="reserves"
      />
    </div>
  </template>

  <audio ref="startupAudio" preload="auto">
    <source src="/sound/startup.ogg" type="audio/ogg" />
  </audio>
</template>

<script>
import Header from "./components/layout/Header.vue";
import Sidebar from "./components/layout/Sidebar.vue";
import AdminLoginModal from "@/components/modals/AdminLoginModal.vue";
import Config from "@/config/unit-config.json";
import { getSheetUrls, getTerminalFeed } from "@/config/runtimeConfig";
import Papa from "papaparse";

export default {
  name: "App",
  components: { Header, Sidebar, AdminLoginModal },
  data() {
    return {
      // --- existing (working) auth overlay state ---
      showLogin: true,
      isFading: false,
      showAdminModal: false,

      // --- added: terminal ambience state (NO changes to data loading logic) ---
      feedPool: getTerminalFeed(),
      typedLines: [],
      currentTarget: "",
      currentText: "",
      currentCharIndex: 0,
      bootTimer: null,
      stamp: "",
      maxLines: 5,              // start scrolling after first 5 committed lines
      interLinePauseMs: 320,    // slightly longer line pause to match slower typing
      blankLineChance: 0.08,
      lineRepeatAvoid: 6,
      lastPickIndices: [],

      // --- existing (working) config/data ---
      animate: Config.animate,
      initialSlug: Config.initialSlug,
      planetPath: Config.planetPath,
      header: Config.header,

      missions: [],
      events: [],
      members: [],
      orbat: [],
      reserves: []
    };
  },

  computed: {
    branding() {
      return Config.branding || {};
    },
    loginUi() {
      return Config.ui?.login || {};
    },
    loginFooter() {
      const f = Config.ui?.login?.footer;
      return Array.isArray(f) && f.length ? f : ["SYS: OK","IFF: VALID","NET: LINK","SEC: GREEN"];
    },
    documentTitleSuffix() {
      return Config.branding?.documentTitleSuffix || "BRIEFING";
    },

    // caret is inline on the active typing line (not floating on its own line)
    typedHtml() {
      const escape = (s) =>
        String(s)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");

      const lineClass = (l) => (String(l || "").trim().startsWith("»") ? "line dim" : "line");

      const committed = this.typedLines
        .map((l) => {
          if (l === "") return `<div class="line spacer"></div>`;
          return `<div class="${lineClass(l)}">${escape(l)}</div>`;
        })
        .join("");

      // If we deliberately picked a blank spacer as the next target, show caret alone.
      if (this.currentTarget === "") {
        return `${committed}<div class="line dim"><span class="caret"></span></div>`;
      }

      // Live typing line + caret appended inline
      const liveText = escape(this.currentText || "");
      const liveCls = lineClass(this.currentTarget);
      return `${committed}<div class="${liveCls}">${liveText}<span class="caret"></span></div>`;
    }
  },

  created() {
    // --- untouched: your working init logic ---
    this.setTitleFavicon(`${Config.defaultTitle} ${this.documentTitleSuffix}`.trim(), Config.icon);

    // preload markdown
    this.importMissions(import.meta.glob("@/assets/missions/**/*.md", { query: "?raw", import: "default" }));
    this.importEvents(import.meta.glob("@/assets/events/*.md", { query: "?raw", import: "default" }));

    // async CSVs
    const { membersCsvUrl: membersUrl, refDataCsvUrl: refDataUrl, opsCsvUrl: opsUrl } = getSheetUrls();

    this.loadMembersCSV(membersUrl)
      .then(() => this.loadRefDataCSV(refDataUrl))
      .then(() => this.loadOpsCSV(opsUrl).catch((err) => console.warn("Ops CSV failed; continuing.", err)));

    // if already authenticated earlier, skip overlay
    const role = sessionStorage.getItem("authRole");
    if (role === "member" || role === "staff") {
      this.showLogin = false;
    }
  },

  mounted() {
    // --- added: terminal ambience start (does not touch app data loading) ---
    this.updateStamp();
    this.seedInitialFeed();
    this.startAmbientFeed();
  },

  beforeUnmount() {
    if (this.bootTimer) window.clearTimeout(this.bootTimer);
  },

  methods: {
    // --- added: ambience helpers ---
    updateStamp() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      this.stamp = `UTC ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    },

    // Start typing from the very beginning (no pre-seeded lines)
    seedInitialFeed() {
      if (!this.showLogin) return;

      this.typedLines = [];
      this.currentText = "";
      this.currentCharIndex = 0;

      // Force the very first line to begin at character 1
      this.currentTarget = this.feedPool[0] || "SECURE MILNET // READY";

      // reset recent picks
      this.lastPickIndices = [];
    },

    pickNextTarget() {
      if (Math.random() < this.blankLineChance) {
        this.currentTarget = "";
        this.currentText = "";
        this.currentCharIndex = 0;
        return;
      }

      const poolLen = this.feedPool.length;
      let idx = Math.floor(Math.random() * poolLen);
      let guard = 0;
      while (this.lastPickIndices.includes(idx) && guard < 20) {
        idx = Math.floor(Math.random() * poolLen);
        guard += 1;
      }

      this.lastPickIndices.push(idx);
      if (this.lastPickIndices.length > this.lineRepeatAvoid) this.lastPickIndices.shift();

      const base = this.feedPool[idx];
      this.currentTarget = this.withTelemetry(base);
      this.currentText = "";
      this.currentCharIndex = 0;
    },

    withTelemetry(line) {
      const pad = (n) => String(n).padStart(2, "0");
      const now = new Date();
      const t = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
      const hex = () => Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
      const pct = () => `${Math.floor(80 + Math.random() * 20)}%`;

      if (line.includes("TELEMETRY")) return `» TELEMETRY: SYNCHRONIZED // ${pct()} // T+${t}`;
      if (line.includes("SATCOM")) return `» SATCOM: UPLINK STABLE // CH-${1 + Math.floor(Math.random() * 6)} // ${t}`;
      if (line.includes("PACKET INTEGRITY")) return `» PACKET INTEGRITY: PASS // CRC ${hex()}-${hex()} // ${t}`;
      if (line.includes("EDGE CACHE")) return `» EDGE CACHE: PRIMED // SECTOR ${hex()} // ${t}`;
      if (line.includes("INTRUSION MONITOR")) return `» INTRUSION MONITOR: ARMED // WATCH ${hex()} // ${t}`;
      if (line.includes("IFF PACKET")) return `» IFF PACKET: RECEIVED // TAG ${hex()} // ${t}`;
      return line;
    },

    trimToWindow() {
      // start "scrolling" immediately after first 5 committed lines
      if (this.typedLines.length > this.maxLines) {
        this.typedLines.splice(0, this.typedLines.length - this.maxLines);
      }
    },

    commitCurrentLine() {
      this.typedLines.push(this.currentTarget === "" ? "" : this.currentTarget);
      this.trimToWindow();
    },

    startAmbientFeed() {
      if (!this.showLogin) return;

      // half-speed typing (increase delays)
      const minDelay = 24;
      const maxDelay = 60;

      const tick = () => {
        this.updateStamp();

        if (!this.showLogin) {
          this.bootTimer = null;
          return;
        }

        if (this.currentTarget === "") {
          this.commitCurrentLine();
          this.pickNextTarget();
          this.bootTimer = window.setTimeout(tick, Math.max(180, this.interLinePauseMs));
          return;
        }

        this.currentText = this.currentTarget.slice(0, this.currentCharIndex + 1);
        this.currentCharIndex += 1;

        if (this.currentCharIndex >= (this.currentTarget || "").length) {
          this.commitCurrentLine();
          this.pickNextTarget();
          this.bootTimer = window.setTimeout(tick, this.interLinePauseMs);
          return;
        }

        const jitter = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
        const extra = Math.random() < 0.06 ? 140 : 0;
        this.bootTimer = window.setTimeout(tick, jitter + extra);
      };

      tick();
    },

    // --- existing (working) login methods (UNCHANGED) ---
    memberLogin() {
      if (this.isFading) return;
      sessionStorage.setItem("authRole", "member");
      this.fadeAndEnter("/status");
    },

    openAdminLogin() {
      if (this.isFading) return;
      this.showAdminModal = true;
    },
    closeAdminLogin() {
      this.showAdminModal = false;
    },
    onAdminLoginSuccess() {
      sessionStorage.setItem("authRole", "staff");
      this.showAdminModal = false;
      this.fadeAndEnter("/admin");
    },

    fadeAndEnter(targetPath) {
      this.isFading = true;

      // stop ambience loop cleanly once we commit to leaving the login overlay
      if (this.bootTimer) {
        window.clearTimeout(this.bootTimer);
        this.bootTimer = null;
      }

      const a = this.$refs.startupAudio;
      if (a && typeof a.play === "function") {
        a.currentTime = 0;
        a.play().catch(() => {});
      }

      setTimeout(() => {
        this.showLogin = false;
        this.isFading = false;
        const curr = this.$router?.currentRoute?.value?.path;
        if (curr !== targetPath) this.$router.push(targetPath);
      }, 800);
    },

    // --- everything below is your working version (UNCHANGED) ---
    normalize(str) {
      return String(str || "").replace(/"/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    },
    setTitleFavicon(title, favicon) {
      document.title = title;
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    },

    loadOpsCSV(opsUrl) {
      return new Promise((resolve) => {
        Papa.parse(opsUrl, {
          download: true,
          skipEmptyLines: true,
          header: false,
          complete: (results) => {
            const rows = (results.data || []).slice(1);
            const opsMap = {};
            rows.forEach((row) => {
              const rawName = String(row[0] || "").trim();
              const rawOps = String(row[2] || "").trim();
              if (!rawName) return;
              const ops = Number(rawOps);
              if (Number.isNaN(ops)) return;
              const quoted = rawName.match(/"([^"]+)"/);
              const nameCore = quoted ? quoted[1] : rawName;
              const key = String(nameCore).replace(/"/g, "").replace(/\s+/g, " ").trim().toLowerCase();
              opsMap[key] = ops;
            });
            (this.members || []).forEach((m) => {
              const key = String(m.name || "").replace(/"/g, "").replace(/\s+/g, " ").trim().toLowerCase();
              m.opsAttended = opsMap[key] ?? null;
            });
            resolve();
          },
          error: () => resolve()
        });
      });
    },

    rankKey(rank) { return String(rank || "").trim().toUpperCase().replace(/\s+/g, ""); },
    promotionLadderFor(rank) {
      const r = this.rankKey(rank);
      return ({
        PVT:  { nextAt: 2,  nextRank: "PFC" },
        PFC:  { nextAt: 10, nextRank: "SPC" },
        SPC:  { nextAt: 20, nextRank: "SPC2" },
        SPC2: { nextAt: 30, nextRank: "SPC3" },
        SPC3: { nextAt: 40, nextRank: "SPC4" },
        SPC4: { nextAt: 50, nextRank: null },
        HA:   { nextAt: 2,  nextRank: "HN" },
        HN:   { nextAt: 10, nextRank: "HM3" },
        HM3:  { nextAt: 20, nextRank: "HM2" },
        HM2:  { nextAt: 30, nextRank: null },
        CWO2: { nextAt: 10, nextRank: "CWO3" },
        CWO3: { nextAt: 20, nextRank: "CWO4" },
        CWO4: { nextAt: 30, nextRank: null }
      })[r] || null;
    },
    opsToNextPromotion(member) {
      const ops = Number(member?.opsAttended);
      if (!Number.isFinite(ops)) return null;
      const ladder = this.promotionLadderFor(member?.rank);
      if (!ladder || !ladder.nextAt) return null;
      return Math.max(0, ladder.nextAt - ops);
    },
    nextPromotionRank(member) {
      const ladder = this.promotionLadderFor(member?.rank);
      return ladder?.nextRank || null;
    },

    loadMembersCSV(csvUrl) {
      return new Promise((resolve, reject) => {
        Papa.parse(csvUrl, {
          download: true,
          skipEmptyLines: true,
          header: false,
          complete: (results) => {
            const rows = (results.data || []).slice(2);
            const CERT_COLUMNS = 13;
            const usedUNSCIds = new Set();
            this.members = rows
              .map((row) => {
                const name = String(row[1] || "").trim();
                if (!name) return null;
                const oldId = String(row[4] || "").trim();
                return {
                  rank: String(row[0] || "").trim(),
                  name,
                  joinDate: String(row[3] || "").trim(),
                  id: this.makeUNSCId(oldId, name, usedUNSCIds),
                  certifications: row
                    .slice(5, 5 + CERT_COLUMNS)
                    .map((c) => (String(c || "").trim().toUpperCase() === "Y" ? "Y" : "N")),
                  squad: "",
                  fireteam: "",
                  slot: "",
                  opsAttended: 0
                };
              })
              .filter(Boolean);
            resolve(this.members);
          },
          error: reject
        });
      });
    },

    loadRefDataCSV(csvUrl) {
      return new Promise((resolve, reject) => {
        Papa.parse(csvUrl, {
          download: true,
          skipEmptyLines: false,
          header: false,
          complete: (results) => {
            const rows = results.data || [];
            const findCol = (row, names) => {
              const wanted = names.map((n) => this.normalize(n));
              return row.findIndex((c) => wanted.includes(this.normalize(c)));
            };

            let membershipHeaderRowIndex = -1, memberCol = -1, squadCol = -1;
            for (let i = 0; i < 2; i++) {
              const r = rows[i] || [];
              const m = findCol(r, ["Squad Member"]);
              const s = findCol(r, ["Squads"]);
              if (m !== -1 && s !== -1) { membershipHeaderRowIndex = i; memberCol = m; squadCol = s; break; }
            }
            if (membershipHeaderRowIndex === -1) { resolve([]); return; }

            const KNOWN_ROLE_HEADER_HINTS = [
              "squad roles","role","chalk 1 fireteam 1","chalk 2 fireteam 1","chalk 3 fireteam 1","chalk 4 fireteam 1",
              "broadsword","wyvern","caladrius","ifrit","chalk actual"
            ];

            let slotHeaderRowIndex = -1, slotCol = -1, roleCol = -1;
            for (let i = 0; i < 4; i++) {
              const r = rows[i] || [];
              const sl = findCol(r, ["Squad Slots", "Slot"]);
              if (sl === -1) continue;
              let rc = findCol(r, ["Squad Roles", "Role"]);
              if (rc === -1) {
                rc = r.findIndex((c) => {
                  const n = this.normalize(c);
                  if (!n) return false;
                  if (n.includes("fireteam")) return true;
                  return KNOWN_ROLE_HEADER_HINTS.includes(n);
                });
              }
              if (sl !== -1 && rc !== -1) { slotHeaderRowIndex = i; slotCol = sl; roleCol = rc; break; }
            }
            const slottingAvailable = slotHeaderRowIndex !== -1 && slotCol !== -1 && roleCol !== -1;

            const findMemberByLabel = (label) => {
              const labelNorm = this.normalize(label);
              if (!labelNorm) return null;

              let m = this.members.find((mem) => labelNorm.includes(this.normalize(mem.name)));
              if (m) return m;

              const parts = labelNorm.split(" ");
              const surname = parts[parts.length - 1] || "";
              const initialMatch = labelNorm.match(/\b([a-z])\./i);
              const initial = initialMatch ? initialMatch[1].toLowerCase() : "";

              m = this.members.find((mem) => {
                const n = this.normalize(mem.name);
                const np = n.split(" ");
                const memSurname = np[np.length - 1] || "";
                const memInitial = (np[0] || "").charAt(0);
                if (!surname || memSurname !== surname) return false;
                if (initial && memInitial !== initial) return false;
                return true;
              }) || null;

              return m;
            };

            const membershipRows = rows
              .slice(membershipHeaderRowIndex + 1)
              .map((r) => {
                const label = String(r[memberCol] || "").trim();
                const squad = String(r[squadCol] || "").trim();
                if (!label || !squad) return null;
                return { label, squad };
              })
              .filter(Boolean);

            membershipRows.forEach(({ label, squad }) => {
              const mem = findMemberByLabel(label);
              if (!mem) return;
              if (!mem.squad) mem.squad = squad;
            });

            const slotEntries = [];
            const parseHeading = (txt) => {
              const raw = String(txt || "").trim();
              if (!raw) return null;
              const ft = raw.match(/^(.*?)(?:\s+)?fireteam\s*(\d+)\s*$/i);
              if (ft) return { squad: ft[1].trim(), fireteam: `Fireteam ${ft[2].trim()}` };
              const n = this.normalize(raw);
              const singles = ["broadsword","broadsword command","ifrit","wyvern","wyvern air wing","caladrius","chalk actual"];
              if (singles.includes(n)) return { squad: raw.trim(), fireteam: "Element" };
              return null;
            };

            if (slottingAvailable) {
              let currentSquad = "", currentFireteam = "Element";
              for (let i = slotHeaderRowIndex + 1; i < rows.length; i++) {
                const r = rows[i] || [];
                const slotTxt = String(r[slotCol] || "").trim();
                const roleTxt = String(r[roleCol] || "").trim();
                const heading = parseHeading(roleTxt);
                if (heading) { currentSquad = heading.squad; currentFireteam = heading.fireteam || "Element"; continue; }
                if (!currentSquad || !roleTxt) continue;

                const slotNorm = this.normalize(slotTxt);
                if (slotNorm === "vacant" || slotNorm === "closed") {
                  slotEntries.push({ squad: currentSquad, fireteam: currentFireteam, role: roleTxt, status: slotNorm.toUpperCase(), member: null });
                  continue;
                }

                const mem = slotTxt ? findMemberByLabel(slotTxt) : null;
                if (!mem) continue;
                mem.squad = currentSquad; mem.fireteam = currentFireteam; mem.slot = roleTxt;
                slotEntries.push({ squad: currentSquad, fireteam: currentFireteam, role: roleTxt, status: "FILLED", member: mem });
              }
            }

            const ALWAYS_SQUADS = ["Chalk Actual","Chalk 1","Chalk 2","Chalk 3","Chalk 4","Broadsword Command","Wyvern","Caladrius","Fillers","Recruit","Reserves"];
            const orbatMap = {};
            ALWAYS_SQUADS.forEach((s) => { orbatMap[s] = { squad: s, members: [], fireteams: {} }; });

            this.members.forEach((m) => {
              if (!m.squad) return;
              if (!orbatMap[m.squad]) { orbatMap[m.squad] = { squad: m.squad, members: [], fireteams: {} }; }
              orbatMap[m.squad].members.push(m);
              const ft = (m.fireteam || "").trim();
              const role = (m.slot || "").trim();
              if (ft && role) {
                orbatMap[m.squad].fireteams[ft] ??= { name: ft, slots: [] };
                const exists = orbatMap[m.squad].fireteams[ft].slots.some(
                  (s) => s.status === "FILLED" && s.member?.id && s.member.id === m.id && s.role === role
                );
                if (!exists) {
                  orbatMap[m.squad].fireteams[ft].slots.push({ role, status: "FILLED", member: m });
                }
              }
            });

            slotEntries.forEach((e) => {
              if (!orbatMap[e.squad]) { orbatMap[e.squad] = { squad: e.squad, members: [], fireteams: {} }; }
              const ftName = e.fireteam || "Element";
              orbatMap[e.squad].fireteams[ftName] ??= { name: ftName, slots: [] };
              if (e.status === "FILLED" && e.member?.id) {
                const exists = orbatMap[e.squad].fireteams[ftName].slots.some(
                  (s) => s.status === "FILLED" && s.member?.id === e.member.id && s.role === e.role
                );
                if (exists) return;
              }
              orbatMap[e.squad].fireteams[ftName].slots.push({ role: e.role, status: e.status, member: e.member });
            });

            this.orbat = Object.values(orbatMap).map((s) => ({
              squad: s.squad,
              members: (s.members || []).slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")),
              fireteams: Object.values(s.fireteams || {}).map((ft) => ({ name: ft.name, slots: (ft.slots || []).slice() }))
            }));

            resolve(this.orbat);
          },
          error: reject
        });
      });
    },

    // IMPORTANT: keep your working mission/event import exactly as-is
    async importMissions(files) {
      const entries = Object.entries(files);
      const contents = await Promise.all(entries.map(([, f]) => f()));

      const knownStatuses = new Set(["start", "partial-success", "success", "failure"]);

      const toTitle = (s) =>
        String(s || "")
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const inferCampaignFromPath = (path) => {
        const p = String(path || "");
        const parts = p.split("/missions/");
        if (parts.length < 2) return { key: "UNASSIGNED", name: "Unassigned" };
        const after = parts[1];
        const segs = after.split("/").filter(Boolean);
        if (segs.length <= 1) return { key: "UNASSIGNED", name: "Unassigned" };
        const slug = segs[0];
        return { key: slug.toUpperCase(), name: toTitle(slug) };
      };

      const parseHeader = (lines) => {
        const slug = String(lines[0] || "").trim();
        let cursor = 1;

        let title = "";
        let status = "start";

        const l1 = String(lines[1] || "").trim();
        const l2 = String(lines[2] || "").trim();

        if (knownStatuses.has(l1)) {
          status = l1;
          cursor = 2;
        } else if (knownStatuses.has(l2)) {
          title = l1;
          status = l2;
          cursor = 3;
        } else if (l1 && !l1.startsWith("@")) {
          title = l1;
          cursor = 2;
        }

        return { slug, title, status, cursor };
      };

      const parseDirectives = (lines, startIdx) => {
        let i = startIdx;
        const meta = {};
        while (i < lines.length) {
          const raw = String(lines[i] || "");
          const line = raw.trim();
          if (!line.startsWith("@")) break;

          const [tag, ...rest] = line.split(" ");
          const payload = rest.join(" ").trim();

          if (tag === "@campaign") {
            meta.campaign = payload.replace(/^"(.*)"$/, "$1").trim();
          } else if (tag === "@order") {
            const n = Number(payload);
            if (Number.isFinite(n)) meta.order = n;
          } else if (tag === "@theme") {
            try {
              meta.theme = payload ? JSON.parse(payload) : {};
            } catch (e) {
              console.warn(`Invalid @theme JSON for mission; ignoring.`, e);
            }
          }

          i += 1;
        }
        return { meta, cursor: i };
      };

      const parseNumeric = (s) => {
        const m = String(s || "").match(/(\d+)/);
        return m ? Number(m[1]) : NaN;
      };

      contents.forEach((c, idx) => {
        const path = entries[idx][0];
        const lines = String(c || "").split(/\r?\n/);

        const inferred = inferCampaignFromPath(path);
        const { slug, title, status, cursor: afterHeader } = parseHeader(lines);
        const { meta, cursor: afterMeta } = parseDirectives(lines, afterHeader);

        let order = Number(meta.order);
        if (!Number.isFinite(order)) {
          const fileBase = String(path || "").split("/").pop()?.replace(/\.md$/i, "") || "";
          const orderFromSlug = parseNumeric(slug);
          const orderFromFile = parseNumeric(fileBase);
          order = Number.isFinite(orderFromSlug) ? orderFromSlug : orderFromFile;
        }

        const content = lines.slice(afterMeta).join("\n");

        const campaignName = meta.campaign ? meta.campaign : inferred.name;
        const campaignKey = meta.campaign ? String(meta.campaign).toUpperCase() : inferred.key;

        this.missions.push({
          slug,
          name: title,
          status: knownStatuses.has(status) ? status : "start",
          content,
          campaign: campaignName,
          campaignKey,
          order,
          theme: meta.theme || {},
          sourcePath: path
        });
      });
    },

    async importEvents(files) {
      const contents = await Promise.all(Object.values(files).map((f) => f()));
      contents.forEach((c) => {
        const l = c.split("\n");
        this.events.push({
          title: l[0],
          location: l[1],
          time: l[2],
          thumbnail: l[3],
          content: l.slice(4).join("\n")
        });
      });
    },

    makeInitials(name) {
      const parts = String(name || "").trim().toUpperCase().split(/\s+/).filter(Boolean);
      if (!parts.length) return "XX";
      const first = parts[0]?.[0] || "X";
      const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "X") : "X";
      return `${first}${last}`;
    },
    hash32(str) {
      let h = 2166136261;
      const s = String(str || "");
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    },
    pad5(n) { return String(n).padStart(5, "0"); },
    makeUNSCId(oldId, name, used) {
      const initials = this.makeInitials(name);
      let seed = this.hash32(`${oldId}::${name}`);
      let a = seed % 100000;
      let b = ((seed / 100000) >>> 0) % 100000;
      let candidate = `${this.pad5(a)}-${this.pad5(b)}-${initials}`;
      while (used.has(candidate)) {
        seed = (seed + 1) >>> 0; a = seed % 100000; b = ((seed / 100000) >>> 0) % 100000;
        candidate = `${this.pad5(a)}-${this.pad5(b)}-${initials}`;
      }
      used.add(candidate);
      return candidate;
    }
  }
};
</script>

<style>
#app { min-height: 100vh; overflow: hidden !important; }

.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse at center, rgba(6, 12, 18, 0.96), rgba(0, 0, 0, 0.985));
  opacity: 1;
  transition: opacity 0.8s ease;
}
.login-overlay.fading { opacity: 0; pointer-events: none; }

.term {
  width: min(920px, 94vw);
  border-radius: 16px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.92), rgba(3, 6, 10, 0.95));
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 26px rgba(120, 180, 255, 0.10),
    0 0 110px rgba(0, 0, 0, 0.6);
  color: rgba(190, 230, 255, 0.92);
  font-family: "Titillium Web", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.term-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
}


/* Header icon shell (UNSC) */
.hdr-icon{
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(170, 220, 255, 0.18);
  border: 1px solid rgba(170, 220, 255, 0.22);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.18) inset, 0 0 16px rgba(120,180,255,0.10);
  background-image: url("/icons/squad.svg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 28px 28px;
  flex: 0 0 auto;
  opacity: .95;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(170, 220, 255, 0.22);
  box-shadow: 0 0 8px rgba(120, 180, 255, 0.12);
}
.term-title { font-size: 12px; opacity: 0.9; }
.term-stamp { margin-left: auto; font-size: 12px; opacity: 0.6; letter-spacing: .12em; }

.term-body {
  position: relative;
  padding: 26px 20px 18px;
  min-height: 380px;
}

.logo-ghost{
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: grid;
  place-items: center;
  z-index: -1; /* behind UI chrome */
}



.logo-ghost img { width: min(520px, 74vw); height: auto; }

.typed-window {
  position: relative;
  z-index: 2;
  height: 190px;
  overflow: hidden;
  padding-right: 6px;

  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%);
}

.typed {
  font-size: 14px;
  line-height: 1.7;
  text-shadow: 0 0 10px rgba(120, 180, 255, 0.10);
}

.line { margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dim { opacity: 0.7; }
.line.spacer { height: 10px; }

/* caret sits inline at end of active line */
.caret {
  display: inline-block;
  width: 10px;
  height: 14px;
  margin-left: 8px;
  border-left: 2px solid rgba(190, 230, 255, 0.9);
  animation: blink 1.1s infinite;
  transform: translateY(2px);
}
@keyframes blink {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
}

.gate {
  position: relative;
  z-index: 2;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(170, 220, 255, 0.14);
}

.gate-title {
  font-size: 12px;
  opacity: 0.85;
  margin-bottom: 10px;
  letter-spacing: .16em;
}

.login-options-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.login-options {
  display: flex;
  justify-content: center;
  gap: 14px;
  width: min(760px, 100%);
  margin: 0 auto;
  flex-wrap: wrap;
}

.login-option {
  flex: 1 1 280px;
  max-width: 360px;

  background: rgba(0, 0, 0, 0.38);
  border: 1px solid rgba(170, 220, 255, 0.26);
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  color: rgba(190, 230, 255, 0.92);
  text-transform: uppercase;
  letter-spacing: .12em;
  transition: transform 120ms ease, border-color 140ms ease, opacity 140ms ease;
}
.login-option:hover { border-color: rgba(170, 220, 255, 0.9); transform: translateY(-1px); }
.login-option:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

.opt-title { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
.opt-desc { font-size: 12px; opacity: .8; letter-spacing: .08em; }

.hint { margin-top: 12px; font-size: 11px; letter-spacing: .14em; line-height: 1.7; }

.term-ftr {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
  font-size: 12px;
}

/* FX */
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.02) 1px,
    rgba(0, 0, 0, 0) 3px,
    rgba(0, 0, 0, 0) 6px
  );
  mix-blend-mode: overlay;
  opacity: 0.35;
  pointer-events: none;
}

.flicker {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 30% 20%, rgba(120, 180, 255, 0.07), transparent 55%);
  animation: flicker 2.6s infinite;
  pointer-events: none;
  opacity: 0.9;
}

@keyframes flicker {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.75; }
  10% { transform: translate3d(-1px, 1px, 0); opacity: 0.85; }
  20% { transform: translate3d(1px, -1px, 0); opacity: 0.7; }
  35% { transform: translate3d(0px, 2px, 0); opacity: 0.9; }
  60% { transform: translate3d(2px, 0px, 0); opacity: 0.78; }
}

/* Ensure UI chrome stays above the background watermark */
.boot-shell, .login-shell, .gate, .access-shell, .terminal-shell, .app-shell{
  position: relative;
  z-index: 1;
}


/* Keep all primary chrome above the watermark */
.section-container, .terminal-window, .deployment-window, .window, .app-window{
  position: relative;
  z-index: 2;
}

/* Prevent stacking surprises */
.app-shell, .boot-shell, .login-shell, .gate, .access-shell, .terminal-shell{
  isolation: isolate;
}

</style>
