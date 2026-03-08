/**
 * SnapRecord Pro - Popup JS v2.0
 */

let selectedSource = 'screen';
let selectedDelay = 0;
let selectedSsDelay = 0;
let selectedCaptureType = 'visible';
let isRecording = false;
let isPaused = false;
let recInterval = null;
let recSeconds = 0;
let cdTimer = null;
let optStates = { mic: true, sys: true, cam: false, hd: true };
let libFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initSources();
  initOptions();
  initDelays();
  initRecording();
  initScreenshot();
  initLibrary();
  initAI();
  initFooter();
  await checkRecordingState();
});

// ==================== TABS ====================
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'library') loadLibrary();
    });
  });
}

// ==================== SOURCES ====================
function initSources() {
  document.querySelectorAll('.src-btn[data-source]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.src-btn[data-source]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSource = btn.dataset.source;
    });
  });
}

// ==================== OPTIONS ====================
function initOptions() {
  document.querySelectorAll('.opt-card').forEach(card => {
    card.addEventListener('click', () => {
      const opt = card.dataset.opt;
      optStates[opt] = !optStates[opt];
      card.classList.toggle('active', optStates[opt]);
    });
  });
}

// ==================== DELAYS ====================
function initDelays() {
  document.querySelectorAll('[data-delay]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-delay]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDelay = parseInt(btn.dataset.delay);
      document.getElementById('custom-delay').value = '';
    });
  });
  document.getElementById('custom-delay').addEventListener('input', e => {
    if (e.target.value) {
      document.querySelectorAll('[data-delay]').forEach(b => b.classList.remove('active'));
      selectedDelay = parseInt(e.target.value) || 0;
    }
  });

  document.querySelectorAll('[data-ss-delay]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-ss-delay]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSsDelay = parseInt(btn.dataset.ssDelay);
      document.getElementById('ss-custom-delay').value = '';
    });
  });
  document.getElementById('ss-custom-delay').addEventListener('input', e => {
    if (e.target.value) {
      document.querySelectorAll('[data-ss-delay]').forEach(b => b.classList.remove('active'));
      selectedSsDelay = parseInt(e.target.value) || 0;
    }
  });
}

// ==================== RECORDING ====================
function initRecording() {
  document.getElementById('rec-btn').addEventListener('click', () => {
    if (isRecording) stopRecording();
    else startCountdown(selectedDelay, () => startRecording());
  });
  document.getElementById('btn-pause').addEventListener('click', async () => {
    isPaused = !isPaused;
    document.getElementById('btn-pause').textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    await chrome.runtime.sendMessage({ action: 'pauseRecording' });
  });
  document.getElementById('btn-stop').addEventListener('click', stopRecording);
}

function startCountdown(seconds, callback) {
  if (seconds <= 0) { callback(); return; }
  const overlay = document.getElementById('cd-overlay');
  const numEl = document.getElementById('cd-num');
  overlay.classList.add('show');
  let n = seconds;
  numEl.textContent = n;

  const cancelBtn = document.getElementById('cd-cancel');
  const onCancel = () => {
    clearInterval(cdTimer);
    overlay.classList.remove('show');
  };
  cancelBtn.addEventListener('click', onCancel, { once: true });

  cdTimer = setInterval(() => {
    n--;
    if (n <= 0) {
      clearInterval(cdTimer);
      overlay.classList.remove('show');
      callback();
    } else {
      numEl.textContent = n;
      numEl.style.animation = 'none';
      numEl.offsetHeight;
      numEl.style.animation = 'cdPulse 1s ease-in-out';
    }
  }, 1000);
}

async function startRecording() {
  isRecording = true; isPaused = false; recSeconds = 0;
  document.getElementById('rec-btn').classList.add('recording');
  document.getElementById('rdot').classList.add('pulsing');
  document.getElementById('rec-label').textContent = 'Stop Recording';
  document.getElementById('rec-bar').classList.add('show');

  recInterval = setInterval(() => {
    recSeconds++;
    const m = String(Math.floor(recSeconds / 60)).padStart(2, '0');
    const s = String(recSeconds % 60).padStart(2, '0');
    document.getElementById('rec-time').textContent = `${m}:${s}`;
  }, 1000);

  try {
    await chrome.runtime.sendMessage({
      action: 'startRecording',
      options: {
        type: selectedSource,
        includeAudio: optStates.sys,
        includeMic: optStates.mic,
        includeWebcam: optStates.cam || selectedSource === 'webcam',
        hd: optStates.hd
      }
    });
  } catch (e) { console.error(e); }

  if (selectedSource !== 'webcam') setTimeout(() => window.close(), 1500);
}

async function stopRecording() {
  isRecording = false;
  clearInterval(recInterval);
  document.getElementById('rec-btn').classList.remove('recording');
  document.getElementById('rdot').classList.remove('pulsing');
  document.getElementById('rec-label').textContent = 'Start Recording';
  document.getElementById('rec-bar').classList.remove('show');
  document.getElementById('rec-time').textContent = '00:00';

  try {
    await chrome.runtime.sendMessage({ action: 'stopRecording' });
    await chrome.runtime.sendMessage({ action: 'openEditor', data: { duration: recSeconds } });
  } catch (e) { console.error(e); }
}

async function checkRecordingState() {
  try {
    const r = await chrome.runtime.sendMessage({ action: 'getRecordingState' });
    if (r?.state?.isRecording) {
      isRecording = true;
      document.getElementById('rec-btn').classList.add('recording');
      document.getElementById('rdot').classList.add('pulsing');
      document.getElementById('rec-label').textContent = 'Stop Recording';
      document.getElementById('rec-bar').classList.add('show');
    }
  } catch (e) {}
}

// ==================== SCREENSHOT ====================
function initScreenshot() {
  document.querySelectorAll('.cap-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.cap-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedCaptureType = card.dataset.capture;
    });
  });

  document.getElementById('ss-btn').addEventListener('click', () => {
    startCountdown(selectedSsDelay, async () => {
      try {
        if (selectedCaptureType === 'visible') {
          await chrome.runtime.sendMessage({ action: 'captureVisible' });
        } else if (selectedCaptureType === 'region') {
          await chrome.runtime.sendMessage({ action: 'initiateRegionCapture' });
        } else if (selectedCaptureType === 'fullpage') {
          await chrome.runtime.sendMessage({ action: 'captureFullPage' });
        }
        window.close();
      } catch (e) { console.error(e); }
    });
  });

  document.getElementById('btn-annotate').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/screenshot.html') });
  });

  document.getElementById('btn-clipboard').addEventListener('click', async () => {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'captureVisible' });
      if (r?.screenshot) showToast('Screenshot copied to clipboard!');
    } catch (e) {}
    window.close();
  });
}

// ==================== LIBRARY ====================
async function loadLibrary() {
  try {
    const r = await chrome.runtime.sendMessage({ action: 'getLibrary' });
    renderLibrary(r?.library || []);
  } catch (e) {}
}

function initLibrary() {
  document.getElementById('lib-search').addEventListener('input', (e) => {
    filterLibrary(e.target.value);
  });
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      libFilter = btn.dataset.filter;
      loadLibrary();
    });
  });
  document.getElementById('view-list').addEventListener('click', () => {
    document.getElementById('view-list').classList.add('active');
    document.getElementById('view-grid').classList.remove('active');
  });
  document.getElementById('view-grid').addEventListener('click', () => {
    document.getElementById('view-grid').classList.add('active');
    document.getElementById('view-list').classList.remove('active');
  });
}

function renderLibrary(items) {
  const container = document.getElementById('lib-items');
  let filtered = libFilter === 'all' ? items : items.filter(i => i.type === libFilter);
  const search = document.getElementById('lib-search').value.toLowerCase();
  if (search) filtered = filtered.filter(i => (i.title || '').toLowerCase().includes(search));

  if (!filtered.length) {
    container.innerHTML = `
      <div class="lib-empty">
        <div class="le-icon">🎬</div>
        <div class="le-text">No items found</div>
        <div class="le-sub">Start recording or take a screenshot!</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="lib-item" data-id="${item.id}">
      <div class="lib-thumb">
        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="">` : (item.type === 'screenshot' ? '📸' : '🎬')}
      </div>
      <div class="lib-meta">
        <div class="lib-title">${item.title || 'Untitled'}</div>
        <div class="lib-sub">${item.type || 'recording'} · ${formatDate(item.createdAt)}</div>
      </div>
      <div class="lib-actions">
        <button class="lib-act" data-action="share" data-id="${item.id}" title="Share">🔗</button>
        <button class="lib-act" data-action="open" data-id="${item.id}" title="Open">↗</button>
        <button class="lib-act" data-action="delete" data-id="${item.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.lib-act').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLibAction(btn.dataset.action, btn.dataset.id, items);
    });
  });
}

async function handleLibAction(action, id, items) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (action === 'delete') {
    await chrome.runtime.sendMessage({ action: 'deleteLibraryItem', id });
    loadLibrary();
  } else if (action === 'share') {
    if (item.shareLink) {
      navigator.clipboard.writeText(item.shareLink);
      showToast('Link copied!');
    } else {
      showToast('No share link available');
    }
  } else if (action === 'open') {
    if (item.type === 'screenshot') {
      await chrome.storage.session.set({ screenshotData: item });
      chrome.tabs.create({ url: chrome.runtime.getURL('pages/screenshot.html') });
    } else {
      await chrome.storage.session.set({ editorData: item });
      chrome.tabs.create({ url: chrome.runtime.getURL('pages/editor.html') });
    }
  }
}

function filterLibrary(query) { loadLibrary(); }

function formatDate(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  const diff = Date.now() - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString();
}

// ==================== AI ====================
function initAI() {
  document.getElementById('btn-open-ai').addEventListener('click', openAI);
  document.getElementById('btn-ai').addEventListener('click', openAI);

  document.querySelectorAll('.ai-prompt').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.storage.session.set({ aiPrompt: btn.dataset.prompt });
      openAI();
    });
  });
}

async function openAI() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  } catch (e) {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/sidebar.html') });
  }
}

// ==================== FOOTER ====================
function initFooter() {
  document.getElementById('fbtn-dash').addEventListener('click', async () => {
    const { settings } = await chrome.storage.local.get('settings');
    const url = settings?.apiUrl || 'https://snaprecord.app';
    chrome.tabs.create({ url });
  });
  document.getElementById('fbtn-editor').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/editor.html') });
  });
  document.getElementById('fbtn-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById('fbtn-help').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://snaprecord.app/help' });
  });
  document.getElementById('btn-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById('btn-dash').addEventListener('click', async () => {
    const { settings } = await chrome.storage.local.get('settings');
    chrome.tabs.create({ url: (settings?.apiUrl || 'https://snaprecord.app') + '/dashboard' });
  });
}

// ==================== TOAST ====================
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
    background: '#111827', color: 'white', padding: '8px 16px', borderRadius: '100px',
    fontSize: '12px', fontWeight: '600', zIndex: '9999',
    border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.2s ease'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
