import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextInjectionPanel } from "@/components/context/ContextInjectionPanel";
import { SessionHistoryPanel } from "@/components/history/SessionHistoryPanel";
import { TerminalStatusBar } from "@/components/terminal/TerminalStatusBar";
import { TerminalToolbar } from "@/components/terminal/TerminalToolbar";
import { LaunchProfileEditor } from "@/components/tools/LaunchProfileEditor";
import {
  XTermSurface,
  type XTermSurfaceHandle,
} from "@/components/terminal/XTermSurface";
import { useProjectStore } from "@/stores/projectStore";
import { useContextStore } from "@/stores/contextStore";
import { useHistoryStore } from "@/stores/historyStore";
import { useSecretEnvStore } from "@/stores/secretEnvStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useTerminalPreferencesStore } from "@/stores/terminalPreferencesStore";
import { useToolStore } from "@/stores/toolStore";
import type {
  PtyErrorEvent,
  PtyExitEvent,
  PtyOutputEvent,
  ToolLaunchSpec,
} from "@/lib/types";

const CRLF = "\r\n";

function sanitizeInput(input: string) {
  return input.replace(/\r/g, "").replace(/\n/g, "");
}

export function TerminalShell() {
  const terminalRef = useRef<XTermSurfaceHandle>(null);
  const activationTimerRef = useRef<number>();
  const resizeTimerRef = useRef<number>();
  const lastToolIdRef = useRef<string>();
  const lastProjectIdRef = useRef<string>();
  const autoStartedRef = useRef(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [launchConfirmOpen, setLaunchConfirmOpen] = useState(false);
  const [pendingLaunchSpec, setPendingLaunchSpec] = useState<ToolLaunchSpec>();
  const [terminalReady, setTerminalReady] = useState(false);

  const selectedProject = useProjectStore((state) => state.selectedProject);
  const adapters = useToolStore((state) => state.adapters);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const buildLaunchSpec = useToolStore((state) => state.buildLaunchSpec);
  const launchProfilesByAdapterId = useToolStore(
    (state) => state.launchProfilesByAdapterId,
  );
  const getLaunchProfile = useToolStore((state) => state.getLaunchProfile);
  const activeTool =
    adapters.find((tool) => tool.definition.id === activeToolId) ?? adapters[0];
  const launchProfile =
    launchProfilesByAdapterId[activeTool.definition.id] ??
    getLaunchProfile(activeTool.definition.id);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const mode = useSessionStore((state) => state.mode);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const shell = useSessionStore((state) => state.shell);
  const ptySession = useSessionStore((state) => state.ptySession);
  const activeRunningToolId = useSessionStore((state) => state.activeToolId);
  const activeRunningToolName = useSessionStore((state) => state.activeToolName);
  const cols = useSessionStore((state) => state.cols);
  const rows = useSessionStore((state) => state.rows);
  const inputBuffer = useSessionStore((state) => state.inputBuffer);
  const startPtySession = useSessionStore((state) => state.startPtySession);
  const writePtyInput = useSessionStore((state) => state.writePtyInput);
  const resizePtySession = useSessionStore((state) => state.resizePtySession);
  const stopPtySession = useSessionStore((state) => state.stopPtySession);
  const startDemoSession = useSessionStore((state) => state.startDemoSession);
  const stopDemoSession = useSessionStore((state) => state.stopDemoSession);
  const setStatus = useSessionStore((state) => state.setStatus);
  const appendTranscript = useSessionStore((state) => state.appendTranscript);
  const clearTranscript = useSessionStore((state) => state.clearTranscript);
  const setInputBuffer = useSessionStore((state) => state.setInputBuffer);
  const historySettings = useHistoryStore((state) => state.settings);
  const terminalPreferences = useTerminalPreferencesStore(
    (state) => state.preferences,
  );
  const loadToolSecrets = useSecretEnvStore((state) => state.loadToolSecrets);

  const writePrompt = useCallback(() => {
    terminalRef.current?.write(`${activeTool.resolvedCommand}> `);
  }, [activeTool.resolvedCommand]);

  const writeLine = useCallback(
    (line = "") => {
      terminalRef.current?.write(`${line}${CRLF}`);
      appendTranscript(line);
    },
    [appendTranscript],
  );

  const handleLaunchAndInjectContext = useCallback(
    async (appendNewline: boolean, delayMs: number) => {
      if (!selectedProject) {
        throw new Error("Open a project folder before launch and inject.");
      }

      if (sessionStatus === "starting" || sessionStatus === "active") {
        throw new Error("Stop the active session before launch and inject.");
      }

      if (activeTool.status !== "ready") {
        throw new Error("Selected tool must be ready before launch and inject.");
      }

      const spec = await buildLaunchSpec(activeTool.definition.id, selectedProject.path);
      if (!spec) {
        throw new Error("Unable to build launch spec for selected tool.");
      }

      if (spec.launchMode === "manual") {
        throw new Error("Launch and inject requires PTY launch mode.");
      }

      const context = useContextStore.getState().generatedContext;
      if (!context) {
        throw new Error("Generate context before launch and inject.");
      }

      const dimensions = terminalRef.current?.getDimensions() ?? {
        cols: 80,
        rows: 24,
      };

      terminalRef.current?.clear();
      clearTranscript();
      setInputBuffer("");
      writeLine(`Launching ${spec.name} in ${spec.workingDirectory}...`);
      writeLine(`Context will be injected after ${delayMs}ms.`);
      writeLine("");

      await startPtySession(
        spec.workingDirectory,
        dimensions.cols,
        dimensions.rows,
        spec.command,
        spec.args,
        spec.name,
        spec.adapterId,
        spec.name,
        selectedProject.name,
        selectedProject.path,
      );

      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
      await useSessionStore
        .getState()
        .writePtyInput(appendNewline ? `${context}\r` : context);
    },
    [
      activeTool.definition.id,
      activeTool.status,
      buildLaunchSpec,
      clearTranscript,
      selectedProject,
      sessionStatus,
      setInputBuffer,
      startPtySession,
      writeLine,
    ],
  );

  const handleStart = useCallback(async () => {
    if (sessionStatus === "starting" || sessionStatus === "active") {
      return;
    }

    const dimensions = terminalRef.current?.getDimensions() ?? { cols: 80, rows: 24 };
    const requestedPath = selectedProject?.path ?? "";

    terminalRef.current?.clear();
    clearTranscript();
    setInputBuffer("");

    try {
      await startPtySession(
        requestedPath,
        dimensions.cols,
        dimensions.rows,
        undefined,
        [],
        "Shell",
        undefined,
        undefined,
        selectedProject?.name,
        selectedProject?.path,
      );
      terminalRef.current?.focus();
    } catch (error) {
      writeLine(`Failed to start PTY session: ${String(error)}`);
    }
  }, [
    clearTranscript,
    selectedProject,
    sessionStatus,
    setInputBuffer,
    startPtySession,
    writeLine,
  ]);

  const executeLaunchSpec = useCallback(
    async (spec: ToolLaunchSpec) => {
      const dimensions = terminalRef.current?.getDimensions() ?? {
        cols: 80,
        rows: 24,
      };

      terminalRef.current?.clear();
      clearTranscript();
      setInputBuffer("");
      writeLine(`Launching ${spec.name} in ${spec.workingDirectory}...`);
      if (spec.warnings.length > 0) {
        spec.warnings.forEach((warning) => writeLine(`Warning: ${warning}`));
      }
      writeLine("");

      try {
        await startPtySession(
          spec.workingDirectory,
          dimensions.cols,
          dimensions.rows,
          spec.command,
          spec.args,
          spec.name,
          spec.adapterId,
          spec.name,
          selectedProject?.name,
          selectedProject?.path,
        );
        terminalRef.current?.focus();
      } catch (error) {
        writeLine(`Failed to launch tool: ${String(error)}`);
      }
    },
    [clearTranscript, setInputBuffer, startPtySession, writeLine],
  );

  const handleLaunchTool = useCallback(async () => {
    if (!selectedProject) {
      writeLine("Open a project folder before launching a tool.");
      return;
    }

    if (sessionStatus === "starting" || sessionStatus === "active") {
      if (activeRunningToolId) {
        writeLine(
          `A session is already active for ${activeRunningToolName ?? "Shell"}. Stop it before launching another tool.`,
        );
        return;
      }

      try {
        await stopPtySession();
      } catch (error) {
        writeLine(`Failed to stop shell before launch: ${String(error)}`);
        return;
      }
    }

    if (activeTool.status !== "ready") {
      writeLine(
        `${activeTool.definition.name} is not detected. Install or configure the command before launching.`,
      );
      return;
    }

    const spec = await buildLaunchSpec(activeTool.definition.id, selectedProject.path);

    if (!spec) {
      writeLine("Unable to build launch spec for selected tool.");
      return;
    }

    if (spec.launchMode === "manual") {
      writeLine("Manual launch profile preview:");
      writeLine(spec.preview);
      spec.warnings.forEach((warning) => writeLine(`Warning: ${warning}`));
      return;
    }

    if (launchProfile.confirmBeforeLaunch) {
      setPendingLaunchSpec(spec);
      setLaunchConfirmOpen(true);
      return;
    }

    await executeLaunchSpec(spec);
  }, [
    activeTool.definition.id,
    activeTool.definition.name,
    activeTool.status,
    activeRunningToolId,
    activeRunningToolName,
    buildLaunchSpec,
    executeLaunchSpec,
    launchProfile.confirmBeforeLaunch,
    selectedProject,
    sessionStatus,
    stopPtySession,
    writeLine,
  ]);

  const handleStartDemo = useCallback(() => {
    if (!selectedProject || sessionStatus === "starting" || sessionStatus === "active") {
      return;
    }

    if (activationTimerRef.current) {
      window.clearTimeout(activationTimerRef.current);
    }

    clearTranscript();
    setInputBuffer("");
    startDemoSession(activeTool.definition.id, selectedProject.id);
    terminalRef.current?.clear();
    writeLine("SuperTerminal Demo Session");
    writeLine(`Tool: ${activeTool.definition.name}`);
    writeLine(`Project: ${selectedProject.name}`);
    writeLine(`Path: ${selectedProject.path}`);
    writeLine("");
    writeLine("This is a frontend-only terminal shell.");
    writeLine("Real PTY mode is available from Start Terminal.");
    writeLine("");

    activationTimerRef.current = window.setTimeout(() => {
      setStatus("active");
      writePrompt();
      terminalRef.current?.focus();
    }, 450);
  }, [
    activeTool.definition.id,
    activeTool.definition.name,
    clearTranscript,
    selectedProject,
    sessionStatus,
    setInputBuffer,
    setStatus,
    startDemoSession,
    writeLine,
    writePrompt,
  ]);

  const handleStop = useCallback(async () => {
    if (activationTimerRef.current) {
      window.clearTimeout(activationTimerRef.current);
      activationTimerRef.current = undefined;
    }

    if (mode === "pty") {
      try {
        await stopPtySession();
      } catch (error) {
        writeLine(`Failed to stop PTY session: ${String(error)}`);
      }
      return;
    }

    stopDemoSession();
    writeLine("");
    writeLine("Session stopped.");
  }, [mode, stopDemoSession, stopPtySession, writeLine]);

  const handleClear = useCallback(() => {
    terminalRef.current?.clear();
    clearTranscript();
    setInputBuffer("");

    if (mode === "demo" && sessionStatus === "active") {
      writePrompt();
    }
  }, [clearTranscript, mode, sessionStatus, setInputBuffer, writePrompt]);

  const handleFocus = useCallback(() => {
    terminalRef.current?.focus();
  }, []);

  const handleReady = useCallback(() => {
    setTerminalReady(true);
    terminalRef.current?.focus();
  }, []);

  const handleData = useCallback(
    (data: string) => {
      if (sessionStatus !== "active") {
        return;
      }

      if (mode === "pty") {
        void writePtyInput(data);
        return;
      }

      if (data === "\r") {
        const command = sanitizeInput(inputBuffer);
        terminalRef.current?.write(CRLF);
        writeLine(`Command captured locally: ${command || "(empty)"}`);
        writeLine("No execution happened. Demo mode is frontend-only.");
        writeLine("");
        setInputBuffer("");
        writePrompt();
        return;
      }

      if (data === "\u007f") {
        if (inputBuffer.length > 0) {
          setInputBuffer(inputBuffer.slice(0, -1));
          terminalRef.current?.write("\b \b");
        }
        return;
      }

      if (data >= " " && data !== "\u007f") {
        const cleanData = data.replace(/[\u0000-\u001f\u007f]/g, "");
        if (cleanData) {
          setInputBuffer(inputBuffer + cleanData);
          terminalRef.current?.write(cleanData);
        }
      }
    },
    [
      inputBuffer,
      mode,
      sessionStatus,
      setInputBuffer,
      writeLine,
      writePrompt,
      writePtyInput,
    ],
  );

  const handleResize = useCallback(
    (dimensions: { cols: number; rows: number }) => {
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }

      resizeTimerRef.current = window.setTimeout(() => {
        void resizePtySession(dimensions.cols, dimensions.rows);
      }, 120);
    },
    [resizePtySession],
  );

  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    async function subscribe() {
      try {
        const outputUnlisten = await listen<PtyOutputEvent>(
          "pty://output",
          (event) => {
            const state = useSessionStore.getState();
            if (
              state.mode === "pty" &&
              state.ptySession?.id === event.payload.sessionId
            ) {
              terminalRef.current?.write(event.payload.data);
              state.applyPtyOutput(event.payload.data);
            }
          },
        );
        const exitUnlisten = await listen<PtyExitEvent>("pty://exit", (event) => {
          const state = useSessionStore.getState();
          if (state.ptySession?.id === event.payload.sessionId) {
            terminalRef.current?.write(CRLF);
            terminalRef.current?.write(
              event.payload.status === "stopped"
                ? `Session stopped by SuperTerminal.${CRLF}`
                : `Session exited.${CRLF}`,
            );
            state.handlePtyExit(event.payload.status, event.payload.exitCode);
          }
        });
        const errorUnlisten = await listen<PtyErrorEvent>(
          "pty://error",
          (event) => {
            const state = useSessionStore.getState();
            if (state.ptySession?.id === event.payload.sessionId) {
              terminalRef.current?.write(
                `${CRLF}PTY error: ${event.payload.message}${CRLF}`,
              );
              state.setError(event.payload.message);
            }
          },
        );

        if (cancelled) {
          outputUnlisten();
          exitUnlisten();
          errorUnlisten();
          return;
        }

        unlisteners.push(outputUnlisten, exitUnlisten, errorUnlisten);
      } catch {
        terminalRef.current?.writeln(
          "Tauri event bridge is unavailable in this preview surface.",
        );
      }
    }

    void subscribe();

    return () => {
      cancelled = true;
      unlisteners.forEach((unlisten) => unlisten());
      if (activationTimerRef.current) {
        window.clearTimeout(activationTimerRef.current);
      }
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void loadToolSecrets(activeTool.definition.id);
  }, [activeTool.definition.id, loadToolSecrets]);

  useEffect(() => {
    if (
      terminalReady &&
      !autoStartedRef.current &&
      sessionStatus !== "starting" &&
      sessionStatus !== "active"
    ) {
      autoStartedRef.current = true;
      void handleStart();
    }
  }, [handleStart, sessionStatus, terminalReady]);

  useEffect(() => {
    if (lastToolIdRef.current && lastToolIdRef.current !== activeTool.definition.id) {
      writeLine("");
      writeLine(`Switched active tool to ${activeTool.definition.name}.`);
      if (mode === "demo" && sessionStatus === "active") {
        writePrompt();
      }
    }

    lastToolIdRef.current = activeTool.definition.id;
  }, [
    activeTool.definition.id,
    activeTool.definition.name,
    mode,
    sessionStatus,
    writeLine,
    writePrompt,
  ]);

  useEffect(() => {
    if (
      selectedProject &&
      lastProjectIdRef.current &&
      lastProjectIdRef.current !== selectedProject.id
    ) {
      writeLine("");
      writeLine(`Project changed to ${selectedProject.name}.`);
      if (mode === "demo" && sessionStatus === "active") {
        writePrompt();
      }
    }

    lastProjectIdRef.current = selectedProject?.id;
  }, [mode, selectedProject, sessionStatus, writeLine, writePrompt]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 p-5">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-violet-950 bg-[#160f2e] font-mono shadow-shell">
          <TerminalToolbar
            activeTool={activeTool}
            activeRunningToolName={activeRunningToolName}
            onClear={handleClear}
            onEditProfile={() => setProfileEditorOpen(true)}
            onLaunchTool={handleLaunchTool}
            onOpenContext={() => setContextPanelOpen(true)}
            onOpenHistory={() => setHistoryPanelOpen(true)}
            onStop={handleStop}
            project={selectedProject}
            status={sessionStatus}
          />

          <div className="min-h-0 flex-1">
            <XTermSurface
              onData={handleData}
              onReady={handleReady}
              onResize={handleResize}
              preferences={terminalPreferences}
              ref={terminalRef}
            />
          </div>

          <TerminalStatusBar
            activeRunningToolName={activeRunningToolName}
            activeTool={activeTool}
            cols={cols}
            mode={mode}
            project={selectedProject}
            rows={rows}
            sessionId={activeSessionId}
            shell={shell}
            status={sessionStatus}
            transcriptCaptureEnabled={historySettings.captureTranscript}
            workingDirectory={ptySession?.projectPath}
          />
        </div>
      </div>

      <ContextInjectionPanel
        onClose={() => setContextPanelOpen(false)}
        onLaunchAndInject={handleLaunchAndInjectContext}
        open={contextPanelOpen}
      />

      <SessionHistoryPanel
        onClose={() => setHistoryPanelOpen(false)}
        open={historyPanelOpen}
      />

      {profileEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-white p-5 shadow-shell">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  Edit launch profile
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Configure args and launch behavior for {activeTool.definition.name}.
                </p>
              </div>
              <Button
                aria-label="Close launch profile editor"
                onClick={() => setProfileEditorOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="mt-4">
              <LaunchProfileEditor compact tool={activeTool} />
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setProfileEditorOpen(false)} variant="primary">
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {launchConfirmOpen && pendingLaunchSpec ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-white p-5 shadow-shell">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  Launch {pendingLaunchSpec.name} in SuperTerminal?
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  SuperTerminal will start this tool in a local PTY session.
                </p>
              </div>
              <Button
                aria-label="Close launch confirmation"
                onClick={() => setLaunchConfirmOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Command
                </div>
                <pre className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-slate-50 p-3 font-mono text-xs text-slate-800">
                  {[pendingLaunchSpec.command, ...pendingLaunchSpec.args].join(" ")}
                </pre>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Working directory
                </div>
                <div className="mt-1 rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                  {pendingLaunchSpec.workingDirectory}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600">
                No prompt or project context will be injected in this phase.
              </div>
              {pendingLaunchSpec.environmentNames?.length ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Environment
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-slate-50 p-3 font-mono text-xs text-slate-800">
                    {pendingLaunchSpec.environmentNames
                      .map((name) => `${name}=********`)
                      .join("\n")}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                onClick={() => setLaunchConfirmOpen(false)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const spec = pendingLaunchSpec;
                  setLaunchConfirmOpen(false);
                  setPendingLaunchSpec(undefined);
                  void executeLaunchSpec(spec);
                }}
                variant="primary"
              >
                Launch
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
