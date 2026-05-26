import { useEffect, useState } from "react";
import superterminalIcon from "@/assets/superterminal-icon.png";

type BootFallbackProps = {
  error?: unknown;
};

export function BootFallback({ error }: BootFallbackProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasError = Boolean(error);

  useEffect(() => {
    if (error) {
      console.error("SuperTerminal failed to start", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-shell">
        <div className="flex items-center gap-3">
          <img
            alt=""
            aria-hidden
            className="h-10 w-10 rounded-md"
            src={superterminalIcon}
          />
          <div>
            <h1 className="text-base font-semibold">
              {hasError ? "SuperTerminal could not load" : "Loading SuperTerminal"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {hasError
                ? "The app caught a startup error instead of leaving a blank window."
                : "Preparing the desktop shell."}
            </p>
          </div>
        </div>

        {hasError ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
            Restart the app once. If this screen returns, clear SuperTerminal local
            storage or share the details below.
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="h-9 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload App
          </button>
          {hasError ? (
            <>
              <button
                className="h-9 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  try {
                    window.localStorage.clear();
                  } catch {
                    // Ignore storage policy failures.
                  }
                  window.location.reload();
                }}
                type="button"
              >
                Clear Local State And Reload
              </button>
              <button
                className="h-9 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setDetailsOpen((value) => !value)}
                type="button"
              >
                {detailsOpen ? "Hide Details" : "Show Details"}
              </button>
            </>
          ) : null}
        </div>

        {detailsOpen ? (
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
            {error instanceof Error
              ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
              : String(error ?? "No error details available.")}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
