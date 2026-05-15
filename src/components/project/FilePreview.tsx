import { FileSearch, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/projectStore";
import { formatBytes } from "@/lib/utils";

export function FilePreview() {
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const filePreview = useProjectStore((state) => state.filePreview);
  const isLoadingPreview = useProjectStore((state) => state.isLoadingPreview);
  const previewError = useProjectStore((state) => state.previewError);

  if (!selectedFile) {
    return (
      <div className="rounded-md border border-border bg-white p-3 text-sm text-slate-500">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <FileSearch className="h-4 w-4" aria-hidden />
          No file selected
        </div>
        <p className="mt-1 text-xs leading-5">
          Select a safe text file to inspect metadata and preview content.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 rounded-md border border-border bg-white">
      <div className="border-b border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-950">
              {selectedFile.name}
            </div>
            <div className="mt-1 truncate font-mono text-[11px] text-slate-500">
              {selectedFile.relativePath}
            </div>
          </div>
          <Badge>{selectedFile.extension ?? "file"}</Badge>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {formatBytes(selectedFile.sizeBytes)}
        </div>
      </div>

      <div className="max-h-56 overflow-auto p-3">
        {isLoadingPreview ? (
          <div className="text-xs text-slate-500">Loading preview...</div>
        ) : previewError ? (
          <div className="flex gap-2 text-xs leading-5 text-amber-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{previewError}</span>
          </div>
        ) : filePreview ? (
          <>
            {filePreview.truncated ? (
              <div className="mb-2 text-xs text-amber-700">
                Preview truncated at 100 KB.
              </div>
            ) : null}
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-slate-700">
              {filePreview.content}
            </pre>
          </>
        ) : (
          <div className="text-xs text-slate-500">Preview unavailable.</div>
        )}
      </div>
    </div>
  );
}
