import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { LessonLock, LessonStar } from './lesson-star';
import { Ambient, EaseInOut, EaseOut } from '@/constants/motion';
import type { ThemeColor } from '@/constants/theme';
import { useGradients, useTheme } from '@/hooks/use-theme';
import type { SkillPhase } from '@/lib/gamification';

export type SkillNodeState = 'done' | 'current' | 'locked';

const NODE_SIZE = 52;
const RING_GAP_DEG = 20;
const RING_STROKE_WIDTH = 4;
/** Folga entre a borda do nó e o anel. */
const RING_OFFSET = 4;

/**
 * Altura da faixa escura sob o nó. É isso que transforma o círculo chapado num
 * botão com volume: no CSS o handoff usa `box-shadow: 0 8px 0 <cor escura>`,
 * que não tem equivalente em React Native (sombra nativa é sempre borrada), então
 * desenhamos a faixa como uma View própria atrás do nó, deslocada pra baixo.
 */
const DEPTH_RATIO = 0.11;

// Anel de 2 segmentos ao redor do nó — cada segmento é uma sub-fase da
// habilidade (quiz e prática), preenchido quando concluída. Mesma ideia do
// anel de "quantidade de lições" do Duolingo, só que aqui sempre são 2
// (nosso modelo de dados só tem essas duas fases por habilidade).
function SkillNodeRing({
  nodeHeight,
  quizDone,
  practiceDone,
}: {
  /**
   * Altura do nó INTEIRO (face + faixa 3D), não só da face. O anel circunscreve
   * o botão como ele é visto: centrar na face deixava o anel alto demais e a
   * faixa escura passava por cima dele embaixo, que é o que lia como torto.
   */
  nodeHeight: number;
  quizDone: boolean;
  practiceDone: boolean;
}) {
  const theme = useTheme();
  const radius = nodeHeight / 2 + RING_OFFSET;
  // Canvas do SVG precisa sobrar meia espessura de traço pra cada lado do
  // raio, senão o traço estoura o viewport e fica cortado (mesma categoria
  // do bug de emoji cortado: elemento maior que a caixa que o contém).
  const diameter = radius * 2 + RING_STROKE_WIDTH;
  const circumference = 2 * Math.PI * radius;
  const segmentDeg = 180 - RING_GAP_DEG;
  const segmentLength = (circumference * segmentDeg) / 360;
  const center = diameter / 2;

  const segmentProps = (filled: boolean) => ({
    // theme.borderColor é quase a mesma cor do fundo (baixo contraste de
    // propósito pra divisórias sutis) — pra segmento pendente do anel
    // precisa de algo visível, textSecondary tem contraste de verdade.
    stroke: filled ? theme.accent : theme.textSecondary,
    strokeWidth: RING_STROKE_WIDTH,
    strokeLinecap: 'round' as const,
    fill: 'none',
    strokeDasharray: `${segmentLength} ${circumference - segmentLength}`,
  });

  return (
    <Svg
      width={diameter}
      height={diameter}
      style={[styles.centered, { left: 0, top: 0, width: diameter, height: diameter }]}
      pointerEvents="none">
      {/* transform="rotate(...)" em vez das props rotation/origin — essa
          combinação específica não renderiza certo na web (o navegador
          reclama de "transform-origin" inválido e a forma simplesmente
          some), transform com sintaxe SVG padrão funciona nas duas.

          O `+ RING_GAP_DEG / 2` é o que deixa o anel reto: um traço de 160°
          começando no topo termina 20° antes de fechar a volta, então os dois
          vãos ficavam centrados uns 10° fora da vertical e o anel inteiro lia
          como torto. Girando meia folga, os vãos caem exatamente em cima e
          embaixo. */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        {...segmentProps(quizDone)}
        transform={`rotate(${-90 + RING_GAP_DEG / 2}, ${center}, ${center})`}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        {...segmentProps(practiceDone)}
        transform={`rotate(${90 + RING_GAP_DEG / 2}, ${center}, ${center})`}
      />
    </Svg>
  );
}

/**
 * Anel que cresce e desaparece atrás do nó ativo, em loop. Diferente das outras
 * animações contínuas, essa NÃO pode ir e voltar (`reverse`): ela tem que
 * reiniciar do começo toda vez, senão o anel "encolhe de volta" em vez de sumir.
 */
function Halo({ size, color, inset }: { size: number; color: string; inset: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: Ambient.halo.duration, easing: EaseOut }),
      -1,
      false,
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          Ambient.halo.fromScale + progress.value * (Ambient.halo.toScale - Ambient.halo.fromScale),
      },
    ],
    // Some antes do fim do ciclo (70% no CSS), pra dar um respiro entre um
    // pulso e o próximo em vez de emendar direto.
    opacity: Math.max(0, Ambient.halo.fromOpacity * (1 - progress.value / 0.7)),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.centered,
        style,
        {
          left: inset,
          top: inset,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: color,
        },
      ]}
    />
  );
}

/**
 * Faixa de brilho atravessando o nó ativo na diagonal. Substitui o `filter:
 * blur()` do protótipo por um gradiente transparente→branco→transparente, que
 * é o jeito de ter borda suave em React Native sem biblioteca de blur.
 */
function Shine({ size }: { size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: Ambient.shine.duration, easing: EaseInOut }),
      -1,
      false,
    );
  }, [progress]);

  const width = size * 0.35;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -width + progress.value * (size + width * 2) },
      { rotate: '20deg' },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shine, style, { width, height: size * 1.8 }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function SkillNode({
  state,
  label,
  size = NODE_SIZE,
  quizPassed = false,
  practiceDone = false,
}: {
  state: SkillNodeState;
  label: string;
  size?: number;
  /** Fase ativa da habilidade — hoje só influencia o texto do balão, no pai. */
  phase?: SkillPhase;
  /** Usados só pra desenhar o anel de progresso (2 segmentos). */
  quizPassed?: boolean;
  practiceDone?: boolean;
}) {
  const theme = useTheme();
  const gradients = useGradients();

  const isLocked = state === 'locked';
  const depth = Math.round(size * DEPTH_RATIO);

  // A estrela é sempre a mesma forma; só o preenchimento conta a história.
  // Branca = é a sua vez agora, escura sobre laranja = já conquistada,
  // cinza sobre cinza = ainda não dá.
  const starColor = isLocked ? theme.textSecondary : state === 'done' ? theme.onAccent : '#FFFFFF';
  const shadowColor: ThemeColor = isLocked ? 'lockedShadow' : 'accentShadow';

  // O nó ocupa `size` de largura e `size + depth` de altura (a faixa 3D só
  // cresce pra baixo). O anel circunscreve essa caixa inteira, então é ele que
  // define o tamanho do wrapper — e tudo é posicionado a partir do centro do
  // NÓ, não da face, pra que anel, halo e botão dividam o mesmo centro.
  const nodeHeight = size + depth;
  const wrapperSize = nodeHeight + RING_OFFSET * 2 + RING_STROKE_WIDTH;
  const nodeLeft = (wrapperSize - size) / 2;
  const nodeTop = (wrapperSize - nodeHeight) / 2;

  return (
    <View
      style={[styles.wrapper, { width: wrapperSize, height: wrapperSize }]}
      accessibilityLabel={label}>
      {state === 'current' && (
        <Halo size={nodeHeight} color={theme.accent} inset={(wrapperSize - nodeHeight) / 2} />
      )}
      {!isLocked && (
        <SkillNodeRing nodeHeight={nodeHeight} quizDone={quizPassed} practiceDone={practiceDone} />
      )}

      <View style={{ position: 'absolute', left: nodeLeft, top: nodeTop, width: size, height: nodeHeight }}>
        {/* Faixa escura: mesmo círculo, deslocado pra baixo, atrás da face. */}
        <View
          style={[
            styles.depth,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              top: depth,
              backgroundColor: theme[shadowColor],
            },
          ]}
        />
        {isLocked ? (
          <View
            style={[
              styles.face,
              { width: size, height: size, borderRadius: size / 2 },
              { backgroundColor: theme.backgroundSelected },
            ]}>
            <LessonLock size={size * 0.46} color={starColor} />
          </View>
        ) : (
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.face, { width: size, height: size, borderRadius: size / 2 }]}>
            <LessonStar size={size * 0.46} color={starColor} rounded={state === 'current'} />
            {state === 'current' && <Shine size={size} />}
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centered: {
    position: 'absolute',
  },
  depth: {
    position: 'absolute',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: '-40%',
    left: 0,
  },
});
