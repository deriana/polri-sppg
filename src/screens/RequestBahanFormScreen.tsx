import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, PrimaryButton, SectionTitle, Stepper } from '../components/ui';
import { ROLE_PERMISSIONS } from '../utils/scope';

export default function RequestBahanFormScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, bahanBakuList, ajukanPermintaanBahan } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const bahanOptions = useMemo(
    () => bahanBakuList.filter((b) => b.sppgId === currentSppg?.id).map((b) => ({ label: `${b.nama} (${b.satuan})`, value: b.id })),
    [bahanBakuList, currentSppg],
  );

  const [bahanId, setBahanId] = useState(bahanOptions[0]?.value ?? '');
  const [jumlah, setJumlah] = useState(10);
  const [catatan, setCatatan] = useState('');

  // Bahan tanpa mitraId = belum ada mitra pemasok tetap (mis. belum pernah
  // dipesan lewat rantai pasok swasta) — permintaan untuk bahan ini diteruskan
  // ke BGN Pusat, bukan ke mitra (lihat PermintaanBahanDetailScreen).
  const selectedBahan = bahanBakuList.find((b) => b.id === bahanId);
  const goesToPusat = !!selectedBahan && !selectedBahan.mitraId;

  if (!role || !ROLE_PERMISSIONS[role].canManageGudang || !currentUser || !currentSppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Kepala SPPG yang dapat mengajukan permintaan bahan baku." />
      </View>
    );
  }

  const submit = () => {
    if (!bahanId) return;
    ajukanPermintaanBahan({
      sppgId: currentSppg.id,
      bahanId,
      jumlah,
      catatan: catatan.trim() || null,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Ajukan Permintaan Bahan Baku</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {bahanOptions.length === 0 ? (
          <EmptyState icon="package" title="Belum Ada Bahan" body="Belum ada data bahan baku terdaftar untuk SPPG ini." />
        ) : (
          <>
            <DropdownPicker label="Bahan Baku" icon="package" value={bahanId} options={bahanOptions} onSelect={setBahanId} />
            <Stepper label="Jumlah" value={jumlah} onChange={setJumlah} step={5} min={1} />
            <Input
              label="Catatan (opsional)"
              icon="edit-3"
              value={catatan}
              onChangeText={setCatatan}
              placeholder="Contoh: kebutuhan mendesak untuk menu besok"
              multiline
            />
            {goesToPusat && (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 10 }}>
                <Feather name="info" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
                <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
                  Bahan ini belum ada mitra pemasok tetap — permintaan akan diteruskan ke BGN Pusat, bukan ke mitra swasta.
                </Text>
              </View>
            )}
            <PrimaryButton label={goesToPusat ? 'Ajukan ke BGN Pusat' : 'Ajukan Permintaan'} icon="send" onPress={submit} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
});
