# Screen Master - Chrome Extension

A professional screen recording and screenshot capture tool with annotation features, cloud storage, and sharing capabilities.

## Features

### Screenshot Capture
- **Visible Area** - Capture what's currently visible (Alt+Shift+V)
- **Full Page** - Capture entire scrolling page (Alt+Shift+F)
- **Select Region** - Draw to select capture area (Alt+Shift+R)
- **Desktop/Window** - Capture entire screen or specific windows
- **Delayed Capture** - 3, 5, or 10 second delay

### Screen Recording
- **Record Tab** - Record current browser tab (Alt+Shift+S)
- **Record Screen** - Record desktop, window, or tab
- **Quality Options** - 720p, 1080p, or 4K
- **System Audio** - Include system audio in recordings
- **Microphone** - Add microphone narration
- **Webcam Overlay** - Picture-in-picture webcam feed
- **Countdown Timer** - 3 second countdown before recording

### Annotation Tools
- **Pen Tool** - Freehand drawing
- **Highlighter** - Semi-transparent highlighting
- **Shapes** - Rectangle, circle, line
- **Arrows** - Point at elements
- **Text** - Add text annotations
- **Blur** - Blur sensitive information
- **Undo/Redo** - Full history support

### Save & Share
- **Download** - Save as PNG, JPG, or PDF
- **Copy to Clipboard** - Instant clipboard copy
- **Cloud Storage** - Auto-upload to your account
- **Share Links** - Generate instant share links
- **Platform Sharing** - Share to Slack, Jira, Trello, Asana, GitHub

## Installation

### From Chrome Web Store (Coming Soon)
Search for "Screen Master" in the Chrome Web Store.

### Developer Mode
1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. Pin the extension to your toolbar

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Capture Visible Area | `Alt+Shift+V` |
| Capture Full Page | `Alt+Shift+F` |
| Select Region | `Alt+Shift+R` |
| Start/Stop Recording | `Alt+Shift+S` |

Customize shortcuts at `chrome://extensions/shortcuts`

## Cloud Features

Sign in with Google to unlock:
- Unlimited cloud storage
- Access captures from any device
- Generate shareable links
- AI-powered smart tagging
- Auto-generated titles

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── pages/
│   └── popup.html         # Main popup UI
├── js/
│   ├── background.js      # Service worker
│   ├── content.js         # Content script
│   └── popup.js           # Popup logic
├── css/
│   ├── popup.css          # Popup styles
│   └── content.css        # Content styles
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

- `activeTab` - Access current tab for screenshots
- `tabs` - Query and interact with tabs
- `storage` - Save user preferences
- `downloads` - Download captured files
- `clipboardWrite` - Copy to clipboard
- `desktopCapture` - Record screen/window
- `tabCapture` - Record browser tabs
- `alarms` - Delayed capture functionality

## Browser Compatibility

- Chrome 88+
- Microsoft Edge 88+
- Brave Browser
- Opera
- Other Chromium-based browsers

## Privacy

- Screenshots and recordings are processed locally
- Cloud storage is optional and requires sign-in
- No data is collected without your consent
- You control sharing permissions

## Troubleshooting

### Screenshots are blank
- Refresh the page and try again
- Don't capture Chrome system pages (chrome://)

### Recording won't start
- Grant permission when prompted
- Check if another tab is recording
- Ensure microphone permissions if using audio

### Cloud upload fails
- Sign in to your account
- Check internet connection
- Try refreshing the extension

## License

MIT License - Feel free to modify and distribute.

---

Built with ❤️ by Screen Master Team
