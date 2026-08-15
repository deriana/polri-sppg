import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {selected.fotoLogo ? (
              <Image source={{ uri: selected.fotoLogo }} style={{ width: 64, height: 64, borderRadius: radius.md }} />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="briefcase" size={28} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.rowTop}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>{selected.nama}</Text>
                <Pill label={STATUS_LABEL[selected.statusKontrak]} tone={STATUS_TONE[selected.statusKontrak]} />
              </View>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>{selected.jenisProduk}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Feather name="star" size={14} color="#EAB308" />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{selected.rating ?? 4.8}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>• Terverifikasi BGN</Text>
              </View>
            </View>
          </View>

          <View style={{ gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="map-pin" size={14} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>{selected.alamat ?? selected.wilayahLayanan}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="user" size={14} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>PIC: {selected.kontakNama} ({selected.kontakHp})</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="calendar" size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Kontrak Berjalan Sejak: {selected.sejakTanggal}</Text>
            </View>
          </View>

          {selected.kategoriPasok && selected.kategoriPasok.length > 0 && (
            <View style={{ gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Kategori Bahan Dipasok:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {selected.kategoriPasok.map((kat) => (
                  <Pill key={kat} label={kat} tone="info" />
                ))}
              </View>
            </View>
          )}
        </Card>

        <SectionTitle style={{ marginTop: spacing.xs }}>Memasok Ke SPPG ({memasok.length})</SectionTitle>
        {memasok.length === 0 ? (
          <EmptyState icon="package" title="Belum Ada Data Stok" body="Belum ada bahan baku yang tercatat dari mitra ini pada SPPG yang Anda lihat." />
        ) : (
          memasok.map((b) => {
            const sppgName = sppgInScope.find((s) => s.id === b.sppgId)?.nama;
            return (
              <Card key={b.id} style={styles.row}>
                {b.fotoBahan && (
                  <Image source={{ uri: b.fotoBahan }} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{b.nama}</Text>
                  {sppgName && <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sppgName}</Text>}
                </View>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>{b.stok} {b.satuan}</Text>
              </Card>
            );
          })
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Mitra Pemasok BGN ({filtered.length})</SectionTitle>

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
            {m.fotoLogo ? (
              <Image source={{ uri: m.fotoLogo }} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="briefcase" size={22} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{m.nama}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{m.jenisProduk} • {m.wilayahLayanan}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="star" size={12} color="#EAB308" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>{m.rating ?? 4.8}</Text>
              </View>
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
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
});
