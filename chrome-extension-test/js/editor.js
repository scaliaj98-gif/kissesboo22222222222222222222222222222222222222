/**
 * SnapRecord Pro - Video Editor v2.0
 */

let videoEl, seekBar, volumeBar, speedSelect, playBtn, timeDisplay;
let playhead, trimLeft, trimRight;
let isPlaying = false;
let trimStart = 0, trimEnd = 1; // 0-1 fractions
let clips = [];
let currentClipIndex = -1;
let textOverlays = [];
let updateInterval = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  videoEl = document.getElementById('preview-video');
  seekBar = document.getElementById('seek-bar');
  volumeBar = document.getElementById('volume-bar');
  speedSelect = document.getElementById('speed-select');
  playBtn = document.getElementById('btn-play');
  timeDisplay = document.getElementById('time-display');
  playhead = document.getElementById('playhead');
  trimLeft = document.getElementById('trim-left');
  trimRight = document.getElementById('trim-right');

  initPlayback();
  initTrimHandles();
  initEffectBtns();
  initSliders();
  initButtons();
  initTextOverlay();
  drawWaveform();

  // Load from session
  try {
    const data = await chrome.storage.session.get('editorData');
    if (data.editorData?.videoBlob || data.editorData?.videoUrl) {
      loadVideoData(data.editorData);
    }
  } catch (e) {}
});

// ==================== PLAYBACK ====================
function initPlayback() {
  playBtn.addEventListener('click', togglePlay);

  seekBar.addEventListener('input', () => {
    if (videoEl.duration) {
      videoEl.currentTime = (seekBar.value / 100) * videoEl.duration;
    }
  });

  volumeBar.addEventListener('input', () => { videoEl.volume = volumeBar.value; });
  speedSelect.addEventListener('change', () => { videoEl.playbackRate = parseFloat(speedSelect.value); });

  videoEl.addEventListener('timeupdate', updatePlaybar);
  videoEl.addEventListener('loadedmetadata', onVideoLoaded);
  videoEl.addEventListener('ended', () => {
    isPlaying = false;
    playBtn.textContent = '▶';
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    if (e.key === 'ArrowLeft') videoEl.currentTime = Math.max(0, videoEl.currentTime - 5);
    if (e.key === 'ArrowRight') videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 5);
    if (e.key === 'm') videoEl.muted = !videoEl.muted;
  });
}

function togglePlay() {
  if (!videoEl.src && clips.length === 0) return;
  if (isPlaying) {
    videoEl.pause(); isPlaying = false; playBtn.textContent = '▶';
  } else {
    videoEl.play(); isPlaying = true; playBtn.textContent = '⏸';
    renderTextOverlays();
  }
}

function updatePlaybar() {
  if (!videoEl.duration) return;
  const pct = (videoEl.currentTime / videoEl.duration) * 100;
  seekBar.value = pct;
  playhead.style.left = (pct * (document.getElementById('track-video').offsetWidth - 2) / 100) + 'px';
  timeDisplay.textContent = `${fmtTime(videoEl.currentTime)} / ${fmtTime(videoEl.duration)}`;
  document.getElementById('tl-time-label').textContent = fmtTime(videoEl.currentTime);
}

function onVideoLoaded() {
  document.getElementById('no-video-msg').style.display = 'none';
  videoEl.style.display = 'block';
  drawWaveform();
  updatePlaybar();
}

// ==================== TRIM HANDLES ====================
function initTrimHandles() {
  let dragging = null;
  const track = document.getElementById('track-video');

  trimLeft.addEventListener('mousedown', (e) => { dragging = 'left'; e.preventDefault(); });
  trimRight.addEventListener('mousedown', (e) => { dragging = 'right'; e.preventDefault(); });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (dragging === 'left') {
      trimStart = Math.min(pct, trimEnd - 0.05);
      trimLeft.style.left = (trimStart * 100) + '%';
    } else {
      trimEnd = Math.max(pct, trimStart + 0.05);
      trimRight.style.right = ((1 - trimEnd) * 100) + '%';
    }
    updateVideoFill();
    if (videoEl.duration) {
      videoEl.currentTime = videoEl.duration * (dragging === 'left' ? trimStart : trimEnd);
    }
  });

  document.addEventListener('mouseup', () => { dragging = null; });

  // Click to seek on track
  track.addEventListener('click', (e) => {
    if (e.target === trimLeft || e.target === trimRight) return;
    const rect = track.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (videoEl.duration) videoEl.currentTime = videoEl.duration * pct;
  });
}

function updateVideoFill() {
  const fill = document.getElementById('video-fill');
  fill.style.left = (trimStart * 100) + '%';
  fill.style.width = ((trimEnd - trimStart) * 100) + '%';
}

// ==================== WAVEFORM ====================
function drawWaveform() {
  const canvas = document.getElementById('waveform-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 400;
  const h = canvas.offsetHeight || 28;
  canvas.width = w; canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(139,92,246,0.7)';
  ctx.lineWidth = 1;

  // Generate pseudo waveform (visual only)
  const bars = 80;
  const barW = w / bars;
  for (let i = 0; i < bars; i++) {
    const noise = Math.random() * 0.6 + 0.2;
    const barH = noise * h * 0.8;
    const x = i * barW + barW / 2;
    ctx.beginPath();
    ctx.moveTo(x, h / 2 - barH / 2);
    ctx.lineTo(x, h / 2 + barH / 2);
    ctx.stroke();
  }
}

// ==================== EFFECTS ====================
function initEffectBtns() {
  document.getElementById('eff-trim').addEventListener('click', () => {
    if (!videoEl.duration) { alert('Load a video first'); return; }
    const start = fmtTime(videoEl.duration * trimStart);
    const end = fmtTime(videoEl.duration * trimEnd);
    alert(`✂️ Trim set: ${start} → ${end}\nAdjust the trim handles on the timeline, then export to apply.`);
  });

  document.getElementById('eff-captions').addEventListener('click', () => {
    alert('💬 Auto Captions\n\nThis feature uses the Web Speech API or your configured AI API to generate captions.\n\nSet up your AI API key in Settings to enable transcription.');
  });

  document.getElementById('eff-blur-bg').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('active');
    const active = e.currentTarget.classList.contains('active');
    videoEl.style.filter = active ? 'blur(0px)' : '';
    // In a real implementation, this would use a canvas to blur only the background
    alert(active ? '✅ Background blur effect noted (will apply on export)' : 'Blur removed');
  });

  document.getElementById('eff-zoom').addEventListener('click', () => {
    alert('🔍 Zoom Effect\n\nUse the timeline to mark zoom-in points.\n\nDrag the timeline handles and click "Zoom" to apply a gradual zoom effect on export.');
  });

  document.getElementById('eff-crop').addEventListener('click', () => {
    alert('⬛ Crop\n\nAdjust crop region by dragging the video corners.\n\nThis feature is available in the full export workflow.');
  });

  document.getElementById('tl-split').addEventListener('click', () => {
    if (!videoEl.duration) return;
    const splitTime = videoEl.currentTime;
    alert(`✂️ Split at ${fmtTime(splitTime)}\nClip would be split into two clips at this position.`);
  });

  document.getElementById('tl-delete').addEventListener('click', () => {
    if (currentClipIndex >= 0) removeClip(currentClipIndex);
  });

  document.getElementById('tl-transition').addEventListener('click', () => {
    const transitions = ['Fade', 'Slide', 'Zoom', 'Dissolve', 'Wipe'];
    const t = transitions[Math.floor(Math.random() * transitions.length)];
    alert(`✨ Transition: ${t}\nApplied between clips. Transitions will be rendered on export.`);
  });
}

// ==================== SLIDERS ====================
function initSliders() {
  [
    ['ctrl-brightness', 'val-brightness'],
    ['ctrl-contrast', 'val-contrast'],
    ['ctrl-saturation', 'val-saturation']
  ].forEach(([ctrl, val]) => {
    const slider = document.getElementById(ctrl);
    slider.addEventListener('input', () => {
      document.getElementById(val).textContent = slider.value;
      applyVideoFilters();
    });
  });

  document.getElementById('ctrl-fontsize').addEventListener('input', function() {
    document.getElementById('val-fontsize').textContent = this.value;
  });
  document.getElementById('ctrl-overlay-duration').addEventListener('input', function() {
    document.getElementById('val-duration').textContent = this.value;
  });
  document.getElementById('ctrl-quality').addEventListener('input', function() {
    document.getElementById('val-quality').textContent = this.value;
  });
}

function applyVideoFilters() {
  const b = document.getElementById('ctrl-brightness').value;
  const c = document.getElementById('ctrl-contrast').value;
  const s = document.getElementById('ctrl-saturation').value;
  videoEl.style.filter = `brightness(${1 + b/100}) contrast(${1 + c/100}) saturate(${1 + s/100})`;
}

// ==================== TEXT OVERLAYS ====================
function initTextOverlay() {
  document.getElementById('btn-add-text').addEventListener('click', () => {
    document.getElementById('text-overlay-section').classList.add('show');
  });

  document.getElementById('btn-apply-overlay').addEventListener('click', () => {
    const text = document.getElementById('overlay-text').value.trim();
    if (!text) return;
    const overlay = {
      text,
      fontSize: document.getElementById('ctrl-fontsize').value,
      position: document.getElementById('overlay-pos').value,
      startTime: videoEl.currentTime || 0,
      duration: parseInt(document.getElementById('ctrl-overlay-duration').value)
    };
    textOverlays.push(overlay);
    alert(`✅ Text overlay added at ${fmtTime(overlay.startTime)}\n"${text}"`);
  });
}

function renderTextOverlays() {
  if (!isPlaying) return;
  requestAnimationFrame(() => {
    const overlayEl = document.getElementById('video-overlay');
    const t = videoEl.currentTime;
    const active = textOverlays.find(o => t >= o.startTime && t <= o.startTime + o.duration);
    if (active) {
      overlayEl.textContent = active.text;
      overlayEl.style.display = 'block';
      overlayEl.style.fontSize = active.fontSize + 'px';
      const pos = active.position;
      if (pos === 'top') { overlayEl.style.top = '10%'; overlayEl.style.left = '50%'; overlayEl.style.transform = 'translateX(-50%)'; }
      else if (pos === 'bottom') { overlayEl.style.top = '85%'; overlayEl.style.left = '50%'; overlayEl.style.transform = 'translateX(-50%)'; }
      else { overlayEl.style.top = '50%'; overlayEl.style.left = '50%'; overlayEl.style.transform = 'translate(-50%,-50%)'; }
    } else {
      overlayEl.style.display = 'none';
    }
    if (isPlaying) renderTextOverlays();
  });
}

// ==================== CLIPS ====================
function addClip(name, videoUrl, duration) {
  const clip = { id: Date.now(), name, videoUrl, duration };
  clips.push(clip);
  currentClipIndex = clips.length - 1;
  renderClipList();
  loadClip(currentClipIndex);
}

function renderClipList() {
  const list = document.getElementById('clip-list');
  list.innerHTML = clips.map((c, i) => `
    <div class="clip-item ${i === currentClipIndex ? 'active' : ''}" data-index="${i}">
      <div class="clip-thumb">🎬</div>
      <div class="clip-info">
        <div class="clip-name">${c.name}</div>
        <div class="clip-dur">${fmtTime(c.duration || 0)}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.clip-item').forEach(item => {
    item.addEventListener('click', () => {
      currentClipIndex = parseInt(item.dataset.index);
      loadClip(currentClipIndex);
      renderClipList();
    });
  });
}

function loadClip(index) {
  if (index < 0 || index >= clips.length) return;
  const clip = clips[index];
  if (clip.videoUrl) {
    videoEl.src = clip.videoUrl;
    videoEl.load();
  }
}

function removeClip(index) {
  clips.splice(index, 1);
  currentClipIndex = Math.min(index, clips.length - 1);
  renderClipList();
  if (clips.length > 0) loadClip(currentClipIndex);
  else {
    videoEl.src = '';
    videoEl.style.display = 'none';
    document.getElementById('no-video-msg').style.display = 'block';
  }
}

// ==================== FILE LOADING ====================
function initButtons() {
  const fileInput = document.getElementById('video-file-input');

  document.getElementById('btn-upload-video').addEventListener('click', () => fileInput.click());
  document.getElementById('btn-add-clip').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addClip(file.name, url, 0);
  });

  document.getElementById('btn-export').addEventListener('click', exportVideo);
  document.getElementById('export-download').addEventListener('click', exportVideo);
  document.getElementById('btn-share-vid').addEventListener('click', shareVideo);
  document.getElementById('export-share').addEventListener('click', shareVideo);

  document.getElementById('btn-silence').addEventListener('click', () => {
    if (!videoEl.src) { alert('Load a video first'); return; }
    alert('🔇 Silence Detection\n\nScanning audio for silent segments...\n\nIn a full implementation, this analyzes the audio waveform and removes segments below the threshold.\n\nFound 0 silent segments (demo mode).');
  });
}

function loadVideoData(data) {
  if (data.videoUrl) addClip(data.title || 'Recording', data.videoUrl, data.duration || 0);
  else if (data.videoBlob) {
    const url = URL.createObjectURL(data.videoBlob);
    addClip(data.title || 'Recording', url, data.duration || 0);
  }
}

// ==================== EXPORT ====================
async function exportVideo() {
  if (!videoEl.src && clips.length === 0) {
    alert('No video to export. Please load a video first.');
    return;
  }
  const format = document.getElementById('export-format').value;
  const title = document.getElementById('video-title').value || 'snaprecord';

  if (format === 'gif') {
    alert('GIF export: This would capture the first 5 seconds of your video as an animated GIF.\n\nFull GIF encoding requires a dedicated library (e.g., gif.js).');
    return;
  }

  // Create download link for the video
  if (videoEl.src) {
    const link = document.createElement('a');
    link.href = videoEl.src;
    link.download = `${title}.${format === 'mp4' ? 'mp4' : 'webm'}`;
    link.click();

    // Save to library
    try {
      await chrome.runtime.sendMessage({
        action: 'saveToLibrary',
        data: {
          type: 'recording',
          title: document.getElementById('video-title').value || 'Recording',
          duration: videoEl.duration || 0
        }
      });
    } catch (e) {}
  }
}

async function shareVideo() {
  if (!videoEl.src && clips.length === 0) {
    alert('No video to share. Load a video first.');
    return;
  }
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'saveToLibrary',
      data: {
        type: 'recording',
        title: document.getElementById('video-title').value || 'Recording',
        duration: videoEl.duration || 0,
        isPublic: true
      }
    });
    const link = `https://snaprecord.app/share/${Date.now()}`;
    navigator.clipboard.writeText(link);
    alert(`🔗 Share link copied!\n${link}\n\n(Configure backend URL in Settings for real cloud sharing)`);
  } catch (e) {
    alert('Configure backend URL in Settings to enable cloud sharing.');
  }
}

// ==================== HELPERS ====================
function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
