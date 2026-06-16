## Incremental migration to OB Remote v2.0

Goal: bring the existing app toward the v2.0 spec without throwing away Wizard, Wiki, i18n, timelapse, multiplayer, GitHub workflows, or the `file://` build. We work in phases, each shippable on its own.

---

### Phase 1 — Visual identity & tokens
- Update `src/styles.css` to the v2.0 dark palette (`#0b0b16` bg, `#12122a` card, `#7c6af7` accent, success/warn/err tokens, 14px/9px radii).
- Keep tokens semantic (HSL vars in `:root`), no hardcoded colors in components.
- Refresh `TopBar` with status pill (Disconnected / Scanning / N visori) and `🥽 N` badge.
- Add HTTPS red banner at top of `<main>` when `location.protocol === 'https:'`.
- iOS polish: `viewport-fit=cover`, 16px inputs, `touch-action: manipulation`, safe-area padding, `overscroll-behavior:none`.

### Phase 2 — Manager rebuild as 4-tab controller
Replace `Manager.tsx` content (keep the file) with a tabbed controller:

```text
[ConnectionCard]
[ControlTabs]  🎨 Colore | 🖌️ Pennelli | ⚡ Azioni | 🌍 Ambienti
[BottomNav]    (phone <640px only)
```

New components under `src/components/manager/`:
- `ConnectionCard.tsx` — scan button + progress + device list + manual IP. Collapses to mini-bar on phone when connected.
- `ControlTabs.tsx` — tab router; hidden on phone (bottom nav drives it).
- `ColorPanel.tsx` — swatch 76px, hex input, RGB sliders with live gradients, 5 palettes (Caldi/Freddi/Neutri/Pastello/Neon), right column with brush-size slider + dot preview.
- `BrushPanel.tsx` — 18-brush grid (3/4/6 cols responsive) replacing current BRUSHES list.
- `ActionsPanel.tsx` — 8 action cards (undo/redo/save/new/screenshot/mirror/spectator/api-list).
- `EnvPanel.tsx` — 10 environment cards with v2.9 names.
- `BottomNav.tsx` — fixed 4-button nav for <640px, respects safe-area.

Old `ControlPanels.tsx`, `DevicesAndPreview.tsx` removed once new panels work. `TimelapsePanel` and `MultiplayerPanel` kept but moved into a 5th "Avanzate" tab so we don't lose features.

### Phase 3 — Scanner & fingerprint (3 levels)
Rewrite `src/lib/useNetworkScanner.ts`:
- Subnets per spec (9 ranges), port 40074 only, concurrency 25.
- Per IP: L1 no-cors ping (900ms) → L2 cors `?version` parse `openBrushVersion` (2200ms) → L3 distinguish CORS TypeError vs AbortError.
- Returns `{ ip, verified: boolean, version?: string }`. Progress 0–100 + abort handle.
- Distinguish `✅ verified` vs `⚠️ unverified` badge in ConnectionCard.

### Phase 4 — sendCmd broadcast & toast semantics
- Extend `src/lib/openbrush.ts` with `sendCmdBroadcast(ips, params)` using `Promise.all`, `AbortSignal.timeout(4000)`, treats non-Abort TypeError as "probably delivered" → orange toast "abilita EnableApiCorsHeaders".
- Wire it through `AppContext.sendToSelected` (keep existing API surface so Wizard/Wiki/Timelapse still work).
- Haptics: `navigator.vibrate` 40/12/[50,50,50] on ok/tap/err (no-op on iOS).
- Screenshot action: try `GET /api/v1/screenshot` blob >200B → download PNG, else fallback to `?screenshot` command.

### Phase 5 — Wizard & Wiki content alignment
- Wizard: keep 3-tab shell, rewrite the 5 steps to match v2.0 copy (Benvenuto, EnableApi cfg, Same Wi-Fi, file:// problem, Pronto). All strings via `t()`.
- Wiki: restructure into 3 sub-tabs (FAQ accordion 7 items / Setup / API). Keep existing "Download & Install" as first FAQ entry.
- Add Credits modal triggered from header `ℹ️`. `?` header button reopens Wizard.

### Phase 6 — i18n
- Add all new v2.0 keys to `src/i18n/locales.ts` for IT (authoritative) and EN.
- For the other 6 languages already in the project, fall back to EN for the new keys initially (i18next handles this with `fallbackLng`); no manual translation in this phase to keep the migration tight. Flag as TODO.

### Phase 7 — Cleanup & verify
- Remove dead files only after new panels render.
- Verify build (`vite build` via harness), check `dist/index.html` is single-file.
- Manual check in preview at 411px (phone), 820px (tablet), 1280px (desktop).
- Confirm no localStorage / sessionStorage usage anywhere.

---

### Technical notes
- State stays in `AppContext`; we add `verifiedMap: Map<ip, {verified, version}>` and `scanProgress` rather than replacing the store.
- No new dependencies — Tailwind + shadcn primitives are enough.
- Existing `FBtn` ripple/press is reused for all new cards/buttons.
- GitHub workflows (`release.yml`, `fix-lockfile.yml`) and `bunfig.toml` untouched.
- `README.md` untouched.

### Suggested PR order
1. Phase 1 (visual + HTTPS banner) — small, safe.
2. Phase 3 (scanner) — isolated logic.
3. Phase 2 (4-tab UI) — biggest diff; depends on 1 & 3.
4. Phase 4 (sendCmd + haptics + screenshot).
5. Phase 5 + 6 (Wizard/Wiki/i18n).
6. Phase 7 (cleanup).

### Out of scope for this migration
- Translating new strings into FR/DE/ES/PT/JA/ZH (English fallback for now).
- Removing Timelapse / Multiplayer (moved to "Avanzate" tab instead).
- Touching `README.md`, GitHub workflows, or build pipeline.

Approve and I'll start with Phase 1.