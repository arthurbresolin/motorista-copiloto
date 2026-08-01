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
  tips: string[];
  // Manobras cujo resultado é uma posição final (estacionar) se beneficiam
  // de uma foto avaliada pela IA no fim do Modo Copiloto — não faz sentido
  // pra manobras de trajeto (curva, rotatória) sem posição final clara.
  supportsPhotoFeedback?: boolean;
};

export const MANEUVER_OPTIONS = ['Baliza', 'Rotatória', 'Estacionamento', 'Rodovia', 'Curva', 'Marcha à ré'];

export const SKILLS: Skill[] = [
  {
    key: 'baliza',
    label: 'Baliza',
    maneuver: 'Baliza',
    description: 'Estacionar em vaga entre dois carros, com controle e poucas manobras.',
    tips: [
      'Alinhe seu carro paralelo ao da frente, mantendo cerca de 1 metro de distância.',
      'Vire o volante todo pra direita ao começar a marcha à ré e observe os retrovisores.',
      'Endireite as rodas assim que o carro entrar na vaga, checando a distância dos dois lados.',
    ],
    supportsPhotoFeedback: true,
  },
  {
    key: 'rotatoria',
    label: 'Rotatória',
    maneuver: 'Rotatória',
    description: 'Entrar e sair de rotatórias respeitando quem já está circulando.',
    tips: [
      'Reduza a velocidade antes de entrar e observe quem já está circulando.',
      'Quem está dentro da rotatória tem preferência — espere um espaço seguro.',
      'Sinalize a saída com a seta antes de deixar a rotatória.',
    ],
  },
  {
    key: 'estacionamento',
    label: 'Estacionamento',
    maneuver: 'Estacionamento',
    description: 'Estacionar em vaga livre, alinhado e sem sustos.',
    tips: [
      'Escolha uma vaga compatível com o tamanho do carro.',
      'Use os retrovisores e o espelho interno pra calcular a distância.',
      'Alinhe o carro devagar, corrigindo o volante aos poucos.',
    ],
    supportsPhotoFeedback: true,
  },
  {
    key: 'rodovia',
    label: 'Rodovia',
    maneuver: 'Rodovia',
    description: 'Dirigir em vias rápidas, com conversões e ultrapassagens seguras.',
    tips: [
      'Mantenha distância segura do carro da frente (regra dos 2 segundos).',
      'Use a seta com antecedência antes de mudar de faixa.',
      'Ultrapasse apenas em trechos permitidos e com visibilidade total.',
    ],
  },
  {
    key: 'curva',
    label: 'Curva',
    maneuver: 'Curva',
    description: 'Fazer curvas fechadas mantendo a velocidade sob controle.',
    tips: [
      'Reduza a velocidade antes de entrar na curva, não durante.',
      'Olhe para o ponto de saída da curva, não para o acostamento.',
      'Mantenha as duas mãos no volante durante toda a manobra.',
    ],
  },
  {
    key: 'marcha-re',
    label: 'Marcha à ré',
    maneuver: 'Marcha à ré',
    description: 'Manobrar de ré olhando pelos espelhos e pela janela traseira.',
    tips: [
      'Olhe por cima do ombro, não só pelos espelhos.',
      'Faça movimentos lentos e pequenos no volante.',
      'Pare e reavalie se perder a referência do espaço.',
    ],
  },
  {
    key: 'checklist',
    label: 'Checklist',
    description: 'Conferir o carro antes de sair — espelhos, cinto, banco, combustível.',
    tips: [
      'Ajuste os espelhos antes de ligar o carro.',
      'Verifique o cinto de segurança de todos os ocupantes.',
      'Confirme o freio de mão antes de engatar a marcha.',
    ],
  },
  {
    key: 'direcao-suave',
    label: 'Direção suave',
    description: 'Uma sessão do Monitor sem nenhuma freada ou aceleração brusca.',
    tips: [
      'Acelere e freie de forma gradual, sem solavancos.',
      'Antecipe sinais de trânsito pra não precisar frear bruscamente.',
      'Mantenha uma velocidade constante sempre que possível.',
    ],
  },
];

// Quantas vezes uma habilidade precisa ser registrada pra virar "feita" na trilha.
export const MANEUVER_DONE_THRESHOLD = 2;

// Duração mínima (segundos) pra uma sessão do Monitor contar como "direção suave" —
// evita que uma sessão de poucos segundos destrave o nó sem prática de verdade.
export const SMOOTH_DRIVING_MIN_DURATION_SECONDS = 120;
