# OB Remote — Open Brush Remote Controller

A mobile-first web app to remotely control one or more **Meta Quest** headsets running [Open Brush](https://openbrush.app) via its local HTTP API.  
Built for artists, educators, and facilitators who need to manage VR painting sessions from a phone or tablet — no server, no backend, no installation.

---

## ✨ Features

### 🧙 Setup Wizard
Step-by-step onboarding for first-time users:
- Language selection (8 languages)
- Config guide for enabling the Open Brush remote API on Quest
- Headset discovery: **auto-scan** your local network every 5 seconds across multiple subnets and ports
- Connection test per headset
- Optional multiplayer room setup

### 🎛️ Session Manager
Full control panel for one or more headsets simultaneously:
- **Device bar** — add multiple Quest headsets, ping status every 10s, single or multi-select
- **Live preview** — fetches `/cameraview` from selected headsets every 5s
- **Brush selector** — 30+ Open Brush brushes, tap to apply
- **Color picker** — hex input + visual picker + recent colors
- **Scene control** — save, new scene, load file, load tutorial
- **Environment** — 10 environments (Tundra, Space, Jungle, and more)
- **Multiplayer panel** — join/leave rooms, set nickname, beginner mode, private/view-only room
- **Timelapse & Timer** — per-headset timer, captures frames every 30s from `/cameraview`, exports ZIP (PNG frames) and MP4 video

### 📖 Wiki & FAQ
- How the API works with code examples
- Per-feature usage guides
- Troubleshooting (7 common issues)
- Links to official docs, Discord, GitHub
- Credits

### 🌐 Internationalization
Full UI in 8 languages: 🇮🇹 Italian · 🇬🇧 English · 🇫🇷 French · 🇩🇪 German · 🇪🇸 Spanish · 🇯🇵 Japanese · 🇰🇷 Korean · 🇨🇳 Simplified Chinese

---

## 🛠️ How It Works

Open Brush runs a built-in HTTP server on port `40074`. OB Remote sends commands as simple GET requests to that server over your local WiFi network.

```
iPad / iPhone (Safari, file://)
        │
        └─ WiFi (same network)
                │
                ├─ http://192.168.1.42:40074/api/v1?brush.type=Ink   → Quest 1
                └─ http://192.168.1.55:40074/api/v1?brush.type=Ink   → Quest 2
```

No cloud. No login. No external services.

---

## ⚙️ Prerequisites

### 1. Enable the Open Brush Remote API on your Quest

The config file needs to be edited once via [SideQuest](https://sidequestvr.com) or `adb`:

**File location on Quest:**
```
/sdcard/Open Brush/Open Brush.cfg
```

**Add or merge this into the file:**
```json
{
  "Flags": {
    "EnableApiRemoteCalls": true,
    "EnableApiCorsHeaders": true
  }
}
```

Restart Open Brush after saving.

📖 Official guide: [docs.openbrush.app/user-guide/open-brush-api](https://docs.openbrush.app/user-guide/open-brush-api)

### 2. Same WiFi network

Both the Quest and the device running OB Remote must be on the **same local WiFi network**.

### 3. Open the app in Safari as a local file

Because the Quest API runs on HTTP (not HTTPS), the app must be opened via `file://` in Safari — **not** served from an HTTPS host (Vercel, Netlify, etc.) which would trigger mixed content blocking.

---

## 🚀 Getting Started

1. Download or clone this repository
2. Transfer `ob-remote.html` (or the built app) to your iPhone or iPad (AirDrop, Files app, Google Drive)
3. Open the file in **Safari**
4. Complete the Wizard:
   - Choose your language
   - Confirm the Quest config is set up
   - Add your headset IP(s) or let the auto-scan find them
   - Test the connection
5. Switch to **Session Manager** and start controlling

---

## 📡 API Reference

All commands follow this format:

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

Full command list (when Quest is connected): `http://[QUEST-IP]:40074/help/commands`

📋 [API Command Reference](https://docs.openbrush.app/user-guide/open-brush-api/api-commands)

---

## 🎬 Timelapse

OB Remote captures a frame from `/cameraview` every **30 seconds** while the timer is running.

At the end of the session (or manually):
- **ZIP download** — all PNG frames named `[headset]_[timestamp].png`
- **MP4 export** — encoded at **6 fps** (default) or **12 fps** (unlocked for sessions > 60 frames, equivalent to ~30 minutes)

> Note: preview quality depends on the Quest's internal window resolution. Ideal for session documentation, not production output.

---

## 🌐 Network Scanner

OB Remote automatically scans your local network for headsets when you open the Wizard's headset step.

**Ports scanned:** `40074, 40075, 40076, 40080, 40000, 7777`

**Subnets scanned:** `192.168.0.x · 192.168.1.x · 192.168.2.x · 10.0.0.x · 10.0.1.x · 172.16.0.x`

Scan runs every 5 seconds while the step is open. Devices found automatically are highlighted in green. You can also add headsets manually by name + IP.

> Safari may restrict network scanning in some configurations. If auto-scan returns nothing, add the Quest IP manually (found under Quest Settings → WiFi → tap the network → IP address).

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Headset unreachable | Check same WiFi, Open Brush running, config file edited |
| CORS error | `EnableApiCorsHeaders` must be `true` in config |
| Safari blocks requests | Open as `file://`, not from HTTPS host |
| Preview missing or slow | Normal — depends on Quest window. 5s refresh is intentional |
| Scan finds nothing | Add IP manually from Quest WiFi settings |
| Brush/env command fails | Verify exact names at `http://[IP]:40074/help/commands` |
| Multiplayer join fails | All headsets must be on same Photon region. Room name and key must match exactly |

💬 Need help? Join the [Open Brush Discord](https://discord.openbrush.app)

---

## 🧱 Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React + Tailwind CSS |
| Fonts | Space Mono + IBM Plex Sans |
| ZIP export | JSZip (CDN) |
| MP4 export | ffmpeg.wasm (CDN) |
| i18n | i18next |
| Backend | None |
| Storage | None (all state in memory) |

---

## 📁 Project Structure

```
ob-remote/
├── ob-remote.jsx       # Full single-file React app (source)
├── ob-remote.html      # Built standalone HTML (for local use on device)
├── README.md
└── PATCH-v1.1.md       # Changelog and patch notes
```

---

## ⚠️ Limitations

- **No HTTPS support** — the Quest API runs on HTTP only; the app must be opened locally
- **No file upload** — sketch files must already be on the Quest
- **Camera snapshot** — the API provides live preview only; triggering a photo from the app is not supported by the current Open Brush API
- **Preview resolution** — `/cameraview` quality varies and depends on the Quest's window size; not suitable for high-quality output
- **Safari scan** — browser security may limit LAN scanning; manual IP entry is always available as fallback

---

## 👤 Credits

**Created by**  
[Matteo Sgherri](https://www.matteosgherri.com)  
[@thepixelschips](https://instagram.com/thepixelschips) on Instagram & TikTok

**In collaboration with**  
[Holonexia APS](https://www.holonexia.it)  
[@holonexia](https://instagram.com/holonexia) on Instagram · [LinkedIn](https://linkedin.com/company/holonexia)

**Powered by**  
[Open Brush](https://openbrush.app) — the open-source VR painting app  
[docs.openbrush.app](https://docs.openbrush.app) · [Discord](https://discord.openbrush.app) · [GitHub](https://github.com/icosa-foundation/open-brush)

---

## 📄 License

MIT — free to use, modify, and distribute with attribution.

---

*OB Remote is an independent project and is not affiliated with or endorsed by the Icosa Foundation or the Open Brush team.*
