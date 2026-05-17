import { KeyRound, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSecretEnvStore } from "@/stores/secretEnvStore";
import type { ToolAdapterState } from "@/lib/types";

type ToolEnvironmentEditorProps = {
  tool: ToolAdapterState;
};

const suggestionsByTool: Record<string, string[]> = {
  codex: ["OPENAI_API_KEY"],
  claude: ["ANTHROPIC_API_KEY"],
  grok: ["GROK_API_KEY"],
  opencode: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY"],
  openclaude: ["ANTHROPIC_API_KEY", "OPENROUTER_API_KEY"],
  generic: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY"],
};

export function ToolEnvironmentEditor({ tool }: ToolEnvironmentEditorProps) {
  const records = useSecretEnvStore(
    (state) => state.recordsByToolId[tool.definition.id] ?? [],
  );
  const isSaving = useSecretEnvStore((state) => state.isSaving);
  const error = useSecretEnvStore((state) => state.error);
  const loadToolSecrets = useSecretEnvStore((state) => state.loadToolSecrets);
  const saveToolSecret = useSecretEnvStore((state) => state.saveToolSecret);
  const deleteToolSecret = useSecretEnvStore((state) => state.deleteToolSecret);
  const setToolSecretEnabled = useSecretEnvStore(
    (state) => state.setToolSecretEnabled,
  );
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [enabled, setEnabled] = useState(true);

  const suggestions = useMemo(
    () => suggestionsByTool[tool.definition.id] ?? suggestionsByTool.generic,
    [tool.definition.id],
  );

  useEffect(() => {
    void loadToolSecrets(tool.definition.id);
  }, [loadToolSecrets, tool.definition.id]);

  const handleSave = async () => {
    const record = await saveToolSecret({
      toolId: tool.definition.id,
      name,
      value,
      enabled,
    });

    if (record) {
      setName("");
      setValue("");
      setEnabled(true);
    }
  };

  return (
    <div className="rounded-md border border-border bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 h-4 w-4 text-slate-500" aria-hidden />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Tool environment
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Secrets are stored locally in OS secure storage and passed only to
            this tool's launched process. Values are never shown again.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {records.length === 0 ? (
          <div className="rounded border border-border bg-white px-3 py-2 text-xs text-slate-500">
            No environment variables configured.
          </div>
        ) : (
          records.map((record) => (
            <div
              className="flex items-center justify-between gap-2 rounded border border-border bg-white px-3 py-2"
              key={record.id}
            >
              <label className="flex min-w-0 items-center gap-2 text-xs text-slate-700">
                <input
                  checked={record.enabled}
                  onChange={(event) =>
                    void setToolSecretEnabled(
                      tool.definition.id,
                      record.name,
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span className="truncate font-mono">
                  {record.name}=********
                </span>
              </label>
              <Button
                aria-label={`Delete ${record.name}`}
                onClick={() =>
                  void deleteToolSecret(tool.definition.id, record.name)
                }
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 grid gap-2 text-xs">
        <label>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Variable name
          </span>
          <input
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            list={`env-suggestions-${tool.definition.id}`}
            onChange={(event) => setName(event.target.value)}
            placeholder={suggestions[0] ?? "OPENAI_API_KEY"}
            value={name}
          />
          <datalist id={`env-suggestions-${tool.definition.id}`}>
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Secret value
          </span>
          <input
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste key, save, then this field clears"
            type="password"
            value={value}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          Enabled for tool launches
        </label>
        {error ? (
          <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </div>
        ) : null}
        <Button
          disabled={isSaving || !name.trim() || !value}
          onClick={() => void handleSave()}
          size="sm"
          variant="secondary"
        >
          Save Secret Env Var
        </Button>
      </div>
    </div>
  );
}
