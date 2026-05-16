import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

function Section({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <span className="font-display text-base">{title}</span>
        <span className="text-accent">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="border-t border-border p-4 text-sm">{children}</div>}
    </div>
  );
}

function Sub({ t, d }: { t: string; d: string }) {
  return (
    <div className="mb-3 rounded-md border border-border/60 bg-secondary/30 p-3">
      <p className="mb-1 font-display text-sm">{t}</p>
      <p className="text-xs text-muted-foreground">{d}</p>
    </div>
  );
}

export function Wiki() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-3 px-4 py-6">
      <h1 className="mb-2 text-2xl">{t("wiki.title")}</h1>

      <Section title={t("wiki.sec1")} defaultOpen>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("wiki.api.l1")}</li>
          <li>{t("wiki.api.l2")}</li>
          <li>
            {t("wiki.api.format")} <code className="rounded bg-input px-1 py-0.5 text-xs">http://[ip]:40074/api/v1?command=value</code>
          </li>
          <li>
            {t("wiki.api.preview")} <code className="rounded bg-input px-1 py-0.5 text-xs">http://[ip]:40074/cameraview</code>
          </li>
          <li>
            {t("wiki.api.commands")}{" "}
            <code className="rounded bg-input px-1 py-0.5 text-xs">http://[ip]:40074/help/commands</code>
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="https://docs.openbrush.app/user-guide/open-brush-api">📖 Docs</Link>
          <Link href="https://docs.openbrush.app/user-guide/open-brush-api/api-commands">📋 API Commands</Link>
          <Link href="https://docs.openbrush.app/user-guide/open-brush-api/retrieving-a-preview-image">🖼️ Preview</Link>
        </div>
      </Section>

      <Section title={t("wiki.sec2")}>
        {(["saveNew","load","tut","brush","color","env","mp","tl","timer"] as const).map((k) => (
          <Sub key={k} t={t(`wiki.cases.${k}.t`)} d={t(`wiki.cases.${k}.d`)} />
        ))}
      </Section>

      <Section title={t("wiki.sec3")}>
        {(["unreach","cors","preview","safari","scan","cmd","mp"] as const).map((k) => (
          <Sub key={k} t={t(`wiki.trouble.${k}.t`)} d={t(`wiki.trouble.${k}.d`)} />
        ))}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="https://discord.openbrush.app">💬 Discord</Link>
          <Link href="https://docs.openbrush.app">📖 Docs</Link>
          <Link href="https://github.com/icosa-foundation/open-brush">🐙 GitHub</Link>
        </div>
      </Section>

      <Section title={t("wiki.sec4")}>
        <div className="flex flex-wrap gap-2">
          <Link href="https://docs.openbrush.app">📖 Docs</Link>
          <Link href="https://docs.openbrush.app/user-guide/open-brush-api/api-commands">📋 API Commands</Link>
          <Link href="https://discord.openbrush.app">💬 Discord</Link>
          <Link href="https://github.com/icosa-foundation/open-brush">🐙 GitHub</Link>
        </div>
      </Section>

      <Section title={t("wiki.sec5")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <CreditCard title={`🎨 ${t("wiki.credits.createdBy")}`} name="Matteo Sgherri" links={[
            ["Instagram", "https://instagram.com/thepixelschips"],
            ["TikTok", "https://tiktok.com/@thepixelschips"],
            ["Website", "https://www.matteosgherri.com"],
          ]} />
          <CreditCard title={`🤝 ${t("wiki.credits.collab")}`} name="Holonexia APS" links={[
            ["Instagram", "https://instagram.com/holonexia"],
            ["LinkedIn", "https://linkedin.com/company/holonexia"],
            ["Website", "https://www.holonexia.it"],
          ]} />
          <CreditCard title={`🖌️ ${t("wiki.credits.powered")}`} name="Open Brush" links={[
            ["Docs", "https://docs.openbrush.app"],
            ["Discord", "https://discord.openbrush.app"],
            ["GitHub", "https://github.com/icosa-foundation/open-brush"],
          ]} />
        </div>
      </Section>
    </div>
  );
}

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn-base btn-secondary" style={{ minHeight: 36, fontSize: "0.8rem" }}>
      {children}
    </a>
  );
}

function CreditCard({ title, name, links }: { title: string; name: string; links: [string, string][] }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mb-3 font-display text-base text-accent">{name}</p>
      <div className="flex flex-col gap-1">
        {links.map(([label, url]) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground hover:text-accent hover:underline">
            {label} →
          </a>
        ))}
      </div>
    </div>
  );
}
