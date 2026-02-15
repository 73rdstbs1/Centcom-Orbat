/* /public/space-bg.js
   Starfield background (column-proof)
   - No localStorage / no seeded repeats
   - No integer snapping (prevents vertical banding/columns)
   - Delta-time update (prevents bunching when FPS changes)
   - Wrap spawns into a randomized right-side band
*/

(() => {
  const canvas = document.getElementById("space-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  // Config
  const STAR_DENSITY = 0.00012; // stars per pixel (tune)
  const MIN_STARS = 220;
  const MAX_STARS = 1400;

  const BASE_SPEED = 22;        // px/sec baseline
  const SPEED_VARIANCE = 38;    // px/sec extra based on depth
  const DRIFT_Y = 2.2;          // subtle vertical drift to avoid banding
  const WRAP_BAND = 0.35;       // respawn stars in [w, w*(1+WRAP_BAND)]

  const BG = "rgba(0,0,0,0)";   // keep transparent, CSS sets body bg

  let w = 0, h = 0, dpr = 1;
  let stars = [];
  let lastT = performance.now();

  function rand() {
    // Using Math.random is fine; avoid any persistent seed that can repeat.
    return Math.random();
  }

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = Math.max(1, window.innerWidth);
    const cssH = Math.max(1, window.innerHeight);

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    w = canvas.width;
    h = canvas.height;

    // Rebuild stars on resize to avoid “stuck” distributions
    const target = Math.max(
      MIN_STARS,
      Math.min(MAX_STARS, Math.floor((cssW * cssH) * STAR_DENSITY))
    );

    stars = new Array(target).fill(0).map(() => makeStar(true));

    // Reset timing so we don’t get a massive dt spike
    lastT = performance.now();
  }

  function makeStar(initial = false) {
    // Depth 0..1 (0 = far, 1 = near)
    const z = rand();

    // NOTE: do NOT floor x/y — keep them as floats
    const x = initial ? rand() * w : w + rand() * (w * WRAP_BAND);
    const y = rand() * h;

    // Size and alpha scale with depth
    const r = 0.6 + z * 1.6;                 // radius
    const a = 0.14 + z * 0.55;               // alpha

    // Speed scales with depth (near stars move faster)
    const vx = BASE_SPEED + z * SPEED_VARIANCE;
    const vy = (rand() - 0.5) * DRIFT_Y * (0.4 + z); // tiny drift

    // Small per-star twinkle phase
    const tw = rand() * Math.PI * 2;
    const twSpd = 0.6 + rand() * 1.1;

    return { x, y, z, r, a, vx, vy, tw, twSpd };
  }

  function step(t) {
    const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000)); // clamp 0..50ms
    lastT = t;

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Optional very subtle fade layer (helps prevent “trails” if you ever add blur)
    // ctx.fillStyle = "rgba(0,0,0,0.05)";
    // ctx.fillRect(0, 0, w, h);

    // Draw
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      // Update (move left)
      s.x -= s.vx * dt * dpr;
      s.y += s.vy * dt * dpr;

      // Twinkle (tiny)
      s.tw += s.twSpd * dt;
      const twinkle = 0.85 + 0.15 * Math.sin(s.tw);

      // Wrap Y gently (keeps distribution even)
      if (s.y < -20) s.y = h + 20;
      if (s.y > h + 20) s.y = -20;

      // If star exits left, respawn to the right with fresh randomness
      if (s.x < -40) {
        stars[i] = makeStar(false);
        continue;
      }

      // Render star
      const alpha = s.a * twinkle;

      // Keeping fills float-based avoids column artifacts caused by integer snapping
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214, 241, 255, ${alpha.toFixed(4)})`;
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  // Kick off
  resize();
  window.addEventListener("resize", resize, { passive: true });
  requestAnimationFrame(step);
})();
