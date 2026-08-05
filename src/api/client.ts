import { getLearnerToken } from '@/lib/learner-auth-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    // Anexa o token do aluno automaticamente quando existir, em vez de cada
    // uma das dezenas de chamadas de API precisar passar isso na mão — um
    // header explícito em `options` (ex: o token do instrutor) continua
    // sobrescrevendo, já que é espalhado por último.
    const learnerToken = await getLearnerToken();
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(learnerToken ? { Authorization: `Bearer ${learnerToken}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  if (!response.ok) {
    throw new ApiError(`O servidor respondeu com um erro (${response.status}).`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
};
