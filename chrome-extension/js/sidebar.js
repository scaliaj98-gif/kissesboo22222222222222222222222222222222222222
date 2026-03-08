/**
 * SnapRecord Pro - AI Assistant Sidebar v2
 * Full AI-powered chat using backend API (OpenAI / Gemini via Emergent LLM Key)
 * Context-aware: knows about editor state, screenshot dimensions, recording status
 */

// ==================== STATE ====================
let isLoading = false;
let currentContext = {};
let currentSessionId = generateSessionId();
let settings = { provider: 'openai', model: 'gpt-4o-mini', backendUrl: '', useBuiltIn: false };

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== BUILT-IN KNOWLEDGE (Fallback) ====================
const knowledgeBase = {
  trim: `✂️ **How to Trim Your Recording:**\n\n1. Open the **Video Editor** after stopping recording\n2. Drag the **red In Point handle** to set start\n3. Drag the **Out Point handle** to set end\n4. Click **"Apply Trim"** to confirm\n5. Or press **I** / **O** keys while playing\n\n💡 **Pro Tip:** Watch through first, then set your trim points precisely.`,
  silence: `🔇 **Removing Silences:**\n\n1. Click **"Remove Silence"** in Editor sidebar\n2. Set threshold (try -40dB to start)\n3. Set min silence duration (0.5s recommended)\n4. Click **"Detect Silences"** — marked red on timeline\n5. Review & **"Remove All Silences"**\n\n💡 Lower threshold = catches quieter pauses.`,
  annotate: `✏️ **Screenshot Annotation Tools:**\n\n- **✏️ Pen (P)** - Freehand drawing\n- **🟡 Highlighter (H)** - Semi-transparent highlight\n- **▭ Rect (R)** - Box around areas\n- **→ Arrow (A)** - Point to elements\n- **📝 Text (T)** - Add labels\n- **🖌 Blur (B)** - Redact sensitive info\n\n**Ctrl+Z** to undo. Keep annotations minimal for clarity!`,
  share: `🔗 **Sharing Securely:**\n\n1. Dashboard → click **Copy icon** on any item\n2. Or in Editor → **"Upload & Share"**\n3. Set **Private** 🔒 or **Public** 🌎\n4. Add **expiration date** for time-sensitive content\n\n💡 Recipients don't need an account to view!`,
  quality: `⬆️ **Improving Quality:**\n\n- Enable **HD 1080p** in popup settings\n- Close unused browser tabs\n- Use a dedicated **microphone** for clear audio\n- Record in a **quiet environment**\n- Use **Tab recording** for browser content\n\n💡 30 FPS is ideal for most content.`,
  webcam: `📺 **Screen + Webcam PiP:**\n\n1. In popup, select **"Both"** source\n2. Or select **Screen** + enable **Webcam PiP** toggle\n3. Enable **Microphone** for narration\n4. Set countdown timer if needed\n5. Hit **Start Recording**!\n\n💡 Great for tutorials - viewers see your face reactions!`,
  privacy: `🔒 **Privacy & Expiration:**\n\n**Toggle privacy:** Dashboard → click 🌎/🔒 icon\n**Expiration:** Set when uploading - auto-deletes after date\n**Public** = anyone with link can view\n**Private** = only you (logged in)\n\n💡 Always use Private for sensitive content.`,
  shortcut: `⌨️ **Keyboard Shortcuts:**\n\n**Global:**\n- Alt+Shift+S → Start/Stop recording\n- Alt+Shift+V → Capture visible tab\n- Alt+Shift+R → Region capture\n- Alt+Shift+A → Open AI Assistant\n\n**In Screenshot Editor:**\n- P=Pen, H=Highlight, R=Rect, A=Arrow, T=Text, B=Blur\n- Ctrl+Z=Undo, Ctrl+Y=Redo, Ctrl+S=Save`,
  default: `I'm here to help with **SnapRecord Pro**! 🚀\n\nAsk me about:\n- **Recording** your screen or webcam\n- **Editing** videos (trim, silence removal)\n- **Screenshot** annotation tools\n- **Sharing** & privacy settings\n- **Keyboard shortcuts**\n\nWhat would you like to know?`
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initChat();
  initQuickPrompts();
  await checkContext();
  updateProviderBadge();
});

async function loadSettings() {
  try {
    const data = await chrome.storage.local.get('settings');
    if (data.settings) {
      settings.provider = data.settings.aiProvider || 'openai';
      settings.model = data.settings.aiModel || 'gpt-4o-mini';
      settings.backendUrl = data.settings.apiUrl || '';
      settings.useBuiltIn = data.settings.aiProvider === 'builtin';
    }
    const notice = document.getElementById('setup-notice');
    if (notice && settings.backendUrl && settings.provider !== 'builtin') {
      notice.style.display = 'none';
    }
  } catch (e) {
    // Not in extension context
  }
}

async function checkContext() {
  try {
    const data = await chrome.storage.session.get(['aiContext', 'aiPrompt']);
    
    if (data.aiContext) {
      currentContext = data.aiContext;
      const banner = document.getElementById('context-banner');
      const bannerText = document.getElementById('context-text');
      
      if (currentContext.page === 'editor') {
        const dur = currentContext.duration || 'unknown';
        if (banner) { banner.classList.remove('hidden'); bannerText.textContent = `📹 Video Editor — ${dur}`; }
        addMessage('ai', `🎬 I can see you're in the **Video Editor**! Your video is **${dur}** long.\n\nI can help you:\n- Trim and cut your footage\n- Detect and remove silences\n- Add text overlays\n- Export and share\n\nWhat would you like to do?`, false);
      } else if (currentContext.page === 'screenshot') {
        const dim = `${currentContext.width || '?'} × ${currentContext.height || '?'}`;
        if (banner) { banner.classList.remove('hidden'); bannerText.textContent = `📸 Screenshot Editor — ${dim}`; }
        addMessage('ai', `📸 Screenshot Editor open! Dimensions: **${dim}**\n\nI can help with:\n- Best annotation techniques\n- Tool shortcuts (P=Pen, H=Highlight, R=Rect)\n- Sharing this screenshot\n\nWhat do you need?`, false);
      }
    }
    
    if (data.aiPrompt) {
      await chrome.storage.session.remove('aiPrompt');
      const prompts = {
        trim: 'How do I trim my recording?',
        silence: 'How do I remove silence from my video?',
        annotate: 'What are the best annotation techniques for screenshots?',
        share: 'How do I share a recording securely with privacy settings?',
        quality: 'How can I improve my recording quality?'
      };
      const question = prompts[data.aiPrompt];
      if (question) setTimeout(() => handleUserMessage(question), 800);
    }
  } catch (e) {
    // Not in extension context
  }
}

function updateProviderBadge() {
  const badge = document.getElementById('provider-badge');
  if (!badge) return;
  
  if (settings.useBuiltIn || !settings.backendUrl) {
    badge.textContent = '📚 Built-in';
    badge.style.background = 'rgba(100,116,139,0.2)';
    badge.style.color = '#94A3B8';
  } else if (settings.provider === 'gemini') {
    badge.textContent = '✨ Gemini';
    badge.style.background = 'rgba(99,102,241,0.2)';
    badge.style.color = '#818CF8';
  } else {
    badge.textContent = '🤖 GPT-4o';
    badge.style.background = 'rgba(16,185,129,0.2)';
    badge.style.color = '#34D399';
  }
}

// ==================== CHAT ====================
function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const newChatBtn = document.getElementById('new-chat-btn');

  sendBtn.addEventListener('click', () => {
    const msg = input.value.trim();
    if (msg && !isLoading) {
      handleUserMessage(msg);
      input.value = '';
      input.style.height = 'auto';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const msg = input.value.trim();
      if (msg && !isLoading) {
        handleUserMessage(msg);
        input.value = '';
        input.style.height = 'auto';
      }
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  newChatBtn.addEventListener('click', clearChat);

  const openSettings = document.getElementById('open-settings');
  if (openSettings) {
    openSettings.addEventListener('click', () => {
      try { chrome.runtime.openOptionsPage(); } catch(e) {}
    });
  }
}

function initQuickPrompts() {
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => handleUserMessage(btn.dataset.q));
  });
}

function clearChat() {
  currentSessionId = generateSessionId();
  
  if (settings.backendUrl) {
    fetch(`${settings.backendUrl}/api/ai/session/${currentSessionId}`, {
      method: 'DELETE', credentials: 'include'
    }).catch(() => {});
  }

  const messages = document.getElementById('messages');
  messages.innerHTML = `
    <div class="message ai">
      <div class="msg-avatar ai">🤖</div>
      <div class="msg-bubble">
        <strong>New conversation! 🚀</strong><br>
        How can I help you with SnapRecord today?
      </div>
    </div>
  `;
}

async function handleUserMessage(text) {
  if (isLoading) return;
  
  addMessage('user', text);
  showTypingIndicator();
  isLoading = true;
  document.getElementById('send-btn').disabled = true;

  try {
    // Refresh context
    try {
      const ctxData = await chrome.storage.session.get('aiContext');
      if (ctxData.aiContext) currentContext = ctxData.aiContext;
    } catch(e) {}
    
    let response;
    if (!settings.useBuiltIn && settings.backendUrl) {
      response = await callBackendAI(text);
    } else {
      await sleep(300 + Math.random() * 200);
      response = getBuiltinResponse(text);
    }
    
    hideTypingIndicator();
    addMessage('ai', response);
  } catch (e) {
    hideTypingIndicator();
    const fallback = getBuiltinResponse(text);
    addMessage('ai', `${fallback}\n\n---\n*💡 Note: AI service unavailable, showing built-in help. Check your dashboard URL in Settings.*`);
  }

  isLoading = false;
  document.getElementById('send-btn').disabled = false;
}

async function callBackendAI(message) {
  const response = await fetch(`${settings.backendUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      message,
      session_id: currentSessionId,
      provider: settings.provider === 'gemini' ? 'gemini' : 'openai',
      model: settings.model || 'gpt-4o-mini',
      context: currentContext
    })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.response;
}

function getBuiltinResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('trim') || q.includes('cut')) return knowledgeBase.trim;
  if (q.includes('silence') || q.includes('filler')) return knowledgeBase.silence;
  if (q.includes('annotate') || q.includes('draw') || q.includes('highlight')) return knowledgeBase.annotate;
  if (q.includes('share') || q.includes('link') || q.includes('url')) return knowledgeBase.share;
  if (q.includes('quality') || q.includes('hd') || q.includes('resolution')) return knowledgeBase.quality;
  if (q.includes('webcam') || q.includes('camera') || q.includes('pip') || q.includes('both')) return knowledgeBase.webcam;
  if (q.includes('privacy') || q.includes('private') || q.includes('expir')) return knowledgeBase.privacy;
  if (q.includes('shortcut') || q.includes('keyboard') || q.includes('hotkey')) return knowledgeBase.shortcut;
  return knowledgeBase.default;
}

// ==================== UI ====================
function addMessage(role, text, animate = true) {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (animate) div.style.animation = 'fadeIn 0.3s ease';
  div.innerHTML = `
    <div class="msg-avatar ${role}">${role === 'ai' ? '🤖' : '👤'}</div>
    <div class="msg-bubble">${formatMessage(text)}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:11px;font-family:monospace;">$1</code>')
    .replace(/^- (.*)/gm, '<li style="margin-left:12px;margin-bottom:2px;">$1</li>')
    .replace(/^(\d+)\. (.*)/gm, '<li style="margin-left:12px;margin-bottom:2px;">$2</li>')
    .replace(/---/g, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:8px 0;">')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
  const messages = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="msg-avatar ai">🤖</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function hideTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
