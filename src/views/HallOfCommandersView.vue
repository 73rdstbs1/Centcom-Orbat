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
              placeholder="Commander / task force / campaign…"
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
            <div class="meta-chip">
              {{ tiles.length }} campaign{{ tiles.length === 1 ? "" : "s" }}
            </div>
          </div>
        </div>

        <!-- Main page: TILE GRID -->
        <div class="tile-grid">
          <button
            v-for="t in tiles"
            :key="t.id"
            type="button"
            class="tile"
            @click="openDetails(t.raw)"
          >
            <div class="tile-topline"></div>

            <div class="tile-media">
              <img
                class="portrait"
                :src="portraitUrlFor(t.raw)"
                :alt="`${t.name} portrait`"
                loading="lazy"
              />
              <div class="callsign-pill">{{ commanderCallsign(t.raw) }}</div>
            </div>

            <div class="tile-name" :title="campaignName(t.raw)">{{ campaignName(t.raw) }}</div>

            <div class="tile-subname">{{ t.name }}</div>

            <div class="tile-footer">
              <div class="tile-foot-left" :title="t.taskForce">{{ t.taskForce }}</div>
              <div class="tile-foot-right" :title="t.dateLabel">{{ t.dateLabel }}</div>
            </div>
          </button>
        </div>

        <div v-if="!tiles.length" class="empty">
          <div class="muted">No matching campaign records.</div>
        </div>
      </div>
    </section>

    <!-- Modal: commander record -->
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
              <div class="kicker">OPERATIONAL CHAIN</div>
              <h2>{{ activeCommander.name }}</h2>
            </div>
          </div>

          <button class="icon-button" type="button" @click="closeDetails" aria-label="Close">✕</button>
        </header>

        <div class="modal-body">
          <section class="modal-section first">
            <div class="section-label">COMMAND ELEMENT</div>

            <!-- Streamlined: dedicated connector ROW (no absolute positioning = no clipping) -->
            <div class="command-tree">
              <div class="tree-top">
                <button ref="topTile" class="tile tile--modal tile--primary" type="button" @click="noop">
                  <div class="tile-topline"></div>
                  <div class="tile-media">
                    <img
                      class="portrait"
                      :src="portraitUrlFor(activeCommander)"
                      :alt="`${activeCommander.name} portrait`"
                      loading="lazy"
                    />
                  </div>
                  <div class="tile-name">{{ activeCommander.name }}</div>
                  <div class="tile-footer">
                    <div class="tile-foot-left">{{ taskForceFor(activeCommander) }}</div>
                    <div class="tile-foot-right">{{ campaignDates(activeCommander) }}</div>
                  </div>
                </button>
              </div>

              <div class="tree-connector" aria-hidden="true" ref="connectorWrap">
                <svg
                  v-if="connector.ready"
                  class="chain-lines"
                  :viewBox="`0 0 ${connector.w} ${connector.h}`"
                  preserveAspectRatio="none"
                >
                  <path :d="connectorPathMid" />
                  <path :d="connectorPathBus" />
                  <path :d="connectorPathLeft" />
                  <path :d="connectorPathRight" />
                  <circle :cx="connector.midX" :cy="connector.busY" r="6" />
                  <circle :cx="connector.leftX" :cy="connector.busY" r="6" />
                  <circle :cx="connector.rightX" :cy="connector.busY" r="6" />
                </svg>

                <svg v-else class="chain-lines" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <!-- fallback before measurement -->
                  <path d="M500 0 V70" />
                  <path d="M250 100 H750" />
                  <path d="M250 100 V200" />
                  <path d="M750 100 V200" />
                  <circle cx="500" cy="100" r="6" />
                  <circle cx="250" cy="100" r="6" />
                  <circle cx="750" cy="100" r="6" />
                </svg>
              </div>

              <div class="tree-bottom">
                <button
                  ref="leftSubTile"
                  class="tile tile--modal tile--sub"
                  type="button"
                  :disabled="!subCommanders[0]"
                  @click="subCommanders[0] && setActiveCommander(subCommanders[0])"
                >
                  <div class="tile-topline"></div>
                  <div class="tile-media">
                    <img
                      class="portrait"
                      :src="portraitUrlFor(subCommanders[0])"
                      :alt="`${subCommanderName(0)} portrait`"
                      loading="lazy"
                    />
                  </div>
                  <div class="tile-name">{{ subCommanderName(0) }}</div>
                  <div class="tile-footer">
                    <div class="tile-foot-left">{{ subCommanderUnit(0) }}</div>
                    <div class="tile-foot-right">SUB</div>
                  </div>
                </button>

                <button
                  ref="rightSubTile"
                  class="tile tile--modal tile--sub"
                  type="button"
                  :disabled="!subCommanders[1]"
                  @click="subCommanders[1] && setActiveCommander(subCommanders[1])"
                >
                  <div class="tile-topline"></div>
                  <div class="tile-media">
                    <img
                      class="portrait"
                      :src="portraitUrlFor(subCommanders[1])"
                      :alt="`${subCommanderName(1)} portrait`"
                      loading="lazy"
                    />
                  </div>
                  <div class="tile-name">{{ subCommanderName(1) }}</div>
                  <div class="tile-footer">
                    <div class="tile-foot-left">{{ subCommanderUnit(1) }}</div>
                    <div class="tile-foot-right">SUB</div>
                  </div>
                </button>
              </div>
            </div>

            <div class="hint muted">
              Click a sub-commander tile to switch record (placeholder behavior for POC).
            </div>
          </section>

          <section class="modal-section">
            <div class="section-label">OPERATION DETAILS</div>

            <div class="details-grid">
              <div class="panel">
                <div class="kv2">
                  <div class="k">CAMPAIGN</div>
                  <div class="v">
                    <div class="campaign-row">
                      <span>{{ campaignName(activeCommander) }}</span>
                      <button class="link-button" type="button" @click="goToCampaign(activeCommander.campaignId)">OPEN RECORD</button>
                    </div>
                  </div>
                </div>
                <div class="kv2">
                  <div class="k">STATUS</div>
                  <div class="v">{{ campaignStatus(activeCommander).toUpperCase() }}</div>
                </div>
                <div class="kv2">
                  <div class="k">DATES</div>
                  <div class="v">{{ campaignDates(activeCommander) }}</div>
                </div>
                <div class="kv2">
                  <div class="k">LOCATION</div>
                  <div class="v">{{ campaignLocation(activeCommander) }}</div>
                </div>
              </div>

              <div class="panel">
                <div class="section-label small">NOTABLE AWARDS</div>
                <div v-if="notableAwards(activeCommander).length" class="text">
                  {{ notableAwards(activeCommander).join(", ") }}
                </div>
                <div v-else class="muted">No notable awards recorded.</div>

                <div class="divider"></div>

                <div class="section-label small">COMMANDER AWARDS</div>
                <div v-if="awardsFor(activeCommander).length" class="text">
                  {{ awardsFor(activeCommander).join(", ") }}
                </div>
                <div v-else class="muted">No recorded awards.</div>
              </div>
            </div>
          </section>

          <section class="modal-section">
            <div class="section-label">NOTES</div>
            <div class="panel">
              <div class="muted">
                {{ notesText(activeCommander) }}
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
import { playMenuClick } from "@/utils/sfx";

const PLACEHOLDER_PORTRAIT =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1b26"/>
      <stop offset="1" stop-color="#041018"/>
    </linearGradient>
  </defs>
  <rect width="480" height="480" fill="url(#g)"/>
  <rect x="28" y="28" width="424" height="424" rx="28" fill="none" stroke="rgba(160,240,255,0.20)" stroke-width="4"/>
  <path d="M120 340c20-58 70-90 120-90s100 32 120 90" fill="none" stroke="rgba(160,240,255,0.22)" stroke-width="10" stroke-linecap="round"/>
  <circle cx="240" cy="190" r="62" fill="none" stroke="rgba(160,240,255,0.22)" stroke-width="10"/>
  <text x="240" y="412" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas" font-size="18" fill="rgba(214,241,255,0.75)" letter-spacing="3">
    PORTRAIT PENDING
  </text>
</svg>`);

const CAMPAIGN_JSON = import.meta.glob("/src/campaigns/**/campaign.json", {
  eager: true,
  query: "?raw",
  import: "default",
});

function safeJson(raw) {
  try {
    return JSON.parse(String(raw || ""));
  } catch {
    return null;
  }
}

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function folderFromCampaignPath(path) {
  const parts = String(path || "").split("/campaigns/");
  if (parts.length < 2) return "";
  return parts[1].split("/")[0] || "";
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function awardLabel(x) {
  if (!x) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "object") return String(x.name || x.title || x.id || "").trim();
  return String(x).trim();
}

function loadCampaignIndex() {
  const campaigns = [];
  const campaignById = {};

  for (const [path, raw] of Object.entries(CAMPAIGN_JSON)) {
    const json = safeJson(raw);
    if (!json) continue;

    const folder = folderFromCampaignPath(path);
    const id = json.id || folder;
    if (!id) continue;

    const camp = { __path: path, __folder: folder, ...json, id };
    campaigns.push(camp);
    campaignById[id] = camp;
  }

  // One tile per campaign: use the MAIN commander from campaign.command.commander
  const mainCommanders = campaigns
    .map((camp) => {
      const cmd = camp?.command?.commander || {};
      return {
        id: `${camp.id}__cmd`,
        campaignId: camp.id,
        name: cmd.name || camp.commanderName || "—",
        callsign: cmd.callsign || "",
        position: cmd.role || "Commander",
        unit: cmd.unitName || camp.theatre || camp.location || "—",
        portrait: cmd.portrait || "",
        awards: asArray(cmd.awards || camp.commanderAwards),
      };
    })
    .filter((c) => c.name && c.name !== "—");

  return { campaigns, campaignById, mainCommanders };
}

const CAMPAIGN_INDEX = loadCampaignIndex();

export default {
  name: "HallOfCommandersView",
  data() {
    return {
      campaigns: CAMPAIGN_INDEX.campaigns,
      campaignById: CAMPAIGN_INDEX.campaignById,

      commanders: CAMPAIGN_INDEX.mainCommanders,

      search: "",
      statusFilter: "",
      activeCommander: null,

      connector: {
        ready: false,
        w: 1000,
        h: 200,
        midX: 500,
        leftX: 250,
        rightX: 750,
        midY0: 0,
        midY1: 70,
        busY: 100,
        subY1: 200,
      },
      _ro: null,
    };
  },
  computed: {
    tiles() {
      const q = this.search.trim().toLowerCase();
      const status = this.statusFilter;

      const filtered = (this.commanders || []).filter((c) => {
        const cStatus = this.campaignStatus(c);
        if (status && cStatus !== status) return false;

        if (!q) return true;

        const inCommander =
          (c.name || "").toLowerCase().includes(q) ||
          (c.position || "").toLowerCase().includes(q) ||
          (c.unit || "").toLowerCase().includes(q);

        const camp = this.campaignById?.[c.campaignId];
        const inCampaign =
          (camp?.name || "").toLowerCase().includes(q) ||
          (camp?.overview || "").toLowerCase().includes(q) ||
          (camp?.location || "").toLowerCase().includes(q) ||
          (camp?.theatre || "").toLowerCase().includes(q);

        const inAwards = (this.awardsFor(c) || []).some((a) => String(a || "").toLowerCase().includes(q));
        const inNotables = (this.notableAwards(c) || []).some((a) => String(a || "").toLowerCase().includes(q));

        return inCommander || inCampaign || inAwards || inNotables;
      });

      const scored = filtered.map((c) => {
        const camp = this.campaignById?.[c.campaignId];
        const dateLabel = this.tileDate(camp);
        const taskForce =
          c.unit ||
          camp?.command?.commander?.unitName ||
          camp?.theatre ||
          camp?.location ||
          "—";

        const sortKey = Date.parse(camp?.startDate || "") || 0;

        return {
          id: c.id,
          name: c.name || "—",
          taskForce,
          dateLabel,
          sortKey,
          raw: c,
        };
      });

      // Sort: newest campaign first, then campaign name.
      return scored.sort((a, b) => {
        if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey;
        return String(this.campaignName(a.raw)).localeCompare(String(this.campaignName(b.raw)));
      });
    },

    subCommanders() {
      if (!this.activeCommander?.campaignId) return [null, null];

      const camp = this.campaignById?.[this.activeCommander.campaignId];
      if (!camp) return [null, null];

      const main = this.mainCommanderForCampaign(camp);
      const subs = this.subCommanderRecordsForCampaign(camp);

      const all = [main, ...subs].filter(Boolean);

      const activeId = this.activeCommander?.id;
      const others = all.filter((x) => x && x.id !== activeId);

      const out = others.slice(0, 2);
      while (out.length < 2) out.push(null);
      return out;
    },

    connectorPathMid() {
      const c = this.connector;
      return `M${c.midX} ${c.midY0} V${c.midY1}`;
    },
    connectorPathBus() {
      const c = this.connector;
      return `M${c.leftX} ${c.busY} H${c.rightX}`;
    },
    connectorPathLeft() {
      const c = this.connector;
      return `M${c.leftX} ${c.busY} V${c.subY1}`;
    },
    connectorPathRight() {
      const c = this.connector;
      return `M${c.rightX} ${c.busY} V${c.subY1}`;
    },
  },
  mounted() {
    window.addEventListener("keydown", this.onKeydown);
    this._ro = new ResizeObserver(() => {
      if (this.activeCommander) this.refreshConnector();
    });
    this.$nextTick(() => {
      const el = this.$refs.connectorWrap;
      if (el && this._ro) this._ro.observe(el);
    });
    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
    window.removeEventListener("resize", this.onResize);
    if (this._ro) this._ro.disconnect();
  },
  methods: {
    noop() {},

    mainCommanderForCampaign(camp) {
      const cmd = camp?.command?.commander || {};
      return {
        id: `${camp.id}__cmd`,
        campaignId: camp.id,
        name: cmd.name || camp.commanderName || "—",
        callsign: cmd.callsign || "",
        position: cmd.role || "Commander",
        unit: cmd.unitName || camp.theatre || camp.location || "—",
        portrait: cmd.portrait || "",
        awards: asArray(cmd.awards || camp.commanderAwards),
      };
    },

    subCommanderRecordsForCampaign(camp) {
      const subs = asArray(camp?.command?.subCommanders);
      return subs.map((sc, idx) => ({
        id: `${camp.id}__sub__${idx}`,
        campaignId: camp.id,
        name: sc?.name || "—",
        callsign: sc?.callsign || "",
        position: sc?.role || "Sub-Commander",
        unit: sc?.unitName || camp.theatre || camp.location || "—",
        portrait: sc?.portrait || "",
        awards: asArray(sc?.awards),
      }));
    },

    refreshConnector() {
      this.$nextTick(() => {
        const wrap = this.$refs.connectorWrap;
        const top = this.$refs.topTile;
        const left = this.$refs.leftSubTile;
        const right = this.$refs.rightSubTile;

        if (!wrap || !top || !left || !right) {
          this.connector.ready = false;
          return;
        }

        const wRect = wrap.getBoundingClientRect();
        const wClient = Math.max(1, Math.round(wrap.clientWidth || wRect.width));
        const topRect = top.getBoundingClientRect();
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();

        const w = wClient;
        const h = 140;

        const midX = (topRect.left + topRect.width / 2) - wRect.left;
        const leftX = (leftRect.left + leftRect.width / 2) - wRect.left;
        const rightX = (rightRect.left + rightRect.width / 2) - wRect.left;

        this.connector = {
          ...this.connector,
          ready: true,
          w,
          h,
          midX,
          leftX,
          rightX,
          midY0: 0,
          midY1: 55,
          busY: 80,
          subY1: h,
        };
      });
    },

    setActiveCommander(c) {
      this.activeCommander = c;
      this.$nextTick(() => {
        this.$refs.modalRef?.focus?.();
        this.refreshConnector();
      });
    },

    portraitUrlFor(commander) {
      if (!commander) return PLACEHOLDER_PORTRAIT;
      const direct = String(commander.portrait || "").trim();
      if (direct) return direct;

      const camp = this.campaignById?.[commander.campaignId];
      const fallback = String(camp?.assets?.defaultPortrait || "").trim();
      if (fallback) return fallback;

      const fallbacks = asArray(camp?.assets?.fallbackPortraits);
      if (fallbacks.length) return String(fallbacks[0]).trim() || PLACEHOLDER_PORTRAIT;

      return PLACEHOLDER_PORTRAIT;
    },

    commanderCallsign(commander) {
      if (!commander) return "CALLSIGN";
      return commander.callsign || commander.position || commander.name || "CALLSIGN";
    },

    goToCampaign(campaignId) {
      if (!campaignId) return;
      this.closeDetails();
      this.$router.push({ path: "/campaigns", query: { campaignId } });
    },

    tileDate(campaign) {
      if (!campaign) return "—";
      const s = campaign.startDate;
      const e = campaign.endDate;
      if (s && e) return `${s} → ${e}`;
      return s || e || "—";
    },

    campaignName(c) {
      if (!c || !c.campaignId) return "—";
      return this.campaignById?.[c.campaignId]?.name || "—";
    },

    campaignDates(c) {
      const camp = this.campaignById?.[c.campaignId];
      return this.tileDate(camp);
    },

    campaignStatus(c) {
      return norm(c?.campaignStatus) || this.campaignById?.[c?.campaignId]?.status || "archived";
    },

    campaignLocation(c) {
      const camp = this.campaignById?.[c?.campaignId];
      return camp?.location || [camp?.system, camp?.planet, camp?.ao].filter(Boolean).join(" / ") || "CLASSIFIED / TBD";
    },

    taskForceFor(c) {
      const camp = this.campaignById?.[c?.campaignId];
      return c?.unit || camp?.command?.commander?.unitName || camp?.theatre || camp?.location || "—";
    },

    awardsFor(c) {
      const raw = asArray(c?.awards);
      return raw.map(awardLabel).filter(Boolean);
    },

    notableAwards(c) {
      const camp = this.campaignById?.[c?.campaignId];
      const raw =
        asArray(camp?.notableAwardsEarned) ||
        asArray(camp?.awards?.notable) ||
        [];
      return raw.map(awardLabel).filter(Boolean);
    },

    notesText(c) {
      const camp = this.campaignById?.[c?.campaignId];
      const v =
        String(camp?.overview || "").trim() ||
        String(camp?.summary || "").trim() ||
        String(camp?.notes || "").trim();
      return v || "No campaign summary recorded.";
    },

    openDetails(c) {
      playMenuClick();
      // Ensure we open the MAIN commander record for the campaign tile.
      const camp = this.campaignById?.[c?.campaignId];
      this.activeCommander = camp ? this.mainCommanderForCampaign(camp) : c;

      this.$nextTick(() => {
        this.$refs.modalRef?.focus?.();
        this.refreshConnector();
      });
    },

    closeDetails() {
      this.activeCommander = null;
      this.connector.ready = false;
    },

    subCommanderName(idx) {
      const c = this.subCommanders[idx];
      return c?.name || "SUB-COMMANDER SLOT";
    },

    subCommanderUnit(idx) {
      const c = this.subCommanders[idx];
      if (!c) return "—";
      return this.taskForceFor(c) || "—";
    },

    onResize() {
      if (this.activeCommander) this.refreshConnector();
    },

    onKeydown(e) {
      if (e.key === "Escape" && this.activeCommander) this.closeDetails();
    },
  },
};
</script>

<style scoped>
#hallOfCommanders {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: calc(var(--app-header-height, 72px) + 24px) 24px 24px 24px;

  color: var(--text-pilot-value, #d6f1ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

#hallOfCommanders :deep(section.section-container) {
  width: 100%;
  max-width: none;
  margin: 0;
}

/* Terminal shell */
.terminal-shell {
  width: 100%;
  max-width: none;
  margin: 0;
  position: relative;
  overflow: hidden;

  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 0 0 1px rgba(150, 240, 255, 0.08), 0 12px 40px rgba(0, 0, 0, 0.55);
  background: radial-gradient(1200px 600px at 10% 0%, rgba(90, 220, 255, 0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 0%, rgba(90, 220, 255, 0.06), transparent 55%),
    linear-gradient(180deg, rgba(5, 15, 22, 0.92), rgba(3, 10, 16, 0.94));
}

.terminal-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.22;
  background: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 100% 28px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px) 0 0 / 28px 100%;
}

.terminal-shell::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.55;
  background: linear-gradient(transparent 60%, rgba(0, 0, 0, 0.22));
}

.terminal-header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 110px 1fr 180px;
  gap: 12px;
  align-items: center;

  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(
      90deg,
      rgba(90, 220, 255, 0.14),
      rgba(90, 220, 255, 0.02) 35%,
      transparent 70%
    ),
    rgba(0, 0, 0, 0.22);
}

.terminal-badge {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(90, 220, 255, 0.14);
  box-shadow: 0 0 12px rgba(90, 220, 255, 0.16);
}

.terminal-title .kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
}

.terminal-title .title {
  margin-top: 2px;
  font-size: 16px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-location, #e6fbff);
}

.terminal-right {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.stamp {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(214, 241, 255, 0.9);
  border: 1px solid rgba(90, 220, 255, 0.18);
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
}

.stamp.subtle {
  opacity: 0.7;
}

.terminal-body {
  position: relative;
  z-index: 1;
  padding: 16px;
}

/* Filters */
.filters {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.3fr;
  gap: 12px;
  align-items: end;
  margin-bottom: 14px;
}

.filter-label {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing: 0.08em;
}

.term-input,
.term-select {
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.78), rgba(0, 0, 0, 0.28));
  color: var(--text-location, #e6fbff);
  padding: 10px 12px;
  outline: none;
  color-scheme: dark;
}

.term-input::placeholder {
  color: rgba(214, 241, 255, 0.58);
}

.term-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 38px;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='rgba(214,241,255,0.85)' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.term-input:focus,
.term-select:focus {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.18);
  border-color: rgba(90, 220, 255, 0.34);
}

:deep(select.term-select option) {
  background: rgba(5, 15, 22, 0.98);
  color: rgba(230, 251, 255, 0.92);
}

/* Tile grid */
.tile-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.tile {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.32)),
    radial-gradient(900px 260px at 20% 0%, rgba(90, 220, 255, 0.06), transparent 60%);
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.tile--modal {
  cursor: default;
  width: min(360px, 100%);
}

.tile--modal:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.tile:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.22);
}

.tile-topline {
  height: 2px;
  background: linear-gradient(90deg, rgba(90, 220, 255, 0.5), transparent 70%);
}

.tile-media {
  position: relative;
  padding: 12px 12px 0;
}

.portrait {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
}

.callsign-pill {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(230, 251, 255, 0.92);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
  pointer-events: none;
  white-space: nowrap;
}

.tile-subname {
  margin-top: 6px;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.72));
  padding: 0 12px;
}

.campaign-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.link-button {
  border-radius: 999px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(230, 251, 255, 0.92);
  padding: 6px 10px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
}

.link-button:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

.tile-name {
  padding: 10px 12px 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-location, #e6fbff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.tile-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 12px;
}

.tile-foot-left,
.tile-foot-right {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-foot-left {
  flex: 1;
  min-width: 0;
}

.tile-foot-right {
  flex: 0 0 auto;
  max-width: 44%;
  text-align: right;
}

.empty {
  margin-top: 12px;
}

.muted {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.7));
}

/* Modal */
.modal-overlay {
  animation: fadeIn 160ms ease-out;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.72);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal {
  animation: popIn 180ms ease-out;
  width: min(1300px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: radial-gradient(1200px 600px at 10% 0%, rgba(90, 220, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(5, 15, 22, 0.92), rgba(3, 10, 16, 0.94));
  box-shadow: 0 0 0 1px rgba(150, 240, 255, 0.08), 0 18px 60px rgba(0, 0, 0, 0.7);
  outline: none;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
}

.modal-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: none;
}

.modal-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-title .kicker {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
}

.modal-title h2 {
  margin: 2px 0 0;
  font-size: 16px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-location, #e6fbff);
}

.icon-button {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(90, 220, 255, 0.18);
  color: var(--text-pilot-value, #d6f1ff);
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
}

.icon-button:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

.modal-body {
  padding: 16px;
}

.modal-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.modal-section.first {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.section-label {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
  margin-bottom: 10px;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.section-label.small {
  margin-bottom: 8px;
  font-size: 10px;
}

.panel {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;
}

.text {
  color: var(--text-pilot-value, #d6f1ff);
  line-height: 1.35;
}

.rank-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing: 0.16em;
  font-size: 12px;
}

/* Command tree: three rows (top tile / connector / bottom tiles) */
.command-tree {
  display: grid;
  grid-template-rows: auto 140px auto;
  gap: 12px;
}

.tree-top {
  display: grid;
  justify-items: center;
}

.tree-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
  justify-items: center;
}

.tree-connector {
  width: 100%;
  display: grid;
  align-items: center;
}

.chain-lines {
  width: 100%;
  height: 140px;
  pointer-events: none;
}

.chain-lines path {
  fill: none;
  stroke: rgba(90, 220, 255, 0.18);
  stroke-width: 3;
  stroke-linecap: square;
}

.chain-lines circle {
  fill: rgba(90, 220, 255, 0.18);
}

.hint {
  margin-top: 10px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.kv2 {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
}

.kv2 .k {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.75));
}

.kv2 .v {
  color: var(--text-pilot-value, #d6f1ff);
  overflow-wrap: anywhere;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 12px 0;
}

.terminal-button {
  border-radius: 12px;
  border: 1px solid rgba(90, 220, 255, 0.22);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-location, #e6fbff);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 10px 14px;
}

.terminal-button:hover {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.12);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popIn {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes riseIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 1400px) {
  .tile-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .tile-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .filters {
    grid-template-columns: 1fr;
  }
  .tile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tree-bottom {
    grid-template-columns: 1fr;
  }
  .tree-connector {
    display: none; /* avoid awkward 2-branch connector when stacked */
  }
  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 540px) {
  .tile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
