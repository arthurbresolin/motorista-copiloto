import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FadeSlideIn } from './fade-slide-in';
import { LessonCelebration } from './lesson-celebration';
import { SkillNode } from './skill-node';
import { StartBalloon } from './start-balloon';
import { OrganicText } from './text';
import { Ambient, Celebration, EaseInOut, ENTRANCE_STAGGER_MS, OvershootEasing, Press } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import type { SkillProgress } from '@/lib/gamification';
import type { SkillKey } from '@/constants/skills';

const NODE_SIZE = 52;
const CURRENT_NODE_SIZE = 76;

/**
 * Deslocamento horizontal de cada nó, em pixels, ciclando pela lista. Os valores
 * vêm do handoff de design — não é uma senoide calculada, é uma sequência
 * escolhida à mão pra parecer um caminho de estrada em vez de um zigue-zague
 * mecânico (repare que dois nós seguidos podem ficar do mesmo lado).
 */
const TRAIL_OFFSETS = [0, -54, 8, 58, 0, -50];

/**
 * "Afundar" do botão ao tocar: os tempos são as porcentagens dos `@keyframes`
 * do protótipo convertidas em milissegundos. O nó desce e achata, volta, sobe
 * e estica, e volta de novo — é o exagero que faz parecer físico.
 */
const PRESS_STEPS = [
  { at: 0.18, translateY: 9, scaleX: 1.08, scaleY: 0.9 },
  { at: 0.18, translateY: 0, scaleX: 1, scaleY: 1 },
  { at: 0.19, translateY: -6, scaleX: 0.96, scaleY: 1.06 },
  { at: 0.17, translateY: 0, scaleX: 1, scaleY: 1 },
] as const;

function TrailNode({
  progress,
  index,
  offset,
  celebrating,
  waking,
  onPress,
}: {
  progress: SkillProgress;
  index: number;
  offset: number;
  /** Habilidade que acabou de ser concluída — recebe a explosão de recompensa. */
  celebrating: boolean;
  /** Nó logo depois do concluído: "acorda" do estado apagado. */
  waking: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const { skill, state, phase, quizPassed, practiceDone } = progress;
  const isCurrent = state === 'current';
  const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;

  // Três valores separados em vez de um só: a animação de afundar mexe em Y e
  // nas duas escalas de forma independente (achata ao descer, estica ao subir),
  // o que um único `scale` não consegue representar.
  const bob = useSharedValue(0);
  const pressY = useSharedValue(0);
  const pressX = useSharedValue(1);
  const pressScaleY = useSharedValue(1);
  const touchScale = useSharedValue(1);

  useEffect(() => {
    if (!isCurrent) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withTiming(1, { duration: Ambient.bob.duration / 2, easing: EaseInOut }),
      -1,
      true,
    );
  }, [isCurrent, bob]);

  // "Acordar": no CSS o próximo nó sai de `grayscale(1) brightness(.5)`. React
  // Native não tem filtro de cor, então o equivalente é sair de apagado e
  // encolhido — mesma leitura de "isso aqui acabou de destravar".
  const wake = useSharedValue(waking ? 0 : 1);

  useEffect(() => {
    if (!waking) return;
    wake.value = 0;
    wake.value = withDelay(
      Celebration.wake.delay,
      withTiming(1, { duration: Celebration.wake.duration, easing: EaseInOut }),
    );
  }, [waking, wake]);

  const wakeStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + wake.value * 0.55,
    transform: [{ scale: 0.9 + wake.value * 0.1 }],
  }));

  const playPress = () => {
    const total = Celebration.press.duration;
    const step = (key: 'translateY' | 'scaleX' | 'scaleY') =>
      withSequence(
        ...PRESS_STEPS.map((s) =>
          withTiming(s[key], { duration: total * s.at, easing: OvershootEasing }),
        ),
      );
    pressY.value = step('translateY');
    pressX.value = step('scaleX');
    pressScaleY.value = step('scaleY');
  };

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * Ambient.bob.distance + pressY.value },
      { scaleX: pressX.value * touchScale.value },
      { scaleY: pressScaleY.value * touchScale.value },
    ],
  }));

  // A comemoração também afunda o botão, como se a conclusão tivesse "apertado"
  // o nó — é o primeiro passo da sequência no handoff.
  useEffect(() => {
    if (celebrating) playPress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrating]);

  return (
    <FadeSlideIn delay={index * ENTRANCE_STAGGER_MS} style={[styles.row, { marginLeft: offset }]}>
      <Pressable
        onPress={(event) => {
          playPress();
          onPress(event);
        }}
        onPressIn={() => {
          touchScale.value = withTiming(Press.scale, { duration: Press.duration });
        }}
        onPressOut={() => {
          touchScale.value = withTiming(1, { duration: Press.duration });
        }}
        style={styles.node}>
        <View style={styles.nodeContent}>
          {isCurrent && (
            <StartBalloon label={phase === 'quiz' ? 'Fazer o quiz' : 'Praticar agora'} />
          )}
          <Animated.View style={[nodeStyle, waking && wakeStyle]}>
            <SkillNode
              state={state}
              label={skill.label}
              size={size}
              phase={phase}
              quizPassed={quizPassed}
              practiceDone={practiceDone}
            />
            {celebrating && <LessonCelebration nodeSize={size} />}
          </Animated.View>
          <OrganicText size="small" color="textSecondary" style={styles.nodeLabel}>
            {skill.label}
          </OrganicText>
        </View>
      </Pressable>
    </FadeSlideIn>
  );
}

export function SkillTrail({
  items,
  celebratingKey = null,
  onPressSkill,
}: {
  items: SkillProgress[];
  /** Habilidade recém-concluída (ver `useTrailCelebration`), ou null. */
  celebratingKey?: SkillKey | null;
  onPressSkill: (key: SkillKey, anchorY: number) => void;
}) {
  const celebratingIndex = celebratingKey
    ? items.findIndex((item) => item.skill.key === celebratingKey)
    : -1;

  return (
    <View style={styles.wrapper}>
      <OrganicText size="small" color="textSecondary" style={styles.centerText}>
        🏁 Comece aqui
      </OrganicText>

      {/* Sem linha ligando os nós, de propósito: o caminho é lido pelo próprio
          zigue-zague. A linha tracejada da versão anterior competia visualmente
          com o anel de progresso de cada nó. */}
      <View style={styles.column}>
        {items.map((progress, index) => (
          <TrailNode
            key={progress.skill.key}
            progress={progress}
            index={index}
            offset={TRAIL_OFFSETS[index % TRAIL_OFFSETS.length]}
            celebrating={index === celebratingIndex}
            waking={celebratingIndex >= 0 && index === celebratingIndex + 1}
            onPress={(event) => onPressSkill(progress.skill.key, event.nativeEvent.pageY)}
          />
        ))}
      </View>

      <OrganicText size="small" color="textSecondary" style={styles.centerText}>
        🏆 Você chegou!
      </OrganicText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  column: {
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  row: {
    alignItems: 'center',
  },
  node: {
    alignItems: 'center',
  },
  nodeContent: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  nodeLabel: {
    textAlign: 'center',
  },
});
