import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import "@/i18n";
import { AppProvider, useApp } from "@/state/AppContext";
import { TopBar } from "@/components/TopBar";
import { Wizard } from "@/components/Wizard";
import { Manager } from "@/components/Manager";
import { Wiki } from "@/components/Wiki";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppProvider>
      <Shell />
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </AppProvider>
  );
}

function Shell() {
  const { tab } = useApp();
  return (
    <div className="min-h-screen">
      <TopBar />
      <main>
        {tab === "wizard" && <Wizard />}
        {tab === "manager" && <Manager />}
        {tab === "wiki" && <Wiki />}
      </main>
    </div>
  );
}
