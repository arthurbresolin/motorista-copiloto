import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'learner_access_token';

// Mesmo padrão de instructor-auth-storage.ts — SecureStore no nativo,
// localStorage na web (expo-secure-store não roda lá).
export async function getLearnerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

export async function setLearnerToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, token);
}

export async function clearLearnerToken(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
