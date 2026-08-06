import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { confirmPasswordReset } from '@/api/learners';
import { OrganicButton, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setSubmitError('Link inválido — peça um novo em "Esqueci minha senha".');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await confirmPasswordReset(token, newPassword);
      setDone(true);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError && error.status === 400
          ? 'Esse link expirou ou já foi usado — peça um novo em "Esqueci minha senha".'
          : error instanceof ApiError
            ? error.message
            : 'Não foi possível redefinir a senha.',
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
          <Stack.Screen options={{ title: 'Redefinir senha' }} />
          <View style={styles.titleWrapper}>
            <OrganicText size="title">Escolher nova senha</OrganicText>
            <OrganicText color="textSecondary">Crie uma nova senha pra sua conta.</OrganicText>
          </View>

          {done ? (
            <View style={styles.formWrapper}>
              <OrganicText color="textSecondary">Senha redefinida com sucesso.</OrganicText>
              <OrganicButton label="Ir pro login" onPress={() => router.replace('/entrar')} />
            </View>
          ) : (
            <View style={styles.formWrapper}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nova senha"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                style={inputStyle}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nova senha"
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
                label={isSubmitting ? 'Salvando…' : 'Redefinir senha'}
                disabled={isSubmitting}
                onPress={handleSubmit}
              />
            </View>
          )}
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
    justifyContent: 'center',
    gap: Spacing.five,
  },
  titleWrapper: {
    gap: Spacing.two,
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
