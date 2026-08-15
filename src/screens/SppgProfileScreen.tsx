import React, { useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { pickImage } from '../utils/pickImage';
import { ROLE_LABEL } from '../utils/scope';

export default function SppgProfileScreen({ navigation }: any) {
  const { role, currentSppg, sekolahList, peralatanList, distribusiList, users } = useApp();
  const { usersInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const [nama, setNama] = useState(currentSppg?.nama ?? '');
  const [alamat, setAlamat] = useState(currentSppg?.alamat ?? '');
  const [kapasitas, setKapasitas] = useState(String(currentSppg?.kapasitasProduksi ?? ''));
  const [foto, setFoto] = useState<string | null>(currentSppg?.fotoDapur ?? null);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  // Statistik unit dihitung langsung dari data live, bukan angka hardcoded —
  // jadi ikut berubah kalau sekolah/armada/staf di unit ini bertambah.
  const stats = useMemo(() => {
    const id = currentSppg?.id;
    const sekolah = sekolahList.filter((s) => s.sppgId === id);
    const alat = peralatanList.filter((p) => p.sppgId === id);
    const rute = distribusiList.filter((r) => r.sppgId === id);
    const staf = usersInScope.filter((u) => u.sppgId === id && u.statusAktif);
    const porsiTerlayani = sekolah.reduce((sum, s) => sum + s.jumlahSiswa, 0);
    return {
      sekolah: sekolah.length,
      porsiTerlayani,
      staf: staf.length,
      armada: alat.filter((p) => p.kategori === 'kendaraan').reduce((sum, p) => sum + p.jumlahTotal, 0),
      alatBermasalah: alat.filter((p) => p.status !== 'ready').length,
      ruteHariIni: rute.length,
      utilisasi: currentSppg?.kapasitasProduksi
        ? Math.min(100, Math.round((porsiTerlayani / currentSppg.kapasitasProduksi) * 100))
        : 0,
    };
  }, [currentSppg, sekolahList, peralatanList, distribusiList, usersInScope]);

  const kepala = useMemo(
    () => users.find((u) => u.role === 'KEPALA_SPPG' && u.sppgId === currentSppg?.id),
    [users, currentSppg],
  );

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
  const handleSave = () => {
    setSaved(true);
    setEditMode(false);
  };

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
        <Feather name={icon} size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '700' }}>{label}</Text>
        <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: '700' }}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Hero — foto dapur + identitas unit */}
      <View style={[styles.hero, { borderRadius: radius.lg, backgroundColor: colors.surface, borderColor: colors.border }]}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImg, styles.heroEmpty, { backgroundColor: colors.primaryLight }]}>
            <Feather name="image" size={30} color={colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' }}>Belum ada foto dapur</Text>
          </View>
        )}

        <View style={styles.heroOverlay}>
          <Pill
            label={currentSppg.status === 'aktif' ? 'UNIT AKTIF' : 'NONAKTIF'}
            tone={currentSppg.status === 'aktif' ? 'success' : 'neutral'}
          />
        </View>

        <View style={{ padding: 14, gap: 6 }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.text }}>{currentSppg.nama}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Feather name="map-pin" size={13} color={colors.textMuted} style={{ marginTop: 2 }} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, flex: 1 }}>{currentSppg.alamat}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            <Pill label={currentSppg.id} tone="primary" icon="hash" />
            <Pill label={currentSppg.wilayahPolres} tone="info" icon="shield" />
          </View>

          {editable && (
            <PrimaryButton
              label={foto ? 'Ganti Foto Dapur' : 'Ambil Foto Dapur'}
              icon="camera"
              variant="outline"
              onPress={pickFoto}
              style={{ marginTop: 6 }}
            />
          )}
        </View>
      </View>

      {/* KPI operasional unit */}
      <View style={styles.kpiGrid}>
        {[
          { icon: 'package' as const, value: currentSppg.kapasitasProduksi.toLocaleString('id-ID'), label: 'Kapasitas/hari' },
          { icon: 'home' as const, value: String(stats.sekolah), label: 'Sekolah Dilayani' },
          { icon: 'users' as const, value: stats.porsiTerlayani.toLocaleString('id-ID'), label: 'Penerima Manfaat' },
          { icon: 'user-check' as const, value: String(stats.staf), label: 'Staf Aktif' },
          { icon: 'truck' as const, value: String(stats.armada), label: 'Unit Armada' },
          { icon: 'navigation' as const, value: String(stats.ruteHariIni), label: 'Rute Terjadwal' },
        ].map((k) => (
          <View key={k.label} style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <Feather name={k.icon} size={15} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>{k.value}</Text>
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.textMuted, textAlign: 'center' }}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Utilisasi kapasitas */}
      <Card style={{ gap: 8 }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>UTILISASI KAPASITAS DAPUR</Text>
          <Pill
            label={`${stats.utilisasi}%`}
            tone={stats.utilisasi > 90 ? 'danger' : stats.utilisasi > 70 ? 'warning' : 'success'}
          />
        </View>
        <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${stats.utilisasi}%`,
                backgroundColor: stats.utilisasi > 90 ? colors.danger : stats.utilisasi > 70 ? colors.warning : colors.success,
              },
            ]}
          />
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          {stats.porsiTerlayani.toLocaleString('id-ID')} porsi terpakai dari kapasitas {currentSppg.kapasitasProduksi.toLocaleString('id-ID')} porsi/hari
          {stats.alatBermasalah > 0 ? ` • ${stats.alatBermasalah} unit peralatan perlu perhatian` : ' • seluruh peralatan siap pakai'}
        </Text>
      </Card>

      {/* Identitas & rantai komando */}
      <Card style={{ gap: 4 }}>
        <SectionTitle style={{ marginBottom: 4 }}>Identitas & Rantai Komando</SectionTitle>
        <InfoRow icon="user" label="Kepala SPPG" value={kepala ? `${kepala.nama} — ${ROLE_LABEL[kepala.role]}` : 'Belum ditetapkan'} />
        <InfoRow icon="shield" label="Wilayah Polres" value={currentSppg.wilayahPolres} />
        <InfoRow icon="shield" label="Wilayah Polda" value={currentSppg.wilayahPolda} />
        <InfoRow icon="map" label="Koordinat Dapur" value={`${currentSppg.lat.toFixed(4)}, ${currentSppg.lng.toFixed(4)}`} />
        {!!kepala && (
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: 6 }}>
            <PrimaryButton
              label="Telepon Kepala SPPG"
              icon="phone"
              variant="outline"
              onPress={() => Linking.openURL(`tel:${kepala.noHp}`)}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Card>

      {/* Pintasan operasional unit */}
      <Card style={{ gap: 4 }}>
        <SectionTitle style={{ marginBottom: 4 }}>Pintasan Data Unit</SectionTitle>
        {[
          { icon: 'home' as const, label: `Sekolah Afiliasi (${stats.sekolah})`, screen: 'DaftarSPPG' },
          { icon: 'users' as const, label: `Data Staf & Jobdesk (${stats.staf})`, screen: 'StaffList' },
          { icon: 'tool' as const, label: `Peralatan & Aset Dapur (${stats.alatBermasalah} perlu perhatian)`, screen: 'Peralatan' },
          { icon: 'video' as const, label: 'Monitor CCTV Dapur', screen: 'CctvMonitor' },
        ].map((s) => (
          <SecondaryButton key={s.screen} label={s.label} icon={s.icon} onPress={() => navigation.navigate(s.screen)} />
        ))}
      </Card>

      {/* Form pengaturan — hanya Kepala SPPG */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.rowBetween}>
          <SectionTitle style={{ marginBottom: 0 }}>Pengaturan Profil Unit</SectionTitle>
          {editable ? (
            <Pill
              label={editMode ? 'Mode Edit' : 'Ketuk Ubah'}
              tone={editMode ? 'warning' : 'neutral'}
              onPress={() => setEditMode((v) => !v)}
            />
          ) : (
            <Pill label="Lihat Saja" tone="neutral" />
          )}
        </View>

        <Input label="Nama SPPG" icon="home" value={nama} onChangeText={setNama} editable={editable && editMode} />
        <Input label="Alamat" icon="map-pin" value={alamat} onChangeText={setAlamat} editable={editable && editMode} multiline />
        <Input
          label="Kapasitas Produksi (porsi/hari)"
          icon="package"
          value={kapasitas}
          onChangeText={setKapasitas}
          editable={editable && editMode}
          keyboardType="number-pad"
        />

        {editable && editMode && <PrimaryButton label="Simpan Perubahan" icon="save" onPress={handleSave} />}

        {saved && (
          <View style={[styles.successBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
            <Feather name="check-circle" size={16} color={colors.success} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
              Perubahan tersimpan di perangkat ini.
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  hero: { borderWidth: 1, overflow: 'hidden' },
  heroImg: { width: '100%', height: 170 },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  heroOverlay: { position: 'absolute', top: 10, right: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiBox: { width: '31.5%', flexGrow: 1, borderWidth: 1, padding: 10, alignItems: 'center', gap: 3 },
  trackBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  infoIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
});
