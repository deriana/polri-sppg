import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, Pill, PrimaryButton, SectionTitle, StatusBadge, Stepper } from '../components/ui';
import { AlertTingkat } from '../types';
import { JENIS_MAKANAN_MASA_SIMPAN } from '../data/foodSafetyLog';
import { estimateKadaluarsa } from '../utils/foodSafety';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { getSimulatedSuhuReading } from '../utils/mockIotSensor';

const JENIS_OPTIONS = Object.keys(JENIS_MAKANAN_MASA_SIMPAN).map((k) => ({ label: k, value: k }));

const KADALUARSA_TO_TINGKAT: Record<string, AlertTingkat> = {
  aman: 'normal',
  mendekati_batas: 'perhatian',
  lewat_batas: 'emergency',
};
const KADALUARSA_LABEL: Record<string, string> = {
  aman: 'Aman',
  mendekati_batas: 'Mendekati Batas',
  lewat_batas: 'Lewat Batas',
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function FoodSafetyFormScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, submitFoodSafetyLog } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [suhu, setSuhu] = useState(5);
  // Fase 2: skema data mendukung field ini diisi otomatis dari sensor IoT tanpa
  // ubah struktur data (lihat FoodSafetyLog.sumberSuhu di types/index.ts). Saat ini
  // hanya tombol simulasi di bawah yang bisa mengisi 'sensor_iot'.
  const [sumberSuhu, setSumberSuhu] = useState<'manual' | 'sensor_iot'>('manual');
  const [waktuUkurSuhu, setWaktuUkurSuhu] = useState(nowTime());
  const [waktuProduksi, setWaktuProduksi] = useState(nowTime());
  const [waktuPengiriman, setWaktuPengiriman] = useState('');
  const [jenisMakanan, setJenisMakanan] = useState(JENIS_OPTIONS[0].value);
  const [submitted, setSubmitted] = useState(false);

  if (!role || !currentUser || !currentSppg || ROLE_PERMISSIONS[role].isViewOnly) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Peran Anda tidak dapat mencatat data keamanan pangan." />
      </View>
    );
  }

  const waktuProduksiFull = `${todayDate()} ${waktuProduksi}`;
  const estimate = useMemo(() => estimateKadaluarsa(waktuProduksiFull, jenisMakanan), [waktuProduksiFull, jenisMakanan]);
  const tingkat = KADALUARSA_TO_TINGKAT[estimate.statusKadaluarsa];

  const ambilDariSensor = () => {
    const reading = getSimulatedSuhuReading();
    if (reading.deviceStatus === 'offline') {
      Alert.alert('Sensor Offline (Simulasi)', 'Sensor IoT sedang offline pada simulasi ini. Silakan isi suhu secara manual.');
      return;
    }
    setSuhu(reading.suhu);
    setSumberSuhu('sensor_iot');
  };

  const submit = async () => {
    const log = {
      id: `FSL-${Date.now()}`,
      sppgId: currentSppg.id,
      tanggal: todayDate(),
      suhuPenyimpanan: suhu,
      waktuUkurSuhu,
      waktuProduksi: waktuProduksiFull,
      waktuPengiriman: waktuPengiriman || null,
      jenisMakanan,
      estimasiKadaluarsa: estimate.estimasiKadaluarsa,
      statusKadaluarsa: estimate.statusKadaluarsa,
      sumberSuhu,
    };
    submitFoodSafetyLog(log);
    await addToOfflineQueue('food_safety_log', log);
    setSubmitted(true);
    const isAlertRaised = estimate.statusKadaluarsa === 'lewat_batas' || suhu > 8;
    Alert.alert(
      'Data Tersimpan',
      isAlertRaised ? 'Suhu/masa simpan di luar batas aman — alert darurat otomatis dibuat.' : 'Data keamanan pangan berhasil dicatat.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Purpose Explanation Card */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="shield" size={18} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              SERTIFIKASI KEAMANAN PANGAN (FOOD SAFETY)
            </Text>
          </View>
          <Pill label="Pengujian Siap Saji" tone="primary" />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          Berbeda dari Gudang (bahan mentah), modul ini khusus sertifikasi & pengujian makanan matang sebelum pengiriman (Suhu Thermal Box &gt;60°C, Uji Organoleptik Rasa/Aroma, & Sampel Retensi 24 jam).
        </Text>
      </Card>

      <SectionTitle>Catat Keamanan Pangan</SectionTitle>

      <Card style={{ gap: spacing.md }}>
        <DropdownPicker label="Jenis Makanan" icon="package" value={jenisMakanan} options={JENIS_OPTIONS} onSelect={setJenisMakanan} />
        <Stepper
          label="Suhu Penyimpanan (°C)"
          value={suhu}
          onChange={(v) => {
            setSuhu(v);
            setSumberSuhu('manual');
          }}
          step={0.5}
          min={-20}
          max={60}
          unit="°C"
        />
        <View style={{ gap: spacing.xs }}>
          <PrimaryButton label="Baca Sensor IoT Gudang Real-Time" icon="cpu" variant="outline" onPress={ambilDariSensor} />
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
            Status Sensor IoT: Connected. Sumber suhu saat ini:{' '}
            {sumberSuhu === 'sensor_iot' ? 'Sensor IoT Real-Time' : 'Input Manual'}.
          </Text>
        </View>
        {suhu > 8 && (
          <View style={[styles.warnBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}>
            <Feather name="alert-triangle" size={16} color={colors.danger} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.danger, fontSize: fontSize.xs, flex: 1, fontWeight: '600' }}>
              Suhu melebihi ambang batas aman 8°C.
            </Text>
          </View>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle style={{ marginBottom: 0 }}>Waktu</SectionTitle>
        <TimeField label="Waktu Ukur Suhu" value={waktuUkurSuhu} onChangeText={setWaktuUkurSuhu} onNow={() => setWaktuUkurSuhu(nowTime())} />
        <TimeField label="Waktu Produksi" value={waktuProduksi} onChangeText={setWaktuProduksi} onNow={() => setWaktuProduksi(nowTime())} />
        <TimeField label="Waktu Pengiriman (opsional)" value={waktuPengiriman} onChangeText={setWaktuPengiriman} onNow={() => setWaktuPengiriman(nowTime())} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }} action={<StatusBadge status={tingkat} />}>
          Estimasi Kadaluarsa
        </SectionTitle>
        <Text style={{ color: colors.text, fontSize: fontSize.lg, fontWeight: '800' }}>{estimate.estimasiKadaluarsa}</Text>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Status: {KADALUARSA_LABEL[estimate.statusKadaluarsa]}</Text>
        {estimate.statusKadaluarsa !== 'aman' && (
          <View style={[styles.warnBanner, { backgroundColor: tingkat === 'emergency' ? colors.dangerBg : colors.warningBg, borderRadius: radius.md }]}>
            <Feather name="alert-triangle" size={16} color={tingkat === 'emergency' ? colors.danger : colors.warning} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
              {tingkat === 'emergency' ? 'Makanan sudah melewati masa simpan aman.' : 'Makanan mendekati batas masa simpan aman.'}
            </Text>
          </View>
        )}
      </Card>

      <PrimaryButton label="Simpan Data" icon="save" onPress={submit} />
      {submitted && (
        <View style={[styles.successBanner, { backgroundColor: colors.successBg }]}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Tersimpan lokal — menunggu sinkron</Text>
        </View>
      )}
    </ScrollView>
  );
}

function TimeField({ label, value, onChangeText, onNow }: { label: string; value: string; onChangeText: (t: string) => void; onNow: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
      <Input label={label} value={value} onChangeText={onChangeText} placeholder="HH:mm" containerStyle={{ flex: 1 }} />
      <PrimaryButton label="Sekarang" variant="secondary" onPress={onNow} fullWidth={false} style={{ marginBottom: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
});
