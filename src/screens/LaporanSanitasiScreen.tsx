import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { pickMedia } from '../utils/pickImage';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { LaporanSanitasi } from '../types';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LaporanSanitasiScreen() {
  const { currentUser, currentSppg, laporanSanitasiList, submitLaporanSanitasi } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const today = todayDate();
  const existingToday = laporanSanitasiList.find((l) => l.tanggal === today && l.sppgId === currentSppg?.id);

  // Form States
  const [totalOmpreng, setTotalOmpreng] = useState<string>(existingToday ? String(existingToday.totalOmprengDicuci) : '1500');
  const [suhuDishwasher, setSuhuDishwasher] = useState<string>(existingToday ? String(existingToday.suhuAirDishwasher) : '85.5');
  const [desinfektan, setDesinfektan] = useState<string>(
    existingToday?.desinfektanDigunakan ?? 'Klorin Food-Grade 50ppm & Sabun Antibakteri SNI',
  );
  const [kepatuhanApd, setKepatuhanApd] = useState<string>(existingToday ? String(existingToday.kepatuhanApdPct) : '100');
  const [statusGreaseTrap, setStatusGreaseTrap] = useState<'bersih_lancar' | 'perlu_kurasi' | 'tersumbat'>(
    existingToday ? existingToday.statusGreaseTrap : 'bersih_lancar',
  );
  const [photos, setPhotos] = useState<string[]>(
    existingToday?.fotoDokumentasi?.length
      ? existingToday.fotoDokumentasi
      : [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60',
        ],
  );
  const [catatan, setCatatan] = useState<string>(
    existingToday?.catatan ?? 'Pembersihan area dapur utama, washing bay, grease trap, dan desinfeksi meja kerja selesai.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || !currentSppg) return null;

  const handleAddPhoto = async (source: 'camera' | 'library') => {
    const picked = await pickMedia(source, ['images', 'videos']);
    if (picked?.uri) {
      setPhotos((prev) => [...prev, picked.uri]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const numOmpreng = parseInt(totalOmpreng, 10);
    const numSuhu = parseFloat(suhuDishwasher);
    const numApd = parseInt(kepatuhanApd, 10);

    if (isNaN(numOmpreng) || numOmpreng <= 0) {
      Alert.alert('Data Tidak Valid', 'Masukkan jumlah ompreng dicuci dengan benar.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Foto Wajib', 'Lampirkan minimal 1 foto dokumentasi kegiatan sanitasi / washing bay.');
      return;
    }

    setIsSubmitting(true);
    const payload: Omit<LaporanSanitasi, 'id' | 'createdAt'> = {
      sppgId: currentSppg.id,
      tanggal: today,
      petugasId: currentUser.id,
      petugasNama: currentUser.nama,
      totalOmprengDicuci: numOmpreng,
      suhuAirDishwasher: isNaN(numSuhu) ? 85.0 : numSuhu,
      desinfektanDigunakan: desinfektan,
      kepatuhanApdPct: isNaN(numApd) ? 100 : numApd,
      statusGreaseTrap,
      fotoDokumentasi: photos,
      catatan,
      status: 'terkirim',
    };

    submitLaporanSanitasi(payload);
    await addToOfflineQueue('laporan_sanitasi', payload);
    setIsSubmitting(false);
    Alert.alert('Laporan Sanitasi Terkirim', 'Dokumentasi sanitasi & sterilisasi berhasil disimpan dan tercatat di dashboard SPPG.');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Hero Card */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="shield" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              LAPORAN SANITASI & STERILISASI
            </Text>
          </View>
          <Pill label={existingToday ? 'Laporan Terkirim' : 'Shift Hari Ini'} tone={existingToday ? 'success' : 'primary'} />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          Dokumentasi sterilisasi ompreng dishwasher 85°C, kepatuhan APD tim dapur, dan kebersihan grease trap limbah.
        </Text>
      </Card>

      {/* 2. KPI Summary 3 Boxes */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{totalOmpreng}</Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>Ompreng Dicuci</Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#F0FDF4', borderColor: colors.success }]}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.success }}>{suhuDishwasher}°C</Text>
          <Text style={{ fontSize: 10, color: colors.success, fontWeight: '800' }}>Suhu Dishwasher (85°C)</Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: colors.infoBg, borderColor: colors.info }]}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.info }}>{kepatuhanApd}%</Text>
          <Text style={{ fontSize: 10, color: colors.info, fontWeight: '800' }}>Kepatuhan APD</Text>
        </View>
      </View>

      {/* 3. Form Input Data Sanitasi */}
      <Card style={{ gap: spacing.md }}>
        <SectionTitle style={{ marginBottom: 0 }}>Input Audit Sanitasi & Sterilisasi</SectionTitle>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Total Ompreng Dicuci"
              value={totalOmpreng}
              onChangeText={setTotalOmpreng}
              keyboardType="numeric"
              placeholder="1500"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Suhu Air Panas (°C)"
              value={suhuDishwasher}
              onChangeText={setSuhuDishwasher}
              keyboardType="numeric"
              placeholder="85.5"
            />
          </View>
        </View>

        <Input
          label="Larutan Desinfektan & Pembersih"
          value={desinfektan}
          onChangeText={setDesinfektan}
          placeholder="Klorin Food-Grade 50ppm / Sabun SNI"
        />

        <Input
          label="Persentase Kepatuhan APD Personel (%)"
          value={kepatuhanApd}
          onChangeText={setKepatuhanApd}
          keyboardType="numeric"
          placeholder="100"
        />

        {/* Status Grease Trap Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Kondisi Saringan Lemak (Grease Trap):</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setStatusGreaseTrap('bersih_lancar')}
              style={[
                styles.selectOption,
                {
                  flex: 1,
                  backgroundColor: statusGreaseTrap === 'bersih_lancar' ? (isDark ? 'rgba(13,148,136,0.2)' : '#F0FDF4') : colors.surface,
                  borderColor: statusGreaseTrap === 'bersih_lancar' ? colors.success : colors.border,
                },
              ]}
            >
              <Feather name="check-circle" size={14} color={statusGreaseTrap === 'bersih_lancar' ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: statusGreaseTrap === 'bersih_lancar' ? colors.success : colors.text }}>
                Bersih & Lancar
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setStatusGreaseTrap('perlu_kurasi')}
              style={[
                styles.selectOption,
                {
                  flex: 1,
                  backgroundColor: statusGreaseTrap === 'perlu_kurasi' ? (isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB') : colors.surface,
                  borderColor: statusGreaseTrap === 'perlu_kurasi' ? colors.warning : colors.border,
                },
              ]}
            >
              <Feather name="alert-circle" size={14} color={statusGreaseTrap === 'perlu_kurasi' ? colors.warning : colors.textMuted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: statusGreaseTrap === 'perlu_kurasi' ? colors.warning : colors.text }}>
                Perlu Kuras
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setStatusGreaseTrap('tersumbat')}
              style={[
                styles.selectOption,
                {
                  flex: 1,
                  backgroundColor: statusGreaseTrap === 'tersumbat' ? (isDark ? 'rgba(225,29,72,0.15)' : '#FFF1F2') : colors.surface,
                  borderColor: statusGreaseTrap === 'tersumbat' ? colors.danger : colors.border,
                },
              ]}
            >
              <Feather name="x-circle" size={14} color={statusGreaseTrap === 'tersumbat' ? colors.danger : colors.textMuted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: statusGreaseTrap === 'tersumbat' ? colors.danger : colors.text }}>
                Tersumbat
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Foto Dokumentasi */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
            Dokumentasi Foto / Video Washing Bay & APD:
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable onPress={() => handleRemovePhoto(idx)} style={[styles.photoDeleteBtn, { backgroundColor: colors.danger }]}>
                  <Feather name="x" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => handleAddPhoto('camera')}
              style={[styles.addPhotoBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            >
              <Feather name="camera" size={20} color={colors.primary} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary, marginTop: 4 }}>+ Foto Kamera</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAddPhoto('library')}
              style={[styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Feather name="image" size={20} color={colors.textMuted} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 4 }}>+ Galeri</Text>
            </Pressable>
          </View>
        </View>

        <Input
          label="Catatan Audit Kebersihan Petugas"
          value={catatan}
          onChangeText={setCatatan}
          placeholder="Catatan hasil sanitasi harian..."
          multiline
        />

        <PrimaryButton
          label={isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim Laporan Sanitasi'}
          icon="send"
          onPress={handleSubmit}
        />
      </Card>

      {/* 4. Riwayat Laporan Sanitasi Sebelumnya */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Riwayat Laporan Sanitasi Terakhir</SectionTitle>
        {laporanSanitasiList.map((lap) => (
          <View key={lap.id} style={[styles.historyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{lap.tanggal}</Text>
              <Pill label={`${lap.totalOmprengDicuci} Ompreng Dicuci`} tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Petugas: {lap.petugasNama} • Suhu {lap.suhuAirDishwasher}°C • APD {lap.kepatuhanApdPct}%
            </Text>
            <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>{lap.catatan}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kpiGrid: { flexDirection: 'row', gap: 6 },
  kpiBox: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  selectOption: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  photoThumbWrapper: { position: 'relative' },
  photoThumb: { width: 75, height: 75, borderRadius: 8 },
  photoDeleteBtn: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 75, height: 75, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  historyCard: { padding: 10, borderRadius: 8, borderWidth: 1, gap: 3 },
});
