/**
 * SnapRecord Pro - Options Page JS v2.0
 */

const toggleIds = ['toggle-mic', 'toggle-sys', 'toggle-cam', 'toggle-copy', 'toggle-private'];
const toggleKeys = { 'toggle-mic': 'includeMic', 'toggle-sys': 'includeAudio', 'toggle-cam': 'includeWebcam', 'toggle-copy': 'autoCopy', 'toggle-private': 'defaultPrivacy' };
const toggleStates = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initToggles();
  initProviderSelect();
  initSave();
  initDanger();
});

async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');

  const Q = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  Q('video-quality', settings.videoQuality || '1080p');
  Q('fps', settings.fps || '30');
  Q('format', settings.format || 'webm');
  Q('countdown', settings.countdown ?? '3');
  Q('ai-provider', settings.aiProvider || 'none');
  Q('openai-key', settings.openaiKey || '');
  Q('gemini-key', settings.geminiKey || '');
  Q('api-url', settings.apiUrl || '');
  Q('dashboard-url', settings.dashboardUrl || '');

  // Toggles
  setToggle('toggle-mic', settings.includeMic !== false);
  setToggle('toggle-sys', settings.includeAudio !== false);
  setToggle('toggle-cam', !!settings.includeWebcam);
  setToggle('toggle-copy', settings.autoCopy !== false);
  setToggle('toggle-private', settings.defaultPrivacy !== 'public');

  updateProviderVisibility(settings.aiProvider || 'none');
}

function setToggle(id, on) {
  toggleStates[id] = on;
  const el = document.getElementById(id);
  if (el) el.classList.toggle('on', on);
}

function initToggles() {
  toggleIds.forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      toggleStates[id] = !toggleStates[id];
      document.getElementById(id).classList.toggle('on', toggleStates[id]);
    });
  });
}

function initProviderSelect() {
  document.getElementById('ai-provider').addEventListener('change', (e) => {
    updateProviderVisibility(e.target.value);
  });
}

function updateProviderVisibility(provider) {
  document.getElementById('openai-row').style.display = provider === 'openai' ? 'block' : 'none';
  document.getElementById('gemini-row').style.display = provider === 'gemini' ? 'block' : 'none';
}

function initSave() {
  document.getElementById('save-btn').addEventListener('click', saveSettings);
}

async function saveSettings() {
  const settings = {
    videoQuality: document.getElementById('video-quality').value,
    fps: parseInt(document.getElementById('fps').value),
    format: document.getElementById('format').value,
    countdown: parseInt(document.getElementById('countdown').value),
    aiProvider: document.getElementById('ai-provider').value,
    openaiKey: document.getElementById('openai-key').value.trim(),
    geminiKey: document.getElementById('gemini-key').value.trim(),
    apiUrl: document.getElementById('api-url').value.trim(),
    dashboardUrl: document.getElementById('dashboard-url').value.trim(),
    includeMic: toggleStates['toggle-mic'],
    includeAudio: toggleStates['toggle-sys'],
    includeWebcam: toggleStates['toggle-cam'],
    autoCopy: toggleStates['toggle-copy'],
    defaultPrivacy: toggleStates['toggle-private'] ? 'private' : 'public'
  };

  await chrome.storage.local.set({ settings });

  const saved = document.getElementById('saved-msg');
  saved.classList.add('show');
  setTimeout(() => saved.classList.remove('show'), 2500);
}

function initDanger() {
  document.getElementById('btn-clear-data').addEventListener('click', async () => {
    if (confirm('Clear ALL recordings and screenshots from local storage? This cannot be undone.')) {
      await chrome.storage.local.set({ library: [] });
      alert('✅ Library cleared');
    }
  });
  document.getElementById('btn-reset-settings').addEventListener('click', async () => {
    if (confirm('Reset all settings to defaults?')) {
      await chrome.storage.local.set({
        settings: {
          videoQuality: '1080p', fps: 30, format: 'webm', countdown: 3,
          includeAudio: true, includeMic: true, includeWebcam: false,
          defaultPrivacy: 'private', apiUrl: '', aiProvider: 'none',
          openaiKey: '', geminiKey: '', autoCopy: true
        }
      });
      await loadSettings();
      alert('✅ Settings reset to defaults');
    }
  });
}
