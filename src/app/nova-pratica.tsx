import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL, ApiError } from '@/api/client';
import { getCars, type Car } from '@/api/cars';
import { getPracticeSessionFeedback, getPracticeSessionPhotoFeedback } from '@/api/coach';
import type { PickedImage } from '@/api/learners';
import {
  createPracticeSession,
  uploadPracticeSessionBeforePhoto,
  type PracticeSession,
} from '@/api/practice-sessions';
import {
  FadeSlideIn,
  OrganicButton,
  OrganicSurface,
  OrganicText,
  ScreenBackground,
} from '@/components/organic';
import { SKILLS, type SkillDifficulty } from '@/constants/skills';
import {
  BodyFontFamily,
  BorderWidth,
  MaxContentWidth,
  RadiusMd,
  RadiusPill,
  RadiusSm,
  Spacing,
  type ThemeColor,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayIsoDate } from '@/lib/format';

type CarsLoadState = 'loading' | 'error' | 'ready';
type Phase = 'form' | 'result';

const MANEUVER_SKILLS = SKILLS.filter((skill) => skill.maneuver);

const DIFFICULTY_LABEL: Record<SkillDifficulty, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const DIFFICULTY_COLOR: Record<SkillDifficulty, ThemeColor> = {
  iniciante: 'accent2',
  intermediario: 'warning',
  avancado: 'danger',
};

const DIFFICULTY_TEXT_COLOR: Record<SkillDifficulty, ThemeColor> = {
  iniciante: 'onAccent2',
  intermediario: 'onWarning',
  avancado: 'background',
};

function parseDecimal(value: string) {
  return Number(value.trim().replace(',', '.'));
}

function toPickedImage(asset: ImagePicker.ImagePickerAsset, fallbackName: string): PickedImage {
  return {
    uri: asset.uri,
    name: asset.fileName ?? fallbackName,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export default function NovaPraticaScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [phase, setPhase] = useState<Phase>('form');

  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [selectedManeuvers, setSelectedManeuvers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoadState, setCarsLoadState] = useState<CarsLoadState>('loading');
  const [carsError, setCarsError] = useState('');
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);

  const [beforePhoto, setBeforePhoto] = useState<PickedImage | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<(PickedImage & { base64: string }) | null>(null);
  const [photoError, setPhotoError] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{ duration?: string; distance?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [savedSession, setSavedSession] = useState<PracticeSession | null>(null);
  const [textFeedback, setTextFeedback] = useState<string | null>(null);
  const [textFeedbackLoading, setTextFeedbackLoading] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [photoFeedbackLoading, setPhotoFeedbackLoading] = useState(false);

  async function loadCars() {
    setCarsLoadState('loading');
    try {
      const data = await getCars();
      setCars(data);
      setCarsLoadState('ready');
    } catch (error) {
      setCarsError(
        error instanceof ApiError ? error.message : 'Não foi possível carregar os carros.',
      );
      setCarsLoadState('error');
    }
  }

  useEffect(() => {
    loadCars();
  }, []);

  function toggleManeuver(maneuver: string) {
    setSelectedManeuvers((current) => {
      const next = new Set(current);
      if (next.has(maneuver)) {
        next.delete(maneuver);
      } else {
        next.add(maneuver);
      }
      return next;
    });
  }

  async function handlePickBeforePhoto() {
    setPhotoError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Precisamos de acesso à galeria pra escolher uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      setBeforePhoto(toPickedImage(result.assets[0], 'antes.jpg'));
    }
  }

  async function handlePickAfterPhoto(source: 'gallery' | 'camera') {
    setPhotoError('');
    if (source === 'gallery') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError('Precisamos de acesso à galeria pra escolher uma foto.');
        return;
      }
    } else {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          setPhotoError('Precisamos de acesso à câmera pra tirar uma foto.');
          return;
        }
      }
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, base64: true };
    const result =
      source === 'gallery'
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset.base64) {
        setPhotoError('Não foi possível processar essa foto, tenta outra.');
        return;
      }
      setAfterPhoto({ ...toPickedImage(asset, 'resultado.jpg'), base64: asset.base64 });
    }
  }

  function validate() {
    const duration = parseDecimal(durationMinutes);
    const distance = parseDecimal(distanceKm);
    const errors: { duration?: string; distance?: string } = {};

    if (durationMinutes.trim() === '' || !Number.isFinite(duration) || duration <= 0) {
      errors.duration = 'Informe uma duração válida, em minutos.';
    }
    if (distanceKm.trim() === '' || !Number.isFinite(distance) || distance <= 0) {
      errors.distance = 'Informe uma distância válida, em km.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function loadTextFeedback(sessionId: number) {
    setTextFeedbackLoading(true);
    try {
      const feedback = await getPracticeSessionFeedback(sessionId);
      setTextFeedback(feedback.available ? feedback.message : null);
    } catch {
      setTextFeedback(null);
    } finally {
      setTextFeedbackLoading(false);
    }
  }

  async function loadPhotoFeedback(sessionId: number, photo: PickedImage & { base64: string }) {
    setPhotoFeedbackLoading(true);
    try {
      const feedback = await getPracticeSessionPhotoFeedback(sessionId, {
        image_base64: photo.base64,
        media_type: photo.type,
      });
      setPhotoFeedback(feedback.available ? feedback.message : null);
    } catch {
      setPhotoFeedback(null);
    } finally {
      setPhotoFeedbackLoading(false);
    }
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setSubmitError('');
    try {
      let session = await createPracticeSession({
        practiced_at: todayIsoDate(),
        duration_minutes: Math.round(parseDecimal(durationMinutes)),
        distance_km: parseDecimal(distanceKm),
        maneuvers: Array.from(selectedManeuvers),
        notes: notes.trim() === '' ? null : notes.trim(),
        car_id: selectedCarId,
      });

      if (beforePhoto) {
        session = await uploadPracticeSessionBeforePhoto(session.id, beforePhoto);
      }

      setSavedSession(session);
      setPhase('result');
      loadTextFeedback(session.id);
      if (afterPhoto) {
        loadPhotoFeedback(session.id, afterPhoto);
      }
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar a sessão de prática.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputStyle = [
    styles.input,
    {
      fontFamily: BodyFontFamily,
      color: theme.text,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.borderColor,
    },
  ];

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

  if (phase === 'result' && savedSession) {
    return (
      <ScreenBackground>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
          <View style={styles.container}>
            <FadeSlideIn>
              <View style={styles.resultHeader}>
                <OrganicText size="title">✅ Sessão salva!</OrganicText>
                <OrganicText color="textSecondary">
                  {savedSession.duration_minutes} min · {savedSession.distance_km} km
                  {savedSession.maneuvers.length > 0 ? ` · ${savedSession.maneuvers.join(', ')}` : ''}
                </OrganicText>
              </View>
            </FadeSlideIn>

            {(savedSession.before_photo_url || afterPhoto) && (
              <FadeSlideIn delay={80}>
                <View style={styles.photosRow}>
                  {savedSession.before_photo_url && (
                    <View style={styles.photoColumn}>
                      <OrganicText size="small" color="textSecondary">
                        Antes
                      </OrganicText>
                      <Image
                        source={{ uri: `${API_BASE_URL}${savedSession.before_photo_url}` }}
                        style={styles.resultPhoto}
                      />
                    </View>
                  )}
                  {afterPhoto && (
                    <View style={styles.photoColumn}>
                      <OrganicText size="small" color="textSecondary">
                        Depois
                      </OrganicText>
                      <Image source={{ uri: afterPhoto.uri }} style={styles.resultPhoto} />
                    </View>
                  )}
                </View>
              </FadeSlideIn>
            )}

            <FadeSlideIn delay={160}>
              <OrganicSurface backgroundColor="backgroundElement" style={styles.feedbackCard}>
                <OrganicText size="small">🤖 Feedback da IA</OrganicText>
                {textFeedbackLoading && (
                  <View style={styles.centerContent}>
                    <ActivityIndicator />
                  </View>
                )}
                {!textFeedbackLoading && textFeedback && <OrganicText>{textFeedback}</OrganicText>}
                {!textFeedbackLoading && !textFeedback && (
                  <OrganicText size="small" color="textSecondary">
                    Feedback de texto indisponível pra essa sessão.
                  </OrganicText>
                )}

                {afterPhoto && (
                  <>
                    <View style={styles.feedbackDivider} />
                    {photoFeedbackLoading && (
                      <View style={styles.centerContent}>
                        <ActivityIndicator />
                      </View>
                    )}
                    {!photoFeedbackLoading && photoFeedback && <OrganicText>{photoFeedback}</OrganicText>}
                    {!photoFeedbackLoading && !photoFeedback && (
                      <OrganicText size="small" color="textSecondary">
                        Não deu pra avaliar a foto do resultado dessa vez.
                      </OrganicText>
                    )}
                  </>
                )}
              </OrganicSurface>
            </FadeSlideIn>

            <OrganicButton label="Concluir" onPress={() => router.replace('/explore')} />
          </View>
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <View style={styles.titleWrapper}>
            <OrganicText size="title">Nova prática</OrganicText>
            <OrganicText color="textSecondary">
              Escolha o que praticou, registre os detalhes e receba feedback da IA.
            </OrganicText>
          </View>

          <View style={styles.field}>
            <OrganicText size="small">Com qual carro?</OrganicText>

            {carsLoadState === 'loading' && (
              <View style={styles.centerContent}>
                <ActivityIndicator />
              </View>
            )}

            {carsLoadState === 'error' && (
              <View style={styles.centerContent}>
                <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                  {carsError}
                </OrganicText>
                <OrganicButton label="Tentar novamente" variant="neutral" onPress={loadCars} />
              </View>
            )}

            {carsLoadState === 'ready' && cars.length === 0 && (
              <View style={styles.centerContent}>
                <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                  Nenhum carro cadastrado ainda.
                </OrganicText>
                <OrganicButton
                  label="Cadastrar um carro"
                  variant="neutral"
                  onPress={() => router.push('/meu-carro')}
                />
              </View>
            )}

            {carsLoadState === 'ready' && cars.length > 0 && (
              <View style={styles.carsWrapper}>
                {cars.map((car) => (
                  <Pressable
                    key={car.id}
                    onPress={() => setSelectedCarId((current) => (current === car.id ? null : car.id))}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <OrganicSurface
                      backgroundColor={selectedCarId === car.id ? 'accent' : 'backgroundElement'}
                      shadow={false}
                      borderRadius={RadiusPill}
                      style={styles.carOption}>
                      <OrganicText size="small" color={selectedCarId === car.id ? 'onAccent' : 'text'}>
                        {car.brand_model}
                      </OrganicText>
                    </OrganicSurface>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <OrganicText size="small">O que você praticou?</OrganicText>
            <View style={styles.skillCardsWrapper}>
              {MANEUVER_SKILLS.map((skill, index) => {
                const selected = selectedManeuvers.has(skill.maneuver as string);
                return (
                  <FadeSlideIn key={skill.key} delay={index * 30}>
                    <Pressable
                      onPress={() => toggleManeuver(skill.maneuver as string)}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <OrganicSurface
                        backgroundColor={selected ? 'accent' : 'backgroundElement'}
                        style={styles.skillCard}>
                        <View style={styles.skillCardHeader}>
                          <OrganicText size="small" color={selected ? 'onAccent' : 'text'}>
                            {skill.label}
                          </OrganicText>
                          <View
                            style={[
                              styles.difficultyBadge,
                              { backgroundColor: theme[DIFFICULTY_COLOR[skill.difficulty]] },
                            ]}>
                            <OrganicText size="small" color={DIFFICULTY_TEXT_COLOR[skill.difficulty]}>
                              {DIFFICULTY_LABEL[skill.difficulty]}
                            </OrganicText>
                          </View>
                        </View>
                        <OrganicText size="small" color={selected ? 'onAccent' : 'textSecondary'}>
                          {skill.description}
                        </OrganicText>
                      </OrganicSurface>
                    </Pressable>
                  </FadeSlideIn>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <OrganicText size="small">Duração (minutos)</OrganicText>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="numeric"
              placeholder="ex: 45"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
            {fieldErrors.duration && (
              <OrganicText size="small" color="textSecondary">
                {fieldErrors.duration}
              </OrganicText>
            )}
          </View>

          <View style={styles.field}>
            <OrganicText size="small">Distância (km)</OrganicText>
            <TextInput
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              placeholder="ex: 12.5"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
            {fieldErrors.distance && (
              <OrganicText size="small" color="textSecondary">
                {fieldErrors.distance}
              </OrganicText>
            )}
          </View>

          <View style={styles.field}>
            <OrganicText size="small">Fotos (opcional)</OrganicText>
            <View style={styles.photosRow}>
              <View style={styles.photoPickerColumn}>
                <OrganicText size="small" color="textSecondary">
                  Antes
                </OrganicText>
                <Pressable onPress={handlePickBeforePhoto} style={({ pressed }) => pressed && styles.pressed}>
                  <OrganicSurface backgroundColor="backgroundElement" style={styles.photoPicker}>
                    {beforePhoto ? (
                      <Image source={{ uri: beforePhoto.uri }} style={styles.photoPreview} />
                    ) : (
                      <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                        + Escolher
                      </OrganicText>
                    )}
                  </OrganicSurface>
                </Pressable>
              </View>

              <View style={styles.photoPickerColumn}>
                <OrganicText size="small" color="textSecondary">
                  Depois (resultado)
                </OrganicText>
                <Pressable
                  onPress={() => handlePickAfterPhoto('gallery')}
                  onLongPress={() => handlePickAfterPhoto('camera')}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <OrganicSurface backgroundColor="backgroundElement" style={styles.photoPicker}>
                    {afterPhoto ? (
                      <Image source={{ uri: afterPhoto.uri }} style={styles.photoPreview} />
                    ) : (
                      <OrganicText size="small" color="textSecondary" style={styles.centerText}>
                        + Escolher
                      </OrganicText>
                    )}
                  </OrganicSurface>
                </Pressable>
              </View>
            </View>
            <OrganicText size="small" color="textSecondary">
              A foto do resultado recebe uma avaliação da IA depois de salvar. Segure o quadro
              &quot;Depois&quot; pra tirar uma foto na hora em vez de escolher da galeria.
            </OrganicText>
            {photoError !== '' && (
              <OrganicText size="small" color="textSecondary">
                {photoError}
              </OrganicText>
            )}
          </View>

          <View style={styles.field}>
            <OrganicText size="small">Observações</OrganicText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="opcional"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              style={[...inputStyle, styles.notesInput]}
            />
          </View>

          {submitError !== '' && (
            <OrganicText color="textSecondary" style={styles.centerText}>
              {submitError}
            </OrganicText>
          )}

          <OrganicButton
            label={isSaving ? 'Salvando…' : 'Salvar sessão'}
            disabled={isSaving}
            onPress={handleSave}
          />
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
  titleWrapper: {
    gap: Spacing.one,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: RadiusMd,
    borderWidth: BorderWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  notesInput: {
    minHeight: Platform.select({ web: 96, default: 80 }),
    textAlignVertical: 'top',
  },
  centerContent: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  carsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  carOption: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  skillCardsWrapper: {
    gap: Spacing.two,
  },
  skillCard: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  difficultyBadge: {
    borderRadius: RadiusPill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  photosRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  photoPickerColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  photoPicker: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  resultHeader: {
    gap: Spacing.one,
  },
  photoColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  resultPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RadiusSm,
  },
  feedbackCard: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  feedbackDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
