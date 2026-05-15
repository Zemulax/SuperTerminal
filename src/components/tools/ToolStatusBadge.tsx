import { Badge } from "@/components/ui/badge";
import type { ToolStatus } from "@/lib/types";

type ToolStatusBadgeProps = {
  status: ToolStatus;
};

export function ToolStatusBadge({ status }: ToolStatusBadgeProps) {
  return <Badge status={status} />;
}
