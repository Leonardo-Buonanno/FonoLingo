import { createContext, useContext } from "react";

import type { Config, StudyState } from "../types";

export const empty = (): StudyState => ({
  profile: { name: "", semester: "1º semestre", goal: 10 },
  history: [],
  active: null,
});

export function readState(key: string): StudyState {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "null");
    return s && Array.isArray(s.history) && s.profile && "active" in s
      ? s
      : empty();
  } catch {
    return empty();
  }
}

export async function api(url: string, body?: unknown, method = "POST") {
  const res = await fetch("/api/" + url, {
    method: body === undefined ? "GET" : method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => {
    throw new Error(
      "O servidor está indisponível. Tente novamente em instantes.",
    );
  });
  if (!res.ok)
    throw new Error(data.error || "Não foi possível completar a ação.");
  return data;
}

export const initialConfig: Config = {
  topic: "",
  mode: "Aprender",
  count: 10,
  difficulty: "Médio",
  reviewConcepts: [],
  exclude: [],
};

export type AppContext = {
  state: StudyState;
  setState: React.Dispatch<React.SetStateAction<StudyState>>;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  ai: boolean;
  user: any;
  setUser: (user: any) => void;
  toast: (message: string) => void;
  startTopic: (topic: string, mode?: string) => void;
  authReady: boolean;
};

export const Context = createContext<AppContext>(null!);

export const useApp = () => useContext(Context);
