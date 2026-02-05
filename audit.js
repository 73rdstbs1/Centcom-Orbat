// src/utils/audit.js
// Drop-in replacement: sends audit events to GitHub via Netlify function
// Endpoint expects Netlify env: GH_TOKEN, GH_REPO (configured on the server side).

function getAdminIdentity() {
  // why: keep secrets off client; read current admin session only
  try {
    if (typeof window === "undefined") return { who: "unknown", role: "staff" };
    const raw = window.sessionStorage?.getItem?.("admin");
    if (!raw) return { who: "unknown", role: "staff" };
    const a = JSON.parse(raw);
    return {
      who: a?.displayName || a?.username || "unknown",
      role: a?.role || "staff", // "staff" | "officer"
    };
  } catch {
    return { who: "unknown", role: "staff" };
  }
}

/**
 * Send a single audit event.
 * @param {Object} entry - { op, entity, memberId, data, notesHash, when? }
 *                         op: "warning.add" | "warning.remove" | "notes.update" | ...
 *                         entity: e.g., "discipline"
 *                         data: small JSON blob (kept concise)
 */
export async function auditLog(entry) {
  // why: never block UI – swallow errors
  try {
    const id = getAdminIdentity();
    const payload = {
      when: new Date().toISOString(),
      ...id,
      ...(entry || {}),
    };

    await fetch("/.netlify/functions/audit-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}
