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
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  return (
    <div className="min-h-screen">
      {isHttps && (
        <div className="https-banner">
          ⚠️ Attenzione: questa pagina è caricata via HTTPS. Safari su iPhone/iPad bloccherà le connessioni al visore. Apri il file <code>index.html</code> direttamente dalla app File (URL = <code>file://…</code>) o usa un server HTTP locale.
        </div>
      )}
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
