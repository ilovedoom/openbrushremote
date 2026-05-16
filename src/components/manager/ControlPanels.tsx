import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useApp } from "@/state/AppContext";
import { BRUSHES, ENVIRONMENTS, buildMultiplayerJoin, sendCommand } from "@/lib/openbrush";

export function BrushPanel() {
  const { t } = useTranslation();
  const { sendToSelected } = useApp();
  const [q, setQ] = useState("");
  const list = BRUSHES.filter((b) => b.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="glass-card p-4">
      <h3 className="mb-3 font-display text-base">{t("manager.brush.title")}</h3>
      <input className="input-base mb-3" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {list.map((b) => (
          <button
            key={b}
            onClick={async () => { await sendToSelected("brush.type", b, t("toast.brushChanged") + " (" + b + ")"); }}
            className="btn-base btn-secondary"
            style={{ minHeight: 44, padding: "0 0.75rem", fontSize: "0.8rem" }}
          >
            {b}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ColorPanel() {
  const { t } = useTranslation();
  const { recentColors, pushRecentColor, sendToSelected } = useApp();
  const [hex, setHex] = useState("#7c3aed");

  const apply = async (h: string) => {
    setHex(h);
    pushRecentColor(h);
    // Send raw hex starting with #; sendToSelected URL-encodes the value.
    await sendToSelected("brush.color", h, t("toast.colorChanged"));
  };

  return (
    <section className="glass-card p-4">
      <h3 className="mb-3 font-display text-base">{t("manager.color.title")}</h3>
      <div className="mb-3 flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-14 w-20 cursor-pointer rounded-md border border-border bg-input"
        />
        <input className="input-base font-mono" value={hex} onChange={(e) => setHex(e.target.value)} />
        <button onClick={() => apply(hex)} className="btn-base btn-primary">Apply</button>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t("manager.color.recent")}</p>
        <div className="flex flex-wrap gap-2">
          {recentColors.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          {recentColors.map((c) => (
            <button
              key={c}
              onClick={() => apply(c)}
              className="h-10 w-10 rounded-md border border-border"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ScenePanel() {
  const { t } = useTranslation();
  const { sendToSelected, sendToHeadsets, selectedIds, headsets, favorites, addFavorite, removeFavorite } = useApp();
  const [loadName, setLoadName] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);

  const saveScene = async () => {
    const ids = selectedIds;
    if (ids.length === 0) { toast.error(t("manager.preview.none")); return; }
    await sendToHeadsets(ids, (h) => {
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      return `sketch.save=${encodeURIComponent(h.name.replace(/[^\w-]/g, "_") + "_" + ts)}`;
    }, t("toast.saved"));
  };

  return (
    <section className="glass-card p-4">
      <h3 className="mb-3 font-display text-base">{t("manager.scene.title")}</h3>
      <div className="flex flex-wrap gap-2">
        <button onClick={saveScene} className="btn-base btn-primary">{t("manager.scene.save")}</button>
        <button onClick={() => setConfirmNew(true)} className="btn-base btn-danger">{t("manager.scene.new")}</button>
        <button
          onClick={() => sendToSelected("sketch.load", "tutorial", t("toast.loaded"))}
          className="btn-base btn-secondary"
          title={t("manager.scene.tutorialNote")}
        >
          {t("manager.scene.tutorial")}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("manager.scene.tutorialNote")}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input className="input-base" placeholder={t("manager.scene.loadPh")} value={loadName} onChange={(e) => setLoadName(e.target.value)} />
        <button
          onClick={async () => {
            if (!loadName.trim()) return;
            await sendToSelected("sketch.load", loadName.trim(), t("toast.loaded"));
            addFavorite(loadName.trim());
          }}
          className="btn-base btn-primary"
        >
          {t("manager.scene.load")}
        </button>
      </div>

      {favorites.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-muted-foreground">{t("manager.scene.favorites")}</p>
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => (
              <div key={f} className="flex items-center gap-1 rounded-md border border-border bg-secondary/50 p-1">
                <button
                  onClick={() => sendToSelected("sketch.load", f, t("toast.loaded"))}
                  className="px-2 py-1 text-xs"
                >
                  {f}
                </button>
                <button onClick={() => removeFavorite(f)} className="px-1 text-xs text-muted-foreground hover:text-destructive">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card max-w-sm p-6">
            <p className="mb-4 text-sm">{t("manager.scene.newConfirm")}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmNew(false)} className="btn-base btn-secondary">{t("common.cancel")}</button>
              <button
                onClick={async () => {
                  setConfirmNew(false);
                  await sendToSelected("sketch.new", undefined, t("toast.newScene"));
                }}
                className="btn-base btn-danger"
              >
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function EnvPanel() {
  const { t } = useTranslation();
  const { sendToSelected } = useApp();
  return (
    <section className="glass-card p-4">
      <h3 className="mb-3 font-display text-base">{t("manager.env.title")}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ENVIRONMENTS.map((e) => (
          <button
            key={e}
            onClick={() => sendToSelected("environment.set", e, t("toast.envChanged") + " (" + e + ")")}
            className="btn-base btn-secondary"
            style={{ minHeight: 44 }}
          >
            {e}
          </button>
        ))}
      </div>
    </section>
  );
}

export function MultiplayerPanel() {
  const { t } = useTranslation();
  const { mp, setMp, inRoom, setInRoom, headsets, selectedIds, sendToHeadsets, sendToSelected } = useApp();

  const join = async () => {
    if (selectedIds.length === 0) { toast.error(t("manager.preview.none")); return; }
    await sendToHeadsets(selectedIds, (h) => buildMultiplayerJoin(mp, h.id), t("toast.joined"));
    if (mp.beginner) await sendToSelected("sketch.beginner", true);
    setInRoom(true);
  };
  const leave = async () => {
    await sendToHeadsets(selectedIds, () => "multiplayer.leave", t("toast.left"));
    setInRoom(false);
  };

  return (
    <section className="glass-card p-4">
      <h3 className="mb-3 font-display text-base">{t("manager.mp.title")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {inRoom && mp.roomName ? t("common.inRoom", { name: mp.roomName }) : t("common.notInRoom")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("wizard.step5.nickname")}>
          <input className="input-base" value={mp.nickname} onChange={(e) => setMp({ ...mp, nickname: e.target.value })} />
        </Field>
        <Field label={t("wizard.step5.roomName")}>
          <input className="input-base" value={mp.roomName} onChange={(e) => setMp({ ...mp, roomName: e.target.value })} />
        </Field>
        <Field label={t("wizard.step5.roomKey")}>
          <input className="input-base" value={mp.roomKey} onChange={(e) => setMp({ ...mp, roomKey: e.target.value })} />
        </Field>
        <Field label={t("wizard.step5.maxPlayers")}>
          <input type="number" className="input-base" value={mp.maxPlayers} onChange={(e) => setMp({ ...mp, maxPlayers: Number(e.target.value) || 10 })} />
        </Field>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Toggle label={t("wizard.step5.perHeadset")} value={mp.perHeadsetNick} onChange={(v) => setMp({ ...mp, perHeadsetNick: v })} />
        <Toggle label={t("wizard.step5.beginner")} value={mp.beginner} onChange={(v) => setMp({ ...mp, beginner: v })} />
        <Toggle label={t("wizard.step5.private")} value={mp.isPrivate} onChange={(v) => setMp({ ...mp, isPrivate: v })} />
        <Toggle label={t("wizard.step5.viewOnly")} value={mp.viewOnly} onChange={(v) => setMp({ ...mp, viewOnly: v })} />
      </div>

      {mp.perHeadsetNick && (
        <div className="mt-3 space-y-2">
          {headsets.map((h) => (
            <div key={h.id} className="flex items-center gap-2">
              <span className="w-32 truncate text-xs text-muted-foreground">{h.name}</span>
              <input
                className="input-base"
                placeholder="nickname"
                value={mp.perHeadsetNicks[h.id] || ""}
                onChange={(e) => setMp({ ...mp, perHeadsetNicks: { ...mp.perHeadsetNicks, [h.id]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={join} className="btn-base btn-primary">{t("manager.mp.join")}</button>
        <button onClick={leave} className="btn-base btn-danger">{t("manager.mp.leave")}</button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className={`btn-base justify-between ${value ? "btn-primary" : "btn-secondary"}`} style={{ width: "100%" }}>
      <span>{label}</span><span>{value ? "ON" : "OFF"}</span>
    </button>
  );
}
