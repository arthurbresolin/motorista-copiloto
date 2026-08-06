import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { RadiusPill, Spacing, type ThemeColor } from '@/constants/theme';

export type OrganicButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'accent' | 'neutral';
};

const PRESS_SCALE = 0.96;
const PRESS_DURATION = 100;

export function OrganicButton({ label, onPress, disabled, variant = 'accent' }: OrganicButtonProps) {
  const backgroundColor: ThemeColor = variant === 'accent' ? 'accent' : 'backgroundElement';
  const textColor: ThemeColor = variant === 'accent' ? 'onAccent' : 'text';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(PRESS_SCALE, { duration: PRESS_DURATION });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: PRESS_DURATION });
      }}
      style={[styles.wrapper, disabled && styles.disabled]}>
      <Animated.View style={animatedStyle}>
        <OrganicSurface backgroundColor={backgroundColor} borderRadius={RadiusPill} style={styles.button}>
          <OrganicText size="body" color={textColor} style={styles.label}>
            {label}
          </OrganicText>
        </OrganicSurface>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Archivo_900Black',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
