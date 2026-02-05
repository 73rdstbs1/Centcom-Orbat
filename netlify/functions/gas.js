// netlify/functions/gas.js
// Proxy to Google Apps Script. Forwards existing site auth to GAS.
// Netlify env: GAS_ENDPOINT = https://script.google.com/.../exec

const GAS_ENDPOINT = process.env.GAS_ENDPOINT;

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-User, X-Role";

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    ...extra,
  };
}

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (!GAS_ENDPOINT) {
    return {
      statusCode: 500,
      headers: corsHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ok: false, error: "Missing env GAS_ENDPOINT" }),
    };
  }

  try {
    const method = event.httpMethod.toUpperCase();
    const isBodyMethod = /^(POST|PUT|PATCH)$/i.test(method);

    // Pull whatever identity Netlify gives us (if you use Netlify Identity, this is set)
    const idUser = context.clientContext?.user || null;
    // Build helpful passthrough headers for GAS
    const passAuth = event.headers?.authorization || "";           // Bearer ... if your app sets it
    const passUser =
      event.headers?.["x-user"] ||
      idUser?.user_metadata?.user_name ||
      idUser?.user_metadata?.full_name ||
      idUser?.email ||
      ""; // leave blank if unknown
    const passRole = event.headers?.["x-role"] || "";              // optional (officer/staff/etc.)
    const cookie = event.headers?.cookie || "";                    // forward session cookies if any

    // Proxy URL (forward query string for ALL methods)
    const qs = event.rawQueryString ? `?${event.rawQueryString}` : "";
    const urlObj = new URL(String(GAS_ENDPOINT) + qs);
    // Apps Script web apps may not expose request headers; mirror auth context into query params.
    if (passUser && !urlObj.searchParams.has("X-User")) urlObj.searchParams.set("X-User", passUser);
    if (passRole && !urlObj.searchParams.has("X-Role")) urlObj.searchParams.set("X-Role", passRole);
    if (!passRole && passAuth && !urlObj.searchParams.has("Authorization")) urlObj.searchParams.set("Authorization", passAuth);
    const url = urlObj.toString();

    // Body (text/plain to keep Apps Script happy with redirects)
    const body = isBodyMethod ? event.body : undefined;

    const resp = await fetch(url, {
      method,
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        // 👇 forward useful auth context verbatim for GAS to validate
        ...(passAuth ? { Authorization: passAuth } : {}),
        ...(passUser ? { "X-User": passUser } : {}),
        ...(passRole ? { "X-Role": passRole } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body,
    });

    const text = await resp.text();
    const contentType = resp.headers.get("content-type") || "application/json";
    return {
      statusCode: resp.status,
      headers: corsHeaders({ "Content-Type": contentType }),
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ok: false, error: String(e?.message || e) }),
    };
  }
};
