import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";

export function App() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const clearSession = useSessionStore((state) => state.clearSession);
  const mode = useSessionStore((state) => state.mode);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const stopPtySession = useSessionStore((state) => state.stopPtySession);

  useEffect(() => {
    if (!selectedProject) {
      if (
        mode === "pty" &&
        activeSessionId &&
        (sessionStatus === "active" || sessionStatus === "starting")
      ) {
        void stopPtySession().finally(() => clearSession());
        return;
      }

      clearSession();
    }
  }, [
    activeSessionId,
    clearSession,
    mode,
    selectedProject,
    sessionStatus,
    stopPtySession,
  ]);

  return <AppShell />;
}
