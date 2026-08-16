import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  SecondaryButton,
  SectionTitle,
  Stepper,
} from '../components/ui';
import { useScopedData } from '../hooks';
import { JalurPengadaanAset, PengajuanAset, PeralatanKategori, StatusPengajuanAset } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage } from '../utils/pickImage';
import {
  KATEGORI_ASET_OPTIONS,
  SATUAN_OPTIONS,
  URGENSI_OPTIONS,
} from '../mock/peralatan';

// Batas nominal belanja mandiri satu transaksi. Di atas ini unit tidak boleh
// memotong anggarannya sendiri — pengadaan wajib lewat jalur BGN Pusat.
const PLAFON_BELANJA_MANDIRI = 50000000;

const STATUS_LABEL: Record<StatusPengajuanAset, string> = {
  diajukan: 'Menunggu Keputusan Pusat',
  disetujui: 'Disetujui Pusat',
  ditolak: 'Ditolak Pusat',
  dikirim: 'Barang Dikirim Pusat',
  diterima: 'Diterima & Tercatat Aset',
};

const STATUS_TONE: Record<StatusPengajuanAset, 'success' | 'warning' | 'danger' | 'info'> = {
  diajukan: 'warning',
  disetujui: 'info',
  ditolak: 'danger',
  dikirim: 'info',
  diterima: 'success',
};

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function PengadaanPeralatanScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, pengajuanAsetList, ajukanAset, updateStatusPengajuanAset } = useApp();
  const { anggaranInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const [jalur, setJalur] = useState<JalurPengadaanAset>('mandiri');
  const [formVisible, setFormVisible] = useState(false);
  const [detail, setDetail] = useState<PengajuanAset | null>(null);

  const [namaAset, setNamaAset] = useState('');
  const [kategori, setKategori] = useState<PeralatanKategori>('alat_masak');
  const [jumlah, setJumlah] = useState(1);
  const [satuan, setSatuan] = useState('unit');
  const [hargaSatuan, setHargaSatuan] = useState('');
  const [alasan, setAlasan] = useState('');
  const [urgensi, setUrgensi] = useState<PengajuanAset['urgensi']>('rutin');
  const [namaSupplier, setNamaSupplier] = useState('');
  const [noInvoice, setNoInvoice] = useState('');
  const [fotoNota, setFotoNota] = useState<string | null>(null);

  const canManage = !!role && !ROLE_PERMISSIONS[role].isViewOnly;

  const saldo = useMemo(() => {
    const masuk = anggaranInScope.filter((a) => a.jenis === 'penerimaan').reduce((s, a) => s + a.nominal, 0);
    const keluar = anggaranInScope.filter((a) => a.jenis === 'pengeluaran').reduce((s, a) => s + a.nominal, 0);
    return { masuk, keluar, sisa: masuk - keluar };
  }, [anggaranInScope]);

  const scoped = useMemo(
    () => pengajuanAsetList.filter((p) => !currentSppg || p.sppgId === currentSppg.id),
    [pengajuanAsetList, currentSppg],
  );
  const riwayat = useMemo(() => scoped.filter((p) => p.jalur === jalur), [scoped, jalur]);

  const totalHarga = (parseFloat(hargaSatuan) || 0) * jumlah;
  const lewatPlafon = jalur === 'mandiri' && totalHarga > PLAFON_BELANJA_MANDIRI;
  const saldoTidakCukup = jalur === 'mandiri' && totalHarga > saldo.sisa;

  const resetForm = () => {
    setNamaAset('');
    setJumlah(1);
    setSatuan('unit');
    setHargaSatuan('');
    setAlasan('');
    setUrgensi('rutin');
    setNamaSupplier('');
    setNoInvoice('');
    setFotoNota(null);
  };

  const handleSubmit = () => {
    if (!namaAset.trim()) {
      Alert.alert('Data Belum Lengkap', 'Isi nama peralatan / aset yang diadakan.');
      return;
    }
    if (totalHarga <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Isi harga satuan peralatan dengan benar.');
      return;
    }
    if (!alasan.trim()) {
      Alert.alert('Alasan Wajib Diisi', 'Jelaskan kebutuhan pengadaan ini untuk keperluan audit.');
      return;
    }
    if (lewatPlafon) {
      Alert.alert(
        'Melebihi Plafon Belanja Mandiri',
        `Nominal ${rupiah(totalHarga)} melewati plafon ${rupiah(PLAFON_BELANJA_MANDIRI)} per transaksi. Ajukan lewat jalur BGN Pusat.`,
      );
      return;
    }
    if (saldoTidakCukup) {
      Alert.alert(
        'Saldo Anggaran Tidak Cukup',
        `Sisa saldo unit ${rupiah(saldo.sisa)}, sedangkan pengadaan ini butuh ${rupiah(totalHarga)}. Ajukan lewat jalur BGN Pusat.`,
      );
      return;
    }

    ajukanAset({
      sppgId: currentSppg?.id ?? 'SPPG-001',
      jalur,
      namaAset: namaAset.trim(),
      kategori,
      jumlah,
      satuan: satuan || 'unit',
      hargaSatuan: parseFloat(hargaSatuan) || 0,
      totalHarga,
      alasan: alasan.trim(),
      urgensi,
      diajukanOleh: currentUser?.nama ?? 'Kepala SPPG',
      namaSupplier: jalur === 'mandiri' ? namaSupplier.trim() || 'Supplier Umum' : undefined,
      noInvoice: jalur === 'mandiri' ? noInvoice.trim() || `INV-EQP-${Date.now().toString().slice(-6)}` : undefined,
      buktiNota: jalur === 'mandiri' ? fotoNota : null,
    });

    setFormVisible(false);
    resetForm();
    Alert.alert(
      jalur === 'mandiri' ? 'Pembelian Peralatan Tercatat' : 'Pengajuan Terkirim ke Pusat',
      jalur === 'mandiri'
        ? `${rupiah(totalHarga)} langsung memotong saldo anggaran unit dan tercatat di Log Anggaran kategori Peralatan Dapur.`
        : `Pengajuan ${namaAset.trim()} senilai ${rupiah(totalHarga)} diteruskan ke Biro Sarpras BGN Pusat. Anggaran unit tidak terpotong.`,
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header + pemilihan jalur */}
      <Card style={styles.banner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="tool" size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
          <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.primary }}>
            PENGADAAN PERALATAN & ASET DAPUR
          </Text>
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.text }}>
          Dua jalur pengadaan: beli mandiri (langsung memotong saldo anggaran unit) atau ajukan ke BGN Pusat untuk
          aset bernilai besar yang di luar plafon belanja unit.
        </Text>

        <View style={[styles.segment, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          {(['mandiri', 'pusat'] as JalurPengadaanAset[]).map((j) => {
            const active = jalur === j;
            return (
              <Pressable
                key={j}
                onPress={() => setJalur(j)}
                style={[styles.segmentBtn, { backgroundColor: active ? (isDark ? colors.gold : colors.accent) : 'transparent', borderRadius: radius.sm }]}
              >
                <Feather name={j === 'mandiri' ? 'credit-card' : 'send'} size={14} color={active ? (isDark ? '#07101E' : '#FFF') : colors.text} />
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: active ? (isDark ? '#07101E' : '#FFF') : colors.text }}>
                  {j === 'mandiri' ? 'Beli Mandiri (Unit)' : 'Ajukan ke BGN Pusat'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Ringkasan dampak anggaran */}
      {jalur === 'mandiri' ? (
        <Card style={{ gap: 6, borderColor: colors.primary }}>
          <View style={styles.rowBetween}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
              SISA SALDO ANGGARAN UNIT
            </Text>
            <Pill label={`Plafon/transaksi ${rupiah(PLAFON_BELANJA_MANDIRI)}`} tone="warning" />
          </View>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 26 }}>{rupiah(saldo.sisa)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>
            Setiap pembelian mandiri di layar ini langsung tercatat sebagai pengeluaran kategori Peralatan Dapur dan
            mengurangi saldo di atas.
          </Text>
        </Card>
      ) : (
        <Card style={{ gap: 6, borderColor: colors.info }}>
          <View style={styles.rowBetween}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
              JALUR PENGADAAN BGN PUSAT
            </Text>
            <Pill label="Anggaran Unit Tidak Terpotong" tone="success" />
          </View>
          <Text style={{ color: colors.text, fontSize: fontSize.xs }}>
            Dipakai untuk aset bernilai besar (armada, mesin produksi) atau saat saldo unit tidak mencukupi. Barang
            dikirim langsung dari Biro Sarpras BGN, bukan dibeli sendiri oleh unit.
          </Text>
        </Card>
      )}

      {canManage && (
        <PrimaryButton
          label={jalur === 'mandiri' ? '+ Catat Pembelian Peralatan Baru' : '+ Ajukan Pengadaan ke Pusat'}
          icon={jalur === 'mandiri' ? 'shopping-cart' : 'send'}
          onPress={() => setFormVisible(true)}
        />
      )}

      <SectionTitle
        action={<Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>{riwayat.length} Data</Text>}
      >
        {jalur === 'mandiri' ? 'Riwayat Pembelian Mandiri' : 'Riwayat Pengajuan ke Pusat'}
      </SectionTitle>

      {riwayat.length === 0 ? (
        <EmptyState
          icon="tool"
          title="Belum Ada Data"
          body={
            jalur === 'mandiri'
              ? 'Belum ada pembelian peralatan mandiri yang tercatat pada unit ini.'
              : 'Belum ada pengajuan peralatan ke BGN Pusat dari unit ini.'
          }
        />
      ) : (
        riwayat.map((p) => (
          <Card key={p.id} style={{ gap: 6 }} onPress={() => setDetail(p)}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                {p.id} • {p.tanggal}
              </Text>
              <Pill label={STATUS_LABEL[p.status]} tone={STATUS_TONE[p.status]} />
            </View>

            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{p.namaAset}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  {p.jumlah} {p.satuan} @ {rupiah(p.hargaSatuan)} • Urgensi {p.urgensi}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: '900',
                  color: p.jalur === 'mandiri' ? colors.danger : colors.info,
                }}
              >
                {p.jalur === 'mandiri' ? '-' : ''}
                {rupiah(p.totalHarga)}
              </Text>
            </View>

            <View style={[styles.sealRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
              <Feather
                name={p.jalur === 'mandiri' ? 'credit-card' : 'send'}
                size={12}
                color={p.jalur === 'mandiri' ? colors.danger : colors.info}
              />
              <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700', flex: 1 }}>
                {p.jalur === 'mandiri'
                  ? `Memotong anggaran unit${p.anggaranLogId ? ` • ${p.anggaranLogId}` : ''}`
                  : 'Dibiayai & dikirim BGN Pusat — anggaran unit utuh'}
              </Text>
              <Feather name="chevron-right" size={14} color={colors.textMuted} />
            </View>
          </Card>
        ))
      )}

      {/* Form pengadaan */}
      <Modal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        title={jalur === 'mandiri' ? 'Pembelian Peralatan (Potong Anggaran)' : 'Pengajuan Peralatan ke BGN Pusat'}
      >
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: 24 }}>
          <Input
            label="Nama Peralatan / Aset *"
            icon="tool"
            value={namaAset}
            onChangeText={setNamaAset}
            placeholder="Contoh: Mesin Dishwasher Sterilisasi 85°C"
          />

          <DropdownPicker
            label="Kategori Aset"
            icon="grid"
            value={kategori}
            options={KATEGORI_ASET_OPTIONS}
            onSelect={(val) => setKategori(val as PeralatanKategori)}
          />

          <Stepper label="Jumlah Unit" value={jumlah} onChange={setJumlah} step={1} min={1} />

          <DropdownPicker label="Satuan" icon="box" value={satuan} options={SATUAN_OPTIONS} onSelect={setSatuan} />

          <Input
            label="Harga Satuan *"
            prefix="Rp"
            value={hargaSatuan}
            onChangeText={setHargaSatuan}
            keyboardType="numeric"
            placeholder="3250000"
          />

          {/* Urgensi */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Tingkat Urgensi</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {URGENSI_OPTIONS.map((opt) => {
                const active = urgensi === opt.value;
                const tone =
                  opt.value === 'darurat' ? colors.danger : opt.value === 'mendesak' ? colors.warning : colors.success;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setUrgensi(opt.value)}
                    style={[
                      styles.urgensiBtn,
                      { backgroundColor: active ? tone : colors.background, borderColor: tone, borderRadius: radius.md },
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#FFFFFF' : colors.text }}>
                      {opt.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9.5,
                        textAlign: 'center',
                        color: active ? 'rgba(255,255,255,0.85)' : colors.textMuted,
                      }}
                    >
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Input
            label="Alasan / Justifikasi Kebutuhan *"
            icon="align-left"
            value={alasan}
            onChangeText={setAlasan}
            placeholder="Contoh: Dishwasher lama rusak, pencucian manual memperlambat sterilisasi ompreng."
            multiline
          />

          {jalur === 'mandiri' && (
            <>
              <Input
                label="Nama Supplier / Toko"
                icon="shopping-bag"
                value={namaSupplier}
                onChangeText={setNamaSupplier}
                placeholder="Contoh: CV Dapur Prima Stainless"
              />
              <Input
                label="Nomor Nota / Invoice"
                icon="hash"
                value={noInvoice}
                onChangeText={setNoInvoice}
                placeholder="Contoh: INV-EQP-2026-101"
              />

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
                  Foto Bukti Nota / Kwitansi Fisik
                </Text>
                {fotoNota ? (
                  <View style={{ gap: 6 }}>
                    <Image source={{ uri: fotoNota }} style={[styles.notaPreview, { borderRadius: radius.md }]} />
                    <PrimaryButton
                      label="Ganti Foto Nota"
                      icon="camera"
                      variant="outline"
                      onPress={async () => {
                        const uri = await pickImage('library');
                        if (uri) setFotoNota(uri);
                      }}
                    />
                  </View>
                ) : (
                  <PrimaryButton
                    label="Ambil Foto Nota Pembelian"
                    icon="camera"
                    variant="secondary"
                    onPress={async () => {
                      const uri = await pickImage('library');
                      if (uri) setFotoNota(uri);
                    }}
                  />
                )}
              </View>
            </>
          )}

          {/* Ringkasan dampak */}
          <View style={[styles.totalBar, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>TOTAL PENGADAAN:</Text>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.primary }}>{rupiah(totalHarga)}</Text>
          </View>

          {jalur === 'mandiri' ? (
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: lewatPlafon || saldoTidakCukup ? colors.dangerBg : colors.warningBg,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather
                name={lewatPlafon || saldoTidakCukup ? 'alert-triangle' : 'info'}
                size={16}
                color={lewatPlafon || saldoTidakCukup ? colors.danger : colors.warning}
              />
              <Text
                style={{
                  color: lewatPlafon || saldoTidakCukup ? colors.danger : colors.warning,
                  fontSize: fontSize.xs,
                  fontWeight: '700',
                  flex: 1,
                }}
              >
                {lewatPlafon
                  ? `Melebihi plafon belanja mandiri ${rupiah(PLAFON_BELANJA_MANDIRI)} per transaksi — gunakan jalur BGN Pusat.`
                  : saldoTidakCukup
                    ? `Saldo unit hanya ${rupiah(saldo.sisa)} — tidak cukup untuk pengadaan ini.`
                    : `Saldo anggaran unit akan turun jadi ${rupiah(saldo.sisa - totalHarga)} setelah transaksi ini.`}
              </Text>
            </View>
          ) : (
            <View style={[styles.infoBox, { backgroundColor: colors.infoBg, borderRadius: radius.md }]}>
              <Feather name="info" size={16} color={colors.info} />
              <Text style={{ color: colors.info, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                Pengajuan diteruskan ke Biro Sarpras BGN Pusat. Saldo anggaran unit ({rupiah(saldo.sisa)}) tidak
                terpotong sampai keputusan pusat turun.
              </Text>
            </View>
          )}

          <PrimaryButton
            label={jalur === 'mandiri' ? 'Simpan & Potong Anggaran Unit' : 'Kirim Pengajuan ke BGN Pusat'}
            icon={jalur === 'mandiri' ? 'check' : 'send'}
            variant={lewatPlafon || saldoTidakCukup ? 'danger' : 'primary'}
            onPress={handleSubmit}
          />
        </ScrollView>
      </Modal>

      {/* Detail pengadaan */}
      {detail && (
        <Modal visible={!!detail} onClose={() => setDetail(null)} title={`Detail Pengadaan ${detail.id}`}>
          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: 24 }}>
            <View style={[styles.detailHero, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                {detail.jalur === 'mandiri' ? 'BELANJA MANDIRI — POTONG ANGGARAN' : 'PENGAJUAN KE BGN PUSAT'}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: detail.jalur === 'mandiri' ? colors.danger : colors.info,
                }}
              >
                {detail.jalur === 'mandiri' ? '-' : ''}
                {rupiah(detail.totalHarga)}
              </Text>
              <Pill label={STATUS_LABEL[detail.status]} tone={STATUS_TONE[detail.status]} />
            </View>

            <View style={[styles.infoCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{detail.namaAset}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {detail.jumlah} {detail.satuan} @ {rupiah(detail.hargaSatuan)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Tanggal: {detail.tanggal}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Urgensi: {detail.urgensi}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Diajukan Oleh: {detail.diajukanOleh}</Text>
              {!!detail.namaSupplier && (
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Supplier: {detail.namaSupplier}</Text>
              )}
              {!!detail.noInvoice && (
                <Text style={{ fontSize: 11, color: colors.textMuted }}>No. Invoice: {detail.noInvoice}</Text>
              )}
              {!!detail.anggaranLogId && (
                <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '700', marginTop: 2 }}>
                  Tercatat di Log Anggaran: {detail.anggaranLogId}
                </Text>
              )}
            </View>

            <View style={[styles.infoCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Justifikasi Kebutuhan</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 }}>{detail.alasan}</Text>
            </View>

            {!!detail.buktiNota && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  Bukti Fisik Nota Pembelian
                </Text>
                <Image source={{ uri: detail.buktiNota }} style={[styles.notaDetail, { borderRadius: radius.md }]} />
              </View>
            )}

            {!!detail.tanggapan && (
              <View style={[styles.infoBox, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                <Feather name="message-square" size={16} color={colors.success} />
                <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                  {detail.tanggapan}
                </Text>
              </View>
            )}

            {/* Tindak lanjut status jalur pusat */}
            {detail.jalur === 'pusat' && canManage && detail.status !== 'diterima' && (
              <View style={{ gap: spacing.xs }}>
                {detail.status === 'disetujui' && (
                  <PrimaryButton
                    label="Tandai Barang Dikirim Pusat"
                    icon="truck"
                    onPress={() => {
                      updateStatusPengajuanAset(detail.id, 'dikirim', 'Barang dalam pengiriman dari gudang Sarpras BGN.');
                      setDetail(null);
                    }}
                  />
                )}
                {detail.status === 'dikirim' && (
                  <PrimaryButton
                    label="Konfirmasi Barang Diterima Unit"
                    icon="check-circle"
                    onPress={() => {
                      updateStatusPengajuanAset(detail.id, 'diterima', 'Barang diterima unit dan masuk daftar aset dapur.');
                      setDetail(null);
                    }}
                  />
                )}
              </View>
            )}

            <SecondaryButton label="Tutup" onPress={() => setDetail(null)} />
          </ScrollView>
        </Modal>
      )}

      <SecondaryButton label="Lihat Daftar Aset Dapur Terpasang" icon="tool" onPress={() => navigation.navigate('Peralatan')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  banner: { padding: 14, gap: 10 },
  segment: { flexDirection: 'row', padding: 4, gap: 4 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sealRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5 },
  urgensiBtn: { flex: 1, padding: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  notaPreview: { width: '100%', height: 160, resizeMode: 'cover' },
  notaDetail: { width: '100%', height: 220, resizeMode: 'cover' },
  detailHero: { padding: 12, alignItems: 'center', gap: 4, borderWidth: 1 },
  infoCard: { padding: 10, borderWidth: 1, gap: 4 },
});
