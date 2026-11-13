// SPDX-License-Identifier: AGPL-3.0-only
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionPolicy, MOTION } from '../../../packages/design-system/src/motion.js';
import { colors, primaryAction } from '../../../packages/design-system/src/colors.js';
function luminance(hex: string) {
  const parts = hex
    .replace('#', '')
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
}
function contrast(foreground: string, background: string) {
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
test('Reduced Motion removes press scale and positional feedback without delaying actions', () => {
  const policy = motionPolicy(true);
  assert.equal(policy.pressScale, 1);
  assert.equal(policy.pressMs, 0);
  assert.equal(policy.translateFeedback, false);
  assert.ok(policy.disclosureMs <= 120);
  assert.ok(MOTION.feedbackMs <= 300);
});
test('normal motion stays brief and consistent', () => {
  const policy = motionPolicy(false);
  assert.equal(policy.pressMs, 120);
  assert.equal(policy.pressScale, 0.97);
  assert.equal(policy.disclosureMs, 180);
  assert.equal(policy.feedbackMs, 200);
});
test('theme text, secondary controls and destructive actions maintain normal-text contrast', () => {
  for (const palette of Object.values(colors)) {
    for (const background of [palette.bg, palette.surface, palette.soft]) {
      assert.ok(contrast(palette.text, background) >= 4.5);
      assert.ok(contrast(palette.muted, background) >= 4.5);
    }
    assert.ok(contrast(palette.accent, palette.soft) >= 4.5);
    assert.ok(contrast(palette.danger, palette.soft) >= 4.5);
  }
  assert.ok(contrast('#FFFFFF', primaryAction) >= 4.5);
});
