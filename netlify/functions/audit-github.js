// netlify/functions/audit-github.js
// Sends a repository_dispatch to GitHub with your audit payload.
// ENV required (Netlify > Site settings > Environment):
//   GH_TOKEN  = a PAT with "repo" (or a fine-scoped classic) OR a GitHub App token
//   GH_REPO   = "<owner>/<repo>", e.g. "jinterceptor/150th-ORBAT"

const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";
const GH_API = "https://api.github.com";

function cors(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    ...extra,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors() };
  }

  const token = process.env.GH_TOKEN;
  const repo = process.env.GH_REPO;

  if (!token || !repo) {
    return {
      statusCode: 500,
      headers: cors({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ok: false, error: "Missing GH_TOKEN or GH_REPO" }),
    };
  }

  try {
    const entry = JSON.parse(event.body || "{}"); // {who, role, op, entity, memberId, data, notesHash, when?}
    // Hardening: inject server-side timestamp if missing
    if (!entry.when) entry.when = new Date().toISOString();

    const url = `${GH_API}/repos/${repo}/dispatches`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "orbat-audit-dispatch",
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "audit-log",
        client_payload: entry,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return {
        statusCode: resp.status,
        headers: cors({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ok: false, error: t || resp.statusText }),
      };
    }

    return {
      statusCode: 200,
      headers: cors({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ok: false, error: String(e?.message || e) }),
    };
  }
};
