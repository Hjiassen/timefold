import * as THREE from 'three';
import { createIcons, Upload, Download, Play, Pause, RotateCcw, ChevronDown, Move3d, Sparkles, Film, Settings2, CircleHelp, Maximize2, Plus, Minus } from 'lucide';
import { frameChanges, instantSliceLayout, particlePositions, sampleTimes, timePosition } from './sampling.js';
import { clampZoom, zoomFromWheel } from './zoom.js';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Timefold 首页"><span class="brand-mark">T</span><span>timefold</span></a>
    <span class="top-divider"></span>
    <button class="project-name">雨夜行者 <i data-lucide="chevron-down"></i></button>
    <div class="top-status"><span class="status-dot"></span><span id="statusText">示例场景</span></div>
    <div class="top-actions"><button class="icon-button help-button" title="帮助" aria-label="帮助"><i data-lucide="circle-help"></i></button><button class="export-button" id="exportBtn"><i data-lucide="download"></i><span>导出画面</span></button></div>
  </header>
  <main class="workspace">
    <aside class="sidebar">
      <section class="section-block source-block"><div class="section-heading"><span class="step">01</span><h2>影像源</h2></div><button class="upload-zone" id="uploadBtn"><span class="upload-icon"><i data-lucide="upload"></i></span><span class="upload-copy"><strong id="uploadTitle">导入视频</strong><small id="uploadHint">MP4、MOV · 本地处理</small></span><i class="upload-arrow" data-lucide="plus"></i></button><input type="file" id="videoInput" accept="video/*" hidden/><div class="source-meta" id="sourceMeta"><span>DEMO FOOTAGE</span><span>00:12</span></div></section>
      <section class="section-block"><div class="section-heading"><span class="step">02</span><h2>空间采样</h2><span class="heading-info">等距</span></div><div class="control-row"><label for="interval">时间间隔</label><div class="stepper"><button data-step="interval" data-dir="-1" aria-label="减少时间间隔"><i data-lucide="minus"></i></button><input id="interval" type="number" min="0.25" max="5" step="0.25" value="1.0"><span>秒</span><button data-step="interval" data-dir="1" aria-label="增加时间间隔"><i data-lucide="plus"></i></button></div></div><div class="range-wrap"><input id="intervalRange" type="range" min="0.25" max="5" step="0.25" value="1"><div class="range-labels"><span>更密</span><span>更疏</span></div></div><div class="sample-summary"><span class="summary-mark"></span><span>当前切片</span><strong id="sliceCount">13</strong><span>片</span></div></section>
      <section class="section-block"><div class="section-heading"><span class="step">03</span><h2>粒子形态</h2></div><div class="control-row"><label for="density">粒子密度</label><span class="value-label" id="densityLabel">32 px</span></div><input id="density" class="full-range" type="range" min="12" max="72" step="4" value="32"><div class="control-row color-row"><label>色彩映射</label><div class="segmented"><button class="selected" data-color="original" aria-label="原始色彩" title="原始色彩"><span class="swatch swatch-original"></span></button><button data-color="spectrum" aria-label="光谱" title="光谱"><span class="swatch swatch-spectrum"></span></button><button data-color="mono" aria-label="单色" title="单色"><span class="swatch swatch-mono"></span></button></div></div><div class="control-row"><label for="particleSize">粒子尺寸</label><span class="value-label" id="particleLabel">1.5 px</span></div><input id="particleSize" class="full-range" type="range" min="0.7" max="3.5" step="0.1" value="1.5"></section>
      <div class="sidebar-bottom"><div class="render-note"><span class="render-icon"><i data-lucide="sparkles"></i></span><span><strong>实时粒子渲染</strong><small>由 GPU 加速</small></span><span class="live-dot"></span></div><button class="settings-link"><i data-lucide="settings-2"></i>高级设置<i data-lucide="chevron-down"></i></button></div>
    </aside>
    <section class="stage-wrap"><div class="stage-toolbar"><div class="view-label"><i data-lucide="move-3d"></i><span>时空视图</span><span class="view-separator">/</span><span class="muted" id="viewName">时间长廊</span></div><div class="view-tools"><div class="view-switcher" role="group" aria-label="相机视角"><button class="selected" data-view="overview" aria-pressed="true">时间长廊</button><button data-view="instant" aria-pressed="false">瞬间窗口</button><button data-view="side" aria-pressed="false">时间侧剖</button></div><button class="tool-button" id="resetView" title="重置视角" aria-label="重置视角"><i data-lucide="rotate-ccw"></i></button><button class="tool-button" id="fullscreenBtn" title="全屏" aria-label="全屏"><i data-lucide="maximize-2"></i></button><span class="tool-divider"></span><button class="zoom-button" data-zoom="-1" aria-label="缩小"><i data-lucide="minus"></i></button><span id="zoomLabel">100%</span><button class="zoom-button" data-zoom="1" aria-label="放大"><i data-lucide="plus"></i></button></div></div><div class="stage" id="stage"><div class="stage-glow"></div><div id="scene"></div><div class="axis axis-x"><span>X</span><i></i><small>时间</small></div><div class="axis axis-y"><span>Y</span><i></i><small>宽度</small></div><div class="axis axis-z"><span>Z</span><i></i><small>高度</small></div><div class="scene-annotation annotation-start"><span>00:00</span><i></i></div><div class="scene-annotation annotation-end"><i></i><span>00:12</span></div><div class="scene-caption"><span class="caption-overline">SPACETIME STUDY <span>·</span> 001</span><strong id="sceneTitle">雨夜行者</strong><span id="sceneDetail">12 秒 · 13 个时间切片</span></div><div class="drag-hint"><span class="mouse-glyph"></span>拖拽旋转视角</div><div class="stage-corner">X <span>→</span> TIME</div></div>
      <footer class="timeline"><div class="timeline-head"><div class="timeline-title"><i data-lucide="film"></i><span>时间序列</span><span class="timeline-duration" id="durationLabel">00:12.0</span></div><div class="timeline-actions"><span class="fps-label">24 FPS</span><button class="timeline-menu" aria-label="时间线设置"><i data-lucide="settings-2"></i></button></div></div><div class="timeline-track-area"><div class="time-ruler" id="timeRuler"></div><div class="track" id="timelineTrack"><div class="slice-ticks" id="sliceTicks"></div><input id="playhead" type="range" min="0" max="12" step="0.01" value="3.2" aria-label="播放位置"><div class="playhead-line" id="playheadLine"><span></span></div></div><div class="track-labels"><span>00:00</span><span>00:03</span><span>00:06</span><span>00:09</span><span id="endLabel">00:12</span></div></div><div class="transport"><div class="transport-left"><span class="current-time" id="currentTime">00:03.2</span><span class="time-slash">/</span><span class="total-time">00:12.0</span></div><button class="play-button" id="playBtn" aria-label="播放"><i data-lucide="play"></i></button><div class="transport-right"><button class="speed-button" id="speedBtn">1×</button><span class="transport-divider"></span><span class="slice-index" id="sliceIndex">04 / 13</span></div></div></footer></section>
  </main>
`;
createIcons({ icons: { Upload, Download, Play, Pause, RotateCcw, ChevronDown, Move3d, Sparkles, Film, Settings2, CircleHelp, Maximize2, Plus, Minus } });

const sceneHost = document.querySelector('#scene');
const stage = document.querySelector('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', '可旋转的视频时空粒子可视化');
sceneHost.append(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, stage.clientWidth / stage.clientHeight, 0.1, 100);
camera.up.set(0, 0, 1);
camera.position.set(11, -24, 12);
camera.lookAt(0, 0, 0);
const root = new THREE.Group();
scene.add(root);
const clock = new THREE.Clock();
const video = document.createElement('video');
video.muted = true;
video.playsInline = true;
let videoUrl;
let slices = [];
let playing = false;
let speed = 1;
let zoom = 1;
let activeColor = 'original';
let stageWidth = 11;
let duration = 12;
let frameWidth = 5.4, frameHeight = 3.24;
let cameraMode = 'overview';
let cameraReady = false;
const cameraTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();

const grid = new THREE.GridHelper(1, 24, 0x35504c, 0x26312f);
grid.rotation.x = Math.PI / 2;
grid.position.z = -2.2;
grid.material.transparent = true;
grid.material.opacity = 0.46;
root.add(grid);
const axes = new THREE.Group();
root.add(axes);
function label(text, color = '#82aaa0') {
  const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 48;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.font = '500 22px Inter, sans-serif'; ctx.fillText(text, 4, 30);
  const texture = new THREE.CanvasTexture(canvas); const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })); sprite.scale.set(1.25, 0.31, 1); return sprite;
}
function drawAxes(width = 5.4, height = 3.24) {
  frameWidth = width; frameHeight = height;
  axes.traverse(object => { object.geometry?.dispose(); object.material?.map?.dispose(); object.material?.dispose(); });
  axes.clear();
  const x0 = -stageWidth / 2 - 1, x1 = stageWidth / 2 + 1;
  const y0 = -frameWidth / 2 - .4, y1 = frameWidth / 2 + .4;
  const floor = -frameHeight / 2 - .6;
  grid.position.z = floor;
  grid.scale.set(stageWidth + 4, 1, frameWidth + 2);
  const mat = new THREE.LineBasicMaterial({ color: 0x668a80, transparent: true, opacity: 0.7 });
  const points = [[x0,y0,floor],[x1,y0,floor],[x0,y0,floor],[x0,y1,floor],[x0,y0,floor],[x0,y0,frameHeight / 2 + .5]];
  for (let i = 0; i < points.length; i += 2) { const geometry = new THREE.BufferGeometry().setFromPoints(points.slice(i, i + 2).map(p => new THREE.Vector3(...p))); axes.add(new THREE.Line(geometry, mat)); }
  const x = label('X / TIME'); x.position.set(x1,y0,floor-.35); axes.add(x);
  const y = label('Y / WIDTH'); y.position.set(x0,y1,floor-.35); axes.add(y);
  const z = label('Z / HEIGHT'); z.position.set(x0,y0,frameHeight / 2 + .8); axes.add(z);
}
const scan = new THREE.Group();
const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x8bd5bf, transparent: true, opacity: .09, depthWrite: false, side: THREE.DoubleSide }));
scanPlane.rotation.y = Math.PI / 2;
scanPlane.renderOrder = 2;
scan.add(scanPlane);
const scanEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0xe7b395, transparent: true, opacity: .85, depthTest: false }));
scanEdges.rotation.y = Math.PI / 2;
scanEdges.renderOrder = 3;
scan.add(scanEdges);
root.add(scan);
function fitCamera(instant = false) {
  root.updateMatrixWorld(true);
  const targetX = Number(document.querySelector('#playhead')?.value || 0);
  const focus = root.localToWorld(new THREE.Vector3(cameraMode === 'instant' ? timePosition(targetX, duration, stageWidth) : 0, 0, 0));
  const instantLayout = cameraMode === 'instant' ? instantSliceLayout(slices.map(slice => slice.time), targetX) : null;
  const stackBack = instantLayout ? Math.min(0, ...instantLayout.filter(Boolean).map(item => item.offset)) : -.35;
  const localDirection = cameraMode === 'instant' ? new THREE.Vector3(1, 0, 0) : cameraMode === 'side' ? new THREE.Vector3(.08, -1, .12) : new THREE.Vector3(.8, -1, .45);
  const direction = localDirection.applyQuaternion(root.quaternion).normalize();
  const up = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
  const inverseRotation = new THREE.Matrix4().lookAt(focus.clone().add(direction), focus, up).transpose();
  const inverseQuaternion = new THREE.Quaternion().setFromRotationMatrix(inverseRotation);
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
  let distance = 1;
  for (const x of (cameraMode === 'instant' ? [timePosition(targetX, duration, stageWidth) + stackBack - .35, timePosition(targetX, duration, stageWidth) + .35] : [-stageWidth / 2 - 2, stageWidth / 2 + 2]))
    for (const y of [-frameWidth / 2 - 1, frameWidth / 2 + 1])
      for (const z of [-frameHeight / 2 - 1, frameHeight / 2 + 1]) {
        const p = root.localToWorld(new THREE.Vector3(x, y, z)).sub(focus).applyQuaternion(inverseQuaternion);
        distance = Math.max(distance, p.z + Math.max(Math.abs(p.x) / tanH, Math.abs(p.y) / tanV));
      }
  desiredTarget.copy(focus);
  desiredCamera.copy(focus).addScaledVector(direction, distance * 1.08 / zoom);
  if (instant || !cameraReady) { camera.position.copy(desiredCamera); cameraTarget.copy(desiredCamera); lookTarget.copy(desiredTarget); cameraReady = true; }
  camera.far = Math.max(100, distance * 4);
  camera.updateProjectionMatrix();
}

function clearSlices() {
  for (const slice of slices) { root.remove(slice.group); slice.group.traverse(object => { object.geometry?.dispose(); object.material?.map?.dispose(); object.material?.dispose(); }); }
  slices = [];
}
function proceduralFrame(t, width, height) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, width, height); g.addColorStop(0, '#101a20'); g.addColorStop(0.55, '#263a40'); g.addColorStop(1, '#462c30'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 11; i++) { const x = (i * 67 + 19) % width; const h = 30 + (i % 4) * 24; ctx.fillStyle = i % 3 === 0 ? '#ca7862' : '#527d78'; ctx.fillRect(x, height * 0.56 - h, 22 + i % 4 * 8, h); }
  ctx.fillStyle = 'rgba(213, 126, 92, .17)'; ctx.fillRect(width * .12, height * .68, width * .76, height * .05);
  const px = width * (0.28 + 0.4 * t), py = height * .58;
  ctx.strokeStyle = '#dce4cb'; ctx.lineWidth = Math.max(3, width / 80); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(px, py - height * .17, width * .045, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, py - height * .12); ctx.lineTo(px - width * .01, py + height * .1); ctx.lineTo(px - width * .1, py + height * .25); ctx.moveTo(px - width * .01, py + height * .1); ctx.lineTo(px + width * .09, py + height * .2); ctx.moveTo(px - width * .01, py - height * .03); ctx.lineTo(px - width * .1, py + height * .03); ctx.moveTo(px, py - height * .03); ctx.lineTo(px + width * .08, py - height * .1); ctx.stroke();
  for (let i = 0; i < 30; i++) { const x = (i * 47 + t * 180) % width; ctx.fillStyle = i % 2 ? 'rgba(180,210,202,.33)' : 'rgba(213,126,92,.5)'; ctx.fillRect(x, (i * 31) % height, 1, height * .08); }
  return canvas;
}
function makeSlice(source, time, xPosition, maxWidth, maxHeight, previousPixels) {
  const pixelCanvas = document.createElement('canvas');
  const density = Number(document.querySelector('#density').value);
  const aspect = source.width / source.height;
  pixelCanvas.width = Math.max(12, Math.round(1600 / density)); pixelCanvas.height = Math.max(8, Math.round(pixelCanvas.width / aspect));
  const ctx = pixelCanvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(source, 0, 0, pixelCanvas.width, pixelCanvas.height);
  const pixels = ctx.getImageData(0, 0, pixelCanvas.width, pixelCanvas.height).data;
  const changes = frameChanges(pixels, previousPixels);
  const positions = particlePositions(pixelCanvas.width, pixelCanvas.height);
  const colors = [], motion = [];
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 3) {
    positions[p + 1] *= maxWidth; positions[p + 2] *= maxHeight;
    if (pixels[i + 3] < 10) { colors.push(0,0,0); motion.push(0); continue; }
    const lum = (pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114) / 255;
    let r, g, b;
    if (activeColor === 'spectrum') { const c = new THREE.Color().setHSL((0.48 + time / duration * .38 + lum * .15) % 1, .78, .42 + lum * .28); r = c.r; g = c.g; b = c.b; }
    else if (activeColor === 'mono') { r = .6 + lum * .4; g = .68 + lum * .3; b = .64 + lum * .31; }
    else { r = pixels[i] / 255; g = pixels[i + 1] / 255; b = pixels[i + 2] / 255; }
    const motionAmount = THREE.MathUtils.smoothstep(changes[p / 3], .07, .4);
    colors.push(THREE.MathUtils.lerp(r, 1, motionAmount * .55), THREE.MathUtils.lerp(g, .43, motionAmount * .55), THREE.MathUtils.lerp(b, .27, motionAmount * .55));
    motion.push(motionAmount);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setAttribute('motion', new THREE.Float32BufferAttribute(motion, 1));
  const pointSize = (maxWidth / pixelCanvas.width) * Number(document.querySelector('#particleSize').value) * .22;
  const material = new THREE.PointsMaterial({ size: pointSize, vertexColors: true, transparent: true, opacity: .9, sizeAttenuation: true, depthWrite: false });
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('void main() {', 'attribute float motion;\nvarying float vMotion;\nvoid main() {').replace('#include <color_vertex>', '#include <color_vertex>\nvMotion = motion;');
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'varying float vMotion;\nvoid main() {').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, .43, .27), vMotion * .35);\nfloat particleEdge = 1.0 - smoothstep(.38, .5, length(gl_PointCoord - vec2(.5)));\ndiffuseColor.a *= particleEdge;');
  };
  const points = new THREE.Points(geometry, material);
  const group = new THREE.Group(); group.position.x = xPosition; group.add(points);
  const stamp = label(formatTime(time, 1)); stamp.position.set(0,-maxWidth/2-.2,-maxHeight/2-.35); group.add(stamp);
  root.add(group);
  return { group, points, stamp, time, pixels, pointSize, baseX: xPosition, baseSize: pointSize / Number(document.querySelector('#particleSize').value) };
}
function rebuildDemo() {
  clearSlices(); duration = 12;
  const times = sampleTimes(duration, Number(document.querySelector('#interval').value));
  stageWidth = Math.max(12, Math.min(40, (times.length - 1) * 2));
  for (const time of times) { const canvas = proceduralFrame(time / duration, 240, 144); slices.push(makeSlice(canvas, time, timePosition(time, duration, stageWidth), 5.4, 3.24, slices.at(-1)?.pixels)); }
  scanPlane.scale.set(3.54, 5.7, 1); scanEdges.scale.set(3.54, 5.7, 1);
  drawAxes(); fitCamera();
  updateTimeline();
}
function captureVideoFrame(time) {
  return new Promise(resolve => {
    const done = () => { video.removeEventListener('seeked', done); const c = document.createElement('canvas'); const scale = Math.min(1, 540 / video.videoWidth); c.width = Math.round(video.videoWidth * scale); c.height = Math.round(video.videoHeight * scale); c.getContext('2d').drawImage(video, 0, 0, c.width, c.height); resolve(c); };
    if (Math.abs(video.currentTime - time) < .02 && video.readyState >= 2) done(); else { video.addEventListener('seeked', done, { once: true }); video.currentTime = time; }
  });
}
async function buildVideoSlices() {
  clearSlices();
  const times = sampleTimes(duration, Number(document.querySelector('#interval').value));
  stageWidth = Math.max(12, Math.min(40, (times.length - 1) * 2));
  const aspect = video.videoWidth / video.videoHeight;
  const frameW = Math.min(6.2, 3.6 * aspect); const frameH = frameW / aspect;
  drawAxes(frameW, frameH); fitCamera();
  document.querySelector('#statusText').textContent = '正在生成粒子切片';
  document.querySelector('#sliceCount').textContent = times.length;
  for (let i = 0; i < times.length; i++) {
    const frame = await captureVideoFrame(times[i]);
    slices.push(makeSlice(frame, times[i], timePosition(times[i], duration, stageWidth), frameW, frameH, slices.at(-1)?.pixels));
    if (i % 3 === 0) await new Promise(requestAnimationFrame);
  }
  scanPlane.scale.set(frameH + .3, frameW + .3, 1); scanEdges.scale.copy(scanPlane.scale);
  document.querySelector('#statusText').textContent = '本地视频 · 已就绪';
  document.querySelector('#sceneTitle').textContent = video.dataset.name || '本地视频';
  document.querySelector('#sceneDetail').textContent = `${formatTime(duration)} · ${times.length} 个时间切片`;
  document.querySelector('#sourceMeta').innerHTML = `<span>LOCAL VIDEO</span><span>${formatTime(duration)}</span>`;
  updateTimeline();
}
function formatTime(seconds, decimals = 0) { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toFixed(decimals).padStart(decimals ? 4 : 2, '0'); return `${m}:${s}`; }
function updateTimeline() {
  const interval = Number(document.querySelector('#interval').value);
  const times = sampleTimes(duration, interval);
  document.querySelector('#sliceCount').textContent = times.length;
  document.querySelector('#sceneDetail').textContent = `${formatTime(duration)} · ${times.length} 个时间切片`;
  document.querySelector('#durationLabel').textContent = formatTime(duration, 1);
  document.querySelector('#endLabel').textContent = formatTime(duration);
  document.querySelector('.total-time').textContent = formatTime(duration, 1);
  document.querySelector('.stage-corner').textContent = cameraMode === 'instant' ? '当前时刻 · 仅显示已发生切片' : 'X → 时间 · 全部帧同时显示';
  document.querySelectorAll('.axis, .scene-annotation').forEach(element => element.hidden = true);
  const ruler = document.querySelector('#timeRuler'); ruler.innerHTML = times.map((t, i) => `<span style="left:${(t / duration) * 100}%">${formatTime(t)}</span>`).join('');
  const ticks = document.querySelector('#sliceTicks'); ticks.innerHTML = times.map(t => `<i style="left:${(t / duration) * 100}%"></i>`).join('');
  const playhead = document.querySelector('#playhead'); playhead.max = duration;
  updatePlayhead(Number(playhead.value));
}
function updatePlayhead(time) {
  const pct = time / duration * 100;
  document.querySelector('#playheadLine').style.left = `${pct}%`;
  document.querySelector('#currentTime').textContent = formatTime(time, 1);
  scan.position.x = timePosition(time, duration, stageWidth);
  if (cameraMode === 'instant') fitCamera();
  const instantLayout = cameraMode === 'instant' ? instantSliceLayout(slices.map(slice => slice.time), time) : null;
  const nearest = instantLayout ? instantLayout.reduce((last, item, index) => item ? index : last, -1) : slices.reduce((best, item, index) => Math.abs(item.time - time) < Math.abs(slices[best]?.time - time ?? Infinity) ? index : best, 0);
  document.querySelector('#sliceIndex').textContent = `${String(nearest + 1).padStart(2, '0')} / ${String(slices.length).padStart(2, '0')}`;
  slices.forEach((slice, i) => {
    const layer = instantLayout?.[i];
    slice.group.visible = !instantLayout || Boolean(layer);
    slice.group.position.x = instantLayout ? timePosition(time, duration, stageWidth) + (layer?.offset || 0) : slice.baseX;
    slice.stamp.visible = !instantLayout || i === nearest;
    slice.points.renderOrder = i;
    slice.points.material.opacity = layer?.opacity ?? .9;
    slice.points.material.size = slice.baseSize * Number(document.querySelector('#particleSize').value);
  });
}
function render() {
  requestAnimationFrame(render);
  const dt = Math.min(clock.getDelta(), .05);
  if (playing) { const input = document.querySelector('#playhead'); let next = Number(input.value) + dt * speed; if (next >= duration) next = 0; input.value = next; updatePlayhead(next); }
  cameraTarget.lerp(desiredCamera, 1 - Math.exp(-5 * dt));
  lookTarget.lerp(desiredTarget, 1 - Math.exp(-5 * dt));
  camera.position.copy(cameraTarget);
  camera.up.copy(new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion));
  camera.lookAt(lookTarget);
  renderer.render(scene, camera);
}
render();
new ResizeObserver(() => { renderer.setSize(stage.clientWidth, stage.clientHeight); camera.aspect = stage.clientWidth / stage.clientHeight; fitCamera(); }).observe(stage);
rebuildDemo();

document.querySelector('#uploadBtn').addEventListener('click', () => document.querySelector('#videoInput').click());
document.querySelector('#videoInput').addEventListener('change', async e => {
  const file = e.target.files?.[0]; if (!file) return;
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  videoUrl = URL.createObjectURL(file); video.src = videoUrl; video.dataset.name = file.name.replace(/\.[^.]+$/, '');
  await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
  duration = video.duration; document.querySelector('#playhead').value = 0;
  document.querySelector('#uploadTitle').textContent = file.name.length > 21 ? `${file.name.slice(0, 18)}...` : file.name;
  document.querySelector('#uploadHint').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · 本地处理`;
  document.querySelector('#statusText').textContent = '准备本地视频';
  await buildVideoSlices();
});
document.querySelector('#playhead').addEventListener('input', e => updatePlayhead(Number(e.target.value)));
document.querySelector('#playBtn').addEventListener('click', () => { playing = !playing; const button = document.querySelector('#playBtn'); button.innerHTML = `<i data-playback-icon="${playing ? 'pause' : 'play'}"></i>`; createIcons({ icons: { Play, Pause }, nameAttr: 'data-playback-icon', attrs: { 'stroke-width': 2 } }); button.setAttribute('aria-label', playing ? '暂停' : '播放'); });
document.querySelector('#interval').addEventListener('input', e => { const v = Math.max(.25, Math.min(5, Number(e.target.value) || 1)); e.target.value = v; document.querySelector('#intervalRange').value = v; video.src ? buildVideoSlices() : rebuildDemo(); });
document.querySelector('#intervalRange').addEventListener('input', e => { document.querySelector('#interval').value = e.target.value; video.src ? buildVideoSlices() : rebuildDemo(); });
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => { const input = document.querySelector(`#${button.dataset.step}`); input.value = Math.max(.25, Math.min(5, Number(input.value) + Number(button.dataset.dir) * .25)); input.dispatchEvent(new Event('input')); }));
document.querySelector('#density').addEventListener('input', e => { document.querySelector('#densityLabel').textContent = `${e.target.value} px`; video.src ? buildVideoSlices() : rebuildDemo(); });
document.querySelector('#particleSize').addEventListener('input', e => { document.querySelector('#particleLabel').textContent = `${Number(e.target.value).toFixed(1)} px`; updatePlayhead(Number(document.querySelector('#playhead').value)); });
document.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => { activeColor = button.dataset.color; document.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('selected', b === button)); video.src ? buildVideoSlices() : rebuildDemo(); }));
function setZoom(value) {
  zoom = clampZoom(value);
  fitCamera();
  document.querySelector('#zoomLabel').textContent = `${Math.round(zoom * 100)}%`;
}
document.querySelector('#resetView').addEventListener('click', () => { root.rotation.set(0,0,0); setZoom(1); });
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  cameraMode = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  document.querySelector('#viewName').textContent = button.textContent;
  updateTimeline();
  fitCamera();
}));
document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => setZoom(zoom + Number(b.dataset.zoom) * .1)));
stage.addEventListener('wheel', e => {
  e.preventDefault();
  setZoom(zoomFromWheel(zoom, e.deltaY, e.deltaMode, stage.clientHeight));
}, { passive: false });
document.querySelector('#fullscreenBtn').addEventListener('click', () => stage.requestFullscreen?.());
document.querySelector('#speedBtn').addEventListener('click', e => { speed = speed === 1 ? 2 : speed === 2 ? .5 : 1; e.currentTarget.textContent = `${speed}×`; });
document.querySelector('#exportBtn').addEventListener('click', () => { renderer.render(scene, camera); const a = document.createElement('a'); a.download = 'timefold-spacetime.png'; a.href = renderer.domElement.toDataURL('image/png'); a.click(); });

let pointer;
stage.addEventListener('pointerdown', e => { if (e.target.closest('button, input, footer')) return; pointer = { x: e.clientX, y: e.clientY, rz: root.rotation.z, rx: root.rotation.x }; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e => { if (!pointer) return; root.rotation.z = pointer.rz + (e.clientX - pointer.x) * .004; root.rotation.x = Math.max(-.4, Math.min(.4, pointer.rx + (e.clientY - pointer.y) * .002)); fitCamera(); });
stage.addEventListener('pointerup', () => { pointer = null; });
window.addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT','BUTTON'].includes(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('#playBtn').click(); } });
