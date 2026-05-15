import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { StatusPanel } from "@/components/layout/StatusPanel";
import { TerminalPlaceholder } from "@/components/terminal/TerminalPlaceholder";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-[720px] bg-background text-foreground">
      <div className="m-3 flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white shadow-shell">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <Header onOpenSettings={() => setSettingsOpen(true)} />
          <div className="flex min-h-0 flex-1">
            <ProjectSidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <TerminalPlaceholder />
              <StatusPanel />
            </main>
          </div>
          <SettingsPanel
            onClose={() => setSettingsOpen(false)}
            open={settingsOpen}
          />
        </div>
      </div>
    </div>
  );
}
