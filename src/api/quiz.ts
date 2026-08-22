import { api } from '@/api/client';

export type QuizQuestion = {
  id: number;
  prompt: string;
  options: string[];
  category: string | null;
};

export type QuizAnswer = {
  question_id: number;
  selected_index: number;
};

export type QuizSession = {
  id: number;
  completed_at: string;
  score: number;
  total_questions: number;
  category: string | null;
};

export type QuizPhase = {
  category: string | null;
  label: string;
  question_count: number;
  unlocked: boolean;
  best_score: number | null;
  best_total: number | null;
};

export const getQuizPhases = () => api.get<QuizPhase[]>('/quiz/phases');

export const getQuizQuestions = (category?: string) =>
  api.get<QuizQuestion[]>(
    category !== undefined ? `/quiz/questions?category=${encodeURIComponent(category)}` : '/quiz/questions',
  );

export const createQuizSession = (answers: QuizAnswer[], category?: string) =>
  api.post<QuizSession>('/quiz/sessions', { answers, category: category ?? null });

export const getQuizSessions = () => api.get<QuizSession[]>('/quiz/sessions');
