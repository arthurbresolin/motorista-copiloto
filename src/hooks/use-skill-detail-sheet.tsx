import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { SkillDetailSheet } from '@/components/organic';
import type { SkillKey } from '@/constants/skills';

type SkillDetailSheetContextValue = {
  open: (key: SkillKey) => void;
};

const SkillDetailSheetContext = createContext<SkillDetailSheetContextValue | null>(null);

// Provider fica no nível raiz do app (_layout.tsx), acima de toda a
// navegação por abas — a barra de abas (CustomTabList, dentro de <Tabs>)
// cria seu próprio contexto de empilhamento, então um overlay renderizado
// de dentro de uma tela de aba nunca consegue ficar visualmente por cima
// dela via zIndex, não importa o valor. Renderizando o sheet aqui, como
// irmão de todo o <Stack>, ele sempre pinta por cima de tudo.
export function SkillDetailSheetProvider({ children }: { children: ReactNode }) {
  const [skillKey, setSkillKey] = useState<SkillKey | null>(null);

  const open = useCallback((key: SkillKey) => setSkillKey(key), []);
  const close = useCallback(() => setSkillKey(null), []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <SkillDetailSheetContext.Provider value={value}>
      {children}
      <SkillDetailSheet skillKey={skillKey} onClose={close} />
    </SkillDetailSheetContext.Provider>
  );
}

export function useSkillDetailSheet() {
  const context = useContext(SkillDetailSheetContext);
  if (!context) {
    throw new Error('useSkillDetailSheet precisa estar dentro de SkillDetailSheetProvider');
  }
  return context;
}
