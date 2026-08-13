import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { OrganicButton } from './button';
import { OrganicSurface } from './surface';
import { OrganicText } from './text';
import type { Skill, SkillDifficulty } from '@/constants/skills';
import { RadiusLg, RadiusPill, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DIFFICULTY_COLOR: Record<SkillDifficulty, ThemeColor> = {
  iniciante: 'accent2',
  intermediario: 'warning',
  avancado: 'danger',
};

/**
 * Seletor de habilidades em camada flutuante.
 *
 * Antes essa lista era 19 cards grandes empilhados dentro do formulário, com
 * título, selo e descrição cada um — só pra chegar nos campos de duração e km
 * era um bom tanto de rolagem. Aqui a lista some do formulário: ele mostra só
 * o que foi escolhido, e a escolha acontece por cima, sem empurrar o resto.
 *
 * As linhas mostram só rótulo + selo de dificuldade. A descrição de cada
 * habilidade saiu porque ela já existe na tela da habilidade, na trilha — aqui
 * o aluno está registrando algo que ele acabou de fazer, já sabe o que é.
 */
export function SkillPicker({
  visible,
  skills,
  selected,
  onToggle,
  onClose,
}: {
  visible: boolean;
  skills: Skill[];
  selected: Set<string>;
  onToggle: (maneuver: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityLabel="Fechar"
        />

        <OrganicSurface backgroundColor="background" borderRadius={RadiusLg} style={styles.card}>
          <OrganicText size="subtitle">O que você praticou?</OrganicText>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {skills.map((skill) => {
              const maneuver = skill.maneuver as string;
              const isSelected = selected.has(maneuver);
              return (
                <Pressable key={skill.key} onPress={() => onToggle(maneuver)}>
                  <OrganicSurface
                    backgroundColor={isSelected ? 'accent' : 'backgroundElement'}
                    shadow={false}
                    style={styles.row}>
                    <OrganicText size="small" color={isSelected ? 'onAccent' : 'text'}>
                      {isSelected ? '✓ ' : ''}
                      {skill.label}
                    </OrganicText>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: theme[DIFFICULTY_COLOR[skill.difficulty]] },
                      ]}
                    />
                  </OrganicSurface>
                </Pressable>
              );
            })}
          </ScrollView>

          <OrganicButton label={`Pronto (${selected.size})`} onPress={onClose} />
        </OrganicSurface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    // A lista rola dentro do cartão; o cartão em si nunca passa da tela.
    maxHeight: '80%',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: RadiusPill,
  },
});
