import { Pressable, StyleSheet } from 'react-native';

import { OrganicText } from './text';
import { BorderWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ListRow({
  icon,
  label,
  onPress,
  showDivider = true,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  /** Falso na última linha da lista, pra não ter borda sobrando embaixo. */
  showDivider?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomWidth: BorderWidth, borderBottomColor: theme.borderColor },
        pressed && styles.pressed,
      ]}>
      <OrganicText size="body">{icon}</OrganicText>
      <OrganicText size="body" style={styles.label}>
        {label}
      </OrganicText>
      <OrganicText size="body" color="textSecondary">
        ›
      </OrganicText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
