import { api } from '@/api/client';
import type { ChecklistSession } from '@/api/checklist';
import type { MonitorSession } from '@/api/monitor-sessions';
import type { PracticeSession, PracticeSessionStats } from '@/api/practice-sessions';
import type { QuizPhase, QuizSession } from '@/api/quiz';

export type InstructorInvite = {
  token: string;
};

export type InstructorInviteStatus = {
  valid: boolean;
};

export type InstructorRegisterInput = {
  email: string;
  password: string;
  name: string | null;
};

export type InstructorLoginInput = {
  email: string;
  password: string;
};

export type InstructorAuth = {
  access_token: string;
  token_type: string;
};

export type Instructor = {
  id: number;
  email: string;
  name: string | null;
};

export type InstructorOverview = {
  practice_sessions: PracticeSession[];
  checklist_sessions: ChecklistSession[];
  monitor_sessions: MonitorSession[];
  quiz_sessions: QuizSession[];
  practice_stats: PracticeSessionStats;
};

export const createInstructorInvite = () => api.post<InstructorInvite>('/instructors/invites', {});

export const getInstructorInviteStatus = (token: string) =>
  api.get<InstructorInviteStatus>(`/instructors/invites/${encodeURIComponent(token)}`);

export const acceptInstructorInvite = (token: string, input: InstructorRegisterInput) =>
  api.post<InstructorAuth>(`/instructors/invites/${encodeURIComponent(token)}/accept`, input);

export const loginInstructor = (input: InstructorLoginInput) =>
  api.post<InstructorAuth>('/instructors/login', input);

function authHeaders(accessToken: string): RequestInit {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export const getInstructorProfile = (accessToken: string) =>
  api.get<Instructor>('/instructors/me', authHeaders(accessToken));

export const getInstructorOverview = (accessToken: string) =>
  api.get<InstructorOverview>('/instructors/overview', authHeaders(accessToken));

export const getInstructorQuizPhases = (accessToken: string) =>
  api.get<QuizPhase[]>('/instructors/quiz-phases', authHeaders(accessToken));
