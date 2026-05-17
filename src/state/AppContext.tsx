import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DEMO_HEADSETS, type Headset, type MultiplayerConfig, ping, sendCommand } from "@/lib/openbrush";

type Tab = "wizard" | "manager" | "wiki";

type AppState = {
  tab: Tab;
  setTab: (t: Tab) => void;
  wizardCompleted: boolean;
  setWizardCompleted: (b: boolean) => void;
  headsets: Headset[];
  /** Demo headsets shown when none configured. */
  effectiveHeadsets: Headset[];
  isDemo: boolean;
  addHeadset: (name: string, ip: string, port?: number) => void;
  removeHeadset: (id: string) => void;
  updateHeadset: (id: string, patch: Partial<Headset>) => void;
  selectedIds: string[];
  effectiveSelectedIds: string[];
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  mp: MultiplayerConfig;
  setMp: (m: MultiplayerConfig) => void;
  inRoom: boolean;
  setInRoom: (b: boolean) => void;
  recentColors: string[];
  pushRecentColor: (hex: string) => void;
  favorites: string[];
  addFavorite: (name: string) => void;
  removeFavorite: (name: string) => void;
  /** send command to selected headsets, with toast feedback (suppressed when silent). */
  sendToSelected: (command: string, value?: string | number | boolean, label?: string, opts?: { silent?: boolean }) => Promise<{ ok: number; fail: number }>;
  sendToHeadsets: (ids: string[], buildCmd: (h: Headset) => string, label?: string, opts?: { silent?: boolean }) => Promise<{ ok: number; fail: number }>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("wizard");
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const [headsets, setHeadsets] = useState<Headset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mp, setMp] = useState<MultiplayerConfig>({
    nickname: "",
    roomName: "",
    roomKey: "",
    isPrivate: false,
    maxPlayers: 10,
    beginner: false,
    viewOnly: false,
    perHeadsetNick: false,
    perHeadsetNicks: {},
  });
  const [inRoom, setInRoom] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const isDemo = headsets.length === 0;
  const effectiveHeadsets = isDemo ? DEMO_HEADSETS : headsets;
  const effectiveSelectedIds = isDemo
    ? (selectedIds.length ? selectedIds.filter((id) => DEMO_HEADSETS.some((d) => d.id === id)) : DEMO_HEADSETS.map((d) => d.id))
    : selectedIds;

  const addHeadset = useCallback((name: string, ip: string, port?: number) => {
    setHeadsets((prev) => {
      if (prev.some((h) => h.ip === ip && (h.port ?? 40074) === (port ?? 40074))) return prev;
      const h: Headset = { id: crypto.randomUUID(), name: name || ip, ip, port, online: null };
      return [...prev, h];
    });
  }, []);
  const removeHeadset = useCallback((id: string) => {
    setHeadsets((prev) => prev.filter((h) => h.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);
  const updateHeadset = useCallback((id: string, patch: Partial<Headset>) => {
    setHeadsets((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, []);
  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const selectAll = useCallback(() => setSelectedIds(effectiveHeadsets.map((h) => h.id)), [effectiveHeadsets]);
  const deselectAll = useCallback(() => setSelectedIds([]), []);

  const pushRecentColor = useCallback((hex: string) => {
    setRecentColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 6));
  }, []);
  const addFavorite = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setFavorites((prev) => (prev.includes(n) ? prev : [...prev, n]));
  }, []);
  const removeFavorite = useCallback((name: string) => {
    setFavorites((prev) => prev.filter((f) => f !== name));
  }, []);

  // Auto-ping selected headsets every 10s while in manager tab
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    if (headsets.length === 0) return;
    let cancelled = false;
    const run = async () => {
      const results = await Promise.all(headsets.map((h) => ping(h.ip, 3000, h.port)));
      if (cancelled) return;
      setHeadsets((prev) =>
        prev.map((h) => {
          const idx = headsets.findIndex((x) => x.id === h.id);
          if (idx === -1) return h;
          return { ...h, online: results[idx] ?? h.online };
        }),
      );
    };
    run();
    const id = setInterval(run, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [headsets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendToHeadsets = useCallback(
    async (ids: string[], buildCmd: (h: Headset) => string, label?: string, opts?: { silent?: boolean }) => {
      const pool = isDemo ? DEMO_HEADSETS : headsets;
      const targets = pool.filter((h) => ids.includes(h.id));
      if (targets.length === 0) {
        if (!opts?.silent) toast.error(t("manager.preview.none"));
        return { ok: 0, fail: 0 };
      }
      const results = await Promise.all(
        targets.map(async (h) => {
          if (h.demo) {
            await new Promise((r) => setTimeout(r, 180 + Math.random() * 120));
            return true;
          }
          const cmd = buildCmd(h);
          const ok = await sendCommand(h.ip, cmd, undefined, 4000, h.port);
          if (!opts?.silent) {
            if (ok) toast.success(`${label ? label + " — " : ""}${t("toast.sent", { name: h.name })}`);
            else toast.error(t("toast.failed", { name: h.name }));
          }
          return ok;
        }),
      );
      return { ok: results.filter(Boolean).length, fail: results.filter((r) => !r).length };
    },
    [headsets, isDemo, t],
  );

  const sendToSelected = useCallback(
    async (command: string, value?: string | number | boolean, label?: string, opts?: { silent?: boolean }) => {
      return await sendToHeadsets(
        effectiveSelectedIds,
        () => (value === undefined ? command : `${command}=${encodeURIComponent(String(value))}`),
        label,
        opts,
      );
    },
    [effectiveSelectedIds, sendToHeadsets],
  );

  const value = useMemo<AppState>(
    () => ({
      tab, setTab, wizardCompleted, setWizardCompleted,
      headsets, effectiveHeadsets, isDemo, addHeadset, removeHeadset, updateHeadset,
      selectedIds, effectiveSelectedIds, toggleSelected, selectAll, deselectAll,
      mp, setMp, inRoom, setInRoom,
      recentColors, pushRecentColor, favorites, addFavorite, removeFavorite,
      sendToSelected, sendToHeadsets,
    }),
    [tab, wizardCompleted, headsets, effectiveHeadsets, isDemo, selectedIds, effectiveSelectedIds, mp, inRoom, recentColors, favorites, addHeadset, removeHeadset, updateHeadset, toggleSelected, selectAll, deselectAll, pushRecentColor, addFavorite, removeFavorite, sendToSelected, sendToHeadsets],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}
