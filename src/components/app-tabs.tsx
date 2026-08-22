import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
  type TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { OrganicSurface, OrganicText } from './organic';
import { MaxContentWidth, RadiusLg, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="🏠">Início</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="🚗">Práticas</TabButton>
          </TabTrigger>
          <TabTrigger name="trilha" href="/trilha" asChild>
            <TabButton icon="🛣️">Trilha</TabButton>
          </TabTrigger>
          <TabTrigger name="perfil" href="/perfil" asChild>
            <TabButton icon="🙂">Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <OrganicText style={[styles.icon, !isFocused && styles.iconDimmed]}>{icon}</OrganicText>
      <OrganicText size="small" color={isFocused ? 'accent' : 'textSecondary'}>
        {children}
      </OrganicText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <OrganicSurface backgroundColor="backgroundElement" borderRadius={RadiusLg} style={styles.innerContainer}>
        {props.children}
      </OrganicSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    padding: Spacing.half,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: 2,
  },
  icon: {
    fontSize: 19,
    lineHeight: 23,
  },
  iconDimmed: {
    opacity: 0.45,
  },
});
