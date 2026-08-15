import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, PrimaryButton, SectionTitle } from '../components/ui';
import { IncidentCategory, IncidentSeverity } from '../types';
import {
  KATEGORI_INCIDENT_OPTIONS as KATEGORI_OPTIONS,
  SEVERITY_INCIDENT_OPTIONS as SEVERITY_OPTIONS,
} from '../mock/incidents';
import { pickMedia } from '../utils/pickImage';
import { getCurrentGeotag } from '../utils/geotag';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function IncidentFormScreen({ navigation }: any) {
  const { currentUser, currentSppg, submitIncident } = useApp();
  const { colors, spacing, fontSize, radius, isDark } = useTheme();

  const [kategori, setKategori] = useState<IncidentCategory>('kerusakan_alat');
  const [tingkatKeparahan, setTingkatKeparahan] = useState<IncidentSeverity>('sedang');
  const [judul, setJudul] = useState('');
  const [lokasi, setLokasi] = useState('Area Dapur Utama');
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const sppgId = currentSppg?.id || currentUser?.sppgId || 'SPPG-001';

  const handleAttachPhoto = async (source: 'camera' | 'library') => {
    const picked = await pickMedia(source, ['images']);
    if (picked) {
      setFotoUri(picked.uri);
    }
  };

  const handleSubmit = async () => {
    if (!judul.trim()) {
      Alert.alert('Judul Wajib Diisi', 'Berikan judul ringkas terkait insiden.');
      return;
    }
    if (!deskripsi.trim()) {
      Alert.alert('Deskripsi Wajib Diisi', 'Jelaskan kronologi dan dampak insiden secara singkat.');
      return;
    }

    submitIncident({
      sppgId,
      tanggal: todayDate(),
      kategori,
      tingkatKeparahan,
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      fotoBukti: fotoUri,
      lokasi: lokasi.trim(),
      pelaporNama: currentUser?.nama ?? 'Petugas SPPG',
      pelaporRole: currentUser?.role ?? 'PETUGAS_LAPANGAN',
    });

    Alert.alert(
      'Insiden Dilaporkan',
      `Laporan insiden berhasil dibuat${tingkatKeparahan !== 'rendah' ? ' dan alert otomatis telah diteruskan ke komando!' : '.'}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Formulir Pelaporan Insiden Lapangan</SectionTitle>

      <Card style={{ gap: spacing.md }}>
        <DropdownPicker
          label="Kategori Insiden"
          icon="alert-triangle"
          value={kategori}
          options={KATEGORI_OPTIONS}
          onSelect={(val) => setKategori(val as IncidentCategory)}
        />

        {/* Severity Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Tingkat Keparahan / Urgensi</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = tingkatKeparahan === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTingkatKeparahan(opt.value)}
                  style={[
                    styles.severityBtn,
                    {
                      backgroundColor: isSelected ? opt.color : colors.background,
                      borderColor: opt.color,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#FFFFFF' : colors.text }}>
                    {opt.label}
                  </Text>
                  <Text style={{ fontSize: 9.5, color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted, textAlign: 'center' }}>
                    {opt.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Judul Insiden"
          icon="file-text"
          value={judul}
          onChangeText={setJudul}
          placeholder="Contoh: Chiller Cold Storage Suhu Naik Tiba-tiba"
        />

        <Input
          label="Lokasi Terjadinya Insiden"
          icon="map-pin"
          value={lokasi}
          onChangeText={setLokasi}
          placeholder="Contoh: Dapur Pengolahan / Jalur Distribusi SDN 1"
        />

        <Input
          label="Deskripsi & Kronologi Kejadian"
          icon="align-left"
          value={deskripsi}
          onChangeText={setDeskripsi}
          placeholder="Ceritakan apa yang terjadi, waktu kejadian, serta dampak terhadap operasional..."
          multiline
          numberOfLines={4}
        />
      </Card>

      {/* Foto Bukti */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Foto Bukti Kejadian (Opsional)</SectionTitle>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <PrimaryButton
            label="Ambil Foto Kamera"
            icon="camera"
            variant="secondary"
            onPress={() => handleAttachPhoto('camera')}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label="Pilih dari Galeri"
            icon="image"
            variant="secondary"
            onPress={() => handleAttachPhoto('library')}
            style={{ flex: 1 }}
          />
        </View>

        {fotoUri && (
          <View style={{ marginTop: 8, position: 'relative', width: 120, height: 120 }}>
            <Image source={{ uri: fotoUri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} />
            <Pressable
              onPress={() => setFotoUri(null)}
              style={[styles.removePhotoBtn, { backgroundColor: colors.danger }]}
            >
              <Feather name="x" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </Card>

      <PrimaryButton label="Kirim Laporan Insiden" icon="send" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  severityBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
