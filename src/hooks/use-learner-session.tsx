import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getLearnerProfile, updateLearnerProfile, type Learner, type ThemePreference } from '@/api/learners';
import { getLearnerToken } from '@/lib/learner-auth-storage';

type LearnerSessionContextValue = {
  isLoggedIn: boolean;
  isChecking: boolean;
  learner: Learner | null;
  themePreference: ThemePreference;
  refresh: () => Promise<void>;
  updateThemePreference: (preference: ThemePreference) => Promise<void>;
};

const LearnerSessionContext = createContext<LearnerSessionContextValue | null>(null);

// Contexto simples só pra avisar o layout raiz quando o token de aluno muda
// (login/cadastro/logout) — sem isso, o Stack.Protected não saberia que
// precisa reavaliar o guard depois de uma tela de auth trocar o token.
// Também guarda o perfil completo do aluno, já que praticamente toda tela
// logada precisa dele (nome, avatar, preferência de tema) e refazer o fetch
// em cada uma seria redundante.
export function LearnerSessionProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [learner, setLearner] = useState<Learner | null>(null);

  const refresh = useCallback(async () => {
    const token = await getLearnerToken();
    if (token === null) {
      setIsLoggedIn(false);
      setLearner(null);
      setIsChecking(false);
      return;
    }
    setIsLoggedIn(true);
    try {
      setLearner(await getLearnerProfile());
    } catch {
      // Token pode ter expirado ou a conta ter sido excluída — a próxima
      // chamada autenticada que falhar leva de volta pro login.
      setLearner(null);
    }
    setIsChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateThemePreference = useCallback(async (preference: ThemePreference) => {
    setLearner(await updateLearnerProfile({ theme_preference: preference }));
  }, []);

  return (
    <LearnerSessionContext.Provider
      value={{
        isLoggedIn,
        isChecking,
        learner,
        themePreference: learner?.theme_preference ?? 'system',
        refresh,
        updateThemePreference,
      }}
    >
      {children}
    </LearnerSessionContext.Provider>
  );
}

export function useLearnerSession() {
  const context = useContext(LearnerSessionContext);
  if (!context) {
    throw new Error('useLearnerSession precisa estar dentro de LearnerSessionProvider');
  }
  return context;
}
