/**
 * SnapRecord Pro - Background Service Worker v2.0
 */

let recordingState = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  streamId: null,
  tabId: null,
  type: null,
  includeAudio: true,
  includeMic: true,
  includeWebcam: false
};

// ==================== INSTALL ====================
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/onboarding.html') });
  }
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
      aiApiKey: '',
      openaiKey: '',
      geminiKey: ''
    },
    library: [],
    folders: [{ id: 'all', name: 'All Items', icon: '📁' }]
  });
});

// ==================== KEYBOARD SHORTCUTS ====================
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  switch (command) {
    case 'capture-visible': captureVisible(tab); break;
    case 'capture-full': captureFullPage(tab); break;
    case 'capture-region': initiateRegionCapture(tab); break;
    case 'start-recording':
      if (recordingState.isRecording) stopRecording();
      else chrome.action.openPopup();
      break;
    case 'open-ai-assistant':
      chrome.sidePanel.open({ tabId: tab.id });
      break;
  }
});

// ==================== MESSAGES ====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'getRecordingState':
        sendResponse({ state: recordingState }); break;
      case 'startRecording':
        await startRecording(message.options, sender.tab);
        sendResponse({ success: true, state: recordingState }); break;
      case 'stopRecording':
        await stopRecording();
        sendResponse({ success: true }); break;
      case 'pauseRecording':
        recordingState.isPaused = !recordingState.isPaused;
        sendResponse({ paused: recordingState.isPaused }); break;
      case 'captureVisible':
        const ss = await captureVisible(sender.tab);
        sendResponse({ screenshot: ss }); break;
      case 'captureFullPage':
        await captureFullPage(sender.tab);
        sendResponse({ success: true }); break;
      case 'initiateRegionCapture':
        await initiateRegionCapture(sender.tab);
        sendResponse({ success: true }); break;
      case 'captureDelayed':
        await captureDelayed(message.delay, message.type || 'visible', sender.tab);
        sendResponse({ success: true }); break;
      case 'openEditor':
        await openEditor(message.data);
        sendResponse({ success: true }); break;
      case 'openScreenshot':
        await openScreenshotEditor(message.data);
        sendResponse({ success: true }); break;
      case 'openSidePanel':
        if (sender.tab) chrome.sidePanel.open({ tabId: sender.tab.id });
        sendResponse({ success: true }); break;
      case 'saveToLibrary':
        await saveToLibrary(message.data);
        sendResponse({ success: true }); break;
      case 'getLibrary':
        const lib = await getLibrary();
        sendResponse({ library: lib }); break;
      case 'deleteLibraryItem':
        await deleteLibraryItem(message.id);
        sendResponse({ success: true }); break;
      case 'getSettings':
        const { settings } = await chrome.storage.local.get('settings');
        sendResponse({ settings: settings || {} }); break;
      case 'saveSettings':
        await chrome.storage.local.set({ settings: message.settings });
        sendResponse({ success: true }); break;
      case 'getFolders':
        const { folders } = await chrome.storage.local.get('folders');
        sendResponse({ folders: folders || [] }); break;
      case 'saveFolders':
        await chrome.storage.local.set({ folders: message.folders });
        sendResponse({ success: true }); break;
      default:
        sendResponse({ error: 'Unknown: ' + message.action });
    }
  } catch (error) {
    console.error('BG error:', error);
    sendResponse({ error: error.message });
  }
}

// ==================== SCREENSHOTS ====================
async function captureVisible(tab) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 });
    await openScreenshotEditor({ imageData: dataUrl, source: 'visible' });
    return dataUrl;
  } catch (e) { console.error(e); return null; }
}

async function captureFullPage(tab) {
  try {
    if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.postMessage({ type: 'SNAPRECORD_FULL_PAGE_CAPTURE' }, '*')
    });
  } catch (e) { captureVisible(tab); }
}

async function initiateRegionCapture(tab) {
  try {
    if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.postMessage({ type: 'SNAPRECORD_REGION_SELECT' }, '*')
    });
  } catch (e) { console.error(e); }
}

async function captureDelayed(delaySeconds, type, tab) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      if (type === 'visible') await captureVisible(tab);
      else if (type === 'region') await initiateRegionCapture(tab);
      resolve();
    }, delaySeconds * 1000);
  });
}

// ==================== RECORDING ====================
async function startRecording(options = {}, tab) {
  if (recordingState.isRecording) return;
  recordingState = { ...recordingState, ...options, isRecording: true, isPaused: false, startTime: Date.now(), tabId: tab?.id || null };
  chrome.action.setBadgeText({ text: '⏺' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF6B6B' });
  notifyAllTabs('recordingStarted', recordingState);
}

async function stopRecording() {
  if (!recordingState.isRecording) return;
  recordingState.isRecording = false;
  recordingState.isPaused = false;
  chrome.action.setBadgeText({ text: '' });
  notifyAllTabs('recordingStopped', {});
}

// ==================== EDITOR ====================
async function openEditor(data) {
  const url = chrome.runtime.getURL('pages/editor.html');
  await chrome.tabs.create({ url });
  await chrome.storage.session.set({ editorData: data });
}

async function openScreenshotEditor(data) {
  const url = chrome.runtime.getURL('pages/screenshot.html');
  await chrome.tabs.create({ url });
  await chrome.storage.session.set({ screenshotData: data });
}

// ==================== LIBRARY ====================
async function saveToLibrary(item) {
  const { library = [] } = await chrome.storage.local.get('library');
  const newItem = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    isPublic: false,
    tags: [],
    folderId: 'all',
    ...item
  };
  library.unshift(newItem);
  await chrome.storage.local.set({ library: library.slice(0, 200) });
  return newItem;
}

async function getLibrary() {
  const { library = [] } = await chrome.storage.local.get('library');
  return library;
}

async function deleteLibraryItem(id) {
  const { library = [] } = await chrome.storage.local.get('library');
  await chrome.storage.local.set({ library: library.filter(i => i.id !== id) });
}

// ==================== HELPERS ====================
async function notifyAllTabs(action, data) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try { await chrome.tabs.sendMessage(tab.id, { action, ...data }); }
    catch (e) {}
  }
}
