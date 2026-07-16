/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111111',
    background: '#ffffff',
    backgroundElement: '#F0EEE9',
    backgroundSelected: '#E8E6E0',
    textSecondary: '#777777',
    accent: '#FFBD8F',
    onAccent: '#2B2B2B',
    borderColor: '#2B2B2B',
    barFill: '#F79B5B',
    mapPatternA: '#EEF2EC',
    mapPatternB: '#E2E9DF',
    danger: '#CC0000',
    warning: '#E0B400',
    onWarning: '#000000',
  },
  dark: {
    text: '#F2F2F0',
    background: '#17181A',
    backgroundElement: '#1E1F22',
    backgroundSelected: '#26282C',
    textSecondary: '#9A9FA6',
    accent: '#A9D9A4',
    onAccent: '#14281A',
    borderColor: '#0C0C0E',
    barFill: '#F79B5B',
    mapPatternA: '#22262A',
    mapPatternB: '#1C2023',
    danger: '#CC0000',
    warning: '#E0B400',
    onWarning: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Fonte cursiva do wireframe orgânico, carregada via @expo-google-fonts/patrick-hand.
export const OrganicFontFamily = 'PatrickHand_400Regular';

export const BorderWidth = 2;
export const ShadowOffset = { x: 2, y: 3 };

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
