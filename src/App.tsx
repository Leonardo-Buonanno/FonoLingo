import { useEffect, useRef, useState } from "react";
import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { CircleCheck, LoaderCircle, X } from "lucide-react";
import type { Config, StudyState } from "./types";

import { readState, api, initialConfig, Context, empty } from "./state/context";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { Study, Configure } from "./pages/Study";
import { Game } from "./pages/Game";
import {
  Results,
  Knowledge,
  Revision,
  StudyHistory,
  Achievements,
} from "./pages/Journey";
import { Profile, Login } from "./pages/Profile";
import { Library } from "./pages/Library";
import { reviewSchedule } from "../shared/scoring.mjs";

export default function App() {
  const [state, setState] = useState<StudyState>(empty);
  const [config, setConfig] = useState<Config>(initialConfig);
  const [ai, setAi] = useState(false);
  const [user, updateUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [notification, setNotification] = useState("");
  const [syncError, setSyncError] = useState("");
  const navigate = useNavigate();
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<any>(null);
  const syncedRef = useRef<string | null>(null);
  function withoutLegacyDemo(value: StudyState): StudyState {
    return {
      ...value,
      history: value.history.filter((session) => session.provider === "ai"),
      active: value.active?.provider === "ai" ? value.active : null,
    };
  }
  function restoreAccount(u: any, fallback: StudyState): StudyState {
    syncedRef.current = u.state ? JSON.stringify(u.state) : null;
    try {
      if (localStorage.getItem("fonolingo-pending-" + u.id))
        return withoutLegacyDemo(readState("fonolingo-user-" + u.id));
    } catch {
      /* The server remains the source when browser storage is unavailable. */
    }
    return withoutLegacyDemo(u.state || fallback);
  }
  function setUser(u: any) {
    if (saveRef.current) clearTimeout(saveRef.current);
    userRef.current = u;
    updateUser(u);
    if (u) {
      setState(
        restoreAccount(u, {
          ...readState("fonolingo-user-" + u.id),
          profile: { ...readState("fonolingo-user-" + u.id).profile, name: u.name },
        }),
      );
    } else setState(empty());
    setSyncError("");
  }
  useEffect(() => {
    let alive = true;
    try {
      localStorage.removeItem("fonolingo-guest");
    } catch {
      /* Browsers can disable local storage; server state remains available. */
    }
    Promise.allSettled([api("status"), api("me")]).then(([status, me]) => {
      if (!alive) return;
      if (status.status === "fulfilled") setAi(status.value.ai);
      if (me.status === "fulfilled" && me.value) {
        const u = me.value;
        userRef.current = u;
        updateUser(u);
        setState(
          restoreAccount(u, {
            ...readState("fonolingo-user-" + u.id),
            profile: {
              ...readState("fonolingo-user-" + u.id).profile,
              name: u.name,
            },
          }),
        );
      }
      setAuthReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!authReady) return;
    const serialized = JSON.stringify(state);
    try {
      if (user) localStorage.setItem("fonolingo-user-" + user.id, serialized);
    } catch {
      setSyncError(
        "Não foi possível salvar no navegador. Exporte seu progresso no perfil.",
      );
    }
    if (user && serialized !== syncedRef.current) {
      const id = user.id;
      try {
        localStorage.setItem("fonolingo-pending-" + id, serialized);
      } catch {
        /* Storage error is reported above. */
      }
      saveRef.current = setTimeout(() => {
        api("state", state, "PUT")
          .then(() => {
            if (userRef.current?.id === id) {
              syncedRef.current = serialized;
              setSyncError("");
              try {
                if (
                  localStorage.getItem("fonolingo-pending-" + id) === serialized
                )
                  localStorage.removeItem("fonolingo-pending-" + id);
              } catch {
                /* Keep local pending data if cleanup fails. */
              }
            }
          })
          .catch(() => {
            if (userRef.current?.id === id)
              setSyncError(
                "Progresso salvo neste navegador; sincronização indisponível. Tente novamente mais tarde.",
              );
          });
      }, 400);
    }
    return () => {
      if (saveRef.current) clearTimeout(saveRef.current);
    };
  }, [state, user, authReady]);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(""), 5000);
    return () => clearTimeout(timer);
  }, [notification]);
  useEffect(() => {
    if (
      !authReady ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    const due = reviewSchedule(state.history).filter((item) => item.due);
    const key = `fonolingo-reminder-${new Date().toLocaleDateString("sv-SE")}`;
    if (due.length && !localStorage.getItem(key)) {
      new Notification("Hora de revisar no FonoLingo", {
        body: `${due.length} ${due.length === 1 ? "conceito está" : "conceitos estão"} esperando por você.`,
        icon: "/favicon.svg",
      });
      localStorage.setItem(key, "sent");
    }
  }, [authReady, state.history]);
  function startTopic(topic: string, mode = "Aprender") {
    setConfig({
      ...initialConfig,
      topic,
      mode,
      count: mode === "Revisar" ? 5 : 10,
    });
    navigate("/configurar");
  }
  return (
    <Context.Provider
      value={{
        state,
        setState,
        config,
        setConfig,
        ai,
        user,
        setUser,
        toast: setNotification,
        startTopic,
        authReady,
      }}
    >
      <a href="#main-content" className="skip-link">
        Ir para o conteúdo
      </a>
      <Shell>
        {syncError && (
          <div className="sync-warning" role="status">
            {syncError}
          </div>
        )}
        {!authReady ? (
          <div className="loading-state" role="status">
            <LoaderCircle className="spin" />
            Preparando seu espaço…
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="*" element={user ? (
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/estudar" element={<Study />} />
                <Route path="/configurar" element={<Configure />} />
                <Route path="/jogo" element={<Game />} />
                <Route path="/resultado" element={<Results />} />
                <Route path="/progresso" element={<Knowledge />} />
                <Route path="/revisao" element={<Revision />} />
                <Route path="/historico" element={<StudyHistory />} />
                <Route path="/conquistas" element={<Achievements />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            ) : <Navigate to="/login" replace />} />
          </Routes>
        )}
      </Shell>
      {notification && (
        <div className="toast" role="status">
          <CircleCheck size={20} />
          <span>{notification}</span>
          <button
            aria-label="Fechar mensagem"
            onClick={() => setNotification("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
