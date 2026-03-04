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
    // Split on spaced separators so award names can still contain hyphens.
    const parts = chunk.split(/\s[-–—]\s/).map((x) => x.trim()).filter(Boolean);

    let unit = "";
    let trooper = "";
    let award = "";

    if (parts.length >= 3) {
      // Heuristic: if the last part contains a known award code, treat as "Unit - Trooper - Award".
      // Otherwise treat as "Trooper - Award with - inside".
      const last = parts[parts.length - 1];
      const looksLikeCode = extractAwardCodes(last).length > 0 || /^[A-Za-z]{2,6}$/.test(last);

      if (looksLikeCode) {
        unit = parts[0];
        trooper = parts[1];
        award = parts.slice(2).join(" - ");
      } else {
        trooper = parts[0];
        award = parts.slice(1).join(" - ");
      }
    } else if (parts.length === 2) {
      trooper = parts[0];
      award = parts[1];
    } else {
      // Fallback to the first "-" if user omitted spaces: "Name-AWARD"
      const idx = chunk.indexOf("-");
      if (idx > 0) {
        trooper = chunk.slice(0, idx).trim();
        award = chunk.slice(idx + 1).trim();
      }
    }

    if (!trooper || !award) continue;
    out.push({ unit, trooper, award });
  }

  return dedupeAwards(out);
}

export function dedupeAwards(entries) {
  const seen = new Set();
  const out = [];

  for (const e of Array.isArray(entries) ? entries : []) {
    const unit = String(e?.unit ?? "").trim();
    const trooper = String(e?.trooper ?? "").trim();
    const award = String(e?.award ?? "").trim();
    if (!trooper || !award) continue;

    const key = `${normalizePersonKey(trooper)}|${award.toLowerCase()}|${unit.toLowerCase()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    out.push({ unit, trooper, award });
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
