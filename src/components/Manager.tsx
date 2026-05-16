import { useTranslation } from "react-i18next";
import { DeviceBar, PreviewPanel } from "./manager/DevicesAndPreview";
import { TimelapsePanel } from "./manager/TimelapsePanel";
import { BrushPanel, ColorPanel, ScenePanel, EnvPanel, MultiplayerPanel } from "./manager/ControlPanels";

export function Manager() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
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
