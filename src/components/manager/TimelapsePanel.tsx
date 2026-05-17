import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import JSZip from "jszip";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchToU8 } from "@/lib/ffmpegLoader";
import { useApp } from "@/state/AppContext";
import { fetchPreviewBlob } from "@/lib/openbrush";
import { FBtn, type FBtnToast } from "@/components/ui/FBtn";

type Frame = { headsetId: string; headsetName: string; blob: Blob; filename: string };

// Tiny 1x1 transparent PNG for demo capture fallback
const DEMO_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
async function demoBlob(): Promise<Blob> {
  const bin = atob(DEMO_PNG_B64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: "image/png" });
}

export function TimelapsePanel() {
  const { t } = useTranslation();
  const { effectiveHeadsets, effectiveSelectedIds } = useApp();

  const [assigned, setAssigned] = useState<string[]>([]); // headset ids; empty = all selected
  const [min, setMin] = useState(5);
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [frames, setFrames] = useState<Frame[]>([]);
  const [fps, setFps] = useState<6 | 12>(6);
  const [encodeProgress, setEncodeProgress] = useState<number | null>(null);

  const totalSec = min * 60 + sec;
  const fps12Unlocked = frames.length > 60;

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const assignedRef = useRef<string[]>([]);
  assignedRef.current = assigned.length ? assigned : effectiveSelectedIds;

  // beep
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 440;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      o.start();
      o.stop(ctx.currentTime + 0.45);
    } catch {/* ignore */}
  };

  const captureNow = async () => {
    const ids = assignedRef.current;
    const targets = effectiveHeadsets.filter((h) => ids.includes(h.id));
    await Promise.all(
      targets.map(async (h) => {
        const blob = h.demo ? await demoBlob() : await fetchPreviewBlob(h.ip, 6000, h.port);
        if (!blob) return;
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `${h.name.replace(/[^\w-]/g, "_")}_${ts}.png`;
        setFrames((prev) => [...prev, { headsetId: h.id, headsetName: h.name, blob, filename }]);
      }),
    );
  };

  const exportZip = async (): Promise<FBtnToast> => {
    if (frames.length === 0) return { msg: "❌ Nessun frame catturato", type: "err" };
    const zip = new JSZip();
    frames.forEach((f) => zip.file(f.filename, f.blob));
    const out = await zip.generateAsync({ type: "blob" });
    downloadBlob(out, `openbrush_timelapse_${Date.now()}.zip`);
    return { msg: `✅ ${frames.length} frame scaricati`, type: "ok" };
  };

  const exportMp4 = async () => {
    if (frames.length === 0) return;
    setEncodeProgress(0);
    try {
      const ff = new FFmpeg();
      ff.on("progress", ({ progress }) => setEncodeProgress(Math.round(progress * 100)));
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ff.load({
        coreURL: await fetchToU8(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await fetchToU8(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      for (let i = 0; i < frames.length; i++) {
        const name = `f${String(i).padStart(5, "0")}.png`;
        const buf = new Uint8Array(await frames[i].blob.arrayBuffer());
        await ff.writeFile(name, buf);
      }
      await ff.exec([
        "-framerate", String(fps),
        "-i", "f%05d.png",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
        "out.mp4",
      ]);
      const data = (await ff.readFile("out.mp4")) as Uint8Array;
      const copy = new Uint8Array(data as Uint8Array);
      downloadBlob(new Blob([copy], { type: "video/mp4" }), `openbrush_timelapse_${Date.now()}.mp4`);
    } catch (err) {
      console.error(err);
      toast.error("MP4 export failed");
    } finally {
      setEncodeProgress(null);
    }
  };

  // Timer + 30s capture interval
  useEffect(() => {
    if (!running || paused) return;
    let lastCaptureAt = Math.floor(elapsed / 30) * 30;
    tickRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next - lastCaptureAt >= 30) {
          lastCaptureAt = next;
          captureNow();
        }
        if (next >= totalSec) {
          // session ended
          const ids = assignedRef.current;
          const names = effectiveHeadsets.filter((h) => ids.includes(h.id)).map((h) => h.name).join(", ") || "—";
          toast.success(t("manager.timelapse.ended", { name: names }));
          beep();
          setRunning(false);
          // auto-trigger exports
          setTimeout(() => { exportZip(); exportMp4(); }, 300);
        }
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running, paused, totalSec]); // eslint-disable-line

  const start = async () => {
    if (totalSec <= 0) return;
    if ((assigned.length ? assigned : effectiveSelectedIds).length === 0) {
      toast.error(t("manager.preview.none"));
      return;
    }
    setElapsed(0);
    setRunning(true);
    setPaused(false);
    // initial capture at t=0
    captureNow();
  };

  const stop = () => { setRunning(false); setPaused(false); };

  const progressPct = totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0;

  return (
    <section className="glass-card p-4">
      <h3 className="mb-4 font-display text-base">{t("manager.timelapse.title")}</h3>

      <div className="mb-4">
        <label className="mb-1 block text-xs text-muted-foreground">{t("manager.timelapse.assign")}</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAssigned([])}
            className={`btn-base ${assigned.length === 0 ? "btn-primary" : "btn-secondary"}`}
            style={{ minHeight: 40 }}
          >
            {t("manager.timelapse.allSelected")}
          </button>
          {effectiveHeadsets.map((h) => {
            const on = assigned.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => setAssigned((prev) => (on ? prev.filter((x) => x !== h.id) : [...prev, h.id]))}
                className={`btn-base ${on ? "btn-primary" : "btn-secondary"}`}
                style={{ minHeight: 40 }}
              >
                {h.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-xs">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t("manager.timelapse.minutes")}</label>
          <input type="number" min={0} value={min} onChange={(e) => setMin(Math.max(0, +e.target.value))} className="input-base" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t("manager.timelapse.seconds")}</label>
          <input type="number" min={0} max={59} value={sec} onChange={(e) => setSec(Math.max(0, Math.min(59, +e.target.value)))} className="input-base" />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {!running && <button onClick={start} className="btn-base btn-primary">▶ {t("manager.timelapse.start")}</button>}
        {running && !paused && <button onClick={() => setPaused(true)} className="btn-base btn-secondary">⏸ {t("manager.timelapse.pause")}</button>}
        {running && paused && <button onClick={() => setPaused(false)} className="btn-base btn-primary">▶ {t("manager.timelapse.resume")}</button>}
        {running && <button onClick={stop} className="btn-base btn-danger">⏹ {t("manager.timelapse.stop")}</button>}
      </div>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {fmt(elapsed)} / {fmt(totalSec)} · {t("manager.timelapse.frames", { n: frames.length })}
      </p>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("manager.timelapse.fps")}:</span>
        <button onClick={() => setFps(6)} className={`btn-base ${fps === 6 ? "btn-primary" : "btn-secondary"}`} style={{ minHeight: 36 }}>6 fps</button>
        {fps12Unlocked && (
          <button onClick={() => setFps(12)} className={`btn-base ${fps === 12 ? "btn-primary" : "btn-secondary"}`} style={{ minHeight: 36 }}>12 fps</button>
        )}
        {fps12Unlocked && <span className="text-xs text-accent">{t("manager.timelapse.unlocked")}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={exportZip} disabled={frames.length === 0} className="btn-base btn-secondary">{t("manager.timelapse.zip")}</button>
        <button onClick={exportMp4} disabled={frames.length === 0 || encodeProgress !== null} className="btn-base btn-secondary">
          {encodeProgress !== null ? t("manager.timelapse.encoding", { p: encodeProgress }) : t("manager.timelapse.mp4")}
        </button>
      </div>
      {encodeProgress !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-accent transition-all" style={{ width: `${encodeProgress}%` }} />
        </div>
      )}
    </section>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
