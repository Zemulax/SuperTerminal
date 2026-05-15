import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import type { ProjectFileNode } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

type FileTreeNodeProps = {
  node: ProjectFileNode;
  depth?: number;
};

function FileIcon({ node }: { node: ProjectFileNode }) {
  if (node.nodeType === "directory") {
    return <Folder className="h-4 w-4 text-slate-500" aria-hidden />;
  }

  if (
    node.extension &&
    ["ts", "tsx", "js", "jsx", "rs", "py", "cs"].includes(node.extension)
  ) {
    return <FileCode2 className="h-4 w-4 text-cyan-600" aria-hidden />;
  }

  return <FileText className="h-4 w-4 text-slate-400" aria-hidden />;
}

export function FileTreeNode({ node, depth = 0 }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const selectFile = useProjectStore((state) => state.selectFile);
  const loadFilePreview = useProjectStore((state) => state.loadFilePreview);
  const isDirectory = node.nodeType === "directory";
  const isSelected = selectedFile?.path === node.path;
  const childCount = node.children?.length ?? 0;

  const handleClick = () => {
    if (isDirectory) {
      setExpanded((value) => !value);
      return;
    }

    selectFile(node);
    void loadFilePreview(node);
  };

  return (
    <div>
      <button
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-md pr-2 text-left text-sm transition-colors",
          isSelected
            ? "bg-slate-950 text-white"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        title={node.relativePath}
        type="button"
      >
        {isDirectory ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isDirectory && expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        ) : (
          <span className="shrink-0">
            <FileIcon node={node} />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {isDirectory ? (
          <span className="shrink-0 text-[10px] text-slate-400">{childCount}</span>
        ) : (
          <span
            className={cn(
              "hidden shrink-0 font-mono text-[10px] md:inline",
              isSelected ? "text-slate-300" : "text-slate-400",
            )}
          >
            {formatBytes(node.sizeBytes)}
          </span>
        )}
      </button>

      {isDirectory && expanded ? (
        <div>
          {node.children && node.children.length > 0 ? (
            node.children.map((child) => (
              <FileTreeNode key={child.path} depth={depth + 1} node={child} />
            ))
          ) : (
            <div
              className="flex h-7 items-center text-xs text-slate-400"
              style={{ paddingLeft: `${36 + depth * 14}px` }}
            >
              Empty or scan limit reached
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
