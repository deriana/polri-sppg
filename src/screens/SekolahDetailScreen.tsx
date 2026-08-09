import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SekolahDetailScreen({ navigation, route }: any) {
  const { sekolahId } = route.params as { sekolahId: string };
  const { sppgList, sekolahList, distribusiList, menuHarianPlanList, publicReportList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const today = todayDateStr();
  const sekolah = sekolahList.find((s) => s.id === sekolahId);
  const sppg = sppgList.find((s) => s.id === sekolah?.sppgId);

  const planToday = menuHarianPlanList.find((m) => m.sppgId === sekolah?.sppgId && m.tanggal === today);
  const ruteDistribusi = distribusiList.find((d) => d.sekolahId === sekolahId && d.tanggal === today);
  const reportsSekolah = publicReportList.filter((r) => r.sekolahId === sekolahId || (sekolah && r.deskripsi.toLowerCase().includes(sekolah.nama.toLowerCase())));

  if (!sekolah) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="home" title="Sekolah Tidak Ditemukan" body="Data sekolah ini tidak tersedia." />
      </View>
    );
  }

  const statusLabel = ruteDistribusi?.status === 'tiba' ? 'Telah Diterima Sekolah' : ruteDistribusi?.status === 'dalam_perjalanan' ? 'Dalam Pengiriman' : ruteDistribusi?.status === 'kendala' ? 'Kendala Pengiriman' : 'Menunggu Jadwal';
  const statusTone = ruteDistribusi?.status === 'tiba' ? 'success' : ruteDistribusi?.status === 'dalam_perjalanan' ? 'info' : ruteDistribusi?.status === 'kendala' ? 'danger' : 'neutral';

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <Card style={{ gap: spacing.xs, padding: 0, overflow: 'hidden' }}>
        {sekolah.fotoSekolah ? (
          <Image source={{ uri: sekolah.fotoSekolah }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: 140, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="home" size={40} color={colors.primary} />
          </View>
        )}
        <View style={{ padding: 16, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pill label={statusLabel} tone={statusTone} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>ID: {sekolah.id}</Text>
          </View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: 4 }}>{sekolah.nama}</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
            Afiliasi: {sppg?.nama ?? sekolah.sppgId}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Feather name="map-pin" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, flex: 1 }}>{sekolah.alamat}</Text>
          </View>
        </View>
      </Card>

      {/* Target & Delivery Summary */}
      <Card style={{ gap: spacing.xs }}>
        <SectionTitle style={{ marginBottom: 0 }}>Informasi Sasaran MBG</SectionTitle>
        <View style={[styles.grid, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }]}>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Target Murid Penerima</Text>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.primary }}>
              {sekolah.jumlahSiswa.toLocaleString('id-ID')} siswa
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Estimasi Jam Tiba</Text>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>
              {ruteDistribusi?.estimasiTiba ?? '07:15 WIB'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Today's Food Menu */}
      <Card style={{ gap: spacing.xs }}>
        <SectionTitle style={{ marginBottom: 0 }}>Menu Paket Makanan Hari Ini</SectionTitle>
        {planToday ? (
          <View style={{ gap: spacing.xs }}>
            {planToday.fotoMenu && (
              <Image source={{ uri: planToday.fotoMenu }} style={{ width: '100%', height: 160, borderRadius: radius.md }} resizeMode="cover" />
            )}
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{planToday.menu}</Text>
            {planToday.kategoriGizi && (
              <Pill label={planToday.kategoriGizi} tone="info" />
            )}
          </View>
        ) : (
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Belum ada menu terjadwal untuk hari ini.</Text>
        )}
      </Card>

      {/* Tracking Button */}
      {ruteDistribusi && (
        <PrimaryButton
          label="Lacak Posisi Armada Pengiriman (Live Tracking)"
          icon="truck"
          onPress={() => navigation.navigate('DistribusiDetail', { ruteId: ruteDistribusi.id })}
        />
      )}

      {/* Public Reports for this School */}
      {reportsSekolah.length > 0 && (
        <Card style={{ gap: spacing.xs }}>
          <SectionTitle style={{ marginBottom: 0 }}>Catatan / Aduan Terkait Sekolah ({reportsSekolah.length})</SectionTitle>
          {reportsSekolah.map((rep) => (
            <View key={rep.id} style={[styles.reportRow, { borderBottomColor: colors.border }]}>
              <Pill label={rep.kategori.toUpperCase()} tone="warning" />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text, flex: 1 }}>{rep.judul}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>{rep.tanggal}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  gridCol: { flex: 1 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5 },
});
