import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, PrimaryButton, SectionTitle, Stepper } from '../components/ui';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage } from '../utils/pickImage';

export default function SekolahFormScreen({ navigation }: any) {
  const { role, currentUser, addSekolah } = useApp();
  const { colors, spacing } = useTheme();

  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [jumlahSiswa, setJumlahSiswa] = useState(200);
  const [fotoSekolah, setFotoSekolah] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!role || !ROLE_PERMISSIONS[role].canManageStaff || !currentUser) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Kepala SPPG yang dapat menambah sekolah afiliasi." />
      </View>
    );
  }

  const ambilFoto = async () => {
    const uri = await pickImage('camera');
    if (uri) setFotoSekolah(uri);
  };

  const submit = () => {
    if (!nama.trim() || !alamat.trim()) {
      setError('Nama dan alamat sekolah wajib diisi.');
      return;
    }
    addSekolah({
      sppgId: currentUser.sppgId,
      nama: nama.trim(),
      alamat: alamat.trim(),
      jumlahSiswa,
      fotoSekolah,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Tambah Sekolah Afiliasi</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600', flex: 1 }}>{error}</Text>
          </View>
        )}
        <View style={styles.fotoRow}>
          {fotoSekolah ? (
            <Image source={{ uri: fotoSekolah }} style={[styles.fotoThumb, { borderRadius: 8 }]} />
          ) : (
            <View style={[styles.fotoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="home" size={24} color={colors.textMuted} />
            </View>
          )}
          <PrimaryButton
            label={fotoSekolah ? 'Ganti Foto Sekolah' : 'Ambil Foto Sekolah'}
            icon="camera"
            variant="secondary"
            fullWidth={false}
            onPress={ambilFoto}
            style={{ flex: 1 }}
          />
        </View>
        <Input label="Nama Sekolah" icon="home" value={nama} onChangeText={setNama} placeholder="Contoh: SDN Coblong 04" />
        <Input label="Alamat" icon="map-pin" value={alamat} onChangeText={setAlamat} placeholder="Alamat lengkap sekolah" multiline />
        <Stepper label="Jumlah Siswa" value={jumlahSiswa} onChange={setJumlahSiswa} step={10} min={10} />
        <PrimaryButton label="Simpan Sekolah" icon="save" onPress={submit} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  fotoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fotoThumb: { width: 64, height: 64 },
  fotoPlaceholder: { width: 64, height: 64, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
