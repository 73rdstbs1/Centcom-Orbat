<!-- src/components/modals/AdminLoginModal.vue -->
<template>
  <div class="modal-backdrop" @click.self="emitClose">
    <div class="modal-card">
      <div class="modal-head">
        <h2>Staff Sign-in</h2>
      </div>

      <div class="modal-body">
        <label class="control">
          <span>Username</span>
          <input v-model="u" type="text" autocomplete="username" autofocus />
        </label>

        <label class="control">
          <span>Password</span>
          <input v-model="p" type="password" autocomplete="current-password" @keyup.enter="submit" />
        </label>

        <p v-if="err" class="err">{{ err }}</p>
      </div>

      <div class="modal-foot">
        <button class="btn cancel" @click="emitClose">Cancel</button>
        <button class="btn" :disabled="loading || !u || !p" @click="submit">
          {{ loading ? 'Authorizing…' : 'Sign in' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { adminLogin } from "@/utils/adminAuth"; // why: central backend auth

export default {
  name: "AdminLoginModal",
  emits: ["success", "close"],
  data: () => ({
    u: "",
    p: "",
    loading: false,
    err: "",
  }),
  methods: {
    async submit() {
      this.err = "";
      if (!this.u || !this.p) {
        this.err = "Enter username and password.";
        return;
      }
      this.loading = true;
      try {
        await adminLogin(this.u.trim(), this.p);
        this.$emit("success");
      } catch (e) {
        this.err = String(e?.message || "Login failed");
      } finally {
        this.loading = false;
      }
    },
    emitClose() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
/* =========================
   UNSC TERMINAL STAFF LOGIN MODAL
   Visual-only: NO template/script changes
   ========================= */

.modal-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.82);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 1000;
}

.modal-card{
  width: min(92vw, 520px);
  border-radius: 16px;
  border: 1px solid rgba(170,220,255,0.22);
  background: linear-gradient(180deg, rgba(8,14,20,0.94), rgba(3,6,10,0.97));
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 28px rgba(120,180,255,0.12),
    0 0 120px rgba(0,0,0,0.65);
  overflow: hidden;
  position: relative;
}

.modal-card::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255,255,255,0.02),
    rgba(255,255,255,0.02) 1px,
    rgba(0,0,0,0) 3px,
    rgba(0,0,0,0) 6px
  );
  mix-blend-mode: overlay;
  opacity: 0.22;
}
.modal-card::after{
  content:"";
  position:absolute;
  inset:-25%;
  pointer-events:none;
  background: radial-gradient(circle at 30% 20%, rgba(120,180,255,0.08), transparent 58%);
  opacity: .9;
}

/* Header chrome */
.modal-head{
  display:flex;
  align-items:center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(170,220,255,0.12);
  background: rgba(0,0,0,0.16);
  position: relative;
  z-index: 1;
}

/* Protocol icon shell (SVG is black, so use a shell) */
.modal-head::before{
  content:"";
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(170,220,255,0.18);
  border: 1px solid rgba(170,220,255,0.22);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.18) inset, 0 0 16px rgba(120,180,255,0.10);
  background-image: url("/icons/npc.svg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 28px 28px;
  flex: 0 0 auto;
  opacity: .95;
}

.modal-head h2{
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(226,243,255,0.95);
}

.modal-body{
  display: grid;
  gap: 12px;
  padding: 14px;
  position: relative;
  z-index: 1;
}

.control{ display:grid; gap: 6px; }
.control span{
  color: rgba(158,197,230,0.92);
  font-size: 12px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.control input{
  background: rgba(5,12,20,0.88);
  border: 1px solid rgba(170,220,255,0.22);
  border-radius: 9px;
  padding: 10px 10px;
  color: rgba(226,243,255,0.95);
  box-shadow: 0 0 0 1px rgba(170,220,255,0.04) inset;
  outline: none;
}
.control input:focus{
  border-color: rgba(120,180,255,0.55);
  box-shadow: 0 0 0 2px rgba(120,180,255,0.22);
}

.modal-foot{
  display:flex;
  justify-content:flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid rgba(170,220,255,0.10);
  background: rgba(0,0,0,0.12);
  position: relative;
  z-index: 1;
}

.btn{
  border: 1px solid rgba(170,220,255,0.22);
  background: linear-gradient(180deg, rgba(8,14,20,0.65), rgba(3,6,10,0.72));
  color: rgba(226,243,255,0.95);
  border-radius: 9px;
  padding: 10px 12px;
  cursor: pointer;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 12px;
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.06) inset,
    0 0 18px rgba(120,180,255,0.08);
}
.btn:hover{
  border-color: rgba(170,220,255,0.55);
  box-shadow:
    0 0 0 1px rgba(170,220,255,0.08) inset,
    0 0 22px rgba(120,180,255,0.12);
}
.btn:disabled{
  opacity: .55;
  cursor: not-allowed;
}
.btn.cancel{
  border-color: rgba(170,220,255,0.22);
  background: rgba(0,0,0,0.10);
}

.err{
  color: #ffb080;
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.06em;
}
</style>
