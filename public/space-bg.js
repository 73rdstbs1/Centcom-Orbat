// background.js - starfield (DPR-safe) + hardened persistence + anti-row self-heal
(() => {
  const STORAGE_KEY = "space_bg_stars_v3";
  const SAVE_INTERVAL_MS = 2000;

  const canvas = document.getElementById("space-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  // -------------------------
  // STARFIELD (3 depth layers)
  // -------------------------
  const starLayers = [
    { count: 300, speed: 0.025, size: 1.25, color: "rgba(255,255,255,0.8)" },
    { count: 150, speed: 0.1, size: 1.5, color: "rgba(180,200,255,0.9)" },
    { count: 100, speed: 0.2, size: 2, color: "rgba(120,160,255,1)" },
  ];

  const stars = [];

  // We draw in CSS pixels; canvas backing store is DPR scaled.
  let viewW = 0;
  let viewH = 0;

  function clamp01(n) {
    if (!Number.isFinite(n)) return null;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  // small deterministic hash -> [0..1)
  function hash01(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // >>> 0 to uint32
    return ((h >>> 0) / 4294967296);
  }

  // Jitter a restored ratio so even identical stored ratios never align into rows.
  // jitterAmount is in "ratio space" (0..1), so 0.002 = 0.2% of the height.
  function jitterRatio(r, seedStr, jitterAmount = 0.002) {
    const base = clamp01(r);
    const seed = hash01(seedStr);
    // centered jitter in [-jitterAmount/2, +jitterAmount/2]
    const j = (seed - 0.5) * jitterAmount;
    const out = base == null ? seed : base + j;
    // wrap instead of clamp so distribution stays uniform
    const wrapped = ((out % 1) + 1) % 1;
    return wrapped;
  }

  function resize() {
    const cssW = Math.max(0, Math.floor(window.innerWidth || 0));
    const cssH = Math.max(0, Math.floor(window.innerHeight || 0));

    // Avoid poisoning ratios if browser reports transient zeros
    if (cssW < 50 || cssH < 50) return;

    viewW = cssW;
    viewH = cssH;

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

    // Backing store
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    // CSS size
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    // Reset transform so 1 unit = 1 CSS pixel
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Reapply absolute positions from ratios (stored in 0..1 space)
    if (stars.length) {
      for (const s of stars) {
        if (typeof s.xRatio === "number" && Number.isFinite(s.xRatio)) s.x = s.xRatio * viewW;
        if (typeof s.yRatio === "number" && Number.isFinite(s.yRatio)) s.y = s.yRatio * viewH;

        // If somehow invalid, randomize safely
        if (!Number.isFinite(s.x)) s.x = Math.random() * viewW;
        if (!Number.isFinite(s.y)) s.y = Math.random() * viewH;
      }
    }
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  // -------------------------
  // Storage helpers
  // -------------------------
  function saveStarsToStorage() {
    try {
      // If dimensions are bad, do NOT save (prevents line-corruption)
      if (viewW < 50 || viewH < 50) return;

      const payload = stars
        .map((s) => {
          const xr = clamp01((s.x || 0) / viewW);
          const yr = clamp01((s.y || 0) / viewH);
          if (xr == null || yr == null) return null;

          return {
            layerIndex: s.layerIndex,
            // store ratios only; absolute px rebuilt on load
            xRatio: xr,
            yRatio: yr,
            size: s.size,
            speed: s.speed,
            color: s.color,
          };
        })
        .filter(Boolean);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("[space-bg] save failed", err);
    }
  }

  function loadStarsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (!Array.isArray(payload)) return null;
      return payload;
    } catch (err) {
      console.warn("[space-bg] load failed", err);
      return null;
    }
  }

  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  // -------------------------
  // Detect "row collapse" (too many y values sharing the same few buckets)
  // -------------------------
  function looksLikeRows(starList) {
    if (!Array.isArray(starList) || starList.length < 50) return false;

    // Bucket yRatio into 200 buckets. If lots of stars pile into very few buckets, it's rows.
    const buckets = new Map();
    let valid = 0;

    for (const s of starList) {
      const yr = clamp01(s?.yRatio);
      if (yr == null) continue;
      valid++;
      const b = Math.floor(yr * 200);
      buckets.set(b, (buckets.get(b) || 0) + 1);
    }

    if (valid < 50) return true;

    const counts = Array.from(buckets.values()).sort((a, b) => b - a);
    const top5 = counts.slice(0, 5).reduce((sum, x) => sum + x, 0);

    // If the top 5 buckets contain >= 35% of stars, it's very likely collapsed rows.
    return top5 / valid >= 0.35;
  }

  // -------------------------
  // Build / restore star list
  // -------------------------
  function initStars() {
    stars.length = 0;

    const stored = loadStarsFromStorage();

    // If storage looks "row collapsed", discard it immediately.
    if (stored && looksLikeRows(stored)) {
      clearStorage();
    }

    const stored2 = loadStarsFromStorage();

    if (stored2 && stored2.length > 0 && viewW > 0 && viewH > 0) {
      // Restore with deterministic jitter so identical ratios never align.
      for (let i = 0; i < stored2.length; i++) {
        const s = stored2[i];
        const layerIndex = Number.isFinite(s.layerIndex) ? s.layerIndex : 0;

        const xr0 = clamp01(s.xRatio);
        const yr0 = clamp01(s.yRatio);

        // jitter differently per star + per axis (seed includes index)
        const xr = jitterRatio(xr0 ?? Math.random(), `x:${layerIndex}:${i}`, 0.0015);
        const yr = jitterRatio(yr0 ?? Math.random(), `y:${layerIndex}:${i}`, 0.0030);

        const x = xr * viewW;
        const y = yr * viewH;

        stars.push({
          x,
          y,
          size: s.size ?? 1.25,
          speed: s.speed ?? 0.05,
          color: s.color ?? "rgba(255,255,255,0.8)",
          layerIndex,
          xRatio: xr,
          yRatio: yr,
        });
      }

      // If AFTER jitter it still looks row-ish, nuke storage and regenerate.
      if (looksLikeRows(stars.map((s) => ({ yRatio: s.yRatio })))) {
        clearStorage();
        return initStars();
      }

      return;
    }

    // Generate fresh
    for (let layerIndex = 0; layerIndex < starLayers.length; layerIndex++) {
      const layer = starLayers[layerIndex];
      for (let i = 0; i < layer.count; i++) {
        const x = Math.random() * viewW;
        const y = Math.random() * viewH;
        stars.push({
          x,
          y,
          size: layer.size,
          speed: layer.speed,
          color: layer.color,
          layerIndex,
          xRatio: viewW ? x / viewW : Math.random(),
          yRatio: viewH ? y / viewH : Math.random(),
        });
      }
    }
  }

  initStars();

  // -------------------------
  // STAR DRAWING
  // -------------------------
  function drawStars(deltaMs) {
    // Guard: if view dims go bad, don’t update ratios (prevents storage corruption)
    if (viewW < 50 || viewH < 50) return;

    const timeFactor = (deltaMs / 16) || 1;

    for (const star of stars) {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);

      star.x -= star.speed * timeFactor;

      if (star.x < 0) {
        // wrap with a new y so distribution stays noisy
        star.x = viewW + Math.random() * 4;
        star.y = Math.random() * viewH;
      }

      // Keep ratios stable + safe
      const xr = clamp01(star.x / viewW);
      const yr = clamp01(star.y / viewH);

      // If anything goes weird, randomize the ratio instead of letting it collapse
      star.xRatio = xr == null ? Math.random() : xr;
      star.yRatio = yr == null ? Math.random() : yr;
    }
  }

  // -------------------------
  // MAIN LOOP
  // -------------------------
  let last = performance.now();
  function animate(now) {
    const delta = now - last;
    last = now;

    // Clear in CSS pixel space (transform handles DPR)
    ctx.clearRect(0, 0, viewW, viewH);
    drawStars(delta);

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // -------------------------
  // Periodic + unload save
  // -------------------------
  const saveTimer = setInterval(saveStarsToStorage, SAVE_INTERVAL_MS);

  window.addEventListener("beforeunload", () => {
    try { saveStarsToStorage(); } catch {}
    try { clearInterval(saveTimer); } catch {}
  });

  // Debug API
  window.SpaceBg = {
    save: saveStarsToStorage,
    reload: () => initStars(),
    clearStorage: () => {
      clearStorage();
      initStars();
    },
  };
})();
