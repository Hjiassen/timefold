import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTimes, particlePositions, timePosition, frameChanges, instantSliceLayout } from './sampling.js';

test('sampleTimes includes the video start and end at a steady interval', () => {
  assert.deepEqual(sampleTimes(10, 3), [0, 3, 6, 9, 10]);
});

test('particlePositions maps pixels to a centered YZ plane', () => {
  assert.deepEqual(particlePositions(2, 2), [0, -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5]);
});

test('particlePositions stays finite for a single-pixel dimension', () => {
  assert.deepEqual(particlePositions(1, 1), [0, 0, 0]);
});

test('timePosition follows timestamps, including a short final interval', () => {
  [0, 3, 6, 9, 10].forEach((t, i) => assert.ok(Math.abs(timePosition(t, 10, 20) - [-10, -4, 2, 8, 10][i]) < 1e-10));
  assert.equal(timePosition(0, 0, 20), 0);
});

test('instant layout hides future frames and stacks the latest past frame in front', () => {
  const layout = instantSliceLayout([0, 1, 2, 3], 1.4);
  assert.ok(Math.abs(layout[0].offset + .084) < 1e-10);
  assert.ok(Math.abs(layout[0].opacity - Math.exp(-.35)) < 1e-10);
  assert.ok(Math.abs(layout[1].offset + .024) < 1e-10);
  assert.equal(layout[1].opacity, 1);
  assert.deepEqual(layout.slice(2), [null, null]);
  assert.deepEqual(instantSliceLayout([0, 1], 0), [
    { offset: 0, opacity: 1 },
    null,
  ]);
  const trail = instantSliceLayout([0, 1, 2, 3], 3);
  assert.ok(trail[0].opacity < trail[1].opacity && trail[1].opacity < trail[2].opacity);
  assert.ok(trail[0].offset < trail[1].offset && trail[1].offset < trail[2].offset);
});

test('frameChanges measures RGB differences per pixel and ignores transparent pixels', () => {
  const previous = new Uint8ClampedArray([0, 0, 0, 255, 20, 40, 60, 255, 0, 0, 0, 255]);
  const current = new Uint8ClampedArray([255, 255, 255, 255, 20, 40, 60, 255, 255, 255, 255, 0]);
  assert.deepEqual([...frameChanges(current, previous)], [1, 0, 0]);
  assert.ok(Math.abs(frameChanges(new Uint8ClampedArray([255, 0, 0, 255]), new Uint8ClampedArray([0, 0, 0, 255]))[0] - 1 / 3) < 1e-7);
});

test('frameChanges has no motion without a previous sample and rejects incompatible buffers', () => {
  assert.deepEqual([...frameChanges(new Uint8ClampedArray(8))], [0, 0]);
  assert.throws(() => frameChanges(new Uint8ClampedArray(4), new Uint8ClampedArray(8)), RangeError);
  assert.throws(() => frameChanges(new Uint8ClampedArray(3)), RangeError);
});
