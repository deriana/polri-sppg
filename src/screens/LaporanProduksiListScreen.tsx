import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { LaporanProduksi, LaporanStatus } from '../types';
import { canVerifyLaporan } from '../utils/scope';

const STATUS_TONE: Record<LaporanStatus, 'neutral' | 'info' | 'success'> = {
  draft: 'neutral',
  terkirim: 'info',
  diverifikasi: 'success',
};
const STATUS_LABEL: Record<LaporanStatus, string> = {
  draft: 'Draft',
  terkirim: 'Terkirim',
  diverifikasi: 'Diverifikasi',
};

type Filter = 'minggu' | 'bulan' | 'semua';

function inLastNDays(tanggal: string, n: number): boolean {
  const d = new Date(tanggal);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < n;
}

function inCurrentMonth(tanggal: string): boolean {
  return tanggal.slice(0, 7) === new Date().toISOString().slice(0, 7);
}

export default function LaporanProduksiListScreen({ navigation }: any) {
  const { role, currentUser, verifyLaporan } = useApp();
  const { laporanInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const [filter, setFilter] = useState<Filter>('minggu');

  const sorted = useMemo(() => [...laporanInScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [laporanInScope]);

  const filtered = sorted.filter((l) => {
    if (filter === 'minggu') return inLastNDays(l.tanggal, 7);
    if (filter === 'bulan') return inCurrentMonth(l.tanggal);
    return true;
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { padding: spacing.lg, paddingBottom: 0 }]}>
        <View style={styles.headerRow}>
          <SectionTitle style={{ marginBottom: 0 }}>Laporan Produksi</SectionTitle>
          <PrimaryButton label="Baru" icon="plus" fullWidth={false} onPress={() => navigation.navigate('LaporanForm', {})} />
        </View>
        <View style={[styles.segment, { borderColor: colors.border, borderRadius: radius.md }]}>
          {(['minggu', 'bulan', 'semua'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.segmentItem, { borderRadius: radius.sm }, filter === f && { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: filter === f ? colors.textInverse : colors.text, fontWeight: '700', fontSize: fontSize.xs }}>
                {f === 'minggu' ? 'Minggu Ini' : f === 'bulan' ? 'Bulan Ini' : 'Semua'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {filtered.length === 0 ? (
          <EmptyState icon="file-text" title="Belum Ada Laporan" body="Tidak ada laporan produksi pada rentang ini." />
        ) : (
          filtered.map((l: LaporanProduksi) => {
            const canVerify = role && currentUser ? canVerifyLaporan(role, currentUser.sppgId, l) : false;
            return (
              <Card key={l.id} style={{ gap: spacing.xs }} onPress={() => navigation.navigate('LaporanForm', { laporanId: l.id })}>
                <View style={styles.rowTop}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>{l.tanggal}</Text>
                  <Pill label={STATUS_LABEL[l.status]} tone={STATUS_TONE[l.status]} />
                </View>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                  {l.menu}
                </Text>
                <View style={styles.rowBottom}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                    Realisasi {l.realisasiPorsi}/{l.targetPorsi} porsi • {l.foto.length} foto
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
                </View>
                {canVerify && (
                  <PrimaryButton
                    label="Verifikasi Laporan"
                    icon="check-circle"
                    variant="secondary"
                    onPress={() => verifyLaporan(l.id)}
                    style={{ marginTop: spacing.xs }}
                  />
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segment: { flexDirection: 'row', borderWidth: 1, padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  content: { gap: 12, paddingBottom: 32 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});
