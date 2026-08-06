import type { SkillKey } from './skills';

// Ícone do nó principal da trilha quando a habilidade está "atual" — dá
// identidade visual por habilidade em vez do ★ genérico de antes.
export const PRACTICE_ICON_BY_SKILL: Record<SkillKey, string> = {
  baliza: '🅿️',
  rotatoria: '🔄',
  estacionamento: '🅿️',
  rodovia: '🛣️',
  curva: '↩️',
  'marcha-re': '⏪',
  checklist: '✅',
  'direcao-suave': '🕹️',
};

// Selo pequeno sobreposto no nó enquanto a fase ativa da habilidade é o quiz.
export const QUIZ_ICON = '📝';
