import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { registerLearner } from '@/api/learners';
import { OrganicButton, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
import { useLearnerSession } from '@/hooks/use-learner-session';
import { useTheme } from '@/hooks/use-theme';
import { setLearnerToken } from '@/lib/learner-auth-storage';

const MIN_PASSWORD_LENGTH = 8;

export default function LearnerRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { refresh } = useLearnerSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setSubmitError('Preencha o e-mail e a senha.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const auth = await registerLearner({
        email: email.trim(),
        password,
        name: name.trim() || null,
      });
      await setLearnerToken(auth.access_token);
      await refresh();
      router.replace('/');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setSubmitError('Já existe uma conta com este e-mail — tente entrar em vez de se cadastrar.');
      } else if (error instanceof ApiError && error.status === 422) {
        setSubmitError('Confira os dados preenchidos.');
      } else {
        setSubmitError(error instanceof ApiError ? error.message : 'Não foi possível criar a conta.');
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
          <Stack.Screen options={{ title: 'Criar conta' }} />
          <View style={styles.titleWrapper}>
            <OrganicText size="title">Criar sua conta</OrganicText>
            <OrganicText color="textSecondary">
              Sua trilha, prática e progresso ficam salvos só pra você.
            </OrganicText>
          </View>

          <View style={styles.formWrapper}>
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
              label={isSubmitting ? 'Criando conta…' : 'Criar conta'}
              disabled={isSubmitting}
              onPress={handleSubmit}
            />
            <OrganicButton
              label="Já tenho conta — entrar"
              variant="neutral"
              onPress={() => router.push('/entrar')}
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
