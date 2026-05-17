import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useApp } from "@/state/AppContext";
import { LANGS } from "@/i18n";
import { buildMultiplayerJoin, ping, sendCommand } from "@/lib/openbrush";
import { useNetworkScanner } from "@/lib/useNetworkScanner";
import { FBtn, type FBtnToast } from "@/components/ui/FBtn";

const TOTAL = 6;

export function Wizard() {
  const { t, i18n } = useTranslation();
  const { setTab, setWizardCompleted, headsets, addHeadset, removeHeadset, updateHeadset, mp, setMp, setInRoom } = useApp();
  const [step, setStep] = useState(1);

  // Step 2 checklist
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  // Step 3 form
  const [hName, setHName] = useState("");
  const [hIp, setHIp] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const goManager = () => {
    setWizardCompleted(true);
    setTab("manager");
  };

  const scan = async () => {
    setScanning(true);
    setScanProgress(0);
    let found = 0;
    // Try to determine subnet from window.location? Not reliable in file://. Default 192.168.1.x.
    const base = "192.168.1.";
    const batchSize = 16;
    for (let start = 1; start < 255; start += batchSize) {
      const batch: Promise<void>[] = [];
      for (let i = start; i < Math.min(start + batchSize, 255); i++) {
        const ip = base + i;
        batch.push(
          ping(ip, 1500).then((ok) => {
            if (ok) {
              found++;
              addHeadset(`Quest ${ip}`, ip);
            }
          }),
        );
      }
      await Promise.all(batch);
      setScanProgress(Math.min(start + batchSize - 1, 254));
    }
    setScanning(false);
    toast.success(t("wizard.step3.scanDone", { n: found }));
  };

  const pingOne = async (id: string, ip: string) => {
    updateHeadset(id, { online: null });
    const ok = await ping(ip);
    updateHeadset(id, { online: ok });
  };
  const pingAll = async () => {
    await Promise.all(headsets.map((h) => pingOne(h.id, h.ip)));
  };

  const joinMp = async () => {
    if (headsets.length === 0) return;
    await Promise.all(
      headsets.map(async (h) => {
        const cmd = buildMultiplayerJoin(mp, h.id);
        const ok = await sendCommand(h.ip, cmd);
        if (mp.beginner) await sendCommand(h.ip, `sketch.beginner=true`);
        if (ok) toast.success(t("toast.joined") + " — " + h.name);
        else toast.error(t("toast.failed", { name: h.name }));
      }),
    );
    setInRoom(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("wizard.progress", { current: step, total: TOTAL })}</p>
        <button onClick={goManager} className="btn-base btn-ghost" style={{ minHeight: 36 }}>
          {t("common.skipToManager")} →
        </button>
      </div>
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${(step / TOTAL) * 100}%` }}
        />
      </div>

      <div className="glass-card p-6 sm:p-8">
        {step === 1 && (
          <section>
            <h2 className="mb-6 text-2xl">{t("wizard.step1.title")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => i18n.changeLanguage(l.code)}
                  className={`btn-base ${i18n.language === l.code ? "btn-primary glow-violet" : "btn-secondary"}`}
                  style={{ flexDirection: "column", padding: "1rem", height: "auto", minHeight: 96 }}
                >
                  <span className="text-3xl">{l.flag}</span>
                  <span className="text-xs">{l.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-base btn-primary">
                {t("common.continue")} →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="mb-3 text-2xl">{t("wizard.step2.title")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("wizard.step2.intro")}</p>
            <p className="mb-2 text-sm">
              <span className="text-muted-foreground">{t("wizard.step2.filePath")} </span>
              <code className="rounded bg-input px-2 py-0.5 text-xs">/sdcard/Open Brush/Open Brush.cfg</code>
            </p>
            <p className="mb-4 text-xs text-muted-foreground">{t("wizard.step2.howTo")}</p>
            <pre className="mb-4 overflow-x-auto rounded-md border border-border bg-[oklch(0.05_0.01_280)] p-4 text-xs text-accent">
{`{
  "Flags": {
    "EnableApiRemoteCalls": true,
    "EnableApiCorsHeaders": true
  }
}`}
            </pre>
            <p className="mb-4 text-xs text-muted-foreground">{t("wizard.step2.mergeNote")}</p>
            <div className="mb-6 flex flex-wrap gap-2">
              <a href="https://docs.openbrush.app/user-guide/open-brush-api" target="_blank" rel="noopener noreferrer" className="btn-base btn-secondary">
                {t("wizard.step2.docs")}
              </a>
              <a href="https://discord.openbrush.app" target="_blank" rel="noopener noreferrer" className="btn-base btn-secondary">
                {t("wizard.step2.discord")}
              </a>
            </div>
            <h3 className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">{t("wizard.step2.checklist")}</h3>
            <div className="mb-6 space-y-2">
              {[
                { v: c1, set: setC1, l: t("wizard.step2.check1") },
                { v: c2, set: setC2, l: t("wizard.step2.check2") },
                { v: c3, set: setC3, l: t("wizard.step2.check3") },
              ].map((it, i) => (
                <button
                  key={i}
                  onClick={() => it.set(!it.v)}
                  className={`btn-base w-full justify-start ${it.v ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 52 }}
                >
                  <span className="text-lg">{it.v ? "✅" : "⬜"}</span>
                  <span>{it.l}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-base btn-ghost">← {t("common.back")}</button>
              <button onClick={() => setStep(3)} disabled={!(c1 && c2 && c3)} className="btn-base btn-primary">
                {t("common.continue")} →
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="mb-6 text-2xl">{t("wizard.step3.title")}</h2>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t("wizard.step3.nameLabel")}</label>
                <input className="input-base" placeholder={t("wizard.step3.namePh")} value={hName} onChange={(e) => setHName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t("wizard.step3.ipLabel")}</label>
                <input className="input-base" placeholder={t("wizard.step3.ipPh")} value={hIp} onChange={(e) => setHIp(e.target.value)} />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!hIp.trim()) return;
                  addHeadset(hName.trim() || hIp.trim(), hIp.trim());
                  setHName("");
                  setHIp("");
                }}
                className="btn-base btn-primary"
              >
                + {t("wizard.step3.addBtn")}
              </button>
              <button onClick={scan} disabled={scanning} className="btn-base btn-secondary">
                {scanning ? t("wizard.step3.scanning", { n: scanProgress }) : `🔎 ${t("wizard.step3.scanBtn")}`}
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">{t("wizard.step3.scanNote")}</p>

            {headsets.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t("wizard.step3.empty")}
              </p>
            ) : (
              <ul className="mb-6 space-y-2">
                {headsets.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
                    <div>
                      <p className="font-display text-sm">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{h.ip}</p>
                    </div>
                    <button onClick={() => removeHeadset(h.id)} className="btn-base btn-danger" style={{ minHeight: 36 }}>
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-base btn-ghost">← {t("common.back")}</button>
              <button onClick={() => setStep(4)} disabled={headsets.length === 0} className="btn-base btn-primary">
                {t("common.continue")} →
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="mb-6 text-2xl">{t("wizard.step4.title")}</h2>
            <div className="mb-4 flex justify-end">
              <button onClick={pingAll} className="btn-base btn-secondary">{t("common.retry")} ↻</button>
            </div>
            <ul className="mb-6 space-y-2">
              {headsets.map((h) => (
                <li key={h.id} className={`flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-3 ${h.online === true ? "glow-success" : h.online === false ? "glow-danger" : ""}`}>
                  <div>
                    <p className="font-display text-sm">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.ip}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {h.online === null ? t("wizard.step4.pinging") : h.online ? `✅ ${t("common.connected")}` : `❌ ${t("common.unreachable")}`}
                    </span>
                    <button onClick={() => pingOne(h.id, h.ip)} className="btn-base btn-secondary" style={{ minHeight: 36 }}>↻</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-base btn-ghost">← {t("common.back")}</button>
              <div className="flex gap-2">
                <button onClick={() => setStep(5)} className="btn-base btn-secondary">{t("common.continueAnyway")}</button>
                <button onClick={() => setStep(5)} className="btn-base btn-primary">{t("common.continue")} →</button>
              </div>
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h2 className="mb-1 text-2xl">{t("wizard.step5.title")}</h2>
            <p className="mb-6 text-sm text-muted-foreground">{t("wizard.step5.subtitle")}</p>
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
                <input type="number" min={2} max={20} className="input-base" value={mp.maxPlayers} onChange={(e) => setMp({ ...mp, maxPlayers: Number(e.target.value) || 10 })} />
              </Field>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Toggle label={t("wizard.step5.perHeadset")} value={mp.perHeadsetNick} onChange={(v) => setMp({ ...mp, perHeadsetNick: v })} />
              <Toggle label={t("wizard.step5.private")} value={mp.isPrivate} onChange={(v) => setMp({ ...mp, isPrivate: v })} />
              <Toggle label={t("wizard.step5.beginner")} value={mp.beginner} onChange={(v) => setMp({ ...mp, beginner: v })} />
              <Toggle label={t("wizard.step5.viewOnly")} value={mp.viewOnly} onChange={(v) => setMp({ ...mp, viewOnly: v })} />
            </div>

            {mp.perHeadsetNick && (
              <div className="mt-4 space-y-2">
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

            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <button onClick={() => setStep(4)} className="btn-base btn-ghost">← {t("common.back")}</button>
              <div className="flex gap-2">
                <button onClick={() => setStep(6)} className="btn-base btn-secondary">{t("wizard.step5.skipStep")}</button>
                <button onClick={async () => { await joinMp(); setStep(6); }} className="btn-base btn-primary">🔗 {t("wizard.step5.join")}</button>
              </div>
            </div>
          </section>
        )}

        {step === 6 && (
          <section>
            <h2 className="mb-6 text-2xl">{t("wizard.step6.title")}</h2>
            <div className="mb-6 space-y-4">
              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{t("wizard.step6.headsets")}</h3>
                <ul className="space-y-1">
                  {headsets.map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-sm">
                      <span>{h.name} <span className="text-muted-foreground">— {h.ip}</span></span>
                      <span>{h.online ? "✅" : h.online === false ? "❌" : "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{t("wizard.step6.room")}</h3>
                <p className="text-sm">{mp.roomName ? mp.roomName : t("common.none")}</p>
              </div>
              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{t("wizard.step6.language")}</h3>
                <p className="text-sm">{LANGS.find((l) => l.code === i18n.language)?.name}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={goManager} className="btn-base btn-primary glow-violet">
                {t("wizard.step6.go")} →
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
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
    <button
      onClick={() => onChange(!value)}
      className={`btn-base justify-between ${value ? "btn-primary" : "btn-secondary"}`}
      style={{ width: "100%" }}
    >
      <span>{label}</span>
      <span>{value ? "ON" : "OFF"}</span>
    </button>
  );
}
