import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View, Pressable } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { buildDetailStack } from './DetailStack';

import DashboardScreen from '../screens/DashboardScreen';
import PresensiScreen from '../screens/PresensiScreen';
import ChecklistHarianScreen from '../screens/ChecklistHarianScreen';
import LaporanProduksiListScreen from '../screens/LaporanProduksiListScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import DaftarSppgScreen from '../screens/DaftarSppgScreen';
import AlertListScreen from '../screens/AlertListScreen';

import DistribusiScreen from '../screens/DistribusiScreen';

const Tab = createBottomTabNavigator<any>();

const DashboardStack = buildDetailStack('Dashboard', DashboardScreen, 'Dashboard');
const PresensiStack = buildDetailStack('Presensi', PresensiScreen, 'Presensi');
const ChecklistStack = buildDetailStack('Checklist', ChecklistHarianScreen, 'Checklist Harian');
const LaporanStack = buildDetailStack('Laporan', LaporanProduksiListScreen, 'Laporan Produksi');
const LainnyaStack = buildDetailStack('Lainnya', MoreMenuScreen, 'Lainnya');
const DaftarSppgStack = buildDetailStack('DaftarSPPG', DaftarSppgScreen, 'Daftar SPPG');
const AlertStack = buildDetailStack('Alert', AlertListScreen, 'Alert');
const DistribusiStack = buildDetailStack('Distribusi', DistribusiScreen, 'Distribusi Armada GPS');

const KEPALA_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'ChecklistTab', component: ChecklistStack, label: 'Checklist', icon: 'check-square' as const },
  { name: 'LaporanTab', component: LaporanStack, label: 'Laporan', icon: 'file-text' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

const PETUGAS_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'ChecklistTab', component: ChecklistStack, label: 'Checklist', icon: 'check-square' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

const DRIVER_TABS = [
  { name: 'DistribusiTab', component: DistribusiStack, label: 'Tugas Kirim', icon: 'truck' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

const SUPERVISOR_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'DaftarSppgTab', component: DaftarSppgStack, label: 'Daftar SPPG', icon: 'grid' as const },
  { name: 'AlertTab', component: AlertStack, label: 'Alert', icon: 'alert-triangle' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View style={[styles.bottomBarWrapper, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 4) }]}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const label = options.tabBarLabel !== undefined ? (options.tabBarLabel as string) : options.title !== undefined ? options.title : route.name;
          const activeColor = isDark ? colors.gold : colors.primary;
          const inactiveColor = colors.textMuted;
          const color = isFocused ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, isFocused && { backgroundColor: colors.primaryLight }, pressed && { opacity: 0.7 }]}
            >
              {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color, size: 19 }) : null}
              <Text style={[styles.tabLabel, { color, fontWeight: isFocused ? '800' : '500' }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  const { role } = useApp();
  const { colors } = useTheme();

  if (!role) return null;
  const isSupervisor = role === 'SUPERVISOR_POLRES' || role === 'SUPERVISOR_POLDA';
  const tabs =
    role === 'KEPALA_SPPG'
      ? KEPALA_TABS
      : role === 'DRIVER'
      ? DRIVER_TABS
      : isSupervisor
      ? SUPERVISOR_TABS
      : PETUGAS_TABS;

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ color }: { color: string }) => <Feather name={tab.icon} size={19} color={color} strokeWidth={1.9} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bottomBarWrapper: {
    borderTopWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 600,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
});
