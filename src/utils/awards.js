// FILE: src/utils/awards.js
/**
 * Awards parsing + rendering helpers.
 *
 * Sheets formats supported:
 * 1) Operations.AWARDS cell:
 *    "Trooper - AwardCode / Trooper - AwardCode"
 *
 * 2) Member.AWARDS cell:
 *    "MOH / LOM / DFC"
 *
 * Award icons are expected at: /public/awards/<CODE>.svg
 */

export const KNOWN_AWARD_CODES = [
  "BS",
  "CC",
  "CSA",
  "DFC",
  "DMSM",
  "JCOM",
  "JMUA",
  "JSAM",
  "LOM",
  "MOH",
  "SS",
];

const AWARD_CODE_RE = new RegExp(`\\b(${KNOWN_AWARD_CODES.join("|")})\\b`, "gi");

export function awardIconUrl(code) {
  const c = String(code ?? "").toUpperCase().trim();
  return c ? `/awards/${c}.svg` : "";
}

export function extractAwardCodes(text) {
  const s = String(text ?? "");
  if (!s.trim()) return [];

  const out = [];
  const seen = new Set();

  let m;
  while ((m = AWARD_CODE_RE.exec(s)) !== null) {
    const code = String(m[1] ?? "").toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }

  return out;
}

export function normalizePersonKey(name) {
  const raw = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return "";

  // Strip a leading rank-ish token to improve matching ("PFC John Doe" -> "John Doe")
  const parts = raw.split(" ").filter(Boolean);
  if (parts.length > 1 && /^[A-Z0-9]{2,6}\.?$/.test(parts[0])) parts.shift();

  return parts.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function parseAwardsCell(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];

  const chunks = s
    .split("/")
    .map((x) => String(x ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const out = [];

  for (const chunk of chunks) {
    // Prefer spaced separators so award names can include hyphens.
    const spacedSep = chunk.match(/\s[-–—]\s/);
    let trooper = "";
    let award = "";

    if (spacedSep && typeof spacedSep.index === "number") {
      const idx = spacedSep.index;
      trooper = chunk.slice(0, idx).trim();
      award = chunk.slice(idx + spacedSep[0].length).trim();
    } else {
      const idx = chunk.indexOf("-");
      if (idx > 0) {
        trooper = chunk.slice(0, idx).trim();
        award = chunk.slice(idx + 1).trim();
      }
    }

    if (!trooper || !award) continue;
    out.push({ trooper, award });
  }

  return dedupeAwards(out);
}

export function dedupeAwards(entries) {
  const seen = new Set();
  const out = [];

  for (const e of Array.isArray(entries) ? entries : []) {
    const trooper = String(e?.trooper ?? "").trim();
    const award = String(e?.award ?? "").trim();
    if (!trooper || !award) continue;

    const key = `${normalizePersonKey(trooper)}|${award.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ trooper, award });
  }

  return out;
}

export function splitAwardsText(raw) {
  return String(raw ?? "")
    .split(/\s*(?:\/|;|\n|,)\s*/g)
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
}

export function mergeAwardsText(primary, secondary) {
  const a = splitAwardsText(primary);
  const b = splitAwardsText(secondary);

  const seen = new Set();
  const out = [];

  for (const x of [...a, ...b]) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }

  return out.join(" / ");
}
