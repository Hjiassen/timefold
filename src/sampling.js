export function sampleTimes(duration, interval) {
  const times = [];
  for (let time = 0; time < duration; time += interval) times.push(time);
  if (times.at(-1) !== duration) times.push(duration);
  return times;
}

export function particlePositions(width, height) {
  const positions = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      positions.push(0, width === 1 ? 0 : x / (width - 1) - 0.5, height === 1 ? 0 : 0.5 - y / (height - 1));
    }
  }
  return positions;
}

export function timePosition(time, duration, span) {
  return duration > 0 ? (time / duration - 0.5) * span : 0;
}

export function instantSliceLayout(times, time, spacing = 0.06) {
  let latest = -1;
  for (let i = 0; i < times.length && times[i] <= time; i++) latest = i;
  return times.map((frameTime, i) => {
    if (i > latest) return null;
    const age = i === latest ? 0 : time - frameTime;
    return { offset: (frameTime - time) * spacing, opacity: i === latest ? 1 : Math.max(.04, Math.exp(-age * .25)) };
  });
}

export function frameChanges(current, previous) {
  if (current.length % 4 || (previous && current.length !== previous.length)) throw new RangeError('Frame pixel buffers must have matching RGBA pixels');
  const changes = new Float32Array(current.length / 4);
  if (!previous) return changes;
  for (let i = 0; i < changes.length; i++) {
    const p = i * 4;
    if (current[p + 3] < 10 || previous[p + 3] < 10) continue;
    changes[i] = (Math.abs(current[p] - previous[p]) + Math.abs(current[p + 1] - previous[p + 1]) + Math.abs(current[p + 2] - previous[p + 2])) / 765;
  }
  return changes;
}
