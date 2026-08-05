import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getLearnerToken } from '@/lib/learner-auth-storage';

type LearnerSessionContextValue = {
  isLoggedIn: boolean;
  isChecking: boolean;
  refresh: () => Promise<void>;
};

const LearnerSessionContext = createContext<LearnerSessionContextValue | null>(null);

// Contexto simples só pra avisar o layout raiz quando o token de aluno muda
// (login/cadastro/logout) — sem isso, o Stack.Protected não saberia que
// precisa reavaliar o guard depois de uma tela de auth trocar o token.
export function LearnerSessionProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getLearnerToken();
    setIsLoggedIn(token !== null);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <LearnerSessionContext.Provider value={{ isLoggedIn, isChecking, refresh }}>
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
