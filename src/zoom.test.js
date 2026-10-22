import test from 'node:test';
import assert from 'node:assert/strict';
import { clampZoom, zoomFromWheel } from './zoom.js';

test('wheel zooms in upward, out downward, and stays still without vertical movement', () => {
  assert.ok(zoomFromWheel(1, -60, 0, 600) > 1);
  assert.ok(zoomFromWheel(1, 60, 0, 600) < 1);
  assert.equal(zoomFromWheel(1, 0, 0, 600), 1);
  const zoomed = zoomFromWheel(1, -20, 0, 600);
  assert.ok(Math.abs(zoomFromWheel(zoomed, 20, 0, 600) - 1) < 1e-10);
});

test('pixel, line and page wheel units produce consistent zoom', () => {
  const pixels = zoomFromWheel(1, 80, 0, 640);
  assert.equal(zoomFromWheel(1, 5, 1, 640), pixels);
  assert.equal(zoomFromWheel(1, .125, 2, 640), pixels);
});

test('wheel and buttons share zoom limits, including large wheel deltas', () => {
  assert.equal(clampZoom(.05), .1);
  assert.equal(clampZoom(3), 2);
  assert.equal(zoomFromWheel(.1, 10000, 0, 600), .1);
  assert.equal(zoomFromWheel(2, -10000, 0, 600), 2);
  assert.ok(zoomFromWheel(1, -10000, 0, 600) < 2);
});
