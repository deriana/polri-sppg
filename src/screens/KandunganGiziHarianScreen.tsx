import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import HppBadge from '../components/HppBadge';
import { resolveHpp } from '../utils/hpp';
import { useTheme } from '../context/ThemeContext';
import {
  Card,
  DropdownPicker,
  EmptyState,
  Input,
  Modal,
  Pill,
  PrimaryButton,
  SectionTitle,
} from '../components/ui';
import { useScopedData } from '../hooks';
import { KandunganGiziHarian } from '../types';
import { SPPG_ASSET_MAP } from '../mock/sppgAssetMap';
import { MENU_PAKET_PRESETS, TARGET_GIZI_OPTIONS as TARGET_OPTIONS } from '../mock/kandunganGizi';
import { pickImage } from '../utils/pickImage';

export default function KandunganGiziHarianScreen({ navigation }: any) {
  const { currentUser, currentSppg, kandunganGiziList, addKandunganGiziLog, masterMenuList, costPerMeal } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  // Tab: 'input' | 'riwayat'
  const [activeTab, setActiveTab] = useState<'input' | 'riwayat'>('input');
  const [selectedDetail, setSelectedDetail] = useState<KandunganGiziHarian | null>(null);

  // Form State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [targetPenerima, setTargetPenerima] = useState<KandunganGiziHarian['targetPenerima']>('SD Kelas 4-6');
  const [kaloriStr, setKaloriStr] = useState(MENU_PAKET_PRESETS[0].defaultKalori);
  const [karboStr, setKarboStr] = useState(MENU_PAKET_PRESETS[0].defaultKarbo);
  const [protHewaniStr, setProtHewaniStr] = useState(MENU_PAKET_PRESETS[0].defaultProtHewani);
  const [protNabatiStr, setProtNabatiStr] = useState(MENU_PAKET_PRESETS[0].defaultProtNabati);
  const [lemakStr, setLemakStr] = useState(MENU_PAKET_PRESETS[0].defaultLemak);
  const [seratStr, setSeratStr] = useState(MENU_PAKET_PRESETS[0].defaultSerat);
  const [kalsiumStr, setKalsiumStr] = useState(MENU_PAKET_PRESETS[0].defaultKalsium);
  const [zatBesiStr, setZatBesiStr] = useState(MENU_PAKET_PRESETS[0].defaultZatBesi);
  const [bebasAlergen, setBebasAlergen] = useState(true);
  const [catatan, setCatatan] = useState('Porsi gizi seimbang sesuai panduan Piring Makanku BGN. Komposisi protein hewani segar dan sayuran hijau terpenuhi.');
  const [fotoSampel, setFotoSampel] = useState<string | null>(null);

  const selectedPreset = MENU_PAKET_PRESETS[selectedPresetIndex];

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = MENU_PAKET_PRESETS[index];
    setKaloriStr(p.defaultKalori);
    setKarboStr(p.defaultKarbo);
    setProtHewaniStr(p.defaultProtHewani);
    setProtNabatiStr(p.defaultProtNabati);
    setLemakStr(p.defaultLemak);
    setSeratStr(p.defaultSerat);
    setKalsiumStr(p.defaultKalsium);
    setZatBesiStr(p.defaultZatBesi);
  };

  const pickSampleImage = async () => {
    const uri = await pickImage('library');
    if (uri) setFotoSampel(uri);
  };

  const handleSaveEvaluation = () => {
    const kaloriNum = parseFloat(kaloriStr) || 0;
    const karboNum = parseFloat(karboStr) || 0;
    const protHNum = parseFloat(protHewaniStr) || 0;
    const protNNum = parseFloat(protNabatiStr) || 0;
    const lemakNum = parseFloat(lemakStr) || 0;
    const seratNum = parseFloat(seratStr) || 0;
    const kalsiumNum = parseFloat(kalsiumStr) || 0;
    const zatBesiNum = parseFloat(zatBesiStr) || 0;

    if (kaloriNum <= 0) {
      Alert.alert('Data Belum Lengkap', 'Masukkan total nilai kalori / energi makanan.');
      return;
    }

    // Benchmark status
    let statusKesesuaianAkg: KandunganGiziHarian['statusKesesuaianAkg'] = 'sesuai';
    if (kaloriNum < 400 || kaloriNum > 850) {
      statusKesesuaianAkg = 'perhatian';
    }

    addKandunganGiziLog({
      sppgId: currentSppg?.id ?? 'SPPG-001',
      tanggal: new Date().toISOString().slice(0, 10),
      namaPaketMenu: selectedPreset.nama,
      targetPenerima,
      kalori: kaloriNum,
      karbohidrat: karboNum,
      proteinHewani: protHNum,
      proteinNabati: protNNum,
      lemak: lemakNum,
      serat: seratNum,
      kalsium: kalsiumNum,
      zatBesi: zatBesiNum,
      bebasAlergen,
      statusKesesuaianAkg,
      catatanAhliGizi: catatan.trim() || 'Evaluasi gizi harian disetujui sesuai standar AKG.',
      namaAhliGizi: currentUser?.nama ?? 'Dr. Tri Wibowo, S.Gz',
      fotoSampelMenu: fotoSampel ?? selectedPreset.foto,
    });

    Alert.alert(
      'Sertifikasi Gizi Berhasil Disimpan',
      `Evaluasi kandungan gizi untuk menu sajian hari ini (${targetPenerima}) berhasil diterbitkan dan masuk ke database pengawasan BGN.`,
      [{ text: 'Lihat Riwayat', onPress: () => setActiveTab('riwayat') }]
    );
  };

  const activeTargetMeta = TARGET_OPTIONS.find((t) => t.value === targetPenerima);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Hero Banner */}
      <View style={[styles.heroBanner, { backgroundColor: colors.primaryLight, borderRadius: radius.lg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="activity" size={20} color={colors.primary} />
          <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.primary }}>
            EVALUASI KANDUNGAN GIZI & STANDAR AKG
          </Text>
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.text }}>
          Input dan validasi kandungan energi pokok makanan (kalori, makronutrien, mikronutrien) yang disajikan ke penerima manfaat hari ini.
        </Text>
        <View style={styles.ahliGiziBadge}>
          <Feather name="award" size={13} color={colors.primary} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
            Petugas Ahli Gizi: {currentUser?.nama ?? 'Dr. Tri Wibowo, S.Gz, M.Sc'}
          </Text>
        </View>

        {/* Tab Segment Controls */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
          <Pressable
            onPress={() => setActiveTab('input')}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'input' ? colors.primary : 'transparent', borderRadius: radius.sm },
            ]}
          >
            <Feather name="edit-3" size={14} color={activeTab === 'input' ? '#FFF' : colors.text} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'input' ? '#FFF' : colors.text }}>
              Input Kandungan Gizi
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('riwayat')}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'riwayat' ? colors.primary : 'transparent', borderRadius: radius.sm },
            ]}
          >
            <Feather name="clipboard" size={14} color={activeTab === 'riwayat' ? '#FFF' : colors.text} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: activeTab === 'riwayat' ? '#FFF' : colors.text }}>
              Riwayat Sertifikasi ({kandunganGiziList.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: FORM INPUT KANDUNGAN GIZI MAKANAN HARI INI                         */}
      {/* ========================================================================= */}
      {activeTab === 'input' && (
        <View style={{ gap: spacing.md }}>
          {/* Preset Paket Menu Pilihan */}
          <Card style={{ gap: spacing.sm }}>
            <SectionTitle style={{ marginBottom: 0 }}>Pilih Menu Sajian Hari Ini</SectionTitle>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              Pilih paket makanan yang dimasak dapur hari ini untuk memuat takaran standar:
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {MENU_PAKET_PRESETS.map((preset, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectPreset(idx)}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Image source={{ uri: preset.foto }} style={[styles.presetImg, { borderRadius: radius.sm }]} />
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: isSelected ? colors.primary : colors.text,
                        width: 140,
                      }}
                    >
                      {preset.nama}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>

          {/* Form Rincian Nutrisi Pokok */}
          <Card style={{ gap: spacing.md }}>
            <SectionTitle style={{ marginBottom: 0 }}>Formulir Kandungan Gizi Pokok</SectionTitle>

            {/* Target Penerima */}
            <DropdownPicker
              label="Kelompok Target Penerima Manfaat"
              icon="users"
              value={targetPenerima}
              options={TARGET_OPTIONS.map((t) => ({ label: `${t.label} (Standar: ${t.standardKcal})`, value: t.value }))}
              onSelect={(val) => setTargetPenerima(val as any)}
            />

            {/* Total Kalori */}
            <View style={{ gap: 4 }}>
              <Input
                label="Total Energi / Kalori (kkal) *"
                icon="zap"
                value={kaloriStr}
                onChangeText={setKaloriStr}
                keyboardType="numeric"
                placeholder="Contoh: 615"
              />
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                Standar BGN untuk {targetPenerima}: {activeTargetMeta?.standardKcal}
              </Text>
            </View>

            {/* Makronutrien Grid */}
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              KOMPOSISI MAKRONUTRIEN POKOK:
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Karbohidrat (g)"
                  value={karboStr}
                  onChangeText={setKarboStr}
                  keyboardType="numeric"
                  placeholder="78"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Protein Hewani (g)"
                  value={protHewaniStr}
                  onChangeText={setProtHewaniStr}
                  keyboardType="numeric"
                  placeholder="24"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Protein Nabati (g)"
                  value={protNabatiStr}
                  onChangeText={setProtNabatiStr}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Lemak Sehat (g)"
                  value={lemakStr}
                  onChangeText={setLemakStr}
                  keyboardType="numeric"
                  placeholder="18"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Serat Pangan (g)"
                  value={seratStr}
                  onChangeText={setSeratStr}
                  keyboardType="numeric"
                  placeholder="6.5"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Kalsium (mg)"
                  value={kalsiumStr}
                  onChangeText={setKalsiumStr}
                  keyboardType="numeric"
                  placeholder="240"
                />
              </View>
            </View>

            <Input
              label="Zat Besi (mg)"
              value={zatBesiStr}
              onChangeText={setZatBesiStr}
              keyboardType="numeric"
              placeholder="4.8"
            />

            {/* Toggle Bebas Alergen */}
            <Pressable
              onPress={() => setBebasAlergen(!bebasAlergen)}
              style={[
                styles.allergenToggle,
                {
                  backgroundColor: bebasAlergen ? colors.successBg : colors.dangerBg,
                  borderColor: bebasAlergen ? colors.success : colors.danger,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather name={bebasAlergen ? 'shield' : 'alert-triangle'} size={18} color={bebasAlergen ? colors.success : colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: bebasAlergen ? colors.success : colors.danger }}>
                  {bebasAlergen ? 'Bebas Bahan Alergen Utama (Aman)' : 'Mengandung Bahan Potensi Alergen'}
                </Text>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                  {bebasAlergen ? 'Tidak mengandung kacang, seafood, atau susu berlebih.' : 'Perlu peringatan alergi untuk siswa tertentu.'}
                </Text>
              </View>
              <Pill label={bebasAlergen ? 'Aman' : 'Peringatan'} tone={bebasAlergen ? 'success' : 'danger'} />
            </Pressable>

            {/* Upload Foto Sampel Porsi */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
                Foto Dokumentasi Sampel Porsi Hari Ini
              </Text>
              {fotoSampel ? (
                <View style={{ gap: 6 }}>
                  <Image source={{ uri: fotoSampel }} style={[styles.samplePreviewImg, { borderRadius: radius.md }]} />
                  <PrimaryButton label="Ganti Foto Sampel" icon="camera" variant="outline" onPress={pickSampleImage} />
                </View>
              ) : (
                <PrimaryButton label="Ambil Foto Sampel Sajian Porsi" icon="camera" variant="secondary" onPress={pickSampleImage} />
              )}
            </View>

            <Input
              label="Catatan & Rekomendasi Ahli Gizi"
              icon="file-text"
              value={catatan}
              onChangeText={setCatatan}
              placeholder="Tuliskan ulasan gizi dan kesesuaian porsi..."
              multiline
            />

            <PrimaryButton
              label="Simpan & Terbitkan Sertifikasi Gizi"
              icon="check-circle"
              onPress={handleSaveEvaluation}
            />
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT SERTIFIKASI GIZI                                           */}
      {/* ========================================================================= */}
      {activeTab === 'riwayat' && (
        <View style={{ gap: spacing.md }}>
          <SectionTitle
            action={
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                {kandunganGiziList.length} Laporan Tersertifikasi
              </Text>
            }
          >
            Daftar Sertifikasi Gizi Harian
          </SectionTitle>

          {kandunganGiziList.length === 0 ? (
            <EmptyState icon="activity" title="Belum Ada Data Gizi" body="Input evaluasi gizi pertama pada tab Input Kandungan Gizi." />
          ) : (
            kandunganGiziList.map((item) => (
              <Card key={item.id} onPress={() => setSelectedDetail(item)} style={{ gap: 8 }}>
                <View style={styles.rowBetween}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>{item.id} • {item.tanggal}</Text>
                  <Pill
                    label={item.statusKesesuaianAkg === 'sesuai' ? 'Standar AKG Terpenuhi' : 'Perlu Penyesuaian'}
                    tone={item.statusKesesuaianAkg === 'sesuai' ? 'success' : 'warning'}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  {item.fotoSampelMenu && (
                    <Image source={{ uri: item.fotoSampelMenu }} style={[styles.historyThumb, { borderRadius: radius.sm }]} />
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }} numberOfLines={2}>
                      {item.namaPaketMenu}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Sasaran: <Text style={{ fontWeight: '700', color: colors.text }}>{item.targetPenerima}</Text>
                    </Text>
                    <View style={{ marginTop: 2 }}>
                      <HppBadge info={resolveHpp(item.namaPaketMenu, masterMenuList, costPerMeal)} />
                    </View>
                  </View>
                </View>

                {/* Macro Summary Grid */}
                <View style={[styles.macroRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={styles.macroCol}>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>ENERGI</Text>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>{item.kalori} kkal</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>KARBO</Text>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{item.karbohidrat}g</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>PROTEIN</Text>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.success }}>{item.proteinHewani + item.proteinNabati}g</Text>
                  </View>
                  <View style={styles.macroCol}>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>LEMAK</Text>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{item.lemak}g</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                  Ahli Gizi: {item.namaAhliGizi} • Ketuk untuk detail lengkap
                </Text>
              </Card>
            ))
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETAIL KANDUNGAN GIZI LENGKAP                                       */}
      {/* ========================================================================= */}
      {selectedDetail && (
        <Modal
          visible={selectedDetail !== null}
          onClose={() => setSelectedDetail(null)}
          title={`Sertifikasi Gizi ${selectedDetail.id}`}
        >
          <ScrollView
            style={{ maxHeight: 540 }}
            contentContainerStyle={{ gap: spacing.md, paddingBottom: 28, paddingTop: 4 }}
          >
            {/* 1. Hero Kalori Banner */}
            <View style={[styles.detailHero, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>TOTAL NILAI ENERGI SAJIAN</Text>
              <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary }}>
                {selectedDetail.kalori} kkal
              </Text>
              <Pill label="Terverifikasi Ahli Gizi BGN" tone="success" />
            </View>

            {/* 2. Menu Info Card with Margin */}
            <View style={[styles.infoCard, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{selectedDetail.namaPaketMenu}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Tanggal Sajian: {selectedDetail.tanggal}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Kelompok Sasaran: {selectedDetail.targetPenerima}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Ahli Gizi: {selectedDetail.namaAhliGizi}</Text>
            </View>

            <HppBadge info={resolveHpp(selectedDetail.namaPaketMenu, masterMenuList, costPerMeal)} variant="block" />

            {/* Nutrisi Breakdown Table */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Rincian Kandungan Nutrisi Lengkap:</Text>
              
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Karbohidrat</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>{selectedDetail.karbohidrat} gram</Text>
              </View>
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Protein Hewani</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success }}>{selectedDetail.proteinHewani} gram</Text>
              </View>
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Protein Nabati</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success }}>{selectedDetail.proteinNabati} gram</Text>
              </View>
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Lemak Sehat</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>{selectedDetail.lemak} gram</Text>
              </View>
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Serat Pangan</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>{selectedDetail.serat} gram</Text>
              </View>
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Kalsium</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>{selectedDetail.kalsium} mg</Text>
              </View>
              <View style={[styles.nutriRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <Text style={{ fontSize: 11, color: colors.text, flex: 1 }}>Zat Besi</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>{selectedDetail.zatBesi} mg</Text>
              </View>
            </View>

            {/* Foto Sampel */}
            {selectedDetail.fotoSampelMenu && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Foto Sampel Sajian Porsi:</Text>
                <Image source={{ uri: selectedDetail.fotoSampelMenu }} style={[styles.detailPhoto, { borderRadius: radius.md }]} />
              </View>
            )}

            {/* Catatan Ahli Gizi */}
            <View style={[styles.catatanBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Catatan Evaluasi Ahli Gizi:</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 16 }}>
                {selectedDetail.catatanAhliGizi}
              </Text>
            </View>

            <PrimaryButton label="Tutup" variant="secondary" onPress={() => setSelectedDetail(null)} />
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  heroBanner: { padding: 14, gap: 10 },
  ahliGiziBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  segmentContainer: { flexDirection: 'row', padding: 4, gap: 4 },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presetCard: {
    padding: 8,
    borderWidth: 1.5,
    gap: 6,
    alignItems: 'center',
  },
  presetImg: { width: 140, height: 90, resizeMode: 'cover' },
  allergenToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
  },
  samplePreviewImg: { width: '100%', height: 160, resizeMode: 'cover' },
  historyThumb: { width: 56, height: 56, resizeMode: 'cover' },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  macroCol: { alignItems: 'center', flex: 1 },
  detailHero: { padding: 16, alignItems: 'center', gap: 6, marginBottom: 2 },
  infoCard: { padding: 12, borderWidth: 1, gap: 4, marginBottom: 2 },
  nutriRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailPhoto: { width: '100%', height: 200, resizeMode: 'cover' },
  catatanBox: { padding: 10, borderWidth: 1, gap: 4 },
});
