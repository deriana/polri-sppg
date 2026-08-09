import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, PrimaryButton, SectionTitle } from '../components/ui';

export default function UsulanMenuFormScreen({ navigation }: any) {
  const { currentSppg, sekolahList, submitUsulanMenu } = useApp();
  const { colors, spacing } = useTheme();

  const sekolahOptions = useMemo(
    () => sekolahList.filter((s) => s.sppgId === currentSppg?.id).map((s) => ({ label: s.nama, value: s.id })),
    [sekolahList, currentSppg],
  );

  const [sekolahId, setSekolahId] = useState(sekolahOptions[0]?.value ?? '');
  const [usulanMenu, setUsulanMenu] = useState('');
  const [alasan, setAlasan] = useState('');

  if (!currentSppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Data SPPG tidak ditemukan." />
      </View>
    );
  }

  const submit = () => {
    if (!sekolahId || !usulanMenu.trim()) return;
    submitUsulanMenu({
      sppgId: currentSppg.id,
      sekolahId,
      usulanMenu: usulanMenu.trim(),
      alasan: alasan.trim() || null,
      tanggal: new Date().toISOString().slice(0, 10),
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Ajukan Usulan Menu dari Sekolah</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {sekolahOptions.length === 0 ? (
          <EmptyState icon="home" title="Belum Ada Sekolah" body="Belum ada sekolah afiliasi terdaftar untuk SPPG ini." />
        ) : (
          <>
            <DropdownPicker label="Sekolah Pengusul" icon="home" value={sekolahId} options={sekolahOptions} onSelect={setSekolahId} />
            <Input
              label="Usulan Menu"
              icon="edit-3"
              value={usulanMenu}
              onChangeText={setUsulanMenu}
              placeholder="Contoh: Nasi + Ikan Nila Goreng + Sayur Asem"
            />
            <Input
              label="Alasan (opsional)"
              icon="file-text"
              value={alasan}
              onChangeText={setAlasan}
              placeholder="Contoh: banyak siswa minta variasi protein ikan"
              multiline
            />
            <PrimaryButton label="Kirim Usulan" icon="send" onPress={submit} disabled={!sekolahId || !usulanMenu.trim()} />
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
