import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { TerminalShell } from "@/components/terminal/TerminalShell";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { AgentCataloguePanel } from "@/components/tools/AgentCataloguePanel";

export function AppShell() {
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-[720px] bg-background text-foreground">
      <div className="m-3 flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white shadow-shell">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <Header
            onOpenCatalogue={() => setCatalogueOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <div className="flex min-h-0 flex-1">
            <ProjectSidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <TerminalShell />
            </main>
          </div>
          <SettingsPanel
            onOpenCatalogue={() => setCatalogueOpen(true)}
            onClose={() => setSettingsOpen(false)}
            open={settingsOpen}
          />
          <AgentCataloguePanel
            onClose={() => setCatalogueOpen(false)}
            open={catalogueOpen}
          />
        </div>
      </div>
    </div>
  );
}
