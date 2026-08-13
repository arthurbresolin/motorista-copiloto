import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPracticeSessionFeedback, getPracticeSessionPhotoFeedback } from '@/api/coach';
import { createMonitorSession } from '@/api/monitor-sessions';
import { createPracticeSession } from '@/api/practice-sessions';
import {
  LessonIllustration,
  OrganicButton,
  OrganicProgressBar,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { SKILLS } from '@/constants/skills';
import { MaxContentWidth, RadiusMd, Spacing } from '@/constants/theme';
import { useDrivingMonitor } from '@/hooks/use-driving-monitor';
import { todayIsoDate } from '@/lib/format';
import { computeRouteDistanceKm } from '@/lib/route-projection';

type Phase = 'ready' | 'playing' | 'saving' | 'finished';
type PhotoFeedbackState = 'idle' | 'camera' | 'uploading' | 'ready' | 'error';

const MODERATE_EVENT_CUE = 'Freada ou aceleração brusca — tenta suavizar.';
const SEVERE_EVENT_CUE = 'Movimento muito brusco! Vai com mais calma no acelerador e no freio.';
const AUTO_ADVANCE_DELAY_MS = 2000;

export default function CopilotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const skill = SKILLS.find((candidate) => candidate.key === id && candidate.maneuver);
  const steps = skill?.tips ?? [];

  const [phase, setPhase] = useState<Phase>('ready');
  const [stepIndex, setStepIndex] = useState(0);
  const [savedSummary, setSavedSummary] = useState<{
    minutes: number;
    km: number;
    events: number;
    severeEvents: number;
  } | null>(null);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [practiceSessionId, setPracticeSessionId] = useState<number | null>(null);
  const [photoFeedbackState, setPhotoFeedbackState] = useState<PhotoFeedbackState>('idle');
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const sessionStartedAtRef = useRef<Date | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNextRef = useRef<() => void>(() => {});
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const monitor = useDrivingMonitor((severity) =>
    Speech.speak(severity === 'severe' ? SEVERE_EVENT_CUE : MODERATE_EVENT_CUE, { language: 'pt-BR' }),
  );

  function clearAutoAdvance() {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }

  // Avança sozinho depois de um tempo estimado pela duração da fala — dá pra
  // usar sem tocar na tela. O evento "terminou de falar" do TTS não é confiável
  // em todas as plataformas (varia entre navegador/celular), então o tempo é
  // calculado pelo texto em vez de depender desse evento. O botão "Próximo
  // passo" continua ali pra quem quiser pular na hora.
  function estimateSpeechMs(text: string) {
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1500, wordCount * 380);
  }

  function speakStep(index: number) {
    clearAutoAdvance();
    const text = steps[index];
    if (!text) {
      return;
    }
    Speech.stop();
    Speech.speak(text, { language: 'pt-BR' });
    autoAdvanceTimeoutRef.current = setTimeout(
      () => handleNextRef.current(),
      estimateSpeechMs(text) + AUTO_ADVANCE_DELAY_MS,
    );
  }

  function handleStart() {
    sessionStartedAtRef.current = new Date();
    monitor.start();
    setPhase('playing');
    speakStep(0);
  }

  const finishSession = useCallback(async () => {
    setPhase('saving');
    Speech.speak('Exercício concluído. Mandou bem!', { language: 'pt-BR' });

    const summary = monitor.stop();
    const startedAt = sessionStartedAtRef.current ?? new Date();
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));
    const distanceKm = summary ? Math.round(computeRouteDistanceKm(summary.route) * 10) / 10 : 0;
    const eventCount = summary?.eventCount ?? 0;
    const severeEventCount = summary?.severeEventCount ?? 0;

    try {
      if (summary) {
        await createMonitorSession({
          started_at: summary.startedAt.toISOString(),
          duration_seconds: summary.durationSeconds,
          event_count: summary.eventCount,
          severe_event_count: summary.severeEventCount,
          route: summary.route.length > 0 ? summary.route : null,
        });
      }
      const practiceSession = await createPracticeSession({
        practiced_at: todayIsoDate(),
        duration_minutes: durationMinutes,
        distance_km: distanceKm,
        maneuvers: skill?.maneuver ? [skill.maneuver] : [],
        notes: 'Registrado via Modo Copiloto',
        car_id: null,
        // É a aula guiada — esta é a sessão que conclui a habilidade na trilha.
        guided: true,
      });
      setPracticeSessionId(practiceSession.id);

      // Dica da IA é um extra — busca depois de já mostrar a conclusão, sem
      // travar a tela nem quebrar o fluxo se a chave ainda não estiver configurada.
      getPracticeSessionFeedback(practiceSession.id)
        .then((feedback) => {
          if (feedback.available && feedback.message) {
            setCoachMessage(feedback.message);
          }
        })
        .catch(() => {});
    } catch {
      // Sessão já foi vivida; falha ao salvar não pode travar a tela de conclusão.
    }

    setSavedSummary({ minutes: durationMinutes, km: distanceKm, events: eventCount, severeEvents: severeEventCount });
    setPhase('finished');
  }, [monitor, skill]);

  async function handleOpenCamera() {
    setPhotoError('');
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setPhotoError('Precisamos de acesso à câmera pra tirar a foto.');
        setPhotoFeedbackState('error');
        return;
      }
    }
    setPhotoFeedbackState('camera');
  }

  async function handleCapturePhoto() {
    if (!practiceSessionId) {
      return;
    }
    setPhotoFeedbackState('uploading');
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo?.base64) {
        throw new Error('sem imagem');
      }
      const feedback = await getPracticeSessionPhotoFeedback(practiceSessionId, {
        image_base64: photo.base64,
        media_type: 'image/jpeg',
      });
      if (feedback.available && feedback.message) {
        setPhotoMessage(feedback.message);
        setPhotoFeedbackState('ready');
      } else {
        setPhotoError('A IA não conseguiu avaliar a foto agora — tente de novo em instantes.');
        setPhotoFeedbackState('error');
      }
    } catch {
      setPhotoError('Não foi possível tirar ou analisar a foto.');
      setPhotoFeedbackState('error');
    }
  }

  function handleNext() {
    clearAutoAdvance();
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setStepIndex(nextIndex);
      speakStep(nextIndex);
      return;
    }
    finishSession();
  }

  handleNextRef.current = handleNext;

  useEffect(() => {
    return () => {
      clearAutoAdvance();
      Speech.stop();
    };
  }, []);

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

  if (!skill) {
    return (
      <ScreenBackground style={styles.centerContent}>
        <OrganicText color="textSecondary">Exercício não encontrado.</OrganicText>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <Stack.Screen options={{ title: `Copiloto · ${skill.label}` }} />
        <View style={styles.container}>
          {phase === 'ready' && (
            <View style={styles.stepWrapper}>
              <OrganicText size="title" style={styles.centerText}>
                {skill.label}
              </OrganicText>
              <OrganicText color="textSecondary" style={styles.centerText}>
                O celular vai falar cada passo em voz alta e avançar sozinho — o sensor de
                movimento liga junto. Encaixe o celular no painel antes de começar.
              </OrganicText>
              <View style={styles.actionsWrapper}>
                <OrganicButton label="🎙️ Começar exercício" onPress={handleStart} />
              </View>
            </View>
          )}

          {phase === 'playing' && (
            <>
              <View style={styles.progressWrapper}>
                <OrganicText size="small" color="textSecondary">
                  Passo {stepIndex + 1} de {steps.length}
                  {monitor.state === 'monitoring' ? ' · sensor ativo' : ''}
                </OrganicText>
                <OrganicProgressBar progress={(stepIndex + 1) / steps.length} />
              </View>

              <View style={styles.stepWrapper}>
                {/* Diagrama fica acima do passo, não no lugar dele: a voz e o
                    texto continuam sendo a instrução, o desenho é referência
                    de "onde", pra quem nunca viu um câmbio manual. */}
                {skill.illustration && (
                  <View style={styles.illustrationWrapper}>
                    <LessonIllustration id={skill.illustration} />
                  </View>
                )}
                <OrganicText size="title" style={styles.centerText}>
                  {steps[stepIndex]}
                </OrganicText>
              </View>

              <View style={styles.actionsWrapper}>
                <OrganicButton
                  label="🔊 Repetir"
                  variant="neutral"
                  onPress={() => speakStep(stepIndex)}
                />
                <OrganicButton
                  label={stepIndex + 1 < steps.length ? 'Próximo passo' : 'Concluir'}
                  onPress={handleNext}
                />
              </View>
            </>
          )}

          {phase === 'saving' && (
            <View style={styles.stepWrapper}>
              <OrganicText size="title" style={styles.centerText}>
                Salvando sessão…
              </OrganicText>
            </View>
          )}

          {phase === 'finished' && savedSummary && photoFeedbackState === 'camera' && (
            <View style={styles.stepWrapper}>
              <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                Enquadre o carro estacionado e tire a foto.
              </OrganicText>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
              <View style={styles.actionsWrapper}>
                <OrganicButton label="📸 Tirar foto" onPress={handleCapturePhoto} />
                <OrganicButton
                  label="Cancelar"
                  variant="neutral"
                  onPress={() => setPhotoFeedbackState('idle')}
                />
              </View>
            </View>
          )}

          {phase === 'finished' && savedSummary && photoFeedbackState !== 'camera' && (
            <View style={styles.stepWrapper}>
              <OrganicText size="title" style={styles.centerText}>
                Exercício concluído! 🎉
              </OrganicText>
              <OrganicText color="textSecondary" style={styles.centerText}>
                {savedSummary.minutes} min · {savedSummary.km} km ·{' '}
                {savedSummary.events === 0
                  ? 'nenhum movimento brusco'
                  : `${savedSummary.events} movimento(s) brusco(s)${
                      savedSummary.severeEvents > 0 ? ` (${savedSummary.severeEvents} grave(s))` : ''
                    }`}
              </OrganicText>
              <OrganicText color="textSecondary" style={styles.centerText}>
                Sessão já registrada — não precisa preencher nada.
              </OrganicText>
              {coachMessage && (
                <OrganicText style={styles.centerText}>💬 {coachMessage}</OrganicText>
              )}

              {photoFeedbackState === 'uploading' && (
                <View style={styles.centerContent}>
                  <ActivityIndicator />
                  <OrganicText size="small" color="textSecondary">
                    Analisando a foto…
                  </OrganicText>
                </View>
              )}

              {photoFeedbackState === 'ready' && photoMessage && (
                <OrganicText style={styles.centerText}>📷 {photoMessage}</OrganicText>
              )}

              {photoFeedbackState === 'error' && photoError !== '' && (
                <OrganicText color="textSecondary" style={styles.centerText}>
                  {photoError}
                </OrganicText>
              )}

              <View style={styles.actionsWrapper}>
                {skill.supportsPhotoFeedback &&
                  practiceSessionId !== null &&
                  (photoFeedbackState === 'idle' || photoFeedbackState === 'error') && (
                    <OrganicButton
                      label="📷 Foto do resultado"
                      variant="neutral"
                      onPress={handleOpenCamera}
                    />
                  )}
                <OrganicButton label="Voltar pra trilha" onPress={() => router.back()} />
              </View>
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
    gap: Spacing.five,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  progressWrapper: {
    gap: Spacing.two,
  },
  stepWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  illustrationWrapper: {
    alignItems: 'center',
  },
  actionsWrapper: {
    gap: Spacing.two,
  },
  camera: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: RadiusMd,
    overflow: 'hidden',
  },
});
