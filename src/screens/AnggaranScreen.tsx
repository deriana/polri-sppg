import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { AnggaranKategori, AnggaranLog } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';

const KATEGORI_LABEL: Record<AnggaranKategori, string> = {
  alokasi_pusat: 'Alokasi Pusat / BGN',
  bahan_baku: 'Bahan Baku Makanan',
  operasional_armada: 'BBM & Armada MBG',
  gaji_insentif: 'Gaji & Insentif Staf',
  peralatan_dapur: 'Peralatan & Ompreng',
  kebersihan_apd: 'Kebersihan & APD',
  lainnya: 'Lainnya',
};

const KATEGORI_TONE: Record<AnggaranKategori, 'success' | 'info' | 'warning' | 'primary' | 'neutral' | 'danger'> = {
  alokasi_pusat: 'success',
  bahan_baku: 'primary',
  operasional_armada: 'warning',
  gaji_insentif: 'info',
  peralatan_dapur: 'neutral',
  kebersihan_apd: 'neutral',
  lainnya: 'neutral',
};

export default function AnggaranScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, addAnggaranLog } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, shadow, isDark } = useTheme();
  const { anggaranInScope } = useScopedData();

  const [selectedKategori, setSelectedKategori] = useState<string>('semua');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [jenis, setJenis] = useState<'pengeluaran' | 'penerimaan'>('pengeluaran');
  const [kategori, setKategori] = useState<AnggaranKategori>('bahan_baku');
  const [nominalStr, setNominalStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!role || !currentUser) return null;
  const permissions = ROLE_PERMISSIONS[role];

  // RBAC Access Check
  if (!permissions.canManageAnggaran) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={48} color={colors.danger} />
        <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 12 }}>
          Akses Dibatasi
        </Text>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 32 }}>
          Halaman log anggaran hanya dapat diakses oleh Kepala SPPG dan Supervisor Polres/Polda.
        </Text>
      </View>
    );
  }

  const filteredLogs = anggaranInScope.filter((a) =>
    selectedKategori === 'semua' ? true : a.kategori === selectedKategori,
  );

  const totalPenerimaan = anggaranInScope
    .filter((a) => a.jenis === 'penerimaan')
    .reduce((sum, a) => sum + a.nominal, 0);

  const totalPengeluaran = anggaranInScope
    .filter((a) => a.jenis === 'pengeluaran')
    .reduce((sum, a) => sum + a.nominal, 0);

  const sisaSaldo = totalPenerimaan - totalPengeluaran;

  const handleSave = () => {
    const nominal = parseInt(nominalStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(nominal) || nominal <= 0) {
      setError('Masukkan nominal anggaran yang valid.');
      return;
    }
    if (!keterangan.trim()) {
      setError('Masukkan keterangan rincian pengeluaran/penerimaan.');
      return;
    }

    addAnggaranLog({
      sppgId: currentSppg?.id ?? currentUser.sppgId,
      jenis,
      kategori,
      nominal,
      keterangan: keterangan.trim(),
      dibuatOleh: currentUser.nama,
    });

    setNominalStr('');
    setKeterangan('');
    setError(null);
    setShowModal(false);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Summary Card */}
      <Card variant="accent" style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="dollar-sign" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              REKAPITULASI DANA & ANGGARAN SPPG
            </Text>
          </View>
          <Pill label="Tahun 2026" tone="primary" />
        </View>

        <View style={{ gap: 2, marginTop: 4 }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>Sisa Saldo Operasional Saat Ini</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: sisaSaldo >= 0 ? colors.success : colors.danger }}>
            Rp {sisaSaldo.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Dana Diterima</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.success }}>
              + Rp {totalPenerimaan.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Terpakai</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.danger }}>
              - Rp {totalPengeluaran.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Action Button for Kepala SPPG */}
      {!permissions.isViewOnly && (
        <PrimaryButton
          label="+ Catat Transaksi / Pengeluaran Baru"
          icon="plus-circle"
          onPress={() => setShowModal(true)}
        />
      )}

      {/* Filter Options */}
      <SectionTitle
        action={
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
            {filteredLogs.length} Catatan Log
          </Text>
        }
      >
        Rincian Transaksi Anggaran
      </SectionTitle>

      <DropdownPicker
        label="Filter Kategori"
        value={selectedKategori}
        options={[
          { label: 'Semua Kategori Transaksi', value: 'semua' },
          { label: 'Alokasi Pusat / BGN', value: 'alokasi_pusat' },
          { label: 'Bahan Baku Makanan', value: 'bahan_baku' },
          { label: 'BBM & Armada MBG', value: 'operasional_armada' },
          { label: 'Gaji & Insentif Staf', value: 'gaji_insentif' },
          { label: 'Peralatan & Ompreng', value: 'peralatan_dapur' },
          { label: 'Kebersihan & APD', value: 'kebersihan_apd' },
        ]}
        onSelect={setSelectedKategori}
        icon="filter"
      />

      {/* Log Items List */}
      <View style={{ gap: spacing.sm }}>
        {filteredLogs.map((log) => {
          const isPenerimaan = log.jenis === 'penerimaan';
          return (
            <Card key={log.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: isPenerimaan ? colors.successBg : colors.dangerBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather
                      name={isPenerimaan ? 'arrow-down-left' : 'arrow-up-right'}
                      size={18}
                      color={isPenerimaan ? colors.success : colors.danger}
                      strokeWidth={iconStrokeWidth}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                      {log.keterangan}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {log.tanggal} • Oleh {log.dibuatOleh}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Pill label={KATEGORI_LABEL[log.kategori]} tone={KATEGORI_TONE[log.kategori]} />
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: '900',
                    color: isPenerimaan ? colors.success : colors.text,
                  }}
                >
                  {isPenerimaan ? '+' : '-'} Rp {log.nominal.toLocaleString('id-ID')}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Modal Add Log */}
      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Catat Pengeluaran / Anggaran Baru">
        <ScrollView style={{ gap: spacing.md }} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={{ backgroundColor: colors.dangerBg, padding: 10, borderRadius: radius.md, marginBottom: 8 }}>
              <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '600' }}>{error}</Text>
            </View>
          )}

          <DropdownPicker
            label="Jenis Transaksi"
            value={jenis}
            options={[
              { label: 'Pengeluaran Operasional (-)', value: 'pengeluaran' },
              { label: 'Penerimaan Alokasi Dana (+)', value: 'penerimaan' },
            ]}
            onSelect={(val) => setJenis(val as any)}
            icon="credit-card"
          />

          <DropdownPicker
            label="Kategori Anggaran"
            value={kategori}
            options={[
              { label: 'Bahan Baku Makanan', value: 'bahan_baku' },
              { label: 'BBM & Armada MBG', value: 'operasional_armada' },
              { label: 'Gaji & Insentif Staf', value: 'gaji_insentif' },
              { label: 'Peralatan & Ompreng', value: 'peralatan_dapur' },
              { label: 'Kebersihan & APD', value: 'kebersihan_apd' },
              { label: 'Alokasi Pusat / BGN', value: 'alokasi_pusat' },
              { label: 'Lainnya', value: 'lainnya' },
            ]}
            onSelect={(val) => setKategori(val as any)}
            icon="folder"
          />

          <Input
            label="Nominal (Rp)"
            icon="dollar-sign"
            value={nominalStr}
            onChangeText={setNominalStr}
            placeholder="Contoh: 15000000"
            keyboardType="number-pad"
          />

          <Input
            label="Keterangan / Rincian Barang"
            icon="file-text"
            value={keterangan}
            onChangeText={setKeterangan}
            placeholder="Contoh: Pembelian Beras 500kg dari PT Pangan Sejahtera"
            multiline
          />

          <PrimaryButton label="Simpan Catatan Anggaran" icon="check" onPress={handleSave} style={{ marginTop: 12 }} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 90 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  summaryDivider: { height: 1, marginVertical: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
