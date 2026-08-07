import { Stack, useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import {
  createQuizSession,
  getQuizPhases,
  getQuizQuestions,
  type QuizAnswer,
  type QuizPhase,
  type QuizQuestion,
  type QuizSession,
} from '@/api/quiz';
import {
  OrganicButton,
  OrganicProgressBar,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { SKILLS, type Skill } from '@/constants/skills';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSkillDetailSheet } from '@/hooks/use-skill-detail-sheet';

type LoadState = 'loading' | 'error' | 'ready';
type QuizStage = 'playing' | 'submitting' | 'finished';

const QUIZ_PASS_RATIO = 0.7;
// A partir da 2ª falha seguida na mesma fase, o card de resultado troca o
// tom sério por um mais leve e sugere revisar em vez de só "tente de novo".
const ENCOURAGEMENT_THRESHOLD = 2;
// SkillDetailSheet normalmente ancora perto do toque (nó da trilha) — aqui
// não tem um nó pra ancorar perto, só um botão de texto, então usa uma
// posição fixa razoável (perto do topo da área de conteúdo).
const DEFAULT_SHEET_ANCHOR_Y = 200;

// Passar no quiz nunca libera a próxima fase direto — libera a prática
// dessa habilidade (backend exige as duas coisas, ver quiz.py
// _is_practice_done). "geral" é a exceção: não tem prática própria, então
// passar nela já libera a próxima fase de verdade.
function passedMessage(skill: Skill | undefined): string {
  if (!skill) {
    return 'Passou! A próxima fase foi liberada.';
  }
  if (skill.maneuver) {
    return 'Passou! Agora pratique no Modo Copiloto pra destravar a próxima habilidade.';
  }
  if (skill.key === 'checklist') {
    return 'Passou! Agora conclua o checklist pra destravar a próxima habilidade.';
  }
  return 'Passou! Agora monitore uma sessão de direção suave pra destravar a próxima habilidade.';
}

export default function QuizPhaseScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phase, setPhase] = useState<QuizPhase | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [stage, setStage] = useState<QuizStage>('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<QuizSession | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [consecutiveFails, setConsecutiveFails] = useState(0);

  const { open: openSkillDetail } = useSkillDetailSheet();
  const skillForCategory = SKILLS.find((skill) => skill.key === category);

  const loadQuestions = useCallback(async () => {
    setLoadState('loading');
    try {
      const [data, phases] = await Promise.all([getQuizQuestions(category), getQuizPhases()]);
      const index = phases.findIndex((candidate) => (candidate.category ?? 'geral') === category);
      setPhase(index >= 0 ? phases[index] : null);
      setQuestions(data);
      setStage('playing');
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption(null);
      setResult(null);
      setLoadState('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setErrorMessage('Essa fase ainda está travada — complete a fase anterior com pelo menos 70% pra liberar.');
      } else {
        setErrorMessage(error instanceof ApiError ? error.message : 'Não foi possível carregar as perguntas.');
      }
      setLoadState('error');
    }
  }, [category]);

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
      const session = await createQuizSession(nextAnswers, category);
      const sessionPassed = session.total_questions > 0 && session.score / session.total_questions >= QUIZ_PASS_RATIO;
      setConsecutiveFails((count) => (sessionPassed ? 0 : count + 1));
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

  const passed = result !== null && result.total_questions > 0 && result.score / result.total_questions >= QUIZ_PASS_RATIO;
  const showEncouragement = !passed && consecutiveFails >= ENCOURAGEMENT_THRESHOLD;

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <Stack.Screen options={{ title: phase?.label ?? 'Quiz' }} />
        <View style={styles.container}>
        <View style={styles.titleContainer}>
          <OrganicText size="subtitle">{phase?.label ?? 'Quiz'}</OrganicText>
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
            <OrganicButton label="Voltar" variant="neutral" onPress={() => router.back()} />
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
              <OrganicText size="small" color="onAccent" style={styles.centerText}>
                {passed
                  ? passedMessage(skillForCategory)
                  : showEncouragement
                    ? 'Essa tá osso, hein? 😅 Bora dar uma revisada antes de tentar de novo?'
                    : 'Não chegou a 70% — tente de novo pra liberar a próxima fase.'}
              </OrganicText>
            </OrganicSurface>
            <OrganicButton label="Tentar de novo" onPress={handleRestart} />
            {showEncouragement && skillForCategory && (
              <OrganicButton
                label="📖 Rever dicas"
                variant="neutral"
                onPress={() => openSkillDetail(skillForCategory.key, DEFAULT_SHEET_ANCHOR_Y)}
              />
            )}
            <OrganicButton label="Voltar pras fases" variant="neutral" onPress={() => router.back()} />
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
