// src/utils/adminAuth.js
// Staff session + displayName hydration (from /staff.json)
// IMPORTANT: Apps Script requires `secret` on ALL actions, including admin.login.

const SS_USER = "admin:user";
const SS_ROLE = "admin:role";
const SS_TOKEN = "admin:token";
const SS_EXP = "admin:exp";

// Match your Apps Script SECRET default. You can override by setting
// sessionStorage/localStorage key "deploymentSecret".
const FALLBACK_DEPLOYMENT_SECRET = "PLEX";

const _subs = new Set();

function _notify() {
  for (const cb of Array.from(_subs)) {
    try {
      cb();
    } catch {
      // ignore
    }
  }
}

export function subscribe(cb) {
  if (typeof cb === "function") _subs.add(cb);
  return () => _subs.delete(cb);
}

export function adminEndpoint() {
  return "/.netlify/functions/gas";
}

function _ssSet(k, v) {
  window.sessionStorage.setItem(k, String(v));
}

function _ssGet(k) {
  return window.sessionStorage.getItem(k);
}

function _ssDel(k) {
  window.sessionStorage.removeItem(k);
}

function _safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function _pickDisplayName(obj) {
  if (!obj || typeof obj !== "object") return "";
  const v =
    obj.displayName ||
    obj.display_name ||
    obj.fullName ||
    obj.full_name ||
    obj.name ||
    obj.username ||
    "";
  return typeof v === "string" ? v.trim() : "";
}

function _getDeploymentSecret() {
  try {
    const ss = typeof sessionStorage !== "undefined" ? sessionStorage : null;
    const ls = typeof localStorage !== "undefined" ? localStorage : null;

    // You can set this anywhere in the app if you want:
    // localStorage.setItem("deploymentSecret", "PLEX")
    const s =
      ss?.getItem("deploymentSecret") ||
      ls?.getItem("deploymentSecret") ||
      ss?.getItem("secret") ||
      ls?.getItem("secret") ||
      "";

    return (s && s.trim()) ? s.trim() : FALLBACK_DEPLOYMENT_SECRET;
  } catch {
    return FALLBACK_DEPLOYMENT_SECRET;
  }
}

function _writeSession({ username, displayName, role, token, ttlSec }) {
  const exp = Date.now() + Math.max(60, Number(ttlSec || 3600)) * 1000;

  const prev = adminUser();
  const mergedDisplay =
    (displayName && String(displayName).trim()) ||
    (prev?.displayName ? String(prev.displayName).trim() : "");

  _ssSet(SS_USER, JSON.stringify({ username, displayName: mergedDisplay }));
  _ssSet(SS_ROLE, role || "");
  _ssSet(SS_TOKEN, token || "");
  _ssSet(SS_EXP, String(exp));
  _notify();
}

export function adminUser() {
  const raw = _ssGet(SS_USER);
  return raw ? _safeJsonParse(raw) : null;
}

export function adminRole() {
  return _ssGet(SS_ROLE) || "";
}

export function adminToken() {
  return _ssGet(SS_TOKEN) || "";
}

function _notExpired() {
  const exp = Number(_ssGet(SS_EXP) || 0);
  return Number.isFinite(exp) && Date.now() < exp;
}

export function isOfficerOrStaff() {
  if (!_notExpired()) return false;
  const r = String(adminRole() || "").toLowerCase();
  return r === "staff" || r === "officer";
}

export function isAdmin() {
  return isOfficerOrStaff();
}

export function clearAdminSession() {
  _ssDel(SS_USER);
  _ssDel(SS_ROLE);
  _ssDel(SS_TOKEN);
  _ssDel(SS_EXP);
  _notify();
}

async function _fetchStaffJson() {
  try {
    const res = await fetch("/staff.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function _normalize(s) {
  return String(s || "").trim().toLowerCase();
}

function _findDisplayNameFromStaff(staff, username) {
  const u = _normalize(username);
  if (!u) return "";

  for (const entry of staff) {
    if (!entry || typeof entry !== "object") continue;

    const eUser = _normalize(entry.username || entry.login || entry.user);
    const eMail = _normalize(entry.email);

    if (eUser && eUser === u) return _pickDisplayName(entry);
    if (eMail && (eMail === u || eMail.split("@")[0] === u)) return _pickDisplayName(entry);
  }
  return "";
}

export async function ensureAdminDisplayName() {
  const u = adminUser();
  if (!u?.username) return "";
  if (u.displayName && String(u.displayName).trim()) return String(u.displayName).trim();

  const staff = await _fetchStaffJson();
  const displayName = _findDisplayNameFromStaff(staff, u.username);

  if (displayName) {
    _writeSession({
      username: u.username,
      displayName,
      role: adminRole(),
      token: adminToken(),
      ttlSec: Math.floor((Number(_ssGet(SS_EXP)) - Date.now()) / 1000) || 3600,
    });
  }
  return displayName || "";
}

export function setAdminDisplayName(displayName) {
  const u = adminUser();
  if (!u?.username) return false;
  _writeSession({
    username: u.username,
    displayName: String(displayName || "").trim(),
    role: adminRole(),
    token: adminToken(),
    ttlSec: Math.floor((Number(_ssGet(SS_EXP)) - Date.now()) / 1000) || 3600,
  });
  return true;
}

// Accepts adminLogin({ username, password }) or adminLogin(username, password)
export async function adminLogin(arg1, arg2) {
  let username;
  let password;

  if (typeof arg1 === "string") {
    username = arg1;
    password = arg2;
  } else if (arg1 && typeof arg1 === "object") {
    username = arg1.username;
    password = arg1.password;
  }

  if (!username || !password) throw new Error("Missing credentials");

  const secret = _getDeploymentSecret();

  const res = await fetch(adminEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, action: "admin.login", username, password }),
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (!data?.ok) throw new Error(data?.error || "Login failed");

  const displayName =
    _pickDisplayName(data?.user) ||
    _pickDisplayName(data?.result) ||
    _pickDisplayName(data) ||
    "";

  const role = data?.user?.role || data?.role || "staff";
  const token = data?.user?.token || data?.token || "";
  const ttl = data?.user?.ttlSec || data?.ttlSec || 3600;

  _writeSession({ username, displayName, role, token, ttlSec: ttl });

  if (!displayName) {
    await ensureAdminDisplayName();
  }

  return true;
}

export function adminLogout() {
  clearAdminSession();
  return true;
}
