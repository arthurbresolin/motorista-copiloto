import { Path, Svg } from 'react-native-svg';

/**
 * Ícone único de lição da trilha. O handoff de design é explícito: TODA lição
 * usa a mesma estrela, variando só a cor de preenchimento conforme o estado —
 * nada de um emoji diferente por tipo de habilidade (foi justamente o que o
 * usuário rejeitou na primeira versão da trilha).
 */

/** Estrela de pontas retas — usada em nós concluídos, travados e adormecidos. */
const SHARP_PATH = 'M12 3l2.5 5.6 6.1.5-4.6 4 1.4 6-5.4-3.2L6.1 19l1.4-6L3 9l6.1-.5z';

/**
 * Mesma estrela com os cantos arredondados. O protótipo reserva essa versão pro
 * nó ativo: como ele é bem maior que os outros, as pontas retas ficam agressivas
 * naquele tamanho.
 */
const ROUNDED_PATH =
  'M12 2.6c.5 0 1 .3 1.2.8l2.1 4.6 5 .5c1.1.1 1.5 1.4.7 2.1l-3.8 3.4 1.1 4.9c.2 1-.9 1.9-1.8 1.3L12 17.9l-4.4 2.3c-.9.6-2-.3-1.8-1.3l1.1-4.9-3.8-3.4c-.8-.7-.4-2 .7-2.1l5-.5 2.1-4.6c.2-.5.7-.8 1.2-.8z';

/**
 * Cadeado das lições ainda travadas. É a única exceção à regra do ícone único:
 * o usuário pediu explicitamente pra travada não mostrar estrela, porque
 * estrela cinza ainda lê como "conquista", só que apagada — cadeado diz "você
 * ainda não chegou aqui" sem ambiguidade.
 */
const LOCK_BODY = 'M6 10.5h12c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-8c0-.6.4-1 1-1z';
const LOCK_SHACKLE = 'M8.2 10.5V8a3.8 3.8 0 017.6 0v2.5';

export function LessonLock({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={LOCK_BODY} fill={color} />
      <Path d={LOCK_SHACKLE} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function LessonStar({
  size,
  color,
  rounded = false,
}: {
  size: number;
  color: string;
  rounded?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={rounded ? ROUNDED_PATH : SHARP_PATH} fill={color} />
    </Svg>
  );
}
