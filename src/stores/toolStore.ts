import { create } from "zustand";
import { mockTools } from "@/lib/mockData";
import type { ToolDefinition, ToolStatus } from "@/lib/types";

type ToolState = {
  tools: ToolDefinition[];
  activeToolId: string;
  setActiveTool: (toolId: string) => void;
  markToolStatus: (toolId: string, status: ToolStatus) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  tools: mockTools,
  activeToolId: mockTools[0].id,
  setActiveTool: (toolId) => set({ activeToolId: toolId }),
  markToolStatus: (toolId, status) =>
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.id === toolId ? { ...tool, status } : tool,
      ),
    })),
}));
