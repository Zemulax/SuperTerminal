import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalStatusBar } from "@/components/terminal/TerminalStatusBar";
import { TerminalToolbar } from "@/components/terminal/TerminalToolbar";
import {
  XTermSurface,
  type XTermSurfaceHandle,
} from "@/components/terminal/XTermSurface";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import type { PtyErrorEvent, PtyExitEvent, PtyOutputEvent } from "@/lib/types";

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

  const selectedProject = useProjectStore((state) => state.selectedProject);
  const adapters = useToolStore((state) => state.adapters);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const buildLaunchSpec = useToolStore((state) => state.buildLaunchSpec);
  const activeTool =
    adapters.find((tool) => tool.definition.id === activeToolId) ?? adapters[0];
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const mode = useSessionStore((state) => state.mode);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const shell = useSessionStore((state) => state.shell);
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
  const setError = useSessionStore((state) => state.setError);
  const appendTranscript = useSessionStore((state) => state.appendTranscript);
  const clearTranscript = useSessionStore((state) => state.clearTranscript);
  const setInputBuffer = useSessionStore((state) => state.setInputBuffer);

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

  const handleStart = useCallback(async () => {
    if (!selectedProject || sessionStatus === "starting" || sessionStatus === "active") {
      return;
    }

    const dimensions = terminalRef.current?.getDimensions() ?? { cols: 80, rows: 24 };

    terminalRef.current?.clear();
    clearTranscript();
    setInputBuffer("");
    writeLine(`Starting local PTY session in ${selectedProject.path}...`);
    writeLine("SuperTerminal will not inject commands. You control this shell.");
    writeLine("");

    try {
      await startPtySession(selectedProject.path, dimensions.cols, dimensions.rows);
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

  const handleLaunchTool = useCallback(async () => {
    if (!selectedProject || sessionStatus === "starting" || sessionStatus === "active") {
      return;
    }

    const dimensions = terminalRef.current?.getDimensions() ?? { cols: 80, rows: 24 };
    const spec = await buildLaunchSpec(activeTool.definition.id, selectedProject.path);

    if (!spec) {
      writeLine("Unable to build launch spec for selected tool.");
      return;
    }

    terminalRef.current?.clear();
    clearTranscript();
    setInputBuffer("");
    writeLine(`Launching ${spec.name} inside SuperTerminal's local PTY...`);
    writeLine("No prompts or project context are injected in this phase.");
    writeLine("Launch preview:");
    writeLine(spec.preview);
    writeLine("");

    try {
      await startPtySession(
        selectedProject.path,
        dimensions.cols,
        dimensions.rows,
        spec.command,
        spec.args,
      );
      terminalRef.current?.focus();
    } catch (error) {
      writeLine(`Failed to launch tool: ${String(error)}`);
    }
  }, [
    activeTool.definition.id,
    buildLaunchSpec,
    clearTranscript,
    selectedProject,
    sessionStatus,
    setInputBuffer,
    startPtySession,
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
    terminalRef.current?.writeln("SuperTerminal PTY host ready.");
    terminalRef.current?.writeln("Open a project and click Start Terminal.");
    terminalRef.current?.writeln("A real local shell starts only after your click.");
    terminalRef.current?.writeln("");
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
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-slate-500" aria-hidden />
            <h1 className="truncate text-base font-semibold text-slate-950">
              Terminal
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real local PTY host. Shells start only after explicit user action.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-5">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-shell">
          <TerminalToolbar
            activeTool={activeTool}
            mode={mode}
            onClear={handleClear}
            onFocus={handleFocus}
            onLaunchTool={handleLaunchTool}
            onStart={handleStart}
            onStartDemo={handleStartDemo}
            onStop={handleStop}
            project={selectedProject}
            shell={shell}
            status={sessionStatus}
          />

          {selectedProject ? (
            <div className="min-h-0 flex-1">
              <XTermSurface
                onData={handleData}
                onReady={handleReady}
                onResize={handleResize}
                ref={terminalRef}
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#0b1019] px-8 text-center">
              <TerminalSquare className="h-10 w-10 text-slate-600" aria-hidden />
              <div className="mt-4 text-lg font-semibold text-white">
                Open a project folder before starting a terminal session.
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                The PTY host needs a local working directory. SuperTerminal will
                not start a shell on launch.
              </p>
              <Button className="mt-5" disabled variant="secondary">
                Start disabled until project is open
              </Button>
            </div>
          )}

          <TerminalStatusBar
            activeTool={activeTool}
            cols={cols}
            mode={mode}
            project={selectedProject}
            rows={rows}
            sessionId={activeSessionId}
            shell={shell}
            status={sessionStatus}
          />
        </div>
      </div>
    </section>
  );
}
