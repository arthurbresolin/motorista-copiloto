import { api } from '@/api/client';

export type LearnerRegisterInput = {
  email: string;
  password: string;
  name: string | null;
};

export type LearnerLoginInput = {
  email: string;
  password: string;
};

export type LearnerAuth = {
  access_token: string;
  token_type: string;
};

export type Learner = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export const registerLearner = (input: LearnerRegisterInput) =>
  api.post<LearnerAuth>('/learners/register', input);

export const loginLearner = (input: LearnerLoginInput) =>
  api.post<LearnerAuth>('/learners/login', input);

export const getLearnerProfile = () => api.get<Learner>('/learners/me');
