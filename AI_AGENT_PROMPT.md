# 🤖 Continuation Prompt for AI Agent

## Context
You are taking over development of **SnapRecord Pro**, a Chrome extension for screen recording, screenshots, and AI-powered video editing (similar to Loom). The project uses React frontend, FastAPI backend, MongoDB, and a Manifest V3 Chrome extension.

---

## Current Status

### ✅ What's Complete and Working
1. **Web Application (React + FastAPI + MongoDB)**
   - Modern landing page with 2026-style design, animated gradients, pricing plans
   - Login/Signup pages with Emergent Auth (Google OAuth)
   - Full dashboard with media library (grid/list view), folder organization, search/filter
   - Backend API with 15+ endpoints (auth, media CRUD, folders, stats, AI chat)
   - Real database integration with MongoDB
   - Share link generation
   - Privacy settings (public/private media)

2. **Chrome Extension Structure (Manifest V3)**
   - Valid manifest with all required permissions
   - Popup UI with quick actions
   - AI Assistant sidebar (side panel API)
   - Screenshot editor UI with canvas
   - Video editor UI with timeline
   - Options page
   - Background service worker
   - Content script

3. **AI Integration**
   - Backend endpoints created: `/api/ai/chat` and `/api/ai/tag`
   - Uses Emergent LLM Key via `emergentintegrations` library
   - Sidebar UI connects to backend (security best practice)

### ⚠️ What's Incomplete or Broken
1. **Chrome Extension - Core Features Missing**
   - ❌ Screen recording logic (no MediaRecorder implementation)
   - ❌ Screenshot capture (no `chrome.tabs.captureVisibleTab`)
   - ❌ Video editing (no `ffmpeg.wasm` integration)
   - ❌ File upload from extension to backend
   - ❌ User-provided API key support (options page needs implementation)

2. **AI Features Untested**
   - AI endpoints created but NEVER TESTED
   - Need to verify with curl and actual usage

3. **Missing Features from Spec**
   - Picture-in-picture (screen + webcam)
   - Remove silence in videos
   - GIF export
   - Loom-style async video messaging
   - Timer/delay for captures
   - Expiration dates (backend ready, no UI)

4. **Code Quality Issues**
   - Backend is one 849-line file (needs refactoring into modules)
   - Potential duplicate Pydantic model

5. **UI Needs Improvement**
   - User wants more joyful, friendly, modern design
   - Homepage needs footer
   - Login/signup need friendlier styling
   - Dashboard needs more personality

---

## Project Structure
```
/app/
├── backend/
│   ├── server.py (849 lines - all endpoints)
│   ├── requirements.txt
│   └── .env (MONGO_URL, DB_NAME, EMERGENT_LLM_KEY)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── SignupPage.js
│   │   │   └── Dashboard.js
│   │   ├── components/ui/ (Shadcn components)
│   │   └── context/AuthContext.js
│   └── package.json
└── chrome-extension/
    ├── manifest.json
    ├── js/ (background.js, popup.js, sidebar.js, etc.)
    └── pages/ (HTML files for extension)
```

---

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python), Motor (async MongoDB driver)
- **Database**: MongoDB
- **Extension**: Chrome Manifest V3
- **AI**: Emergent LLM Key via `emergentintegrations==0.1.0`
- **Auth**: Emergent Auth (Google OAuth)

---

## Environment Setup
- Frontend runs on port 3000
- Backend runs on port 8001 (proxied via `/api` prefix)
- MongoDB: Use `MONGO_URL` from `.env`
- All API calls: `process.env.REACT_APP_BACKEND_URL` + `/api/...`
- Never hardcode URLs or credentials

---

## Immediate Next Steps (Priority Order)

### P0 - Critical
1. **Test AI Endpoints**
   - Restart backend: `sudo supervisorctl restart backend`
   - Test with curl: `/api/ai/chat` with `{"message": "Hello"}`
   - Fix any issues

2. **Fix Backend Issues**
   - Check for duplicate `CreateMediaRequest` model in server.py
   - Remove if duplicate exists

3. **Implement Screen Recording in Extension**
   - Add `chrome.desktopCapture.chooseDesktopMedia()`
   - Set up MediaRecorder with video/audio streams
   - Save recording blob
   - Upload to backend `/api/media`

4. **Implement Screenshot Capture**
   - Use `chrome.tabs.captureVisibleTab()` for visible area
   - Add region selection tool for partial captures
   - Upload to backend

### P1 - High Priority
5. **Add User API Key Support**
   - Create form in `options.html` for OpenAI/Gemini API key
   - Save to `chrome.storage.local`
   - Modify backend to check for user's key first, fallback to Emergent key

6. **Integrate Video Editing**
   - Install `ffmpeg.wasm` in extension
   - Add trim functionality
   - Add text overlay
   - Export and upload

### P2 - Medium Priority
7. **UI Improvements (User's Request)**
   - Add footer to homepage (social links, legal pages)
   - Make login/signup more joyful and friendly
   - Improve dashboard with more personality
   - Better icons, buttons, animations

8. **Refactor Backend**
   - Split server.py into:
     - `/app/backend/routers/auth.py`
     - `/app/backend/routers/media.py`
     - `/app/backend/routers/folders.py`
     - `/app/backend/routers/ai.py`
     - `/app/backend/models.py`
     - `/app/backend/database.py`

9. **Add Missing Features**
   - Picture-in-picture recording
   - Remove silence feature
   - GIF export
   - Video player with hover preview

---

## Important Endpoints

**Authentication:**
- `POST /api/auth/emergent/callback` - OAuth callback

**Media:**
- `GET /api/media?type=screenshot|recording` - List media
- `POST /api/media` - Upload media (expects JSON with base64 file_data)
- `PATCH /api/media/{media_id}` - Update media
- `DELETE /api/media/{media_id}` - Delete media

**Folders:**
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder (expects `{"name": "...", "color": "#..."}`)
- `DELETE /api/folders/{folder_id}` - Delete folder

**AI:**
- `POST /api/ai/chat` - Chat with AI (expects `{"message": "..."}`)
- `POST /api/ai/tag` - Auto-tag image (expects `{"image_data": "base64..."}`)

**Stats:**
- `GET /api/stats` - User statistics

---

## Database Schema

**users collection:**
```javascript
{
  user_id: string,
  email: string,
  name: string,
  picture: string,
  created_at: datetime
}
```

**media collection:**
```javascript
{
  media_id: string,
  user_id: string,
  type: "screenshot" | "recording",
  title: string,
  description: string,
  tags: string[],
  file_data: string (base64),
  file_url: string,
  thumbnail: string,
  duration: number,
  is_public: boolean,
  share_link: string,
  folder_id: string,
  expiration_date: string,
  created_at: datetime,
  updated_at: datetime
}
```

**folders collection:**
```javascript
{
  folder_id: string,
  user_id: string,
  name: string,
  color: string,
  created_at: datetime,
  updated_at: datetime
}
```

---

## Testing Protocol
- Use `curl` for backend API testing
- Use backend testing agent for comprehensive tests
- Test Chrome extension by loading unpacked in Chrome
- AI features must be tested before marking complete

---

## User's Specific Requests
1. ✅ "Give me better UI and layout for homepage, login, signup, dashboard"
2. ✅ "More joyful icons and buttons"
3. ✅ "Add header and footer to homepage"
4. ✅ "Make it more friendly, stylish, classy, and modern"
5. ✅ "Make hero section better"
6. ✅ "More joyful UI style design"

---

## Known Issues
- Screenshot tool (internal testing) is unreliable - use curl/logs instead
- AI endpoints never tested - do this first
- Extension has UI but no core functionality yet

---

## Environment Variables

**Backend `.env`:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=snaprecord_db
EMERGENT_LLM_KEY=sk-emergent-dB836Cf8b175eC6Fc4Fc4
```

**Frontend `.env`:**
```
REACT_APP_BACKEND_URL=https://[preview-url]
```

---

## Key Files to Know

**Backend:**
- `/app/backend/server.py` - All API logic (849 lines, needs refactoring)
- `/app/backend/.env` - Environment variables

**Frontend:**
- `/app/frontend/src/pages/LandingPage.js` - Homepage (813 lines)
- `/app/frontend/src/pages/Dashboard.js` - Main workspace (797 lines)
- `/app/frontend/src/pages/LoginPage.js` - Login UI
- `/app/frontend/src/pages/SignupPage.js` - Signup UI

**Extension:**
- `/app/chrome-extension/manifest.json` - Extension config
- `/app/chrome-extension/js/popup.js` - Main popup logic
- `/app/chrome-extension/js/sidebar.js` - AI assistant
- `/app/chrome-extension/js/background.js` - Service worker

---

## Commands

**Restart services:**
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

**Test API:**
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X POST "$API_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

**Check logs:**
```bash
tail -n 100 /var/log/supervisor/backend.*.log
tail -n 100 /var/log/supervisor/frontend.*.log
```

**Install Python package:**
```bash
cd /app/backend
pip install [package]
pip freeze > requirements.txt
```

**Install Node package:**
```bash
cd /app/frontend
yarn add [package]
```

---

## Success Criteria

The project will be "complete" when:
1. ✅ Chrome extension can actually record screen and take screenshots
2. ✅ Recordings/screenshots upload to backend successfully
3. ✅ Video editor can trim and add text
4. ✅ AI assistant works in extension sidebar
5. ✅ Users can organize media into folders
6. ✅ Share links work
7. ✅ UI is joyful, modern, and friendly
8. ✅ All core features tested and working

---

## User Profile
- **Name**: User wants this for production use
- **Platform**: Chromebook (limited credits)
- **Priority**: Wants working features, not fake demos
- **Style**: Prefers joyful, modern, friendly UI (2026 style)

---

## What to Ask User
Before implementing:
1. Should I prioritize making extension functional first, or UI improvements?
2. Do you want AI to use your own API keys or Emergent key?
3. Any specific features you want implemented first?

---

## Final Notes
- Test everything before marking complete
- Use testing agent for comprehensive validation
- Never hardcode credentials
- Follow existing code style
- Keep user updated on progress
- Be efficient (user has limited credits)

---

**Start by**: Testing AI endpoints, fixing any backend issues, then implementing screen recording in the extension.
