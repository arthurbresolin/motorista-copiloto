import { Platform } from 'react-native';

import { api } from '@/api/client';
import type { PickedImage } from '@/api/learners';

export type PracticeSession = {
  id: number;
  practiced_at: string;
  duration_minutes: number;
  distance_km: number;
  maneuvers: string[];
  notes: string | null;
  car_id: number | null;
  /** True quando veio do Modo Copiloto; só essas contam pra trilha. */
  guided: boolean;
  before_photo_url: string | null;
};

export type PracticeSessionInput = {
  practiced_at: string;
  duration_minutes: number;
  distance_km: number;
  maneuvers: string[];
  notes: string | null;
  car_id: number | null;
  /** Omitido = registro manual (diário de bordo), não conclui habilidade. */
  guided?: boolean;
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

export const uploadPracticeSessionBeforePhoto = async (sessionId: number, image: PickedImage) => {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(image.uri)).blob();
    formData.append('file', blob, image.name);
  } else {
    formData.append('file', image as unknown as Blob);
  }
  return api.postForm<PracticeSession>(`/practice-sessions/${sessionId}/before-photo`, formData);
};
