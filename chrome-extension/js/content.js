/**
 * SnapRecord Pro - Content Script
 * Handles region selection, full page capture, and video message bubbles
 */

// ==================== REGION SELECTION ====================
let regionOverlay = null;
let isSelectingRegion = false;

window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  if (e.data.type === 'SNAPRECORD_REGION_SELECT') {
    startRegionSelection();
  } else if (e.data.type === 'SNAPRECORD_FULL_PAGE_CAPTURE') {
    captureFullPage();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRegionCapture') {
    startRegionSelection();
    sendResponse({ started: true });
  } else if (message.action === 'recordingStarted') {
    showRecordingIndicator();
  } else if (message.action === 'recordingStopped') {
    hideRecordingIndicator();
  }
  return true;
});

function startRegionSelection() {
  if (isSelectingRegion) return;
  isSelectingRegion = true;

  regionOverlay = document.createElement('div');
  regionOverlay.id = 'snaprecord-region-overlay';
  regionOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    cursor: crosshair;
    background: rgba(0,0,0,0.3);
  `;

  const selection = document.createElement('div');
  selection.id = 'snaprecord-selection';
  selection.style.cssText = `
    position: absolute;
    border: 2px solid #FF6B6B;
    background: rgba(255,107,107,0.1);
    pointer-events: none;
    display: none;
  `;

  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15,23,42,0.95);
    color: white;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 600;
    font-family: Inter, sans-serif;
    z-index: 2147483647;
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    pointer-events: none;
  `;
  tooltip.textContent = '\u2702\ufe0f Click and drag to select region • ESC to cancel';

  regionOverlay.appendChild(selection);
  regionOverlay.appendChild(tooltip);
  document.body.appendChild(regionOverlay);

  let startX, startY, isDragging = false;

  regionOverlay.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.display = 'block';
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0';
    selection.style.height = '0';
  });

  regionOverlay.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    selection.style.left = x + 'px';
    selection.style.top = y + 'px';
    selection.style.width = w + 'px';
    selection.style.height = h + 'px';
    tooltip.textContent = `${w} \u00d7 ${h}px \u2022 Release to capture`;
  });

  regionOverlay.addEventListener('mouseup', async (e) => {
    if (!isDragging) return;
    isDragging = false;
    isSelectingRegion = false;
    
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);

    regionOverlay.remove();
    regionOverlay = null;

    if (w < 5 || h < 5) return;

    // Ask background to capture then crop
    try {
      const response = await chrome.runtime.sendMessage({ action: 'captureVisible' });
      if (response?.screenshot) {
        // Crop the screenshot to the selected region
        const croppedData = await cropImage(response.screenshot, x, y, w, h);
        await chrome.runtime.sendMessage({
          action: 'openScreenshot',
          data: { imageData: croppedData, source: 'region' }
        });
      }
    } catch (err) {
      console.error('Region capture error:', err);
    }
  });

  // ESC to cancel
  document.addEventListener('keydown', function cancelRegion(e) {
    if (e.key === 'Escape') {
      isSelectingRegion = false;
      if (regionOverlay) { regionOverlay.remove(); regionOverlay = null; }
      document.removeEventListener('keydown', cancelRegion);
    }
  });
}

async function cropImage(dataUrl, x, y, w, h) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, x * dpr, y * dpr, w * dpr, h * dpr, 0, 0, w * dpr, h * dpr);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

// ==================== FULL PAGE CAPTURE ====================
async function captureFullPage() {
  const totalHeight = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight
  );
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  if (totalHeight <= viewportHeight * 1.2) {
    // Single capture is enough
    await chrome.runtime.sendMessage({ action: 'captureVisible' });
    return;
  }

  // Multi-scroll capture
  const screenshots = [];
  const originalScroll = window.scrollY;
  
  window.scrollTo(0, 0);
  await sleep(200);
  
  let scrollY = 0;
  while (scrollY < totalHeight) {
    const response = await chrome.runtime.sendMessage({ action: 'captureVisible' });
    if (response?.screenshot) screenshots.push({ data: response.screenshot, y: scrollY });
    scrollY += viewportHeight;
    if (scrollY < totalHeight) {
      window.scrollTo(0, scrollY);
      await sleep(300);
    }
  }
  
  window.scrollTo(0, originalScroll);
  
  // Stitch screenshots together
  if (screenshots.length > 0) {
    const stitched = await stitchScreenshots(screenshots, viewportWidth, totalHeight);
    await chrome.runtime.sendMessage({ action: 'openScreenshot', data: { imageData: stitched, source: 'fullpage' } });
  }
}

async function stitchScreenshots(screenshots, width, totalHeight) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    let loaded = 0;
    screenshots.forEach((ss) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, ss.y);
        loaded++;
        if (loaded === screenshots.length) {
          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.src = ss.data;
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== RECORDING INDICATOR ====================
function showRecordingIndicator() {
  if (document.getElementById('snaprecord-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'snaprecord-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background: rgba(239,68,68,0.9);
    color: white;
    padding: 8px 14px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(239,68,68,0.4);
  `;
  indicator.innerHTML = '<span style="width:8px;height:8px;background:white;border-radius:50%;animation:snapRecPulse 1.5s infinite;"></span> Recording';
  
  const style = document.createElement('style');
  style.textContent = '@keyframes snapRecPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }';
  document.head.appendChild(style);
  document.body.appendChild(indicator);
}

function hideRecordingIndicator() {
  const indicator = document.getElementById('snaprecord-indicator');
  if (indicator) indicator.remove();
}

// ==================== VIDEO MESSAGE BUBBLE ====================
// Inject into text inputs on supported sites
const SUPPORTED_SITES = ['gmail.com', 'slack.com', 'notion.so', 'linear.app', 'github.com'];
const hostname = window.location.hostname;

if (SUPPORTED_SITES.some(site => hostname.includes(site))) {
  injectVideoBubbles();
}

function injectVideoBubbles() {
  const observer = new MutationObserver(() => {
    const textareas = document.querySelectorAll('textarea, [contenteditable="true"]');
    textareas.forEach(textarea => {
      if (textarea.dataset.snaprecordInjected) return;
      textarea.dataset.snaprecordInjected = 'true';
      addVideoBubble(textarea);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function addVideoBubble(textarea) {
  const bubble = document.createElement('button');
  bubble.style.cssText = `
    position: absolute;
    z-index: 9999;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(255,107,107,0.4);
    transition: all 0.2s;
  `;
  bubble.title = 'Record video message (SnapRecord)';
  bubble.innerHTML = '🎬';
  bubble.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: 'startRecording', options: { type: 'tab', isMessage: true } });
  });
  bubble.addEventListener('mouseenter', () => {
    bubble.style.transform = 'scale(1.1)';
  });
  bubble.addEventListener('mouseleave', () => {
    bubble.style.transform = 'scale(1)';
  });

  // Position relative to textarea
  const updatePosition = () => {
    const rect = textarea.getBoundingClientRect();
    bubble.style.top = (rect.top + window.scrollY + 4) + 'px';
    bubble.style.left = (rect.right + window.scrollX - 40) + 'px';
  };
  
  updatePosition();
  textarea.addEventListener('focus', () => { bubble.style.display = 'flex'; updatePosition(); });
  textarea.addEventListener('blur', () => { setTimeout(() => { bubble.style.display = 'none'; }, 200); });
  bubble.style.display = 'none';
  document.body.appendChild(bubble);
}
