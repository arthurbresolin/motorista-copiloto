import { Pressable, StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { RadiusPill, Spacing, type ThemeColor } from '@/constants/theme';

export type OrganicButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'accent' | 'neutral';
};

export function OrganicButton({ label, onPress, disabled, variant = 'accent' }: OrganicButtonProps) {
  const backgroundColor: ThemeColor = variant === 'accent' ? 'accent' : 'backgroundElement';
  const textColor: ThemeColor = variant === 'accent' ? 'onAccent' : 'text';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.wrapper, disabled && styles.disabled, pressed && styles.pressed]}>
      <OrganicSurface backgroundColor={backgroundColor} borderRadius={RadiusPill} style={styles.button}>
        <OrganicText size="body" color={textColor} style={styles.label}>
          {label}
        </OrganicText>
      </OrganicSurface>
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
  pressed: {
    opacity: 0.7,
  },
});
