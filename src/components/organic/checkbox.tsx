import { Pressable, StyleSheet } from 'react-native';

import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import { RadiusSm, Spacing } from '@/constants/theme';

export type OrganicCheckboxProps = {
  label: string;
  value: boolean;
  onValueChange: () => void;
};

export function OrganicCheckbox({ label, value, onValueChange }: OrganicCheckboxProps) {
  return (
    <Pressable
      onPress={onValueChange}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}>
      <OrganicSurface
        backgroundColor={value ? 'accent' : 'backgroundSelected'}
        inset={!value}
        shadow={value}
        borderRadius={RadiusSm * 0.6}
        style={styles.box}>
        {value && (
          <OrganicText size="small" color="onAccent">
            ✓
          </OrganicText>
        )}
      </OrganicSurface>
      <OrganicText size="body">{label}</OrganicText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  box: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
