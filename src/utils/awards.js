// FILE: src/utils/awards.js
/**
 * Awards parsing + rendering helpers.
 *
 * Supported formats:
 * 1) Operations.AWARDS cell:
 *    "Trooper - CODE / Unit - Trooper - CODE"
 *
 * 2) Roster.AWARDS cell:
 *    "MOH SS BS" or "MOH, SS, BS"
 *
 * 3) Roster.AWARD LINKS cell (per-award certificate links, same order as AWARDS):
 *    "https://... https://... https://..."
 *
 * Award icons are expected at: /public/awards/<CODE>.svg
 */

export const KNOWN_AWARD_CODES = [
  "JMUR",
  "CSA",
  "JSA",
  "JSC",
  "BS",
  "DFC",
  "DMSR",
  "SS",
  "LOM",
  "CC",
  "MOH",
];

export const AWARD_CODE_ALIASES = {
  // legacy/alternate codes
  JMUA: "JMUR",
  CMUR: "JMUR",
  JCOM: "JSC",
  JSAM: "JSA",
  DMSM: "DMSR",
};

export const AWARD_DISPLAY_NAMES = {
  JMUR: "Joint Meritorious Unit Ribbon",
  CSA: "Community Service Achievement",
  JSA: "Joint Service Achievement",
  JSC: "Joint Service Commendation",
  BS: "Bronze Star",
  DFC: "Distinguished Flying Cross",
  DMSR: "Defense Meritorious Service Ribbon",
  SS: "Silver Star",
  LOM: "Legion of Merit",
  CC: "Colonial Cross",
  MOH: "Medal of Honor",
};

const KNOWN_SET = new Set(KNOWN_AWARD_CODES);

export function canonicalizeAwardCode(code) {
  const raw = String(code ?? "")
    .toUpperCase()
    .trim();
  if (!raw) return "";
  const mapped = AWARD_CODE_ALIASES[raw] || raw;
  return KNOWN_SET.has(mapped) ? mapped : "";
}

const ALL_CODES = Array.from(
  new Set([...KNOWN_AWARD_CODES, ...Object.keys(AWARD_CODE_ALIASES)]),
);

const AWARD_CODE_RE = new RegExp(`\\b(${ALL_CODES.join("|")})\\b`, "gi");

export function awardIconUrl(code) {
  const c = canonicalizeAwardCode(code);
  return c ? `/awards/${c}.svg` : "";
}

/**
 * Generic award info pages (optional).
 * If you no longer want generic links (because every award has its own certificate URL),
 * you can leave these blank.
 */
export const AWARD_PAGE_URLS = {};

export function awardPageUrl(code) {
  const c = canonicalizeAwardCode(code);
  if (!c) return "";

  const direct = AWARD_PAGE_URLS?.[c];
  if (direct) return direct;

  const base = (import.meta?.env?.VITE_AWARDS_INFO_URL || "").trim();
  if (base) {
    const join = base.includes("?") ? "&" : "?";
    return `${base}${join}award=${encodeURIComponent(c)}`;
  }

  return "";
}

/**
 * Extract codes anywhere inside a string (deduped, in first-seen order).
 * Good for free-form text like "Medal of Honor (MOH)".
 */
export function extractAwardCodes(text) {
  const s = String(text ?? "");
  if (!s.trim()) return [];

  const out = [];
  const seen = new Set();

  let m;
  while ((m = AWARD_CODE_RE.exec(s)) !== null) {
    const code = canonicalizeAwardCode(m[1]);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }

  return out;
}

/**
 * Parse a roster-style awards list (ordered, duplicates preserved).
 * Example: "MOH SS BS" or "MOH, SS, BS"
 */
export function parseAwardCodesList(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];

  const tokens = s
    .split(/[\s,\/;|\n\t]+/g)
    .map((t) =>
      String(t || "")
        .replace(/[^A-Za-z0-9]/g, "")
        .trim(),
    )
    .filter(Boolean);

  const out = [];
  for (const t of tokens) {
    const c = canonicalizeAwardCode(t);
    if (c) out.push(c);
  }
  return out;
}

/**
 * Parse a roster-style links list (ordered).
 * Example: "link1 link2 link3" or "link1, link2, link3"
 */
export function parseAwardLinksList(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[\s,]+/g)
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

export function normalizePersonKey(name) {
  const raw = String(name ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";

  // Strip a leading rank-ish token to improve matching ("PFC John Doe" -> "John Doe")
  const parts = raw.split(" ").filter(Boolean);
  if (parts.length > 1 && /^[A-Z0-9]{2,6}\.?$/.test(parts[0])) parts.shift();

  return parts.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
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

export function parseAwardsCell(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];

  const chunks = s
    .split("/")
    .map((x) =>
      String(x ?? "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const out = [];

  for (const chunk of chunks) {
    // Split on spaced separators so award names can still contain hyphens.
    const parts = chunk
      .split(/\s[-–—]\s/)
      .map((x) => x.trim())
      .filter(Boolean);

    let unit = "";
    let trooper = "";
    let award = "";

    if (parts.length >= 3) {
      // Heuristic: if the last part contains a known award code, treat as "Unit - Trooper - Award".
      // Otherwise treat as "Trooper - Award with - inside".
      const last = parts[parts.length - 1];
      const looksLikeCode =
        extractAwardCodes(last).length > 0 || /^[A-Za-z]{2,6}$/.test(last);

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
