import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";

export function App() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const startMockSession = useSessionStore((state) => state.startMockSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    if (selectedProject) {
      startMockSession(activeToolId, selectedProject.id);
    } else {
      clearSession();
    }
  }, [activeToolId, clearSession, selectedProject, startMockSession]);

  return <AppShell />;
}
