import { api } from '@/api/client';

export type PracticeSession = {
  id: number;
  practiced_at: string;
  duration_minutes: number;
  distance_km: number;
  maneuvers: string[];
  notes: string | null;
};

export type PracticeSessionInput = {
  practiced_at: string;
  duration_minutes: number;
  distance_km: number;
  maneuvers: string[];
  notes: string | null;
};

export const createPracticeSession = (input: PracticeSessionInput) =>
  api.post<PracticeSession>('/practice-sessions', input);

export const getPracticeSessions = () => api.get<PracticeSession[]>('/practice-sessions');
