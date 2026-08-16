import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, PrimaryButton, SectionTitle, Stepper } from '../components/ui';
import { ROLE_PERMISSIONS } from '../utils/scope';

export default function MutasiStokFormScreen({ navigation, route }: any) {
  const { role, currentSppg, bahanBakuList, catatMutasiStok } = useApp();
  const { colors, spacing, fontSize, radius, isDark } = useTheme();

  const preselectedBahanId = route?.params?.initialBahanId || route?.params?.bahanId;
  const preselectedJenis = route?.params?.jenis as ('masuk' | 'keluar') | undefined;
  const isPemakaianMode = route?.params?.mode === 'pemakaian' || preselectedJenis === 'keluar';

  const bahanOptions = useMemo(
    () => bahanBakuList.filter((b) => b.sppgId === currentSppg?.id).map((b) => ({ label: `${b.nama} (${b.satuan})`, value: b.id })),
    [bahanBakuList, currentSppg],
  );

  const [bahanId, setBahanId] = useState(preselectedBahanId || bahanOptions[0]?.value || '');
  const [jenis, setJenis] = useState<'masuk' | 'keluar'>(preselectedJenis || 'masuk');
  const [jumlah, setJumlah] = useState(10);
  const [keterangan, setKeterangan] = useState(
    isPemakaianMode ? 'Pemakaian masak dapur hari ini' : '',
  );

  const selectedBahan = useMemo(() => {
    return bahanBakuList.find((b) => b.id === bahanId);
  }, [bahanBakuList, bahanId]);

  if (!role || !ROLE_PERMISSIONS[role].canManageGudang || !currentSppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Petugas Logistik / Kepala SPPG yang dapat mencatat mutasi stok." />
      </View>
    );
  }

  const submit = () => {
    if (!bahanId || jumlah <= 0) return;
    catatMutasiStok({
      bahanId,
      sppgId: currentSppg.id,
      jenis,
      jumlah,
      keterangan: keterangan.trim() || (jenis === 'masuk' ? 'Penerimaan barang tambahan' : 'Pemakaian masak dapur'),
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={{ gap: 2 }}>
        <SectionTitle style={{ marginBottom: 0 }}>
          {isPemakaianMode ? 'Catat Pemakaian Bahan Dapur' : 'Catat Mutasi Stok Gudang'}
        </SectionTitle>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          {isPemakaianMode
            ? 'Pengurangan stok gudang untuk kebutuhan masak & pemorsian hari ini'
            : 'Pencatatan manual stok masuk (penerimaan) atau keluar (pemakaian/rusak)'}
        </Text>
      </View>

      <Card style={{ gap: spacing.md }}>
        {bahanOptions.length === 0 ? (
          <EmptyState icon="package" title="Belum Ada Bahan" body="Belum ada data bahan baku terdaftar untuk SPPG ini." />
        ) : (
          <>
            <DropdownPicker label="Pilih Bahan Baku" icon="package" value={bahanId} options={bahanOptions} onSelect={setBahanId} />

            {/* Info Stok Terkini */}
            {selectedBahan && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 10,
                  backgroundColor: colors.background,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '700' }}>STOK SAAT INI DI GUDANG</Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>
                    {selectedBahan.stok.toLocaleString('id-ID')} {selectedBahan.satuan}
                  </Text>
                </View>
                {selectedBahan.tanggalKadaluarsa && (
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Kedaluwarsa:</Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.warning }}>
                      {selectedBahan.tanggalKadaluarsa}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Jenis Mutasi (Tampil sebagai selector jika mutasi umum, atau locked badge jika pemakaian) */}
            {isPemakaianMode ? (
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>Jenis Mutasi:</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    padding: 10,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.danger,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.danger }}>
                    ⬇ Stok Keluar (Pemakaian Dapur / Masak)
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.xs }}>Jenis Mutasi</Text>
                <View style={[styles.segment, { borderColor: colors.border, borderRadius: radius.md }]}>
                  {(['masuk', 'keluar'] as const).map((j) => (
                    <Pressable
                      key={j}
                      onPress={() => setJenis(j)}
                      style={[styles.segmentItem, { borderRadius: radius.sm }, jenis === j && { backgroundColor: colors.primary }]}
                    >
                      <Text style={{ color: jenis === j ? colors.textInverse : colors.text, fontWeight: '700', fontSize: fontSize.xs }}>
                        {j === 'masuk' ? 'Barang Masuk (Tambah)' : 'Barang Keluar (Pakai)'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Stepper
              label={isPemakaianMode ? 'Jumlah Bahan yang Dimasak / Digunakan' : 'Jumlah Mutasi'}
              value={jumlah}
              onChange={setJumlah}
              step={5}
              min={1}
            />

            <Input
              label="Keterangan Penggunaan"
              icon="edit-3"
              value={keterangan}
              onChangeText={setKeterangan}
              placeholder={
                isPemakaianMode
                  ? 'Contoh: Dimasak untuk menu makan siang 500 porsi'
                  : 'Contoh: Pengiriman dari mitra / dipakai untuk produksi harian'
              }
              multiline
            />

            <PrimaryButton
              label={isPemakaianMode ? 'Kurangi Stok & Catat Pemakaian' : 'Simpan Mutasi Stok'}
              icon="check-circle"
              onPress={submit}
            />
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  segment: { flexDirection: 'row', borderWidth: 1, padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
});
