import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Line, Svg } from 'react-native-svg';

import { FadeSlideIn } from './fade-slide-in';
import { OrganicPill } from './pill';
import { SkillNode } from './skill-node';
import { OrganicText } from './text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SkillProgress } from '@/lib/gamification';
import type { SkillKey } from '@/constants/skills';

const NODE_SIZE = 52;
const CURRENT_NODE_SIZE = 76;
const OFFSET_STEP = 56;
const PRESS_SCALE = 0.94;
const PRESS_DURATION = 100;
const ENTRANCE_STAGGER_MS = 50;

// Tabela cíclica de offsets — lê como um caminho sinuoso sem trigonometria nem onLayout.
const TRAIL_OFFSETS = [0, 1, 1, 0, -1, -1, 0, 1];

function TrailNode({
  progress,
  index,
  offset,
  onPress,
}: {
  progress: SkillProgress;
  index: number;
  offset: number;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const { skill, state, phase, quizPassed, practiceDone } = progress;
  const isCurrent = state === 'current';
  const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <FadeSlideIn delay={index * ENTRANCE_STAGGER_MS} style={[styles.row, { marginLeft: offset }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(PRESS_SCALE, { duration: PRESS_DURATION });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: PRESS_DURATION });
        }}
        style={styles.node}>
        <Animated.View style={[styles.nodeContent, animatedStyle]}>
          <SkillNode
            state={state}
            label={skill.label}
            size={size}
            phase={phase}
            quizPassed={quizPassed}
            practiceDone={practiceDone}
          />
          <OrganicText size="small" color="textSecondary" style={styles.nodeLabel}>
            {skill.label}
          </OrganicText>
          {isCurrent && (
            <OrganicPill
              label={phase === 'quiz' ? 'Fazer o quiz' : 'Praticar agora'}
              backgroundColor="accent"
              textColor="onAccent"
            />
          )}
        </Animated.View>
      </Pressable>
    </FadeSlideIn>
  );
}

export function SkillTrail({
  items,
  onPressSkill,
}: {
  items: SkillProgress[];
  onPressSkill: (key: SkillKey, anchorY: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <OrganicText size="small" color="textSecondary" style={styles.centerText}>
        🏁 Comece aqui
      </OrganicText>

      <View style={styles.column}>
        {items.length > 1 && (
          <Svg width="100%" height="100%" style={styles.spine} pointerEvents="none">
            <Line
              x1="50%"
              y1="0%"
              x2="50%"
              y2="100%"
              stroke={theme.borderColor}
              strokeWidth={2}
              strokeDasharray="1 10"
              strokeLinecap="round"
            />
          </Svg>
        )}

        {items.map((progress, index) => (
          <TrailNode
            key={progress.skill.key}
            progress={progress}
            index={index}
            offset={TRAIL_OFFSETS[index % TRAIL_OFFSETS.length] * OFFSET_STEP}
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
    position: 'relative',
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
