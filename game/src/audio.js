// All sound in Lantern Cove is synthesised with WebAudio: no audio files, nothing to load.
// A find rings a small two-note chime, a wrong click thuds, a hint sparkles upward, and
// finishing a level plays a short fanfare. The context is created lazily on the first user
// gesture, as browsers require, and every call is safe when sound is muted or unavailable.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
    return context;
  }

  function tone(freq, startOffset, duration, type, volume, slideTo) {
    const ctx = ensureContext();
    if (!ctx || muted) return;
    const start = ctx.currentTime + startOffset;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  return {
    unlock() {
      ensureContext();
    },
    isMuted() {
      return muted;
    },
    toggleMuted() {
      muted = !muted;
      return muted;
    },
    click() {
      tone(660, 0, 0.07, 'triangle', 0.08);
    },
    find(combo) {
      const base = 523.25 * Math.pow(1.059, Math.min(combo, 8));
      tone(base, 0, 0.16, 'sine', 0.16);
      tone(base * 1.335, 0.07, 0.22, 'sine', 0.14);
      tone(base * 2, 0.12, 0.18, 'triangle', 0.05);
    },
    wrong() {
      tone(160, 0, 0.18, 'sawtooth', 0.06, 90);
      tone(110, 0.02, 0.16, 'square', 0.04, 70);
    },
    hint() {
      tone(880, 0, 0.12, 'sine', 0.1);
      tone(1174.66, 0.08, 0.12, 'sine', 0.1);
      tone(1567.98, 0.16, 0.2, 'sine', 0.1);
    },
    tick() {
      tone(1180, 0, 0.05, 'square', 0.045);
    },
    levelComplete() {
      for (const [index, freq] of [523.25, 659.25, 783.99, 1046.5].entries()) {
        tone(freq, index * 0.11, 0.3, 'triangle', 0.13);
      }
    },
    gameOver() {
      tone(392, 0, 0.25, 'triangle', 0.12);
      tone(329.63, 0.16, 0.25, 'triangle', 0.12);
      tone(261.63, 0.32, 0.45, 'triangle', 0.12);
    },
    victory() {
      for (const [index, freq] of [523.25, 659.25, 783.99, 1046.5, 1318.5].entries()) {
        tone(freq, index * 0.12, 0.4, 'triangle', 0.13);
      }
      tone(1567.98, 0.62, 0.6, 'sine', 0.1);
    },
  };
}
