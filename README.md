# OB Remote — Open Brush Remote Controller

> A mobile-first web app to remotely control one or more **Meta Quest** headsets
> running [Open Brush](https://openbrush.app) via its local HTTP API.
> Built for artists, educators, and facilitators — no server, no backend, no installation.

![License](https://img.shields.io/badge/license-MIT-purple)
![React](https://img.shields.io/badge/built%20with-React-61dafb)
![Platform](https://img.shields.io/badge/platform-Safari%20%2F%20iOS-lightgrey)

---

> 📱 *Screenshots and demo coming soon*

---

## ✨ Features

### 🧙 Setup Wizard
- 8-language selector
- Step-by-step Quest config guide (file path, JSON snippet, checklist)
- Auto network scan every 5s across 6 subnets and 6 ports
- Per-headset connection test
- Optional multiplayer room setup

### 🎛️ Session Manager
- Multi-headset device bar (ping every 10s, select one or all)
- Live camera preview from `/cameraview` (refresh every 5s)
- 30+ brush selector
- Color picker with hex input and recent colors
- Scene control: save, new, load file, load tutorial
- 10 environments
- Multiplayer panel: join/leave, nickname, beginner mode, private/view-only
- Per-headset timer with timelapse capture (frame every 30s)
- Export: ZIP (PNG frames) + MP4 video (6 fps default, 12 fps for long sessions)

### 📖 Wiki & FAQ
- API usage guide with code examples
- Per-feature usage reference
- Troubleshooting (7 common issues with solutions)
- Links to official Open Brush docs, Discord, GitHub
- Credits section

### 🌐 8 Languages
🇮🇹 Italian · 🇬🇧 English · 🇫🇷 French · 🇩🇪 German · 🇪🇸 Spanish · 🇯🇵 Japanese · 🇰🇷 Korean · 🇨🇳 Simplified Chinese

---

## 🔌 How It Works

Open Brush runs a built-in HTTP server on port `40074`. OB Remote sends commands as plain GET requests over your local WiFi.

```
iPad / iPhone (Safari, opened as file://)
        │
        └── WiFi (same local network)
                │
                ├── http://192.168.1.42:40074/api/v1?brush.type=Ink  →  Quest 1
                └── http://192.168.1.55:40074/api/v1?brush.type=Ink  →  Quest 2
```

No cloud. No login. No external services.

---

## ⚙️ Prerequisites

**1. Enable the Open Brush Remote API on Quest**

File location on Quest:

```
/sdcard/Open Brush/Open Brush.cfg
```

Add or merge this JSON:

```json
{
  "Flags": {
    "EnableApiRemoteCalls": true,
    "EnableApiCorsHeaders": true
  }
}
```

Edit via [SideQuest](https://sidequestvr.com) or `adb`. Restart Open Brush after saving.
📖 Official guide: https://docs.openbrush.app/user-guide/open-brush-api

**2. Same WiFi network**

Quest and device must be on the same local WiFi.

**3. Open as local file in Safari**

Must be opened via `file://` in Safari.
Do NOT serve from HTTPS hosts (Vercel, Netlify, etc.) — mixed content policy blocks HTTP calls.

---

## ⬇️ Download & Install

1. Go to the [Releases page](../../releases) and download the latest `ob-remote-vX.X.X.zip`
2. Unzip — you get a single file: `index.html`
3. Transfer `index.html` to your iPhone or iPad
   - AirDrop is the fastest option
   - Alternatively: Files app, Google Drive, or USB
4. Open the file in **Safari**
5. Complete the Wizard and start controlling your headsets

> ⚠️ Do NOT open from Chrome or from a web server.
> Safari + `file://` is required for the Quest API to work correctly.

---

## 🚀 Getting Started (for developers)

```bash
# Clone the repo
git clone https://github.com/[USERNAME]/ob-remote.git
cd ob-remote

# Install dependencies
bun install

# Development server
bun run dev

# Build standalone HTML (single file)
bun run build
# Output: dist/index.html — transfer this file to your device
```

> The build uses `vite-plugin-singlefile` to inline all JS and CSS into a single
> `index.html`. No external assets or CDN calls at runtime.

---

## 📡 API Reference

```
GET http://[QUEST-IP]:40074/api/v1?command=value
```

| Action | Command |
|--------|---------|
| Change brush | `brush.type=Ink` |
| Change color | `brush.color=%23ff0000` |
| Save sketch | `sketch.save=mysession` |
| New sketch | `sketch.new` |
| Load sketch | `sketch.load=myfile` |
| Set environment | `environment.set=Space` |
| Beginner mode | `sketch.beginner=true` |
| Multiplayer join | `multiplayer.join=nick,room,false,10,false,false` |
| Live preview | `GET /cameraview` → PNG image |

Full command list (live, when Quest is connected):

```
http://[QUEST-IP]:40074/help/commands
```

Links:
- [API Docs](https://docs.openbrush.app/user-guide/open-brush-api)
- [Command Reference](https://docs.openbrush.app/user-guide/open-brush-api/api-commands)
- [Camera Preview API](https://docs.openbrush.app/user-guide/open-brush-api/retrieving-a-preview-image)

---

## 🎬 Timelapse

- Frame captured every 30s from `/cameraview` while timer is running
- Timer assignable per headset or to all headsets
- At session end (or manually): ZIP download + MP4 export
- FPS: 6 fps default, 12 fps unlocked when > 60 frames captured (~30 min session)
- PNG files named: `[headset-name]_[timestamp].png`

> Preview quality depends on the Quest's internal window resolution.
> Suitable for session documentation, not production output.

---

## 🌐 Network Scanner

Auto-scan runs in Wizard Step 3.

Ports scanned:

```
40074, 40075, 40076, 40080, 40000, 7777
```

Subnets scanned:

```
192.168.0.x · 192.168.1.x · 192.168.2.x
10.0.0.x · 10.0.1.x · 172.16.0.x
```

- Runs every 5s while Step 3 is open
- Devices found automatically are highlighted in green
- Manual IP entry always available as fallback
- To find Quest IP: Quest Settings → WiFi → tap network → IP address

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Headset unreachable | Check same WiFi, Open Brush running, config file edited correctly |
| CORS error | `EnableApiCorsHeaders` must be `true` in config. Edit file and restart Open Brush |
| Safari blocks requests | Open as `file://` locally. Do not use HTTPS-hosted version |
| Preview missing or slow | Normal — depends on Quest window size. 5s refresh is intentional |
| Auto-scan finds nothing | Add IP manually. Find it: Quest Settings → WiFi → tap network → IP address |
| Brush / environment command fails | Check exact names at `http://[IP]:40074/help/commands` |
| Multiplayer join fails | All headsets must be on the same Photon region. Room name and key must match exactly |

> 💬 Need help? Join the [Open Brush Discord](https://discord.openbrush.app)

---

## 🧱 Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build tool | Vite + vite-plugin-singlefile |
| Runtime | Bun |
| Styling | Tailwind CSS |
| Fonts | Space Mono + IBM Plex Sans |
| ZIP export | JSZip (CDN) |
| MP4 export | ffmpeg.wasm (CDN) |
| i18n | i18next |
| CI/CD | GitHub Actions |
| Backend | None |
| Storage | None (all state in React memory) |

---

## 📁 Project Structure

```
ob-remote/
├── .github/
│   └── workflows/
│       └── release.yml           # Build + ZIP + GitHub Release on tag push
├── src/
│   ├── main.tsx                  # Entry point + root shell, tab routing
│   ├── components/
│   │   ├── Wizard.tsx            # Multi-step onboarding wizard
│   │   ├── Manager.tsx           # Session manager with all panels
│   │   ├── Wiki.tsx              # Accordion docs, troubleshooting, credits
│   │   ├── TopBar.tsx            # Tab bar + language switch
│   │   ├── manager/
│   │   │   ├── DevicesAndPreview.tsx
│   │   │   ├── ControlPanels.tsx
│   │   │   └── TimelapsePanel.tsx
│   │   └── ui/
│   │       └── FBtn.tsx          # Button with ripple + local toast feedback
│   ├── lib/
│   │   ├── openbrush.ts          # Quest HTTP API client
│   │   ├── useNetworkScanner.ts  # Auto-scan hook
│   │   └── ffmpegLoader.ts       # ffmpeg.wasm loader
│   ├── state/
│   │   └── AppContext.tsx        # Global app state (React memory only)
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales.ts            # All 8 language strings
│   └── styles.css
├── index.html
├── README.md
├── vite.config.ts                # vite-plugin-singlefile config
├── package.json
└── tsconfig.json
```

---

## ⚠️ Limitations

- **No HTTPS support** — Quest API is HTTP only; app must be opened as local file
- **No file upload** — sketch files must already exist on the Quest
- **Camera snapshot** — `/cameraview` provides live preview only; triggering a photo via API is not supported by Open Brush
- **Preview resolution** — quality varies by Quest window size; not suitable for high-quality output
- **Safari scan restriction** — browser security may limit LAN scanning; manual IP entry is always available

---

## 🤝 Contributing

Pull requests are welcome.
For major changes, please open an issue first to discuss what you would like to change.

If you find a bug or have a feature request, open an issue or reach out on
[Open Brush Discord](https://discord.openbrush.app).

---

## 👤 Credits

**Created by**
Matteo Sgherri — [matteosgherri.com](https://www.matteosgherri.com)
Instagram & TikTok: [@thepixelschips](https://instagram.com/thepixelschips)

**In collaboration with**
Holonexia APS — [holonexia.it](https://www.holonexia.it)
Instagram: [@holonexia](https://instagram.com/holonexia)
LinkedIn: [Holonexia](https://linkedin.com/company/holonexia)

**Powered by**
[Open Brush](https://openbrush.app) — open-source VR painting app by Icosa Foundation
[docs.openbrush.app](https://docs.openbrush.app) ·
[Discord](https://discord.openbrush.app) ·
[GitHub](https://github.com/icosa-foundation/open-brush)

---

## 📄 License

MIT — free to use, modify, and distribute with attribution.

---

*OB Remote is an independent project and is not affiliated with or endorsed
by the Icosa Foundation or the Open Brush team.*
