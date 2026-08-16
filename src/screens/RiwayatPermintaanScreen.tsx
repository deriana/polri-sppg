import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopePermintaanBahan, ROLE_PERMISSIONS } from '../utils/scope';
import { PermintaanBahan } from '../types';

const STATUS_LABEL: Record<PermintaanBahan['status'], string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses Gizi/Gudang',
  dikirim: 'Dalam Pengiriman',
  selesai: 'Selesai Terima',
};

const STATUS_ORDER: PermintaanBahan['status'][] = ['diajukan', 'diproses', 'dikirim', 'selesai'];
const STATUS_TONE: Record<PermintaanBahan['status'], 'neutral' | 'warning' | 'info' | 'success'> = {
  diajukan: 'neutral',
  diproses: 'warning',
  dikirim: 'info',
  selesai: 'success',
};

const STEP_ICONS: Record<PermintaanBahan['status'], keyof typeof Feather.glyphMap> = {
  diajukan: 'file-text',
  diproses: 'package',
  dikirim: 'truck',
  selesai: 'check-circle',
};

export default function RiwayatPermintaanScreen({ navigation }: any) {
  const { role, permintaanBahanList, bahanBakuList, mitraList, updatePermintaanStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [filterStatus, setFilterStatus] = useState<PermintaanBahan['status'] | 'semua'>('semua');

  const inScope = useMemo(() => scopePermintaanBahan(sppgInScope, permintaanBahanList), [sppgInScope, permintaanBahanList]);
  const sorted = useMemo(() => [...inScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [inScope]);
  const filtered = useMemo(
    () => (filterStatus === 'semua' ? sorted : sorted.filter((p) => p.status === filterStatus)),
    [sorted, filterStatus],
  );

  const canAdvance = !!role && ROLE_PERMISSIONS[role].canManageGudang;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.rowTop}>
        <SectionTitle style={{ marginBottom: 0 }}>Riwayat Permintaan Bahan</SectionTitle>
        {canAdvance && (
          <PrimaryButton label="Buat Pengajuan" icon="plus" fullWidth={false} onPress={() => navigation.navigate('RequestBahanForm')} />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: 2 }}>
        {(['semua', 'diajukan', 'diproses', 'dikirim', 'selesai'] as const).map((st) => {
          const isActive = filterStatus === st;
          return (
            <Pressable
              key={st}
              onPress={() => setFilterStatus(st)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: isActive ? '800' : '600', color: isActive ? colors.textInverse : colors.textMuted }}>
                {st === 'semua' ? 'Semua Status' : STATUS_LABEL[st]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="clipboard" title="Belum Ada Permintaan" body="Belum ada permintaan bahan baku pada status ini." />
      ) : (
        filtered.map((p) => {
          const bahan = bahanBakuList.find((b) => b.id === p.bahanId);
          const mitra = bahan?.mitraId ? mitraList.find((m) => m.id === bahan.mitraId) : undefined;
          const currentIndex = STATUS_ORDER.indexOf(p.status);
          const nextStatus = STATUS_ORDER[currentIndex + 1];

          return (
            <Card key={p.id} style={{ gap: spacing.xs }}>
              <View style={styles.rowTop}>
                <Pill label={STATUS_LABEL[p.status]} tone={STATUS_TONE[p.status]} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Tanggal: {p.tanggal}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 2 }}>
                {bahan?.fotoBahan ? (
                  <Image source={{ uri: bahan.fotoBahan }} style={{ width: 50, height: 50, borderRadius: radius.sm }} />
                ) : (
                  <View style={{ width: 50, height: 50, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="package" size={22} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>
                    {bahan ? bahan.nama : p.bahanId}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 }}>
                    Jumlah Pengajuan: <Text style={{ color: colors.primary, fontWeight: '700' }}>{p.jumlah} {bahan?.satuan ?? 'unit'}</Text>
                  </Text>
                  {mitra ? (
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>Pemasok: {mitra.nama}</Text>
                  ) : (
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>Tujuan: BGN Pusat (swakelola)</Text>
                  )}
                </View>
              </View>

              <View style={[styles.stepBar, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                {STATUS_ORDER.map((st, i) => {
                  const reached = i <= currentIndex;
                  return (
                    <React.Fragment key={st}>
                      <View style={styles.stepDotWrap}>
                        <View style={[styles.stepDot, { backgroundColor: reached ? colors.primary : colors.border }]}>
                          <Feather name={STEP_ICONS[st]} size={10} color={reached ? colors.textInverse : colors.textMuted} />
                        </View>
                        <Text style={{ fontSize: 9, color: reached ? colors.text : colors.textMuted, fontWeight: reached ? '700' : '400', marginTop: 2 }}>
                          {st.slice(0, 5)}
                        </Text>
                      </View>
                      {i < STATUS_ORDER.length - 1 && (
                        <View style={[styles.stepLine, { backgroundColor: i < currentIndex ? colors.primary : colors.border }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {p.catatan && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Feather name="file-text" size={13} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, flex: 1 }}>Catatan: {p.catatan}</Text>
                </View>
              )}

              <View style={{ flexDirection: canAdvance && nextStatus ? 'row' : 'column', gap: 8, marginTop: 4 }}>
                <PrimaryButton
                  label="Lacak Pengiriman Truk"
                  icon="truck"
                  variant="secondary"
                  onPress={() => navigation.navigate('PermintaanBahanDetail', { permintaanId: p.id })}
                  style={{ flex: 1 }}
                />

                {canAdvance && nextStatus && (
                  <PrimaryButton
                    label={`Lanjut: ${STATUS_LABEL[nextStatus]}`}
                    icon="arrow-right"
                    variant="primary"
                    onPress={() => updatePermintaanStatus(p.id, nextStatus)}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
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
  stepBar: { flexDirection: 'row', alignItems: 'center', padding: 10, marginVertical: 4, justifyContent: 'space-between' },
  stepDotWrap: { alignItems: 'center' },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
});
