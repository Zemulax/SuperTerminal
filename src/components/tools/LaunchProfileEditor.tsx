import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToolStore } from "@/stores/toolStore";
import type { ToolAdapterState } from "@/lib/types";

type LaunchProfileEditorProps = {
  tool: ToolAdapterState;
  compact?: boolean;
};

export function LaunchProfileEditor({
  tool,
  compact = false,
}: LaunchProfileEditorProps) {
  const getLaunchProfile = useToolStore((state) => state.getLaunchProfile);
  const profile = getLaunchProfile(tool.definition.id);
  const updateLaunchProfile = useToolStore((state) => state.updateLaunchProfile);
  const resetLaunchProfile = useToolStore((state) => state.resetLaunchProfile);

  return (
    <div className={compact ? "space-y-3" : "rounded-md border border-border bg-slate-50 p-3"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Launch profile
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            The executable comes from the adapter command override. Args are
            passed directly to the PTY process; no prompt or context is injected.
          </div>
        </div>
        <Button
          onClick={() => resetLaunchProfile(tool.definition.id)}
          size="sm"
          variant="ghost"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset Profile
        </Button>
      </div>

      <div className="mt-3 grid gap-3 text-xs">
        <div>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Command
          </span>
          <div className="mt-1 rounded-md border border-border bg-white px-3 py-2 font-mono text-slate-700">
            {profile.command || tool.resolvedCommand}
          </div>
        </div>

        <label>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Launch args
          </span>
          <input
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            onChange={(event) =>
              updateLaunchProfile(tool.definition.id, {
                rawArgs: event.target.value,
              })
            }
            placeholder="--help"
            value={profile.rawArgs}
          />
          <span className="mt-1 block text-[11px] leading-4 text-slate-500">
            Supports whitespace-separated args and simple quoted values.
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
              Launch mode
            </span>
            <select
              className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              onChange={(event) =>
                updateLaunchProfile(tool.definition.id, {
                  launchMode: event.target.value === "manual" ? "manual" : "pty",
                })
              }
              value={profile.launchMode}
            >
              <option value="pty">PTY</option>
              <option value="manual">Manual preview</option>
            </select>
          </label>

          <label>
            <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
              Working directory
            </span>
            <select
              className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              onChange={(event) =>
                updateLaunchProfile(tool.definition.id, {
                  workingDirectoryMode:
                    event.target.value === "home"
                      ? "home"
                      : event.target.value === "custom"
                        ? "custom"
                        : "project_root",
                })
              }
              value={profile.workingDirectoryMode}
            >
              <option value="project_root">Project root</option>
              <option value="home">Home directory</option>
              <option value="custom">Custom path</option>
            </select>
          </label>
        </div>

        {profile.workingDirectoryMode === "custom" ? (
          <label>
            <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
              Custom working directory
            </span>
            <input
              className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              onChange={(event) =>
                updateLaunchProfile(tool.definition.id, {
                  customWorkingDirectory: event.target.value,
                })
              }
              placeholder="C:\\Users\\dev\\project"
              value={profile.customWorkingDirectory ?? ""}
            />
          </label>
        ) : null}

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            checked={profile.confirmBeforeLaunch}
            className="h-4 w-4 rounded border-border"
            onChange={(event) =>
              updateLaunchProfile(tool.definition.id, {
                confirmBeforeLaunch: event.target.checked,
              })
            }
            type="checkbox"
          />
          Confirm before launching this tool
        </label>
      </div>
    </div>
  );
}
