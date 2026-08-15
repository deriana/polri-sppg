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
  protein: 'Protein & Daging',
  sayur_buah: 'Sayur & Buah',
  bumbu: 'Bumbu & Minyak',
  kemasan: 'Kemasan & Box',
  lainnya: 'Lainnya',
};

const KATEGORI_LIST: Array<BahanKategori | 'semua'> = [
  'semua',
  'bahan_pokok',
  'protein',
  'sayur_buah',
  'bumbu',
  'kemasan',
  'lainnya',
];

// Ambang peringatan kadaluarsa FEFO (3 hari)
const EXPIRY_WARNING_DAYS = 3;

function daysUntil(tanggal: string): number {
  const d = new Date(tanggal);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GudangScreen({ navigation }: any) {
  const { role, bahanBakuList, mitraList, mutasiStokList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark, shadow } = useTheme();

  // Terpisah: Filter Status / FEFO vs Filter Kategori
  const [statusFilter, setStatusFilter] = useState<'semua' | 'fefo' | 'kritis' | 'aman'>('semua');
  const [kategoriFilter, setKategoriFilter] = useState<BahanKategori | 'semua'>('semua');

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

  // Filter kombinasi: Status (FEFO/Kritis/Aman) DAN Kategori Bahan
  const filtered = useMemo(() => {
    return fefoSorted.filter((b) => {
      const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : null;
      const isFefo = sisaHari !== null && sisaHari <= EXPIRY_WARNING_DAYS;
      const isCritical = b.stok <= b.ambangMinimum;

      // Check Status Filter
      if (statusFilter === 'fefo' && !isFefo) return false;
      if (statusFilter === 'kritis' && !isCritical) return false;
      if (statusFilter === 'aman' && isCritical) return false;

      // Check Kategori Filter
      if (kategoriFilter !== 'semua' && b.kategori !== kategoriFilter) return false;

      return true;
    });
  }, [fefoSorted, statusFilter, kategoriFilter]);

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

  const statusFilterOptions = [
    { key: 'semua', label: `Semua (${bahanInScope.length})` },
    { key: 'fefo', label: `⚠️ FEFO / Dekat Expired (${expiringSoonList.length})`, isWarning: true },
    { key: 'kritis', label: `🔴 Stok Kritis (${criticalStockList.length})`, isDanger: true },
    { key: 'aman', label: '🟢 Stok Aman' },
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <SectionTitle style={{ marginBottom: 0 }}>Gudang & Stok Bahan Baku</SectionTitle>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            Manajemen logistik dapur, masa kedaluwarsa (FEFO), & relasi pemasok
          </Text>
        </View>
        {canRequest && (
          <PrimaryButton label="+ Ajukan Bahan" icon="plus" fullWidth={false} onPress={() => navigation.navigate('RequestBahanForm')} />
        )}
      </View>

      {/* 2. FEFO Priority Warning Banner */}
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

      {/* 3. FILTER GROUP 1: Status & Prioritas Stok */}
      <View style={{ gap: 6 }}>
        <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
          1. STATUS & PRIORITAS KELAYAKAN
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {statusFilterOptions.map((opt) => {
            const isSelected = statusFilter === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setStatusFilter(opt.key as any)}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radius.pill,
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isSelected ? colors.textInverse : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: fontSize.xs,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. FILTER GROUP 2: Kategori Bahan Baku */}
      <View style={{ gap: 6 }}>
        <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
          2. KATEGORI BAHAN POKOK & GIZI
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {KATEGORI_LIST.map((k) => {
            const isSelected = kategoriFilter === k;
            return (
              <Pressable
                key={k}
                onPress={() => setKategoriFilter(k)}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? (isDark ? colors.gold : colors.primary) : colors.border,
                    borderRadius: radius.pill,
                    backgroundColor: isSelected ? (isDark ? colors.primary : colors.primaryLight) : colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isSelected ? (isDark ? colors.textInverse : colors.primary) : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: fontSize.xs,
                  }}
                >
                  {k === 'semua' ? 'Semua Kategori' : KATEGORI_LABEL[k]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Daftar Kartu Bahan Baku */}
      <SectionTitle
        action={
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
            {filtered.length} Bahan Ditemukan
          </Text>
        }
      >
        Daftar Ketersediaan Stok
      </SectionTitle>

      {filtered.length === 0 ? (
        <EmptyState
          icon="package"
          title="Tidak Ada Bahan yang Cocok"
          body="Coba ubah kombinasi filter status atau kategori bahan di atas."
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {filtered.map((b) => {
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
                  gap: 10,
                  borderColor: isUrgentFefo ? colors.danger : isExpiringSoon ? colors.warning : colors.border,
                  borderWidth: isUrgentFefo || isExpiringSoon ? 1.5 : 1,
                }}
              >
                {/* Header Row: Foto/Icon + Nama Bahan + Kategori & Rak */}
                <View style={styles.stockItemHeader}>
                  {b.fotoBahan ? (
                    <Image source={{ uri: b.fotoBahan }} style={[styles.bahanImage, { borderRadius: radius.md }]} />
                  ) : (
                    <View style={[styles.stockIconWrap, { backgroundColor: isLow ? colors.dangerBg : colors.primaryLight }]}>
                      <Feather name="package" size={20} color={isLow ? colors.danger : colors.primary} strokeWidth={iconStrokeWidth} />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>
                      {b.nama}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      <Pill label={KATEGORI_LABEL[b.kategori]} tone="neutral" />
                      {b.lokasiRak && <Pill label={b.lokasiRak} tone="info" icon="map-pin" />}
                    </View>
                    {sppgName && <Text style={{ color: colors.textMuted, fontSize: 11 }}>Unit: {sppgName}</Text>}
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ color: isLow ? colors.danger : colors.text, fontWeight: '900', fontSize: 18 }}>
                      {b.stok.toLocaleString('id-ID')} <Text style={{ fontSize: 12, fontWeight: '600' }}>{b.satuan}</Text>
                    </Text>
                    <Pill
                      label={isLow ? 'Stok Kritis' : 'Stok Aman'}
                      tone={isLow ? 'danger' : 'success'}
                    />
                  </View>
                </View>

                {/* Ambang Minimum & Exp Date Bar */}
                <View style={[styles.stockMetaBar, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="shield" size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Ambang Batas: <Text style={{ fontWeight: '700', color: colors.text }}>{b.ambangMinimum} {b.satuan}</Text>
                    </Text>
                  </View>

                  {b.tanggalKadaluarsa && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Feather name="calendar" size={12} color={isExpiringSoon ? colors.warning : colors.textMuted} />
                      <Text style={{ fontSize: 11, color: isExpiringSoon ? (isUrgentFefo ? colors.danger : colors.warning) : colors.textMuted, fontWeight: isExpiringSoon ? '800' : '500' }}>
                        Exp: {b.tanggalKadaluarsa} ({sisaHari !== null ? (sisaHari <= 0 ? 'Hari Ini!' : `${sisaHari} hari lagi`) : ''})
                      </Text>
                    </View>
                  )}
                </View>

                {/* FEFO Urgent Warning Badge */}
                {isUrgentFefo && (
                  <View style={[styles.fefoTag, { backgroundColor: colors.dangerBg, borderRadius: radius.sm }]}>
                    <Feather name="alert-triangle" size={13} color={colors.danger} />
                    <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '800', flex: 1 }}>
                      PRIORITAS FEFO: Wajib diolah lebih dulu dalam {sisaHari} hari
                    </Text>
                  </View>
                )}

                {/* Supplier Dedicated Panel */}
                <View style={[styles.supplierPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border, borderRadius: radius.md }]}>
                  <View style={[styles.supplierIconBox, { backgroundColor: colors.primaryLight }]}>
                    <Feather name="truck" size={16} color={colors.primary} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>PEMASOK RESMI</Text>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                      {mitra ? mitra.nama : 'Swakelola / Disediakan SPPG'}
                    </Text>
                    {mitra && (
                      <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                        Kategori: {mitra.jenisProduk} • {mitra.wilayahLayanan}
                      </Text>
                    )}
                  </View>

                  {mitra ? (
                    <Pressable
                      onPress={() => navigation.navigate('MitraList', { mitraId: mitra.id })}
                      hitSlop={6}
                      style={[styles.mitraBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 11 }}>
                        Detail Pemasok ➔
                      </Text>
                    </Pressable>
                  ) : (
                    <Pill label="Swakelola" tone="neutral" />
                  )}
                </View>
              </Card>
            );
          })
        }
        </View>
      )}

      {/* 6. Riwayat Mutasi Stok Terbaru */}
      {riwayatMutasi.length > 0 && (
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <SectionTitle style={{ marginBottom: 0 }}>Riwayat Keluar / Masuk Bahan</SectionTitle>
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
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>
                    {bahan ? bahan.nama : m.bahanId} · {isMasuk ? '+' : '-'}{m.jumlah} {bahan?.satuan ?? ''}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{m.keterangan}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{m.tanggal}</Text>
              </Card>
            );
          })}
        </View>
      )}

      {/* 7. Action Shortcuts Panel */}
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Aksi Cepat Manajemen Gudang</SectionTitle>

        {canRequest && (
          <>
            <PrimaryButton
              label="+ Belanja Bahan Pokok Mandiri (Log Anggaran)"
              icon="shopping-cart"
              onPress={() => navigation.navigate('Anggaran')}
            />
            <PrimaryButton
              label="Catat Mutasi Keluar / Masuk Manual"
              icon="repeat"
              variant="secondary"
              onPress={() => navigation.navigate('MutasiStokForm')}
            />
          </>
        )}

        <PrimaryButton
          label="Riwayat Permintaan Bahan ke Pusat"
          icon="clipboard"
          variant="outline"
          onPress={() => navigation.navigate('RiwayatPermintaan')}
        />

        {!isWilayah && (
          <PrimaryButton
            label="Pindai QR Penerimaan Barang / Surat Jalan"
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
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>Lihat Seluruh Mitra Pemasok</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Daftar supplier bahan baku & status kontrak aktif</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 120 }, // Fix bottom button overlay
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  filterGroupLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  stockItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bahanImage: { width: 54, height: 54, resizeMode: 'cover' },
  stockIconWrap: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stockMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fefoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  supplierPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
  },
  supplierIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mitraBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
});


