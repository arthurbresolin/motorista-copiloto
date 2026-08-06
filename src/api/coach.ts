import { api } from '@/api/client';

export type CoachFeedback = {
  available: boolean;
  message: string | null;
};

export type PracticeSessionFeedbackEntry = {
  id: number;
  practice_session_id: number;
  kind: 'text' | 'photo';
  message: string;
  photo_url: string | null;
  created_at: string;
};

export const getPracticeSessionFeedback = (practiceSessionId: number) =>
  api.get<CoachFeedback>(`/coach/practice-sessions/${practiceSessionId}/feedback`);

export const getPracticeSessionPhotoFeedback = (
  practiceSessionId: number,
  input: { image_base64: string; media_type: string },
) => api.post<CoachFeedback>(`/coach/practice-sessions/${practiceSessionId}/photo-feedback`, input);

export const getPracticeSessionFeedbackHistory = (practiceSessionId: number) =>
  api.get<PracticeSessionFeedbackEntry[]>(`/coach/practice-sessions/${practiceSessionId}/history`);

export const getFeedbackHistory = () => api.get<PracticeSessionFeedbackEntry[]>('/coach/history');
