import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Pill, PrimaryButton, SectionTitle, Stepper } from '../components/ui';
import { LaporanProduksiFoto, MenuOption } from '../types';
import { ROLE_PERMISSIONS, canEditLaporan } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';
import { getCurrentGeotag } from '../utils/geotag';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { useScopedData } from '../hooks';

const MANUAL_MENU_VALUE = '__manual__';

// Small seeded menu catalog for the picker — falls back to free text + kategori
// gizi entry when the actual menu isn't one of these common combinations.
const MENU_OPTIONS: MenuOption[] = [
  { label: 'Nasi + Ayam Goreng + Tumis Kangkung + Pisang', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { label: 'Nasi + Rendang Daging + Sayur Asem + Jeruk', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { label: 'Nasi + Ikan Bakar + Tumis Buncis + Semangka', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { label: 'Nasi + Telur Balado + Sayur Bayam + Pepaya', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { label: 'Nasi + Perkedel Kentang + Sayur Lodeh + Jeruk', kategoriGizi: 'Karbohidrat, Protein Nabati, Sayur, Buah' },
];

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LaporanProduksiFormScreen({ navigation, route }: any) {
  const params = (route.params ?? {}) as { laporanId?: string; tanggal?: string };
  const { role, currentUser, currentSppg, laporanList, menuHarianPlanList, saveLaporanDraft, submitLaporan } = useApp();
  const { sppgInScope } = useScopedData();

  const existing = params.laporanId ? laporanList.find((l) => l.id === params.laporanId) : undefined;

  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [editId, setEditId] = useState<string | undefined>(existing?.id);
  const [tanggal] = useState(existing?.tanggal ?? params.tanggal ?? todayDate());

  // Nice-to-have: prefill from a Menu Kalender plan for this SPPG+tanggal when
  // creating a brand-new laporan (never overrides an already-submitted one).
  const planForDate = !existing ? menuHarianPlanList.find((m) => m.sppgId === currentSppg?.id && m.tanggal === tanggal) : undefined;

  const [targetPorsi, setTargetPorsi] = useState(existing?.targetPorsi ?? currentSppg?.kapasitasProduksi ?? 0);
  const [realisasiPorsi, setRealisasiPorsi] = useState(existing?.realisasiPorsi ?? 0);
  const [menuSelection, setMenuSelection] = useState<string>(() => {
    if (existing) return MENU_OPTIONS.some((m) => m.label === existing.menu) ? existing.menu : MANUAL_MENU_VALUE;
    if (planForDate) return MENU_OPTIONS.some((m) => m.label === planForDate.menu) ? planForDate.menu : MANUAL_MENU_VALUE;
    return MENU_OPTIONS[0].label;
  });
  const [manualMenu, setManualMenu] = useState(existing?.menu ?? planForDate?.menu ?? '');
  const [kategoriGizi, setKategoriGizi] = useState(existing?.kategoriGizi ?? planForDate?.kategoriGizi ?? MENU_OPTIONS[0].kategoriGizi);
  const [foto, setFoto] = useState<LaporanProduksiFoto[]>(existing?.foto ?? []);
  const [saved, setSaved] = useState(false);

  // ponytail: saveLaporanDraft has no return value, and AppContext only inserts
  // a *new* row when called without an id (an id that doesn't exist yet is
  // silently dropped). So for a brand-new laporan we save without an id, then
  // watch laporanList for the row that appears — that's our real id.
  const prevIdsRef = useRef<Set<string>>(new Set(laporanList.map((l) => l.id)));
  useEffect(() => {
    if (!editId) {
      const created = laporanList.find((l) => !prevIdsRef.current.has(l.id));
      if (created) setEditId(created.id);
    }
  }, [laporanList, editId]);

  if (!role || !currentUser || !currentSppg) return null;

  const readOnly = existing
    ? !canEditLaporan(role, sppgInScope.map((s) => s.id), existing)
    : ROLE_PERMISSIONS[role].isViewOnly;
  const menu = menuSelection === MANUAL_MENU_VALUE ? manualMenu : menuSelection;

  const onSelectMenu = (value: string) => {
    setMenuSelection(value);
    const opt = MENU_OPTIONS.find((m) => m.label === value);
    if (opt) setKategoriGizi(opt.kategoriGizi);
  };

  const attachPhoto = async (source: 'camera' | 'library', mediaTypes: ('images' | 'videos')[] = ['images']) => {
    const picked = await pickMedia(source, mediaTypes);
    if (!picked) return;
    const geotag = await getCurrentGeotag();
    setFoto((prev) => [
      ...prev,
      {
        id: `FOTO-${Date.now()}`,
        uri: picked.uri,
        timestamp: nowTimestamp(),
        lat: geotag?.lat ?? null,
        lng: geotag?.lng ?? null,
        caption: '',
        mediaType: picked.mediaType,
      },
    ]);
  };

  const removePhoto = (id: string) => setFoto((prev) => prev.filter((f) => f.id !== id));

  const implausible =
    targetPorsi > 0 && (realisasiPorsi > targetPorsi * 1.5 || realisasiPorsi < targetPorsi * 0.3) && realisasiPorsi !== 0;

  const canSubmit = !!editId && foto.length >= 2 && !!menu.trim() && targetPorsi >= 0 && realisasiPorsi >= 0;

  const buildPayload = () => ({
    id: editId,
    sppgId: currentSppg.id,
    tanggal,
    targetPorsi,
    realisasiPorsi,
    menu,
    kategoriGizi,
    foto,
    dibuatOleh: currentUser.id,
  });

  const handleSaveDraft = async () => {
    if (editId) {
      saveLaporanDraft(buildPayload());
    } else {
      prevIdsRef.current = new Set(laporanList.map((l) => l.id));
      saveLaporanDraft({ sppgId: currentSppg.id, tanggal, targetPorsi, realisasiPorsi, menu, kategoriGizi, foto, dibuatOleh: currentUser.id });
    }
    await addToOfflineQueue('laporan_produksi', buildPayload());
    setSaved(true);
  };

  const handleSubmit = async () => {
    if (!editId) return;
    if (foto.length < 2) {
      Alert.alert('Foto Belum Cukup', 'Lampirkan minimal 2 foto dokumentasi sebelum mengirim laporan.');
      return;
    }
    submitLaporan(editId);
    await addToOfflineQueue('laporan_produksi', { ...buildPayload(), status: 'terkirim' });
    Alert.alert('Laporan Terkirim', 'Laporan produksi berhasil dikirim untuk diverifikasi.');
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle action={existing ? <Pill label={existing.status} tone={existing.status === 'draft' ? 'neutral' : existing.status === 'terkirim' ? 'info' : 'success'} /> : undefined}>
        Laporan Produksi — {tanggal}
      </SectionTitle>

      <Card style={{ gap: spacing.md }}>
        <View style={styles.stepperRow}>
          <Stepper label="Target Porsi" value={targetPorsi} onChange={setTargetPorsi} step={10} min={0} disabled={readOnly} style={{ flex: 1 }} />
          <Stepper label="Realisasi Porsi" value={realisasiPorsi} onChange={setRealisasiPorsi} step={10} min={0} disabled={readOnly} style={{ flex: 1 }} />
        </View>
        {implausible && (
          <View style={[styles.warnBanner, { backgroundColor: colors.warningBg, borderRadius: radius.md }]}>
            <Feather name="alert-triangle" size={16} color={colors.warning} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
              Realisasi porsi jauh berbeda dari target. Periksa kembali sebelum mengirim.
            </Text>
          </View>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle style={{ marginBottom: 0 }}>Menu</SectionTitle>
        <DropdownPicker
          label="Pilih Menu"
          icon="coffee"
          value={menuSelection}
          onSelect={onSelectMenu}
          disabled={readOnly}
          options={[...MENU_OPTIONS.map((m) => ({ label: m.label, value: m.label })), { label: 'Lainnya (isi manual)', value: MANUAL_MENU_VALUE }]}
        />
        {menuSelection === MANUAL_MENU_VALUE && (
          <>
            <Input label="Menu (manual)" value={manualMenu} onChangeText={setManualMenu} placeholder="Tuliskan menu hari ini" editable={!readOnly} />
            <Input label="Kategori Gizi" value={kategoriGizi} onChangeText={setKategoriGizi} placeholder="Contoh: Karbohidrat, Protein, Sayur, Buah" editable={!readOnly} />
          </>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <SectionTitle style={{ marginBottom: 0 }} action={<Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{foto.length} foto (min. 2)</Text>}>
          Dokumentasi Foto
        </SectionTitle>
        {!readOnly && (
          <>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <PrimaryButton label="Ambil Foto" icon="camera" variant="secondary" onPress={() => attachPhoto('camera', ['images'])} style={{ flex: 1 }} />
              <PrimaryButton label="Pilih Galeri" icon="image" variant="secondary" onPress={() => attachPhoto('library', ['images'])} style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <PrimaryButton label="Ambil Video" icon="video" variant="outline" onPress={() => attachPhoto('camera', ['videos'])} style={{ flex: 1 }} />
              <PrimaryButton label="Pilih Video Galeri" icon="film" variant="outline" onPress={() => attachPhoto('library', ['videos'])} style={{ flex: 1 }} />
            </View>
          </>
        )}
        <View style={styles.photoGrid}>
          {foto.map((f) => (
            <View key={f.id} style={styles.photoItem}>
              {f.mediaType === 'video' ? (
                <View style={[styles.photoThumb, styles.videoPlaceholder, { borderRadius: radius.md, backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="video" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>Video</Text>
                </View>
              ) : (
                <Image source={{ uri: f.uri }} style={[styles.photoThumb, { borderRadius: radius.md }]} />
              )}
              {!readOnly && (
                <Pressable onPress={() => removePhoto(f.id)} style={[styles.removeBtn, { backgroundColor: colors.danger }]}>
                  <Feather name="x" size={12} color="#FFFFFF" />
                </Pressable>
              )}
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                {f.timestamp}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {!readOnly && (
        <View style={{ gap: spacing.sm }}>
          <PrimaryButton label="Simpan Draft" icon="save" variant="secondary" onPress={handleSaveDraft} />
          <PrimaryButton label="Kirim Laporan" icon="send" onPress={handleSubmit} disabled={!canSubmit} />
          {!canSubmit && (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' }}>
              Simpan draft dan lengkapi minimal 2 foto serta menu untuk dapat mengirim.
            </Text>
          )}
          {saved && (
            <View style={[styles.successBanner, { backgroundColor: colors.successBg }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Tersimpan lokal — menunggu sinkron</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  stepperRow: { flexDirection: 'row', gap: 12 },
  warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { width: 84 },
  photoThumb: { width: 84, height: 84 },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  removeBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
});
