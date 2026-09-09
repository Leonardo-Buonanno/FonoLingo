import { useEffect, useRef, useState } from "react";

import { ArrowRight, Mic, PencilLine, Plus } from "lucide-react";

import { useApp } from "../state/context";

export function StudyInput({ compact = false }: { compact?: boolean }) {
  const { config, setConfig, startTopic, toast } = useApp();
  const [text, setText] = useState(config.topic);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  useEffect(() => () => recognitionRef.current?.abort(), []);
  function speak() {
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      toast(
        "A entrada por voz não está disponível neste navegador. Você pode digitar o tema.",
      );
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const r = new Recognition();
    recognitionRef.current = r;
    r.lang = "pt-BR";
    r.continuous = false;
    r.onresult = (e: any) => {
      setText(e.results[0][0].transcript);
    };
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      toast(
        "Não foi possível ouvir. Verifique a permissão do microfone ou digite seu tema.",
      );
    };
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }
  return (
    <form
      className={`study-input-wrap ${compact ? "compact" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 2) {
          toast("Escreva um assunto para começar.");
          return;
        }
        setConfig((c) => ({ ...c, reviewConcepts: [], exclude: [] }));
        startTopic(text);
      }}
    >
      <div className="study-input">
        <PencilLine size={20} />
        <input
          aria-label="O que você quer aprender hoje?"
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: Estou com dificuldade para entender disfagia..."
        />
        <button
          type="button"
          className={`voice-button ${listening ? "listening" : ""}`}
          onClick={speak}
          aria-label={listening ? "Parar gravação" : "Falar assunto"}
        >
          <Mic size={19} />
        </button>
        <button className="input-submit" type="submit">
          <span>Criar meu desafio</span>
          <ArrowRight size={19} />
        </button>
      </div>
      <div className="suggestions">
        <span>Uma ideia para começar:</span>
        {["Disfagia", "Afasias", "Anatomia da laringe"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setText(t);
              setConfig((c) => ({ ...c, topic: t }));
            }}
          >
            {t}
            <Plus size={12} />
          </button>
        ))}
      </div>
    </form>
  );
}
