import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { type Headset, type MultiplayerConfig, ping, sendCommand } from "@/lib/openbrush";

type Tab = "wizard" | "manager" | "wiki";

type AppState = {
  tab: Tab;
  setTab: (t: Tab) => void;
  wizardCompleted: boolean;
  setWizardCompleted: (b: boolean) => void;
  headsets: Headset[];
  addHeadset: (name: string, ip: string) => void;
  removeHeadset: (id: string) => void;
  updateHeadset: (id: string, patch: Partial<Headset>) => void;
  selectedIds: string[];
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
  /** send command to selected headsets, with toast feedback */
  sendToSelected: (command: string, value?: string | number | boolean, label?: string) => Promise<void>;
  sendToHeadsets: (ids: string[], buildCmd: (h: Headset) => string, label?: string) => Promise<void>;
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

  const addHeadset = useCallback((name: string, ip: string) => {
    setHeadsets((prev) => {
      if (prev.some((h) => h.ip === ip)) return prev;
      const h: Headset = { id: crypto.randomUUID(), name: name || ip, ip, online: null };
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
  const selectAll = useCallback(() => setSelectedIds(headsets.map((h) => h.id)), [headsets]);
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
      const results = await Promise.all(headsets.map((h) => ping(h.ip)));
      if (cancelled) return;
      setHeadsets((prev) =>
        prev.map((h, i) => {
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
    async (ids: string[], buildCmd: (h: Headset) => string, label?: string) => {
      const targets = headsets.filter((h) => ids.includes(h.id));
      if (targets.length === 0) {
        toast.error(t("manager.preview.none"));
        return;
      }
      await Promise.all(
        targets.map(async (h) => {
          const cmd = buildCmd(h);
          const ok = await sendCommand(h.ip, cmd);
          if (ok) toast.success(`${label ? label + " — " : ""}${t("toast.sent", { name: h.name })}`);
          else toast.error(t("toast.failed", { name: h.name }));
        }),
      );
    },
    [headsets, t],
  );

  const sendToSelected = useCallback(
    async (command: string, value?: string | number | boolean, label?: string) => {
      await sendToHeadsets(
        selectedIds,
        () => (value === undefined ? command : `${command}=${encodeURIComponent(String(value))}`),
        label,
      );
    },
    [selectedIds, sendToHeadsets],
  );

  const value = useMemo<AppState>(
    () => ({
      tab, setTab, wizardCompleted, setWizardCompleted,
      headsets, addHeadset, removeHeadset, updateHeadset,
      selectedIds, toggleSelected, selectAll, deselectAll,
      mp, setMp, inRoom, setInRoom,
      recentColors, pushRecentColor, favorites, addFavorite, removeFavorite,
      sendToSelected, sendToHeadsets,
    }),
    [tab, wizardCompleted, headsets, selectedIds, mp, inRoom, recentColors, favorites, addHeadset, removeHeadset, updateHeadset, toggleSelected, selectAll, deselectAll, pushRecentColor, addFavorite, removeFavorite, sendToSelected, sendToHeadsets],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}
