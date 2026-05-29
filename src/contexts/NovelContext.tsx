import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import type { NovelProject } from "../types/novel";

interface NovelState {
  projects: NovelProject[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
}

type NovelAction =
  | { type: "SET_PROJECTS"; projects: NovelProject[] }
  | { type: "ADD_PROJECT"; project: NovelProject }
  | { type: "UPDATE_PROJECT"; project: NovelProject }
  | { type: "DELETE_PROJECT"; projectId: string }
  | { type: "SET_CURRENT_PROJECT"; projectId: string | null }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null };

const initialState: NovelState = {
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
};

function novelReducer(state: NovelState, action: NovelAction): NovelState {
  switch (action.type) {
    case "SET_PROJECTS":
      return { ...state, projects: action.projects };

    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.project] };

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.project.id ? action.project : p,
        ),
      };

    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.projectId),
      };

    case "SET_CURRENT_PROJECT":
      return { ...state, currentProjectId: action.projectId };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "SET_ERROR":
      return { ...state, error: action.error };

    default:
      return state;
  }
}

const NovelContext = createContext<{
  state: NovelState;
  dispatch: Dispatch<NovelAction>;
} | null>(null);

export function NovelProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(novelReducer, initialState);

  return (
    <NovelContext.Provider value={{ state, dispatch }}>
      {children}
    </NovelContext.Provider>
  );
}

export function useNovelContext() {
  const ctx = useContext(NovelContext);
  if (!ctx) {
    throw new Error("useNovelContext must be used within NovelProvider");
  }
  return ctx;
}

export const currentProject = (state: NovelState): NovelProject | null => {
  if (!state.currentProjectId) return null;
  return state.projects.find((p) => p.id === state.currentProjectId) ?? null;
};
