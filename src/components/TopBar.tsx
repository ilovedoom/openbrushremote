import { useTranslation } from "react-i18next";
import { useApp } from "@/state/AppContext";
import { LANGS } from "@/i18n";

export function TopBar() {
  const { t, i18n } = useTranslation();
  const { tab, setTab, headsets } = useApp();

  const tabs: { id: "wizard" | "manager" | "wiki"; label: string }[] = [
    { id: "wizard", label: t("nav.wizard") },
    { id: "manager", label: t("nav.manager") },
    { id: "wiki", label: t("nav.wiki") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent glow-violet">
            <span className="font-display text-sm font-bold text-primary-foreground">OB</span>
          </div>
          <div>
            <h1 className="font-display text-lg leading-none">{t("app.name")}</h1>
            <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`btn-base ${tab === tb.id ? "btn-primary" : "btn-secondary"}`}
              style={{ minHeight: 40, padding: "0 0.875rem" }}
            >
              {tb.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" title="Connection status">
            {headsets.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              headsets.map((h) => (
                <span
                  key={h.id}
                  title={`${h.name} (${h.ip})`}
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    h.online === true ? "bg-[oklch(0.72_0.18_150)] glow-success" : h.online === false ? "bg-[oklch(0.62_0.24_25)]" : "bg-muted-foreground/50"
                  }`}
                />
              ))
            )}
          </div>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="input-base"
            style={{ minHeight: 40, padding: "0 0.75rem", width: "auto" }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
