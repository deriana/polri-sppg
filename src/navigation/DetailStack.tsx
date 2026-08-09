import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BRAND_ASSETS } from '../data/images';

import DashboardScreen from '../screens/DashboardScreen';
import PresensiScreen from '../screens/PresensiScreen';
import CheckInScreen from '../screens/CheckInScreen';
import ChecklistHarianScreen from '../screens/ChecklistHarianScreen';
import LaporanProduksiListScreen from '../screens/LaporanProduksiListScreen';
import LaporanProduksiFormScreen from '../screens/LaporanProduksiFormScreen';
import FoodSafetyFormScreen from '../screens/FoodSafetyFormScreen';
import StaffListScreen from '../screens/StaffListScreen';
import StaffFormScreen from '../screens/StaffFormScreen';
import AlertListScreen from '../screens/AlertListScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import NotifikasiScreen from '../screens/NotifikasiScreen';
import SppgProfileScreen from '../screens/SppgProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import DaftarSppgScreen from '../screens/DaftarSppgScreen';
import SppgDetailScreen from '../screens/SppgDetailScreen';
import CctvMonitorScreen from '../screens/CctvMonitorScreen';
import GudangScreen from '../screens/GudangScreen';
import RequestBahanFormScreen from '../screens/RequestBahanFormScreen';
import RiwayatPermintaanScreen from '../screens/RiwayatPermintaanScreen';
import QrScanScreen from '../screens/QrScanScreen';
import DistribusiScreen from '../screens/DistribusiScreen';
import ChatCommandCenterScreen from '../screens/ChatCommandCenterScreen';
import MenuKalenderScreen from '../screens/MenuKalenderScreen';
import MitraListScreen from '../screens/MitraListScreen';
import MutasiStokFormScreen from '../screens/MutasiStokFormScreen';
import AduanMasyarakatScreen from '../screens/AduanMasyarakatScreen';
import PeralatanScreen from '../screens/PeralatanScreen';
import SekolahDetailScreen from '../screens/SekolahDetailScreen';
import MasterMenuScreen from '../screens/MasterMenuScreen';

const Stack = createNativeStackNavigator<any>();

// Shared pool of every screen in the app. Each tab's stack (built via
// buildDetailStack below) registers its own screen as the initial route and
// every other screen here as a pushable detail route — mirrors the reference
// app's single-pool navigation pattern so any tab can push to any screen.
const DETAIL_SCREENS: Array<{ name: string; component: React.ComponentType<any>; title: string }> = [
  { name: 'Dashboard', component: DashboardScreen, title: 'Dashboard' },
  { name: 'Presensi', component: PresensiScreen, title: 'Presensi' },
  { name: 'Checklist', component: ChecklistHarianScreen, title: 'Checklist Harian' },
  { name: 'Laporan', component: LaporanProduksiListScreen, title: 'Laporan Produksi' },
  { name: 'Lainnya', component: MoreMenuScreen, title: 'Lainnya' },
  { name: 'DaftarSPPG', component: DaftarSppgScreen, title: 'Daftar SPPG' },
  { name: 'Alert', component: AlertListScreen, title: 'Alert' },
  { name: 'CheckIn', component: CheckInScreen, title: 'Presensi Kehadiran' },
  { name: 'StaffList', component: StaffListScreen, title: 'Data Staf' },
  { name: 'StaffForm', component: StaffFormScreen, title: 'Tambah Staf' },
  { name: 'LaporanForm', component: LaporanProduksiFormScreen, title: 'Formulir Laporan Produksi' },
  { name: 'FoodSafetyForm', component: FoodSafetyFormScreen, title: 'Keamanan Pangan' },
  { name: 'AlertDetail', component: AlertDetailScreen, title: 'Detail Alert' },
  { name: 'Notifikasi', component: NotifikasiScreen, title: 'Notifikasi' },
  { name: 'SppgProfile', component: SppgProfileScreen, title: 'Profil SPPG' },
  { name: 'Profile', component: ProfileScreen, title: 'Profil Saya' },
  { name: 'SppgDetail', component: SppgDetailScreen, title: 'Detail SPPG' },
  { name: 'SekolahDetail', component: SekolahDetailScreen, title: 'Detail Sekolah Afiliasi' },
  { name: 'AduanMasyarakat', component: AduanMasyarakatScreen, title: 'Aduan Masyarakat' },
  { name: 'Peralatan', component: PeralatanScreen, title: 'Peralatan & Aset Dapur' },
  { name: 'CctvMonitor', component: CctvMonitorScreen, title: 'Monitor CCTV AI' },
  { name: 'Gudang', component: GudangScreen, title: 'Gudang & Stok Bahan' },
  { name: 'RequestBahanForm', component: RequestBahanFormScreen, title: 'Ajukan Permintaan Bahan' },
  { name: 'RiwayatPermintaan', component: RiwayatPermintaanScreen, title: 'Riwayat Permintaan Bahan' },
  { name: 'QrScan', component: QrScanScreen, title: 'Pindai QR Verifikasi Stok' },
  { name: 'Distribusi', component: DistribusiScreen, title: 'Distribusi Armada GPS' },
  { name: 'ChatCommandCenter', component: ChatCommandCenterScreen, title: 'Chat Command Center' },
  { name: 'MenuKalender', component: MenuKalenderScreen, title: 'Kalender Menu' },
  { name: 'MasterMenu', component: MasterMenuScreen, title: 'Master Katalog & Resep Gizi' },
  { name: 'MitraList', component: MitraListScreen, title: 'Mitra Pemasok' },
  { name: 'MutasiStokForm', component: MutasiStokFormScreen, title: 'Catat Mutasi Stok' },
];

export function buildDetailStack(homeName: string, HomeComponent: React.ComponentType<any>, homeTitle: string) {
  return function Navigator() {
    const { colors, isDark, toggleTheme } = useTheme();

    const screenOptions = {
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
      headerRight: () => (
        <Pressable
          hitSlop={8}
          onPress={toggleTheme}
          style={({ pressed }) => [{ paddingHorizontal: 8, paddingVertical: 4 }, pressed && { opacity: 0.7 }]}
        >
          <Feather name={isDark ? 'sun' : 'moon'} size={20} color={colors.primary} strokeWidth={2} />
        </Pressable>
      ),
    };

    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name={homeName}
          component={HomeComponent}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                  <Image source={BRAND_ASSETS.polriEmblem} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>SIGAP SPPG</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>· {homeTitle}</Text>
              </View>
            ),
          }}
        />
        {DETAIL_SCREENS.filter((s) => s.name !== homeName).map((s) => (
          <Stack.Screen key={s.name} name={s.name} component={s.component} options={{ title: s.title }} />
        ))}
      </Stack.Navigator>
    );
  };
}
