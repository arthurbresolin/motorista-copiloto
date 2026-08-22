import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'instructor_access_token';

// expo-secure-store não roda na web — usamos localStorage lá, seguindo o
// mesmo padrão de Platform.OS já usado no resto do app pra diferenças
// nativo/web (ex: use-driving-monitor.ts, telas com Platform.select).
export async function getInstructorToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

export async function setInstructorToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, token);
}

export async function clearInstructorToken(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
