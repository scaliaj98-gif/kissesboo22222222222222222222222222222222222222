/**
 * SnapRecord Pro - Content Script v2.0
 * Handles region selection, recording indicators, full-page capture, and video bubbles
 */

(function() {
  if (window.__snaprecord_loaded) return;
  window.__snaprecord_loaded = true;

  let regionOverlay = null;
  let recordingIndicator = null;
  let mediaChunks = [];
  let mediaRecorder = null;

  // ==================== MESSAGE LISTENER ====================
  window.addEventListener('message', async (e) => {
    if (e.source !== window) return;
    switch (e.data?.type) {
      case 'SNAPRECORD_REGION_SELECT': showRegionSelector(); break;
      case 'SNAPRECORD_FULL_PAGE_CAPTURE': captureFullPage(); break;
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
      case 'recordingStarted': showRecordingIndicator(); break;
      case 'recordingStopped': hideRecordingIndicator(); break;
      case 'showCountdown': showCountdownOverlay(msg.seconds); break;
    }
    sendResponse({ received: true });
  });

  // ==================== REGION SELECTOR ====================
  function showRegionSelector() {
    if (regionOverlay) return;

    regionOverlay = document.createElement('div');
    regionOverlay.id = 'snaprecord-region-overlay';
    regionOverlay.innerHTML = `
      <div class="sr-backdrop"></div>
      <div class="sr-selection" id="sr-selection"></div>
      <div class="sr-instructions">
        <span>🎯 Drag to select area • Press ESC to cancel</span>
      </div>
      <div class="sr-coords" id="sr-coords"></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #snaprecord-region-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 2147483647; cursor: crosshair; user-select: none;
      }
      .sr-backdrop {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.4);
      }
      .sr-selection {
        position: absolute; border: 2px solid #FF6B6B;
        background: rgba(255,107,107,0.1); display: none;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.4);
      }
      .sr-instructions {
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(15,23,42,0.95); color: white; padding: 10px 20px;
        border-radius: 100px; font-size: 13px; font-family: -apple-system, sans-serif;
        border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px);
        pointer-events: none;
      }
      .sr-coords {
        position: fixed; background: rgba(15,23,42,0.9); color: #FF6B6B;
        padding: 4px 10px; border-radius: 6px; font-size: 11px;
        font-family: monospace; pointer-events: none; display: none;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(regionOverlay);

    let startX, startY, isDrawing = false;
    const sel = regionOverlay.querySelector('#sr-selection');
    const coords = regionOverlay.querySelector('#sr-coords');

    regionOverlay.addEventListener('mousedown', (e) => {
      isDrawing = true;
      startX = e.clientX; startY = e.clientY;
      sel.style.display = 'block';
      sel.style.left = startX + 'px'; sel.style.top = startY + 'px';
      sel.style.width = '0'; sel.style.height = '0';
    });

    regionOverlay.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const w = e.clientX - startX, h = e.clientY - startY;
      sel.style.left = (w < 0 ? e.clientX : startX) + 'px';
      sel.style.top = (h < 0 ? e.clientY : startY) + 'px';
      sel.style.width = Math.abs(w) + 'px';
      sel.style.height = Math.abs(h) + 'px';
      coords.style.display = 'block';
      coords.style.left = e.clientX + 10 + 'px';
      coords.style.top = e.clientY + 10 + 'px';
      coords.textContent = `${Math.abs(w)}×${Math.abs(h)}`;
    });

    regionOverlay.addEventListener('mouseup', async (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      const rect = sel.getBoundingClientRect();
      removeRegionOverlay();
      if (rect.width > 10 && rect.height > 10) {
        await captureRegion(rect);
      }
    });

    document.addEventListener('keydown', handleEsc);
  }

  function handleEsc(e) {
    if (e.key === 'Escape') { removeRegionOverlay(); }
  }

  function removeRegionOverlay() {
    if (regionOverlay) {
      regionOverlay.remove();
      regionOverlay = null;
    }
    document.removeEventListener('keydown', handleEsc);
  }

  async function captureRegion(rect) {
    try {
      const dataUrl = await chrome.runtime.sendMessage({ action: 'captureVisible' });
      // Crop image in canvas
      const img = new Image();
      img.onload = async () => {
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr,
          0, 0, rect.width * dpr, rect.height * dpr);
        const croppedUrl = canvas.toDataURL('image/png');
        await chrome.runtime.sendMessage({
          action: 'openScreenshot',
          data: { imageData: croppedUrl, source: 'region' }
        });
      };
      img.src = dataUrl.screenshot || dataUrl;
    } catch (e) { console.error(e); }
  }

  // ==================== FULL PAGE CAPTURE ====================
  async function captureFullPage() {
    const originalScrollY = window.scrollY;
    const totalHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth * dpr;
    canvas.height = totalHeight * dpr;
    const ctx = canvas.getContext('2d');

    window.scrollTo(0, 0);
    await sleep(300);

    let scrollY = 0;
    while (scrollY < totalHeight) {
      const cap = await chrome.runtime.sendMessage({ action: 'captureVisible' });
      const img = await loadImage(cap.screenshot || cap);
      ctx.drawImage(img, 0, 0, viewportWidth * dpr, viewportHeight * dpr,
        0, scrollY * dpr, viewportWidth * dpr, viewportHeight * dpr);
      scrollY += viewportHeight;
      if (scrollY >= totalHeight) break;
      window.scrollTo(0, scrollY);
      await sleep(200);
    }

    window.scrollTo(0, originalScrollY);
    const dataUrl = canvas.toDataURL('image/png');
    await chrome.runtime.sendMessage({
      action: 'openScreenshot',
      data: { imageData: dataUrl, source: 'fullpage' }
    });
  }

  // ==================== RECORDING INDICATOR ====================
  function showRecordingIndicator() {
    if (recordingIndicator) return;
    recordingIndicator = document.createElement('div');
    recordingIndicator.id = 'snaprecord-indicator';
    recordingIndicator.innerHTML = `
      <div class="sr-rec-dot"></div>
      <span>REC</span>
    `;
    const style = document.createElement('style');
    style.textContent = `
      #snaprecord-indicator {
        position: fixed; top: 16px; right: 16px; z-index: 2147483646;
        background: rgba(15,23,42,0.95); color: white; padding: 6px 12px;
        border-radius: 100px; display: flex; align-items: center; gap: 7px;
        font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 700;
        border: 1px solid rgba(255,107,107,0.4); backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,107,107,0.2);
        letter-spacing: 1px; color: #FF6B6B;
      }
      .sr-rec-dot {
        width: 8px; height: 8px; background: #FF6B6B; border-radius: 50%;
        animation: srPulse 1.5s ease-in-out infinite;
      }
      @keyframes srPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.8); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(recordingIndicator);
  }

  function hideRecordingIndicator() {
    if (recordingIndicator) { recordingIndicator.remove(); recordingIndicator = null; }
  }

  // ==================== COUNTDOWN OVERLAY ====================
  function showCountdownOverlay(seconds) {
    const overlay = document.createElement('div');
    overlay.id = 'snaprecord-countdown';
    overlay.innerHTML = `<div class="sr-cd-number">${seconds}</div><div class="sr-cd-label">Recording starts in</div>`;
    const style = document.createElement('style');
    style.textContent = `
      #snaprecord-countdown {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 2147483647; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      }
      .sr-cd-number {
        font-size: 120px; font-weight: 900; color: white;
        font-family: -apple-system, sans-serif;
        animation: srCountPulse 1s ease-in-out;
        text-shadow: 0 0 60px rgba(255,107,107,0.8);
      }
      .sr-cd-label {
        color: rgba(255,255,255,0.7); font-size: 20px;
        font-family: -apple-system, sans-serif; margin-top: -10px;
      }
      @keyframes srCountPulse {
        0% { transform: scale(1.5); opacity: 0; }
        30% { transform: scale(1); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    let n = seconds;
    const t = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(t); overlay.remove(); }
      else {
        const num = overlay.querySelector('.sr-cd-number');
        num.textContent = n;
        num.style.animation = 'none';
        num.offsetHeight;
        num.style.animation = 'srCountPulse 1s ease-in-out';
      }
    }, 1000);

    setTimeout(() => overlay.remove(), (seconds + 1) * 1000);
  }

  // ==================== VIDEO BUBBLE (Gmail/Slack/Notion) ====================
  function injectVideoBubble() {
    const hosts = ['mail.google.com', 'slack.com', 'notion.so', 'github.com'];
    if (!hosts.some(h => location.hostname.includes(h))) return;

    const bubble = document.createElement('div');
    bubble.id = 'snaprecord-bubble';
    bubble.innerHTML = `
      <button class="sr-bubble-btn" title="Record video message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10,8 16,12 10,16"/>
        </svg>
      </button>
    `;
    const style = document.createElement('style');
    style.textContent = `
      #snaprecord-bubble {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      }
      .sr-bubble-btn {
        width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer;
        background: linear-gradient(135deg, #FF6B6B, #FF8E53);
        color: white; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(255,107,107,0.5);
        transition: all 0.2s; font-size: 20px;
      }
      .sr-bubble-btn:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(255,107,107,0.7); }
    `;
    document.head.appendChild(style);
    document.body.appendChild(bubble);

    bubble.querySelector('.sr-bubble-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openSidePanel' });
    });
  }

  // ==================== HELPERS ====================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  // Init bubbles on supported sites
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectVideoBubble);
  } else {
    injectVideoBubble();
  }
})();
