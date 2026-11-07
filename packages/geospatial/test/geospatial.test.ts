import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coordinate, ideaExport } from '../../shared/src/index.js';
import { arrivalState, coarse, distance, rankMeetingPoints } from '../src/index.js';
test('coordinates and antimeridian distance', () => {
  assert.equal(coordinate.safeParse({ latitude: 91, longitude: 0 }).success, false);
  assert.ok(
    distance({ latitude: 0, longitude: 179.99 }, { latitude: 0, longitude: -179.99 }) < 2300,
  );
  assert.equal(distance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }), 0);
});
test('coarse reduction is bounded, idempotent and never exact for representative fixes', () => {
  for (const p of [
    { latitude: 41.912345, longitude: 12.498765 },
    { latitude: -90, longitude: -180 },
    { latitude: 90, longitude: 180 },
    { latitude: 0, longitude: 0 },
  ]) {
    const reduced = coarse(p);
    assert.equal(
      coordinate.safeParse({ latitude: reduced.latitude, longitude: reduced.longitude }).success,
      true,
    );
    assert.deepEqual(coarse(reduced), reduced);
    assert.ok(distance(p, reduced) < 1600);
  }
});
test('arrival needs repeated accurate fixes and dwell time, never confirms automatically', () => {
  const now = Date.now(),
    point = { latitude: 41.9, longitude: 12.49 };
  assert.equal(arrivalState([{ point, accuracy: 5, timestamp: now }], point, now), 'approaching');
  assert.equal(
    arrivalState(
      [40000, 20000, 0].map((t) => ({ point, accuracy: 5, timestamp: now - t })),
      point,
      now,
    ),
    'possibly_arrived',
  );
  assert.equal(
    arrivalState(
      [40000, 20000, 0].map((t) => ({ point, accuracy: 500, timestamp: now - t })),
      point,
      now,
    ),
    'approaching',
  );
});
test('meeting ranking excludes missing route values and respects objective', () => {
  const candidates = [
    { id: 'a', durations: [1, 20] },
    { id: 'b', durations: [12, 12] },
    { id: 'bad', durations: [NaN] },
  ];
  assert.equal(rankMeetingPoints(candidates, 'latest')[0].id, 'b');
  assert.equal(rankMeetingPoints(candidates, 'total')[0].id, 'a');
  assert.equal(rankMeetingPoints(candidates).length, 2);
});
test('ideas format rejects incompatible exports and malformed records', () => {
  assert.equal(
    ideaExport.safeParse({
      schemaVersion: 2,
      project: 'org.openrecode.pathway',
      exportedAt: new Date().toISOString(),
      ideas: [],
    }).success,
    false,
  );
  assert.equal(
    ideaExport.safeParse({
      schemaVersion: 1,
      project: 'org.openrecode.pathway',
      exportedAt: new Date().toISOString(),
      ideas: [{ title: 'missing stable id' }],
    }).success,
    false,
  );
});
