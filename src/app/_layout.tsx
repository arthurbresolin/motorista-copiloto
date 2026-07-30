import { Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold, Archivo_900Black, useFonts as useArchivo } from '@expo-google-fonts/archivo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

// Temas de navegação (headers nativos de Stack.Screen) derivados da paleta "Clay" —
// sem isso, o header do sistema fica branco/preto, destoando do fundo creme/quase-preto do app.
const ClayLightNavTheme: typeof DefaultTheme = {
  dark: false,
  colors: {
    primary: Colors.light.accent,
    background: Colors.light.background,
    card: Colors.light.backgroundElement,
    text: Colors.light.text,
    border: Colors.light.borderColor,
    notification: Colors.light.danger,
  },
  fonts: DefaultTheme.fonts,
};

const ClayDarkNavTheme: typeof DefaultTheme = {
  dark: true,
  colors: {
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: Colors.dark.borderColor,
    notification: Colors.dark.danger,
  },
  fonts: DarkTheme.fonts,
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useArchivo({
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? ClayDarkNavTheme : ClayLightNavTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="nova-pratica"
          options={{ presentation: 'modal', title: 'Nova sessão de prática' }}
        />
        <Stack.Screen
          name="meu-carro"
          options={{ presentation: 'modal', title: 'Meus carros' }}
        />
        <Stack.Screen
          name="checklist"
          options={{ presentation: 'modal', title: 'Checklist pré-direção' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
