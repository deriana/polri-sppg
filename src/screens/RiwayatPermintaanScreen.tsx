import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopePermintaanBahan, ROLE_PERMISSIONS } from '../utils/scope';
import { PermintaanBahan } from '../types';

const STATUS_LABEL: Record<PermintaanBahan['status'], string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
};
const STATUS_ORDER: PermintaanBahan['status'][] = ['diajukan', 'diproses', 'dikirim', 'selesai'];
const STATUS_TONE: Record<PermintaanBahan['status'], 'neutral' | 'warning' | 'info' | 'success'> = {
  diajukan: 'neutral',
  diproses: 'warning',
  dikirim: 'info',
  selesai: 'success',
};

export default function RiwayatPermintaanScreen() {
  const { role, permintaanBahanList, bahanBakuList, updatePermintaanStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize } = useTheme();

  const inScope = useMemo(() => scopePermintaanBahan(sppgInScope, permintaanBahanList), [sppgInScope, permintaanBahanList]);
  const sorted = useMemo(() => [...inScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [inScope]);

  const canAdvance = !!role && ROLE_PERMISSIONS[role].canManageGudang;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Riwayat Permintaan Bahan</SectionTitle>
      {sorted.length === 0 ? (
        <EmptyState icon="clipboard" title="Belum Ada Permintaan" body="Belum ada permintaan bahan baku yang diajukan." />
      ) : (
        sorted.map((p) => {
          const bahan = bahanBakuList.find((b) => b.id === p.bahanId);
          const currentIndex = STATUS_ORDER.indexOf(p.status);
          const nextStatus = STATUS_ORDER[currentIndex + 1];
          return (
            <Card key={p.id} style={{ gap: spacing.xs }}>
              <View style={styles.rowTop}>
                <Pill label={STATUS_LABEL[p.status]} tone={STATUS_TONE[p.status]} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{p.tanggal}</Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>
                {bahan ? `${bahan.nama} — ${p.jumlah} ${bahan.satuan}` : `${p.jumlah} unit`}
              </Text>
              {p.catatan && <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Catatan: {p.catatan}</Text>}
              {canAdvance && nextStatus && (
                <PrimaryButton
                  label={`Tandai: ${STATUS_LABEL[nextStatus]}`}
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => updatePermintaanStatus(p.id, nextStatus)}
                />
              )}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
