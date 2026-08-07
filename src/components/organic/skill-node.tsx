import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SkillPhase } from '@/lib/gamification';

export type SkillNodeState = 'done' | 'current' | 'locked';

const NODE_SIZE = 52;
const GLOW_DURATION = 1100;
const RING_GAP_DEG = 20;
const RING_STROKE_WIDTH = 4;
const RING_OFFSET = 7;

// Anel de 2 segmentos ao redor do nó — cada segmento é uma sub-fase da
// habilidade (quiz e prática), preenchido quando concluída. Mesma ideia do
// anel de "quantidade de lições" do Duolingo, só que aqui sempre são 2
// (nosso modelo de dados só tem essas duas fases por habilidade).
function SkillNodeRing({
  size,
  quizDone,
  practiceDone,
}: {
  size: number;
  quizDone: boolean;
  practiceDone: boolean;
}) {
  const theme = useTheme();
  const radius = size / 2 + RING_OFFSET;
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
      style={[styles.ring, { width: diameter, height: diameter }]}
      pointerEvents="none">
      {/* transform="rotate(...)" em vez das props rotation/origin — essa
          combinação específica não renderiza certo na web (o navegador
          reclama de "transform-origin" inválido e a forma simplesmente
          some), transform com sintaxe SVG padrão funciona nas duas. */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        {...segmentProps(quizDone)}
        transform={`rotate(-90, ${center}, ${center})`}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        {...segmentProps(practiceDone)}
        transform={`rotate(90, ${center}, ${center})`}
      />
    </Svg>
  );
}

export function SkillNode({
  state,
  label,
  size = NODE_SIZE,
  phase,
  quizPassed = false,
  practiceDone = false,
}: {
  state: SkillNodeState;
  label: string;
  size?: number;
  /** Fase ativa — só usada quando state === 'current', decide o ícone. */
  phase?: SkillPhase;
  /** Usados só pra desenhar o anel de progresso (2 segmentos). */
  quizPassed?: boolean;
  practiceDone?: boolean;
}) {
  const theme = useTheme();
  const backgroundColor: ThemeColor =
    state === 'done' ? 'accent' : state === 'locked' ? 'backgroundSelected' : 'backgroundElement';
  const textColor: ThemeColor =
    state === 'locked' ? 'textSecondary' : state === 'done' ? 'onAccent' : 'text';
  const icon =
    state === 'done' ? '✓' : state === 'locked' ? '🔒' : phase === 'practice' ? '🚗' : '❓';

  const pulse = useSharedValue(0);

  useEffect(() => {
    if (state === 'current') {
      pulse.value = withRepeat(
        withTiming(1, { duration: GLOW_DURATION, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      pulse.value = 0;
    }
  }, [state, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.1 }],
    opacity: 0.35 + pulse.value * 0.35,
  }));

  const wrapperSize = size + RING_OFFSET * 2 + RING_STROKE_WIDTH;

  return (
    <View style={[styles.wrapper, { width: wrapperSize, height: wrapperSize }]}>
      {state === 'current' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            glowStyle,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.accent },
          ]}
        />
      )}
      {state !== 'locked' && (
        <SkillNodeRing size={size} quizDone={quizPassed} practiceDone={practiceDone} />
      )}
      <OrganicSurface
        circle
        backgroundColor={backgroundColor}
        shadow={state !== 'locked'}
        inset={state === 'locked'}
        style={[styles.node, { width: size, height: size }]}
        accessibilityLabel={label}>
        <OrganicText
          size="small"
          color={textColor}
          style={{ fontSize: size * 0.32, lineHeight: size * 0.4 }}>
          {icon}
        </OrganicText>
      </OrganicSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
