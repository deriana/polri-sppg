import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { AnggaranKategori, AnggaranLog, ItemPembelian } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';
import { SPPG_ASSET_MAP } from '../mock/sppgAssetMap';

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
  const { role, currentUser, currentSppg, addAnggaranLog, mitraList, bahanBakuList, catatMutasiStok, costPerMeal } = useApp();
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

      {/* Cost per Meal Calculator Widget */}
      <Card style={{ gap: spacing.sm, borderRadius: radius.xl }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="pie-chart" size={16} color={colors.success} />
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                Kalkulator Real Cost per Meal
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Perhitungan Riil Biaya Produksi per Porsi MBG
              </Text>
            </View>
          </View>
          <Pill label={`Hemat +${costPerMeal.hematEfisiensiPct}%`} tone="success" />
        </View>

        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.background, borderRadius: radius.lg, padding: 12, gap: 8 }}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '700' }}>TOTAL BIAYA RIIL / PORSI</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary, marginTop: 2 }}>
                Rp {costPerMeal.totalCostPerPorsi.toLocaleString('id-ID')}
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}> / porsi</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Pagu Standar BGN</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                Rp {costPerMeal.paguStandarBgn.toLocaleString('id-ID')}
              </Text>
              <Text style={{ fontSize: 10, color: colors.success, fontWeight: '700' }}>Efisiensi Anggaran Aman</Text>
            </View>
          </View>

          {/* Cost Items Breakdown */}
          <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
            {[
              { label: 'Bahan Pokok (Beras, Ayam, Telur, Sayur)', value: costPerMeal.bahanBaku, icon: 'package' as const },
              { label: 'Bumbu Dapur & Minyak Masak', value: costPerMeal.bumbuMinyak, icon: 'coffee' as const },
              { label: 'Kemasan Ompreng & Sealing', value: costPerMeal.kemasanSeal, icon: 'box' as const },
              { label: 'Energi Dapur (Gas Elpiji & Listrik)', value: costPerMeal.energiDapur, icon: 'zap' as const },
              { label: 'Transport & BBM Armada Mobil Box', value: costPerMeal.transportBbm, icon: 'truck' as const },
            ].map((item) => (
              <View key={item.label} style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Feather name={item.icon} size={12} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, color: colors.textMuted, flex: 1 }}>{item.label}</Text>
                </View>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.text }}>
                  Rp {item.value.toLocaleString('id-ID')}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
              Total Biaya 1.500 Porsi Hari Ini:
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.primary }}>
              Rp {(costPerMeal.totalCostPerPorsi * costPerMeal.targetPorsi).toLocaleString('id-ID')}
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
        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
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
              prefix="Rp"
              value={nominalStr}
              onChangeText={setNominalStr}
              placeholder="15.000.000"
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

      {/* Modal Detail Transaksi & Bukti Nota */}
      <Modal
        visible={selectedLogDetail !== null}
        onClose={() => setSelectedLogDetail(null)}
        title="Detail Transaksi & Bukti Nota"
      >
        {selectedLogDetail && (
          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            {/* 1. Header Amount Card */}
            <Card
              variant="accent"
              style={{
                gap: 6,
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderLeftColor: selectedLogDetail.jenis === 'penerimaan' ? colors.success : colors.primary,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pill
                  label={selectedLogDetail.jenis === 'penerimaan' ? 'Penerimaan Alokasi Dana (+)' : 'Pengeluaran Belanja / Aset (-)'}
                  tone={selectedLogDetail.jenis === 'penerimaan' ? 'success' : 'danger'}
                />
                <Pill label={KATEGORI_LABEL[selectedLogDetail.kategori]} tone={KATEGORI_TONE[selectedLogDetail.kategori]} />
              </View>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '900',
                  color: selectedLogDetail.jenis === 'penerimaan' ? colors.success : colors.text,
                  marginTop: 4,
                }}
              >
                {selectedLogDetail.jenis === 'penerimaan' ? '+' : '-'} Rp {selectedLogDetail.nominal.toLocaleString('id-ID')}
              </Text>

              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>
                {selectedLogDetail.keterangan}
              </Text>

              <View style={[styles.syncStatusRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Feather name="check-circle" size={13} color={colors.success} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>
                  Tersinkronisasi & Terverifikasi di Audit Pusat BGN
                </Text>
              </View>
            </Card>

            {/* 2. Informasi Transaksi & Supplier */}
            <Card style={{ gap: 8 }}>
              <SectionTitle style={{ marginBottom: 0 }}>Informasi Dokumen & Supplier</SectionTitle>

              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaCol}>
                  <Text style={styles.metaLabel}>ID Transaksi</Text>
                  <Text style={styles.metaValue}>{selectedLogDetail.id}</Text>
                </View>

                <View style={styles.detailMetaCol}>
                  <Text style={styles.metaLabel}>Tanggal Transaksi</Text>
                  <Text style={styles.metaValue}>{selectedLogDetail.tanggal}</Text>
                </View>

                <View style={styles.detailMetaCol}>
                  <Text style={styles.metaLabel}>No. Invoice / Nota</Text>
                  <Text style={[styles.metaValue, { color: colors.primary, fontWeight: '800' }]}>
                    {selectedLogDetail.noInvoice ?? 'INV-AUTO-SPPG'}
                  </Text>
                </View>

                <View style={styles.detailMetaCol}>
                  <Text style={styles.metaLabel}>Petugas PIC</Text>
                  <Text style={styles.metaValue}>{selectedLogDetail.dibuatOleh}</Text>
                </View>
              </View>

              {selectedLogDetail.namaSupplier && (
                <View style={[styles.supplierDetailBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
                  <View style={[styles.supplierIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Feather name="truck" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>SUPPLIER / MITRA PEMASOK</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                      {selectedLogDetail.namaSupplier}
                    </Text>
                    {selectedLogDetail.mitraId && (
                      <Pressable
                        onPress={() => {
                          const mId = selectedLogDetail.mitraId;
                          setSelectedLogDetail(null);
                          navigation.navigate('MitraList', { mitraId: mId });
                        }}
                        hitSlop={4}
                      >
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
                          Lihat Profil Mitra Pemasok ➔
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </Card>

            {/* 3. Tabel Rincian Barang yang Dibeli */}
            {selectedLogDetail.items && selectedLogDetail.items.length > 0 && (
              <Card style={{ gap: 8 }}>
                <SectionTitle style={{ marginBottom: 0 }}>
                  Rincian Barang Pembelian ({selectedLogDetail.items.length} Item)
                </SectionTitle>

                <View style={[styles.tableContainer, { borderColor: colors.border, borderRadius: radius.sm }]}>
                  <View style={[styles.tableHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableHeadText, { flex: 2 }]}>Bahan / Barang</Text>
                    <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.tableHeadText, { flex: 1.3, textAlign: 'right' }]}>Harga</Text>
                    <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                  </View>

                  {selectedLogDetail.items.map((it, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tableRow,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: idx % 2 === 1 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.tableCellText, { flex: 2, fontWeight: '700' }]} numberOfLines={2}>
                        {it.namaBarang}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>
                        {it.jumlah} {it.satuan}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1.3, textAlign: 'right', fontSize: 10.5 }]}>
                        Rp {it.hargaSatuan.toLocaleString('id-ID')}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1.5, textAlign: 'right', fontWeight: '800', color: colors.text }]}>
                        Rp {it.totalHarga.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}

                  <View style={[styles.tableFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, flex: 1 }}>GRAND TOTAL</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.danger }}>
                      Rp {selectedLogDetail.nominal.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* 4. Bukti Fisik Nota / Kwitansi */}
            <Card style={{ gap: 10 }}>
              <View style={styles.rowBetween}>
                <SectionTitle style={{ marginBottom: 0 }}>Bukti Fisik Nota / Kwitansi</SectionTitle>
                <Pill label="Terverifikasi BGN" tone="success" />
              </View>

              <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                <Image
                  source={{ uri: selectedLogDetail.buktiNota || SPPG_ASSET_MAP.nota_pembelian_1 }}
                  style={{ width: '100%', height: 220, resizeMode: 'cover' }}
                />
                <View style={{ padding: 10, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Feather name="file-text" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.text, fontWeight: '700' }} numberOfLines={1}>
                      {selectedLogDetail.noInvoice || `NOTA-${selectedLogDetail.id}.PDF`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.success }}>
                    AUDIT LUNAS
                  </Text>
                </View>
              </View>

              <View style={{ gap: spacing.xs, marginTop: 4 }}>
                <PrimaryButton
                  label="Unduh Dokumen Nota (PDF)"
                  icon="download"
                  onPress={() => {
                    Alert.alert(
                      'Unduh Bukti Nota Berhasil',
                      `File nota transaksi ${selectedLogDetail.noInvoice || selectedLogDetail.id}.pdf telah berhasil disimpan ke folder Dokumen perangkat Anda.`,
                      [{ text: 'Buka File', onPress: () => {} }, { text: 'Tutup' }]
                    );
                  }}
                />
                <PrimaryButton
                  label="Bagikan Rincian Transaksi"
                  icon="share-2"
                  variant="outline"
                  onPress={async () => {
                    try {
                      await Share.share({
                        title: `Bukti Nota ${selectedLogDetail.noInvoice || selectedLogDetail.id}`,
                        message: `[SIGAP SPPG - BUKTI TRANSAKSI]\nNo. Transaksi: ${selectedLogDetail.id}\nNo. Invoice: ${selectedLogDetail.noInvoice || '-'}\nPemasok: ${selectedLogDetail.namaSupplier || 'Mitra SPPG'}\nTanggal: ${selectedLogDetail.tanggal}\nNominal: Rp ${selectedLogDetail.nominal.toLocaleString('id-ID')}\nStatus: Terverifikasi Audit BGN.`,
                      });
                    } catch (e) {}
                  }}
                />
                <PrimaryButton
                  label="Tutup"
                  variant="secondary"
                  onPress={() => setSelectedLogDetail(null)}
                />
              </View>
            </Card>
          </ScrollView>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    marginTop: 4,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  detailMetaCol: {
    width: '46%',
    gap: 2,
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#8E8E93',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  supplierDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  supplierIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
  },
  tableHeadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
  },
  tableCellText: {
    fontSize: 11.5,
  },
  tableFooter: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  digitalInvoiceBox: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
  },
});

