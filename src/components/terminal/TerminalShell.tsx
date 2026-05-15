import { useCallback, useEffect, useRef } from "react";
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

const CRLF = "\r\n";

function sanitizeInput(input: string) {
  return input.replace(/\r/g, "").replace(/\n/g, "");
}

export function TerminalShell() {
  const terminalRef = useRef<XTermSurfaceHandle>(null);
  const activationTimerRef = useRef<number>();
  const lastToolIdRef = useRef<string>();
  const lastProjectIdRef = useRef<string>();

  const selectedProject = useProjectStore((state) => state.selectedProject);
  const tools = useToolStore((state) => state.tools);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const inputBuffer = useSessionStore((state) => state.inputBuffer);
  const startDemoSession = useSessionStore((state) => state.startDemoSession);
  const stopDemoSession = useSessionStore((state) => state.stopDemoSession);
  const setStatus = useSessionStore((state) => state.setStatus);
  const appendTranscript = useSessionStore((state) => state.appendTranscript);
  const clearTranscript = useSessionStore((state) => state.clearTranscript);
  const setInputBuffer = useSessionStore((state) => state.setInputBuffer);

  const writePrompt = useCallback(() => {
    terminalRef.current?.write(`${activeTool.defaultCommand}> `);
  }, [activeTool.defaultCommand]);

  const writeLine = useCallback(
    (line = "") => {
      terminalRef.current?.write(`${line}${CRLF}`);
      appendTranscript(line);
    },
    [appendTranscript],
  );

  const handleStart = useCallback(() => {
    if (!selectedProject || sessionStatus === "starting" || sessionStatus === "active") {
      return;
    }

    if (activationTimerRef.current) {
      window.clearTimeout(activationTimerRef.current);
    }

    clearTranscript();
    setInputBuffer("");
    startDemoSession(activeTool.id, selectedProject.id);
    terminalRef.current?.clear();
    writeLine("SuperTerminal Demo Session");
    writeLine(`Tool: ${activeTool.name}`);
    writeLine(`Project: ${selectedProject.name}`);
    writeLine(`Path: ${selectedProject.path}`);
    writeLine("");
    writeLine("This is a frontend-only terminal shell.");
    writeLine("Real PTY execution will be added in Phase 3.");
    writeLine("");

    activationTimerRef.current = window.setTimeout(() => {
      setStatus("active");
      writePrompt();
      terminalRef.current?.focus();
    }, 450);
  }, [
    activeTool.id,
    activeTool.name,
    clearTranscript,
    selectedProject,
    sessionStatus,
    setInputBuffer,
    setStatus,
    startDemoSession,
    writeLine,
    writePrompt,
  ]);

  const handleStop = useCallback(() => {
    if (activationTimerRef.current) {
      window.clearTimeout(activationTimerRef.current);
      activationTimerRef.current = undefined;
    }

    stopDemoSession();
    writeLine("");
    writeLine("Session stopped.");
  }, [stopDemoSession, writeLine]);

  const handleClear = useCallback(() => {
    terminalRef.current?.clear();
    clearTranscript();
    setInputBuffer("");

    if (sessionStatus === "active") {
      writePrompt();
    }
  }, [clearTranscript, sessionStatus, setInputBuffer, writePrompt]);

  const handleFocus = useCallback(() => {
    terminalRef.current?.focus();
  }, []);

  const handleReady = useCallback(() => {
    terminalRef.current?.writeln("SuperTerminal terminal shell ready.");
    terminalRef.current?.writeln("Open a project and start a demo session.");
    terminalRef.current?.writeln("No commands execute in Phase 2.");
    terminalRef.current?.writeln("");
  }, []);

  const handleData = useCallback(
    (data: string) => {
      if (sessionStatus !== "active") {
        return;
      }

      if (data === "\r") {
        const command = sanitizeInput(inputBuffer);
        terminalRef.current?.write(CRLF);
        writeLine(`Command captured locally: ${command || "(empty)"}`);
        writeLine("No execution happened. PTY backend is not connected yet.");
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
    [inputBuffer, sessionStatus, setInputBuffer, writeLine, writePrompt],
  );

  useEffect(() => {
    return () => {
      if (activationTimerRef.current) {
        window.clearTimeout(activationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (lastToolIdRef.current && lastToolIdRef.current !== activeTool.id) {
      writeLine("");
      writeLine(
        `Switched active tool to ${activeTool.name}. Existing demo session is frontend-only.`,
      );
      if (sessionStatus === "active") {
        writePrompt();
      }
    }

    lastToolIdRef.current = activeTool.id;
  }, [activeTool.id, activeTool.name, sessionStatus, writeLine, writePrompt]);

  useEffect(() => {
    if (
      selectedProject &&
      lastProjectIdRef.current &&
      lastProjectIdRef.current !== selectedProject.id
    ) {
      writeLine("");
      writeLine(`Project changed to ${selectedProject.name}.`);
      if (sessionStatus === "active") {
        writePrompt();
      }
    }

    lastProjectIdRef.current = selectedProject?.id;
  }, [selectedProject, sessionStatus, writeLine, writePrompt]);

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
            Demo frontend terminal shell. PTY backend is not connected yet.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-5">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-shell">
          <TerminalToolbar
            activeTool={activeTool}
            onClear={handleClear}
            onFocus={handleFocus}
            onStart={handleStart}
            onStop={handleStop}
            project={selectedProject}
            status={sessionStatus}
          />

          {selectedProject ? (
            <div className="min-h-0 flex-1">
              <XTermSurface
                onData={handleData}
                onReady={handleReady}
                ref={terminalRef}
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#0b1019] px-8 text-center">
              <TerminalSquare className="h-10 w-10 text-slate-600" aria-hidden />
              <div className="mt-4 text-lg font-semibold text-white">
                Open a project folder to start a SuperTerminal session.
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                The terminal shell is ready, but demo sessions need local project
                context. No commands execute in this phase.
              </p>
              <Button className="mt-5" disabled variant="secondary">
                Start disabled until project is open
              </Button>
            </div>
          )}

          <TerminalStatusBar activeTool={activeTool} project={selectedProject} />
        </div>
      </div>
    </section>
  );
}
