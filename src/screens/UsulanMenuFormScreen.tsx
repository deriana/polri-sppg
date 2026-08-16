import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { pickImage } from '../utils/pickImage';

export default function UsulanMenuFormScreen({ navigation }: any) {
  const { currentSppg, sekolahList, submitUsulanMenu } = useApp();
  const { colors, spacing, radius, fontSize } = useTheme();

  const sekolahOptions = useMemo(
    () => sekolahList.filter((s) => s.sppgId === currentSppg?.id).map((s) => ({ label: s.nama, value: s.id })),
    [sekolahList, currentSppg],
  );

  const [sekolahId, setSekolahId] = useState(sekolahOptions[0]?.value ?? '');
  const [pengusulNama, setPengusulNama] = useState('');
  const [usulanMenu, setUsulanMenu] = useState('');
  const [alasan, setAlasan] = useState('');
  const [fotoMenu, setFotoMenu] = useState<string | null>(null);

  if (!currentSppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Data SPPG tidak ditemukan." />
      </View>
    );
  }

  const handleAttachPhoto = async (source: 'camera' | 'library') => {
    const uri = await pickImage(source);
    if (uri) setFotoMenu(uri);
  };

  const submit = () => {
    if (!sekolahId || !usulanMenu.trim()) return;
    submitUsulanMenu({
      sppgId: currentSppg.id,
      sekolahId,
      usulanMenu: usulanMenu.trim(),
      alasan: alasan.trim() || null,
      tanggal: new Date().toISOString().slice(0, 10),
      fotoMenu: fotoMenu || null,
      pengusulNama: pengusulNama.trim() || undefined,
    });
    Alert.alert('Usulan Menu Terkirim', 'Aspirasi menu bergizi berhasil dicatat untuk ditinjau Kepala SPPG.');
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
              label="Nama Pengusul / Jabatan"
              icon="user"
              value={pengusulNama}
              onChangeText={setPengusulNama}
              placeholder="Contoh: Ibu Ratna Kusuma, S.Pd (Komite Sekolah)"
            />

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
              numberOfLines={3}
            />

            {/* Lampiran Foto Menu */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                Foto Referensi / Contoh Sajian (Opsional):
              </Text>

              {fotoMenu ? (
                <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, position: 'relative' }}>
                  <Image
                    source={{ uri: fotoMenu }}
                    style={{ width: '100%', height: 160 }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setFotoMenu(null)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      padding: 6,
                      borderRadius: 16,
                    }}
                  >
                    <Feather name="trash-2" size={16} color="#FF6B6B" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => handleAttachPhoto('camera')}
                    style={[styles.attachBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <Feather name="camera" size={16} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>Ambil Kamera</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleAttachPhoto('library')}
                    style={[styles.attachBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <Feather name="image" size={16} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>Pilih Galeri</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <PrimaryButton label="Kirim Usulan" icon="send" onPress={submit} disabled={!sekolahId || !usulanMenu.trim()} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
