/**
 * Stickpoint domain logic — re-exported from the shared, tested core package.
 *
 * This file used to hold a hand-ported copy of the web app's logic; it had
 * already drifted (the concrete_examples method was missing and quiz weights
 * differed). @workspace/core is the single source of truth now.
 */
export * from '@workspace/core';

/**
 * Feather icon names for each method — a mobile presentation concern, so it
 * lives here rather than in core (core's `icon` field uses the web app's
 * pixel-icon names).
 */
export const METHOD_FEATHER_ICONS: Record<string, string> = {
  problem_sets: 'grid',
  active_recall: 'zap',
  blurting: 'edit-3',
  practice_testing: 'check-square',
  feynman: 'message-square',
  concrete_examples: 'box',
  pomodoro: 'clock',
  self_explanation: 'book-open',
  elaborative_interrogation: 'help-circle',
};

export function featherIcon(methodId: string): string {
  return METHOD_FEATHER_ICONS[methodId] || 'book';
}
