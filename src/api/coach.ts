import { api } from '@/api/client';

export type CoachFeedback = {
  available: boolean;
  message: string | null;
};

export const getPracticeSessionFeedback = (practiceSessionId: number) =>
  api.get<CoachFeedback>(`/coach/practice-sessions/${practiceSessionId}/feedback`);

export const getPracticeSessionPhotoFeedback = (
  practiceSessionId: number,
  input: { image_base64: string; media_type: string },
) => api.post<CoachFeedback>(`/coach/practice-sessions/${practiceSessionId}/photo-feedback`, input);
