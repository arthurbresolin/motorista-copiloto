import { api } from '@/api/client';

export type PracticeSession = {
  id: number;
  practiced_at: string;
  duration_minutes: number;
  distance_km: number;
  maneuvers: string[];
  notes: string | null;
  car_id: number | null;
};

export type PracticeSessionInput = {
  practiced_at: string;
  duration_minutes: number;
  distance_km: number;
  maneuvers: string[];
  notes: string | null;
  car_id: number | null;
};

export type PracticeSessionStats = {
  total_sessions: number;
  total_minutes: number;
  total_km: number;
};

export const createPracticeSession = (input: PracticeSessionInput) =>
  api.post<PracticeSession>('/practice-sessions', input);

export const getPracticeSessions = () => api.get<PracticeSession[]>('/practice-sessions');

export const getPracticeSessionStats = () =>
  api.get<PracticeSessionStats>('/practice-sessions/stats');
