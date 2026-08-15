import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  Card,
  DropdownPicker,
  EmptyState,
  Input,
  Modal,
  Pill,
  PrimaryButton,
  SectionTitle,
  Stepper,
} from '../components/ui';
import { useScopedData } from '../hooks';
import { AnggaranKategori, AnggaranLog, ItemPembelian, PermintaanBahan } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { SPPG_ASSET_MAP } from '../mock/sppgAssetMap';
import { pickImage } from '../utils/pickImage';

const STATUS_PERMINTAAN_LABEL: Record<PermintaanBahan['status'], string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
};

import { KATEGORI_ANGGARAN_OPTIONS as KATEGORI_OPTIONS } from '../mock/additionalFeatures';

interface FormItemRow {
  id: string;
  namaBarang: string;
  jumlah: string;
  satuan: string;
  hargaSatuan: string;
}

export default function PengadaanBahanScreen({ route, navigation }: any) {
  const {
    role,
    currentUser,
    currentSppg,
    addAnggaranLog,
    bahanBakuList,
    mitraList,
    permintaanBahanList,
    ajukanPermintaanBahan,
    updatePermintaanStatus,
  } = useApp();

  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();
  const { anggaranInScope, sppgInScope } = useScopedData();

  // Tab State: 'beli' | 'ajuin' | 'terima'
  const [activeTab, setActiveTab] = useState<'beli' | 'ajuin' | 'terima'>(
    route?.params?.initialTab ?? 'beli',
  );

  // ==========================================
  // TAB 1: BELI BAHAN MANDIRI (ANGGARAN) STATE
  // ==========================================
  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<AnggaranLog | null>(null);

  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState<AnggaranKategori>('bahan_baku');
  const [mitraId, setMitraId] = useState<string>('custom');
  const [namaSupplierManual, setNamaSupplierManual] = useState('');
  const [noInvoice, setNoInvoice] = useState('');
  const [fotoNota, setFotoNota] = useState<string | null>(null);

  // Rincian Item Barang Belanja
  const [itemRows, setItemRows] = useState<FormItemRow[]>([
    { id: '1', namaBarang: '', jumlah: '', satuan: 'kg', hargaSatuan: '' },
  ]);

  const supplierOptions = useMemo(() => {
    const list = mitraList.map((m) => ({ label: `${m.nama} (${m.jenisProduk})`, value: m.id }));
    return [{ label: 'Input Toko Pasar Bebas / Lainnya', value: 'custom' }, ...list];
  }, [mitraList]);

  const totalBelanjaKalkulasi = useMemo(() => {
    return itemRows.reduce((acc, curr) => {
      const q = parseFloat(curr.jumlah) || 0;
      const p = parseFloat(curr.hargaSatuan) || 0;
      return acc + q * p;
    }, 0);
  }, [itemRows]);

  const handleItemChange = (index: number, field: keyof FormItemRow, val: string) => {
    setItemRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddItem = () => {
    setItemRows((prev) => [
      ...prev,
      { id: String(Date.now()), namaBarang: '', jumlah: '', satuan: 'kg', hargaSatuan: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itemRows.length <= 1) return;
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const pickReceiptImage = async () => {
    const uri = await pickImage('library');
    if (uri) {
      setFotoNota(uri);
    }
  };

  const handleDownloadNota = (log: AnggaranLog) => {
    Alert.alert(
      'Unduh Bukti Nota Berhasil',
      `File nota transaksi ${log.noInvoice || log.id}.pdf telah berhasil disimpan ke folder Dokumen perangkat Anda.`,
      [{ text: 'Buka File', onPress: () => {} }, { text: 'Tutup' }]
    );
  };

  const handleShareNota = async (log: AnggaranLog) => {
    try {
      await Share.share({
        title: `Bukti Nota ${log.noInvoice || log.id}`,
        message: `[SIGAP SPPG - BUKTI NOTA BELANJA]\nNomor Transaksi: ${log.id}\nNo. Invoice: ${log.noInvoice || '-'}\nSupplier: ${log.namaSupplier || 'Mitra Pemasok'}\nTanggal: ${log.tanggal}\nTotal Nominal: Rp ${log.nominal.toLocaleString('id-ID')}\nStatus: Terverifikasi Audit Pusat BGN.`,
      });
    } catch (e) {}
  };

  const handleSavePurchase = () => {
    if (!keterangan.trim()) {
      Alert.alert('Data Belum Lengkap', 'Masukkan peruntukan belanja / judul transaksi.');
      return;
    }
    if (totalBelanjaKalkulasi <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Masukkan item belanja, kuantitas, dan harga satuan dengan benar.');
      return;
    }

    const selectedMitraObj = mitraId !== 'custom' ? mitraList.find((m) => m.id === mitraId) : null;
    const finalSupplier = selectedMitraObj ? selectedMitraObj.nama : namaSupplierManual.trim() || 'Supplier Pasar';

    const compiledItems: ItemPembelian[] = itemRows
      .filter((r) => r.namaBarang.trim().length > 0)
      .map((r) => {
        const j = parseFloat(r.jumlah) || 0;
        const h = parseFloat(r.hargaSatuan) || 0;
        return {
          namaBarang: r.namaBarang.trim(),
          jumlah: j,
          satuan: r.satuan.trim() || 'kg',
          hargaSatuan: h,
          totalHarga: j * h,
        };
      });

    addAnggaranLog({
      sppgId: currentSppg?.id ?? 'SPPG-001',
      jenis: 'pengeluaran',
      kategori,
      nominal: totalBelanjaKalkulasi,
      keterangan: keterangan.trim(),
      dibuatOleh: currentUser?.nama ?? 'Kepala SPPG',
      noInvoice: noInvoice.trim() || `INV-${Date.now().toString().slice(-6)}`,
      mitraId: mitraId !== 'custom' ? mitraId : null,
      namaSupplier: finalSupplier,
      buktiNota: fotoNota ?? SPPG_ASSET_MAP.nota_pembelian_1,
      items: compiledItems,
    });

    setIsBuyModalVisible(false);
    // Reset Form
    setKeterangan('');
    setMitraId('custom');
    setNamaSupplierManual('');
    setNoInvoice('');
    setFotoNota(null);
    setItemRows([{ id: '1', namaBarang: '', jumlah: '', satuan: 'kg', hargaSatuan: '' }]);
    Alert.alert('Pembelian Berhasil Dicatat', 'Data belanja bahan dan nota tersimpan untuk audit Pusat BGN.');
  };

  const totalPenerimaan = anggaranInScope
    .filter((a) => a.jenis === 'penerimaan')
    .reduce((sum, a) => sum + a.nominal, 0);

  const totalPengeluaran = anggaranInScope
    .filter((a) => a.jenis === 'pengeluaran')
    .reduce((sum, a) => sum + a.nominal, 0);

  const sisaSaldo = totalPenerimaan - totalPengeluaran;

  // ==========================================
  // TAB 2: AJUKAN KE PUSAT (REPLENISHMENT) STATE
  // ==========================================
  const bahanOptions = useMemo(
    () =>
      bahanBakuList
        .filter((b) => b.sppgId === currentSppg?.id)
        .map((b) => ({ label: `${b.nama} (${b.satuan})`, value: b.id })),
    [bahanBakuList, currentSppg],
  );

  const [ajuBahanId, setAjuBahanId] = useState(bahanOptions[0]?.value ?? '');
  const [ajuJumlah, setAjuJumlah] = useState(25);
  const [ajuCatatan, setAjuCatatan] = useState('');

  const selectedBahanForAju = bahanBakuList.find((b) => b.id === ajuBahanId);
  const goesToPusat = !!selectedBahanForAju && !selectedBahanForAju.mitraId;

  const handleKirimPengajuanPusat = () => {
    if (!ajuBahanId || !currentSppg) return;
    ajukanPermintaanBahan({
      sppgId: currentSppg.id,
      bahanId: ajuBahanId,
      jumlah: ajuJumlah,
      catatan: ajuCatatan.trim() || null,
    });
    setAjuCatatan('');
    Alert.alert(
      'Permintaan Terkirim',
      `Pengajuan pasokan ${selectedBahanForAju?.nama ?? 'Bahan'} (${ajuJumlah} ${selectedBahanForAju?.satuan ?? ''}) telah diteruskan ke ${goesToPusat ? 'BGN Pusat' : 'Mitra Rantai Pasok'}.`,
    );
  };

  // ==========================================
  // TAB 3: TERIMA & SCAN QR STATE
  // ==========================================
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [qrConfirmed, setQrConfirmed] = useState(false);

  const matchedPermintaan = scannedCode
    ? permintaanBahanList.find((p) => p.id.trim().toUpperCase() === scannedCode.trim().toUpperCase())
    : undefined;
  const matchedBahan = matchedPermintaan ? bahanBakuList.find((b) => b.id === matchedPermintaan.bahanId) : undefined;
  const matchedMitra = matchedBahan?.mitraId ? mitraList.find((m) => m.id === matchedBahan.mitraId) : undefined;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedCode) return;
    setScannedCode(data);
  };

  const handleScanSubmit = (code?: string) => {
    const target = code ?? manualCode;
    if (!target.trim()) return;
    setScannedCode(target.trim());
  };

  const handleConfirmInbound = () => {
    if (!matchedPermintaan) return;
    updatePermintaanStatus(matchedPermintaan.id, 'selesai');
    setQrConfirmed(true);
    Alert.alert(
      'Penerimaan Bahan Dikonfirmasi',
      `Surat jalan ${matchedPermintaan.id} (${matchedBahan?.nama ?? 'Bahan'}) sejumlah ${matchedPermintaan.jumlah} ${matchedBahan?.satuan ?? ''} berhasil diterima dan masuk ke inventaris gudang.`,
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Banner & Segment Tabs */}
      <View style={[styles.headerBanner, { backgroundColor: colors.primaryLight, borderRadius: radius.lg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="layers" size={20} color={colors.primary} />
          <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.primary }}>
            PUSAT PENGADAAN & LOGISTIK BAHAN
          </Text>
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.text }}>
          Kelola seluruh siklus bahan pokok dapur SPPG: belanja mandiri ber-nota, pengajuan pasokan ke pusat, dan scan penerimaan barang.
        </Text>

        {/* 3 Unified Tabs */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
          <Pressable
            onPress={() => setActiveTab('beli')}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'beli' ? colors.primary : 'transparent', borderRadius: radius.sm },
            ]}
          >
            <Feather name="shopping-cart" size={14} color={activeTab === 'beli' ? '#FFF' : colors.text} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'beli' ? '#FFF' : colors.text }}>
              1. Beli Bahan
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('ajuin')}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'ajuin' ? colors.primary : 'transparent', borderRadius: radius.sm },
            ]}
          >
            <Feather name="send" size={14} color={activeTab === 'ajuin' ? '#FFF' : colors.text} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'ajuin' ? '#FFF' : colors.text }}>
              2. Minta ke Pusat
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('terima')}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'terima' ? colors.primary : 'transparent', borderRadius: radius.sm },
            ]}
          >
            <Feather name="camera" size={14} color={activeTab === 'terima' ? '#FFF' : colors.text} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'terima' ? '#FFF' : colors.text }}>
              3. Scan Terima
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: BELANJA BAHAN MANDIRI & LOG ANGGARAN                               */}
      {/* ========================================================================= */}
      {activeTab === 'beli' && (
        <View style={{ gap: spacing.md }}>
          {/* Overview Saldo Belanja */}
          <Card style={{ gap: spacing.xs, borderColor: colors.primary, borderWidth: 1.5 }}>
            <View style={styles.rowBetween}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
                SALDO ANGGARAN OPERASIONAL SPPG
              </Text>
              <Pill label="Terverifikasi BGN" tone="success" />
            </View>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 28 }}>
              Rp {sisaSaldo.toLocaleString('id-ID')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              Alokasi Pusat: Rp {totalPenerimaan.toLocaleString('id-ID')} • Terpakai: Rp {totalPengeluaran.toLocaleString('id-ID')}
            </Text>
          </Card>

          <PrimaryButton
            label="+ Input Pembelian Bahan / Nota Baru"
            icon="plus-circle"
            onPress={() => setIsBuyModalVisible(true)}
          />

          {/* Riwayat Pembelian */}
          <SectionTitle
            action={
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {anggaranInScope.length} Transaksi Tercatat
              </Text>
            }
          >
            Riwayat Pembelian & Nota Masuk
          </SectionTitle>

          {anggaranInScope.length === 0 ? (
            <EmptyState icon="shopping-cart" title="Belum Ada Transaksi" body="Catat belanja bahan pokok pertama Anda dengan tombol di atas." />
          ) : (
            anggaranInScope.map((log) => (
              <Card key={log.id} onPress={() => setSelectedLogDetail(log)} style={{ gap: 8 }}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>{log.id} • {log.tanggal}</Text>
                  <Pill label={log.jenis === 'pengeluaran' ? 'Belanja (-)' : 'Alokasi (+)'} tone={log.jenis === 'pengeluaran' ? 'warning' : 'success'} />
                </View>

                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>{log.keterangan}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      Supplier: {log.namaSupplier ?? 'Supplier Pasar'} {log.noInvoice ? `• Inv: ${log.noInvoice}` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: log.jenis === 'pengeluaran' ? colors.danger : colors.success, fontWeight: '900', fontSize: fontSize.md }}>
                    {log.jenis === 'pengeluaran' ? '-' : '+'}Rp {log.nominal.toLocaleString('id-ID')}
                  </Text>
                </View>

                <View style={[styles.auditSealRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                  <Feather name="shield" size={12} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '700', flex: 1 }}>
                    Terverifikasi Audit Pusat BGN • Ketuk untuk lihat nota & rincian item
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AJUKAN PASOKAN BAHAN KE PUSAT BGN                                  */}
      {/* ========================================================================= */}
      {activeTab === 'ajuin' && (
        <View style={{ gap: spacing.md }}>
          <Card style={{ gap: spacing.md }}>
            <SectionTitle style={{ marginBottom: 0 }}>Form Pengajuan Kebutuhan Bahan</SectionTitle>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              Gunakan formulir ini untuk meminta pasokan bahan dari Pusat BGN / Rantai Pasok Utama.
            </Text>

            {bahanOptions.length === 0 ? (
              <EmptyState icon="package" title="Belum Ada Bahan Terdaftar" body="Daftarkan bahan baku pada unit SPPG ini terlebih dahulu." />
            ) : (
              <>
                <DropdownPicker
                  label="Pilih Bahan Baku yang Diminta"
                  icon="package"
                  value={ajuBahanId}
                  options={bahanOptions}
                  onSelect={setAjuBahanId}
                />

                <Stepper label="Jumlah Kebutuhan" value={ajuJumlah} onChange={setAjuJumlah} step={5} min={1} />

                <Input
                  label="Catatan Kebutuhan (Opsional)"
                  icon="edit-3"
                  value={ajuCatatan}
                  onChangeText={setAjuCatatan}
                  placeholder="Contoh: Kebutuhan mendesak menu ayam bakar hari Rabu"
                  multiline
                />

                {goesToPusat && (
                  <View style={[styles.infoBox, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
                    <Feather name="info" size={16} color={colors.primary} />
                    <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
                      Bahan ini disuplai langsung oleh BGN Pusat — permintaan diteruskan ke sistem logistik nasional.
                    </Text>
                  </View>
                )}

                <PrimaryButton
                  label={goesToPusat ? 'Ajukan Pasokan ke BGN Pusat' : 'Ajukan Permintaan Pasokan'}
                  icon="send"
                  onPress={handleKirimPengajuanPusat}
                />
              </>
            )}
          </Card>

          {/* Riwayat Permintaan ke Pusat */}
          <SectionTitle
            action={
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {permintaanBahanList.length} Pengajuan
              </Text>
            }
          >
            Riwayat Status Pengajuan ke Pusat
          </SectionTitle>

          {permintaanBahanList.map((p) => {
            const bhn = bahanBakuList.find((b) => b.id === p.bahanId);
            return (
              <Card
                key={p.id}
                style={{ gap: 6 }}
                onPress={() => navigation.navigate('PermintaanBahanDetail', { permintaanId: p.id })}
              >
                <View style={styles.rowBetween}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                    No. DO / Surat Jalan: {p.id}
                  </Text>
                  <Pill
                    label={STATUS_PERMINTAAN_LABEL[p.status]}
                    tone={p.status === 'selesai' ? 'success' : p.status === 'dikirim' ? 'warning' : 'neutral'}
                  />
                </View>

                <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                  {bhn ? bhn.nama : 'Bahan Baku'} — {p.jumlah} {bhn?.satuan ?? 'unit'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Tanggal: {p.tanggal} • Catatan: {p.catatan ?? 'Kebutuhan reguler dapur'}
                </Text>

                <View style={[styles.auditSealRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                  <Feather name="map-pin" size={12} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '700', flex: 1 }}>
                    Ketuk untuk lacak posisi pengiriman, QR surat jalan, & detail pemasok
                  </Text>
                  <Feather name="chevron-right" size={14} color={colors.primary} />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PENERIMAAN BARANG & SCAN QR (INBOUND)                              */}
      {/* ========================================================================= */}
      {activeTab === 'terima' && (
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <SectionTitle style={{ marginBottom: 0 }}>Pindai QR Penerimaan Barang / DO</SectionTitle>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
              Arahkan kamera ke QR Surat Jalan atau Invoice saat truk supplier / kiriman pusat tiba di dapur.
            </Text>
          </View>

          {/* Camera Scanner */}
          {!scannedCode && permission?.granted && (
            <View style={{ height: 240, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
            </View>
          )}

          {/* Simulasi Uji Cepat */}
          {!scannedCode && (
            <Card style={{ gap: spacing.sm }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                SIMULASI UJI QR CEPAT:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable
                  onPress={() => handleScanSubmit('PMB-002')}
                  style={[styles.demoChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Feather name="zap" size={13} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Pindai Cepat: PMB-002 (Ayam 25 kg)</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleScanSubmit('PMB-001')}
                  style={[styles.demoChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Feather name="zap" size={13} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Pindai Cepat: PMB-001 (Beras 40 kg)</Text>
                </Pressable>
              </View>

              <Input
                label="Atau masukkan No. Surat Jalan manual"
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Contoh: PMB-002"
              />
              <PrimaryButton label="Gunakan Kode Ini" icon="check" onPress={() => handleScanSubmit()} />
            </Card>
          )}

          {/* Hasil Scan & Konfirmasi Penerimaan */}
          {scannedCode && (
            <Card style={{ gap: spacing.md }}>
              <View style={styles.rowBetween}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>KODE DOKUMEN:</Text>
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: fontSize.md }}>{scannedCode}</Text>
                </View>
                {matchedPermintaan && (
                  <Pill
                    label={`Status: ${STATUS_PERMINTAAN_LABEL[matchedPermintaan.status]}`}
                    tone={matchedPermintaan.status === 'selesai' ? 'success' : 'warning'}
                  />
                )}
              </View>

              {matchedPermintaan ? (
                <View style={{ gap: 10 }}>
                  <View style={[styles.resultBox, { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                        <Feather name="package" size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                          {matchedBahan ? matchedBahan.nama : 'Bahan Baku Makanan'}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          Jumlah: <Text style={{ fontWeight: '800', color: colors.text }}>{matchedPermintaan.jumlah} {matchedBahan?.satuan ?? 'unit'}</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          Pemasok: {matchedMitra ? matchedMitra.nama : 'Gudang Pusat BGN'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {matchedPermintaan.status !== 'selesai' && !qrConfirmed ? (
                    <PrimaryButton
                      label="Konfirmasi Penerimaan Barang Masuk"
                      icon="check-circle"
                      onPress={handleConfirmInbound}
                    />
                  ) : (
                    <View style={[styles.infoBox, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                      <Feather name="check-circle" size={16} color={colors.success} />
                      <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                        Barang fisik telah diverifikasi dan stok gudang otomatis diperbarui.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.infoBox, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}>
                  <Feather name="alert-triangle" size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                    Kode tidak cocok dengan surat jalan pengiriman manapun.
                  </Text>
                </View>
              )}

              <PrimaryButton
                label="Pindai Ulang Dokumen Lain"
                icon="refresh-cw"
                variant="outline"
                onPress={() => {
                  setScannedCode(null);
                  setManualCode('');
                  setQrConfirmed(false);
                }}
              />
            </Card>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL INPUT PEMBELIAN BAHAN BARU (ITEMS + NOTA)                           */}
      {/* ========================================================================= */}
      <Modal
        visible={isBuyModalVisible}
        onClose={() => setIsBuyModalVisible(false)}
        title="Input Pembelian Bahan & Nota Baru"
      >
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: 24 }}>
          <Input
            label="Peruntukan Belanja / Judul Transaksi *"
            icon="file-text"
            value={keterangan}
            onChangeText={setKeterangan}
            placeholder="Contoh: Belanja Bahan Pokok Beras & Daging Minggu 1"
          />

          <DropdownPicker
            label="Kategori Anggaran"
            icon="grid"
            value={kategori}
            options={KATEGORI_OPTIONS}
            onSelect={(val) => setKategori(val as AnggaranKategori)}
          />

          <DropdownPicker
            label="Mitra Pemasok Resmi BGN"
            icon="briefcase"
            value={mitraId}
            options={supplierOptions}
            onSelect={setMitraId}
          />

          {mitraId === 'custom' && (
            <Input
              label="Nama Supplier / Toko Pasar Bebas"
              icon="shopping-bag"
              value={namaSupplierManual}
              onChangeText={setNamaSupplierManual}
              placeholder="Contoh: Toko Sayur Segar Pasar Induk"
            />
          )}

          <Input
            label="Nomor Nota / Invoice"
            icon="hash"
            value={noInvoice}
            onChangeText={setNoInvoice}
            placeholder="Contoh: INV/2026/08/099"
          />

          {/* Rincian Items Belanja */}
          <View style={{ gap: 8, marginTop: 4 }}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                RINCIAN ITEM BARANG YANG DIBELI:
              </Text>
              <Pressable onPress={handleAddItem} style={[styles.addItemBtn, { backgroundColor: colors.primaryLight }]}>
                <Feather name="plus" size={12} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>+ Tambah Item</Text>
              </Pressable>
            </View>

            {itemRows.map((item, idx) => {
              const q = parseFloat(item.jumlah) || 0;
              const p = parseFloat(item.hargaSatuan) || 0;
              const subtotal = q * p;

              return (
                <View key={item.id} style={[styles.itemRowCard, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Item #{idx + 1}</Text>
                    {itemRows.length > 1 && (
                      <Pressable onPress={() => handleRemoveItem(idx)}>
                        <Feather name="trash-2" size={14} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>

                  <Input
                    label="Nama Bahan"
                    value={item.namaBarang}
                    onChangeText={(val) => handleItemChange(idx, 'namaBarang', val)}
                    placeholder="Contoh: Beras Ramos Super"
                  />

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Jumlah"
                        value={item.jumlah}
                        onChangeText={(val) => handleItemChange(idx, 'jumlah', val)}
                        keyboardType="numeric"
                        placeholder="10"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Satuan"
                        value={item.satuan}
                        onChangeText={(val) => handleItemChange(idx, 'satuan', val)}
                        placeholder="kg / sak / ltr"
                      />
                    </View>
                  </View>

                  <Input
                    label="Harga Satuan (Rp)"
                    value={item.hargaSatuan}
                    onChangeText={(val) => handleItemChange(idx, 'hargaSatuan', val)}
                    keyboardType="numeric"
                    placeholder="50000"
                  />

                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Subtotal Item:</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.primary }}>
                      Rp {subtotal.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Total Ringkasan */}
          <View style={[styles.totalBar, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>TOTAL BELANJA:</Text>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.primary }}>
              Rp {totalBelanjaKalkulasi.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Upload Foto Bukti Nota */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
              Foto Bukti Nota / Kwitansi Fisik
            </Text>
            {fotoNota ? (
              <View style={{ gap: 6 }}>
                <Image source={{ uri: fotoNota }} style={[styles.notaPreviewImg, { borderRadius: radius.md }]} />
                <PrimaryButton label="Ganti Foto Nota" icon="camera" variant="outline" onPress={pickReceiptImage} />
              </View>
            ) : (
              <PrimaryButton label="Ambil Foto Nota Pembelian" icon="camera" variant="secondary" onPress={pickReceiptImage} />
            )}
          </View>

          <PrimaryButton label="Simpan Belanja & Kirim Laporan ke Pusat" icon="check" onPress={handleSavePurchase} />
        </ScrollView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL DETAIL TRANSAKSI & PREVIEW NOTA                                     */}
      {/* ========================================================================= */}
      {selectedLogDetail && (
        <Modal
          visible={selectedLogDetail !== null}
          onClose={() => setSelectedLogDetail(null)}
          title={`Detail Transaksi ${selectedLogDetail.id}`}
        >
          <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: 24 }}>
            {/* Nominal Banner */}
            <View style={[styles.detailHero, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>NOMINAL TRANSAKSI</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: selectedLogDetail.jenis === 'pengeluaran' ? colors.danger : colors.success }}>
                {selectedLogDetail.jenis === 'pengeluaran' ? '-' : '+'}Rp {selectedLogDetail.nominal.toLocaleString('id-ID')}
              </Text>
              <Pill label="Terverifikasi Audit Pusat BGN" tone="success" />
            </View>

            {/* Info Dokumen */}
            <View style={[styles.infoCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{selectedLogDetail.keterangan}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Tanggal: {selectedLogDetail.tanggal}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>No. Invoice: {selectedLogDetail.noInvoice ?? '-'}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Pemasok: {selectedLogDetail.namaSupplier ?? '-'}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Dicatat Oleh: {selectedLogDetail.dibuatOleh}</Text>
            </View>

            {/* Tabel Rincian Item */}
            {selectedLogDetail.items && selectedLogDetail.items.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Rincian Barang yang Dibeli:</Text>
                {selectedLogDetail.items.map((it, idx) => (
                  <View key={idx} style={[styles.itemSummaryRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>{it.namaBarang}</Text>
                      <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                        {it.jumlah} {it.satuan} @ Rp {it.hargaSatuan.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
                      Rp {it.totalHarga.toLocaleString('id-ID')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bukti Fisik Nota */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <View style={styles.rowBetween}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  Bukti Fisik Nota Pembelian:
                </Text>
                <Pill label="Dokumen Resmi" tone="primary" />
              </View>
              
              <View style={[styles.receiptCardWrapper, { borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.md }]}>
                <Image
                  source={{ uri: selectedLogDetail.buktiNota || SPPG_ASSET_MAP.nota_pembelian_1 }}
                  style={[styles.notaReceiptImg, { borderRadius: radius.md }]}
                />
              </View>

              <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                <PrimaryButton
                  label="Unduh Bukti Nota (PDF/Gambar)"
                  icon="download"
                  onPress={() => handleDownloadNota(selectedLogDetail)}
                />
                <PrimaryButton
                  label="Bagikan Rincian Nota Transaksi"
                  icon="share-2"
                  variant="outline"
                  onPress={() => handleShareNota(selectedLogDetail)}
                />
                <PrimaryButton
                  label="Tutup"
                  variant="secondary"
                  onPress={() => setSelectedLogDetail(null)}
                />
              </View>
            </View>
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  headerBanner: { padding: 14, gap: 10 },
  segmentContainer: { flexDirection: 'row', padding: 4, gap: 4 },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auditSealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  resultBox: { padding: 12, borderWidth: 1, gap: 6 },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemRowCard: { padding: 10, borderWidth: 1, gap: 8, marginBottom: 6 },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  notaPreviewImg: { width: '100%', height: 160, resizeMode: 'cover' },
  detailHero: { padding: 12, alignItems: 'center', gap: 4 },
  infoCard: { padding: 10, borderWidth: 1, gap: 4 },
  itemSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  notaReceiptImg: { width: '100%', height: 220, resizeMode: 'cover' },
  receiptCardWrapper: { borderWidth: 1, overflow: 'hidden', padding: 4 },
});
