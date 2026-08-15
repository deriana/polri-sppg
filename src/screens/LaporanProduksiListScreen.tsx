import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import HppBadge from '../components/HppBadge';
import { formatRp, resolveHpp } from '../utils/hpp';
import { useScopedData } from '../hooks';
import { LaporanProduksi, LaporanStatus } from '../types';
import { canVerifyLaporan } from '../utils/scope';

const STATUS_TONE: Record<LaporanStatus, 'neutral' | 'info' | 'success'> = {
  draft: 'neutral',
  terkirim: 'info',
  diverifikasi: 'success',
};
const STATUS_LABEL: Record<LaporanStatus, string> = {
  draft: 'Belum Dikirim',
  terkirim: 'Terkirim',
  diverifikasi: 'Diverifikasi',
};

type Filter = 'hari' | 'minggu' | 'bulan' | 'semua';

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
  const { role, currentUser, verifyLaporan, masterMenuList, costPerMeal } = useApp();
  const { laporanInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const [filter, setFilter] = useState<Filter>('minggu');

  const sorted = useMemo(() => [...laporanInScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [laporanInScope]);

  const filtered = sorted.filter((l) => {
    if (filter === 'hari') return l.tanggal === new Date().toISOString().slice(0, 10);
    if (filter === 'minggu') return inLastNDays(l.tanggal, 7);
    if (filter === 'bulan') return inCurrentMonth(l.tanggal);
    return true;
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: 12 }]}>
        <View style={styles.headerRow}>
          <SectionTitle style={{ marginBottom: 0 }}>Laporan Produksi</SectionTitle>
          <PrimaryButton label="Baru" icon="plus" fullWidth={false} onPress={() => navigation.navigate('LaporanForm', {})} />
        </View>
        <View style={[styles.segment, { borderColor: colors.border, borderRadius: radius.md }]}>
          {(['hari', 'minggu', 'bulan', 'semua'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.segmentItem, { borderRadius: radius.sm }, filter === f && { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: filter === f ? colors.textInverse : colors.text, fontWeight: '700', fontSize: fontSize.xs }}>
                {f === 'hari' ? 'Hari Ini' : f === 'minggu' ? 'Minggu Ini' : f === 'bulan' ? 'Bulan Ini' : 'Semua'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120, gap: 14 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="file-text" title="Belum Ada Laporan" body="Tidak ada laporan produksi pada rentang ini." />
        ) : (
          filtered.map((l: LaporanProduksi) => {
            const canVerify = role && currentUser ? canVerifyLaporan(role, currentUser.sppgId, l) : false;
            const batchLabel = l.batchId || `BATCH-${l.sppgId}-${l.tanggal.replace(/-/g, '')}-01`;
            const qcTone =
              l.qcStatus === 'READY'
                ? 'success'
                : l.qcStatus === 'HOLD'
                ? 'warning'
                : l.qcStatus === 'REJECTED'
                ? 'danger'
                : 'neutral';

            const pctRealisasi = l.targetPorsi > 0 ? Math.min(100, Math.round(((l.realisasiPorsi || l.targetPorsi) / l.targetPorsi) * 100)) : 100;
            const productionSteps = [
              { label: 'Persiapan', icon: 'clipboard' as const, isDone: true },
              { label: 'Masak', icon: 'zap' as const, isDone: true },
              { label: 'Packing', icon: 'package' as const, isDone: l.realisasiPorsi > 0 },
              { label: 'QC', icon: 'shield' as const, isDone: l.qcStatus === 'READY' },
              { label: 'Distribusi', icon: 'truck' as const, isDone: l.status === 'diverifikasi' },
            ];

            return (
              <Card
                key={l.id}
                style={{ gap: spacing.sm, borderWidth: 1.2, borderColor: l.status === 'diverifikasi' ? colors.success : colors.border }}
                onPress={() => navigation.navigate('LaporanForm', { laporanId: l.id })}
              >
                <View style={styles.rowTop}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: fontSize.sm }}>{l.tanggal}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.batchBadge, { backgroundColor: colors.primaryLight }]}>
                        <Feather name="hash" size={11} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '800' }}>{batchLabel}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {l.qcStatus && <Pill label={`QC: ${l.qcStatus}`} tone={qcTone} />}
                    <Pill label={STATUS_LABEL[l.status]} tone={STATUS_TONE[l.status]} />
                  </View>
                </View>

                {/* Nama Paket Menu */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="layers" size={14} color={colors.primary} />
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.xs, flex: 1 }} numberOfLines={1}>
                    {l.menu}
                  </Text>
                </View>

                {/* 5-Step Visual Production Pipeline */}
                <View style={[styles.timelineMiniRow, { backgroundColor: colors.background, borderRadius: radius.md }]}>
                  {productionSteps.map((st, idx) => (
                    <React.Fragment key={idx}>
                      <View style={styles.stepItemMini}>
                        <View
                          style={[
                            styles.stepCircleMini,
                            {
                              backgroundColor: st.isDone ? colors.success : colors.surface,
                              borderColor: st.isDone ? colors.success : colors.border,
                            },
                          ]}
                        >
                          <Feather
                            name={st.isDone ? 'check' : st.icon}
                            size={10}
                            color={st.isDone ? '#FFFFFF' : colors.textMuted}
                            strokeWidth={2.4}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: st.isDone ? '800' : '500',
                            color: st.isDone ? colors.success : colors.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {st.label}
                        </Text>
                      </View>
                      {idx < productionSteps.length - 1 && (
                        <View
                          style={[
                            styles.stepConnectorMini,
                            { backgroundColor: productionSteps[idx + 1].isDone ? colors.success : colors.border },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {/* Target vs Realisasi Porsi Progress Bar */}
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                      Realisasi: {l.realisasiPorsi || l.targetPorsi} / {l.targetPorsi} porsi
                    </Text>
                    <Text style={{ color: colors.success, fontSize: 11, fontWeight: '800' }}>
                      {pctRealisasi}% Selesai
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${pctRealisasi}%`, height: '100%', backgroundColor: colors.success }} />
                  </View>
                </View>

                {(() => {
                  const hpp = resolveHpp(l.menu, masterMenuList, costPerMeal);
                  const porsi = l.realisasiPorsi > 0 ? l.realisasiPorsi : l.targetPorsi;
                  return (
                    <View style={{ gap: 4, marginTop: 2 }}>
                      <HppBadge info={hpp} />
                      <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>
                        Estimasi HPP: {formatRp(hpp.nilai * porsi)} untuk {porsi} porsi • {l.foto.length} foto dapur
                      </Text>
                    </View>
                  );
                })()}

                <View style={[styles.rowBottom, { borderTopColor: colors.border, borderTopWidth: 0.5, paddingTop: 6 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="camera" size={12} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {l.foto.length} Foto Dokumentasi Masak
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Buka Form</Text>
                    <Feather name="chevron-right" size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
                  </View>
                </View>

                {canVerify && l.status === 'terkirim' && (
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
  content: { gap: 12, paddingBottom: 120 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  batchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    marginVertical: 2,
  },
  stepItemMini: {
    alignItems: 'center',
    gap: 2,
  },
  stepCircleMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnectorMini: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
});
