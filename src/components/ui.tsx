import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Brain,
  Sparkles,
} from "lucide-react";
import type { Question } from "../types";

export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${secondary ? "btn secondary" : "btn"} ${className}`}
    >
      {children}
    </button>
  );
}

export function Tag({
  children,
  color = "purple",
}: {
  children: ReactNode;
  color?: string;
}) {
  return <span className={`tag ${color}`}>{children}</span>;
}

export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Progresso de aprendizagem"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: Math.min(100, value) + "%" }} />
    </div>
  );
}

export function Empty({
  icon: Icon = BookOpen,
  title,
  description,
  action = "Começar a estudar",
  onClick,
}: {
  icon?: typeof BookOpen;
  title: string;
  description: string;
  action?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="empty card">
      <span className="icon-box purple">
        <Icon size={28} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button onClick={onClick || (() => navigate("/estudar"))}>
        {action}
        <ArrowRight size={17} />
      </Button>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function Brand() {
  return (
    <Link className="brand" to="/dashboard" aria-label="FonoLingo — início">
      <span className="brand-mark">
        <AudioLines size={25} />
      </span>
      <span>
        fono<span className="brand-light">lingo</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function BrainArt() {
  return (
    <div className="brain-art" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="brain-glow" />
      <div className="brain-core">
        <Brain size={110} strokeWidth={1.15} />
      </div>
      <span className="orbit-item item-book">
        <BookOpen size={24} />
      </span>
      <span className="orbit-item item-star">
        <Sparkles size={25} />
      </span>
      <span className="orbit-item item-audio">
        <AudioLines size={25} />
      </span>
      <span className="orbit-dot dot-one" />
      <span className="orbit-dot dot-two" />
      <span className="art-caption">
        <span /> CONECTE. APRENDA. EVOLUA.
      </span>
    </div>
  );
}

export function Source({ question }: { question: Question }) {
  if (question.source.includes("CC BY 4.0"))
    return (
      <span className="source-link">
        <BookOpen size={14} />
        Fonte: {question.source}
      </span>
    );
  return question.source.startsWith("https://www.asha.org/") ? (
    <a
      className="source-link"
      href={question.source}
      target="_blank"
      rel="noreferrer"
    >
      <BookOpen size={14} />
      Fonte: ASHA Practice Portal ↗
    </a>
  ) : (
    <span className="field-hint">
      Referência não verificada · conteúdo gerado por IA
    </span>
  );
}
