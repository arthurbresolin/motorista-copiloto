import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { acceptInstructorInvite } from '@/api/instructors';
import { ApiError } from '@/api/client';
import { OrganicButton, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setInstructorToken } from '@/lib/instructor-auth-storage';

const MIN_PASSWORD_LENGTH = 8;

export default function InstructorAcceptInviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();

  const [code, setCode] = useState(codigo ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!code.trim() || !email.trim() || !password) {
      setSubmitError('Preencha o código, o e-mail e a senha.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const auth = await acceptInstructorInvite(code.trim(), {
        email: email.trim(),
        password,
        name: name.trim() || null,
      });
      await setInstructorToken(auth.access_token);
      router.replace('/instrutor/painel');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setSubmitError('Código de convite inválido ou já usado.');
      } else if (error instanceof ApiError && error.status === 409) {
        setSubmitError('Já existe uma conta com este e-mail — tente entrar em vez de se cadastrar.');
      } else if (error instanceof ApiError && error.status === 422) {
        setSubmitError('Confira os dados preenchidos.');
      } else {
        setSubmitError(error instanceof ApiError ? error.message : 'Não foi possível aceitar o convite.');
      }
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
          <Stack.Screen options={{ title: 'Aceitar convite' }} />
          <OrganicText size="title">Criar conta de instrutor</OrganicText>
          <OrganicText color="textSecondary">
            Peça o código de convite pra quem está aprendendo, no Perfil dele.
          </OrganicText>

          <View style={styles.formWrapper}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Código do convite"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              style={inputStyle}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Seu nome (opcional)"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
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
              placeholder="Crie uma senha"
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
              label={isSubmitting ? 'Criando conta…' : 'Criar conta e ver o painel'}
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
    gap: Spacing.four,
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
