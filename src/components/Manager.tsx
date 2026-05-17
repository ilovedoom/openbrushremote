import { useTranslation } from "react-i18next";
import { useApp } from "@/state/AppContext";
import { DeviceBar, PreviewPanel } from "./manager/DevicesAndPreview";
import { TimelapsePanel } from "./manager/TimelapsePanel";
import { BrushPanel, ColorPanel, ScenePanel, EnvPanel, MultiplayerPanel } from "./manager/ControlPanels";

export function Manager() {
  const { isDemo } = useApp();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {isDemo && (
        <div className="demo-banner">
          🎭 Demo mode attiva — nessun Quest reale connesso. Aggiungi un visore dal Wizard.
        </div>
      )}
      <DeviceBar />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PreviewPanel />
        <TimelapsePanel />
        <BrushPanel />
        <ColorPanel />
        <ScenePanel />
        <EnvPanel />
        <div className="lg:col-span-2">
          <MultiplayerPanel />
        </div>
      </div>
    </div>
  );
}

export function ManagerPage() {
  useTranslation();
  return <Manager />;
}
