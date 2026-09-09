import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleCheck,
  Lightbulb,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { Session } from "../types";
import { weaknesses } from "../../shared/scoring.mjs";

import { useApp } from "../state/context";
import { Button, PageHeading } from "../components/ui";
import { api } from "../state/context";
import { categories, modeInfo } from "../state/catalog";
import { StudyInput } from "../components/StudyInput";

export function Study() {
  return (
    <div className="narrow">
      <PageHeading
        eyebrow="CADA PERGUNTA ABRE UM CAMINHO"
        title="Vamos aprender algo novo?"
        description="Conte o que estudou, o que precisa revisar ou qual dúvida quer resolver."
      />
      <div className="card study-page">
        <span className="icon-box purple">
          <Sparkles />
        </span>
        <h2>Seu próximo aprendizado começa aqui.</h2>
        <StudyInput />
        <div className="info-line">
          <ShieldCheck size={17} />
          <span>
            Conteúdos para estudo acadêmico. Casos clínicos são simulados.
          </span>
        </div>
      </div>
      <div className="section-heading">
        <h2>Ou siga sua curiosidade</h2>
      </div>
      <CategoryList />
    </div>
  );
}

export function CategoryList() {
  const { startTopic } = useApp();
  return (
    <div className="category-grid">
      {categories.map((c) => (
        <button
          className="card category-list-item"
          key={c.name}
          onClick={() => startTopic(c.topic)}
        >
          <span className={`icon-box ${c.color}`}>
            <c.icon />
          </span>
          <strong>{c.name}</strong>
          <ArrowRight size={17} />
        </button>
      ))}
    </div>
  );
}

export function Configure() {
  const { config, setConfig, ai, state, setState } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const data = await api("generate", config);
      const s: Session = {
        ...data,
        id: crypto.randomUUID(),
        mode: config.mode,
        difficulty: config.difficulty,
        answers: [],
        started: Date.now(),
      };
      setState((st) => ({ ...st, active: s }));
      if (config.mode === "Aprender") setReady(true);
      else navigate("/jogo");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (ready && state.active)
    return (
      <div className="narrow">
        <PageHeading
          eyebrow="PRIMEIRO, VAMOS ENTENDER"
          title={state.active.topic}
          description="Leia com calma. Depois, transforme o conteúdo em prática."
        />
        <div className="card lesson">
          <span className="icon-box purple">
            <BookOpen />
          </span>
          <h2>O essencial para começar</h2>
          <p>{state.active.summary}</p>
          <div className="info-line">
            <Lightbulb />
            <span>
              Ao responder, procure explicar a ideia com suas próprias palavras.
            </span>
          </div>
          <Button onClick={() => navigate("/jogo")}>
            Praticar o que aprendi
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  return (
    <div className="narrow">
      <button className="back-link" onClick={() => navigate("/estudar")}>
        <ArrowLeft size={16} />
        Escolher outro assunto
      </button>
      <PageHeading
        eyebrow="PREPARE SUA PRÓXIMA DESCOBERTA"
        title="Um desafio com a sua cara."
        description="Escolha como quer estudar. O aprendizado acontece no seu ritmo."
      />
      <div className="config-card card">
        <label className="field-label" htmlFor="topic">
          01 <span>O que vamos explorar?</span>
        </label>
        <input
          id="topic"
          className="text-input"
          value={config.topic}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              topic: e.target.value,
              reviewConcepts: [],
              exclude: [],
            }))
          }
          maxLength={1000}
          placeholder="Ex.: Estou estudando disfagia"
        />
        {config.reviewConcepts.length > 0 && (
          <div className="info-line">
            <Target size={18} />
            <span>Revisão focada: {config.reviewConcepts.join(", ")}</span>
          </div>
        )}
        <div className="field-label">
          02 <span>Como você quer aprender?</span>
        </div>
        <div className="mode-grid">
          {modeInfo.map(({ name, icon: Icon, text }) => (
            <button
              disabled={
                name === "Dificuldades" && !weaknesses(state.history).length
              }
              className={`mode-option ${config.mode === name ? "selected" : ""}`}
              key={name}
              onClick={() => {
                if (name === "Dificuldades") {
                  const w = weaknesses(state.history)[0];
                  setConfig((c) => ({
                    ...c,
                    mode: name,
                    topic: w.topic,
                    reviewConcepts: [w.concept],
                  }));
                } else setConfig((c) => ({ ...c, mode: name }));
              }}
            >
              <Icon size={23} />
              <strong>
                {name === "Clínico"
                  ? "Modo clínico"
                  : name === "Dificuldades"
                    ? "Treinar dificuldades"
                    : name}
              </strong>
              <span>{text}</span>
              {config.mode === name && (
                <CircleCheck className="selected-check" size={17} />
              )}
            </button>
          ))}
        </div>
        <div className="config-row">
          <div>
            <label className="field-label" htmlFor="count">
              03 <span>Quantos desafios?</span>
            </label>
            <div className="segmented">
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  className={config.count === n ? "selected" : ""}
                  onClick={() => setConfig((c) => ({ ...c, count: n }))}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="custom-count">
              <label htmlFor="count">Personalizar</label>
              <input
                id="count"
                type="number"
                min="1"
                max="15"
                value={config.count}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, count: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div>
            <div className="field-label">
              04 <span>Qual nível de desafio?</span>
            </div>
            <div className="segmented difficulty">
              {["Fácil", "Médio", "Difícil"].map((d, i) => (
                <button
                  key={d}
                  className={config.difficulty === d ? "selected" : ""}
                  onClick={() => setConfig((c) => ({ ...c, difficulty: d }))}
                >
                  <span className={`difficulty-dot level-${i}`} />
                  {d}
                </button>
              ))}
            </div>
            <p className="field-hint">
              {config.difficulty === "Fácil"
                ? "Reconheça conceitos e construa sua base."
                : config.difficulty === "Médio"
                  ? "Conecte conceitos e aplique o que aprendeu."
                  : "Analise situações e justifique seu raciocínio."}
            </p>
          </div>
        </div>
        <div className="generation-info">
          <Sparkles size={20} />
          <p>
            {ai
              ? "A IA vai preparar uma sessão personalizada. Conteúdo gerado requer leitura crítica."
              : "A geração está indisponível. O administrador precisa configurar a IA no servidor."}
          </p>
        </div>
        {state.active && (
          <p className="field-hint">
            Iniciar um novo desafio substitui a sessão em andamento.
          </p>
        )}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <Button
          disabled={
            busy ||
            !ai ||
            config.topic.trim().length < 2 ||
            config.count < 1 ||
            config.count > 15
          }
          onClick={start}
          className="full-width"
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={19} />
              Preparando suas descobertas…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Começar meu desafio
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
