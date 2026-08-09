import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, SectionTitle, StatusBadge } from '../components/ui';
import { useScopedData } from '../hooks';

// Local derived view only — reminders below are computed live from current
// AppContext state on each render. This is NOT a real push-notification
// system (that needs native push config, out of scope for this demo).
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Reminder {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
}

export default function NotifikasiScreen({ navigation }: any) {
  const { role } = useApp();
  const { laporanInScope, checklistInScope, presensiInScope, usersInScope, alertInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth } = useTheme();
  const today = todayDate();

  const reminders: Reminder[] = [];

  if (role === 'KEPALA_SPPG' || role === 'PETUGAS_LAPANGAN') {
    const laporanHariIni = laporanInScope.find((l) => l.tanggal === today);
    if (!laporanHariIni || laporanHariIni.status === 'draft') {
      reminders.push({ id: 'r-laporan', icon: 'file-text', title: 'Laporan hari ini belum diisi', subtitle: 'Lengkapi laporan produksi hari ini.' });
    }

    const checklistHariIni = checklistInScope.find((c) => c.tanggal === today);
    if (!checklistHariIni || checklistHariIni.items.some((i) => i.status === null)) {
      reminders.push({ id: 'r-checklist', icon: 'check-square', title: 'Checklist harian belum lengkap', subtitle: 'Selesaikan seluruh item checklist hari ini.' });
    }

    const staffAktif = usersInScope.filter((u) => u.role === 'PETUGAS_LAPANGAN' && u.statusAktif);
    const belumHadir = staffAktif.filter((u) => !presensiInScope.some((p) => p.userId === u.id && p.tanggal === today && p.status === 'hadir'));
    if (belumHadir.length > 0) {
      reminders.push({ id: 'r-presensi', icon: 'user-x', title: `${belumHadir.length} staf belum presensi`, subtitle: 'Pantau kehadiran staf hari ini.' });
    }
  }

  const recentAlerts = [...alertInScope].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 10);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Pengingat</SectionTitle>
      {reminders.length === 0 ? (
        <EmptyState icon="check-circle" title="Semua Beres" body="Tidak ada pengingat tugas untuk hari ini." />
      ) : (
        reminders.map((r) => (
          <Card key={r.id} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.warningBg }]}>
              <Feather name={r.icon} size={18} color={colors.warning} strokeWidth={iconStrokeWidth} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{r.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{r.subtitle}</Text>
            </View>
          </Card>
        ))
      )}

      <SectionTitle style={{ marginTop: spacing.md }}>Riwayat Alert</SectionTitle>
      {recentAlerts.length === 0 ? (
        <EmptyState icon="bell" title="Belum Ada Notifikasi" body="Belum ada aktivitas alert yang tercatat." />
      ) : (
        recentAlerts.map((a) => (
          <Pressable key={a.id} onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })} style={[styles.alertRow, { borderBottomColor: colors.border }]}>
            <StatusBadge status={a.tingkat} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }} numberOfLines={1}>
                {a.judul}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{a.timestamp}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5 },
});
