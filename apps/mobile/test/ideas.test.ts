// SPDX-License-Identifier: AGPL-3.0-only
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { reviewImport, mergeIdeas } from '../src/lib/ideas.js';
import type { Idea } from '../../../packages/shared/src/index.js';
const idea: Idea = {
  id: randomUUID(),
  title: 'Meet here',
  description: 'Public station',
  category: 'feature',
  priority: 'medium',
  status: 'new',
  createdAt: '2026-11-06T00:00:00.000Z',
  updatedAt: '2026-11-06T00:00:00.000Z',
};
const exported = (ideas: Idea[]) =>
  JSON.stringify({
    schemaVersion: 1,
    project: 'org.openrecode.pathway',
    exportedAt: '2026-11-06T00:00:00.000Z',
    ideas,
  });
test('Ideas preview detects conflicts without altering current records', () => {
  const current = [idea],
    incoming = { ...idea, title: 'Different title' };
  const review = reviewImport(exported([incoming]), current);
  assert.equal(review.added.length, 0);
  assert.equal(review.conflicts.length, 1);
  assert.equal(current[0].title, 'Meet here');
  assert.equal(mergeIdeas(current, review.incoming)[0].title, 'Meet here');
  assert.equal(mergeIdeas(current, review.incoming, true)[0].title, 'Different title');
});
test('Ideas duplicate IDs and incompatible schemas fail closed', () => {
  assert.throws(() => reviewImport(exported([idea, idea]), []), /Duplicate/);
  assert.throws(() => reviewImport('{"schemaVersion":9}', []));
});
test('Ideas merge is idempotent and adds only new stable IDs', () => {
  const other = { ...idea, id: randomUUID(), status: 'deferred' as const };
  const merged = mergeIdeas([idea], [idea, other]);
  assert.equal(merged.length, 2);
  assert.deepEqual(mergeIdeas(merged, [idea, other]), merged);
});
