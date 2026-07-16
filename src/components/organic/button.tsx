import { Pressable, StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { Spacing, type ThemeColor } from '@/constants/theme';

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
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <OrganicSurface backgroundColor={backgroundColor} style={styles.button}>
        <OrganicText size="body" color={textColor}>
          {label}
        </OrganicText>
      </OrganicSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
