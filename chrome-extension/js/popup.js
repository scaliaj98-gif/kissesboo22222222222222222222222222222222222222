/**
 * SnapRecord Pro - Popup Script
 * Handles all popup UI interactions
 */

// ==================== STATE ====================
let selectedSource = 'screen';
let selectedDelay = 0;
let selectedSsDelay = 0;
let isRecording = false;
let isPaused = false;
let recordingTimer = null;
let recordingSeconds = 0;
let countdownTimer = null;
let toggleStates = { mic: true, sys: true, cam: false, hd: true };

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initSourceButtons();
  initOptionToggles();
  initTimerOptions();
  initRecordButton();
  initScreenshotButtons();
  initFooterButtons();
  initAIButtons();
  await checkRecordingState();
  await loadLibrary();
});

// ==================== TABS ====================
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tab}-tab`).classList.add('active');
    });
  });
}

// ==================== SOURCE BUTTONS ====================
function initSourceButtons() {
  document.querySelectorAll('.source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSource = btn.dataset.source;
    });
  });
}

// ==================== OPTION TOGGLES ====================
function initOptionToggles() {
  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
      const opt = card.dataset.option;
      toggleStates[opt] = !toggleStates[opt];
      const toggle = card.querySelector('.option-toggle');
      toggle.classList.toggle('on', toggleStates[opt]);
      card.classList.toggle('active', toggleStates[opt]);
    });
  });
}

// ==================== TIMER OPTIONS ====================
function initTimerOptions() {
  // Record timer
  document.querySelectorAll('[data-delay]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-delay]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDelay = parseInt(btn.dataset.delay);
      document.getElementById('custom-timer').value = '';
    });
  });
  document.getElementById('custom-timer').addEventListener('input', (e) => {
    if (e.target.value) {
      document.querySelectorAll('[data-delay]').forEach(b => b.classList.remove('active'));
      selectedDelay = parseInt(e.target.value) || 0;
    }
  });

  // Screenshot timer
  document.querySelectorAll('[data-ss-delay]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-ss-delay]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSsDelay = parseInt(btn.dataset.ssDelay);
      document.getElementById('ss-custom-timer').value = '';
    });
  });
  document.getElementById('ss-custom-timer').addEventListener('input', (e) => {
    if (e.target.value) {
      document.querySelectorAll('[data-ss-delay]').forEach(b => b.classList.remove('active'));
      selectedSsDelay = parseInt(e.target.value) || 0;
    }
  });
}

// ==================== COUNTDOWN ====================
async function startCountdown(seconds, callback) {
  if (seconds <= 0) {
    callback();
    return;
  }

  const overlay = document.getElementById('countdown-overlay');
  const numberEl = document.getElementById('countdown-number');
  const labelEl = document.getElementById('countdown-label');
  const cancelBtn = document.getElementById('countdown-cancel');

  overlay.classList.add('show');
  let remaining = seconds;
  numberEl.textContent = remaining;
  labelEl.textContent = 'Get ready...';

  const cancelHandler = () => {
    clearInterval(countdownTimer);
    overlay.classList.remove('show');
    cancelBtn.removeEventListener('click', cancelHandler);
  };
  cancelBtn.addEventListener('click', cancelHandler);

  countdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      overlay.classList.remove('show');
      cancelBtn.removeEventListener('click', cancelHandler);
      callback();
    } else {
      numberEl.textContent = remaining;
      // Re-trigger animation
      numberEl.style.animation = 'none';
      numberEl.offsetHeight;
      numberEl.style.animation = 'countPulse 1s ease-in-out';
    }
  }, 1000);
}

// ==================== RECORDING ====================
function initRecordButton() {
  const btn = document.getElementById('record-btn');
  const pauseBtn = document.getElementById('rec-pause-btn');
  const stopBtn = document.getElementById('rec-stop-btn');

  btn.addEventListener('click', async () => {
    if (isRecording) {
      stopRecordingUI();
    } else {
      startCountdown(selectedDelay, startRecordingUI);
    }
  });

  pauseBtn.addEventListener('click', async () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    await chrome.runtime.sendMessage({ action: 'pauseRecording' });
  });

  stopBtn.addEventListener('click', stopRecordingUI);
}

async function startRecordingUI() {
  isRecording = true;
  isPaused = false;
  recordingSeconds = 0;

  const btn = document.getElementById('record-btn');
  const dot = document.getElementById('rec-dot');
  const text = document.getElementById('record-btn-text');
  const bar = document.getElementById('recording-bar');

  btn.classList.add('recording');
  dot.classList.add('recording');
  text.textContent = 'Stop Recording';
  bar.classList.add('show');

  // Start timer
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    const m = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
    const s = (recordingSeconds % 60).toString().padStart(2, '0');
    document.getElementById('rec-timer').textContent = `${m}:${s}`;
  }, 1000);

  try {
    await chrome.runtime.sendMessage({
      action: 'startRecording',
      options: {
        type: selectedSource,
        includeAudio: toggleStates.sys,
        includeMic: toggleStates.mic,
        includeWebcam: toggleStates.cam || selectedSource === 'webcam',
        hd: toggleStates.hd
      }
    });
  } catch (e) {
    console.error('Start recording error:', e);
  }

  // Close popup after starting (user needs to see their screen)
  if (selectedSource !== 'webcam') {
    setTimeout(() => window.close(), 1500);
  }
}

async function stopRecordingUI() {
  isRecording = false;
  clearInterval(recordingTimer);

  const btn = document.getElementById('record-btn');
  const dot = document.getElementById('rec-dot');
  const text = document.getElementById('record-btn-text');
  const bar = document.getElementById('recording-bar');

  btn.classList.remove('recording');
  dot.classList.remove('recording');
  text.textContent = 'Start Recording';
  bar.classList.remove('show');
  document.getElementById('rec-timer').textContent = '00:00';

  try {
    await chrome.runtime.sendMessage({ action: 'stopRecording' });
    // Open editor
    await chrome.runtime.sendMessage({ action: 'openEditor', data: { duration: recordingSeconds } });
  } catch (e) {
    console.error('Stop recording error:', e);
  }
}

// ==================== SCREENSHOT ====================
function initScreenshotButtons() {
  // Capture type cards
  document.querySelectorAll('.capture-card').forEach(card => {
    card.addEventListener('click', async () => {
      const type = card.dataset.capture;
      document.querySelectorAll('.capture-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Screenshot button
  document.getElementById('screenshot-btn').addEventListener('click', async () => {
    const activeCard = document.querySelector('.capture-card.active');
    const captureType = activeCard ? activeCard.dataset.capture : 'visible';

    startCountdown(selectedSsDelay, async () => {
      try {
        if (captureType === 'visible') {
          await chrome.runtime.sendMessage({ action: 'captureVisible' });
        } else if (captureType === 'region') {
          await chrome.runtime.sendMessage({ action: 'initiateRegionCapture' });
        } else if (captureType === 'fullpage') {
          await chrome.runtime.sendMessage({ action: 'captureFullPage' });
        }
        window.close();
      } catch (e) {
        console.error('Screenshot error:', e);
      }
    });
  });
}

// ==================== FOOTER BUTTONS ====================
function initFooterButtons() {
  document.getElementById('footer-dashboard').addEventListener('click', openDashboard);
  document.getElementById('footer-settings').addEventListener('click', openSettings);
  document.getElementById('dashboard-btn').addEventListener('click', openDashboard);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('open-dashboard-btn').addEventListener('click', openDashboard);

  async function openDashboard() {
    const { settings } = await chrome.storage.local.get('settings');
    const url = settings?.apiUrl || 'https://your-app.preview.emergentagent.com';
    chrome.tabs.create({ url: url + '/dashboard' });
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  document.getElementById('footer-help').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://snaprecord.app/help' });
  });
}

// ==================== AI BUTTONS ====================
function initAIButtons() {
  document.getElementById('ai-btn').addEventListener('click', openAI);
  document.getElementById('open-ai-sidebar').addEventListener('click', openAI);

  async function openAI() {
    try {
      await chrome.runtime.sendMessage({ action: 'openSidePanel' });
      window.close();
    } catch (e) {
      // Fallback: open sidebar page in new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('pages/sidebar.html') });
    }
  }

  document.querySelectorAll('.ai-prompt-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const prompt = btn.dataset.prompt;
      // Store the prompt and open sidebar
      await chrome.storage.session.set({ aiPrompt: prompt });
      openAI();
    });
  });
}

// ==================== LIBRARY ====================
async function loadLibrary() {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    const apiUrl = settings?.apiUrl || '';
    if (!apiUrl) return;

    const response = await fetch(`${apiUrl}/api/media?limit=5`, { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      renderLibrary(data.items || []);
    }
  } catch (e) {
    // Not logged in or API unavailable
  }
}

function renderLibrary(items) {
  const container = document.getElementById('library-list');
  if (items.length === 0) return;

  container.innerHTML = items.map(item => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:6px;cursor:pointer;" onclick="window.open('${item.share_link || '#'}')">      <span style="font-size:22px;">${item.type === 'screenshot' ? '📸' : '🎬'}</span>
      <div style="flex:1;overflow:hidden;">
        <div style="font-size:13px;font-weight:600;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.title}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);">${new Date(item.created_at).toLocaleDateString()}</div>
      </div>
      <span style="font-size:16px;">${item.is_public ? '🌎' : '🔒'}</span>
    </div>
  `).join('');
}

// ==================== RECORDING STATE ====================
async function checkRecordingState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRecordingState' });
    if (response?.state?.isRecording) {
      isRecording = true;
      const btn = document.getElementById('record-btn');
      const dot = document.getElementById('rec-dot');
      const text = document.getElementById('record-btn-text');
      const bar = document.getElementById('recording-bar');
      btn.classList.add('recording');
      dot.classList.add('recording');
      text.textContent = 'Stop Recording';
      bar.classList.add('show');
    }
  } catch (e) {
    // Ignore
  }
}
