import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { loginInstructor } from '@/api/instructors';
import { OrganicButton, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setInstructorToken } from '@/lib/instructor-auth-storage';

export default function InstructorLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setSubmitError('Preencha e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const auth = await loginInstructor({ email: email.trim(), password });
      await setInstructorToken(auth.access_token);
      router.replace('/instrutor/painel');
    } catch (error) {
      setSubmitError(
        error instanceof ApiError && error.status === 401
          ? 'E-mail ou senha inválidos.'
          : error instanceof ApiError
            ? error.message
            : 'Não foi possível entrar.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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

  const inputStyle = [
    styles.input,
    {
      fontFamily: BodyFontFamily,
      color: theme.text,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.borderColor,
    },
  ];

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Entrar' }} />
          <OrganicText size="title">Entrar como instrutor</OrganicText>

          <View style={styles.formWrapper}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={inputStyle}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={inputStyle}
            />

            {submitError !== '' && (
              <OrganicText color="textSecondary" style={styles.centerText}>
                {submitError}
              </OrganicText>
            )}

            <OrganicButton
              label={isSubmitting ? 'Entrando…' : 'Entrar'}
              disabled={isSubmitting}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
  },
  formWrapper: {
    gap: Spacing.three,
  },
  input: {
    borderRadius: RadiusMd,
    borderWidth: BorderWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});
