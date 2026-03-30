import { Platform } from 'react-native';

/**
 * Programmatic sound engine using Web Audio API.
 * Generates kid-friendly tones, melodies, and effects without needing audio files.
 * Works on web; on native, expo-av with bundled assets can be swapped in later.
 */

let audioCtx: AudioContext | null = null;
let _muted = false;

function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    return audioCtx;
  } catch {
    // In-app browsers may block AudioContext entirely
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (muted) stopAllMusic();
}

export function toggleMute(): boolean {
  setMuted(!_muted);
  return _muted;
}

// ── Simple tone helper ───────────────────────────────────────

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delay = 0,
) {
  const ctx = getCtx();
  if (!ctx || _muted) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// ── Pop sound ────────────────────────────────────────────────

export function playPop() {
  const ctx = getCtx();
  if (!ctx || _muted) return;

  // Bright pop: fast pitch sweep + noise burst
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);

  // Add a little sparkle
  playTone(1800, 0.08, 'sine', 0.08, 0.02);
}

// ── Wrong tap sound ──────────────────────────────────────────

export function playWrong() {
  playTone(200, 0.2, 'square', 0.08);
  playTone(150, 0.2, 'square', 0.06, 0.1);
}

// ── Word accepted sound ──────────────────────────────────────

export function playWordSuccess() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.15, i * 0.1);
  });
}

// ── Picture word bonus — festive celebration! ────────────────

export function playPictureBonus() {
  const ctx = getCtx();
  if (!ctx || _muted) return;

  // Triumphant ascending fanfare with sparkle harmonics
  const fanfare = [
    { freq: 523, dur: 0.12 }, // C5
    { freq: 659, dur: 0.12 }, // E5
    { freq: 784, dur: 0.12 }, // G5
    { freq: 1047, dur: 0.15 }, // C6
    { freq: 1175, dur: 0.12 }, // D6
    { freq: 1319, dur: 0.12 }, // E6
    { freq: 1568, dur: 0.25 }, // G6 (big finish!)
  ];

  let t = 0;
  fanfare.forEach(({ freq, dur }) => {
    playTone(freq, dur + 0.1, 'sine', 0.18, t);
    playTone(freq * 1.5, dur + 0.05, 'sine', 0.06, t); // sparkle harmony
    playTone(freq * 2, dur * 0.5, 'sine', 0.04, t + 0.02); // high shimmer
    t += dur;
  });

  // Celebration chime tail
  setTimeout(() => {
    if (_muted) return;
    [1568, 1760, 2093, 1760, 1568].forEach((freq, i) => {
      playTone(freq, 0.1, 'sine', 0.06, i * 0.08);
    });
  }, (t * 1000) + 50);
}

// ── Victory / completion jingle ──────────────────────────────

export function playVictory() {
  // Happy ascending fanfare
  const melody = [
    { freq: 523, dur: 0.15 }, // C5
    { freq: 587, dur: 0.15 }, // D5
    { freq: 659, dur: 0.15 }, // E5
    { freq: 784, dur: 0.15 }, // G5
    { freq: 880, dur: 0.15 }, // A5
    { freq: 1047, dur: 0.3 }, // C6
    { freq: 1047, dur: 0.15 }, // C6
    { freq: 1175, dur: 0.4 }, // D6
  ];

  let t = 0;
  melody.forEach(({ freq, dur }) => {
    playTone(freq, dur + 0.05, 'sine', 0.15, t);
    playTone(freq * 1.5, dur + 0.05, 'sine', 0.05, t); // harmony
    t += dur;
  });
}

// ── Game Over sound ──────────────────────────────────────────

export function playGameOver() {
  const notes = [440, 370, 311, 262]; // A4 → descending
  notes.forEach((freq, i) => {
    playTone(freq, 0.25, 'triangle', 0.12, i * 0.2);
  });
}

// ── Background music ─────────────────────────────────────────

let bgInterval: ReturnType<typeof setInterval> | null = null;
let bgOscillators: OscillatorNode[] = [];

// Simple looping melody using pentatonic scale (kid-friendly, always pleasant)
const HOME_MELODY = [
  523, 587, 659, 784, 880, 784, 659, 587,
  523, 659, 784, 880, 1047, 880, 784, 659,
];

const GAME_MELODY = [
  392, 440, 523, 440, 392, 330, 392, 440,
  523, 587, 523, 440, 392, 440, 523, 392,
];

function startMelodyLoop(notes: number[], bpm = 120, volume = 0.06) {
  stopAllMusic();
  if (_muted) return;

  const ctx = getCtx();
  if (!ctx) return;

  let noteIndex = 0;
  const interval = (60 / bpm) * 1000; // ms per beat

  const playNext = () => {
    if (_muted) { stopAllMusic(); return; }
    const freq = notes[noteIndex % notes.length];
    playTone(freq, (interval / 1000) * 0.8, 'sine', volume);
    // Soft bass
    playTone(freq / 2, (interval / 1000) * 0.6, 'triangle', volume * 0.4);
    noteIndex++;
  };

  playNext();
  bgInterval = setInterval(playNext, interval);
}

export function startHomeMusic() {
  startMelodyLoop(HOME_MELODY, 100, 0.05);
}

export function startGameMusic() {
  startMelodyLoop(GAME_MELODY, 130, 0.04);
}

export function stopAllMusic() {
  if (bgInterval) {
    clearInterval(bgInterval);
    bgInterval = null;
  }
  bgOscillators.forEach(osc => {
    try { osc.stop(); } catch {}
  });
  bgOscillators = [];
}

// Resume audio context after user interaction (browser requirement)
export function resumeAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}
