import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { requestPasswordReset } from '@/api/learners';
import { OrganicButton, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setSubmitError('Informe seu e-mail.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Não foi possível enviar o pedido.');
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
          <Stack.Screen options={{ title: 'Esqueci minha senha' }} />
          <View style={styles.titleWrapper}>
            <OrganicText size="title">Esqueci minha senha</OrganicText>
            <OrganicText color="textSecondary">
              Informe o e-mail da sua conta e mandamos um link pra você escolher uma senha nova.
            </OrganicText>
          </View>

          {sent ? (
            <View style={styles.formWrapper}>
              <OrganicText color="textSecondary">
                Se esse e-mail tiver uma conta, você vai receber um link de redefinição em
                instantes. Confira também a caixa de spam.
              </OrganicText>
              <OrganicButton label="Voltar pro login" onPress={() => router.replace('/entrar')} />
            </View>
          ) : (
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

              {submitError !== '' && (
                <OrganicText color="textSecondary" style={styles.centerText}>
                  {submitError}
                </OrganicText>
              )}

              <OrganicButton
                label={isSubmitting ? 'Enviando…' : 'Enviar link de redefinição'}
                disabled={isSubmitting}
                onPress={handleSubmit}
              />
              <OrganicButton label="Voltar" variant="neutral" onPress={() => router.back()} />
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
