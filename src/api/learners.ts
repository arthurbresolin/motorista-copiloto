import { Platform } from 'react-native';

import { api } from '@/api/client';

export type LearnerRegisterInput = {
  email: string;
  password: string;
  name: string | null;
};

export type LearnerLoginInput = {
  email: string;
  password: string;
  remember_me?: boolean;
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

export const uploadLearnerAvatar = async (image: PickedImage) => {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // Na web, expo-image-picker devolve uma blob:/data: URL, não um caminho de
    // arquivo — precisa buscar e converter num Blob de verdade antes de anexar,
    // já que o FormData do navegador não entende o formato {uri, name, type}.
    const blob = await (await fetch(image.uri)).blob();
    formData.append('file', blob, image.name);
  } else {
    // No nativo, esse formato de objeto (uri/name/type) é o padrão aceito
    // pelo FormData do React Native pra fazer upload de arquivo local.
    formData.append('file', image as unknown as Blob);
  }
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
