<!-- src/components/BootScreenUNSC.vue -->
<template>
  <div class="boot" :class="{ exiting }" @pointerdown.prevent="enter">
    <div class="monitor">
      <div class="hdr">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <div class="title">UNSC SECURE ACCESS TERMINAL // {{ channel }}</div>
      </div>

      <div class="body">
        <div class="scanlines" aria-hidden="true"></div>
        <div class="flicker" aria-hidden="true"></div>

        <div class="txt">
          <div class="typed" v-html="typedHtml"></div>

          <div class="progress" v-if="booting || typedDone">
            <div class="bar" :class="{ booting }"></div>
          </div>

          <div class="line" v-if="typedDone && !booting">CLICK TO INITIATE AUTH HANDSHAKE</div>
          <div class="line" v-if="booting">HANDSHAKE ACCEPTED // SESSION OPEN</div>

          <div class="small dim" v-if="typedDone">
            <span class="caret"></span>
            AUDIO/INPUT LOCKOUT RELEASED ON USER CONFIRMATION
          </div>
        </div>
      </div>

      <div class="ftr dim">
        <span>SYS: OK</span>
        <span>IFF: VALID</span>
        <span>NET: {{ booting ? "LINK" : "IDLE" }}</span>
        <span>SEC: {{ booting ? "AMBER" : "GREEN" }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BootScreenUNSC",
  emits: ["enter", "done"],
  props: {
    channel: { type: String, default: "BRIEFING GRID" },
  },
  data() {
    return {
      booting: false,
      exiting: false,

      // UNSC/Halo-coded flavor text
      fullLines: [
        "UNSC ACCESS NODE: ORBITAL BRIEFING SYSTEM",
        "ROUTE: KHARON REACH RELAY // HEKATE AO",
        "AUTHORITY: NAVSPECWARCOM // 150TH RRG",
        "",
        "» SIGNAL ACQUISITION: STABLE // LOW NOISE",
        "» ENCRYPTION SUITE: SWORD/VAULT // ACTIVE",
        "» IFF PACKET: RECEIVED // VERIFIED",
        "» THREAT FILTER: ENABLED // CONTENT SANITIZED",
        "» STAFF CREDENTIALS: REQUIRED FOR WRITE ACCESS",
      ],
      typedLines: [],
      typedCharIndex: 0,
      lineIndex: 0,
      typedDone: false,
      timer: null,
    };
  },
  computed: {
    typedHtml() {
      const escape = (s) =>
        String(s)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");

      const html = this.typedLines
        .map((l) => {
          if (l === "") return `<div class="line spacer"></div>`;
          const isFlavor = l.trim().startsWith("»");
          return `<div class="line ${isFlavor ? "dim" : ""}">${escape(l)}</div>`;
        })
        .join("");

      if (!this.typedDone) return `${html}<div class="line dim"><span class="caret"></span></div>`;
      return html;
    },
  },
  mounted() {
    this.startTyping();
  },
  beforeUnmount() {
    if (this.timer) window.clearTimeout(this.timer);
  },
  methods: {
    startTyping() {
      const minDelay = 12;
      const maxDelay = 30;

      const tick = () => {
        if (this.lineIndex >= this.fullLines.length) {
          this.typedDone = true;
          this.timer = null;
          return;
        }

        const target = this.fullLines[this.lineIndex];

        if (target === "") {
          this.typedLines.push("");
          this.lineIndex += 1;
          this.typedCharIndex = 0;
          this.timer = window.setTimeout(tick, 130);
          return;
        }

        if (this.typedLines.length <= this.lineIndex) this.typedLines.push("");

        const next = target.slice(0, this.typedCharIndex + 1);
        this.typedLines.splice(this.lineIndex, 1, next);
        this.typedCharIndex += 1;

        if (this.typedCharIndex >= target.length) {
          this.lineIndex += 1;
          this.typedCharIndex = 0;
          this.timer = window.setTimeout(tick, 220);
          return;
        }

        const jitter = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
        const extra = Math.random() < 0.06 ? 90 : 0;
        this.timer = window.setTimeout(tick, jitter + extra);
      };

      tick();
    },

    enter() {
      if (!this.typedDone) return;
      if (this.booting || this.exiting) return;

      this.booting = true;
      this.$emit("enter");

      window.setTimeout(() => {
        this.exiting = true;
        window.setTimeout(() => this.$emit("done"), 520);
      }, 850);
    },
  },
};
</script>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
  background: radial-gradient(ellipse at center, rgba(6, 12, 18, 0.96), rgba(0, 0, 0, 0.985));
  color: rgba(190, 230, 255, 0.92);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 1;
  transition: opacity 520ms ease;
}

.boot.exiting {
  opacity: 0;
  pointer-events: none;
}

.monitor {
  width: min(860px, 92vw);
  border-radius: 14px;
  border: 1px solid rgba(170, 220, 255, 0.22);
  background: linear-gradient(180deg, rgba(8, 14, 20, 0.92), rgba(3, 6, 10, 0.95));
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(170, 220, 255, 0.06) inset,
    0 0 24px rgba(120, 180, 255, 0.10),
    0 0 90px rgba(0, 0, 0, 0.6);
}

.hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(170, 220, 255, 0.22);
  box-shadow: 0 0 8px rgba(120, 180, 255, 0.12);
}

.title {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.body {
  position: relative;
  padding: 28px 22px 26px;
  min-height: 270px;
}

.txt {
  position: relative;
  z-index: 2;
  font-size: 14px;
  line-height: 1.7;
  text-shadow: 0 0 10px rgba(120, 180, 255, 0.10);
}

.line {
  margin: 2px 0;
}

.dim {
  opacity: 0.72;
}

.line.spacer {
  height: 10px;
}

.typed {
  min-height: 170px;
}

.small {
  margin-top: 12px;
  font-size: 12px;
}

.caret {
  display: inline-block;
  width: 10px;
  height: 14px;
  margin-right: 8px;
  border-left: 2px solid rgba(190, 230, 255, 0.9);
  animation: blink 1.1s infinite;
  transform: translateY(2px);
}

@keyframes blink {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
}

.progress {
  margin: 14px 0 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(170, 220, 255, 0.20);
  background: rgba(0, 0, 0, 0.34);
  overflow: hidden;
}

.bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, rgba(120, 180, 255, 0.18), rgba(190, 230, 255, 0.82));
  box-shadow: 0 0 18px rgba(120, 180, 255, 0.18);
  transition: width 700ms ease;
}

.bar.booting {
  width: 100%;
}

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

.ftr {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: 1px solid rgba(170, 220, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
  font-size: 12px;
}
</style>
