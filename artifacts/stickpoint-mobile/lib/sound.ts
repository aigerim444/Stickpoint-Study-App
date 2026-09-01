import { Platform } from 'react-native';

/**
 * The prototype's study chimes, ported from its Web Audio implementation.
 * Web-only for now — native builds stay silent until an audio module ships
 * with the store builds. Callers gate on state.soundOn.
 */
type Chime = 'correct' | 'complete' | 'star';

export function playSound(type: Chime): void {
  if (Platform.OS !== 'web') return;
  try {
    const AC = window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const plans =
      type === 'complete'
        ? [{ f: 523, t: 0 }, { f: 659, t: 0.11 }, { f: 784, t: 0.22 }, { f: 1047, t: 0.34 }]
        : type === 'correct'
          ? [{ f: 659, t: 0 }, { f: 880, t: 0.1 }]
          : [{ f: 880, t: 0 }, { f: 1047, t: 0.07 }, { f: 1319, t: 0.14 }];
    plans.forEach(({ f, t }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      o.type = type === 'complete' ? 'sine' : 'triangle';
      g.gain.setValueAtTime(0.13, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.32);
    });
    setTimeout(() => ctx.close(), 2200);
  } catch {
    // audio is a garnish, never an error
  }
}
