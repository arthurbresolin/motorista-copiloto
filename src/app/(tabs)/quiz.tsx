import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import {
  createQuizSession,
  getQuizQuestions,
  type QuizAnswer,
  type QuizQuestion,
  type QuizSession,
} from '@/api/quiz';
import { OrganicButton, OrganicProgressBar, OrganicSurface, OrganicText } from '@/components/organic';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadState = 'loading' | 'error' | 'ready';
type QuizStage = 'playing' | 'submitting' | 'finished';

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [stage, setStage] = useState<QuizStage>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<QuizSession | null>(null);
  const [submitError, setSubmitError] = useState('');

  const loadQuestions = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await getQuizQuestions();
      setQuestions(data);
      setStage('playing');
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption(null);
      setResult(null);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Não foi possível carregar as perguntas.',
      );
      setLoadState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuestions();
    }, [loadQuestions]),
  );

  const currentQuestion = questions[currentIndex];

  async function handleNext() {
    if (selectedOption === null || !currentQuestion) {
      return;
    }

    const nextAnswers = [...answers, { question_id: currentQuestion.id, selected_index: selectedOption }];
    setAnswers(nextAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    setStage('submitting');
    setSubmitError('');
    try {
      const session = await createQuizSession(nextAnswers);
      setResult(session);
      setStage('finished');
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Não foi possível enviar o resultado do quiz.',
      );
      setStage('playing');
    }
  }

  function handleRestart() {
    setStage('playing');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setResult(null);
  }

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">Quiz de teoria</OrganicText>
          <OrganicText color="textSecondary" style={styles.centerText}>
            Treine antes da prova com perguntas de teoria de trânsito.
          </OrganicText>
        </View>

        {loadState === 'loading' && (
          <View style={styles.centerContent}>
            <ActivityIndicator />
          </View>
        )}

        {loadState === 'error' && (
          <View style={styles.centerContent}>
            <OrganicText color="textSecondary" style={styles.centerText}>
              {errorMessage}
            </OrganicText>
            <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadQuestions} />
          </View>
        )}

        {loadState === 'ready' && questions.length === 0 && (
          <OrganicText color="textSecondary" style={styles.centerText}>
            Nenhuma pergunta cadastrada ainda.
          </OrganicText>
        )}

        {loadState === 'ready' && questions.length > 0 && (stage === 'playing' || stage === 'submitting') && currentQuestion && (
          <View style={styles.playWrapper}>
            <OrganicText size="small" color="textSecondary">
              Pergunta {currentIndex + 1} de {questions.length}
            </OrganicText>
            <OrganicProgressBar progress={(currentIndex + 1) / questions.length} />

            <OrganicSurface backgroundColor="backgroundElement" style={styles.questionCard}>
              <OrganicText size="small">{currentQuestion.prompt}</OrganicText>
            </OrganicSurface>

            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedOption(index)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <OrganicSurface
                    backgroundColor={selectedOption === index ? 'accent' : 'backgroundElement'}
                    shadow={false}
                    style={styles.optionCard}>
                    <OrganicText
                      size="small"
                      color={selectedOption === index ? 'onAccent' : 'text'}>
                      {option}
                    </OrganicText>
                  </OrganicSurface>
                </Pressable>
              ))}
            </View>

            {submitError !== '' && (
              <OrganicText color="textSecondary" style={styles.centerText}>
                {submitError}
              </OrganicText>
            )}

            <OrganicButton
              label={
                stage === 'submitting'
                  ? 'Enviando…'
                  : currentIndex + 1 < questions.length
                    ? 'Próxima'
                    : 'Ver resultado'
              }
              disabled={selectedOption === null || stage === 'submitting'}
              onPress={handleNext}
            />
          </View>
        )}

        {stage === 'finished' && result && (
          <View style={styles.playWrapper}>
            <OrganicSurface backgroundColor="accent" style={styles.resultCard}>
              <OrganicText size="title" color="onAccent">
                {result.score}/{result.total_questions}
              </OrganicText>
              <OrganicText size="small" color="onAccent">
                +{result.score * 15} XP
              </OrganicText>
            </OrganicSurface>
            <OrganicButton label="Tentar de novo" onPress={handleRestart} />
          </View>
        )}
      </View>
    </ScrollView>
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
  titleContainer: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  playWrapper: {
    gap: Spacing.three,
  },
  questionCard: {
    padding: Spacing.three,
  },
  optionsList: {
    gap: Spacing.two,
  },
  optionCard: {
    padding: Spacing.three,
  },
  resultCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
});
