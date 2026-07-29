import { Pressable, StyleSheet, View } from 'react-native';
import { Line, Svg } from 'react-native-svg';

import { OrganicPill } from './pill';
import { SkillNode } from './skill-node';
import { OrganicText } from './text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SkillProgress } from '@/lib/gamification';
import type { SkillKey } from '@/constants/skills';

const NODE_SIZE = 44;
const CURRENT_NODE_SIZE = 64;
const OFFSET_STEP = 56;

// Tabela cíclica de offsets — lê como um caminho sinuoso sem trigonometria nem onLayout.
const TRAIL_OFFSETS = [0, 1, 1, 0, -1, -1, 0, 1];

export function SkillTrail({
  items,
  onPressSkill,
}: {
  items: SkillProgress[];
  onPressSkill: (key: SkillKey) => void;
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

        {items.map(({ skill, state }, index) => {
          const offset = TRAIL_OFFSETS[index % TRAIL_OFFSETS.length] * OFFSET_STEP;
          const isCurrent = state === 'current';
          const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;

          return (
            <View key={skill.key} style={[styles.row, { marginLeft: offset }]}>
              <Pressable
                onPress={() => onPressSkill(skill.key)}
                style={({ pressed }) => [styles.node, pressed && styles.pressed]}>
                <SkillNode state={state} label={skill.label} size={size} />
                <OrganicText size="small" color="textSecondary" style={styles.nodeLabel}>
                  {skill.label}
                </OrganicText>
                {isCurrent && <OrganicPill label="Continue aqui" backgroundColor="accent" textColor="onAccent" />}
              </Pressable>
            </View>
          );
        })}
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
    gap: Spacing.one,
  },
  nodeLabel: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
