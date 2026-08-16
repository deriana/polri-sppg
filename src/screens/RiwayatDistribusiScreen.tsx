import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeDistribusi } from '../utils/scope';
import { DistribusiRute } from '../types';

const STATUS_LABEL: Record<DistribusiRute['status'], string> = {
  menunggu: 'Menunggu Paket',
  dalam_perjalanan: 'Dalam Pengiriman',
  tiba: 'Sudah Dikirim',
  kendala: 'Ada Masalah',
};

const STATUS_TONE: Record<DistribusiRute['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  menunggu: 'neutral',
  dalam_perjalanan: 'info',
  tiba: 'success',
  kendala: 'danger',
};

const FILTERS: Array<DistribusiRute['status'] | 'semua'> = ['semua', 'menunggu', 'dalam_perjalanan', 'tiba', 'kendala'];

// Full history log — every distribusi rute across all dates, filterable by
// status. Distribusi Armada GPS (today only) links here for "lihat semua log
// pengiriman"; tapping a card still opens the same DistribusiDetail tracking page.
export default function RiwayatDistribusiScreen({ navigation }: any) {
  const { sekolahList, sppgList, distribusiList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius } = useTheme();

  const [filterStatus, setFilterStatus] = useState<DistribusiRute['status'] | 'semua'>('semua');

  const inScope = useMemo(() => scopeDistribusi(sppgInScope, distribusiList), [sppgInScope, distribusiList]);
  const sorted = useMemo(() => [...inScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [inScope]);
  const filtered = useMemo(
    () => (filterStatus === 'semua' ? sorted : sorted.filter((r) => r.status === filterStatus)),
    [sorted, filterStatus],
  );
  const isMultiSppg = sppgInScope.length > 1;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle style={{ marginBottom: 0 }}>Log Pengiriman ({filtered.length})</SectionTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: 2 }}>
        {FILTERS.map((st) => {
          const isActive = filterStatus === st;
          return (
            <Pressable
              key={st}
              onPress={() => setFilterStatus(st)}
              style={[
                styles.chip,
                { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border, borderRadius: radius.pill },
              ]}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isActive ? colors.textInverse : colors.text }}>
                {st === 'semua' ? 'Semua Status' : STATUS_LABEL[st]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="truck" title="Belum Ada Log" body="Belum ada log pengiriman pada status ini." />
      ) : (
        filtered.map((rute) => {
          const sekolah = sekolahList.find((s) => s.id === rute.sekolahId);
          const sppg = sppgList.find((s) => s.id === rute.sppgId);

          return (
            <Card key={rute.id} style={{ gap: spacing.xs }} onPress={() => navigation.navigate('DistribusiDetail', { ruteId: rute.id })}>
              <View style={styles.rowTop}>
                <Pill label={STATUS_LABEL[rute.status]} tone={STATUS_TONE[rute.status]} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{rute.tanggal}</Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }} numberOfLines={1}>
                {sekolah?.nama ?? rute.sekolahId}
              </Text>
              {isMultiSppg && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="home" size={12} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                    {sppg?.nama ?? rute.sppgId}
                  </Text>
                </View>
              )}
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Jam Tiba: {rute.estimasiTiba}</Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
});
