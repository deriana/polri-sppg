import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle, StatusBadge } from '../components/ui';
import { useScopedData } from '../hooks';
import { AlertTingkat, Sppg } from '../types';
import { ROLE_PERMISSIONS, roleScopeLabel } from '../utils/scope';

const STATUS_LABEL: Record<AlertTingkat, string> = { normal: 'Normal', perhatian: 'Perlu Perhatian', emergency: 'Darurat' };

export default function DaftarSppgScreen({ navigation }: any) {
  const { role, currentUser } = useApp();
  const { sppgInScope, alertInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth } = useTheme();

  const permissions = role ? ROLE_PERMISSIONS[role] : null;
  const activeAlerts = alertInScope.filter((a) => a.statusTindakLanjut !== 'selesai');

  const derivedStatus = (sppgId: string): AlertTingkat => {
    const sppgAlerts = activeAlerts.filter((a) => a.sppgId === sppgId);
    if (sppgAlerts.some((a) => a.tingkat === 'emergency')) return 'emergency';
    if (sppgAlerts.some((a) => a.tingkat === 'perhatian')) return 'perhatian';
    return 'normal';
  };

  // Polda view groups the flat SPPG list by wilayahPolres so the provincial
  // view reads as "per Polres" rather than one flat list — no new dependency,
  // just a Map grouped by an existing field.
  const groupByPolres = permissions?.scopeLevel === 'polda';
  const groups = useMemo(() => {
    if (!groupByPolres) return null;
    const map = new Map<string, Sppg[]>();
    sppgInScope.forEach((s) => {
      const list = map.get(s.wilayahPolres) ?? [];
      list.push(s);
      map.set(s.wilayahPolres, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [groupByPolres, sppgInScope]);

  const exportLaporanWilayah = async () => {
    const rows = sppgInScope
      .map(
        (s) =>
          `<tr><td>${s.nama}</td><td>${s.wilayahPolres}</td><td>${s.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</td><td>${STATUS_LABEL[derivedStatus(s.id)]}</td></tr>`,
      )
      .join('');
    const html = `
      <html><body style="font-family: sans-serif;">
        <h2>Laporan Wilayah — ${currentUser ? roleScopeLabel(currentUser) : ''}</h2>
        <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%;">
          <tr><th>SPPG</th><th>Wilayah Polres</th><th>Status</th><th>Kondisi</th></tr>
          ${rows}
        </table>
        <p>Total SPPG dalam wilayah: ${sppgInScope.length}</p>
      </body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Laporan Wilayah' });
    }
  };

  const renderSppgCard = (s: Sppg) => (
    <Card key={s.id} style={{ gap: spacing.xs }} onPress={() => navigation.navigate('SppgDetail', { sppgId: s.id })}>
      {s.fotoDapur && (
        <Image source={{ uri: s.fotoDapur }} style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 4 }} resizeMode="cover" />
      )}
      <View style={styles.rowTop}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm, flex: 1 }} numberOfLines={1}>
          {s.nama}
        </Text>
        <StatusBadge status={derivedStatus(s.id)} />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
        {s.alamat}
      </Text>
      <View style={styles.rowBottom}>
        <Pill label={s.status === 'aktif' ? 'Aktif' : 'Nonaktif'} tone={s.status === 'aktif' ? 'success' : 'neutral'} />
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Kapasitas {s.kapasitasProduksi} porsi/hari</Text>
        <Feather name="chevron-right" size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
      </View>
    </Card>
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <SectionTitle style={{ marginBottom: 0 }}>Daftar SPPG ({sppgInScope.length})</SectionTitle>
      </View>

      {permissions?.canExportLaporan && (
        <PrimaryButton label="Export Laporan Wilayah" icon="download" variant="outline" onPress={exportLaporanWilayah} />
      )}

      {sppgInScope.length === 0 ? (
        <EmptyState icon="home" title="Tidak Ada SPPG" body="Belum ada SPPG terdaftar di wilayah Anda." />
      ) : groups ? (
        groups.map(([polres, list]) => (
          <View key={polres} style={{ gap: spacing.sm }}>
            <SectionTitle style={{ marginBottom: 0 }}>{polres} ({list.length})</SectionTitle>
            {list.map(renderSppgCard)}
          </View>
        ))
      ) : (
        sppgInScope.map(renderSppgCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
});
