import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

export type XTermSurfaceHandle = {
  write: (value: string) => void;
  writeln: (value: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
  getDimensions: () => { cols: number; rows: number };
};

type XTermSurfaceProps = {
  onData?: (data: string) => void;
  onReady?: () => void;
  onResize?: (dimensions: { cols: number; rows: number }) => void;
};

export const XTermSurface = forwardRef<XTermSurfaceHandle, XTermSurfaceProps>(
  function XTermSurface({ onData, onReady, onResize }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal>();
    const fitAddonRef = useRef<FitAddon>();
    const onDataRef = useRef(onData);
    const onResizeRef = useRef(onResize);

    useEffect(() => {
      onDataRef.current = onData;
    }, [onData]);

    useEffect(() => {
      onResizeRef.current = onResize;
    }, [onResize]);

    useImperativeHandle(
      ref,
      () => ({
        write: (value) => terminalRef.current?.write(value),
        writeln: (value) => terminalRef.current?.writeln(value),
        clear: () => terminalRef.current?.clear(),
        focus: () => terminalRef.current?.focus(),
        fit: () => {
          try {
            fitAddonRef.current?.fit();
          } catch {
            // Fit can fail while the element is detached; the next resize will retry.
          }
        },
        getDimensions: () => ({
          cols: terminalRef.current?.cols ?? 80,
          rows: terminalRef.current?.rows ?? 24,
        }),
      }),
      [],
    );

    useEffect(() => {
      if (!containerRef.current) {
        return undefined;
      }

      containerRef.current.innerHTML = "";

      const terminal = new Terminal({
        allowProposedApi: false,
        convertEol: true,
        cursorBlink: true,
        cursorStyle: "bar",
        disableStdin: false,
        fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.35,
        scrollback: 2000,
        theme: {
          background: "#0b1019",
          foreground: "#d7dee9",
          cursor: "#67e8f9",
          selectionBackground: "#334155",
          black: "#020617",
          red: "#fb7185",
          green: "#34d399",
          yellow: "#fbbf24",
          blue: "#60a5fa",
          magenta: "#c084fc",
          cyan: "#22d3ee",
          white: "#e2e8f0",
          brightBlack: "#475569",
          brightRed: "#fda4af",
          brightGreen: "#86efac",
          brightYellow: "#fde68a",
          brightBlue: "#93c5fd",
          brightMagenta: "#d8b4fe",
          brightCyan: "#67e8f9",
          brightWhite: "#f8fafc",
        },
      });
      const fitAddon = new FitAddon();

      terminal.loadAddon(fitAddon);
      terminal.open(containerRef.current);
      terminal.onData((data) => onDataRef.current?.(data));
      terminal.onResize(({ cols, rows }) => onResizeRef.current?.({ cols, rows }));
      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      const fit = () => {
        try {
          fitAddon.fit();
        } catch {
          // Initial paint and teardown can race with ResizeObserver.
        }
      };

      const frame = requestAnimationFrame(() => {
        fit();
        onReady?.();
      });

      const resizeObserver = new ResizeObserver(() => fit());
      resizeObserver.observe(containerRef.current);
      window.addEventListener("resize", fit);

      return () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        window.removeEventListener("resize", fit);
        terminal.dispose();
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        terminalRef.current = undefined;
        fitAddonRef.current = undefined;
      };
    }, [onReady]);

    return (
      <div
        className="h-full min-h-0 w-full overflow-hidden bg-[#0b1019] px-4 py-3"
        ref={containerRef}
      />
    );
  },
);
