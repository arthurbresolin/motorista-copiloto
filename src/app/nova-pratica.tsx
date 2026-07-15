import { Checkbox, Column, Host } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createPracticeSession } from '@/api/practice-sessions';
import { ApiError } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MANEUVER_OPTIONS = ['Baliza', 'Rotatória', 'Estacionamento', 'Rodovia', 'Curva', 'Marcha à ré'];

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDecimal(value: string) {
  return Number(value.trim().replace(',', '.'));
}

export default function NovaPraticaScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [selectedManeuvers, setSelectedManeuvers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{ duration?: string; distance?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  async function handleSave() {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setSubmitError('');
    try {
      await createPracticeSession({
        practiced_at: todayIsoDate(),
        duration_minutes: Math.round(parseDecimal(durationMinutes)),
        distance_km: parseDecimal(distanceKm),
        maneuvers: Array.from(selectedManeuvers),
        notes: notes.trim() === '' ? null : notes.trim(),
      });
      router.replace('/explore');
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Não foi possível salvar a sessão de prática.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Duração (minutos)</ThemedText>
          <TextInput
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="numeric"
            placeholder="ex: 45"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {fieldErrors.duration && (
            <ThemedText type="small" themeColor="textSecondary">
              {fieldErrors.duration}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Distância (km)</ThemedText>
          <TextInput
            value={distanceKm}
            onChangeText={setDistanceKm}
            keyboardType="numeric"
            placeholder="ex: 12.5"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          {fieldErrors.distance && (
            <ThemedText type="small" themeColor="textSecondary">
              {fieldErrors.distance}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Manobras praticadas</ThemedText>
          <Host matchContents>
            <Column spacing={Spacing.two}>
              {MANEUVER_OPTIONS.map((maneuver) => (
                <Checkbox
                  key={maneuver}
                  label={maneuver}
                  value={selectedManeuvers.has(maneuver)}
                  onValueChange={() => toggleManeuver(maneuver)}
                />
              ))}
            </Column>
          </Host>
        </ThemedView>

        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Observações</ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="opcional"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              styles.notesInput,
              { color: theme.text, backgroundColor: theme.backgroundElement },
            ]}
          />
        </ThemedView>

        {submitError !== '' && (
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            {submitError}
          </ThemedText>
        )}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <ThemedView type="backgroundElement" style={styles.saveButtonInner}>
            <ThemedText type="link">{isSaving ? 'Salvando…' : 'Salvar sessão'}</ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
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
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  notesInput: {
    minHeight: Platform.select({ web: 96, default: 80 }),
    textAlignVertical: 'top',
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  saveButton: {
    alignSelf: 'flex-start',
  },
  saveButtonInner: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
});
