import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, PrimaryButton, SectionTitle } from '../components/ui';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage } from '../utils/pickImage';
import { Jobdesk, JOBDESK_OPTIONS } from '../utils/jobdesk';

const SHIFT_OPTIONS = [
  { label: 'Pagi', value: 'Pagi' },
  { label: 'Siang', value: 'Siang' },
  { label: 'Malam', value: 'Malam' },
];

export default function StaffFormScreen({ navigation }: any) {
  const { role, currentUser, addStaff } = useApp();
  const { colors, spacing } = useTheme();

  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [shift, setShift] = useState('Pagi');
  const [jobdesk, setJobdesk] = useState('');
  const [fotoProfil, setFotoProfil] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!role || !ROLE_PERMISSIONS[role].canManageStaff || !currentUser) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Kepala SPPG yang dapat menambah staf." />
      </View>
    );
  }

  const takeFotoProfil = async () => {
    const uri = await pickImage('camera');
    if (uri) setFotoProfil(uri);
  };

  const submit = () => {
    if (!nama.trim() || !nik.trim() || !noHp.trim()) {
      setError('Nama, NIK, dan No. HP wajib diisi.');
      return;
    }
    if (nik.trim().length < 10) {
      setError('NIK tidak valid (minimal 10 digit).');
      return;
    }
    addStaff({
      sppgId: currentUser.sppgId,
      nama: nama.trim(),
      role: 'PETUGAS_LAPANGAN',
      noHp: noHp.trim(),
      nik: nik.trim(),
      statusAktif: true,
      shift,
      jobdesk: jobdesk ? (jobdesk as Jobdesk) : undefined,
      fotoProfil,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Tambah Petugas Lapangan</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600', flex: 1 }}>{error}</Text>
          </View>
        )}
        <View style={styles.fotoRow}>
          {fotoProfil ? (
            <Image source={{ uri: fotoProfil }} style={[styles.fotoThumb, { borderRadius: 32 }]} />
          ) : (
            <View style={[styles.fotoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="user" size={24} color={colors.textMuted} />
            </View>
          )}
          <PrimaryButton
            label={fotoProfil ? 'Ganti Foto Profil' : 'Ambil Foto Profil'}
            icon="camera"
            variant="secondary"
            fullWidth={false}
            onPress={takeFotoProfil}
            style={{ flex: 1 }}
          />
        </View>
        <Input label="Nama Lengkap" icon="user" value={nama} onChangeText={setNama} placeholder="Nama petugas" />
        <Input label="NIK" icon="credit-card" value={nik} onChangeText={setNik} placeholder="16 digit NIK" keyboardType="number-pad" />
        <Input label="No. HP" icon="phone" value={noHp} onChangeText={setNoHp} placeholder="0812-xxxx-xxxx" keyboardType="phone-pad" />
        <DropdownPicker label="Shift" icon="clock" value={shift} options={SHIFT_OPTIONS} onSelect={setShift} />
        <DropdownPicker label="Jobdesk" icon="briefcase" value={jobdesk} options={JOBDESK_OPTIONS} onSelect={setJobdesk} placeholder="Pilih jobdesk (opsional)" />
        <PrimaryButton label="Simpan Staf" icon="save" onPress={submit} />
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
  fotoPlaceholder: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
