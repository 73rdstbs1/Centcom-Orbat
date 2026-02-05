<!-- src/views/PilotsView.vue -->
<template>
  <section id="members" class="section-container">
    <div style="height: 52px; overflow: hidden">
      <div class="section-header clipped-medium-backward-pilot">
        <img src="/icons/license.svg" alt="Members Icon" />
        <h1>Unit ORBAT</h1>
      </div>
      <div class="rhombus-back">&nbsp;</div>
    </div>

    <div class="section-content-container">
      <div class="orbat-wrapper">
        <div v-if="!orbat || !orbat.length">Loading squads and members...</div>

        <div v-else class="hierarchy-container">
          <!-- One card per squad; click opens modal for THAT squad -->
          <div class="orbat-row">
            <div class="squad-row three">
              <div
                v-for="sq in orbat"
                :key="sq.squad"
                class="squad-card"
                @click="openSquad(sq)"
              >
                <div class="squad-header">
                  <div class="squad-insignia"><span>{{ squadInitials(sq.squad) }}</span></div>
                  <div class="squad-meta">
                    <h2>{{ sq.squad }}</h2>
                    <p class="squad-subtitle">{{ squadDescriptor(sq.squad) }}</p>
                    <p class="squad-count">{{ personnelCount(sq) }} PERSONNEL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- /row -->
        </div>
      </div>
    </div>

    <!-- ✅ USE THE NEW GROUPED MODAL API -->
    <SquadModal
      v-if="activeSquad"
      :squad="activeSquad"
      :cert-labels="certLabels"
      @close="activeSquad = null"
    />
  </section>
</template>

<script>
import SquadModal from "@/components/modals/SquadModal.vue";

export default {
  name: "PilotsView",
  components: { SquadModal },
  props: {
    members: { type: Array, default: () => [] },
    orbat: { type: Array, default: () => [] },
  },
  data() {
    return {
      activeSquad: null,
      certLabels: [
        "Rifleman","Machine Gunner","Anti Tank","Corpsmen","Combat Engineer",
        "Marksman","Breacher","Grenadier","Pilot","RTO","PJ","NCO","Officer",
      ],
    };
  },
  methods: {
    openSquad(sq) { this.activeSquad = sq; },
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
    personnelCount(sq) {
      if (sq.fireteams && sq.fireteams.length) {
        let count = 0;
        sq.fireteams.forEach((ft) => (ft.slots || []).forEach((s) => {
          if (s.status === "FILLED" && s.member) count++;
        }));
        return count;
      }
      return (sq.members || []).length;
    },
  },
};
</script>

<style scoped>
/* keep your existing styles here or reuse from your current file */
.section-container { padding: 2.5rem 3rem; color: #dce6f1; }
.section-content-container { width: 100% !important; }
.orbat-wrapper { width: 100%; margin-top: .75rem; padding-bottom: 4rem; }
.hierarchy-container { width: 100%; margin-top: 2rem; }
.orbat-row { margin-bottom: 3rem; }
.squad-row.three { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 2.5rem; }
@media (max-width: 1400px) { .squad-row.three { grid-template-columns: repeat(2, minmax(260px, 1fr)); } }
@media (max-width: 900px)  { .squad-row.three { grid-template-columns: 1fr; } }
.squad-card { background: rgba(0,10,30,0.9); border: 2px solid rgba(30,144,255,0.85); border-radius: .8rem; min-height: 210px; cursor: pointer; }
.squad-header { display: grid; grid-template-columns: auto 1fr; align-items: center; padding: 1.4rem 2rem; }
.squad-insignia { width: 95px; height: 95px; border: 4px solid #1e90ff; display: grid; place-items: center; color: #1e90ff; border-radius: .6rem; }
.squad-meta h2 { margin: 0; font-size: 2.1rem; color: #e0f0ff; }
.squad-subtitle { margin: .2rem 0 0; font-size: 1.05rem; color: #9ec5e6; text-transform: uppercase; }
.squad-count { margin: .35rem 0 0; font-size: 1rem; color: #7aa7c7; }
</style>
