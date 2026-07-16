export type SkillKey =
  | 'baliza'
  | 'rotatoria'
  | 'estacionamento'
  | 'rodovia'
  | 'curva'
  | 'marcha-re'
  | 'checklist'
  | 'direcao-suave';

export type Skill = {
  key: SkillKey;
  label: string;
  maneuver?: string;
  description: string;
};

export const MANEUVER_OPTIONS = ['Baliza', 'Rotatória', 'Estacionamento', 'Rodovia', 'Curva', 'Marcha à ré'];

export const SKILLS: Skill[] = [
  {
    key: 'baliza',
    label: 'Baliza',
    maneuver: 'Baliza',
    description: 'Estacionar em vaga entre dois carros, com controle e poucas manobras.',
  },
  {
    key: 'rotatoria',
    label: 'Rotatória',
    maneuver: 'Rotatória',
    description: 'Entrar e sair de rotatórias respeitando quem já está circulando.',
  },
  {
    key: 'estacionamento',
    label: 'Estacionamento',
    maneuver: 'Estacionamento',
    description: 'Estacionar em vaga livre, alinhado e sem sustos.',
  },
  {
    key: 'rodovia',
    label: 'Rodovia',
    maneuver: 'Rodovia',
    description: 'Dirigir em vias rápidas, com conversões e ultrapassagens seguras.',
  },
  {
    key: 'curva',
    label: 'Curva',
    maneuver: 'Curva',
    description: 'Fazer curvas fechadas mantendo a velocidade sob controle.',
  },
  {
    key: 'marcha-re',
    label: 'Marcha à ré',
    maneuver: 'Marcha à ré',
    description: 'Manobrar de ré olhando pelos espelhos e pela janela traseira.',
  },
  {
    key: 'checklist',
    label: 'Checklist',
    description: 'Conferir o carro antes de sair — espelhos, cinto, banco, combustível.',
  },
  {
    key: 'direcao-suave',
    label: 'Direção suave',
    description: 'Uma sessão do Monitor sem nenhuma freada ou aceleração brusca.',
  },
];

// Quantas vezes uma habilidade precisa ser registrada pra virar "feita" na trilha.
export const MANEUVER_DONE_THRESHOLD = 2;

// Duração mínima (segundos) pra uma sessão do Monitor contar como "direção suave" —
// evita que uma sessão de poucos segundos destrave o nó sem prática de verdade.
export const SMOOTH_DRIVING_MIN_DURATION_SECONDS = 120;
