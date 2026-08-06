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

export type ThemePreference = 'light' | 'dark' | 'system';

export type Learner = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  theme_preference: ThemePreference | null;
  notifications_enabled: boolean;
};

export type LearnerUpdateInput = Partial<{
  name: string | null;
  username: string | null;
  display_name: string | null;
  theme_preference: ThemePreference;
  notifications_enabled: boolean;
}>;

export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

export type MessageResponse = {
  message: string;
};

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

export const registerLearner = (input: LearnerRegisterInput) =>
  api.post<LearnerAuth>('/learners/register', input);

export const loginLearner = (input: LearnerLoginInput) =>
  api.post<LearnerAuth>('/learners/login', input);

export const getLearnerProfile = () => api.get<Learner>('/learners/me');

export const updateLearnerProfile = (input: LearnerUpdateInput) =>
  api.patch<Learner>('/learners/me', input);

export const changeLearnerPassword = (input: ChangePasswordInput) =>
  api.post<MessageResponse>('/learners/me/change-password', input);

export const uploadLearnerAvatar = (image: PickedImage) => {
  const formData = new FormData();
  // React Native aceita esse formato de objeto (uri/name/type) no FormData —
  // não é o Blob/File do DOM, mas é o padrão usado pelo Expo pra upload.
  formData.append('file', image as unknown as Blob);
  return api.postForm<Learner>('/learners/me/avatar', formData);
};

export const deleteLearnerAccount = () => api.delete<MessageResponse>('/learners/me');

export const requestPasswordReset = (email: string) =>
  api.post<MessageResponse>('/learners/password-reset/request', { email });

export const confirmPasswordReset = (token: string, newPassword: string) =>
  api.post<MessageResponse>('/learners/password-reset/confirm', {
    token,
    new_password: newPassword,
  });
