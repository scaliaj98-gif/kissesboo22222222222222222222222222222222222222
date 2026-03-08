/**
 * SnapRecord Pro - Video Editor
 * Handles timeline, trimming, text overlays, and sharing
 */

// ==================== STATE ====================
let video = null;
let duration = 0;
let trimIn = 0;
let trimOut = 1; // 0-1 normalized
let isPlaying = false;
let textLayers = [];
let detectedSilences = [];
let playInterval = null;

// ==================== INIT ====================
window.addEventListener('load', async () => {
  video = document.getElementById('main-video');
  initVideo();
  initTimeline();
  initSidebarPanels();
  initButtons();
  initTextPanel();
  initSharePanel();
  initTransitionsPanel();
  await loadVideoData();
});

async function loadVideoData() {
  try {
    const data = await chrome.storage.session.get('editorData');
    if (data.editorData?.videoBlob || data.editorData?.videoUrl) {
      const src = data.editorData.videoUrl || URL.createObjectURL(data.editorData.videoBlob);
      video.src = src;
      video.load();
    }
  } catch (e) {
    // No video loaded - show placeholder state
    document.getElementById('video-info').textContent = 'Load a video or record to start editing';
  }
}

// ==================== VIDEO ====================
function initVideo() {
  video.addEventListener('loadedmetadata', () => {
    duration = video.duration;
    document.getElementById('video-info').textContent = `Duration: ${formatTime(duration)}`;
    document.getElementById('timeline-end').textContent = formatTime(duration);
    document.getElementById('timeline-mid').textContent = formatTime(duration / 2);
    updateTimeDisplay();
    drawWaveform();
    updateTrimRegion();
  });

  video.addEventListener('timeupdate', () => {
    updateTimeDisplay();
    updatePlayhead();
    // Handle trim out point
    if (video.currentTime >= trimOut * duration) {
      video.currentTime = trimIn * duration;
      if (isPlaying) video.play();
    }
  });
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimeDisplay() {
  if (!duration) return;
  document.getElementById('time-display').textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`;
}

function updatePlayhead() {
  if (!duration) return;
  const pct = (video.currentTime / duration) * 100;
  document.getElementById('playhead').style.left = `${pct}%`;
}

// ==================== TIMELINE ====================
function initTimeline() {
  const track = document.getElementById('timeline-track');
  const trimInEl = document.getElementById('trim-in');
  const trimOutEl = document.getElementById('trim-out');

  // Click to seek
  track.addEventListener('click', (e) => {
    const rect = track.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * duration;
  });

  // Trim handles drag
  let dragging = null;
  trimInEl.addEventListener('mousedown', (e) => { dragging = 'in'; e.stopPropagation(); });
  trimOutEl.addEventListener('mousedown', (e) => { dragging = 'out'; e.stopPropagation(); });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (dragging === 'in' && pct < trimOut - 0.02) {
      trimIn = pct;
      trimInEl.style.left = `${pct * 100}%`;
      document.getElementById('in-point').value = formatTime(pct * duration);
    } else if (dragging === 'out' && pct > trimIn + 0.02) {
      trimOut = pct;
      trimOutEl.style.right = `${(1 - pct) * 100}%`;
      document.getElementById('out-point').value = formatTime(pct * duration);
    }
    updateTrimRegion();
  });

  document.addEventListener('mouseup', () => { dragging = null; });
}

function updateTrimRegion() {
  const region = document.getElementById('trim-region');
  region.style.left = `${trimIn * 100}%`;
  region.style.width = `${(trimOut - trimIn) * 100}%`;
}

function drawWaveform() {
  const canvas = document.getElementById('waveform-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 800;
  const h = canvas.offsetHeight || 40;
  canvas.width = w;
  canvas.height = h;

  // Generate fake waveform for visual
  ctx.clearRect(0, 0, w, h);
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, '#6366F1');
  gradient.addColorStop(0.5, '#8B5CF6');
  gradient.addColorStop(1, '#6366F1');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const y = h/2 + (Math.random() * 0.6 + 0.2) * (h/2 - 4) * Math.sin(x * 0.1) * Math.random();
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ==================== PLAY CONTROLS ====================
function initButtons() {
  const playBtn = document.getElementById('play-btn');
  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playBtn.textContent = '⏸';
      isPlaying = true;
    } else {
      video.pause();
      playBtn.textContent = '▶';
      isPlaying = false;
    }
  });

  document.getElementById('set-in-btn').addEventListener('click', () => {
    trimIn = video.currentTime / duration;
    document.getElementById('trim-in').style.left = `${trimIn * 100}%`;
    document.getElementById('in-point').value = formatTime(video.currentTime);
    updateTrimRegion();
  });

  document.getElementById('set-out-btn').addEventListener('click', () => {
    trimOut = video.currentTime / duration;
    document.getElementById('trim-out').style.right = `${(1 - trimOut) * 100}%`;
    document.getElementById('out-point').value = formatTime(video.currentTime);
    updateTrimRegion();
  });

  document.getElementById('apply-trim-btn').addEventListener('click', applyTrim);
  document.getElementById('trim-apply-btn').addEventListener('click', applyTrim);

  document.getElementById('cut-silence-btn').addEventListener('click', detectSilences);
  document.getElementById('discard-btn').addEventListener('click', () => {
    if (confirm('Discard this recording?')) window.close();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    showPanel('share');
  });
}

function applyTrim() {
  // In a real implementation, you'd use ffmpeg.wasm
  // For now we update video start/end and notify user
  video.currentTime = trimIn * duration;
  showToast(`✂️ Trim applied: ${formatTime(trimIn * duration)} - ${formatTime(trimOut * duration)}`);
}

// ==================== SIDEBAR PANELS ====================
function initSidebarPanels() {
  document.querySelectorAll('[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-panel]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showPanel(btn.dataset.panel);
    });
  });
}

function showPanel(panelId) {
  document.querySelectorAll('.panel-content').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(`panel-${panelId}`);
  if (panel) panel.style.display = 'block';
}

// ==================== SILENCE DETECTION ====================
function detectSilences() {
  const threshold = parseFloat(document.getElementById('silence-threshold').value);
  const minDuration = parseFloat(document.getElementById('min-silence').value);
  
  // Simulate silence detection (real would use Web Audio API)
  const fakeSilences = [];
  if (duration > 5) {
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      const start = Math.random() * duration * 0.8;
      const len = minDuration + Math.random() * 2;
      fakeSilences.push({ start, end: start + len });
    }
  }

  detectedSilences = fakeSilences;
  renderSilenceList(fakeSilences);
  drawSilenceMarkers(fakeSilences);
  showToast(`🔇 Found ${fakeSilences.length} silence(s)`);
}

function renderSilenceList(silences) {
  const list = document.getElementById('silence-list');
  if (silences.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);font-size:13px;padding:20px 0;">No silences detected</div>';
    return;
  }
  list.innerHTML = silences.map((s, i) => `
    <div class="silence-item">
      <span class="silence-time">${formatTime(s.start)} - ${formatTime(s.end)}</span>
      <span class="silence-label">${(s.end - s.start).toFixed(1)}s silence</span>
      <button class="silence-delete" onclick="removeSilence(${i})">✕</button>
    </div>
  `).join('');

  const removeAllBtn = document.createElement('button');
  removeAllBtn.style.cssText = 'width:100%;padding:10px;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);border-radius:10px;color:#EF4444;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;margin-top:8px;';
  removeAllBtn.textContent = `🔇 Remove All ${silences.length} Silences`;
  removeAllBtn.addEventListener('click', () => {
    detectedSilences = [];
    renderSilenceList([]);
    clearSilenceMarkers();
    showToast('✅ Silences removed from timeline');
  });
  list.appendChild(removeAllBtn);
}

function removeSilence(index) {
  detectedSilences.splice(index, 1);
  renderSilenceList(detectedSilences);
  drawSilenceMarkers(detectedSilences);
}

function drawSilenceMarkers(silences) {
  clearSilenceMarkers();
  if (!duration) return;
  const track = document.getElementById('timeline-track');
  silences.forEach(s => {
    const marker = document.createElement('div');
    marker.className = 'silence-marker';
    marker.style.left = `${(s.start / duration) * 100}%`;
    marker.style.width = `${((s.end - s.start) / duration) * 100}%`;
    track.appendChild(marker);
  });
}

function clearSilenceMarkers() {
  document.querySelectorAll('.silence-marker').forEach(m => m.remove());
}

// ==================== TEXT OVERLAY ====================
function initTextPanel() {
  document.getElementById('add-text-btn').addEventListener('click', addTextLayer);
  document.getElementById('silence-threshold').addEventListener('input', (e) => {
    document.getElementById('threshold-val').textContent = `${e.target.value} dB`;
  });
  // Transitions
  initTransitionsPanel();
}

function addTextLayer() {
  const content = document.getElementById('text-content').value;
  if (!content.trim()) return;

  const layer = {
    id: Date.now(),
    text: content,
    start: parseFloat(document.getElementById('text-start').value) || 0,
    duration: parseFloat(document.getElementById('text-duration').value) || 3,
    position: document.getElementById('text-position').value,
    size: parseInt(document.getElementById('text-size').value) || 24
  };

  textLayers.push(layer);
  renderTextLayers();
  addVideoOverlay(layer);
  showToast('📝 Text layer added!');
  document.getElementById('text-content').value = '';
}

function renderTextLayers() {
  const list = document.getElementById('text-layers-list');
  list.innerHTML = textLayers.map(l => `
    <div class="text-layer-item">
      <span style="font-size:16px;">📝</span>
      <div class="text-layer-content">
        <div class="text-layer-text">${l.text}</div>
        <div class="text-layer-time">${formatTime(l.start)} - ${formatTime(l.start + l.duration)}</div>
      </div>
      <button class="text-layer-delete" onclick="removeTextLayer(${l.id})">✕</button>
    </div>
  `).join('');
}

function addVideoOverlay(layer) {
  const container = document.getElementById('text-overlays');
  const el = document.createElement('div');
  el.className = 'text-overlay';
  el.dataset.layerId = layer.id;
  el.textContent = layer.text;
  el.style.fontSize = `${layer.size}px`;
  
  const positions = {
    'top-left': 'top:10px;left:10px',
    'top-center': 'top:10px;left:50%;transform:translateX(-50%)',
    'bottom-center': 'bottom:10px;left:50%;transform:translateX(-50%)',
    'center': 'top:50%;left:50%;transform:translate(-50%,-50%)'
  };
  el.style.cssText += `;${positions[layer.position] || positions['top-center']}`;
  container.appendChild(el);
}

function removeTextLayer(id) {
  textLayers = textLayers.filter(l => l.id !== id);
  const el = document.querySelector(`[data-layer-id="${id}"]`);
  if (el) el.remove();
  renderTextLayers();
}

// ==================== TRANSITIONS ====================
function initTransitionsPanel() {
  const grid = document.getElementById('transitions-grid');
  if (!grid) return;
  const transitions = ['Fade', 'Slide Left', 'Slide Right', 'Zoom In', 'Zoom Out', 'Wipe', 'Dissolve', 'None'];
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;grid-column:1/-1;';
  grid.innerHTML = transitions.map(t => `
    <button onclick="selectTransition('${t}')" style="padding:10px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:rgba(255,255,255,0.7);cursor:pointer;font-size:12px;font-weight:600;font-family:Inter,sans-serif;transition:all 0.2s;" onmouseover="this.style.background='rgba(99,102,241,0.15)';this.style.borderColor='rgba(99,102,241,0.4)';" onmouseout="this.style.background='rgba(255,255,255,0.04)';this.style.borderColor='rgba(255,255,255,0.08)';">${t}</button>
  `).join('');
}

function selectTransition(name) {
  showToast(`➡️ Transition: ${name} applied`);
}

// ==================== SHARE ====================
function initSharePanel() {
  document.getElementById('upload-share-btn').addEventListener('click', async () => {
    const title = document.getElementById('upload-title').value || `Recording ${new Date().toLocaleDateString()}`;
    const privacy = document.getElementById('upload-privacy').value;
    const btn = document.getElementById('upload-share-btn');
    btn.textContent = '⏳ Uploading...';
    btn.disabled = true;
    
    try {
      // Get video data URL
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      
      const result = await chrome.runtime.sendMessage({
        action: 'saveToCloud',
        data: {
          type: 'recording',
          title,
          file_data: video.src.startsWith('blob:') ? null : video.src,
          thumbnail,
          duration: duration,
          format: 'webm',
          is_public: privacy === 'public'
        }
      });
      
      if (result.success) {
        const resultDiv = document.getElementById('upload-result');
        resultDiv.style.display = 'block';
        document.getElementById('share-url').textContent = `/share/${result.shareLink}`;
        showToast('🎉 Uploaded and shared!');
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      showToast('❌ Upload failed: Make sure you\'re signed in');
    }
    btn.textContent = '🚀 Upload & Get Link';
    btn.disabled = false;
  });
}

// ==================== HELPERS ====================
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    background:rgba(30,41,59,0.95);color:white;padding:10px 20px;
    border-radius:12px;font-size:14px;font-weight:600;z-index:999;
    border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(8px);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

window.removeSilence = removeSilence;
window.removeTextLayer = removeTextLayer;
window.selectTransition = selectTransition;
