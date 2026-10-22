export function clampZoom(value) {
  return Math.max(.1, Math.min(2, value));
}

export function zoomFromWheel(current, deltaY, deltaMode, pageHeight) {
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? pageHeight : 1);
  return clampZoom(current * Math.exp(-Math.max(-100, Math.min(100, pixels)) * .0015));
}
