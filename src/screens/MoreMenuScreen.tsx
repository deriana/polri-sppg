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

  const items: MenuItem[] = [];
  items.push({ key: 'CheckIn', icon: 'user-check', label: 'Presensi Kehadiran Saya', desc: 'Input foto selfie & lokasi GPS presensi akun pribadi' });
  items.push({ key: 'Presensi', icon: 'clipboard', label: 'Rekap Presensi Staf', desc: 'Pantau rekap & bukti selfie hadir seluruh staf SPPG' });
  if (permissions.canManageStaff) {
    items.push({ key: 'StaffList', icon: 'users', label: 'Data Staf Dapur', desc: 'Kelola 47-52 petugas lapangan & relawan SPPG' });
    items.push({ key: 'Payroll', icon: 'dollar-sign', label: 'Payroll & Slip Gaji', desc: 'Gaji pokok, tunjangan, & unduh slip gaji tiap pegawai' });
  }
  items.push({ key: 'SppgProfile', icon: 'home', label: 'Profil SPPG', desc: 'Info dapur & kapasitas produksi' });
  items.push({ key: 'MenuKalender', icon: 'calendar', label: 'Kalender Menu', desc: 'Lihat & atur menu per tanggal, status kirim per sekolah' });
  items.push({ key: 'MasterMenu', icon: 'book-open', label: 'Master Katalog & Resep Gizi', desc: 'Kelola master resep makanan, gizi AKG, & porsi' });
  items.push({ key: 'UsulanMenu', icon: 'edit-3', label: 'Usulan Menu Sekolah', desc: 'Usulan menu dari sekolah & tinjauan SPPG' });
  items.push({ key: 'AduanMasyarakat', icon: 'message-square', label: 'Aduan Masyarakat', desc: 'Laporan pengaduan publik & respon SPPG' });
  items.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi', desc: 'Pengingat tugas & riwayat alert' });
  items.push({ key: 'Profile', icon: 'user', label: 'Profil Saya', desc: 'Info akun & data pribadi' });

  const phase2Items: MenuItem[] = [
    { key: 'Peralatan', icon: 'truck', label: 'Peralatan & Aset Dapur', desc: 'Armada mobil, ompreng stainless, & thermal box' },
    { key: 'CctvMonitor', icon: 'video', label: 'Monitor CCTV AI', desc: 'Analisis AI & deteksi anomali real-time' },
    { key: 'Gudang', icon: 'package', label: 'Gudang & Stok Bahan', desc: 'Stok bahan baku SPPG & sensor gudang' },
    { key: 'GudangKondisi', icon: 'thermometer', label: 'Kondisi Gudang', desc: 'Suhu cold storage, ringkasan stok, & CCTV area gudang' },
    { key: 'RiwayatPermintaan', icon: 'clipboard', label: 'Riwayat Permintaan Bahan', desc: 'Riwayat pengajuan ke gudang' },
    { key: 'MitraList', icon: 'users', label: 'Mitra Pemasok', desc: 'Supplier/pabrik bahan baku per kategori' },
    { key: 'Distribusi', icon: 'truck', label: 'Distribusi Armada GPS', desc: 'Pelacakan GPS live armada pengiriman' },
    { key: 'RiwayatDistribusi', icon: 'clipboard', label: 'Log Pengiriman Sekolah', desc: 'Riwayat semua pengiriman ke sekolah, semua tanggal' },
    { key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Command Center', desc: 'Komunikasi langsung dengan pengawas' },
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>{currentUser.nama}</Text>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>{roleScopeLabel(currentUser)}</Text>
      </View>

      <SyncStatusBadge pendingCount={pendingCount} onSyncPress={handleSync} syncing={syncing} />

      <SectionTitle style={{ marginTop: spacing.xs }}>Menu Utama</SectionTitle>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => navigation.navigate(item.key)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={item.icon} size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{item.label}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{item.desc}</Text>
          </View>
          <Feather name="chevron-right" size={iconSize.md} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
        </Pressable>
      ))}

      <SectionTitle style={{ marginTop: spacing.md }}>
        Modul Operasional & Monitoring Dapur
      </SectionTitle>
      {phase2Items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => navigation.navigate(item.key)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={item.icon} size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{item.label}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{item.desc}</Text>
          </View>
          <Feather name="chevron-right" size={iconSize.md} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
        </Pressable>
      ))}

      <Pressable
        onPress={toggleTheme}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.xs, ...shadow.card },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Feather name={isDark ? 'sun' : 'moon'} size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{isDark ? 'Mode Terang' : 'Mode Gelap'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Ketuk untuk mengganti tampilan</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={logout}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.xs, ...shadow.card },
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  headerCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, minHeight: 64 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
