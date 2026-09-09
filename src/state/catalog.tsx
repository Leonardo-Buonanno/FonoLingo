import {
  Activity,
  AudioLines,
  BookOpen,
  Brain,
  Ear,
  MessageCircle,
  Mic,
  RotateCcw,
  Stethoscope,
  Target,
} from "lucide-react";

export const categories = [
  {
    name: "Linguagem",
    topic: "Afasias",
    description: "Da primeira palavra à comunicação",
    icon: MessageCircle,
    color: "purple",
    tag: "Expressão e compreensão",
  },
  {
    name: "Fala",
    topic: "Fonologia e articulação",
    description: "Os sons que conectam pessoas",
    icon: AudioLines,
    color: "orange",
    tag: "Articulação e fluência",
  },
  {
    name: "Voz",
    topic: "Anatomia da laringe",
    description: "Conheça cada possibilidade da voz",
    icon: Mic,
    color: "pink",
    tag: "Anatomia e fisiologia",
  },
  {
    name: "Audiologia",
    topic: "Avaliação audiológica",
    description: "Um universo para além de ouvir",
    icon: Ear,
    color: "blue",
    tag: "Audição e interpretação",
  },
  {
    name: "Motricidade orofacial",
    topic: "Disfagia",
    description: "Funções que fazem a vida acontecer",
    icon: Activity,
    color: "green",
    tag: "Motricidade e deglutição",
  },
  {
    name: "Neurofuncional",
    topic: "Neuroanatomia",
    description: "Explore as conexões do cérebro",
    icon: Brain,
    color: "yellow",
    tag: "Neurociência aplicada",
  },
];

export const modeInfo = [
  {
    name: "Aprender",
    icon: BookOpen,
    text: "Entenda o conteúdo e coloque em prática.",
  },
  { name: "Revisar", icon: RotateCcw, text: "Reative o que você já aprendeu." },
  {
    name: "Dificuldades",
    icon: Target,
    text: "Dê atenção ao que precisa de reforço.",
  },
  {
    name: "Clínico",
    icon: Stethoscope,
    text: "Conecte a teoria a casos simulados.",
  },
];
