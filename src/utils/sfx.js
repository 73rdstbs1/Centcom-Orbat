// FILE: src/utils/sfx.js
/**
 * Simple SFX helpers (lazy-loaded, cached Audio instances).
 *
 * All paths are served from /public.
 */
let browseAudio;
let clickAudio;

function safePlay(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    // Audio play can be blocked unless triggered by user interaction.
    audio.play().catch(() => {});
  } catch {}
}

export function playMenuBrowse() {
  if (!browseAudio) {
    browseAudio = new Audio("/sound/Orbat Main Menu Browse.ogg");
    browseAudio.volume = 0.6;
  }
  safePlay(browseAudio);
}

export function playMenuClick() {
  if (!clickAudio) {
    clickAudio = new Audio("/sound/Orbat Main Menu Click.ogg");
    clickAudio.volume = 0.7;
  }
  safePlay(clickAudio);
}
