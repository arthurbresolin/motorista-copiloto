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
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Início</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Práticas</TabButton>
          </TabTrigger>
          <TabTrigger name="monitor" href="/monitor" asChild>
            <TabButton>Monitor</TabButton>
          </TabTrigger>
          <TabTrigger name="quiz" href="/quiz" asChild>
            <TabButton>Quiz</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <OrganicSurface
        backgroundColor={isFocused ? 'accent' : 'background'}
        shadow={false}
        borderRadius={999}
        style={styles.tabButtonView}>
        <OrganicText size="small" color={isFocused ? 'onAccent' : 'text'}>
          {children}
        </OrganicText>
      </OrganicSurface>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <OrganicSurface backgroundColor="background" borderRadius={999} style={styles.innerContainer}>
        <OrganicText size="small" style={styles.brandText}>
          Motorista Copiloto
        </OrganicText>

        {props.children}
      </OrganicSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
});
