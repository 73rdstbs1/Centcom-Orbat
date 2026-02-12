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
              {{ tiles.length }} commander{{ tiles.length === 1 ? "" : "s" }}
            </div>
          </div>
        </div>

        <!-- Tiles -->
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
            </div>

            <div class="tile-name" :title="t.name">{{ t.name }}</div>

            <div class="tile-footer">
              <div class="tile-foot-left" :title="t.taskForce">{{ t.taskForce }}</div>
              <div class="tile-foot-right" :title="t.dateLabel">{{ t.dateLabel }}</div>
            </div>
          </button>
        </div>

        <div v-if="!tiles.length" class="empty">
          <div class="muted">No matching commander records.</div>
        </div>
      </div>
    </section>

    <!-- Modal -->
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
          <!-- Opening "chain" layout -->
          <section class="modal-section first">
            <div class="section-label">COMMAND ELEMENT</div>

            <div class="command-tree">
              <div class="tree-top">
                <div class="tree-node">
                  <div class="node-connector down"></div>
                  <button class="tile tile--modal tile--primary" type="button" @click="noop">
                    <div class="tile-topline"></div>
                    <div class="tile-media">
                      <img class="portrait" :src="portraitUrlFor(activeCommander)" :alt="`${activeCommander.name} portrait`" />
                    </div>
                    <div class="tile-name">{{ activeCommander.name }}</div>
                    <div class="tile-footer">
                      <div class="tile-foot-left">{{ taskForceFor(activeCommander) }}</div>
                      <div class="tile-foot-right">{{ campaignDates(activeCommander) }}</div>
                    </div>
                  </button>
                </div>
              </div>

              <div class="tree-bottom">
                <div class="tree-node">
                  <div class="node-connector up"></div>
                  <button
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
                      />
                    </div>
                    <div class="tile-name">{{ subCommanderName(0) }}</div>
                    <div class="tile-footer">
                      <div class="tile-foot-left">{{ subCommanderUnit(0) }}</div>
                      <div class="tile-foot-right">SUB</div>
                    </div>
                  </button>
                </div>

                <div class="tree-node">
                  <div class="node-connector up"></div>
                  <button
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
            </div>

            <div class="hint muted">
              Click a sub-commander tile to switch record (placeholder behavior for POC).
            </div>
          </section>

          <!-- Operation / campaign details -->
          <section class="modal-section">
            <div class="section-label">OPERATION DETAILS</div>

            <div class="details-grid">
              <div class="panel">
                <div class="kv2">
                  <div class="k">CAMPAIGN</div>
                  <div class="v">{{ campaignName(activeCommander) }}</div>
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
                Placeholder for citations, commendations, OPORD links, and campaign archive references.
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
import { commanders, awardById, campaignById } from "@/data/pocData";

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

export default {
  name: "HallOfCommandersView",
  data() {
    return {
      commanders,
      search: "",
      statusFilter: "",
      activeCommander: null,
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

        const camp = campaignById?.[c.campaignId];
        const tf = (camp?.orgChart?.taskForceName || "").toLowerCase();
        const inCampaign =
          (camp?.name || "").toLowerCase().includes(q) ||
          (camp?.overview || "").toLowerCase().includes(q) ||
          tf.includes(q);

        const inAwards = (c.awards || []).some((a) => String(a || "").toLowerCase().includes(q));

        return inCommander || inCampaign || inAwards;
      });

      return filtered
        .map((c) => {
          const camp = campaignById?.[c.campaignId];
          const dateLabel = this.tileDate(camp);
          const taskForce = camp?.orgChart?.taskForceName || c.unit || "—";

          return {
            id: c.id,
            name: c.name || "—",
            taskForce,
            dateLabel,
            raw: c,
          };
        })
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    },
    subCommanders() {
      if (!this.activeCommander) return [null, null];

      const sameCampaign = (this.commanders || []).filter(
        (c) =>
          c.campaignId &&
          c.campaignId === this.activeCommander.campaignId &&
          c.id !== this.activeCommander.id
      );

      const out = sameCampaign.slice(0, 2);
      while (out.length < 2) out.push(null);
      return out;
    },
  },
  mounted() {
    window.addEventListener("keydown", this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    noop() {},
    setActiveCommander(c) {
      this.activeCommander = c;
      this.$nextTick(() => this.$refs.modalRef?.focus?.());
    },
    portraitUrlFor(commander) {
      if (!commander) return PLACEHOLDER_PORTRAIT;
      return PLACEHOLDER_PORTRAIT;
    },
    tileDate(campaign) {
      if (!campaign) return "—";
      const s = campaign.startDate;
      const e = campaign.endDate;
      if (s && e) return `${s} → ${e}`;
      return s || e || "—";
    },
    campaignName(c) {
      return campaignById?.[c.campaignId]?.name || "—";
    },
    campaignDates(c) {
      const camp = campaignById?.[c.campaignId];
      return this.tileDate(camp);
    },
    campaignStatus(c) {
      return c.campaignStatus || campaignById?.[c.campaignId]?.status || "archived";
    },
    campaignLocation(c) {
      const camp = campaignById?.[c.campaignId];
      return camp?.location || "CLASSIFIED / TBD";
    },
    taskForceFor(c) {
      const camp = campaignById?.[c.campaignId];
      return camp?.orgChart?.taskForceName || c.unit || "—";
    },
    awardsFor(c) {
      const raw = c?.awards || [];
      return raw.map((x) => awardById?.[x]?.name || x).filter(Boolean);
    },
    notableAwards(c) {
      const camp = campaignById?.[c.campaignId];
      const raw = camp?.notableAwardsEarned || [];
      return (raw || []).map((x) => awardById?.[x]?.name || x).filter(Boolean);
    },
    openDetails(c) {
      this.activeCommander = c;
      this.$nextTick(() => this.$refs.modalRef?.focus?.());
    },
    closeDetails() {
      this.activeCommander = null;
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
  border: 1px solid rgba(90, 220, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-pilot-value, #d6f1ff);
  padding: 10px 12px;
  outline: none;
}

.term-input::placeholder {
  color: rgba(214, 241, 255, 0.5);
}

.term-input:focus,
.term-select:focus {
  box-shadow: 0 0 0 2px rgba(90, 220, 255, 0.14);
  border-color: rgba(90, 220, 255, 0.28);
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

.tile--primary{ animation: riseIn 180ms ease-out; }
.tile--sub{ animation: riseIn 180ms ease-out; animation-delay: 80ms; animation-fill-mode: both; }

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

.muted {
  color: var(--text-pilot-header, rgba(214, 241, 255, 0.7));
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

/* Command tree */
.command-tree {
  display: grid;
  gap: 14px;
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

  position: relative;

  padding-top: 26px;
}
.tree-bottom::before{
  content:"";
  position:absolute;
  left: 12%;
  right: 12%;
  top: 10px; /* aligns with vertical connector ends */
  height: 2px;
  background: rgba(90, 220, 255, 0.16);
}

.tree-node {
  position: relative;
  width: 100%;
  display: grid;
  justify-items: center;
}

.node-connector.up::before,
.node-connector.down::before {
  content: "";
  position: absolute;
  left: 50%;
  width: 2px;
  background: rgba(90, 220, 255, 0.16);
  transform: translateX(-50%);
}

.node-connector.down::before {
  top: calc(100% + 6px);
  height: 18px;
}

.node-connector.up::before {
  top: -22px;
  height: 22px;
}

.hint {
  margin-top: 10px;
}

/* Details */
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
