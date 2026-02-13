<!-- FILE: src/views/CampaignLogView.vue -->
<template>
  <div id="campaignLog">
    <section class="section-container">
      <div class="term-title">HISTORICAL CAMPAIGN LOG</div>

      <div class="filters">
        <input
          v-model="search"
          class="term-input"
          type="text"
          placeholder="Search campaigns / operations"
        />

        <select v-model="statusFilter" class="term-select">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="training">Training</option>
          <option value="deployed">Deployed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div class="campaign-list">
        <article
          v-for="c in filteredCampaigns"
          :key="c.id"
          class="campaign-card"
        >
          <header class="campaign-header">
            <div class="campaign-title">
              <span class="status-pill" :data-status="c.status">
                {{ c.status.toUpperCase() }}
              </span>
              <h3>{{ c.name }}</h3>
            </div>

            <div class="campaign-meta">
              <div class="meta-line">
                <span class="label">Dates:</span>
                <span class="value">{{ fmtDates(c.startDate, c.endDate) }}</span>
              </div>
              <div class="meta-line">
                <span class="label">Quarter:</span>
                <span class="value">{{ c.quarter }}</span>
              </div>
            </div>
          </header>

          <p class="desc">{{ c.overview }}</p>

          <div class="overview-snippets">
            <div class="snippet">
              <div class="section-label">Operations (overview)</div>
              <ul class="mini-list">
                <li v-for="op in (c.operations || []).slice(0, 2)" :key="op.id">
                  <span class="op-date">{{ op.date }}</span>
                  <span class="op-title">{{ op.title }}</span>
                  <span class="op-status" :data-op-status="op.status">
                    {{ op.status }}
                  </span>
                </li>
              </ul>
              <div v-if="(c.operations || []).length > 2" class="muted">
                + {{ (c.operations || []).length - 2 }} more…
              </div>
            </div>

            <div class="snippet">
              <div class="section-label">Per-unit roster (teaser)</div>
              <div class="muted">
                Managed by unit leads per campaign. Open details to view org chart + full ops list.
              </div>
            </div>
          </div>

          <footer class="campaign-actions">
            <button class="term-button" type="button" @click="openCampaign(c)">
              View details
            </button>
          </footer>
        </article>
      </div>
    </section>

    <!-- Modal -->
    <div
      v-if="activeCampaign"
      class="modal-overlay"
      role="presentation"
      @click.self="closeCampaign"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`Campaign details: ${activeCampaign.name}`"
        tabindex="-1"
        ref="modalRef"
      >
        <header class="modal-header">
          <div class="modal-title">
            <span class="status-pill" :data-status="activeCampaign.status">
              {{ activeCampaign.status.toUpperCase() }}
            </span>
            <h2>{{ activeCampaign.name }}</h2>
          </div>

          <button class="icon-button" type="button" @click="closeCampaign" aria-label="Close">
            ✕
          </button>
        </header>

        <div class="modal-body">
          <div class="modal-meta">
            <div>
              <span class="label">Dates:</span>
              <span class="value">{{ fmtDates(activeCampaign.startDate, activeCampaign.endDate) }}</span>
            </div>
            <div>
              <span class="label">Quarter:</span>
              <span class="value">{{ activeCampaign.quarter }}</span>
            </div>
          </div>

          <!-- 1) Org Chart -->
          <section class="modal-section">
            <div class="section-label">Task Force Org Chart</div>

            <div v-if="activeCampaign.orgChart" class="orgchart">
              <div class="org-node root">
                <div class="node-title">{{ activeCampaign.orgChart.taskForceName }}</div>
                <div class="node-sub">
                  <span class="muted">HQ:</span>
                  <span class="value">{{ activeCampaign.orgChart.taskForceHQ?.name }}</span>
                  <span class="muted">—</span>
                  <span class="value">{{ activeCampaign.orgChart.taskForceHQ?.commander }}</span>
                </div>
              </div>

              <div class="org-children">
                <div
                  v-for="tu in activeCampaign.orgChart.taskUnits || []"
                  :key="tu.name"
                  class="org-node"
                >
                  <div class="node-title">{{ tu.name }}</div>
                  <div class="node-sub">
                    <span class="muted">HQ:</span>
                    <span class="value">{{ tu.hq?.name }}</span>
                    <span class="muted">—</span>
                    <span class="value">{{ tu.hq?.commander }}</span>
                  </div>

                  <div class="node-units">
                    <div class="muted">Participating Units</div>
                    <ul class="unit-list">
                      <li v-for="u in (tu.units || [])" :key="u">{{ u }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="muted">No org chart data yet.</div>
          </section>

          <!-- 2) Operations -->
          <section class="modal-section">
            <div class="section-label">Operations</div>

            <div v-if="(activeCampaign.operations || []).length" class="ops-table">
              <div class="ops-row ops-head">
                <div>Date</div>
                <div>Operation</div>
                <div>Status</div>
                <div>OPORD</div>
              </div>

              <div
                v-for="op in activeCampaign.operations"
                :key="op.id"
                class="ops-row"
              >
                <div class="op-date">{{ op.date }}</div>
                <div class="op-title">{{ op.title }}</div>
                <div>
                  <span class="op-status-pill" :data-op-status="op.status">
                    {{ op.status }}
                  </span>
                </div>
                <div>
                  <a
                    v-if="op.opordUrl"
                    class="opord-link"
                    :href="op.opordUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ op.opordTitle || "OPORD" }}
                  </a>
                  <span v-else class="muted">—</span>
                  <div v-if="op.opordSummary" class="opord-summary">
                    {{ op.opordSummary }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="muted">No operations logged yet.</div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="term-button" type="button" @click="closeCampaign">Close</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { campaigns as pocCampaigns } from "@/data/pocData";

export default {
  name: "CampaignLogView",
  data() {
    return {
      campaigns: pocCampaigns,
      search: "",
      statusFilter: "",
      activeCampaign: null,
    };
  },
  computed: {
    filteredCampaigns() {
      const q = this.search.trim().toLowerCase();
      const status = this.statusFilter;

      return (this.campaigns || []).filter((c) => {
        if (status && c.status !== status) return false;
        if (!q) return true;

        const inCampaign =
          (c.name || "").toLowerCase().includes(q) ||
          (c.overview || "").toLowerCase().includes(q);

        const inOps = (c.operations || []).some((op) => {
          return (
            (op.title || "").toLowerCase().includes(q) ||
            (op.opordTitle || "").toLowerCase().includes(q) ||
            (op.opordSummary || "").toLowerCase().includes(q)
          );
        });

        return inCampaign || inOps;
      });
    },
  },
  watch: {
    "$route.query.campaignId"() {
      this.openFromRoute();
    },
  },
  mounted() {
    window.addEventListener("keydown", this.onKeydown);
    this.openFromRoute();
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    fmtDates(start, end) {
      if (!start && !end) return "—";
      if (start && !end) return start;
      if (!start && end) return end;
      return `${start} → ${end}`;
    },
    openCampaign(c) {
      this.activeCampaign = c;
      this.$nextTick(() => {
        if (this.$refs.modalRef) this.$refs.modalRef.focus();
      });
    },
    closeCampaign() {
      this.activeCampaign = null;
    },
    onKeydown(e) {
      if (e.key === "Escape" && this.activeCampaign) this.closeCampaign();
    },
  },
};
</script>

<style scoped>
/* Layout + readability (this view only)
   - We keep equal padding on left/right inside the main content area,
     so the right gap matches the gap next to the sidebar.
*/
#campaignLog {
  flex: 1;
  min-width: 0;
  color: var(--text-pilot-value);
  padding: 0 24px; /* symmetric gutters */
  box-sizing: border-box;
}

#campaignLog :deep(section.section-container) {
  width: 100%;
  max-width: 1600px; /* keeps it centered on ultrawide while still "most of the screen" */
  margin: 0 auto;
}

#campaignLog :deep(.section-content-container) {
  color: var(--text-pilot-value);
}

/* Controls */
.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0 16px;
}

.term-input,
.term-select {
  width: 100%;
  max-width: 420px;
}

/* Cards */
.campaign-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.campaign-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.25);
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.campaign-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.campaign-title h3 {
  margin: 0;
  color: var(--text-location);
  letter-spacing: 0.5px;
}

.campaign-meta {
  display: grid;
  gap: 6px;
}

.meta-line .label {
  color: var(--text-pilot-header);
  margin-right: 6px;
}

.desc {
  margin: 10px 0 12px;
  color: var(--text-pilot-value);
}

.overview-snippets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.section-label {
  color: var(--text-location);
  margin-bottom: 6px;
  font-weight: 600;
}

.mini-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.mini-list li {
  display: flex;
  gap: 10px;
  align-items: center;
}

.op-date {
  color: var(--text-pilot-header);
  font-variant-numeric: tabular-nums;
}

.op-title {
  color: var(--text-pilot-value);
}

.muted {
  color: var(--text-pilot-header);
  opacity: 0.9;
  margin-top: 6px;
}

.campaign-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

/* Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--text-pilot-value);
  font-size: 12px;
  letter-spacing: 0.4px;
}

.op-status {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-pilot-header);
  text-transform: uppercase;
  opacity: 0.9;
}

.op-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--text-pilot-value);
  text-transform: uppercase;
  font-size: 12px;
}

.op-status-pill[data-op-status="completed"] {
  opacity: 1;
}
.op-status-pill[data-op-status="pending"] {
  opacity: 0.85;
}
.op-status-pill[data-op-status="failed"] {
  opacity: 0.75;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.68);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}

.modal {
  width: min(1100px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  outline: none;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.modal-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: none;
}

.modal-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.modal-title h2 {
  margin: 0;
  color: var(--text-location);
}

.icon-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--text-pilot-value);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.modal-body {
  padding: 14px;
}

.modal-meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.modal-meta .label {
  color: var(--text-pilot-header);
  margin-right: 6px;
}

.modal-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

/* Org chart */
.orgchart {
  display: grid;
  gap: 12px;
}

.org-node {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
}

.org-node.root {
  background: rgba(0, 0, 0, 0.32);
}

.node-title {
  color: var(--text-location);
  font-weight: 700;
  margin-bottom: 4px;
}

.node-sub {
  color: var(--text-pilot-value);
}

.org-children {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.unit-list {
  margin: 6px 0 0;
  padding-left: 18px;
  color: var(--text-pilot-value);
}

/* Operations table */
.ops-table {
  display: grid;
  gap: 8px;
}

.ops-row {
  display: grid;
  grid-template-columns: 120px 1fr 140px 1.2fr;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.22);
}

.ops-head {
  background: rgba(0, 0, 0, 0.32);
  font-weight: 700;
  color: var(--text-location);
}

.opord-link {
  color: var(--text-pilot-value);
  text-decoration: underline;
}

.opord-summary {
  margin-top: 6px;
  color: var(--text-pilot-header);
  line-height: 1.25;
}
</style>
