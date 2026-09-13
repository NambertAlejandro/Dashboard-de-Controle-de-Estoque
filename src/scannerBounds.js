// Coordinates for a centered video with object-fit: contain.
export function scannerBounds(result, video) {
  if (!video?.videoWidth || !video?.videoHeight || !video.clientWidth || !video.clientHeight) return null;
  const points = (result.getResultPoints?.() || []).filter(Boolean).map(point => ({
    x: point.getX?.() ?? point.x, y: point.getY?.() ?? point.y,
  })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (points.length < 2) return null;
  const width = video.clientWidth, height = video.clientHeight;
  const scale = Math.min(width / video.videoWidth, height / video.videoHeight);
  const offsetX = (width - video.videoWidth * scale) / 2;
  const offsetY = (height - video.videoHeight * scale) / 2;
  const xs = points.map(point => offsetX + point.x * scale);
  const ys = points.map(point => offsetY + point.y * scale);
  const left = Math.max(0, Math.min(...xs) - 10);
  const top = Math.max(0, Math.min(...ys) - 18);
  const right = Math.min(width, Math.max(...xs) + 10);
  const bottom = Math.min(height, Math.max(...ys) + 18);
  return { left: left / width * 100, top: top / height * 100,
    width: (right - left) / width * 100, height: (bottom - top) / height * 100 };
}
