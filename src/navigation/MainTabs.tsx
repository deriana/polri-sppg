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
import KandunganGiziHarianScreen from '../screens/KandunganGiziHarianScreen';
import MasterMenuScreen from '../screens/MasterMenuScreen';
import PeralatanScreen from '../screens/PeralatanScreen';
import GudangScreen from '../screens/GudangScreen';
import PengadaanBahanScreen from '../screens/PengadaanBahanScreen';
import LaporanPackingScreen from '../screens/LaporanPackingScreen';
import LaporanSanitasiScreen from '../screens/LaporanSanitasiScreen';

const Tab = createBottomTabNavigator<any>();

const DashboardStack = buildDetailStack('Dashboard', DashboardScreen, 'Dashboard');
const PresensiStack = buildDetailStack('Presensi', PresensiScreen, 'Presensi');
const ChecklistStack = buildDetailStack('Checklist', ChecklistHarianScreen, 'Checklist Harian');
const LaporanStack = buildDetailStack('Laporan', LaporanProduksiListScreen, 'Laporan Produksi');
const LainnyaStack = buildDetailStack('Lainnya', MoreMenuScreen, 'Lainnya');
const DaftarSppgStack = buildDetailStack('DaftarSPPG', DaftarSppgScreen, 'Daftar SPPG');
const AlertStack = buildDetailStack('Alert', AlertListScreen, 'Alert');
const DistribusiStack = buildDetailStack('Distribusi', DistribusiScreen, 'Distribusi Armada GPS');
const KandunganGiziStack = buildDetailStack('KandunganGiziHarian', KandunganGiziHarianScreen, 'Evaluasi Gizi');
const MasterMenuStack = buildDetailStack('MasterMenu', MasterMenuScreen, 'Master Resep');
const PeralatanStack = buildDetailStack('Peralatan', PeralatanScreen, 'Peralatan & Aset');
const GudangStack = buildDetailStack('Gudang', GudangScreen, 'Gudang & Stok');
const PengadaanStack = buildDetailStack('PengadaanBahan', PengadaanBahanScreen, 'Pengadaan & Logistik');
const LaporanPackingStack = buildDetailStack('LaporanPacking', LaporanPackingScreen, 'Laporan Packing');
const LaporanSanitasiStack = buildDetailStack('LaporanSanitasi', LaporanSanitasiScreen, 'Laporan Sanitasi');

// 1. Kepala SPPG (Komandan Unit Dapur)
const KEPALA_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'PengadaanTab', component: PengadaanStack, label: 'Pengadaan', icon: 'shopping-cart' as const },
  { name: 'LaporanTab', component: LaporanStack, label: 'Laporan', icon: 'file-text' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi Staf', icon: 'users' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 2. Ahli Gizi (Evaluasi Nutrisi, AKG, & Menu)
const AHLI_GIZI_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'KandunganGiziTab', component: KandunganGiziStack, label: 'Evaluasi Gizi', icon: 'activity' as const },
  { name: 'MasterMenuTab', component: MasterMenuStack, label: 'Resep AKG', icon: 'book-open' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 3. Chef Utama & Cook (5 Tahap Masak, Batching, & Rasa QC)
const CHEF_UTAMA_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'LaporanTab', component: LaporanStack, label: 'Produksi Masak', icon: 'layers' as const },
  { name: 'MasterMenuTab', component: MasterMenuStack, label: 'Resep Masak', icon: 'book-open' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 4. Petugas Pemorsi & Packing (Gramasi Ompreng, Seal, & Box)
const PEMORSI_PACKING_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'LaporanPackingTab', component: LaporanPackingStack, label: 'Lap. Packing', icon: 'package' as const },
  { name: 'PeralatanTab', component: PeralatanStack, label: 'Ompreng & Box', icon: 'box' as const },
  { name: 'ChecklistTab', component: ChecklistStack, label: 'Checklist', icon: 'check-square' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 5. Petugas Logistik & Gudang (Scan Terima, FEFO, & Mutasi)
const PETUGAS_LOGISTIK_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'GudangTab', component: GudangStack, label: 'Stok Gudang', icon: 'package' as const },
  { name: 'PengadaanTab', component: PengadaanStack, label: 'Terima Pasokan', icon: 'camera' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 6. Petugas Sanitasi & APD (Sterilisasi, Higiene, & Limbah)
const PETUGAS_SANITASI_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'LaporanSanitasiTab', component: LaporanSanitasiStack, label: 'Lap. Sanitasi', icon: 'shield' as const },
  { name: 'PeralatanTab', component: PeralatanStack, label: 'Alat Steril', icon: 'box' as const },
  { name: 'ChecklistTab', component: ChecklistStack, label: 'Checklist', icon: 'check-square' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 7. Driver & Kurir Armada (Rute Distribusi GPS & Serah Terima)
const DRIVER_TABS = [
  { name: 'DistribusiTab', component: DistribusiStack, label: 'Tugas Kirim', icon: 'truck' as const },
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 8. Petugas Lapangan Umum
const PETUGAS_LAPANGAN_TABS = [
  { name: 'DashboardTab', component: DashboardStack, label: 'Dashboard', icon: 'home' as const },
  { name: 'PresensiTab', component: PresensiStack, label: 'Presensi', icon: 'user-check' as const },
  { name: 'ChecklistTab', component: ChecklistStack, label: 'Checklist SOP', icon: 'check-square' as const },
  { name: 'PeralatanTab', component: PeralatanStack, label: 'Peralatan', icon: 'box' as const },
  { name: 'LainnyaTab', component: LainnyaStack, label: 'Lainnya', icon: 'more-horizontal' as const },
];

// 9. Supervisor Pengawas Wilayah
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
    <View
      style={[
        styles.bottomBarWrapper,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;
          const activeColor = isDark ? colors.gold : (colors.accent || colors.primary);
          const inactiveColor = colors.textMuted;
          const color = isFocused ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabItem,
                isFocused && {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : colors.accentLight || colors.primaryLight,
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : colors.border,
                  borderWidth: 1,
                },
                pressed && { opacity: 0.75 },
              ]}
            >
              {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color, size: 19 }) : null}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color,
                    fontWeight: isFocused ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
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
      : role === 'AHLI_GIZI'
      ? AHLI_GIZI_TABS
      : role === 'CHEF_UTAMA'
      ? CHEF_UTAMA_TABS
      : role === 'PEMORSI_PACKING'
      ? PEMORSI_PACKING_TABS
      : role === 'PETUGAS_LOGISTIK'
      ? PETUGAS_LOGISTIK_TABS
      : role === 'PETUGAS_SANITASI'
      ? PETUGAS_SANITASI_TABS
      : role === 'DRIVER'
      ? DRIVER_TABS
      : isSupervisor
      ? SUPERVISOR_TABS
      : PETUGAS_LAPANGAN_TABS;

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
