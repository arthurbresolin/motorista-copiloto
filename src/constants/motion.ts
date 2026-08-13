import { Easing } from 'react-native-reanimated';

/**
 * Durações, atrasos e curvas das animações, transcritos direto do handoff de
 * design (`Trilha Animada.dc.html` e `Motorista Copiloto.dc.html`). Ficam num
 * arquivo só pra que ajustar o ritmo de uma animação seja mexer num número
 * aqui, não caçar `withTiming` espalhado por dez componentes.
 *
 * Os nomes são os mesmos `@keyframes` do protótipo (bob, halo, shine...) de
 * propósito: se alguém abrir o HTML de referência do lado, casa 1:1.
 */

/** Rebote com passada do ponto final — `cubic-bezier(.34,1.56,.64,1)` no CSS. */
export const OvershootEasing = Easing.bezier(0.34, 1.56, 0.64, 1);
export const EaseInOut = Easing.inOut(Easing.quad);
export const EaseOut = Easing.out(Easing.quad);

/** Loops contínuos — o "ambiente" que faz a tela nunca ficar parada. */
export const Ambient = {
  /** Nó ativo sobe e desce. */
  bob: { duration: 2200, distance: 7 },
  /** Mascote: sobe menos que o nó e inclina de leve, pra não parecer o mesmo movimento. */
  bobX: { duration: 3400, distance: 5, rotateDeg: 1.5 },
  /** Anel que cresce e some atrás do nó ativo. */
  halo: { duration: 1800, fromScale: 0.9, toScale: 1.5, fromOpacity: 0.55 },
  /** Chama do streak tremulando. */
  flame: { duration: 1300, scale: 1.14, rotateDeg: 4 },
  /** Brilho diagonal cruzando o nó ativo. */
  shine: { duration: 2600 },
  /** Balão "COMEÇAR" flutuando. */
  tip: { duration: 1600, distance: 4 },
  /** Ponto vermelho do badge "CÂMERA ON" piscando (liga/desliga, sem meio-termo). */
  blink: { duration: 1100, minOpacity: 0.15 },
  /** Rota tracejada do mapa "andando". */
  march: { duration: 1000, dashOffset: -120 },
  /** CTA principal respirando. */
  breathe: { duration: 2600, distance: 2 },
  /** Barras do gráfico crescendo de baixo pra cima ao abrir a tela. */
  grow: { duration: 700 },
} as const;

/**
 * Celebração de conclusão de lição — dispara uma vez, na ordem abaixo. Os
 * atrasos são o que faz parecer uma reação em cadeia (o botão afunda, e só
 * depois as estrelas saem) em vez de tudo explodindo junto.
 */
export const Celebration = {
  /** Botão afunda, estica e volta. */
  press: { duration: 1100, delay: 0 },
  /** Estrelas saindo do centro do nó. */
  flyStar: { duration: 1000, delay: 300, count: 5 },
  /** "+25 XP" subindo e sumindo. */
  xpUp: { duration: 1600, delay: 350, distance: 46 },
  /** Streak virando como um contador mecânico. */
  numFlip: { duration: 600, delay: 500, distance: 16 },
  /** Estrela dourada central aparecendo com overshoot. */
  pop: { duration: 500, delay: 550 },
  /** Próximo nó saindo do cinza. */
  wake: { duration: 800, delay: 800 },
  /** Quanto XP a conclusão de uma habilidade vale — texto do balão flutuante. */
  xpAmount: 25,
} as const;

/** Duração total da sequência, pra saber quando limpar o estado de celebração. */
export const CELEBRATION_TOTAL_MS = Celebration.xpUp.delay + Celebration.xpUp.duration;

/** Toque: afundar rápido ao pressionar, usado em botões e nós. */
export const Press = { scale: 0.94, duration: 100 } as const;

/** Entrada dos cards em cascata. */
export const ENTRANCE_STAGGER_MS = 50;
