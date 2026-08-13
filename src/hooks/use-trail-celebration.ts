import { useEffect, useRef, useState } from 'react';

import { CELEBRATION_TOTAL_MS } from '@/constants/motion';
import type { SkillKey } from '@/constants/skills';
import type { SkillProgress } from '@/lib/gamification';

/**
 * Descobre qual habilidade acabou de ser concluída, pra trilha poder comemorar.
 *
 * Não existe um evento de "concluiu habilidade" no app: quiz e prática são
 * telas separadas que só gravam a sessão no backend. A trilha recarrega o
 * progresso toda vez que ganha foco, então dá pra deduzir a conclusão
 * comparando quem estava concluído antes com quem está concluído agora.
 *
 * Dois cuidados que a versão ingênua erra:
 * - só olha progresso já carregado (`ready`), senão o estado vazio de
 *   "carregando" viraria um retrato falso e tudo pareceria recém-concluído
 *   assim que os dados chegassem;
 * - a comparação é por assinatura de texto, não pela identidade do array —
 *   `useProgress` recalcula a lista a cada render, então depender do array
 *   faria o efeito rodar sem parar e cancelar o próprio timer da comemoração.
 */
export function useTrailCelebration(skillProgress: SkillProgress[], ready: boolean) {
  const [celebratingKey, setCelebratingKey] = useState<SkillKey | null>(null);
  const knownDone = useRef<Set<SkillKey> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doneKeys = skillProgress
    .filter((item) => item.state === 'done')
    .map((item) => item.skill.key);
  const doneSignature = doneKeys.join(',');

  useEffect(() => {
    if (!ready) return;

    const done = new Set(doneSignature ? (doneSignature.split(',') as SkillKey[]) : []);

    // Primeira leitura válida: só guarda o retrato, não comemora o passado.
    if (knownDone.current === null) {
      knownDone.current = done;
      return;
    }

    const justFinished = [...done].find((key) => !knownDone.current?.has(key));
    knownDone.current = done;
    if (!justFinished) return;

    setCelebratingKey(justFinished);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCelebratingKey(null), CELEBRATION_TOTAL_MS);
  }, [doneSignature, ready]);

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  return celebratingKey;
}
