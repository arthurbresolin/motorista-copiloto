import { api } from '@/api/client';

export type CoachFeedback = {
  available: boolean;
  message: string | null;
};

export const getPracticeSessionFeedback = (practiceSessionId: number) =>
  api.get<CoachFeedback>(`/coach/practice-sessions/${practiceSessionId}/feedback`);
