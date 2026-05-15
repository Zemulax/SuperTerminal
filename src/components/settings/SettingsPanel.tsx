import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/tools/ToolCard";
import { useToolStore } from "@/stores/toolStore";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

const sections = [
  {
    title: "Tool adapters",
    body: "Adapter definitions will map tools to detection, launch, and setup guidance.",
  },
  {
    title: "Terminal preferences",
    body: "Default shell, font size, scrollback, and terminal theme controls will live here later.",
  },
  {
    title: "PTY backend status",
    body: "Implemented as a single local shell session. Tool-specific launch adapters still come later.",
  },
  {
    title: "Install safety",
    body: "Install helpers will only run explicit user-approved commands.",
  },
  {
    title: "Transcript capture",
    body: "Terminal transcript capture is local-only demo state for now; persistence comes later.",
  },
  {
    title: "Session safety",
    body: "Confirm-before-close and active-session recovery settings will be added after the PTY MVP.",
  },
  {
    title: "Privacy/local-first",
    body: "SuperTerminal does not upload project code or manage external credentials.",
  },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const tools = useToolStore((state) => state.tools);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-xl flex-col border-l border-border bg-white shadow-shell">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <div className="text-sm font-semibold text-slate-950">Settings</div>
          <div className="text-xs text-slate-500">Phase 3 placeholders</div>
        </div>
        <Button aria-label="Close settings" onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-border pb-4">
              <h2 className="text-sm font-semibold text-slate-950">
                {section.title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-950">Mock tools</h2>
          <div className="mt-3 space-y-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
