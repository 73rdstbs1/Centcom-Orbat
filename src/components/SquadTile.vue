<template>
  <div
    class="squad-tile"
    :class="{ open }"
    @click="$emit('open', squad)"
  >
    <div class="squad-header">
      <div class="squad-insignia">
        <span>{{ initials(squad.squad) }}</span>
      </div>

      <div class="squad-meta">
        <h2>{{ squad.squad }}</h2>
        <p class="subtitle">{{ descriptor(squad.squad) }}</p>
        <p class="count">{{ squad.members.length }} PERSONNEL</p>
      </div>

      <div class="chevron">▶</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SquadTile",
  props: {
    squad: {
      type: Object,
      required: true,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    initials(name) {
      return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    },
    descriptor(name) {
      const n = name.toLowerCase();

      if (n.includes("chalk")) return "INFANTRY ELEMENT";
      if (n.includes("air") || n.includes("wing")) return "AVIATION SUPPORT";
      if (n.includes("command")) return "COMMAND ELEMENT";

      return "UNSC ELEMENT";
    },
  },
};
</script>

<style scoped>
/* ==========================================================
   Squad Tile Container
   ========================================================== */

.squad-tile {
  background:
    radial-gradient(
      circle at top left,
      rgba(30, 144, 255, 0.25),
      transparent 65%
    ),
    rgba(0, 10, 30, 0.9);
  border: 2px solid rgba(30, 144, 255, 0.85);
  border-radius: 0.8rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  min-height: 210px;
  padding-right: 1.5rem;

  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease;
  will-change: transform;
}

/* Hover: subtle HUD lift */
.squad-tile:hover {
  transform: translateY(-4px);
  border-color: #5ab3ff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
}

/* Active press */
.squad-tile:active {
  transform: translateY(-1px);
}

/* Open state */
.squad-tile.open {
  transform: translateY(-2px);
  border-color: rgba(120, 220, 180, 0.9);
}

/* ==========================================================
   Header Layout
   ========================================================== */

.squad-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 1.4rem 2rem;
}

/* ==========================================================
   Insignia
   ========================================================== */

.squad-insignia {
  width: 95px;
  height: 95px;
  border-radius: 0.6rem;
  border: 4px solid #1e90ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.6rem;
  font-size: 2rem;
  font-weight: bold;
  color: #1e90ff;
  background: rgba(0, 0, 0, 0.7);
}

/* ==========================================================
   Text
   ========================================================== */

.squad-meta h2 {
  margin: 0;
  font-size: 2.3rem;
  color: #e0f0ff;
  letter-spacing: 0.05em;
}

.subtitle {
  margin: 0.2rem 0 0;
  font-size: 1.1rem;
  color: #9ec5e6;
}

.count {
  margin-top: 0.4rem;
  font-size: 1rem;
  color: #7aa7c7;
}

/* ==========================================================
   Chevron
   ========================================================== */

.chevron {
  font-size: 1.8rem;
  color: #9ec5e6;
  margin-left: 1.3rem;
  opacity: 0.75;

  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.squad-tile.open .chevron {
  transform: rotate(90deg);
  opacity: 1;
}
</style>
