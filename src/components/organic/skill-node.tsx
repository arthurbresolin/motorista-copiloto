import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SkillNodeState = 'done' | 'current' | 'locked';

const NODE_SIZE = 44;
const GLOW_DURATION = 1100;
const BADGE_RATIO = 0.42;

export function SkillNode({
  state,
  label,
  size = NODE_SIZE,
  icon,
  badge,
}: {
  state: SkillNodeState;
  label: string;
  size?: number;
  /** Sobrescreve o ícone padrão (★) só quando state === 'current'. */
  icon?: string;
  /** Selo pequeno sobreposto no canto — indica a sub-fase (quiz/prática). */
  badge?: string;
}) {
  const theme = useTheme();
  const backgroundColor: ThemeColor =
    state === 'done' ? 'accent' : state === 'locked' ? 'backgroundSelected' : 'backgroundElement';
  const textColor: ThemeColor =
    state === 'locked' ? 'textSecondary' : state === 'done' ? 'onAccent' : 'text';
  const resolvedIcon = state === 'done' ? '✓' : state === 'locked' ? '🔒' : (icon ?? '★');

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

  const badgeSize = size * BADGE_RATIO;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
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
          {resolvedIcon}
        </OrganicText>
      </OrganicSurface>
      {badge && (
        <OrganicSurface
          circle
          backgroundColor="backgroundElement"
          borderRadius={badgeSize / 2}
          style={[styles.badge, { width: badgeSize, height: badgeSize }]}>
          <OrganicText style={{ fontSize: badgeSize * 0.55, lineHeight: badgeSize * 0.65 }}>
            {badge}
          </OrganicText>
        </OrganicSurface>
      )}
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
  node: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
