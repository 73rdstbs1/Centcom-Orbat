// netlify/functions/ping.js
exports.handler = async () => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify({ ok: true, name: "ping", ts: Date.now() }),
});
