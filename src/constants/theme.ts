/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#3D2A1C',
    background: '#FDF1E6',
    backgroundElement: '#F6ECE0',
    backgroundSelected: '#F0E2D2',
    textSecondary: '#A98A72',
    accent: '#FF9351',
    onAccent: '#5C2C0C',
    accent2: '#93D68D',
    onAccent2: '#2F6A35',
    borderColor: '#F0E2D2',
    barFill: '#FF9351',
    mapPatternA: '#E9EFE6',
    mapPatternB: '#E2E9DE',
    danger: '#CC0000',
    warning: '#E0B400',
    onWarning: '#000000',
  },
  dark: {
    text: '#F4F3F0',
    background: '#20232A',
    backgroundElement: '#2F333B',
    backgroundSelected: '#33383F',
    textSecondary: '#8B929C',
    accent: '#8ECB8F',
    onAccent: '#123018',
    accent2: '#FF9351',
    onAccent2: '#5C2C0C',
    borderColor: '#33383F',
    barFill: '#8ECB8F',
    mapPatternA: '#1B241E',
    mapPatternB: '#18211B',
    danger: '#CC0000',
    warning: '#E0B400',
    onWarning: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Pares de gradiente (topo→baixo-esquerda a baixo→direita, 145deg) por papel de cor —
// toda superfície "raised" do sistema Claymorphism usa um gradiente diagonal sutil.
export const Gradients = {
  light: {
    surface: ['#FFFFFF', '#F6ECE0'] as const,
    accent: ['#FFB27A', '#FF9351'] as const,
    accent2: ['#B6E6B0', '#93D68D'] as const,
    background: ['#FDF1E6', '#FBE6D3'] as const,
  },
  dark: {
    surface: ['#2F333B', '#262A30'] as const,
    accent: ['#A9DFAA', '#8ECB8F'] as const,
    accent2: ['#FFB27A', '#FF9351'] as const,
    background: ['#262A30', '#1F2329'] as const,
  },
} as const;

export type GradientRole = keyof typeof Gradients.light & keyof typeof Gradients.dark;

// Sistema de design "Claymorphism": tudo em Archivo, superfícies "infladas" com
// gradiente diagonal + sombra suave (sem bordas duras), cantos bem arredondados.
export const HeadingFontFamily = 'Archivo_800ExtraBold';
export const BodyFontFamily = 'Archivo_700Bold';

export const BorderWidth = 1.5;

// Sombra "puffy" — mais espalhada e escura que a do sistema anterior, pra reforçar
// a leitura de superfície inflada. Highlight superior não é viável nativamente no
// RN (um só shadow por View); o gradiente diagonal já sugere a fonte de luz.
export const SoftShadow = {
  shadowColor: '#96795A',
  shadowOffset: { width: 6, height: 8 },
  shadowOpacity: 0.28,
  shadowRadius: 16,
  elevation: 8,
} as const;

export const RadiusSm = 16;
export const RadiusMd = 22;
export const RadiusLg = 26;
export const RadiusPill = 999;

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
