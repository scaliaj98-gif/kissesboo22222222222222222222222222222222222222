/**
 * SnapRecord Pro - Background Service Worker
 * Handles recording sessions, messaging, and coordination
 */

// ==================== STATE ====================
let recordingState = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  streamId: null,
  tabId: null,
  type: null, // 'tab', 'desktop', 'webcam'
  includeAudio: true,
  includeMic: true,
  includeWebcam: false,
  timerValue: 0
};

// ==================== INSTALLATION ====================
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open onboarding on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/onboarding.html') });
  }
  // Initialize default settings
  chrome.storage.local.set({
    settings: {
      videoQuality: '1080p',
      fps: 30,
      format: 'webm',
      countdown: 3,
      includeAudio: true,
      includeMic: true,
      defaultPrivacy: 'private',
      apiUrl: '',
      aiProvider: 'none',
      aiApiKey: ''
    }
  });
});

// ==================== KEYBOARD SHORTCUTS ====================
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  switch (command) {
    case 'capture-visible':
      captureVisible(tab);
      break;
    case 'capture-full':
      captureFullPage(tab);
      break;
    case 'capture-region':
      initiateRegionCapture(tab);
      break;
    case 'start-recording':
      if (recordingState.isRecording) {
        stopRecording();
      } else {
        // Open popup to start recording
        chrome.action.openPopup();
      }
      break;
    case 'open-ai-assistant':
      chrome.sidePanel.open({ tabId: tab.id });
      break;
  }
});

// ==================== MESSAGE HANDLING ====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'getRecordingState':
        sendResponse({ state: recordingState });
        break;

      case 'startRecording':
        await startRecording(message.options, sender.tab);
        sendResponse({ success: true, state: recordingState });
        break;

      case 'stopRecording':
        await stopRecording();
        sendResponse({ success: true });
        break;

      case 'pauseRecording':
        recordingState.isPaused = !recordingState.isPaused;
        sendResponse({ paused: recordingState.isPaused });
        break;

      case 'captureVisible':
        const screenshot = await captureVisible(sender.tab);
        sendResponse({ screenshot });
        break;

      case 'captureFullPage':
        await captureFullPage(sender.tab);
        sendResponse({ success: true });
        break;

      case 'initiateRegionCapture':
        await initiateRegionCapture(sender.tab);
        sendResponse({ success: true });
        break;

      case 'captureDelayed':
        await captureDelayed(message.delay, message.type || 'visible', sender.tab);
        sendResponse({ success: true });
        break;

      case 'openEditor':
        await openEditor(message.data);
        sendResponse({ success: true });
        break;

      case 'openScreenshot':
        await openScreenshotEditor(message.data);
        sendResponse({ success: true });
        break;

      case 'openSidePanel':
        if (sender.tab) {
          chrome.sidePanel.open({ tabId: sender.tab.id });
        }
        sendResponse({ success: true });
        break;

      case 'saveToCloud':
        const result = await saveToCloud(message.data);
        sendResponse(result);
        break;

      case 'getSettings':
        const { settings } = await chrome.storage.local.get('settings');
        sendResponse({ settings: settings || {} });
        break;

      case 'saveSettings':
        await chrome.storage.local.set({ settings: message.settings });
        sendResponse({ success: true });
        break;

      case 'recordingChunk':
        // Handled in offscreen document or content script
        sendResponse({ received: true });
        break;

      default:
        sendResponse({ error: 'Unknown action: ' + message.action });
    }
  } catch (error) {
    console.error('Background error:', error);
    sendResponse({ error: error.message });
  }
}

// ==================== SCREENSHOT FUNCTIONS ====================

async function captureVisible(tab) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 });
    await openScreenshotEditor({ imageData: dataUrl, source: 'visible' });
    return dataUrl;
  } catch (error) {
    console.error('Capture visible error:', error);
    return null;
  }
}

async function captureFullPage(tab) {
  try {
    if (!tab) {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    }
    // Inject content script to handle full-page capture
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.postMessage({ type: 'SNAPRECORD_FULL_PAGE_CAPTURE' }, '*');
      }
    });
  } catch (error) {
    // Fallback to visible capture
    captureVisible(tab);
  }
}

async function initiateRegionCapture(tab) {
  try {
    if (!tab) {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        window.postMessage({ type: 'SNAPRECORD_REGION_SELECT' }, '*');
      }
    });
  } catch (error) {
    console.error('Region capture error:', error);
  }
}

async function captureDelayed(delaySeconds, type, tab) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      if (type === 'visible') {
        await captureVisible(tab);
      } else if (type === 'region') {
        await initiateRegionCapture(tab);
      }
      resolve();
    }, delaySeconds * 1000);
  });
}

// ==================== RECORDING FUNCTIONS ====================

async function startRecording(options = {}, tab) {
  if (recordingState.isRecording) return;

  recordingState = {
    ...recordingState,
    ...options,
    isRecording: true,
    isPaused: false,
    startTime: Date.now(),
    tabId: tab?.id || null
  };

  // Update badge
  chrome.action.setBadgeText({ text: '●' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF6B6B' });

  // Notify all content scripts
  notifyAllTabs('recordingStarted', recordingState);
}

async function stopRecording() {
  if (!recordingState.isRecording) return;
  
  recordingState.isRecording = false;
  recordingState.isPaused = false;
  
  chrome.action.setBadgeText({ text: '' });
  
  // Notify all content scripts
  notifyAllTabs('recordingStopped', {});
}

// ==================== EDITOR FUNCTIONS ====================

async function openEditor(data) {
  const url = chrome.runtime.getURL('pages/editor.html');
  const tab = await chrome.tabs.create({ url });
  // Store data for editor to pick up
  await chrome.storage.session.set({ editorData: data });
}

async function openScreenshotEditor(data) {
  const url = chrome.runtime.getURL('pages/screenshot.html');
  await chrome.tabs.create({ url });
  await chrome.storage.session.set({ screenshotData: data });
}

// ==================== CLOUD UPLOAD ====================

async function saveToCloud(data) {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    const apiUrl = settings?.apiUrl || 'https://your-backend.com';
    
    const response = await fetch(`${apiUrl}/api/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      return { success: true, mediaId: result.media_id, shareLink: result.share_link };
    } else {
      throw new Error(`Upload failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Cloud save error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== HELPERS ====================

async function notifyAllTabs(action, data) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action, ...data });
    } catch (e) {
      // Tab may not have content script
    }
  }
}
