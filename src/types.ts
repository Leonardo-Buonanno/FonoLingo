export type Question = {
  id: string;
  type: "choice" | "boolean" | "open" | "clinical" | "fill" | "image-hotspot";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  tip: string;
  concept: string;
  source: string;
  rubric: string[];
  image?: string;
  hotspot?: { x: number; y: number; radius: number };
};
export type Answer = {
  question: Question;
  response: string;
  score: number;
  feedback: string;
  selfAssessed: boolean;
};
export type Session = {
  id: string;
  topic: string;
  mode: string;
  difficulty: string;
  questions: Question[];
  answers: Answer[];
  started: number;
  finished?: number;
  xp?: number;
  provider: string;
  summary: string;
};
export type Profile = { name: string; semester: string; goal: number };
export type StudyState = {
  profile: Profile;
  history: Session[];
  active: Session | null;
};
export type Config = {
  topic: string;
  mode: string;
  count: number;
  difficulty: string;
  reviewConcepts: string[];
  exclude: string[];
};
