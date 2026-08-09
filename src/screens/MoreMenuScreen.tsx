import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Pill, SectionTitle, SyncStatusBadge } from '../components/ui';
import { usePendingSyncCount } from '../hooks';
import { ROLE_PERMISSIONS, roleScopeLabel } from '../utils/scope';
import { syncOfflineQueue } from '../utils/offlineQueue';

interface MenuItem {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  desc: string;
}

export default function MoreMenuScreen({ navigation }: any) {
  const { role, currentUser, logout } = useApp();
  const { colors, isDark, toggleTheme, spacing, fontSize, iconSize, iconStrokeWidth, radius, shadow } = useTheme();
  const [pendingCount, setPendingCount] = usePendingSyncCount();
  const [syncing, setSyncing] = useState(false);

  if (!role || !currentUser) return null;
  const permissions = ROLE_PERMISSIONS[role];

  const handleSync = async () => {
    setSyncing(true);
    const synced = await syncOfflineQueue();
    setSyncing(false);
    setPendingCount(Math.max(0, pendingCount - synced));
  };

  const personalItems: MenuItem[] = [
    { key: 'CheckIn', icon: 'user-check', label: 'Presensi Kehadiran Saya', desc: 'Input foto selfie & lokasi GPS presensi akun pribadi' },
    { key: 'Profile', icon: 'user', label: 'Profil Saya', desc: 'Info akun & data pribadi' },
  ];

  const sdmItems: MenuItem[] = [];
  if (role !== 'DRIVER') {
    sdmItems.push({ key: 'Presensi', icon: 'users', label: 'Rekap Presensi Staf / Anak Buah', desc: 'Pantau rekap & foto selfie hadir seluruh staf SPPG' });
  }
  if (permissions.canManageStaff) {
    sdmItems.push({ key: 'StaffList', icon: 'user-plus', label: 'Data Staf Dapur', desc: 'Kelola 47-52 petugas lapangan & relawan SPPG' });
    sdmItems.push({ key: 'Payroll', icon: 'dollar-sign', label: 'Payroll & Slip Gaji Staf', desc: 'Gaji pokok, tunjangan, & slip gaji tiap pegawai' });
  }

  const operasionalItems: MenuItem[] = [];
  if (permissions.canManageAnggaran) {
    operasionalItems.push({ key: 'Anggaran', icon: 'pie-chart', label: 'Log Anggaran & Financial', desc: 'Pantau alokasi dana BGN/Polri, saldo, & log pengeluaran' });
  }
  if (permissions.canManageBroadcast) {
    operasionalItems.push({ key: 'Broadcast', icon: 'radio', label: 'Pusat Broadcast Pengumuman', desc: 'Kirim instruksi resmi & pengumuman ke seluruh tim & driver' });
  }
  operasionalItems.push({ key: 'SppgProfile', icon: 'home', label: 'Profil SPPG Unit', desc: 'Info dapur & kapasitas produksi' });
  operasionalItems.push({ key: 'SekolahForm', icon: 'map-pin', label: 'Pengajuan Sekolah Afiliasi', desc: 'Pilih & ajukan sekolah terdekat penerima gizi' });
  operasionalItems.push({ key: 'MenuKalender', icon: 'calendar', label: 'Kalender Menu Harian', desc: 'Lihat & atur menu per tanggal, status kirim per sekolah' });
  operasionalItems.push({ key: 'MasterMenu', icon: 'book-open', label: 'Master Katalog & Resep Gizi', desc: 'Kelola master resep makanan, gizi AKG, & porsi' });
  operasionalItems.push({ key: 'UsulanMenu', icon: 'edit-3', label: 'Usulan Menu Sekolah', desc: 'Usulan menu dari sekolah & tinjauan SPPG' });
  operasionalItems.push({ key: 'AduanMasyarakat', icon: 'message-square', label: 'Aduan Masyarakat', desc: 'Laporan pengaduan publik & respon SPPG' });
  operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi & Alarm', desc: 'Pengingat tugas & riwayat alert' });

  const phase2Items: MenuItem[] = [];
  phase2Items.push({ key: 'Distribusi', icon: 'truck', label: 'Distribusi Armada GPS', desc: 'Pelacakan GPS live armada pengiriman MBG' });
  phase2Items.push({ key: 'RiwayatDistribusi', icon: 'clipboard', label: 'Log Pengiriman Sekolah', desc: 'Riwayat semua pengiriman ke sekolah' });
  
  if (role !== 'DRIVER') {
    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Peralatan & Aset Dapur', desc: 'Armada mobil, ompreng stainless, & thermal box' });
    phase2Items.push({ key: 'CctvMonitor', icon: 'video', label: 'Monitor CCTV AI', desc: 'Analisis AI & deteksi anomali real-time' });
    phase2Items.push({ key: 'Gudang', icon: 'package', label: 'Gudang & Stok Bahan', desc: 'Stok bahan baku SPPG & sensor gudang' });
    phase2Items.push({ key: 'GudangKondisi', icon: 'thermometer', label: 'Kondisi Gudang', desc: 'Suhu cold storage, ringkasan stok, & CCTV gudang' });
    phase2Items.push({ key: 'RiwayatPermintaan', icon: 'file-text', label: 'Riwayat Permintaan Bahan', desc: 'Riwayat pengajuan ke gudang' });
    phase2Items.push({ key: 'MitraList', icon: 'shopping-bag', label: 'Mitra Pemasok', desc: 'Supplier/pabrik bahan baku per kategori' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Command Center', desc: 'Komunikasi langsung dengan pengawas' });
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: fontSize.md }}>{currentUser.nama}</Text>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs, marginTop: 2 }}>{roleScopeLabel(currentUser)}</Text>
        </View>
        <Pill label={role} tone="primary" />
      </View>

      <SyncStatusBadge pendingCount={pendingCount} onSyncPress={handleSync} syncing={syncing} />

      {/* Group 1: Akun & Kehadiran Pribadi */}
      <SectionTitle style={{ marginTop: spacing.xs }}>Akun & Kehadiran Pribadi</SectionTitle>
      <View style={styles.tileGrid}>
        {personalItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.tileCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group 2: Manajemen SDM & Tim SPPG */}
      {sdmItems.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: spacing.md }}>Manajemen SDM & Tim SPPG</SectionTitle>
          <View style={styles.tileGrid}>
            {sdmItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => navigation.navigate(item.key)}
                style={({ pressed }) => [
                  styles.tileCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
                  pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                ]}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Group 3: Modul Operasional SPPG */}
      <SectionTitle style={{ marginTop: spacing.md }}>Modul Operasional SPPG</SectionTitle>
      <View style={styles.tileGrid}>
        {operasionalItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.tileCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group 4: Monitoring & Sensor Dapur */}
      <SectionTitle style={{ marginTop: spacing.md }}>Monitoring & Sensor Dapur</SectionTitle>
      <View style={styles.tileGrid}>
        {phase2Items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.tileCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group 3: Pengaturan Sistem */}
      <SectionTitle style={{ marginTop: spacing.md }}>Pengaturan & Akun</SectionTitle>
      <View style={{ gap: spacing.sm }}>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={isDark ? 'sun' : 'moon'} size={iconSize.md} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Ketuk untuk beralih tampilan tema</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.dangerBg }]}>
            <Feather name="log-out" size={iconSize.md} color={colors.danger} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fontSize.sm }}>Keluar (Logout)</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 90 },
  headerCard: { padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileCard: { width: '48%', padding: 14, borderWidth: 1, gap: 6, minHeight: 110, justifyContent: 'flex-start' },
  tileIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontWeight: '800' },
  tileDesc: { fontSize: 11, lineHeight: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, minHeight: 60 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
