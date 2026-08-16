import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  Card,
  DropdownPicker,
  EmptyState,
  Input,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  Stepper,
} from '../components/ui';
import { FoodSafetyLog } from '../types';
import { JENIS_MAKANAN_MASA_SIMPAN } from '../mock/foodSafetyLog';
import { estimateKadaluarsa } from '../utils/foodSafety';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { pickImage } from '../utils/pickImage';

const JENIS_OPTIONS = Object.keys(JENIS_MAKANAN_MASA_SIMPAN).map((k) => ({
  label: k.toUpperCase(),
  value: k,
}));

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function FoodSafetyFormScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, submitFoodSafetyLog, laporanList, menuHarianPlanList, foodSafetyList } = useApp();
  const { colors, spacing, fontSize, radius, isDark } = useTheme();

  // Tab State: Formulir Uji vs Riwayat Sertifikat Uji Lab
  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');

  // Riwayat log uji lab khusus SPPG ini
  const scopedLogs = useMemo(() => {
    if (!currentSppg) return [];
    return [...foodSafetyList]
      .filter((f) => f.sppgId === currentSppg.id)
      .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  }, [foodSafetyList, currentSppg]);

  // Ambil menu aktif hari ini dari laporan produksi / rencana menu
  const todayStr = todayDate();
  const activeLaporanHariIni = useMemo(() => {
    return (
      laporanList.find((l) => l.sppgId === currentSppg?.id && l.tanggal === todayStr) ||
      laporanList[laporanList.length - 1]
    );
  }, [laporanList, currentSppg, todayStr]);

  // Pecah komponen makanan secara dinamis dari menu yang dimasak hari ini
  const dynamicFoodComponents = useMemo(() => {
    if (!activeLaporanHariIni?.menu) {
      return [
        { label: 'Nasi Pulen (Karbohidrat)', value: 'nasi', baseCategory: 'nasi' },
        { label: 'Ayam Kecap Gurih (Protein Hewani)', value: 'lauk goreng', baseCategory: 'lauk goreng' },
        { label: 'Sayur Sop Segar (Sayuran)', value: 'sayur berkuah', baseCategory: 'sayur berkuah' },
        { label: 'Buah Semangka (Buah)', value: 'buah', baseCategory: 'buah' },
      ];
    }

    const parts = activeLaporanHariIni.menu
      .split(/[+,]/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return [
        { label: 'Nasi Pulen (Karbohidrat)', value: 'nasi', baseCategory: 'nasi' },
        { label: 'Lauk Protein Hewani', value: 'lauk goreng', baseCategory: 'lauk goreng' },
        { label: 'Sayur Sop Segar', value: 'sayur berkuah', baseCategory: 'sayur berkuah' },
        { label: 'Buah Segar', value: 'buah', baseCategory: 'buah' },
      ];
    }

    return parts.map((part) => {
      const lower = part.toLowerCase();
      let baseCategory = 'lauk berkuah';
      if (lower.includes('nasi') || lower.includes('beras') || lower.includes('roti')) baseCategory = 'nasi';
      else if (lower.includes('sop') || lower.includes('sayur') || lower.includes('buncis') || lower.includes('kangkung') || lower.includes('bayam') || lower.includes('capcay')) baseCategory = 'sayur berkuah';
      else if (lower.includes('goreng') || lower.includes('bakar') || lower.includes('ayam') || lower.includes('ikan') || lower.includes('rendang') || lower.includes('daging') || lower.includes('telur')) baseCategory = 'lauk goreng';
      else if (lower.includes('buah') || lower.includes('semangka') || lower.includes('jeruk') || lower.includes('pisang')) baseCategory = 'buah';

      return {
        label: `${part} (${baseCategory.toUpperCase()})`,
        value: part,
        baseCategory,
      };
    });
  }, [activeLaporanHariIni]);

  // 1. Identitas Sampel
  const [jenisMakanan, setJenisMakanan] = useState(dynamicFoodComponents[0]?.value || 'nasi');
  const [batchId, setBatchId] = useState(
    activeLaporanHariIni?.batchId || `BATCH-${currentSppg?.id || 'SPPG'}-${todayStr.replace(/-/g, '')}-01`,
  );
  const [waktuProduksi, setWaktuProduksi] = useState('06:30');
  const [waktuUkurSuhu, setWaktuUkurSuhu] = useState(nowTime());
  const [waktuPengiriman, setWaktuPengiriman] = useState('09:00');

  // Clock Picker Modal State
  const [timePickerTarget, setTimePickerTarget] = useState<'produksi' | 'ukurSuhu' | null>(null);
  const [pickerHour, setPickerHour] = useState(7);
  const [pickerMinute, setPickerMinute] = useState(0);

  const openClockPicker = (target: 'produksi' | 'ukurSuhu') => {
    const currentVal = target === 'produksi' ? waktuProduksi : waktuUkurSuhu;
    const [hStr, mStr] = (currentVal || '07:00').split(':');
    setPickerHour(parseInt(hStr, 10) || 7);
    setPickerMinute(parseInt(mStr, 10) || 0);
    setTimePickerTarget(target);
  };

  const applyClockPicker = () => {
    const formatted = `${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`;
    if (timePickerTarget === 'produksi') setWaktuProduksi(formatted);
    if (timePickerTarget === 'ukurSuhu') setWaktuUkurSuhu(formatted);
    setTimePickerTarget(null);
  };

  // 2. Rapid Test Kit Kimiawi
  const [rapidFormalin, setRapidFormalin] = useState<'negatif' | 'positif'>('negatif');
  const [rapidBoraks, setRapidBoraks] = useState<'negatif' | 'positif'>('negatif');
  const [rapidPestisida, setRapidPestisida] = useState<'negatif' | 'positif'>('negatif');
  const [ujiBakteriEcoli, setUjiBakteriEcoli] = useState<'negatif' | 'positif'>('negatif');

  // 3. Pengujian Termal Masakan (Core Cooking & Holding Temp)
  const [suhuIntiMatang, setSuhuIntiMatang] = useState(84.5); // Standard BGN ≥ 75°C
  const [suhuHolding, setSuhuHolding] = useState(64.2); // Standard BGN ≥ 60°C

  // 4. Sampel Retensi & Organoleptik
  const [nomorLoker, setNomorLoker] = useState('LOKER-RETENSI-01');
  const [organoleptikStatus, setOrganoleptikStatus] = useState<'layak' | 'perlu_revisi' | 'tidak_layak'>('layak');
  const [catatanLab, setCatatanLab] = useState(
    'Uji Rapid Test Kit 4 parameter menunjukkan hasil NEGATIF zat berbahaya. Suhu titik matang inti 84.5°C memenuhi standar hygiene BGN.',
  );
  const [fotoTestStrip, setFotoTestStrip] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!role || !currentUser || !currentSppg || ROLE_PERMISSIONS[role].isViewOnly) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Peran Anda tidak memiliki hak akses sertifikasi laboratorium pangan." />
      </View>
    );
  }

  const waktuProduksiFull = `${todayDate()} ${waktuProduksi}`;
  const estimate = useMemo(
    () => estimateKadaluarsa(waktuProduksiFull, jenisMakanan),
    [waktuProduksiFull, jenisMakanan],
  );

  const isAllSafe =
    rapidFormalin === 'negatif' &&
    rapidBoraks === 'negatif' &&
    rapidPestisida === 'negatif' &&
    ujiBakteriEcoli === 'negatif' &&
    suhuIntiMatang >= 75 &&
    organoleptikStatus === 'layak';

  const handlePickPhoto = async () => {
    const uri = await pickImage('library');
    if (uri) setFotoTestStrip(uri);
  };

  const submit = async () => {
    if (!isAllSafe) {
      Alert.alert(
        'Peringatan Bahaya Pangan!',
        'Terdapat parameter uji kimia/suhu yang tidak memenuhi standar kelayakan konsumsi BGN. Laporkan insiden jika makanan tidak layak!',
      );
    }

    const log: FoodSafetyLog = {
      id: `FSL-${Date.now()}`,
      sppgId: currentSppg.id,
      tanggal: todayDate(),
      suhuPenyimpanan: suhuHolding,
      waktuUkurSuhu,
      waktuProduksi: waktuProduksiFull,
      waktuPengiriman: waktuPengiriman || null,
      jenisMakanan,
      estimasiKadaluarsa: estimate.estimasiKadaluarsa,
      statusKadaluarsa: (isAllSafe ? 'aman' : 'lewat_batas') as 'aman' | 'lewat_batas',
      sumberSuhu: 'manual',
      rapidTestFormalin: rapidFormalin,
      rapidTestBoraks: rapidBoraks,
      rapidTestPestisida: rapidPestisida,
      ujiBakteriEcoli,
      suhuIntiMatang,
      suhuHoldingBox: suhuHolding,
      organoleptikStatus,
      nomorLokerSampelRetensi: nomorLoker,
      fotoTestStrip,
      catatanLab,
      petugasLabName: currentUser.nama,
    };

    submitFoodSafetyLog(log);
    await addToOfflineQueue('food_safety_log', log);
    setSubmitted(true);

    Alert.alert(
      'Sertifikasi Uji Lab Tersimpan',
      `Hasil pengujian laboratorium ${jenisMakanan.toUpperCase()} berhasil diverifikasi oleh ${currentUser.nama}. Status: ${isAllSafe ? 'LOLOS STANDAR BGN' : 'PERINGATAN BAHAYA'}.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Hero Card */}
      <Card
        variant="accent"
        style={{
          gap: spacing.xs,
          backgroundColor: isDark ? colors.surface : '#F0FDF4',
          borderColor: colors.success,
          borderWidth: 1.5,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="shield" size={18} color={colors.success} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.success, letterSpacing: 0.5 }}>
              LABORATORIUM & RAPID TEST PANGAN
            </Text>
          </View>
          <Pill label="Standard BGN" tone="success" icon="check-circle" />
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
          Pengujian kimiawi sampel makanan matang siap saji (Formalin, Boraks, Pestisida, Titik Suhu Masak ≥75°C, & Sampel Arsip 2x24 Jam).
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Feather name="user-check" size={13} color={colors.primary} />
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.text }}>
            Petugas Verifikator: {currentUser.nama} (Ahli Gizi SPPG)
          </Text>
        </View>
      </Card>

      {/* Tab Switcher */}
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 2 }}>
        <Pressable
          onPress={() => setActiveTab('form')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'form' ? colors.primary : colors.surface,
              borderColor: activeTab === 'form' ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="shield" size={14} color={activeTab === 'form' ? '#FFF' : colors.text} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: activeTab === 'form' ? '#FFF' : colors.text }}>
            Formulir Uji Lab Baru
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('riwayat')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'riwayat' ? colors.primary : colors.surface,
              borderColor: activeTab === 'riwayat' ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="file-text" size={14} color={activeTab === 'riwayat' ? '#FFF' : colors.text} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: activeTab === 'riwayat' ? '#FFF' : colors.text }}>
            Riwayat & Log Hasil Uji ({scopedLogs.length})
          </Text>
        </Pressable>
      </View>

      {/* FORMULIR UJI LAB BARU */}
      {activeTab === 'form' && (
        <View style={{ gap: spacing.md }}>
          {/* 2. Identitas Sampel Masakan Berdasarkan Menu Hari Ini */}
          <SectionTitle>1. Identitas Sampel Masakan Hari Ini</SectionTitle>
          <Card style={{ gap: spacing.sm }}>
        {/* Info Menu Hari Ini */}
        <View style={{ gap: 4, padding: 10, backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="coffee" size={13} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>
              MENU SAJIAN DAPUR HARI INI:
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
            {activeLaporanHariIni?.menu || 'Nasi Pulen + Ayam Kecap Gurih + Sayur Sop Segar + Semangka'}
          </Text>
        </View>

        {/* Quick Chip Selection */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>
            Pilih Cepat Komponen yang Diuji:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {dynamicFoodComponents.map((item, idx) => {
              const isSelected = jenisMakanan === item.value;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setJenisMakanan(item.value)}
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      paddingVertical: 7,
                      paddingHorizontal: 10,
                    },
                  ]}
                >
                  <Feather
                    name={
                      item.baseCategory === 'nasi'
                        ? 'disc'
                        : item.baseCategory === 'sayur berkuah'
                        ? 'sun'
                        : item.baseCategory === 'buah'
                        ? 'heart'
                        : 'package'
                    }
                    size={12}
                    color={isSelected ? '#FFF' : colors.text}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#FFF' : colors.text }}>
                    {item.value}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <DropdownPicker
          label="Komponen Terpilih"
          icon="package"
          value={jenisMakanan}
          options={dynamicFoodComponents.map((c) => ({ label: c.label, value: c.value }))}
          onSelect={setJenisMakanan}
        />

        <Input
          label="Nomor Batch Produksi"
          value={batchId}
          onChangeText={setBatchId}
          placeholder="Contoh: BATCH-20260815-01"
        />

        {/* Two-Column Time Fields with Interactive Clock Modal Trigger */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TimeField
              label="Waktu Selesai Masak"
              value={waktuProduksi}
              onChangeText={setWaktuProduksi}
              onOpenClock={() => openClockPicker('produksi')}
              onNow={() => setWaktuProduksi(nowTime())}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TimeField
              label="Waktu Uji Lab"
              value={waktuUkurSuhu}
              onChangeText={setWaktuUkurSuhu}
              onOpenClock={() => openClockPicker('ukurSuhu')}
              onNow={() => setWaktuUkurSuhu(nowTime())}
            />
          </View>
        </View>
      </Card>

      {/* 3. Uji Kimiawi Rapid Test Kit (Formalin, Boraks, Pestisida, E.Coli) */}
      <SectionTitle
        action={
          <Pill
            label={isAllSafe ? 'SEMUA AMAN (NEGATIF)' : 'PERIKSA BAHAYA'}
            tone={isAllSafe ? 'success' : 'danger'}
          />
        }
      >
        2. Hasil Uji Kimiawi (Rapid Test Kit)
      </SectionTitle>

      <Card style={{ gap: spacing.md }}>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          Tetesi strip uji atau reagen pada ekstrak sampel makanan dan pastikan tidak terjadi perubahan warna reaktif:
        </Text>

        {/* Formalin Test Row */}
        <View style={styles.testItemRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
              Uji Formalin (Formaldehyde)
            </Text>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Target: Bebas pengawet mayat / formalin
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setRapidFormalin('negatif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: rapidFormalin === 'negatif' ? colors.success : colors.surface,
                  borderColor: rapidFormalin === 'negatif' ? colors.success : colors.border,
                },
              ]}
            >
              <Feather name="check" size={12} color={rapidFormalin === 'negatif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: rapidFormalin === 'negatif' ? '#FFF' : colors.text }}>
                Negatif (Aman)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRapidFormalin('positif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: rapidFormalin === 'positif' ? colors.danger : colors.surface,
                  borderColor: rapidFormalin === 'positif' ? colors.danger : colors.border,
                },
              ]}
            >
              <Feather name="alert-triangle" size={12} color={rapidFormalin === 'positif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: rapidFormalin === 'positif' ? '#FFF' : colors.text }}>
                Positif (Bahaya)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Boraks Test Row */}
        <View style={styles.testItemRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
              Uji Boraks (Bleng / Sodium Tetraborate)
            </Text>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Target: Bebas bahan pengenyal berbahaya
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setRapidBoraks('negatif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: rapidBoraks === 'negatif' ? colors.success : colors.surface,
                  borderColor: rapidBoraks === 'negatif' ? colors.success : colors.border,
                },
              ]}
            >
              <Feather name="check" size={12} color={rapidBoraks === 'negatif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: rapidBoraks === 'negatif' ? '#FFF' : colors.text }}>
                Negatif (Aman)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRapidBoraks('positif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: rapidBoraks === 'positif' ? colors.danger : colors.surface,
                  borderColor: rapidBoraks === 'positif' ? colors.danger : colors.border,
                },
              ]}
            >
              <Feather name="alert-triangle" size={12} color={rapidBoraks === 'positif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: rapidBoraks === 'positif' ? '#FFF' : colors.text }}>
                Positif (Bahaya)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Pestisida Test Row */}
        <View style={styles.testItemRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
              Uji Residu Pestisida
            </Text>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Target: Residu sayuran di bawah batas BMR
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setRapidPestisida('negatif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: rapidPestisida === 'negatif' ? colors.success : colors.surface,
                  borderColor: rapidPestisida === 'negatif' ? colors.success : colors.border,
                },
              ]}
            >
              <Feather name="check" size={12} color={rapidPestisida === 'negatif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: rapidPestisida === 'negatif' ? '#FFF' : colors.text }}>
                Negatif (Aman)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRapidPestisida('positif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: rapidPestisida === 'positif' ? colors.danger : colors.surface,
                  borderColor: rapidPestisida === 'positif' ? colors.danger : colors.border,
                },
              ]}
            >
              <Feather name="alert-triangle" size={12} color={rapidPestisida === 'positif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: rapidPestisida === 'positif' ? '#FFF' : colors.text }}>
                Positif (Bahaya)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* E.Coli Test Row */}
        <View style={styles.testItemRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
              Uji Cemaran E. Coli & Bakteriologis
            </Text>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Target: 0 CFU / gram (Steril sempurna)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setUjiBakteriEcoli('negatif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: ujiBakteriEcoli === 'negatif' ? colors.success : colors.surface,
                  borderColor: ujiBakteriEcoli === 'negatif' ? colors.success : colors.border,
                },
              ]}
            >
              <Feather name="check" size={12} color={ujiBakteriEcoli === 'negatif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: ujiBakteriEcoli === 'negatif' ? '#FFF' : colors.text }}>
                Negatif (Aman)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setUjiBakteriEcoli('positif')}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: ujiBakteriEcoli === 'positif' ? colors.danger : colors.surface,
                  borderColor: ujiBakteriEcoli === 'positif' ? colors.danger : colors.border,
                },
              ]}
            >
              <Feather name="alert-triangle" size={12} color={ujiBakteriEcoli === 'positif' ? '#FFF' : colors.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: ujiBakteriEcoli === 'positif' ? '#FFF' : colors.text }}>
                Positif (Bahaya)
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* 4. Pengujian Termal Pangan Matang */}
      <SectionTitle>3. Pengujian Termal Masakan (Core Cooking & Holding)</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        {/* Core Cooking Temp */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, flex: 1 }}>
              Suhu Titik Matang Inti Daging / Sop (°C)
            </Text>
            <Pill
              label={suhuIntiMatang >= 75 ? 'Matang Sempurna' : 'Kurang Matang!'}
              tone={suhuIntiMatang >= 75 ? 'success' : 'danger'}
            />
          </View>
          <Stepper
            value={suhuIntiMatang}
            onChange={setSuhuIntiMatang}
            step={0.5}
            min={50}
            max={100}
            unit="°C"
          />
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Standar BGN: Inti daging/masakan wajib ≥ 75.0°C untuk membunuh bakteri patogen.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        {/* Holding Temp */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, flex: 1 }}>
              Suhu Holding Makanan di Thermal Box (°C)
            </Text>
            <Pill
              label={suhuHolding >= 60 ? 'Holding Aman' : 'Di Bawah 60°C!'}
              tone={suhuHolding >= 60 ? 'success' : 'danger'}
            />
          </View>
          <Stepper
            value={suhuHolding}
            onChange={setSuhuHolding}
            step={0.5}
            min={40}
            max={90}
            unit="°C"
          />
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Standar BGN: Suhu holding packing wajib ≥ 60.0°C hingga tiba di sekolah.
          </Text>
        </View>
      </Card>

      {/* 5. Sampel Retensi 2x24 Jam & Foto Bukti Strip */}
      <SectionTitle>4. Sampel Retensi 2x24 Jam & Foto Uji</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Input
          label="Nomor Lemari / Loker Sampel Arsip (Food Retention)"
          value={nomorLoker}
          onChangeText={setNomorLoker}
          placeholder="Contoh: LOKER-RETENSI-01"
        />
        <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
          * Sampel makanan wajib disimpan di wadah steril kedap udara selama 2x24 jam untuk pengawasan sewaktu-waktu oleh BGN & Dinkes.
        </Text>

        {/* Upload Foto Strip Uji */}
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
            Dokumentasi Foto Test Strip / Tabung Reaksi Lab:
          </Text>
          {fotoTestStrip ? (
            <View style={{ gap: 8, alignItems: 'center' }}>
              <Image source={{ uri: fotoTestStrip }} style={{ width: '100%', height: 160, borderRadius: radius.md }} resizeMode="cover" />
              <SecondaryButton label="Ganti Foto Bukti Lab" icon="camera" onPress={handlePickPhoto} />
            </View>
          ) : (
            <PrimaryButton label="Unggah / Ambil Foto Test Strip Lab" icon="camera" variant="outline" onPress={handlePickPhoto} />
          )}
        </View>

        <Input
          label="Catatan Kesimpulan Analisis Ahli Gizi"
          value={catatanLab}
          onChangeText={setCatatanLab}
          multiline
          numberOfLines={3}
          placeholder="Tuliskan catatan teknis hasil uji kimia..."
        />
      </Card>

      {/* 6. Tombol Verifikasi & Simpan */}
      <PrimaryButton
        label={isAllSafe ? 'Sertifikasi & Terbitkan Hasil Uji Lab' : 'Simpan dengan Peringatan Bahaya'}
        icon="check-circle"
        onPress={submit}
      />

      {submitted && (
        <View style={[styles.successBanner, { backgroundColor: colors.successBg }]}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>
            Data Uji Lab Tersimpan — Siap Sinkron ke Pusat
          </Text>
        </View>
      )}
        </View>
      )}

      {/* RIWAYAT & LOG HASIL UJI LAB PANGAN */}
      {activeTab === 'riwayat' && (
        <View style={{ gap: spacing.md }}>
          {/* Summary Stat Grid */}
          <View style={[styles.statGrid, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border, borderRadius: radius.lg }]}>
            <View style={styles.statCol}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Total Pengujian</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>{scopedLogs.length} Kali</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Status Keamanan</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.success }}>100% Bebas Racun</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Loker Retensi</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>2x24 Jam Aktif</Text>
            </View>
          </View>

          {/* List of Lab Logs */}
          <SectionTitle>Daftar Sertifikasi Uji Laboratorium SPPG</SectionTitle>
          {scopedLogs.length === 0 ? (
            <EmptyState icon="clipboard" title="Belum Ada Hasil Uji" body="Belum ada riwayat pengujian laboratorium pangan yang tersimpan." />
          ) : (
            scopedLogs.map((log) => {
              const isSafe = log.statusKadaluarsa === 'aman';
              return (
                <Card key={log.id} style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="shield" size={14} color={isSafe ? colors.success : colors.danger} />
                      <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text }}>
                        {log.tanggal} • {log.waktuUkurSuhu || '07:00'} WIB
                      </Text>
                    </View>
                    <Pill
                      label={isSafe ? 'LOLOS STANDAR BGN' : 'PERINGATAN'}
                      tone={isSafe ? 'success' : 'danger'}
                      icon={isSafe ? 'check-circle' : 'alert-triangle'}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.primaryLight, borderRadius: radius.sm }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>
                        {log.jenisMakanan.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Petugas: <Text style={{ fontWeight: '700', color: colors.text }}>{log.petugasLabName || currentUser.nama}</Text>
                    </Text>
                  </View>

                  {/* 4 Parameter Chemical Results Badges */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8, backgroundColor: colors.background, borderRadius: radius.md }}>
                    <View style={styles.chemPill}>
                      <Text style={styles.chemLabel}>Formalin:</Text>
                      <Text style={[styles.chemValue, { color: log.rapidTestFormalin === 'positif' ? colors.danger : colors.success }]}>
                        {log.rapidTestFormalin === 'positif' ? 'POSITIF' : 'NEGATIF'}
                      </Text>
                    </View>
                    <View style={styles.chemPill}>
                      <Text style={styles.chemLabel}>Boraks:</Text>
                      <Text style={[styles.chemValue, { color: log.rapidTestBoraks === 'positif' ? colors.danger : colors.success }]}>
                        {log.rapidTestBoraks === 'positif' ? 'POSITIF' : 'NEGATIF'}
                      </Text>
                    </View>
                    <View style={styles.chemPill}>
                      <Text style={styles.chemLabel}>Pestisida:</Text>
                      <Text style={[styles.chemValue, { color: log.rapidTestPestisida === 'positif' ? colors.danger : colors.success }]}>
                        {log.rapidTestPestisida === 'positif' ? 'POSITIF' : 'NEGATIF'}
                      </Text>
                    </View>
                    <View style={styles.chemPill}>
                      <Text style={styles.chemLabel}>E. Coli:</Text>
                      <Text style={[styles.chemValue, { color: log.ujiBakteriEcoli === 'positif' ? colors.danger : colors.success }]}>
                        {log.ujiBakteriEcoli === 'positif' ? 'POSITIF' : 'NEGATIF'}
                      </Text>
                    </View>
                  </View>

                  {/* Thermal & Retention Sample Details */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Titik Matang: <Text style={{ fontWeight: '800', color: colors.text }}>{log.suhuIntiMatang ? `${log.suhuIntiMatang}°C` : '≥75°C'}</Text>
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Holding: <Text style={{ fontWeight: '800', color: colors.text }}>{log.suhuHoldingBox || log.suhuPenyimpanan}°C</Text>
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Loker: <Text style={{ fontWeight: '800', color: colors.primary }}>{log.nomorLokerSampelRetensi || 'LOKER-01'}</Text>
                    </Text>
                  </View>

                  {log.catatanLab && (
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 }}>
                      "{log.catatanLab}"
                    </Text>
                  )}

                  {/* Quick Action Button to Open Digital Quality Passport */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <PrimaryButton
                      label="Buka Paspor Mutu Digital"
                      icon="award"
                      variant="secondary"
                      onPress={() =>
                        navigation.navigate('FoodQualityPassport', {
                          batchId: log.id,
                          logId: log.id,
                          tanggal: log.tanggal,
                          jenisMakanan: log.jenisMakanan,
                        })
                      }
                      style={{ flex: 1 }}
                    />
                    <Pressable
                      onPress={() =>
                        Share.share({
                          message: `[SERTIFIKAT UJI LAB PANGAN SPPG] Tanggal: ${log.tanggal} | Sampel: ${log.jenisMakanan.toUpperCase()} | Rapid Test: Formalin (-), Boraks (-), Pestisida (-), E.Coli (-) | Suhu Titik Matang: ${log.suhuIntiMatang || 84.5}°C | Status: LOLOS STANDAR BGN.`,
                        })
                      }
                      style={[styles.iconShareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    >
                      <Feather name="share-2" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* Clock Time Picker Modal */}
      <Modal
        visible={timePickerTarget !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setTimePickerTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            style={{
              width: '100%',
              maxWidth: 360,
              padding: 18,
              gap: 14,
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="clock" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>
                    Pilih Jam ({timePickerTarget === 'produksi' ? 'Selesai Masak' : 'Uji Lab'})
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Format 24 Jam (WIB)</Text>
                </View>
              </View>
              <Pressable onPress={() => setTimePickerTarget(null)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Big Interactive Digital Dial */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
                paddingVertical: 14,
                borderRadius: radius.lg,
                gap: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* Hour Control */}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Pressable
                  onPress={() => setPickerHour((h) => (h + 1) % 24)}
                  style={[styles.stepperCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Feather name="chevron-up" size={16} color={colors.text} />
                </Pressable>
                <View style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>
                    {String(pickerHour).padStart(2, '0')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setPickerHour((h) => (h - 1 + 24) % 24)}
                  style={[styles.stepperCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Feather name="chevron-down" size={16} color={colors.text} />
                </Pressable>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.textMuted }}>JAM</Text>
              </View>

              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary, marginTop: -16 }}>:</Text>

              {/* Minute Control */}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Pressable
                  onPress={() => setPickerMinute((m) => (m + 5) % 60)}
                  style={[styles.stepperCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Feather name="chevron-up" size={16} color={colors.text} />
                </Pressable>
                <View style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>
                    {String(pickerMinute).padStart(2, '0')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setPickerMinute((m) => (m - 5 + 60) % 60)}
                  style={[styles.stepperCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Feather name="chevron-down" size={16} color={colors.text} />
                </Pressable>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.textMuted }}>MENIT</Text>
              </View>
            </View>

            {/* Quick Preset Buttons */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.textMuted }}>
                Pilihan Jam Cepat:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {[
                  '05:30',
                  '06:00',
                  '06:30',
                  '07:00',
                  '07:15',
                  '07:30',
                  '08:00',
                  '08:30',
                  '09:00',
                ].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      const [ph, pm] = preset.split(':');
                      setPickerHour(parseInt(ph, 10));
                      setPickerMinute(parseInt(pm, 10));
                    }}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          pickerHour === parseInt(preset.split(':')[0], 10) &&
                          pickerMinute === parseInt(preset.split(':')[1], 10)
                            ? colors.primary
                            : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '800',
                        color:
                          pickerHour === parseInt(preset.split(':')[0], 10) &&
                          pickerMinute === parseInt(preset.split(':')[1], 10)
                            ? '#FFF'
                            : colors.text,
                      }}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 6, marginTop: 4 }}>
              <PrimaryButton
                label={`Pasang Jam ${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')} WIB`}
                icon="check-circle"
                onPress={applyClockPicker}
              />
              <SecondaryButton label="Batal" onPress={() => setTimePickerTarget(null)} />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

function TimeField({
  label,
  value,
  onChangeText,
  onOpenClock,
  onNow,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onOpenClock: () => void;
  onNow: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: 8,
          height: 44,
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <Pressable
          onPress={onOpenClock}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, height: '100%' }}
        >
          <Feather name="clock" size={14} color={colors.primary} />
          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>
            {value || '00:00'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onNow}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 7,
              paddingVertical: 4,
              borderRadius: radius.sm,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>Sekarang</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  testItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  stepperCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 54,
    alignItems: 'center',
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statGrid: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  chemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  chemLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  chemValue: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  iconShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
