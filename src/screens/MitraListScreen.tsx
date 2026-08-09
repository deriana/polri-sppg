import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { Mitra } from '../types';

const STATUS_LABEL: Record<Mitra['statusKontrak'], string> = {
  aktif: 'Aktif',
  tinjau_ulang: 'Tinjau Ulang',
  nonaktif: 'Nonaktif',
};
const STATUS_TONE: Record<Mitra['statusKontrak'], 'success' | 'warning' | 'neutral'> = {
  aktif: 'success',
  tinjau_ulang: 'warning',
  nonaktif: 'neutral',
};

// Read-only for every role — mengenal pemasok berguna untuk Kepala SPPG,
// Petugas Lapangan, maupun kedua Supervisor; tidak ada gating izin di sini
// (berbeda dari Gudang yang tindakan tulisnya digate canManageGudang).
export default function MitraListScreen({ route }: any) {
  const { mitraList, bahanBakuList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [selectedId, setSelectedId] = useState<string | null>(route?.params?.mitraId ?? null);

  const kategoriOptions = useMemo(() => ['Semua', ...Array.from(new Set(mitraList.map((m) => m.jenisProduk)))], [mitraList]);
  const filtered = useMemo(
    () => (kategoriFilter === 'Semua' ? mitraList : mitraList.filter((m) => m.jenisProduk === kategoriFilter)),
    [mitraList, kategoriFilter],
  );

  const selected = selectedId ? mitraList.find((m) => m.id === selectedId) ?? null : null;

  if (selected) {
    const sppgIds = new Set(sppgInScope.map((s) => s.id));
    const memasok = bahanBakuList.filter((b) => b.mitraId === selected.id && sppgIds.has(b.sppgId));

    return (
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" onPress={() => setSelectedId(null)} tone="surface" shape="circle" />
          <SectionTitle style={{ marginBottom: 0, flex: 1 }}>{selected.nama}</SectionTitle>
        </View>

        <Card style={{ gap: spacing.xs }}>
          <View style={styles.rowTop}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{selected.jenisProduk}</Text>
            <Pill label={STATUS_LABEL[selected.statusKontrak]} tone={STATUS_TONE[selected.statusKontrak]} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Wilayah layanan: {selected.wilayahLayanan}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Kontak: {selected.kontakNama} · {selected.kontakHp}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Mitra sejak: {selected.sejakTanggal}</Text>
        </Card>

        <SectionTitle style={{ marginTop: spacing.xs }}>Memasok Ke</SectionTitle>
        {memasok.length === 0 ? (
          <EmptyState icon="package" title="Belum Ada Data" body="Belum ada bahan baku yang tercatat dari mitra ini pada SPPG yang Anda lihat." />
        ) : (
          memasok.map((b) => {
            const sppgName = sppgInScope.find((s) => s.id === b.sppgId)?.nama;
            return (
              <Card key={b.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{b.nama}</Text>
                  {sppgName && <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sppgName}</Text>}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{b.stok} {b.satuan}</Text>
              </Card>
            );
          })
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Mitra Pemasok</SectionTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {kategoriOptions.map((k) => (
          <Pressable
            key={k}
            onPress={() => setKategoriFilter(k)}
            style={[
              styles.chip,
              { borderColor: colors.border, borderRadius: radius.pill, backgroundColor: kategoriFilter === k ? colors.primary : colors.surface },
            ]}
          >
            <Text style={{ color: kategoriFilter === k ? colors.textInverse : colors.text, fontWeight: '700', fontSize: fontSize.xs }}>{k}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="users" title="Belum Ada Mitra" body="Tidak ada mitra pada kategori ini." />
      ) : (
        filtered.map((m) => (
          <Card key={m.id} onPress={() => setSelectedId(m.id)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{m.nama}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{m.jenisProduk} · {m.wilayahLayanan}</Text>
            </View>
            <Pill label={STATUS_LABEL[m.statusKontrak]} tone={STATUS_TONE[m.statusKontrak]} />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
});
