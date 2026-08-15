import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { pickMedia } from '../utils/pickImage';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { LaporanPacking } from '../types';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LaporanPackingScreen() {
  const { role, currentUser, currentSppg, laporanPackingList, submitLaporanPacking, sekolahList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const today = todayDate();
  const existingToday = laporanPackingList.find((l) => l.tanggal === today && l.sppgId === currentSppg?.id);

  // Form States
  const [totalOmpreng, setTotalOmpreng] = useState<string>(existingToday ? String(existingToday.totalOmprengDipacking) : '1500');
  const [totalBox, setTotalBox] = useState<string>(existingToday ? String(existingToday.totalThermalBox) : '50');
  const [suhuHolding, setSuhuHolding] = useState<string>(existingToday ? String(existingToday.suhuHoldingRataRata) : '65.0');
  const [statusSealing, setStatusSealing] = useState<'rapat_sempurna' | 'ada_retur'>(existingToday ? existingToday.statusSealing : 'rapat_sempurna');
  const [photos, setPhotos] = useState<string[]>(
    existingToday?.fotoDokumentasi?.length
      ? existingToday.fotoDokumentasi
      : [
          'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60',
        ],
  );
  const [catatan, setCatatan] = useState<string>(
    existingToday?.catatan ?? 'Seluruh ompreng 5 sekat tertutup rapat dan telah disusun rapi ke dalam thermal box sesuai rute sekolah.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // School allocation calculation
  const alokasiSekolah = useMemo(() => {
    const list = sekolahList.slice(0, 3);
    if (list.length === 0) {
      return [
        { sekolahId: 'SCH-001', sekolahNama: 'SDN 01 Merdeka', jumlahOmpreng: 450, jumlahBox: 15 },
        { sekolahId: 'SCH-002', sekolahNama: 'SDN 02 Percobaan', jumlahOmpreng: 380, jumlahBox: 13 },
        { sekolahId: 'SCH-003', sekolahNama: 'SMPN 01 Nusantara', jumlahOmpreng: 670, jumlahBox: 22 },
      ];
    }
    return [
      { sekolahId: list[0]?.id || 'SCH-001', sekolahNama: list[0]?.nama || 'SDN 01 Merdeka', jumlahOmpreng: 450, jumlahBox: 15 },
      { sekolahId: list[1]?.id || 'SCH-002', sekolahNama: list[1]?.nama || 'SDN 02 Percobaan', jumlahOmpreng: 380, jumlahBox: 13 },
      { sekolahId: list[2]?.id || 'SCH-003', sekolahNama: list[2]?.nama || 'SMPN 01 Nusantara', jumlahOmpreng: 670, jumlahBox: 22 },
    ];
  }, [sekolahList]);

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
    const numBox = parseInt(totalBox, 10);
    const numSuhu = parseFloat(suhuHolding);

    if (isNaN(numOmpreng) || numOmpreng <= 0) {
      Alert.alert('Data Tidak Valid', 'Masukkan jumlah ompreng dipacking dengan benar.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Foto Wajib', 'Lampirkan minimal 1 foto dokumentasi kegiatan packing.');
      return;
    }

    setIsSubmitting(true);
    const payload: Omit<LaporanPacking, 'id' | 'createdAt'> = {
      sppgId: currentSppg.id,
      tanggal: today,
      petugasId: currentUser.id,
      petugasNama: currentUser.nama,
      totalOmprengDipacking: numOmpreng,
      totalThermalBox: isNaN(numBox) ? 50 : numBox,
      suhuHoldingRataRata: isNaN(numSuhu) ? 65.0 : numSuhu,
      statusSealing,
      fotoDokumentasi: photos,
      catatan,
      status: 'terkirim',
      alokasiSekolah,
    };

    submitLaporanPacking(payload);
    await addToOfflineQueue('laporan_packing', payload);
    setIsSubmitting(false);
    Alert.alert('Laporan Packing Terkirim', 'Dokumentasi & laporan pemorsian packing berhasil disimpan dan diteruskan ke supervisor.');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Hero Card */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="package" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              LAPORAN PACKING & PEMORSIAN
            </Text>
          </View>
          <Pill label={existingToday ? 'Laporan Terkirim' : 'Shift Hari Ini'} tone={existingToday ? 'success' : 'primary'} />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          Dokumentasi penataan 1.500 ompreng stainless, suhu holding thermal box, dan penyegelan sebelum distribusi ke sekolah.
        </Text>
      </Card>

      {/* 2. KPI Summary 3 Boxes */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{totalOmpreng}</Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>Ompreng Dipacking</Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{totalBox} Box</Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>Thermal Container</Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#F0FDF4', borderColor: colors.success }]}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.success }}>{suhuHolding}°C</Text>
          <Text style={{ fontSize: 10, color: colors.success, fontWeight: '800' }}>Suhu Holding (≥60°C)</Text>
        </View>
      </View>

      {/* 3. Form Input Data Packing */}
      <Card style={{ gap: spacing.md }}>
        <SectionTitle style={{ marginBottom: 0 }}>Input Data & Kondisi Packing</SectionTitle>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Total Ompreng Dipacking"
              value={totalOmpreng}
              onChangeText={setTotalOmpreng}
              keyboardType="numeric"
              placeholder="1500"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Total Thermal Box"
              value={totalBox}
              onChangeText={setTotalBox}
              keyboardType="numeric"
              placeholder="50"
            />
          </View>
        </View>

        <Input
          label="Suhu Holding Makanan (°C) saat Masuk Box"
          value={suhuHolding}
          onChangeText={setSuhuHolding}
          keyboardType="numeric"
          placeholder="65.0"
        />

        {/* Status Sealing Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Status Kerapatan Tutup & Sealing:</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setStatusSealing('rapat_sempurna')}
              style={[
                styles.selectOption,
                {
                  flex: 1,
                  backgroundColor: statusSealing === 'rapat_sempurna' ? (isDark ? 'rgba(13,148,136,0.2)' : '#F0FDF4') : colors.surface,
                  borderColor: statusSealing === 'rapat_sempurna' ? colors.success : colors.border,
                },
              ]}
            >
              <Feather name="check-circle" size={16} color={statusSealing === 'rapat_sempurna' ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: statusSealing === 'rapat_sempurna' ? colors.success : colors.text }}>
                Rapat Sempurna (Anti Tumpah)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setStatusSealing('ada_retur')}
              style={[
                styles.selectOption,
                {
                  flex: 1,
                  backgroundColor: statusSealing === 'ada_retur' ? (isDark ? 'rgba(225,29,72,0.15)' : '#FFF1F2') : colors.surface,
                  borderColor: statusSealing === 'ada_retur' ? colors.danger : colors.border,
                },
              ]}
            >
              <Feather name="alert-triangle" size={16} color={statusSealing === 'ada_retur' ? colors.danger : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: statusSealing === 'ada_retur' ? colors.danger : colors.text }}>
                Ada Retur / Klip Longgar
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Alokasi Ompreng per Sekolah */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
            Rincian Alokasi Muatan per Rute Sekolah:
          </Text>
          {alokasiSekolah.map((sch, idx) => (
            <View key={sch.sekolahId} style={[styles.schoolRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{sch.sekolahNama}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Rute Pengiriman SPPG-001</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>
                  {sch.jumlahOmpreng} Porsi
                </Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>{sch.jumlahBox} Thermal Box</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Foto Dokumentasi */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
            Dokumentasi Foto / Video Kegiatan Pemorsian:
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
          label="Catatan Tambahan Petugas Packing"
          value={catatan}
          onChangeText={setCatatan}
          placeholder="Catatan kendala atau kelancaran pemorsian..."
          multiline
        />

        <PrimaryButton
          label={isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim Laporan Packing'}
          icon="send"
          onPress={handleSubmit}
        />
      </Card>

      {/* 4. Riwayat Laporan Packing Sebelumnya */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Riwayat Laporan Packing Terakhir</SectionTitle>
        {laporanPackingList.map((lap) => (
          <View key={lap.id} style={[styles.historyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{lap.tanggal}</Text>
              <Pill label={`${lap.totalOmprengDipacking} Ompreng`} tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Petugas: {lap.petugasNama} • {lap.totalThermalBox} Box • Suhu {lap.suhuHoldingRataRata}°C
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
  selectOption: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  schoolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 8, borderWidth: 1 },
  photoThumbWrapper: { position: 'relative' },
  photoThumb: { width: 75, height: 75, borderRadius: 8 },
  photoDeleteBtn: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 75, height: 75, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  historyCard: { padding: 10, borderRadius: 8, borderWidth: 1, gap: 3 },
});
