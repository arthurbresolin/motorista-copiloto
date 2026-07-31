import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganicButton, OrganicText, ScreenBackground } from '@/components/organic';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getInstructorToken } from '@/lib/instructor-auth-storage';

export default function InstructorEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checkingSession, setCheckingSession] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getInstructorToken().then((token) => {
        if (cancelled) return;
        if (token) {
          router.replace('/instrutor/painel');
          return;
        }
        setCheckingSession(false);
      });
      return () => {
        cancelled = true;
      };
    }, [router]),
  );

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + Spacing.four,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  if (checkingSession) {
    return (
      <ScreenBackground style={styles.centerContent}>
        <ActivityIndicator />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Área do instrutor' }} />
          <View style={styles.titleWrapper}>
            <OrganicText size="title" style={styles.centerText}>
              🎓 Área do instrutor
            </OrganicText>
            <OrganicText color="textSecondary" style={styles.centerText}>
              Acompanhe o progresso de quem está aprendendo, com um painel só de leitura.
            </OrganicText>
          </View>

          <View style={styles.actionsWrapper}>
            <OrganicButton
              label="Tenho um código de convite"
              onPress={() => router.push('/instrutor/aceitar')}
            />
            <OrganicButton
              label="Já tenho conta — entrar"
              variant="neutral"
              onPress={() => router.push('/instrutor/entrar')}
            />
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  titleWrapper: {
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  actionsWrapper: {
    gap: Spacing.two,
  },
});
