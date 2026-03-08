/**
 * SnapRecord Pro - AI Sidebar v2.0
 */

const KNOWLEDGE_BASE = {
  'start recording': 'Click the **⏺ Record** tab in the popup, choose your source (Screen/Tab/Webcam), configure options, then hit **Start Recording**. You can set a countdown timer (3s/10s/20s) before it starts.',
  'screenshot': 'Go to the **📸 Screenshot** tab. Choose "Visible Area", "Select Region", or "Full Page". Set a delay timer if needed, then click **Capture Screenshot**.',
  'trim': 'Open your recording in the **🎬 Video Editor**. Use the **trim handles** on the timeline to set the start/end points, then export.',
  'share': 'In the Video Editor or Screenshot Editor, click the **🔗 Share** button. This copies a shareable link (requires backend URL in Settings).',
  'annotate': 'After taking a screenshot, it opens in the **Screenshot Editor** automatically. Use the toolbar to draw, add text, blur areas, or insert emojis.',
  'blur': 'In the Screenshot Editor, select the **🔒 Blur tool** from the toolbar. Draw over any sensitive info to redact it.',
  'audio': 'In the Record tab, toggle **🎙 Microphone** and **🔊 System Audio** on/off before recording.',
  'webcam': 'Toggle **📹 Camera Overlay** on, or select "Webcam" or "Both" as your recording source.',
  'countdown': 'In the Record or Screenshot tab, select 3s, 10s, or 20s timer, or enter a custom value. A visual countdown will appear.',
  'keyboard': 'Shortcuts: **Alt+Shift+V** = capture visible, **Alt+Shift+R** = select region, **Alt+Shift+S** = start/stop recording, **Alt+Shift+A** = AI sidebar.',
  'library': 'Click the **🗂️ Library** tab to see all recordings and screenshots. You can search, filter by type, and manage items.',
  'settings': 'Click **⚙️ Settings** to configure video quality, default timers, AI API keys, and your backend URL.',
  'quality': 'In Settings, choose video quality (720p/1080p/4K) and FPS (24/30/60). Toggle HD Quality in the Record tab for quick 1080p.',
  'ai': 'Add your OpenAI (sk-...) or Gemini API key in Settings or right here. The AI can then answer advanced questions and help with your content.',
  'captions': 'In the Video Editor, click **💬 Auto Captions**. This requires an AI API key configured in Settings.',
  'full page': 'In the Screenshot tab, select "Full Page" to capture the entire scrollable page. The extension will scroll and stitch the capture automatically.',
  'region': 'Select "Region" in the Screenshot tab, then drag to select any area of the page.',
  'loom': 'SnapRecord Pro is like Loom but fully local and customizable! You get screen recording, webcam overlay, screenshot annotation, video editing, and AI assistance — all in one extension.',
};

let messages = [];
let apiKey = '';
let aiProvider = 'none';
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkPendingPrompt();
  initInput();
  initQuickPrompts();
  initApiSetup();
});

async function loadSettings() {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    if (settings?.openaiKey) { apiKey = settings.openaiKey; aiProvider = 'openai'; updateApiStatus(true); }
    else if (settings?.geminiKey) { apiKey = settings.geminiKey; aiProvider = 'gemini'; updateApiStatus(true); }
    else { updateApiStatus(false); }
  } catch (e) {}
}

async function checkPendingPrompt() {
  try {
    const data = await chrome.storage.session.get('aiPrompt');
    if (data.aiPrompt) {
      await chrome.storage.session.remove('aiPrompt');
      setTimeout(() => sendMessage(data.aiPrompt), 500);
    }
  } catch (e) {}
}

function updateApiStatus(hasKey) {
  const dot = document.getElementById('api-dot');
  const text = document.getElementById('api-status-text');
  dot.className = 'status-dot' + (hasKey ? '' : ' offline');
  text.textContent = hasKey ? `Connected (${aiProvider})` : 'No API key — using knowledge base';
  if (hasKey) document.getElementById('api-setup-card')?.remove();
}

function initApiSetup() {
  document.getElementById('inline-save-key')?.addEventListener('click', async () => {
    const key = document.getElementById('inline-api-key').value.trim();
    if (!key) return;
    const provider = key.startsWith('sk-') ? 'openai' : 'gemini';
    apiKey = key; aiProvider = provider;
    const { settings = {} } = await chrome.storage.local.get('settings');
    if (provider === 'openai') settings.openaiKey = key;
    else settings.geminiKey = key;
    await chrome.storage.local.set({ settings });
    updateApiStatus(true);
    addMessage('assistant', `✅ ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key saved! I can now answer advanced questions with full AI capabilities.`);
  });
}

function initInput() {
  const input = document.getElementById('msg-input');
  const btn = document.getElementById('send-btn');

  btn.addEventListener('click', () => { const v = input.value.trim(); if (v) { sendMessage(v); input.value = ''; } });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const v = input.value.trim();
      if (v) { sendMessage(v); input.value = ''; }
    }
  });
}

function initQuickPrompts() {
  document.querySelectorAll('.qp-btn').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.prompt));
  });
}

async function sendMessage(text) {
  if (isLoading) return;
  addMessage('user', text);
  messages.push({ role: 'user', content: text });

  isLoading = true;
  document.getElementById('send-btn').disabled = true;
  showTyping();

  let response;
  if (apiKey && aiProvider === 'openai') {
    response = await callOpenAI(text);
  } else if (apiKey && aiProvider === 'gemini') {
    response = await callGemini(text);
  } else {
    response = getKnowledgeBaseAnswer(text);
  }

  hideTyping();
  addMessage('assistant', response);
  messages.push({ role: 'assistant', content: response });
  isLoading = false;
  document.getElementById('send-btn').disabled = false;
}

async function callOpenAI(userMessage) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for SnapRecord Pro, a Chrome extension for screen recording, screenshots, and video editing. Answer questions helpfully and concisely. Use markdown formatting. Focus on the extension features.' },
          ...messages.slice(-8)
        ]
      })
    });
    const data = await res.json();
    if (data.error) return `❌ OpenAI Error: ${data.error.message}`;
    return data.choices[0].message.content;
  } catch (e) {
    return `❌ Network error: ${e.message}. Check your API key in Settings.`;
  }
}

async function callGemini(userMessage) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a helpful assistant for SnapRecord Pro Chrome extension. ${userMessage}` }] }],
        generationConfig: { maxOutputTokens: 500 }
      })
    });
    const data = await res.json();
    if (data.error) return `❌ Gemini Error: ${data.error.message}`;
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return `❌ Network error: ${e.message}. Check your API key in Settings.`;
  }
}

function getKnowledgeBaseAnswer(query) {
  const q = query.toLowerCase();
  for (const [key, answer] of Object.entries(KNOWLEDGE_BASE)) {
    if (q.includes(key)) return answer;
  }

  // Generic responses
  const generics = [
    "I can help with that! For best results, add an OpenAI or Gemini API key in Settings to get personalized AI assistance.\n\nFor now, try these quick links:\n• **Record tab** → Start/stop recordings\n• **Screenshot tab** → Capture your screen\n• **Library tab** → View saved items\n• **Settings** → Configure everything",
    "Great question! Here's what I know:\n\n**SnapRecord Pro features:**\n• 🎬 Screen, tab, or webcam recording\n• 📸 Screenshot with region/full-page capture\n• ✏️ Annotation editor with drawing tools\n• 🎞️ Video editor with trim & effects\n• 🤖 AI assistant (this!)\n\nAsk me about any specific feature!",
    "To get the most out of SnapRecord Pro:\n1. **Start with the Record tab** to capture your screen\n2. **Use Screenshot** for quick captures\n3. **Annotate** images right in the extension\n4. **Edit** videos in the full editor\n5. **Share** via link with one click\n\nNeed help with something specific?"
  ];
  return generics[Math.floor(Math.random() * generics.length)];
}

function addMessage(role, text) {
  const container = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  el.innerHTML = `<div class="msg-bubble">${formatted}</div><div class="msg-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = 'msg assistant typing-indicator';
  el.id = 'typing-indicator';
  el.innerHTML = `<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}
