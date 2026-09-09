import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Lightbulb,
  LoaderCircle,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import type { Answer } from "../types";
import { sessionXp } from "../../shared/scoring.mjs";

import { useApp } from "../state/context";
import { Button, Tag, Progress, Empty, Source } from "../components/ui";
import { api } from "../state/context";

export const typeLabels = {
  choice: "Múltipla escolha",
  boolean: "Verdadeiro ou falso",
  open: "Responda e justifique",
  clinical: "Raciocínio clínico",
  fill: "Complete a frase",
  "image-hotspot": "Ache na imagem",
};

export function Game() {
  const { state, setState, ai } = useApp();
  const navigate = useNavigate();
  const s = state.active;
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<Answer | null>(null);
  const [rubric, setRubric] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [exit, setExit] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const question = s?.questions[s.answers.length];
  useEffect(() => {
    if (feedback || rubric)
      feedbackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [feedback, rubric]);
  if (!s || !question)
    return (
      <div className="narrow">
        <Empty
          title="Seu próximo desafio está esperando."
          description="Escolha um conteúdo e comece uma nova sessão."
        />
      </div>
    );
  const q = question;
  const open =
    q.type === "open" || (q.type === "clinical" && !q.options.length);
  function grade(score: number, message: string, selfAssessed = false) {
    setFeedback({
      question: q,
      response,
      score,
      feedback: message,
      selfAssessed,
    });
    setRubric(false);
  }
  async function submit() {
    setError("");
    if (open) {
      if (!ai) {
        setRubric(true);
        return;
      }
      setBusy(true);
      try {
        const result = await api("grade", { question: q, response });
        grade(result.score, result.feedback);
      } catch (e) {
        setError((e as Error).message);
        setRubric(true);
      } finally {
        setBusy(false);
      }
    } else if (q.type === "image-hotspot" && q.hotspot) {
      const [x, y] = response.split(",").map(Number);
      const distance = Math.hypot(x - q.hotspot.x, y - q.hotspot.y);
      grade(distance <= q.hotspot.radius ? 1 : 0, q.explanation);
    } else {
      const correct =
        response
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase()
          .replace(/[.!?]+$/, "") ===
        q.answer
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase()
          .replace(/[.!?]+$/, "");
      grade(correct ? 1 : 0, q.explanation);
    }
  }
  function next() {
    if (!feedback || !s) return;
    const answers = [...s.answers, feedback];
    if (answers.length === s.questions.length) {
      const complete = {
        ...s,
        answers,
        finished: Date.now(),
        xp: sessionXp(answers),
      };
      setState((st) => ({
        ...st,
        active: null,
        history: [complete, ...st.history.filter((h) => h.id !== s.id)].slice(
          0,
          200,
        ),
      }));
      navigate("/resultado");
    } else {
      setState((st) => ({ ...st, active: { ...s, answers } }));
      setFeedback(null);
      setResponse("");
      setRubric(false);
      window.scrollTo(0, 0);
    }
  }
  return (
    <div className="game-wrap">
      <div className="game-top">
        <button className="back-link" onClick={() => setExit(true)}>
          <X size={19} />
          Pausar
        </button>
        <span>{s.topic}</span>
        <Tag>
          <Zap size={13} />
          {sessionXp(s.answers)} XP
        </Tag>
      </div>
      <div className="game-progress">
        <Progress value={(s.answers.length / s.questions.length) * 100} />
        <span>
          {s.answers.length + 1} de {s.questions.length}
        </span>
      </div>
      <div className="question-card card">
        <div className="question-meta">
          <Tag>{typeLabels[q.type]}</Tag>
          <span>
            {s.difficulty} <span>·</span> {q.concept}
          </span>
        </div>
        <h1>{q.prompt}</h1>
        {q.type === "image-hotspot" && q.image && (
          <div
            className="hotspot-stage"
            onClick={(e) => {
              if (feedback) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setResponse(
                `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)},${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}`,
              );
            }}
            onKeyDown={(e) => {
              if (feedback || !e.key.startsWith("Arrow")) return;
              e.preventDefault();
              const [currentX, currentY] = response
                ? response.split(",").map(Number)
                : [50, 50];
              const step = e.shiftKey ? 5 : 1;
              const x = Math.min(
                100,
                Math.max(
                  0,
                  currentX +
                    (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0),
                ),
              );
              const y = Math.min(
                100,
                Math.max(
                  0,
                  currentY +
                    (e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0),
                ),
              );
              setResponse(`${x.toFixed(2)},${y.toFixed(2)}`);
            }}
            role="button"
            tabIndex={0}
            aria-label="Imagem interativa: clique ou use as setas para marcar a estrutura solicitada"
          >
            <img
              src={q.image}
              alt={`Ilustração anatômica para localizar ${q.answer}`}
            />
            {response &&
              (() => {
                const [x, y] = response.split(",");
                return (
                  <span
                    className="hotspot-choice"
                    style={{ left: x + "%", top: y + "%" }}
                  />
                );
              })()}
            {feedback && q.hotspot && (
              <span
                className="hotspot-answer"
                style={{
                  left: q.hotspot.x + "%",
                  top: q.hotspot.y + "%",
                  width: q.hotspot.radius * 2 + "%",
                  aspectRatio: "1",
                }}
              />
            )}
          </div>
        )}
        {q.type === "clinical" && (
          <p className="field-hint">Caso simulado para raciocínio acadêmico.</p>
        )}
        {q.type === "image-hotspot" ? null : q.options.length > 0 ? (
          <div className="answer-options">
            {q.options.map((option, i) => (
              <button
                disabled={!!feedback}
                key={option}
                className={`answer-option ${response === option ? "chosen" : ""} ${feedback && option === q.answer ? "correct" : ""} ${feedback && response === option && feedback.score === 0 ? "incorrect" : ""}`}
                onClick={() => setResponse(option)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
                {response === option && <CircleCheck size={20} />}
              </button>
            ))}
          </div>
        ) : (
          <>
            <label className="field-label" htmlFor="response">
              {open ? "Explique seu raciocínio" : "Sua resposta"}
            </label>
            {open ? (
              <textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                maxLength={5000}
                disabled={!!feedback || rubric}
                placeholder="Conecte os conceitos e justifique com suas palavras…"
                rows={5}
              />
            ) : (
              <input
                id="response"
                className="text-input"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                maxLength={200}
                disabled={!!feedback}
                placeholder="Complete a lacuna…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && response.trim() && !feedback)
                    submit();
                }}
              />
            )}
          </>
        )}
        {!feedback && !rubric && (
          <div className="question-actions">
            <span>
              <Lightbulb size={15} />
              Cada tentativa faz parte do aprendizado.
            </span>
            <Button disabled={!response.trim() || busy} onClick={submit}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Check size={18} />
              )}
              Conferir resposta
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {(feedback || rubric) && (
          <div
            ref={feedbackRef}
            className={`feedback-panel ${feedback?.score === 1 ? "success" : ""}`}
            aria-live="polite"
          >
            {rubric ? (
              <>
                <h2>
                  <BookOpen size={22} />
                  Compare seu raciocínio
                </h2>
                <p>
                  A avaliação automática não está disponível. Use estes
                  critérios para se autoavaliar:
                </p>
                <ul>
                  {q.rubric.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="field-hint">
                  Essa autoavaliação será identificada no seu histórico.
                </p>
                <div className="self-grade">
                  {[
                    [0, "Preciso revisar"],
                    [0.5, "Compreendi em parte"],
                    [1, "Contemplei os critérios"],
                  ].map(([score, label]) => (
                    <Button
                      secondary
                      key={score}
                      onClick={() => grade(Number(score), q.explanation, true)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              feedback && (
                <>
                  <h2>
                    {feedback.score === 1 ? (
                      <CircleCheck size={24} />
                    ) : (
                      <Lightbulb size={24} />
                    )}{" "}
                    {feedback.score === 1
                      ? "Uma nova conexão conquistada!"
                      : feedback.score === 0.5
                        ? "Você está no caminho."
                        : "Não exatamente. Vamos entender?"}
                  </h2>
                  {feedback.selfAssessed && (
                    <Tag color="orange">Autoavaliação</Tag>
                  )}
                  <div className="feedback-columns">
                    <div>
                      <h4>O que você respondeu</h4>
                      <p>{feedback.response}</p>
                    </div>
                    <div>
                      <h4>Resposta esperada</h4>
                      <p>{q.answer}</p>
                    </div>
                  </div>
                  <h4>Por quê?</h4>
                  <p>{feedback.feedback}</p>
                  <div className="tip">
                    <Lightbulb size={19} />
                    <p>
                      <strong>Uma dica para guardar</strong>
                      <br />
                      {q.tip}
                    </p>
                  </div>
                  <div className="feedback-bottom">
                    <Source question={q} />
                    <Button onClick={next}>
                      {s.answers.length + 1 === s.questions.length
                        ? "Ver minha evolução"
                        : "Próxima descoberta"}
                      <ArrowRight size={18} />
                    </Button>
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
      <p className="game-note">
        <ShieldCheck size={14} />
        Conteúdo gerado por IA, ainda sem revisão acadêmica.
      </p>
      {exit && (
        <div className="modal-backdrop">
          <div
            className="modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
          >
            <h2 id="pause-title">Uma pausa também faz parte.</h2>
            <p>
              As atividades já concluídas estão salvas. A resposta da atividade
              atual será descartada.
            </p>
            <div className="modal-actions">
              <Button secondary onClick={() => setExit(false)}>
                Continuar estudando
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Salvar e sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
