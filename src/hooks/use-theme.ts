/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLearnerSession } from '@/hooks/use-learner-session';

function useResolvedScheme() {
  const deviceScheme = useColorScheme();
  const { themePreference } = useLearnerSession();

  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }
  return deviceScheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useResolvedScheme()];
}

export function useGradients() {
  return Gradients[useResolvedScheme()];
}
