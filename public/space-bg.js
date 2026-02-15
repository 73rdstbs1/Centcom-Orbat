// background.js - starfield with persistent positions via localStorage
(() => {
  const STORAGE_KEY = "space_bg_stars_v2";
  const SAVE_INTERVAL_MS = 2000;

  const canvas = document.getElementById("space-bg");
  const ctx = canvas.getContext("2d");

  // -------------------------
  // STARFIELD (3 depth layers)
  // -------------------------
  const starLayers = [
    { count: 300, speed: 0.025, size: 1.25, color: "rgba(255,255,255,0.8)" },
    { count: 150, speed: 0.1, size: 1.5, color: "rgba(180,200,255,0.9)" },
    { count: 100, speed: 0.2, size: 2, color: "rgba(120,160,255,1)" }
  ];

  // single flat array of stars (declare early so resize can reference it)
  const stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // when resizing, reapply absolute positions from stored ratios
    if (stars && stars.length) {
      stars.forEach(s => {
        if (s.xRatio != null) s.x = s.xRatio * canvas.width;
        if (s.yRatio != null) s.y = s.yRatio * canvas.height;
      });
    }
  }
  resize();
  window.addEventListener("resize", resize);

  // -------------------------
  // Storage helpers
  // -------------------------
  function saveStarsToStorage() {
    try {
      // store normalized positions (ratios) so stars scale to new window sizes
      const payload = stars.map(s => ({
        layerIndex: s.layerIndex,
        xRatio: (s.x / canvas.width) || 0,
        yRatio: (s.y / canvas.height) || 0,
        size: s.size,
        speed: s.speed,
        color: s.color,
        twinkle: s.twinkle
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      // console.debug("[space-bg] saved", payload.length, "stars");
    } catch (err) {
      // ignore storage failures (e.g. private mode)
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
    const stored = loadStarsFromStorage();
    if (stored && stored.length > 0) {
      const storedCounts = [0, 0, 0];
      stored.forEach(s => {
        if (s.layerIndex != null && s.layerIndex >= 0 && s.layerIndex < storedCounts.length) {
          storedCounts[s.layerIndex]++;
        }
      });

      const mismatch = storedCounts.some((c, idx) => {
        // allow some tolerance — if stored count for a layer deviates wildly, regen
        const target = starLayers[idx] ? starLayers[idx].count : 0;
        return Math.abs(c - target) > Math.max(50, Math.round(target * 0.6));
      });

      if (!mismatch) {
        // restore
        stored.forEach(s => {
          // calculate absolute positions from ratios; if ratios missing, randomise
          const x = (typeof s.xRatio === "number") ? s.xRatio * canvas.width : Math.random() * canvas.width;
          const y = (typeof s.yRatio === "number") ? s.yRatio * canvas.height : Math.random() * canvas.height;
          stars.push({
            x,
            y,
            size: s.size ?? 1.25,
            speed: s.speed ?? 0.05,
            color: s.color ?? "rgba(255,255,255,0.8)",
            twinkle: s.twinkle ?? Math.random() * 0.5,
            layerIndex: s.layerIndex ?? 0,
            // keep ratios so future resizes can reapply
            xRatio: (typeof s.xRatio === "number") ? s.xRatio : x / canvas.width,
            yRatio: (typeof s.yRatio === "number") ? s.yRatio : y / canvas.height
          });
        });
        // console.info("[space-bg] restored stars from storage:", stars.length);
        return;
      }
      // fallback to regenerate if mismatch
    }

    // no stored data or mismatch — generate fresh stars
    starLayers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        stars.push({
          x,
          y,
          size: layer.size,
          speed: layer.speed,
          color: layer.color,
          twinkle: Math.random() * 0.5,
          layerIndex,
          xRatio: x / canvas.width,
          yRatio: y / canvas.height
        });
      }
    });
    // console.info("[space-bg] generated fresh stars:", stars.length);
  }

  initStars();

  // -------------------------
  // STAR DRAWING
  // -------------------------
  function drawStars(deltaMs) {
    // optional twinkle could be based on time if you want
    stars.forEach(star => {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);

      // update logical position
      const timeFactor = (deltaMs / 16) || 1;
      star.x -= star.speed * timeFactor;
      if (star.x < 0) {
        star.x = canvas.width + Math.random() * 4; // tiny offset to avoid perfect edge
        star.y = Math.random() * canvas.height;
      }
      // keep ratios updated for persistence
      star.xRatio = star.x / canvas.width;
      star.yRatio = star.y / canvas.height;
    });

    ctx.globalAlpha = 1;
  }

  // -------------------------
  // MAIN LOOP (with time delta)
  // -------------------------
  let last = performance.now();
  function animate(now) {
    const delta = now - last;
    last = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars(delta);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // -------------------------
  // Periodic + unload save
  // -------------------------
  const saveTimer = setInterval(saveStarsToStorage, SAVE_INTERVAL_MS);

  window.addEventListener("beforeunload", () => {
    // final save (synchronous-ish)
    try {
      saveStarsToStorage();
    } catch (e) {
      // ignore
    }
  });

  // expose a small API for debugging or explicit control
  window.SpaceBg = {
    save: saveStarsToStorage,
    load: () => {
      // clear and re-init from storage
      stars.length = 0;
      initStars();
    },
    clearStorage: () => {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
})();
