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
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<string>('semua');

  const bahanInScope = useMemo(() => scopeBahanBaku(sppgInScope, bahanBakuList), [sppgInScope, bahanBakuList]);

  // FEFO Sorting: bahan yang ada tanggalKadaluarsa diurutkan dari yang paling dekat expired
  const fefoSorted = useMemo(() => {
    return [...bahanInScope].sort((a, b) => {
      if (!a.tanggalKadaluarsa) return 1;
      if (!b.tanggalKadaluarsa) return -1;
      return a.tanggalKadaluarsa.localeCompare(b.tanggalKadaluarsa);
    });
  }, [bahanInScope]);

  const expiringSoonList = useMemo(() => {
    return bahanInScope.filter((b) => {
      if (!b.tanggalKadaluarsa) return false;
      const days = daysUntil(b.tanggalKadaluarsa);
      return days <= EXPIRY_WARNING_DAYS;
    });
  }, [bahanInScope]);

  const criticalStockList = useMemo(() => {
    return bahanInScope.filter((b) => b.stok <= b.ambangMinimum);
  }, [bahanInScope]);

  const filtered = useMemo(() => {
    if (activeFilter === 'semua') return fefoSorted;
    if (activeFilter === 'fefo') return expiringSoonList;
    if (activeFilter === 'kritis') return criticalStockList;
    return fefoSorted.filter((b) => b.kategori === activeFilter);
  }, [fefoSorted, expiringSoonList, criticalStockList, activeFilter]);

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

  const filterOptions = [
    { key: 'semua', label: 'Semua Stok' },
    { key: 'fefo', label: `⚠️ FEFO / Dekat Expired (${expiringSoonList.length})` },
    { key: 'kritis', label: `🔴 Stok Kritis (${criticalStockList.length})` },
    { key: 'bahan_pokok', label: 'Bahan Pokok' },
    { key: 'protein', label: 'Protein' },
    { key: 'sayur_buah', label: 'Sayur & Buah' },
    { key: 'bumbu', label: 'Bumbu & Minyak' },
    { key: 'kemasan', label: 'Kemasan' },
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <SectionTitle style={{ marginBottom: 0 }}>Gudang & Manajemen Stok (FEFO)</SectionTitle>
        {canRequest && (
          <PrimaryButton label="+ Ajukan Bahan" icon="plus" fullWidth={false} onPress={() => navigation.navigate('RequestBahanForm')} />
        )}
      </View>

      {/* FEFO Priority Warning Banner */}
      {expiringSoonList.length > 0 && (
        <Card variant="accent" style={{ gap: 6, borderColor: colors.warning, backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="clock" size={16} color={colors.warning} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.warning, flex: 1 }}>
              REKOMENDASI FEFO (FIRST-EXPIRED, FIRST-OUT)
            </Text>
            <Pill label={`${expiringSoonList.length} Bahan Prioritas`} tone="warning" />
          </View>
          <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: '700' }}>
            Bahan berikut wajib diprioritaskan untuk dimasak hari ini sebelum kadaluarsa:
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {expiringSoonList.map((b) => `${b.nama} (${b.stok} ${b.satuan} — Exp: ${b.tanggalKadaluarsa})`).join(' • ')}
          </Text>
        </Card>
      )}

      {/* Filter Chips Scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {filterOptions.map((k) => (
          <Pressable
            key={k.key}
            onPress={() => setActiveFilter(k.key)}
            style={[
              styles.chip,
              {
                borderColor: colors.border,
                borderRadius: radius.pill,
                backgroundColor: activeFilter === k.key ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text style={{ color: activeFilter === k.key ? colors.textInverse : colors.text, fontWeight: '700', fontSize: fontSize.xs }}>
              {k.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="package" title="Belum Ada Data Stok" body="Tidak ada bahan baku pada kategori atau filter ini." />
      ) : (
        filtered.map((b) => {
          const isLow = b.stok < b.ambangMinimum;
          const sppgName = isWilayah ? sppgInScope.find((s) => s.id === b.sppgId)?.nama : null;
          const mitra = b.mitraId ? mitraList.find((m) => m.id === b.mitraId) : undefined;
          const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : null;
          const isUrgentFefo = sisaHari !== null && sisaHari <= 2;
          const isExpiringSoon = sisaHari !== null && sisaHari <= EXPIRY_WARNING_DAYS;

          return (
            <Card
              key={b.id}
              style={{
                gap: spacing.xs,
                borderColor: isUrgentFefo ? colors.danger : isExpiringSoon ? colors.warning : colors.border,
                borderWidth: isUrgentFefo || isExpiringSoon ? 1.5 : 1,
              }}
            >
              <View style={styles.row}>
                {b.fotoBahan ? (
                  <Image source={{ uri: b.fotoBahan }} style={{ width: 52, height: 52, borderRadius: radius.sm }} />
                ) : (
                  <View style={[styles.iconWrap, { backgroundColor: isLow ? colors.dangerBg : colors.primaryLight }]}>
                    <Feather name="package" size={18} color={isLow ? colors.danger : colors.primary} strokeWidth={iconStrokeWidth} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>{b.nama}</Text>
                  {sppgName && <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sppgName}</Text>}
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>Ambang minimum: {b.ambangMinimum} {b.satuan}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: isLow ? colors.danger : colors.text, fontWeight: '800', fontSize: fontSize.md }}>
                    {b.stok} {b.satuan}
                  </Text>
                  {isLow && <Pill label="Stok Kritis" tone="danger" />}
                </View>
              </View>

              {/* FEFO Recommendation Tag */}
              {isUrgentFefo && (
                <View style={[styles.fefoTag, { backgroundColor: colors.dangerBg, borderRadius: radius.sm }]}>
                  <Feather name="alert-octagon" size={13} color={colors.danger} />
                  <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '800' }}>
                    PRIORITAS FEFO TINGGI: Gunakan dalam {sisaHari} hari (Exp: {b.tanggalKadaluarsa})
                  </Text>
                </View>
              )}

              <View style={styles.metaRow}>
                <Pill label={KATEGORI_LABEL[b.kategori]} tone="neutral" />
                {b.lokasiRak && <Pill label={b.lokasiRak} tone="info" icon="map-pin" />}
                {b.tanggalKadaluarsa && (
                  <Pill
                    label={`Kadaluarsa: ${b.tanggalKadaluarsa} (${sisaHari !== null ? (sisaHari <= 0 ? 'Hari ini' : `${sisaHari} hari lagi`) : ''})`}
                    tone={isUrgentFefo ? 'danger' : isExpiringSoon ? 'warning' : 'neutral'}
                    icon={isExpiringSoon ? 'alert-triangle' : 'calendar'}
                  />
                )}
              </View>

              {mitra ? (
                <Pressable onPress={() => navigation.navigate('MitraList', { mitraId: mitra.id })} hitSlop={4}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>
                    Pemasok: {mitra.nama} ➔
                  </Text>
                </Pressable>
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Swakelola / Disediakan SPPG</Text>
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
  fefoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
});

