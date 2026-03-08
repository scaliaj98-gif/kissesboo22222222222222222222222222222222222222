/**
 * SnapRecord Pro - Screenshot Editor
 * Full annotation editing with multiple tools
 */

// ==================== STATE ====================
let screenshotCanvas, annotCanvas;
let screenshotCtx, annotCtx;
let currentTool = 'select';
let isDrawing = false;
let startX, startY;
let color = '#FF6B6B';
let lineSize = 3;
let zoom = 1;
let undoStack = [];
let redoStack = [];
let imageData = null;

// ==================== INIT ====================
window.addEventListener('load', async () => {
  screenshotCanvas = document.getElementById('screenshot-canvas');
  annotCanvas = document.getElementById('annotation-canvas');
  screenshotCtx = screenshotCanvas.getContext('2d');
  annotCtx = annotCanvas.getContext('2d');

  // Load screenshot data
  try {
    const data = await chrome.storage.session.get('screenshotData');
    if (data.screenshotData?.imageData) {
      loadImage(data.screenshotData.imageData);
    } else {
      // Load placeholder
      loadPlaceholder();
    }
  } catch (e) {
    loadPlaceholder();
  }

  initTools();
  initCanvas();
  initButtons();
  initColorPicker();
  initShareModal();
});

function loadPlaceholder() {
  const w = 1280, h = 720;
  screenshotCanvas.width = w;
  screenshotCanvas.height = h;
  annotCanvas.width = w;
  annotCanvas.height = h;
  
  const ctx = screenshotCtx;
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.font = 'bold 24px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('📸 No screenshot loaded - Take a screenshot first!', w/2, h/2);
  
  updateStatus(w, h);
  saveUndo();
}

function loadImage(dataUrl) {
  const img = new Image();
  img.onload = () => {
    screenshotCanvas.width = img.width;
    screenshotCanvas.height = img.height;
    annotCanvas.width = img.width;
    annotCanvas.height = img.height;
    screenshotCtx.drawImage(img, 0, 0);
    updateStatus(img.width, img.height);
    saveUndo();
  };
  img.src = dataUrl;
}

// ==================== TOOLS ====================
function initTools() {
  const tools = ['select', 'pen', 'highlighter', 'rect', 'circle', 'arrow', 'line', 'text', 'blur', 'crop', 'emoji'];
  tools.forEach(tool => {
    const btn = document.getElementById(`tool-${tool}`);
    if (btn) {
      btn.addEventListener('click', () => setTool(tool));
    }
  });
}

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tool-${tool}`);
  if (btn) btn.classList.add('active');
  
  // Update cursor
  const cursors = {
    select: 'default', pen: 'crosshair', highlighter: 'crosshair',
    rect: 'crosshair', circle: 'crosshair', arrow: 'crosshair',
    line: 'crosshair', text: 'text', blur: 'crosshair', crop: 'crosshair', emoji: 'copy'
  };
  annotCanvas.style.cursor = cursors[tool] || 'crosshair';
  document.getElementById('status-tool').textContent = `🔍 ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;
}

// ==================== CANVAS DRAWING ====================
function initCanvas() {
  annotCanvas.addEventListener('mousedown', onMouseDown);
  annotCanvas.addEventListener('mousemove', onMouseMove);
  annotCanvas.addEventListener('mouseup', onMouseUp);
  annotCanvas.addEventListener('dblclick', onDblClick);
}

function onMouseDown(e) {
  isDrawing = true;
  const rect = annotCanvas.getBoundingClientRect();
  startX = (e.clientX - rect.left) / zoom;
  startY = (e.clientY - rect.top) / zoom;
  
  if (currentTool === 'pen' || currentTool === 'highlighter') {
    annotCtx.beginPath();
    annotCtx.moveTo(startX, startY);
  } else if (currentTool === 'text') {
    isDrawing = false;
    const text = prompt('Enter text:');
    if (text) {
      saveUndo();
      annotCtx.font = `${lineSize * 6 + 14}px Inter`;
      annotCtx.fillStyle = color;
      annotCtx.fillText(text, startX, startY);
    }
  } else if (currentTool === 'emoji') {
    isDrawing = false;
    const emojis = ['⭐', '✅', '❌', '⚠️', '💡', '🔥', '👍', '👎', '❤️', '🚨'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    saveUndo();
    annotCtx.font = `${lineSize * 8 + 24}px serif`;
    annotCtx.fillText(emoji, startX, startY);
  }

  if (currentTool === 'pen' || currentTool === 'highlighter') {
    saveUndo();
  }
}

function onMouseMove(e) {
  if (!isDrawing) return;
  const rect = annotCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom;
  const y = (e.clientY - rect.top) / zoom;

  if (currentTool === 'pen') {
    annotCtx.globalAlpha = 1;
    annotCtx.strokeStyle = color;
    annotCtx.lineWidth = lineSize;
    annotCtx.lineCap = 'round';
    annotCtx.lineJoin = 'round';
    annotCtx.lineTo(x, y);
    annotCtx.stroke();
  } else if (currentTool === 'highlighter') {
    annotCtx.globalAlpha = 0.3;
    annotCtx.strokeStyle = color;
    annotCtx.lineWidth = lineSize * 8;
    annotCtx.lineCap = 'square';
    annotCtx.lineTo(x, y);
    annotCtx.stroke();
    annotCtx.globalAlpha = 1;
  }
}

function onMouseUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const rect = annotCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom;
  const y = (e.clientY - rect.top) / zoom;
  
  if (['rect', 'circle', 'arrow', 'line', 'blur'].includes(currentTool)) {
    saveUndo();
    drawShape(currentTool, startX, startY, x, y);
  }

  annotCtx.beginPath();
}

function drawShape(tool, x1, y1, x2, y2) {
  annotCtx.globalAlpha = 1;
  annotCtx.strokeStyle = color;
  annotCtx.fillStyle = color;
  annotCtx.lineWidth = lineSize;
  annotCtx.lineCap = 'round';
  
  switch(tool) {
    case 'rect':
      annotCtx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      break;
    case 'circle':
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      annotCtx.beginPath();
      annotCtx.ellipse(x1 + (x2-x1)/2, y1 + (y2-y1)/2, rx, ry, 0, 0, Math.PI * 2);
      annotCtx.stroke();
      break;
    case 'arrow':
      drawArrow(x1, y1, x2, y2);
      break;
    case 'line':
      annotCtx.beginPath();
      annotCtx.moveTo(x1, y1);
      annotCtx.lineTo(x2, y2);
      annotCtx.stroke();
      break;
    case 'blur':
      // Blur region using pixel manipulation
      const bx = Math.min(x1, x2), by = Math.min(y1, y2);
      const bw = Math.abs(x2 - x1), bh = Math.abs(y2 - y1);
      applyBlur(bx, by, bw, bh);
      break;
  }
}

function drawArrow(x1, y1, x2, y2) {
  const headLen = 20;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  annotCtx.beginPath();
  annotCtx.moveTo(x1, y1);
  annotCtx.lineTo(x2, y2);
  annotCtx.stroke();
  annotCtx.beginPath();
  annotCtx.moveTo(x2, y2);
  annotCtx.lineTo(x2 - headLen * Math.cos(angle - Math.PI/6), y2 - headLen * Math.sin(angle - Math.PI/6));
  annotCtx.lineTo(x2 - headLen * Math.cos(angle + Math.PI/6), y2 - headLen * Math.sin(angle + Math.PI/6));
  annotCtx.closePath();
  annotCtx.fill();
}

function applyBlur(x, y, w, h) {
  if (w < 5 || h < 5) return;
  // Get pixels from screenshot canvas
  const imgData = screenshotCtx.getImageData(x, y, w, h);
  const d = imgData.data;
  // Simple box blur
  const radius = 5;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.floor(d[i] / radius) * radius;
    d[i+1] = Math.floor(d[i+1] / radius) * radius;
    d[i+2] = Math.floor(d[i+2] / radius) * radius;
  }
  annotCtx.putImageData(imgData, x, y);
}

function onDblClick(e) {
  // Could add double click behaviors
}

// ==================== UNDO/REDO ====================
function saveUndo() {
  undoStack.push(annotCtx.getImageData(0, 0, annotCanvas.width, annotCanvas.height));
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  const prev = undoStack[undoStack.length - 1];
  annotCtx.putImageData(prev, 0, 0);
}

function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(next);
  annotCtx.putImageData(next, 0, 0);
}

// ==================== BUTTONS ====================
function initButtons() {
  document.getElementById('undo-btn').addEventListener('click', undo);
  document.getElementById('redo-btn').addEventListener('click', redo);
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Clear all annotations?')) {
      saveUndo();
      annotCtx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
    }
  });
  
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
  document.getElementById('download-btn').addEventListener('click', downloadImage);
  document.getElementById('share-btn').addEventListener('click', () => {
    document.getElementById('share-modal').classList.add('show');
  });
  
  document.getElementById('size-input').addEventListener('input', (e) => {
    lineSize = parseInt(e.target.value) || 3;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); undo(); }
      if (e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'c') { e.preventDefault(); copyToClipboard(); }
      if (e.key === 's') { e.preventDefault(); downloadImage(); }
    }
    // Tool shortcuts
    const toolKeys = { 'p': 'pen', 'h': 'highlighter', 'r': 'rect', 'c': 'circle', 'a': 'arrow', 't': 'text', 'b': 'blur' };
    if (!e.ctrlKey && toolKeys[e.key]) setTool(toolKeys[e.key]);
  });
}

function initColorPicker() {
  document.getElementById('color-picker').addEventListener('input', (e) => {
    color = e.target.value;
  });
}

// ==================== EXPORT ====================
function getMergedCanvas() {
  const merged = document.createElement('canvas');
  merged.width = screenshotCanvas.width;
  merged.height = screenshotCanvas.height;
  const ctx = merged.getContext('2d');
  ctx.drawImage(screenshotCanvas, 0, 0);
  ctx.drawImage(annotCanvas, 0, 0);
  return merged;
}

async function copyToClipboard() {
  try {
    const canvas = getMergedCanvas();
    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📋 Copied to clipboard!');
    });
  } catch (e) {
    showToast('❌ Copy failed: ' + e.message);
  }
}

function downloadImage() {
  const canvas = getMergedCanvas();
  const format = document.getElementById('share-privacy')?.value === 'jpg' ? 'jpeg' : 'png';
  const url = canvas.toDataURL(`image/${format}`);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snaprecord-${Date.now()}.${format}`;
  a.click();
  showToast('⬇️ Downloaded!');
}

// ==================== SHARING ====================
function initShareModal() {
  document.getElementById('cancel-share').addEventListener('click', () => {
    document.getElementById('share-modal').classList.remove('show');
  });
  
  document.getElementById('confirm-share').addEventListener('click', async () => {
    const title = document.getElementById('share-title').value || `Screenshot ${new Date().toLocaleDateString()}`;
    const privacy = document.getElementById('share-privacy').value;
    const canvas = getMergedCanvas();
    const imageDataUrl = canvas.toDataURL('image/png');
    
    const btn = document.getElementById('confirm-share');
    btn.textContent = '⏳ Uploading...';
    btn.disabled = true;
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'saveToCloud',
        data: {
          type: 'screenshot',
          title,
          file_data: imageDataUrl,
          format: 'png',
          is_public: privacy === 'public',
          width: canvas.width,
          height: canvas.height
        }
      });
      
      if (result.success) {
        const shareUrl = window.location.origin + '/share/' + result.shareLink;
        document.getElementById('share-link-text').textContent = shareUrl;
        document.getElementById('share-link-box').style.display = 'flex';
        document.getElementById('copy-share-link').addEventListener('click', () => {
          navigator.clipboard.writeText(shareUrl);
          document.getElementById('copy-share-link').textContent = '✅ Copied!';
        });
        showToast('🎉 Uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (e) {
      showToast('❌ Upload failed: Sign in to SnapRecord first');
    }
    
    btn.textContent = '🚀 Upload & Share';
    btn.disabled = false;
  });
}

// ==================== HELPERS ====================
function updateStatus(w, h) {
  document.getElementById('status-dimensions').textContent = `📌 ${w} × ${h}`;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    background:rgba(30,41,59,0.95);color:white;padding:10px 20px;
    border-radius:12px;font-size:14px;font-weight:600;z-index:999;
    border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(8px);
    animation:fadeInUp 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
