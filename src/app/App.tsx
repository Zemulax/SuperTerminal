import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";

export function App() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    if (!selectedProject) {
      clearSession();
    }
  }, [clearSession, selectedProject]);

  return <AppShell />;
}
