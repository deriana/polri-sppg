import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { AnggaranKategori, AnggaranLog, ItemPembelian } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';

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

interface FormItemRow {
  id: string;
  namaBarang: string;
  jumlah: string;
  satuan: string;
  hargaSatuan: string;
}

export default function AnggaranScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, addAnggaranLog, mitraList, bahanBakuList, catatMutasiStok } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, shadow, isDark } = useTheme();
  const { anggaranInScope } = useScopedData();

  const [selectedKategori, setSelectedKategori] = useState<string>('semua');
  const [showModal, setShowModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<AnggaranLog | null>(null);

  // Form State
  const [jenis, setJenis] = useState<'pengeluaran' | 'penerimaan'>('pengeluaran');
  const [kategori, setKategori] = useState<AnggaranKategori>('bahan_baku');
  const [nominalStr, setNominalStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [selectedMitraId, setSelectedMitraId] = useState<string>('custom');
  const [customSupplier, setCustomSupplier] = useState('');
  const [noInvoice, setNoInvoice] = useState('');
  const [fotoNotaUri, setFotoNotaUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Itemized Purchase Rows
  const [itemRows, setItemRows] = useState<FormItemRow[]>([
    { id: '1', namaBarang: '', jumlah: '', satuan: 'kg', hargaSatuan: '' },
  ]);

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
          Halaman log anggaran hanya dapat diakses oleh Kepala SPPG dan Pengawas Komando.
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

  const handleAddItemRow = () => {
    setItemRows((prev) => [
      ...prev,
      { id: String(Date.now()), namaBarang: '', jumlah: '', satuan: 'kg', hargaSatuan: '' },
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (itemRows.length <= 1) return;
    setItemRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateItemRow = (id: string, field: keyof FormItemRow, val: string) => {
    setItemRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  };

  // Hitung total dari baris items jika diisi
  const calculatedItemsTotal = itemRows.reduce((sum, r) => {
    const qty = parseFloat(r.jumlah) || 0;
    const price = parseFloat(r.hargaSatuan.replace(/[^0-9]/g, '')) || 0;
    return sum + qty * price;
  }, 0);

  const effectiveNominal = calculatedItemsTotal > 0 ? calculatedItemsTotal : parseInt(nominalStr.replace(/[^0-9]/g, ''), 10) || 0;

  const handleAttachPhoto = async () => {
    const picked = await pickMedia('camera', ['images']);
    if (picked) setFotoNotaUri(picked.uri);
  };

  const handleSave = () => {
    if (effectiveNominal <= 0) {
      setError('Masukkan nominal transaksi atau rincian item barang yang valid.');
      return;
    }
    if (!keterangan.trim()) {
      setError('Masukkan keterangan rincian transaksi pengadaan.');
      return;
    }

    const chosenMitra = mitraList.find((m) => m.id === selectedMitraId);
    const supplierName =
      selectedMitraId === 'custom' || !chosenMitra
        ? (customSupplier.trim() || 'Supplier Non-Mitra')
        : chosenMitra.nama;

    const validItems: ItemPembelian[] = itemRows
      .filter((r) => r.namaBarang.trim().length > 0 && parseFloat(r.jumlah) > 0)
      .map((r) => {
        const qty = parseFloat(r.jumlah) || 1;
        const unitPrice = parseFloat(r.hargaSatuan.replace(/[^0-9]/g, '')) || 0;
        return {
          namaBarang: r.namaBarang.trim(),
          jumlah: qty,
          satuan: r.satuan.trim() || 'pcs',
          hargaSatuan: unitPrice,
          totalHarga: qty * unitPrice,
        };
      });

    addAnggaranLog({
      sppgId: currentSppg?.id ?? currentUser.sppgId,
      jenis,
      kategori,
      nominal: effectiveNominal,
      keterangan: keterangan.trim(),
      dibuatOleh: currentUser.nama,
      namaSupplier: supplierName,
      mitraId: selectedMitraId !== 'custom' ? selectedMitraId : null,
      noInvoice: noInvoice.trim() || `INV-${Date.now().toString().slice(-6)}`,
      buktiNota: fotoNotaUri || (jenis === 'penerimaan' ? 'SK-PUSAT.pdf' : 'NOTA-PEMBELIAN.jpg'),
      items: validItems.length > 0 ? validItems : undefined,
    });

    // Reset Form
    setNominalStr('');
    setKeterangan('');
    setCustomSupplier('');
    setNoInvoice('');
    setFotoNotaUri(null);
    setItemRows([{ id: '1', namaBarang: '', jumlah: '', satuan: 'kg', hargaSatuan: '' }]);
    setError(null);
    setShowModal(false);

    Alert.alert(
      'Transaksi Tersimpan & Tersinkronisasi',
      `Data pengadaan dana Rp ${effectiveNominal.toLocaleString('id-ID')} berhasil dicatat dan dilaporkan untuk audit pusat BGN.`,
    );
  };

  const mitraDropdownOptions = [
    { label: 'Input Supplier / Non-Mitra Bebas', value: 'custom' },
    ...mitraList.map((m) => ({ label: `${m.nama} (${m.jenisProduk})`, value: m.id })),
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Summary Card */}
      <Card variant="accent" style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="shield" size={16} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              TRANSPARANSI DANA & PENGADAAN MBG
            </Text>
          </View>
          <Pill label="Tersinkron ke Pusat" tone="success" />
        </View>

        <View style={{ gap: 2, marginTop: 4 }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>Sisa Saldo Kas Operasional SPPG</Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: sisaSaldo >= 0 ? colors.success : colors.danger }}>
            Rp {sisaSaldo.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Alokasi Diterima (Pusat)</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.success }}>
              + Rp {totalPenerimaan.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Belanja Bahan & Aset</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.danger }}>
              - Rp {totalPengeluaran.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Action Button for Kepala SPPG */}
      {!permissions.isViewOnly && (
        <PrimaryButton
          label="+ Input Pembelian Bahan / Pengadaan Baru"
          icon="shopping-cart"
          onPress={() => setShowModal(true)}
        />
      )}

      {/* Filter Options */}
      <SectionTitle
        action={
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
            {filteredLogs.length} Data Transaksi
          </Text>
        }
      >
        Daftar Belanja & Alokasi Dana
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

      {/* Transaction Log Feed */}
      <View style={{ gap: spacing.sm }}>
        {filteredLogs.map((log) => {
          const isPenerimaan = log.jenis === 'penerimaan';
          const hasItems = !!log.items && log.items.length > 0;

          return (
            <Card key={log.id} style={{ gap: 8 }} onPress={() => setSelectedLogDetail(log)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isPenerimaan ? colors.successBg : colors.dangerBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather
                      name={isPenerimaan ? 'arrow-down-left' : 'shopping-bag'}
                      size={18}
                      color={isPenerimaan ? colors.success : colors.danger}
                      strokeWidth={iconStrokeWidth}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                      {log.keterangan}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {log.tanggal} • {log.id}
                    </Text>
                  </View>
                </View>

                <Pill label={KATEGORI_LABEL[log.kategori]} tone={KATEGORI_TONE[log.kategori]} />
              </View>

              {/* Supplier & Invoice Info */}
              {log.namaSupplier && (
                <View style={[styles.supplierTagRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                  <Feather name="truck" size={13} color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    Supplier: <Text style={{ fontWeight: '800', color: colors.primary }}>{log.namaSupplier}</Text>
                  </Text>
                  {log.noInvoice && (
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>#{log.noInvoice}</Text>
                  )}
                </View>
              )}

              {/* Itemized Purchase Preview Box */}
              {hasItems && (
                <View style={[styles.itemsBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.textMuted, marginBottom: 2 }}>
                    RINCIAN BARANG PEMBELIAN ({log.items!.length} ITEM):
                  </Text>
                  {log.items!.map((it, idx) => (
                    <View key={idx} style={styles.itemPreviewRow}>
                      <Text style={{ fontSize: 11, color: colors.text, flex: 1 }} numberOfLines={1}>
                        • {it.namaBarang} ({it.jumlah} {it.satuan})
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                        Rp {it.totalHarga.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Footer Total & Action */}
              <View style={styles.cardFooter}>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                  PIC: {log.dibuatOleh}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: '900',
                    color: isPenerimaan ? colors.success : colors.danger,
                  }}
                >
                  {isPenerimaan ? '+' : '-'} Rp {log.nominal.toLocaleString('id-ID')}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Modal Input Procurement / Belanja Baru */}
      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Input Pembelian & Pengadaan Bahan">
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
              { label: 'Pengeluaran Belanja / Pengadaan (-)', value: 'pengeluaran' },
              { label: 'Penerimaan Alokasi Dana dari Pusat (+)', value: 'penerimaan' },
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
              { label: 'Peralatan & Ompreng', value: 'peralatan_dapur' },
              { label: 'Kebersihan & APD', value: 'kebersihan_apd' },
              { label: 'Gaji & Insentif Staf', value: 'gaji_insentif' },
              { label: 'Alokasi Pusat / BGN', value: 'alokasi_pusat' },
              { label: 'Lainnya', value: 'lainnya' },
            ]}
            onSelect={(val) => setKategori(val as any)}
            icon="folder"
          />

          {/* Supplier Info */}
          {jenis === 'pengeluaran' && (
            <>
              <DropdownPicker
                label="Mitra Pemasok / Supplier"
                value={selectedMitraId}
                options={mitraDropdownOptions}
                onSelect={setSelectedMitraId}
                icon="truck"
              />

              {selectedMitraId === 'custom' && (
                <Input
                  label="Nama Supplier / Toko"
                  icon="briefcase"
                  value={customSupplier}
                  onChangeText={setCustomSupplier}
                  placeholder="Contoh: Toko Beras Sumber Rezeki / Pasar Induk"
                />
              )}

              <Input
                label="Nomor Invoice / Nota Fisik"
                icon="file"
                value={noInvoice}
                onChangeText={setNoInvoice}
                placeholder="Contoh: INV/2026/08/8892"
              />
            </>
          )}

          <Input
            label="Keterangan Ringkas"
            icon="file-text"
            value={keterangan}
            onChangeText={setKeterangan}
            placeholder="Contoh: Pembelian Beras & Daging Ayam Pasokan Minggu ke-2"
            multiline
          />

          {/* Itemized Purchase Rows */}
          {jenis === 'pengeluaran' && (
            <View style={{ gap: 8, padding: 10, backgroundColor: colors.background, borderRadius: radius.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  Rincian Item Barang / Bahan yang Dibeli
                </Text>
                <Pressable onPress={handleAddItemRow} hitSlop={6}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>+ Tambah Item</Text>
                </Pressable>
              </View>

              {itemRows.map((row, idx) => (
                <View key={row.id} style={[styles.itemFormCard, { borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Item #{idx + 1}</Text>
                    {itemRows.length > 1 && (
                      <Pressable onPress={() => handleRemoveItemRow(row.id)} hitSlop={6}>
                        <Feather name="trash-2" size={14} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>

                  <Input
                    label="Nama Bahan / Barang"
                    value={row.namaBarang}
                    onChangeText={(val) => handleUpdateItemRow(row.id, 'namaBarang', val)}
                    placeholder="Contoh: Daging Ayam Broiler"
                  />

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Jumlah (Qty)"
                        value={row.jumlah}
                        onChangeText={(val) => handleUpdateItemRow(row.id, 'jumlah', val)}
                        placeholder="500"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ width: 80 }}>
                      <Input
                        label="Satuan"
                        value={row.satuan}
                        onChangeText={(val) => handleUpdateItemRow(row.id, 'satuan', val)}
                        placeholder="kg/sak"
                      />
                    </View>
                  </View>

                  <Input
                    label="Harga per Satuan (Rp)"
                    value={row.hargaSatuan}
                    onChangeText={(val) => handleUpdateItemRow(row.id, 'hargaSatuan', val)}
                    placeholder="38000"
                    keyboardType="numeric"
                  />
                </View>
              ))}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Kalkulasi Barang:</Text>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.danger }}>
                  Rp {calculatedItemsTotal.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          )}

          {/* Lump sum nominal fallback */}
          {calculatedItemsTotal === 0 && (
            <Input
              label="Nominal Total Transaksi (Rp)"
              icon="dollar-sign"
              value={nominalStr}
              onChangeText={setNominalStr}
              placeholder="Contoh: 15000000"
              keyboardType="number-pad"
            />
          )}

          {/* Foto Bukti Nota */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Foto Nota / Invoice Fisik</Text>
            <PrimaryButton
              label={fotoNotaUri ? 'Foto Nota Terlampir (Ambil Ulang)' : 'Ambil Foto Nota Pembelian'}
              icon="camera"
              variant="secondary"
              onPress={handleAttachPhoto}
            />
          </View>

          <PrimaryButton
            label={`Simpan Transaksi (Rp ${effectiveNominal.toLocaleString('id-ID')})`}
            icon="check-circle"
            onPress={handleSave}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  summaryDivider: { height: 1, marginVertical: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  supplierTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  itemsBox: {
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  itemPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemFormCard: {
    padding: 10,
    borderWidth: 1,
    gap: 8,
  },
});

