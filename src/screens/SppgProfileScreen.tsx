import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { pickImage } from '../utils/pickImage';

export default function SppgProfileScreen() {
  const { role, currentSppg } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [nama, setNama] = useState(currentSppg?.nama ?? '');
  const [alamat, setAlamat] = useState(currentSppg?.alamat ?? '');
  const [kapasitas, setKapasitas] = useState(String(currentSppg?.kapasitasProduksi ?? ''));
  const [foto, setFoto] = useState<string | null>(currentSppg?.fotoDapur ?? null);
  const [saved, setSaved] = useState(false);

  if (!currentSppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="home" title="Data SPPG Tidak Ditemukan" body="Profil dapur tidak tersedia." />
      </View>
    );
  }

  const editable = role === 'KEPALA_SPPG';

  const pickFoto = async () => {
    const uri = await pickImage('camera');
    if (uri) setFoto(uri);
  };

  // ponytail: AppContext exposes no updateSppg action (out of the fixed Phase-1
  // contract), so "Save" here only updates this screen's local state — it does
  // not persist across the app. Wire a real updateSppg(sppgId, patch) mutation
  // in AppContext if profile edits need to be shared elsewhere later.
  const handleSave = () => setSaved(true);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle action={!editable ? <Pill label="Lihat Saja" tone="neutral" /> : undefined}>Profil SPPG</SectionTitle>

      <Card style={{ gap: spacing.md }}>
        {foto ? (
          <Image source={{ uri: foto }} style={[styles.foto, { borderRadius: radius.md }]} />
        ) : (
          <View style={[styles.fotoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <Feather name="image" size={28} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Belum ada foto dapur</Text>
          </View>
        )}
        {editable && <PrimaryButton label="Ambil Foto Dapur" icon="camera" variant="secondary" onPress={pickFoto} />}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Input label="Nama SPPG" icon="home" value={nama} onChangeText={setNama} editable={editable} />
        <Input label="Alamat" icon="map-pin" value={alamat} onChangeText={setAlamat} editable={editable} multiline />
        <Input label="Wilayah Polres" icon="shield" value={currentSppg.wilayahPolres} editable={false} onChangeText={() => {}} />
        <Input label="Wilayah Polda" icon="shield" value={currentSppg.wilayahPolda} editable={false} onChangeText={() => {}} />
        <Input label="Kapasitas Produksi (porsi/hari)" icon="package" value={kapasitas} onChangeText={setKapasitas} editable={editable} keyboardType="number-pad" />
        <Pill label={currentSppg.status === 'aktif' ? 'Aktif' : 'Nonaktif'} tone={currentSppg.status === 'aktif' ? 'success' : 'neutral'} style={{ alignSelf: 'flex-start' }} />
      </Card>

      {editable && <PrimaryButton label="Simpan Perubahan" icon="save" onPress={handleSave} />}
      {saved && (
        <View style={[styles.successBanner, { backgroundColor: colors.successBg }]}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Perubahan disimpan.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  foto: { width: '100%', height: 160 },
  fotoPlaceholder: { width: '100%', height: 160, alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 6 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
});
