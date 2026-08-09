import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle, StatusBadge } from '../components/ui';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Strictly read-only drill-down for both supervisor roles — no mutating actions
// anywhere on this screen. Also doubles as the Supervisor Polda's only per-SPPG
// view (summary-level only — no raw checklist items/photos are shown here).
export default function SppgDetailScreen({ route }: any) {
  const { sppgId } = route.params as { sppgId: string };
  const { sppgList, laporanList, checklistList, alertList, sekolahList } = useApp();
  const { colors, spacing, fontSize, radius } = useTheme();

  const sppg = sppgList.find((s) => s.id === sppgId);
  if (!sppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="home" title="SPPG Tidak Ditemukan" body="Data SPPG ini tidak tersedia." />
      </View>
    );
  }

  const today = todayDate();
  const recentLaporan = laporanList.filter((l) => l.sppgId === sppgId).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 5);
  const checklistHariIni = checklistList.find((c) => c.sppgId === sppgId && c.tanggal === today);
  const activeAlerts = alertList.filter((a) => a.sppgId === sppgId && a.statusTindakLanjut !== 'selesai');
  const sppgSekolah = sekolahList.filter((s) => s.sppgId === sppgId);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {sppg.fotoDapur && (
          <Image source={{ uri: sppg.fotoDapur }} style={{ width: '100%', height: 160, borderRadius: radius.md, marginBottom: 8 }} />
        )}
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.lg }}>{sppg.nama}</Text>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sppg.alamat}</Text>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sppg.wilayahPolres} • {sppg.wilayahPolda}</Text>
        <View style={styles.headerRow}>
          <Pill label={sppg.status === 'aktif' ? 'Aktif' : 'Nonaktif'} tone={sppg.status === 'aktif' ? 'success' : 'neutral'} />
          <Pill label={`${sppg.kapasitasProduksi} porsi/hari`} tone="info" />
          <Pill label={`${sppgSekolah.length} Sekolah Terhubung`} tone="primary" />
        </View>
      </View>

      <SectionTitle>Checklist Hari Ini</SectionTitle>
      <Card style={{ gap: spacing.xs }}>
        {checklistHariIni ? (
          <>
            <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>
              {checklistHariIni.items.filter((i) => i.status !== null).length}/{checklistHariIni.items.length} item terisi
            </Text>
            {checklistHariIni.items.some((i) => i.levelKritis && i.status === 'tidak') && (
              <Pill label="Ada item kritis bermasalah" tone="danger" style={{ alignSelf: 'flex-start' }} />
            )}
          </>
        ) : (
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Checklist hari ini belum diisi.</Text>
        )}
      </Card>

      <SectionTitle>Sekolah Terhubung ({sppgSekolah.length})</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {sppgSekolah.map((sk) => (
          <Card key={sk.id} style={{ width: 220, gap: spacing.xs }}>
            {sk.fotoSekolah && (
              <Image source={{ uri: sk.fotoSekolah }} style={{ width: '100%', height: 110, borderRadius: radius.md }} resizeMode="cover" />
            )}
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {sk.nama}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }} numberOfLines={1}>
              {sk.alamat}
            </Text>
            <Pill label={`${sk.jumlahSiswa} Siswa`} tone="primary" style={{ alignSelf: 'flex-start' }} />
          </Card>
        ))}
      </ScrollView>

      <SectionTitle>Laporan Produksi Terbaru</SectionTitle>
      {recentLaporan.length === 0 ? (
        <EmptyState icon="file-text" title="Belum Ada Laporan" body="Belum ada laporan produksi tercatat." />
      ) : (
        recentLaporan.map((l) => (
          <Card key={l.id} style={styles.rowCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{l.tanggal}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>{l.menu}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{l.realisasiPorsi}/{l.targetPorsi} porsi</Text>
            </View>
            <Pill label={l.status} tone={l.status === 'diverifikasi' ? 'success' : l.status === 'terkirim' ? 'info' : 'neutral'} />
          </Card>
        ))
      )}

      <SectionTitle>Alert Aktif</SectionTitle>
      {activeAlerts.length === 0 ? (
        <EmptyState icon="shield" title="Tidak Ada Alert" body="Tidak ada alert aktif di SPPG ini." />
      ) : (
        activeAlerts.map((a) => (
          <Card key={a.id} style={{ gap: spacing.xs }}>
            <View style={styles.headerRow}>
              <StatusBadge status={a.tingkat} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{a.timestamp}</Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{a.judul}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={2}>{a.deskripsi}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headerCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 4 },
  headerRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
