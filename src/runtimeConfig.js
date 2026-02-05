// File: src/config/runtimeConfig.js
/**
 * Runtime configuration for templating this site for other units.
 *
 * Priority (highest → lowest):
 *  1) Explicit overrides passed to helpers
 *  2) Window globals (for legacy index.html / embeds)
 *  3) Vite env vars (VITE_*)
 *  4) src/config/unit-config.json (edit this for most use-cases)
 *
 * Keep this file tiny and boring: it is the single source of truth.
 */

import base from "./unit-config.json";

function toStr(v) {
  return typeof v === "string" ? v.trim() : "";
}

function readWindow(path) {
  try {
    if (typeof window === "undefined") return "";
    const v = window[path];
    return toStr(v);
  } catch {
    return "";
  }
}

function readEnv(name) {
  try {
    // Vite exposes env vars on import.meta.env
    return toStr(import.meta?.env?.[name]);
  } catch {
    return "";
  }
}

function pick(...vals) {
  for (const v of vals) {
    const s = toStr(v);
    if (s) return s;
  }
  return "";
}

export function getConfig() {
  // Shallow clone so consumers can't mutate the imported JSON.
  return JSON.parse(JSON.stringify(base));
}

export function getSheetUrls(overrides = {}) {
  const cfg = getConfig();
  return {
    membersCsvUrl: pick(
      overrides.membersCsvUrl,
      readWindow("MEMBERS_MASTER_CSV"),
      readEnv("VITE_MEMBERS_CSV_URL"),
      cfg.sheets?.membersCsvUrl
    ),
    refDataCsvUrl: pick(
      overrides.refDataCsvUrl,
      readWindow("DEFAULTS_CSV_URL"),
      readEnv("VITE_REF_DATA_CSV_URL"),
      cfg.sheets?.refDataCsvUrl
    ),
    opsCsvUrl: pick(
      overrides.opsCsvUrl,
      readWindow("ATTENDANCE_CSV"),
      readEnv("VITE_OPS_CSV_URL"),
      cfg.sheets?.opsCsvUrl
    ),
  };
}

export function getDeploymentConfig(overrides = {}) {
  const cfg = getConfig();
  return {
    execUrl: pick(overrides.execUrl, readWindow("DEPLOYMENT_EXEC_URL"), readEnv("VITE_DEPLOYMENT_EXEC_URL"), cfg.deployment?.execUrl),
    rankIconBase: pick(overrides.rankIconBase, readWindow("RANK_ICON_BASE"), readEnv("VITE_RANK_ICON_BASE"), cfg.deployment?.rankIconBase),
    rankIconExt: pick(overrides.rankIconExt, readWindow("RANK_ICON_EXT"), readEnv("VITE_RANK_ICON_EXT"), cfg.deployment?.rankIconExt || "png"),
  };
}

export function getTerminalFeed(overrides = {}) {
  const cfg = getConfig();
  const feed = overrides.feedPool || cfg.terminal?.feedPool || [];
  return Array.isArray(feed) ? feed : [];
}
