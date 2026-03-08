/**
 * SnapRecord Pro - Screenshot Annotation Editor v2.0
 */

const COLORS = [
  '#FF6B6B','#FF8E53','#FBBF24','#34D399','#60A5FA','#A78BFA','#F9FAFB','#1F2937',
  '#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#06B6D4',
  '#DC2626','#EA580C','#CA8A04','#16A34A','#2563EB','#7C3AED','#DB2777','#0891B2'
];

const EMOJIS = ['👍','👎','❤️','🔥','⭐','💡','✅','❌','⚠️','📌','🎯','🔍','✏️','💬','📊','🚀','🎉','💯','🤔','👀','🙌','💪','🎨','📱'];

let mainCanvas, drawCanvas, mainCtx, drawCtx;
let currentTool = 'pen';
let currentColor = '#FF6B6B';
let strokeSize = 3;
let isDrawing = false;
let lastX = 0, lastY = 0;
let history = [];
let historyIndex = -1;
let hasImage = false;
let imgDims = { w: 0, h: 0 };
let blurStrength = 10;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  mainCanvas = document.getElementById('main-canvas');
  drawCanvas = document.getElementById('draw-canvas');
  mainCtx = mainCanvas.getContext('2d');
  drawCtx = drawCanvas.getContext('2d');

  initTools();
  initColors();
  initSlider();
  initUndoRedo();
  initFileInput();
  initTextInput();
  initEmojiPicker();
  initColorPicker();
  initActions();
  initKeyboard();

  // Load from session storage
  try {
    const data = await chrome.storage.session.get('screenshotData');
    if (data.screenshotData?.imageData) {
      loadImageFromUrl(data.screenshotData.imageData);
    }
  } catch (e) {}
});

// ==================== TOOLS ====================
function initTools() {
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tool === 'emoji') { toggleEmojiPicker(btn); return; }
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      updateCursor();
      updateStatus();
    });
  });
}

function updateCursor() {
  const cursors = { pen: 'crosshair', highlighter: 'crosshair', arrow: 'crosshair',
    rect: 'crosshair', circle: 'crosshair', line: 'crosshair', text: 'text', blur: 'cell', emoji: 'default' };
  drawCanvas.style.cursor = cursors[currentTool] || 'crosshair';
}

// ==================== COLORS ====================
function initColors() {
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentColor = swatch.dataset.color;
      updateStatus();
    });
  });

  // Build color picker palette
  const cpSwatches = document.getElementById('cp-swatches');
  COLORS.forEach(c => {
    const s = document.createElement('div');
    s.className = 'cp-swatch';
    s.style.background = c;
    s.addEventListener('click', () => { setColor(c); closeColorPicker(); });
    cpSwatches.appendChild(s);
  });

  document.getElementById('custom-color').addEventListener('input', e => setColor(e.target.value));
}

function setColor(c) {
  currentColor = c;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  updateStatus();
}

// ==================== COLOR PICKER ====================
function initColorPicker() {
  const btn = document.getElementById('btn-color-picker');
  const popup = document.getElementById('color-popup');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = btn.getBoundingClientRect();
    popup.style.top = (rect.bottom + 6) + 'px';
    popup.style.left = rect.left + 'px';
    popup.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && e.target !== btn) closeColorPicker();
  });
}
function closeColorPicker() { document.getElementById('color-popup').classList.remove('show'); }

// ==================== SLIDER ====================
function initSlider() {
  const slider = document.getElementById('stroke-size');
  slider.addEventListener('input', () => { strokeSize = parseInt(slider.value); updateStatus(); });
}

// ==================== UNDO/REDO ====================
function initUndoRedo() {
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-clear').addEventListener('click', clearDrawing);
}

function saveToHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
  historyIndex = history.length - 1;
  if (history.length > 50) { history.shift(); historyIndex--; }
}

function undo() {
  if (historyIndex <= 0) {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    history = []; historyIndex = -1;
  } else {
    historyIndex--;
    drawCtx.putImageData(history[historyIndex], 0, 0);
  }
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  drawCtx.putImageData(history[historyIndex], 0, 0);
}

function clearDrawing() {
  saveToHistory();
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

// ==================== DRAWING ====================
function initCanvas() {
  drawCanvas.addEventListener('mousedown', onMouseDown);
  drawCanvas.addEventListener('mousemove', onMouseMove);
  drawCanvas.addEventListener('mouseup', onMouseUp);
  drawCanvas.addEventListener('mouseleave', onMouseUp);
}

let startX, startY, snapshot;

function onMouseDown(e) {
  if (!hasImage) return;
  if (currentTool === 'text') { placeTextInput(e); return; }
  if (currentTool === 'emoji') return;

  isDrawing = true;
  const pos = getPos(e);
  lastX = startX = pos.x;
  lastY = startY = pos.y;
  snapshot = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);

  if (currentTool === 'pen' || currentTool === 'highlighter') {
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
  }
}

function onMouseMove(e) {
  if (!isDrawing) return;
  const pos = getPos(e);
  const x = pos.x, y = pos.y;

  if (currentTool === 'pen') {
    drawCtx.globalAlpha = 1;
    drawCtx.globalCompositeOperation = 'source-over';
    drawCtx.strokeStyle = currentColor;
    drawCtx.lineWidth = strokeSize;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    lastX = x; lastY = y;
  } else if (currentTool === 'highlighter') {
    drawCtx.putImageData(snapshot, 0, 0);
    drawCtx.globalAlpha = 0.35;
    drawCtx.strokeStyle = currentColor;
    drawCtx.lineWidth = strokeSize * 4;
    drawCtx.lineCap = 'square';
    drawCtx.moveTo(startX, startY);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    drawCtx.globalAlpha = 1;
  } else {
    drawCtx.putImageData(snapshot, 0, 0);
    drawShape(currentTool, startX, startY, x, y);
  }

  updateStatus(`${Math.abs(x - startX)}×${Math.abs(y - startY)}`);
}

function onMouseUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  if (currentTool !== 'pen') {
    const pos = getPos(e);
    drawCtx.putImageData(snapshot, 0, 0);
    drawShape(currentTool, startX, startY, pos.x, pos.y);
  }
  saveToHistory();
  updateStatus();
}

function drawShape(tool, x1, y1, x2, y2) {
  drawCtx.globalAlpha = 1;
  drawCtx.globalCompositeOperation = 'source-over';
  drawCtx.strokeStyle = currentColor;
  drawCtx.fillStyle = currentColor;
  drawCtx.lineWidth = strokeSize;
  drawCtx.lineCap = 'round';

  switch (tool) {
    case 'rect':
      drawCtx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      break;
    case 'circle':
      drawCtx.beginPath();
      const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2;
      drawCtx.ellipse(x1 + rx, y1 + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
      drawCtx.stroke();
      break;
    case 'line':
      drawCtx.beginPath();
      drawCtx.moveTo(x1, y1); drawCtx.lineTo(x2, y2); drawCtx.stroke();
      break;
    case 'arrow':
      drawArrow(x1, y1, x2, y2);
      break;
    case 'blur':
      applyBlur(x1, y1, x2 - x1, y2 - y1);
      break;
  }
}

function drawArrow(x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = Math.min(20 + strokeSize * 2, 40);
  drawCtx.beginPath();
  drawCtx.moveTo(x1, y1); drawCtx.lineTo(x2, y2); drawCtx.stroke();
  drawCtx.beginPath();
  drawCtx.moveTo(x2, y2);
  drawCtx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  drawCtx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  drawCtx.closePath(); drawCtx.fill();
}

function applyBlur(x, y, w, h) {
  if (w === 0 || h === 0) return;
  const [rx, ry, rw, rh] = [Math.min(x, x+w), Math.min(y, y+h), Math.abs(w), Math.abs(h)];
  // Get pixels from main canvas and blur
  const imageData = mainCtx.getImageData(rx, ry, rw, rh);
  const blurred = boxBlur(imageData, 10);
  // Draw blurred overlay
  const offscreen = document.createElement('canvas');
  offscreen.width = rw; offscreen.height = rh;
  offscreen.getContext('2d').putImageData(blurred, 0, 0);
  drawCtx.drawImage(offscreen, rx, ry);
  // Draw gray overlay
  drawCtx.fillStyle = 'rgba(0,0,0,0.3)';
  drawCtx.fillRect(rx, ry, rw, rh);
}

function boxBlur(imageData, radius) {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          const idx = (ny * width + nx) * 4;
          r += data[idx]; g += data[idx+1]; b += data[idx+2]; count++;
        }
      }
      const i = (y * width + x) * 4;
      out[i] = r/count; out[i+1] = g/count; out[i+2] = b/count; out[i+3] = data[i+3];
    }
  }
  return new ImageData(out, width, height);
}

// ==================== TEXT ====================
function initTextInput() {
  const ti = document.getElementById('text-input');
  ti.addEventListener('keydown', e => {
    if (e.key === 'Escape') ti.style.display = 'none';
    if (e.key === 'Enter' && e.ctrlKey) commitText();
  });
  ti.addEventListener('blur', commitText);
}

function placeTextInput(e) {
  const pos = getPos(e);
  const ti = document.getElementById('text-input');
  ti.style.display = 'block';
  ti.style.left = pos.x + 'px';
  ti.style.top = pos.y + 'px';
  ti.style.color = currentColor;
  ti.style.fontSize = (12 + strokeSize * 2) + 'px';
  ti.value = '';
  ti.focus();
}

function commitText() {
  const ti = document.getElementById('text-input');
  if (!ti.value.trim() || ti.style.display === 'none') return;
  const x = parseInt(ti.style.left), y = parseInt(ti.style.top);
  drawCtx.font = `bold ${ti.style.fontSize} 'Space Grotesk', sans-serif`;
  drawCtx.fillStyle = currentColor;
  drawCtx.globalAlpha = 1;
  ti.value.split('\n').forEach((line, i) => {
    drawCtx.fillText(line, x, y + parseInt(ti.style.fontSize) * (i + 1));
  });
  ti.style.display = 'none';
  saveToHistory();
}

// ==================== EMOJI ====================
function initEmojiPicker() {
  const grid = document.getElementById('emoji-grid');
  EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn'; btn.textContent = emoji;
    btn.addEventListener('click', () => {
      currentEmoji = emoji;
      document.getElementById('emoji-popup').classList.remove('show');
      activateEmojiPlacement(emoji);
    });
    grid.appendChild(btn);
  });
}

let currentEmoji = '⭐';
function toggleEmojiPicker(btn) {
  const popup = document.getElementById('emoji-popup');
  const rect = btn.getBoundingClientRect();
  popup.style.top = (rect.bottom + 6) + 'px';
  popup.style.left = rect.left + 'px';
  popup.classList.toggle('show');
}

function activateEmojiPlacement(emoji) {
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
  drawCanvas.style.cursor = 'none';
  const handler = (e) => {
    const pos = getPos(e);
    const size = 24 + strokeSize * 3;
    drawCtx.font = size + 'px serif';
    drawCtx.fillText(emoji, pos.x - size/2, pos.y + size/2);
    saveToHistory();
    drawCanvas.removeEventListener('click', handler);
    drawCanvas.style.cursor = 'crosshair';
  };
  drawCanvas.addEventListener('click', handler);
}

// ==================== IMAGE LOADING ====================
function initFileInput() {
  const input = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');

  input.addEventListener('change', (e) => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });
}

function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => loadImageFromUrl(e.target.result);
  reader.readAsDataURL(file);
}

function loadImageFromUrl(url) {
  const img = new Image();
  img.onload = () => {
    const maxW = window.innerWidth - 80;
    const maxH = window.innerHeight - 140;
    let w = img.width, h = img.height;
    if (w > maxW) { h = h * maxW / w; w = maxW; }
    if (h > maxH) { w = w * maxH / h; h = maxH; }
    w = Math.round(w); h = Math.round(h);

    mainCanvas.width = drawCanvas.width = w;
    mainCanvas.height = drawCanvas.height = h;
    imgDims = { w, h };

    mainCtx.clearRect(0, 0, w, h);
    mainCtx.drawImage(img, 0, 0, w, h);

    document.getElementById('canvas-placeholder').style.display = 'none';
    document.getElementById('canvas-wrap').style.display = 'inline-block';
    document.getElementById('status-dims').textContent = `${img.width}×${img.height}px`;

    hasImage = true;
    history = []; historyIndex = -1;
    saveToHistory();
    initCanvas();
  };
  img.src = url;
}

// ==================== ACTIONS ====================
function initActions() {
  document.getElementById('btn-download').addEventListener('click', downloadImage);
  document.getElementById('btn-copy').addEventListener('click', copyToClipboard);
  document.getElementById('btn-share').addEventListener('click', shareImage);
}

async function getCompositeCanvas() {
  const composite = document.createElement('canvas');
  composite.width = mainCanvas.width;
  composite.height = mainCanvas.height;
  const ctx = composite.getContext('2d');
  ctx.drawImage(mainCanvas, 0, 0);
  ctx.drawImage(drawCanvas, 0, 0);
  return composite;
}

async function downloadImage() {
  if (!hasImage) return;
  const canvas = await getCompositeCanvas();
  const link = document.createElement('a');
  link.download = `snaprecord-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  updateStatus('Downloaded!');
}

async function copyToClipboard() {
  if (!hasImage) return;
  try {
    const canvas = await getCompositeCanvas();
    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      updateStatus('Copied to clipboard!');
    });
  } catch (e) { updateStatus('Copy failed'); }
}

async function shareImage() {
  if (!hasImage) return;
  const canvas = await getCompositeCanvas();
  const dataUrl = canvas.toDataURL('image/png');

  // Save to library
  try {
    await chrome.runtime.sendMessage({
      action: 'saveToLibrary',
      data: {
        type: 'screenshot',
        title: 'Screenshot ' + new Date().toLocaleString(),
        thumbnail: dataUrl.substring(0, 200),
        imageData: dataUrl
      }
    });
    updateStatus('Saved to library!');
  } catch (e) { updateStatus('Saved locally'); }
}

// ==================== KEYBOARD ====================
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); undo(); }
      if (e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 's') { e.preventDefault(); downloadImage(); }
      if (e.key === 'c' && !isDrawing) { e.preventDefault(); copyToClipboard(); }
    }
    // Tool shortcuts
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const shortcuts = { p: 'pen', h: 'highlighter', a: 'arrow', r: 'rect', c: 'circle', l: 'line', t: 'text', b: 'blur' };
      const tool = shortcuts[e.key];
      if (tool && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
        currentTool = tool;
        updateCursor();
        updateStatus();
      }
    }
  });
}

// ==================== HELPERS ====================
function getPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function updateStatus(extra) {
  const toolLabel = currentTool.charAt(0).toUpperCase() + currentTool.slice(1);
  document.getElementById('status-tool').textContent =
    `Tool: ${toolLabel} | Color: ${currentColor} | Size: ${strokeSize}px${extra ? ' | ' + extra : ''}`;
  if (extra && extra !== document.getElementById('status-left').textContent) {
    document.getElementById('status-left').textContent = extra;
    setTimeout(() => document.getElementById('status-left').textContent = 'Ready', 2000);
  }
}
