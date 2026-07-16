import { Pressable, StyleSheet, View } from 'react-native';

import { OrganicText } from './text';
import { BorderWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OrganicCheckboxProps = {
  label: string;
  value: boolean;
  onValueChange: () => void;
};

export function OrganicCheckbox({ label, value, onValueChange }: OrganicCheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onValueChange}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}>
      <View
        style={[
          styles.box,
          {
            borderColor: theme.borderColor,
            backgroundColor: value ? theme.accent : theme.background,
          },
        ]}>
        {value && (
          <OrganicText size="small" color="onAccent">
            ✓
          </OrganicText>
        )}
      </View>
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
    borderWidth: BorderWidth,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
