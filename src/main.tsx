import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import "@/i18n";
import "@/styles.css";
import { AppProvider, useApp } from "@/state/AppContext";
import { TopBar } from "@/components/TopBar";
import { Wizard } from "@/components/Wizard";
import { Manager } from "@/components/Manager";
import { Wiki } from "@/components/Wiki";

const queryClient = new QueryClient();

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Shell />
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </AppProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
