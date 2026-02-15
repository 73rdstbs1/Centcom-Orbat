// background.js - starfield (DPR-safe) + hardened persistence
(() => {
  const STORAGE_KEY = "space_bg_stars_v2";
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
      if (viewW < 50 || viewH < 50) return;

      const payload = stars
        .map((s) => {
          const xr = clamp01((s.x || 0) / viewW);
          const yr = clamp01((s.y || 0) / viewH);
          if (xr == null || yr == null) return null;

          return {
            layerIndex: s.layerIndex,
            xRatio: xr,
            yRatio: yr,
            size: s.size,
            speed: s.speed,
            color: s.color,
            twinkle: s.twinkle,
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

  // -------------------------
  // Build / restore star list
  // -------------------------
  function initStars() {
    stars.length = 0;

    const stored = loadStarsFromStorage();
    if (stored && stored.length > 0) {
      const storedCounts = [0, 0, 0];
      stored.forEach((s) => {
        if (s.layerIndex != null && s.layerIndex >= 0 && s.layerIndex < storedCounts.length) {
          storedCounts[s.layerIndex]++;
        }
      });

      const mismatch = storedCounts.some((c, idx) => {
        const target = starLayers[idx] ? starLayers[idx].count : 0;
        return Math.abs(c - target) > Math.max(50, Math.round(target * 0.6));
      });

      if (!mismatch && viewW > 0 && viewH > 0) {
        for (const s of stored) {
          const xr = clamp01(s.xRatio);
          const yr = clamp01(s.yRatio);

          const x = xr == null ? Math.random() * viewW : xr * viewW;
          const y = yr == null ? Math.random() * viewH : yr * viewH;

          stars.push({
            x,
            y,
            size: s.size ?? 1.25,
            speed: s.speed ?? 0.05,
            color: s.color ?? "rgba(255,255,255,0.8)",
            twinkle: s.twinkle ?? Math.random() * 0.5,
            layerIndex: s.layerIndex ?? 0,
            xRatio: xr == null ? x / viewW : xr,
            yRatio: yr == null ? y / viewH : yr,
          });
        }
        return;
      }
      // else: fall through to regenerate
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
          twinkle: Math.random() * 0.5,
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
        star.x = viewW + Math.random() * 4;
        star.y = Math.random() * viewH;
      }

      // Keep ratios stable + safe
      star.xRatio = clamp01(star.x / viewW) ?? Math.random();
      star.yRatio = clamp01(star.y / viewH) ?? Math.random();
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
    try {
      saveStarsToStorage();
    } catch {}
    try {
      clearInterval(saveTimer);
    } catch {}
  });

  // Debug API
  window.SpaceBg = {
    save: saveStarsToStorage,
    load: () => initStars(),
    clearStorage: () => localStorage.removeItem(STORAGE_KEY),
  };
})();
