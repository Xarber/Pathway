// SPDX-License-Identifier: AGPL-3.0-only
export const MOTION = {
  pressMs: 120,
  easeOutBezier: [0.23, 1, 0.32, 1],
  disclosureMs: 180,
  feedbackMs: 200,
  exitMs: 120,
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
} as const;
export function motionPolicy(reduceMotion: boolean) {
  return {
    pressMs: reduceMotion ? 0 : MOTION.pressMs,
    pressScale: reduceMotion ? 1 : 0.97,
    disclosureMs: reduceMotion ? 120 : MOTION.disclosureMs,
    feedbackMs: reduceMotion ? 120 : MOTION.feedbackMs,
    translateFeedback: !reduceMotion,
  };
}
