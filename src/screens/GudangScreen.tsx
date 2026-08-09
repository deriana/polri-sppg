import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeBahanBaku, ROLE_PERMISSIONS } from '../utils/scope';
import { BahanKategori } from '../types';

const KATEGORI_LABEL: Record<BahanKategori, string> = {
  bahan_pokok: 'Bahan Pokok',
  protein: 'Protein',
  sayur_buah: 'Sayur & Buah',
  bumbu: 'Bumbu & Minyak',
  kemasan: 'Kemasan',
  lainnya: 'Lainnya',
};
const KATEGORI_FILTERS: Array<BahanKategori | 'semua'> = ['semua', 'bahan_pokok', 'protein', 'sayur_buah', 'bumbu', 'kemasan', 'lainnya'];

// Ambang peringatan kadaluarsa — sama untuk seluruh SPPG, dipakai untuk warna warning pada baris bahan.
const EXPIRY_WARNING_DAYS = 3;

function daysUntil(tanggal: string): number {
  const d = new Date(tanggal);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GudangScreen({ navigation }: any) {
  const { role, bahanBakuList, mitraList, mutasiStokList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const [kategoriFilter, setKategoriFilter] = useState<BahanKategori | 'semua'>('semua');

  const bahanInScope = useMemo(() => scopeBahanBaku(sppgInScope, bahanBakuList), [sppgInScope, bahanBakuList]);
  const filtered = useMemo(
    () => (kategoriFilter === 'semua' ? bahanInScope : bahanInScope.filter((b) => b.kategori === kategoriFilter)),
    [bahanInScope, kategoriFilter],
  );
  const isWilayah = !!role && ROLE_PERMISSIONS[role].isViewOnly;
  const canRequest = !!role && ROLE_PERMISSIONS[role].canManageGudang;

  const sppgIdsInScope = useMemo(() => new Set(sppgInScope.map((s) => s.id)), [sppgInScope]);
  const riwayatMutasi = useMemo(
    () =>
      mutasiStokList
        .filter((m) => sppgIdsInScope.has(m.sppgId))
        .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
        .slice(0, 6),
    [mutasiStokList, sppgIdsInScope],
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <SectionTitle style={{ marginBottom: 0 }}>Stok Bahan Baku</SectionTitle>
        {canRequest && (
          <PrimaryButton label="Ajukan" icon="plus" fullWidth={false} onPress={() => navigation.navigate('RequestBahanForm')} />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {KATEGORI_FILTERS.map((k) => (
          <Pressable
            key={k}
            onPress={() => setKategoriFilter(k)}
            style={[
              styles.chip,
              { borderColor: colors.border, borderRadius: radius.pill, backgroundColor: kategoriFilter === k ? colors.primary : colors.surface },
            ]}
          >
            <Text style={{ color: kategoriFilter === k ? colors.textInverse : colors.text, fontWeight: '700', fontSize: fontSize.xs }}>
              {k === 'semua' ? 'Semua' : KATEGORI_LABEL[k]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="package" title="Belum Ada Data Stok" body="Belum ada data bahan baku pada kategori/SPPG ini." />
      ) : (
        filtered.map((b) => {
          const isLow = b.stok < b.ambangMinimum;
          const sppgName = isWilayah ? sppgInScope.find((s) => s.id === b.sppgId)?.nama : null;
          const mitra = b.mitraId ? mitraList.find((m) => m.id === b.mitraId) : undefined;
          const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : null;
          const isExpiringSoon = sisaHari !== null && sisaHari <= EXPIRY_WARNING_DAYS;

          return (
            <Card key={b.id} style={{ gap: spacing.xs }}>
              <View style={styles.row}>
                {b.fotoBahan ? (
                  <Image source={{ uri: b.fotoBahan }} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
                ) : (
                  <View style={[styles.iconWrap, { backgroundColor: isLow ? colors.dangerBg : colors.primaryLight }]}>
                    <Feather name="package" size={18} color={isLow ? colors.danger : colors.primary} strokeWidth={iconStrokeWidth} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{b.nama}</Text>
                  {sppgName && <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sppgName}</Text>}
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Ambang minimum: {b.ambangMinimum} {b.satuan}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: isLow ? colors.danger : colors.text, fontWeight: '800', fontSize: fontSize.md }}>
                    {b.stok} {b.satuan}
                  </Text>
                  {isLow && <Pill label="Stok Rendah" tone="danger" />}
                </View>
              </View>

              <View style={styles.metaRow}>
                <Pill label={KATEGORI_LABEL[b.kategori]} tone="neutral" />
                {b.lokasiRak && <Pill label={b.lokasiRak} tone="info" icon="map-pin" />}
                {b.tanggalKadaluarsa && (
                  <Pill
                    label={`Kadaluarsa: ${b.tanggalKadaluarsa}`}
                    tone={isExpiringSoon ? 'danger' : 'neutral'}
                    icon={isExpiringSoon ? 'alert-triangle' : 'calendar'}
                  />
                )}
              </View>

              {mitra ? (
                <Pressable onPress={() => navigation.navigate('MitraList', { mitraId: mitra.id })} hitSlop={4}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>
                    dari: {mitra.nama} →
                  </Text>
                </Pressable>
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Swakelola / tanpa mitra tetap</Text>
              )}
            </Card>
          );
        })
      )}

      {canRequest && (
        <PrimaryButton
          label="Catat Mutasi Stok"
          icon="repeat"
          variant="secondary"
          onPress={() => navigation.navigate('MutasiStokForm')}
        />
      )}

      {riwayatMutasi.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: spacing.xs }}>Riwayat Mutasi Terbaru</SectionTitle>
          {riwayatMutasi.map((m) => {
            const bahan = bahanBakuList.find((b) => b.id === m.bahanId);
            const isMasuk = m.jenis === 'masuk';
            return (
              <Card key={m.id} style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: isMasuk ? colors.successBg : colors.warningBg }]}>
                  <Feather
                    name={isMasuk ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={18}
                    color={isMasuk ? colors.success : colors.warning}
                    strokeWidth={iconStrokeWidth}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>
                    {bahan ? bahan.nama : m.bahanId} · {isMasuk ? '+' : '-'}{m.jumlah} {bahan?.satuan ?? ''}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{m.keterangan}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{m.tanggal}</Text>
              </Card>
            );
          })}
        </>
      )}

      <PrimaryButton
        label="Riwayat Permintaan"
        icon="clipboard"
        variant="outline"
        onPress={() => navigation.navigate('RiwayatPermintaan')}
      />
      {!isWilayah && (
        <PrimaryButton
          label="Pindai QR Penerimaan Barang"
          icon="camera"
          variant="secondary"
          onPress={() => navigation.navigate('QrScan')}
        />
      )}

      <Card onPress={() => navigation.navigate('MitraList')} style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Feather name="users" size={18} color={colors.primary} strokeWidth={iconStrokeWidth} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>Lihat Mitra Pemasok</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Supplier/pabrik yang memasok bahan baku</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
});
