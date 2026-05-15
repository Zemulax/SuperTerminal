import type { ProjectFileNode } from "@/lib/types";
import { FileTreeNode } from "@/components/project/FileTreeNode";

type FileTreeProps = {
  files: ProjectFileNode[];
};

export function FileTree({ files }: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      {files.map((node) => (
        <FileTreeNode key={node.path} node={node} />
      ))}
    </div>
  );
}
