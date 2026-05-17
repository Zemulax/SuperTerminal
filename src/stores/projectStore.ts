import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { mockProject } from "@/lib/mockData";
import type {
  Project,
  ProjectFileNode,
  ProjectScanResult,
  TextFilePreview,
} from "@/lib/types";

type ProjectState = {
  selectedProject?: Project;
  selectedFile?: ProjectFileNode;
  filePreview?: TextFilePreview;
  mockProject: Project;
  isProjectOpen: boolean;
  isOpeningProject: boolean;
  isScanningProject: boolean;
  isLoadingPreview: boolean;
  error?: string;
  previewError?: string;
  openProjectWithPicker: () => Promise<void>;
  openProjectByPath: (path: string) => Promise<void>;
  scanProject: (path: string) => Promise<void>;
  selectFile: (file: ProjectFileNode) => void;
  loadFilePreview: (file: ProjectFileNode) => Promise<void>;
  loadMockProject: () => void;
  clearProject: () => void;
};

function projectFromScan(result: ProjectScanResult): Project {
  return {
    id: result.path,
    name: result.name,
    path: result.path,
    files: result.files,
    totalFiles: result.totalFiles,
    totalDirectories: result.totalDirectories,
    ignoredCount: result.ignoredCount,
    truncated: result.truncated,
  };
}

export const useProjectStore = create<ProjectState>((set) => ({
  selectedProject: undefined,
  selectedFile: undefined,
  filePreview: undefined,
  mockProject,
  isProjectOpen: false,
  isOpeningProject: false,
  isScanningProject: false,
  isLoadingPreview: false,
  error: undefined,
  previewError: undefined,
  openProjectWithPicker: async () => {
    set({ isOpeningProject: true, error: undefined, previewError: undefined });
    try {
      const pickedPath = await invoke<string | null>("pick_project_folder");
      if (!pickedPath) {
        set({ isOpeningProject: false });
        return;
      }

      await useProjectStore.getState().openProjectByPath(pickedPath);
    } catch (error) {
      set({
        isOpeningProject: false,
        isScanningProject: false,
        error: `${String(error)} Paste a path manually if needed.`,
      });
    }
  },
  openProjectByPath: async (path) => {
    const trimmedPath = path.trim();

    if (!trimmedPath) {
      set({ error: "Enter a local project folder path." });
      return;
    }

    set({
      isOpeningProject: true,
      isScanningProject: true,
      error: undefined,
      previewError: undefined,
    });

    try {
      const result = await invoke<ProjectScanResult>("open_project_folder", {
        path: trimmedPath,
      });
      set({
        selectedProject: projectFromScan(result),
        selectedFile: undefined,
        filePreview: undefined,
        isProjectOpen: true,
        isOpeningProject: false,
        isScanningProject: false,
        error: undefined,
        previewError: undefined,
      });
    } catch (error) {
      set({
        isOpeningProject: false,
        isScanningProject: false,
        error: String(error),
      });
    }
  },
  scanProject: async (path) => {
    set({
      isScanningProject: true,
      error: undefined,
      previewError: undefined,
    });

    try {
      const result = await invoke<ProjectScanResult>("scan_project_folder", {
        path,
      });
      set({
        selectedProject: projectFromScan(result),
        selectedFile: undefined,
        filePreview: undefined,
        isProjectOpen: true,
        isScanningProject: false,
        error: undefined,
      });
    } catch (error) {
      set({
        isScanningProject: false,
        error: String(error),
      });
    }
  },
  selectFile: (file) =>
    set({
      selectedFile: file,
      filePreview: undefined,
      previewError: undefined,
    }),
  loadFilePreview: async (file) => {
    if (file.nodeType !== "file") {
      return;
    }

    set({
      selectedFile: file,
      filePreview: undefined,
      previewError: undefined,
      isLoadingPreview: true,
    });

    try {
      const preview = await invoke<TextFilePreview>("read_text_file_preview", {
        path: file.path,
      });
      set({
        filePreview: preview,
        isLoadingPreview: false,
        previewError: undefined,
      });
    } catch (error) {
      set({
        filePreview: undefined,
        isLoadingPreview: false,
        previewError: String(error),
      });
    }
  },
  loadMockProject: () =>
    set({
      selectedProject: mockProject,
      selectedFile: undefined,
      filePreview: undefined,
      isProjectOpen: true,
      isOpeningProject: false,
      isScanningProject: false,
      error: undefined,
      previewError: undefined,
    }),
  clearProject: () =>
    set({
      selectedProject: undefined,
      selectedFile: undefined,
      filePreview: undefined,
      isProjectOpen: false,
      isOpeningProject: false,
      isScanningProject: false,
      isLoadingPreview: false,
      error: undefined,
      previewError: undefined,
    }),
}));
