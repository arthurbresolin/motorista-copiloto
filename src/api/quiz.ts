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
};

export const getQuizQuestions = () => api.get<QuizQuestion[]>('/quiz/questions');

export const createQuizSession = (answers: QuizAnswer[]) =>
  api.post<QuizSession>('/quiz/sessions', { answers });

export const getQuizSessions = () => api.get<QuizSession[]>('/quiz/sessions');
