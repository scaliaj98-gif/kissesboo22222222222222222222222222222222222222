/**
 * SnapRecord Pro - Options Page Script
 */

const toggleStates = { mic: true, sys: true };

window.addEventListener('load', async () => {
  await loadSettings();
  initToggles();
  initSaveButton();
});

function handleProviderChange() {
  const provider = document.getElementById('ai-provider').value;
  document.getElementById('api-key-row').style.display = provider !== 'none' ? 'grid' : 'none';
}

async function loadSettings() {
  try {
    const { settings = {} } = await chrome.storage.local.get('settings');
    
    if (settings.videoQuality) document.getElementById('video-quality').value = settings.videoQuality;
    if (settings.fps) document.getElementById('fps').value = settings.fps;
    if (settings.format) document.getElementById('format').value = settings.format;
    if (settings.countdown !== undefined) document.getElementById('countdown').value = settings.countdown;
    if (settings.apiUrl) document.getElementById('api-url').value = settings.apiUrl;
    if (settings.defaultPrivacy) document.getElementById('default-privacy').value = settings.defaultPrivacy;
    if (settings.aiProvider) {
      document.getElementById('ai-provider').value = settings.aiProvider;
      handleProviderChange();
    }
    if (settings.aiApiKey) document.getElementById('ai-api-key').value = settings.aiApiKey;
    
    toggleStates.mic = settings.includeMic !== false;
    toggleStates.sys = settings.includeAudio !== false;
    updateToggleUI('mic');
    updateToggleUI('sys');
  } catch (e) {
    console.error('Load settings error:', e);
  }
}

function initToggles() {
  ['mic', 'sys'].forEach(key => {
    document.getElementById(`toggle-${key}`).addEventListener('click', () => {
      toggleStates[key] = !toggleStates[key];
      updateToggleUI(key);
    });
  });
}

function updateToggleUI(key) {
  const toggle = document.getElementById(`toggle-${key}`);
  const label = document.getElementById(`toggle-${key}-label`);
  toggle.classList.toggle('on', toggleStates[key]);
  label.textContent = toggleStates[key] ? 'On' : 'Off';
}

function initSaveButton() {
  document.getElementById('save-btn').addEventListener('click', saveSettings);
}

async function saveSettings() {
  const settings = {
    videoQuality: document.getElementById('video-quality').value,
    fps: parseInt(document.getElementById('fps').value),
    format: document.getElementById('format').value,
    countdown: parseInt(document.getElementById('countdown').value),
    includeAudio: toggleStates.sys,
    includeMic: toggleStates.mic,
    apiUrl: document.getElementById('api-url').value.trim(),
    defaultPrivacy: document.getElementById('default-privacy').value,
    aiProvider: document.getElementById('ai-provider').value,
    aiApiKey: document.getElementById('ai-api-key').value.trim()
  };

  try {
    await chrome.storage.local.set({ settings });
    const toast = document.getElementById('saved-toast');
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2500);
  } catch (e) {
    alert('Error saving settings: ' + e.message);
  }
}
