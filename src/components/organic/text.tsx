import { StyleSheet, Text, type TextProps } from 'react-native';

import { BodyFontFamily, HeadingFontFamily, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OrganicTextProps = TextProps & {
  size?: 'title' | 'subtitle' | 'body' | 'small';
  color?: ThemeColor;
};

export function OrganicText({ style, size = 'body', color, ...rest }: OrganicTextProps) {
  const theme = useTheme();
  const fontFamily = size === 'title' || size === 'subtitle' ? HeadingFontFamily : BodyFontFamily;

  return (
    <Text
      style={[
        { fontFamily, color: theme[color ?? 'text'] },
        size === 'title' && styles.title,
        size === 'subtitle' && styles.subtitle,
        size === 'body' && styles.body,
        size === 'small' && styles.small,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 36 },
  subtitle: { fontSize: 22, lineHeight: 26 },
  body: { fontSize: 17, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 19 },
});
