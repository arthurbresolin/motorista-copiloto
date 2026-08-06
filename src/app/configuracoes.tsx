import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL, ApiError } from '@/api/client';
import {
  changeLearnerPassword,
  deleteLearnerAccount,
  updateLearnerProfile,
  uploadLearnerAvatar,
  type PickedImage,
  type ThemePreference,
} from '@/api/learners';
import { MascPlaceholder, OrganicButton, OrganicCheckbox, OrganicSurface, OrganicText, ScreenBackground } from '@/components/organic';
import { BodyFontFamily, BorderWidth, MaxContentWidth, RadiusMd, RadiusPill, Spacing } from '@/constants/theme';
import { useLearnerSession } from '@/hooks/use-learner-session';
import { useTheme } from '@/hooks/use-theme';
import { clearLearnerToken } from '@/lib/learner-auth-storage';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
];

const DELETE_CONFIRM_WORD = 'EXCLUIR';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { learner, themePreference, refresh, updateThemePreference } = useLearnerSession();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [name, setName] = useState(learner?.name ?? '');
  const [username, setUsername] = useState(learner?.username ?? '');
  const [displayName, setDisplayName] = useState(learner?.display_name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [themeSaving, setThemeSaving] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await updateLearnerProfile({
        name: name.trim() === '' ? null : name.trim(),
        username: username.trim() === '' ? null : username.trim(),
        display_name: displayName.trim() === '' ? null : displayName.trim(),
      });
      await refresh();
      setProfileSaved(true);
    } catch (error) {
      setProfileError(error instanceof ApiError ? error.message : 'Não foi possível salvar o perfil.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function uploadAvatarAsset(asset: ImagePicker.ImagePickerAsset) {
    setAvatarUploading(true);
    setAvatarError('');
    const picked: PickedImage = {
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    };
    try {
      await uploadLearnerAvatar(picked);
      await refresh();
    } catch (error) {
      setAvatarError(error instanceof ApiError ? error.message : 'Não foi possível enviar a foto.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePickFromGallery() {
    setAvatarError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError('Precisamos de acesso à galeria pra escolher uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      await uploadAvatarAsset(result.assets[0]);
    }
  }

  async function handlePickFromCamera() {
    setAvatarError('');
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        setAvatarError('Precisamos de acesso à câmera pra tirar uma foto.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      await uploadAvatarAsset(result.assets[0]);
    }
  }

  async function handleChangePassword() {
    setPasswordError('');
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    setPasswordSaving(true);
    try {
      await changeLearnerPassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
    } catch (error) {
      setPasswordError(
        error instanceof ApiError && error.status === 401
          ? 'Senha atual incorreta.'
          : error instanceof ApiError
            ? error.message
            : 'Não foi possível trocar a senha.',
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSelectTheme(preference: ThemePreference) {
    if (preference === themePreference || themeSaving) return;
    setThemeSaving(true);
    try {
      await updateThemePreference(preference);
    } catch {
      // preferência de tema não é crítica — se falhar, o usuário só tenta de novo
    } finally {
      setThemeSaving(false);
    }
  }

  async function handleToggleNotifications() {
    if (notificationsSaving) return;
    setNotificationsSaving(true);
    try {
      await updateLearnerProfile({ notifications_enabled: !(learner?.notifications_enabled ?? true) });
      await refresh();
    } catch {
      // idem — preferência não crítica
    } finally {
      setNotificationsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteLearnerAccount();
      await clearLearnerToken();
      await refresh();
      router.replace('/entrar');
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : 'Não foi possível excluir a conta.');
      setDeleting(false);
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

  const avatarUri = learner?.avatar_url ? `${API_BASE_URL}${learner.avatar_url}` : null;
  const cameraStatus = cameraPermission?.granted
    ? 'Permitida'
    : cameraPermission?.canAskAgain === false
      ? 'Negada — precisa liberar nas configurações do sistema'
      : 'Ainda não solicitada';
  const canConfirmDelete = deleteConfirmText.trim().toUpperCase() === DELETE_CONFIRM_WORD;

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <OrganicText size="subtitle">Configurações</OrganicText>
            <OrganicText color="textSecondary">Seu perfil, segurança e preferências.</OrganicText>
          </View>

          <View style={styles.sectionsWrapper}>
            {/* Perfil */}
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Perfil</OrganicText>

              <View style={styles.avatarRow}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <MascPlaceholder size={88} />
                )}
                <View style={styles.avatarButtons}>
                  <OrganicButton
                    label={avatarUploading ? 'Enviando…' : '📁 Galeria'}
                    variant="neutral"
                    disabled={avatarUploading}
                    onPress={handlePickFromGallery}
                  />
                  <OrganicButton
                    label="📷 Câmera"
                    variant="neutral"
                    disabled={avatarUploading}
                    onPress={handlePickFromCamera}
                  />
                </View>
              </View>
              {avatarError !== '' && (
                <OrganicText size="small" color="textSecondary">
                  {avatarError}
                </OrganicText>
              )}

              <View style={styles.field}>
                <OrganicText size="small" color="textSecondary">
                  E-mail
                </OrganicText>
                <OrganicSurface backgroundColor="backgroundSelected" inset shadow={false} style={styles.readOnlyField}>
                  <OrganicText size="small">{learner?.email}</OrganicText>
                </OrganicSurface>
              </View>

              <View style={styles.field}>
                <OrganicText size="small" color="textSecondary">
                  Nome
                </OrganicText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={theme.textSecondary}
                  style={inputStyle}
                />
              </View>

              <View style={styles.field}>
                <OrganicText size="small" color="textSecondary">
                  Nome de usuário
                </OrganicText>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex: joaozinho"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  style={inputStyle}
                />
              </View>

              <View style={styles.field}>
                <OrganicText size="small" color="textSecondary">
                  Nome de exibição
                </OrganicText>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Como quer aparecer no app"
                  placeholderTextColor={theme.textSecondary}
                  style={inputStyle}
                />
              </View>

              {profileError !== '' && (
                <OrganicText size="small" color="textSecondary">
                  {profileError}
                </OrganicText>
              )}
              {profileSaved && (
                <OrganicText size="small" color="textSecondary">
                  Perfil salvo.
                </OrganicText>
              )}

              <OrganicButton
                label={profileSaving ? 'Salvando…' : 'Salvar perfil'}
                disabled={profileSaving}
                onPress={handleSaveProfile}
              />
            </OrganicSurface>

            {/* Segurança */}
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Segurança</OrganicText>

              <View style={styles.field}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Senha atual"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  style={inputStyle}
                />
              </View>
              <View style={styles.field}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nova senha"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  style={inputStyle}
                />
              </View>
              <View style={styles.field}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar nova senha"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  style={inputStyle}
                />
              </View>

              {passwordError !== '' && (
                <OrganicText size="small" color="textSecondary">
                  {passwordError}
                </OrganicText>
              )}
              {passwordSaved && (
                <OrganicText size="small" color="textSecondary">
                  Senha atualizada.
                </OrganicText>
              )}

              <OrganicButton
                label={passwordSaving ? 'Salvando…' : 'Trocar senha'}
                disabled={passwordSaving}
                onPress={handleChangePassword}
              />
            </OrganicSurface>

            {/* Aparência */}
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Aparência</OrganicText>
              <View style={styles.themeOptionsRow}>
                {THEME_OPTIONS.map((option) => {
                  const selected = option.value === themePreference;
                  return (
                    <Pressable
                      key={option.value}
                      style={styles.themeOptionWrapper}
                      disabled={themeSaving}
                      onPress={() => handleSelectTheme(option.value)}>
                      <OrganicSurface
                        backgroundColor={selected ? 'accent' : 'backgroundSelected'}
                        inset={!selected}
                        shadow={selected}
                        borderRadius={RadiusPill}
                        style={styles.themeOption}>
                        <OrganicText size="small" color={selected ? 'onAccent' : 'text'}>
                          {option.label}
                        </OrganicText>
                      </OrganicSurface>
                    </Pressable>
                  );
                })}
              </View>
            </OrganicSurface>

            {/* Notificações */}
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Notificações</OrganicText>
              <OrganicCheckbox
                label="Notificações do app"
                value={learner?.notifications_enabled ?? true}
                onValueChange={handleToggleNotifications}
              />
              <OrganicText size="small" color="textSecondary">
                Em breve vamos usar isso pra te lembrar de praticar.
              </OrganicText>
            </OrganicSurface>

            {/* Permissões */}
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Permissões</OrganicText>
              <OrganicText size="small" color="textSecondary">
                Câmera: {cameraStatus}
              </OrganicText>
              {Platform.OS === 'web' ? (
                <OrganicText size="small" color="textSecondary">
                  No navegador, a permissão de câmera é gerenciada nas configurações do próprio
                  site.
                </OrganicText>
              ) : (
                <OrganicButton
                  label="Abrir configurações do sistema"
                  variant="neutral"
                  onPress={() => Linking.openSettings()}
                />
              )}
            </OrganicSurface>

            {/* Conta */}
            <OrganicSurface backgroundColor="backgroundElement" style={styles.card}>
              <OrganicText size="small">Conta</OrganicText>

              {!showDeleteConfirm ? (
                <OrganicButton
                  label="Excluir conta"
                  variant="neutral"
                  onPress={() => setShowDeleteConfirm(true)}
                />
              ) : (
                <View style={styles.field}>
                  <OrganicText size="small" color="textSecondary">
                    Isso apaga sua conta e todos os seus dados (carros, práticas, progresso) de
                    forma permanente. Pra confirmar, digite {DELETE_CONFIRM_WORD} abaixo.
                  </OrganicText>
                  <TextInput
                    value={deleteConfirmText}
                    onChangeText={setDeleteConfirmText}
                    placeholder={DELETE_CONFIRM_WORD}
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    style={inputStyle}
                  />
                  {deleteError !== '' && (
                    <OrganicText size="small" color="textSecondary">
                      {deleteError}
                    </OrganicText>
                  )}
                  <Pressable
                    disabled={!canConfirmDelete || deleting}
                    onPress={handleDeleteAccount}
                    style={({ pressed }) => [!canConfirmDelete && styles.disabled, pressed && styles.pressed]}>
                    <OrganicSurface backgroundColor="danger" borderRadius={RadiusPill} style={styles.deleteButton}>
                      <OrganicText size="body" style={styles.deleteButtonLabel}>
                        {deleting ? 'Excluindo…' : 'Confirmar exclusão definitiva'}
                      </OrganicText>
                    </OrganicSurface>
                  </Pressable>
                  <OrganicButton
                    label="Cancelar"
                    variant="neutral"
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setDeleteError('');
                    }}
                  />
                </View>
              )}
            </OrganicSurface>
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
  titleContainer: {
    gap: Spacing.two,
  },
  sectionsWrapper: {
    gap: Spacing.four,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarButtons: {
    flex: 1,
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  readOnlyField: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    borderRadius: RadiusMd,
    borderWidth: BorderWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  themeOptionWrapper: {
    flex: 1,
  },
  themeOption: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  deleteButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  deleteButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Archivo_900Black',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
