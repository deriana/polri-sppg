import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, PrimaryButton, SectionTitle, Stepper } from '../components/ui';
import { ROLE_PERMISSIONS } from '../utils/scope';

export default function MutasiStokFormScreen({ navigation, route }: any) {
  const { role, currentSppg, bahanBakuList, catatMutasiStok } = useApp();
  const { colors, spacing, fontSize, radius } = useTheme();

  const preselectedBahanId = route?.params?.initialBahanId || route?.params?.bahanId;
  const preselectedJenis = route?.params?.jenis as ('masuk' | 'keluar') | undefined;

  const bahanOptions = useMemo(
    () => bahanBakuList.filter((b) => b.sppgId === currentSppg?.id).map((b) => ({ label: `${b.nama} (${b.satuan})`, value: b.id })),
    [bahanBakuList, currentSppg],
  );

  const [bahanId, setBahanId] = useState(preselectedBahanId || bahanOptions[0]?.value || '');
  const [jenis, setJenis] = useState<'masuk' | 'keluar'>(preselectedJenis || 'masuk');
  const [jumlah, setJumlah] = useState(10);
  const [keterangan, setKeterangan] = useState('');

  if (!role || !ROLE_PERMISSIONS[role].canManageGudang || !currentSppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Kepala SPPG yang dapat mencatat mutasi stok." />
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
      keterangan: keterangan.trim() || (jenis === 'masuk' ? 'Penerimaan barang' : 'Pemakaian produksi'),
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Catat Mutasi Stok</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {bahanOptions.length === 0 ? (
          <EmptyState icon="package" title="Belum Ada Bahan" body="Belum ada data bahan baku terdaftar untuk SPPG ini." />
        ) : (
          <>
            <DropdownPicker label="Bahan Baku" icon="package" value={bahanId} options={bahanOptions} onSelect={setBahanId} />

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
                      {j === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Stepper label="Jumlah" value={jumlah} onChange={setJumlah} step={5} min={1} />
            <Input
              label="Keterangan (opsional)"
              icon="edit-3"
              value={keterangan}
              onChangeText={setKeterangan}
              placeholder="Contoh: Pengiriman dari mitra / dipakai untuk produksi harian"
              multiline
            />
            <PrimaryButton label="Simpan Mutasi" icon="check" onPress={submit} />
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
