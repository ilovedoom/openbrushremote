import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/state/AppContext";
import { previewUrl } from "@/lib/openbrush";

export function DeviceBar() {
  const { t } = useTranslation();
  const { effectiveHeadsets, effectiveSelectedIds, toggleSelected, selectAll, deselectAll, isDemo } = useApp();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">{t("manager.devices")}</h2>
        <div className="flex gap-2">
          <button onClick={selectAll} className="btn-base btn-secondary" style={{ minHeight: 36 }}>{t("common.selectAll")}</button>
          <button onClick={deselectAll} className="btn-base btn-ghost" style={{ minHeight: 36 }}>{t("common.deselectAll")}</button>
        </div>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {effectiveHeadsets.map((h) => {
          const selected = effectiveSelectedIds.includes(h.id);
          const onlineCls = h.online === true ? "glow-success" : h.online === false ? "glow-danger" : "";
          return (
            <button
              key={h.id}
              onClick={() => toggleSelected(h.id)}
              className={`glass-card flex min-w-[180px] flex-col items-start gap-1 p-3 text-left transition-all ${onlineCls} ${selected ? "glow-violet" : ""}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-display text-sm">{h.name}{isDemo && " 🎭"}</span>
                <span className={`inline-block h-2 w-2 rounded-full ${h.online === true ? "bg-[oklch(0.72_0.18_150)]" : h.online === false ? "bg-[oklch(0.62_0.24_25)]" : "bg-muted-foreground/50"}`} />
              </div>
              <span className="text-xs text-muted-foreground">{h.ip}{h.port && h.port !== 40074 ? `:${h.port}` : ""}</span>
              <span className="text-xs">{selected ? "● Selected" : "○ Tap to select"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PreviewPanel() {
  const { t } = useTranslation();
  const { effectiveHeadsets, effectiveSelectedIds, isDemo } = useApp();
  const targets = effectiveHeadsets.filter((h) => effectiveSelectedIds.includes(h.id));
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base">{t("manager.preview.title")}</h3>
        <span className="text-xs text-muted-foreground">{t("manager.preview.note")}</span>
      </div>
      {targets.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("manager.preview.none")}
        </p>
      ) : (
        <div className={`grid gap-3 ${targets.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {targets.map((h) => (
            <div key={h.id} className="overflow-hidden rounded-md border border-border bg-input">
              {isDemo || h.demo ? (
                <div className="flex aspect-video w-full items-center justify-center bg-black text-5xl">
                  👁️
                </div>
              ) : (
                <img
                  src={previewUrl(h.ip, h.port) + "&_=" + tick}
                  alt={h.name}
                  className="aspect-video w-full bg-black object-contain"
                  onError={(e) => ((e.currentTarget.style.opacity = "0.2"))}
                />
              )}
              <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">{h.name}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
