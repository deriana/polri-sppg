import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Pill, PrimaryButton, SectionTitle, Stepper } from '../components/ui';
import { LaporanProduksiFoto, QcStatus } from '../types';
import { ROLE_PERMISSIONS, canEditLaporan } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';
import { getCurrentGeotag } from '../utils/geotag';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { useScopedData } from '../hooks';
import { MENU_OPTIONS } from '../mock/laporanProduksi';

const MANUAL_MENU_VALUE = '__manual__';

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function LaporanProduksiFormScreen({ navigation, route }: any) {
  const params = (route.params ?? {}) as { laporanId?: string; tanggal?: string };
  const {
    role,
    currentUser,
    currentSppg,
    laporanList,
    sekolahList,
    menuHarianPlanList,
    saveLaporanDraft,
    submitLaporan,
    approveQcLaporan,
    updateProductionStage,
  } = useApp();
  const { sppgInScope } = useScopedData();

  const affiliatedSchools = currentSppg ? sekolahList.filter((s) => s.sppgId === currentSppg.id) : [];
  const totalSiswaSekolah = affiliatedSchools.reduce((acc, curr) => acc + curr.jumlahSiswa, 0);
  const [showSchoolBreakdown, setShowSchoolBreakdown] = useState(true);

  const existing = params.laporanId ? laporanList.find((l) => l.id === params.laporanId) : undefined;

  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const [editId, setEditId] = useState<string | undefined>(existing?.id);
  const [tanggal] = useState(existing?.tanggal ?? params.tanggal ?? todayDate());

  // Prefill from plan if available
  const planForDate = !existing ? menuHarianPlanList.find((m) => m.sppgId === currentSppg?.id && m.tanggal === tanggal) : undefined;

  const [batchId] = useState(
    existing?.batchId ?? `BATCH-${currentSppg?.id || 'SPPG'}-${tanggal.replace(/-/g, '')}-01`,
  );
  const [targetPorsi, setTargetPorsi] = useState(existing?.targetPorsi ?? currentSppg?.kapasitasProduksi ?? 1200);
  const [realisasiPorsi, setRealisasiPorsi] = useState(existing?.realisasiPorsi ?? (existing?.targetPorsi ?? 1200));
  const [sudahDiporsi, setSudahDiporsi] = useState<boolean>(existing?.realisasiPorsi ? existing.realisasiPorsi > 0 : false);
  const [catatanYield, setCatatanYield] = useState<string>(existing?.catatanYield ?? '');
  const [menuSelection, setMenuSelection] = useState<string>(() => {
    if (existing) return MENU_OPTIONS.some((m) => m.label === existing.menu) ? existing.menu : MANUAL_MENU_VALUE;
    if (planForDate) return MENU_OPTIONS.some((m) => m.label === planForDate.menu) ? planForDate.menu : MANUAL_MENU_VALUE;
    return MENU_OPTIONS[0].label;
  });
  const [manualMenu, setManualMenu] = useState(existing?.menu ?? planForDate?.menu ?? '');
  const [kategoriGizi, setKategoriGizi] = useState(existing?.kategoriGizi ?? planForDate?.kategoriGizi ?? MENU_OPTIONS[0].kategoriGizi);
  const [foto, setFoto] = useState<LaporanProduksiFoto[]>(existing?.foto ?? []);
  const [saved, setSaved] = useState(false);

  // Stage timestamps
  const [prepTime, setPrepTime] = useState<string | undefined>(existing?.preparationTimestamp ?? '06:30');
  const [cookTime, setCookTime] = useState<string | undefined>(existing?.cookingTimestamp);
  const [qcTime, setQcTime] = useState<string | undefined>(existing?.qcTimestamp);
  const [packTime, setPackTime] = useState<string | undefined>(existing?.packingTimestamp);
  const [readyTime, setReadyTime] = useState<string | undefined>(existing?.readyTimestamp);

  // QC Gate State
  const [qcStatus, setQcStatus] = useState<QcStatus>(existing?.qcStatus ?? 'MENUNGGU_QC');
  const [qcGrade, setQcGrade] = useState<'A+' | 'A' | 'B' | 'C'>(existing?.qcGrade ?? 'A+');
  const [qcScore, setQcScore] = useState<number>(existing?.qcScore ?? 98);
  const [qcNotes, setQcNotes] = useState(existing?.qcNotes ?? '');
  const [showQcModal, setShowQcModal] = useState(false);

  const prevIdsRef = useRef<Set<string>>(new Set(laporanList.map((l) => l.id)));
  useEffect(() => {
    if (!editId) {
      const created = laporanList.find((l) => !prevIdsRef.current.has(l.id));
      if (created) setEditId(created.id);
    }
  }, [laporanList, editId]);

  if (!role || !currentUser || !currentSppg) return null;

  const isKepala = role === 'KEPALA_SPPG';
  const readOnly = existing
    ? !canEditLaporan(role, sppgInScope.map((s) => s.id), existing)
    : ROLE_PERMISSIONS[role].isViewOnly;
  const menu = menuSelection === MANUAL_MENU_VALUE ? manualMenu : menuSelection;
  const selectedOption = MENU_OPTIONS.find((m) => m.label === menuSelection);

  const onSelectMenu = (value: string) => {
    setMenuSelection(value);
    const opt = MENU_OPTIONS.find((m) => m.label === value);
    if (opt) setKategoriGizi(opt.kategoriGizi);
  };

  const handleStageAdvance = (stage: 'preparation' | 'cooking' | 'qc' | 'packing' | 'ready') => {
    const time = nowTime();
    if (stage === 'preparation') setPrepTime(time);
    if (stage === 'cooking') setCookTime(time);
    if (stage === 'qc') {
      setQcTime(time);
      setShowQcModal(true);
    }
    if (stage === 'packing') setPackTime(time);
    if (stage === 'ready') setReadyTime(time);

    if (editId) {
      updateProductionStage(editId, stage);
    }
  };

  const handleSaveQcStatus = (
    status: QcStatus,
    grade: 'A+' | 'A' | 'B' | 'C' = qcGrade,
    score: number = qcScore,
  ) => {
    setQcStatus(status);
    setQcGrade(grade);
    setQcScore(score);
    setQcTime(nowTime());
    if (editId) {
      approveQcLaporan(editId, status, qcNotes, currentUser.nama, grade, score);
    }
    setShowQcModal(false);
    Alert.alert(
      'Status & Grade QC Disimpan',
      `Batch ${batchId} telah diset status QC: ${status} dengan Grade: ${grade} (Skor ${score})${status === 'HOLD' || status === 'REJECTED' ? ' — Alert otomatis dibuat!' : ''}`,
    );
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

  const canSubmit = !!editId && foto.length >= 2 && !!menu.trim() && targetPorsi >= 0 && realisasiPorsi >= 0 && qcStatus === 'READY';

  const buildPayload = () => ({
    id: editId,
    sppgId: currentSppg.id,
    tanggal,
    batchId,
    targetPorsi,
    realisasiPorsi: sudahDiporsi ? realisasiPorsi : 0,
    menu,
    kategoriGizi,
    foto,
    dibuatOleh: currentUser.id,
    preparationTimestamp: prepTime,
    cookingTimestamp: cookTime,
    qcTimestamp: qcTime,
    packingTimestamp: packTime,
    readyTimestamp: readyTime,
    qcStatus,
    qcNotes,
    qcApprovedBy: existing?.qcApprovedBy || (qcStatus !== 'MENUNGGU_QC' ? currentUser.nama : undefined),
    catatanYield: catatanYield.trim() || undefined,
  });

  const handleSaveDraft = async () => {
    if (editId) {
      saveLaporanDraft(buildPayload());
    } else {
      prevIdsRef.current = new Set(laporanList.map((l) => l.id));
      saveLaporanDraft(buildPayload());
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
    if (qcStatus !== 'READY') {
      Alert.alert('Pemeriksaan QC Belum Lolos', 'Batch makanan harus berstatus QC: READY sebelum laporan dapat dikirim untuk distribusi.');
      return;
    }
    submitLaporan(editId);
    await addToOfflineQueue('laporan_produksi', { ...buildPayload(), status: 'terkirim' });
    Alert.alert('Laporan Terkirim', `Batch ${batchId} berhasil dikirim untuk diverifikasi.`);
    navigation.goBack();
  };

  const attachSamplePhoto = () => {
    const geotag = { lat: -6.9147, lng: 107.6098 };
    setFoto((prev) => [
      ...prev,
      {
        id: `FOTO-SIM-${Date.now()}`,
        uri: selectedOption?.fotoMenu ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        timestamp: nowTimestamp(),
        lat: geotag.lat,
        lng: geotag.lng,
        caption: 'Dokumentasi Foto Produksi Makanan MBG',
        mediaType: 'image',
      },
    ]);
  };

  const qcTone =
    qcStatus === 'READY'
      ? 'success'
      : qcStatus === 'HOLD'
      ? 'warning'
      : qcStatus === 'REJECTED'
      ? 'danger'
      : 'neutral';

  const qcToneColor =
    qcStatus === 'READY'
      ? colors.success
      : qcStatus === 'HOLD'
      ? colors.warning
      : qcStatus === 'REJECTED'
      ? colors.danger
      : colors.primary;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header & Batch Identifier Bar */}
      <Card style={styles.batchCard}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="hash" size={14} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              BATCH / LOT ID PRODUKSI
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>{batchId}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Unit: {currentSppg.nama} • Tanggal: {tanggal}
          </Text>
        </View>
        <Pill label={qcStatus} tone={qcTone} />
      </Card>

      {/* 2. PROMINENT QUALITY CONTROL (QC) INSPECTION GATE (PALING AWAL & MENCELOK) */}
      <Card
        style={{
          borderColor: qcToneColor,
          borderWidth: 1.5,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: qcToneColor, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="shield" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: qcToneColor, letterSpacing: 0.5 }}>
                QUALITY CONTROL GATE (QC)
              </Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                {qcStatus === 'READY'
                  ? 'LOLOS UJI MUTU & KELAYAKAN'
                  : qcStatus === 'HOLD'
                  ? 'BATCH DITAHAN (HOLD)'
                  : qcStatus === 'REJECTED'
                  ? 'BATCH DITOLAK (REJECTED)'
                  : 'MENUNGGU PEMERIKSAAN QC'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {qcStatus === 'READY' && (
              <Pill label={`Grade ${qcGrade} (${qcScore})`} tone="success" />
            )}
            <Pill label={qcStatus} tone={qcTone} />
          </View>
        </View>

        {/* QC Audit Details Box */}
        <View style={[styles.qcDetailBox, { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4, borderBottomWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Hasil QC & Grade:</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: qcStatus === 'READY' ? colors.success : colors.text }}>
              {qcStatus} • Grade {qcGrade} (Skor: {qcScore}/100)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Petugas QC / Gizi:</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
              {existing?.qcApprovedBy || (qcStatus !== 'MENUNGGU_QC' ? currentUser.nama : 'Ahli Gizi / Cook')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Waktu Verifikasi:</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
              {qcTime ? `${qcTime} WIB` : 'Belum diverifikasi'}
            </Text>
          </View>
          {qcNotes ? (
            <View style={{ paddingTop: 4, borderTopWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Catatan Organoleptik & Suhu:</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                "{qcNotes}"
              </Text>
            </View>
          ) : null}
        </View>

        {!readOnly && (
          <PrimaryButton
            label={qcStatus === 'READY' ? 'Review / Ubah Status QC Masakan' : 'Periksa & Uji Kelayakan QC Sekarang'}
            icon="shield"
            variant={qcStatus === 'READY' ? 'outline' : 'primary'}
            onPress={() => setShowQcModal(true)}
            style={{ marginTop: 2 }}
          />
        )}
      </Card>

      {readOnly && existing && (
        <View style={[styles.warnBanner, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md }]}>
          <Feather name="lock" size={16} color={colors.info} strokeWidth={iconStrokeWidth} />
          <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
            {existing.status === 'diverifikasi'
              ? 'Laporan ini sudah diverifikasi oleh Pengawas SPPG dan tidak dapat diubah lagi.'
              : 'Anda hanya bisa melihat laporan ini, tidak dapat mengubahnya.'}
          </Text>
        </View>
      )}

      {/* 3. Production Stage Pipeline Tracker (Timestamping) */}
      <Card variant="accent" style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Alur Tahap Produksi (Stage Timestamps)</SectionTitle>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          Catat waktu aktual setiap tahap produksi untuk keterlacakan data:
        </Text>

        <View style={{ gap: 8, marginTop: 4 }}>
          {/* Stage 1: Preparation */}
          <View style={[styles.stageRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={[styles.stageIcon, { backgroundColor: prepTime ? colors.successBg : colors.primaryLight }]}>
              <Feather name={prepTime ? 'check' : 'box'} size={15} color={prepTime ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>1. Persiapan Bahan Baku</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{prepTime ? `Dimulai pukul ${prepTime}` : 'Belum dimulai'}</Text>
            </View>
            {!readOnly && (
              <Pressable
                onPress={() => handleStageAdvance('preparation')}
                style={[styles.stageBtn, { backgroundColor: colors.primaryLight, borderRadius: radius.sm }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{prepTime ? 'Update' : 'Mulai'}</Text>
              </Pressable>
            )}
          </View>

          {/* Stage 2: Cooking */}
          <View style={[styles.stageRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={[styles.stageIcon, { backgroundColor: cookTime ? colors.successBg : colors.primaryLight }]}>
              <Feather name={cookTime ? 'check' : 'activity'} size={15} color={cookTime ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>2. Proses Pengolahan & Memasak</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{cookTime ? `Dimasak pukul ${cookTime}` : 'Menunggu persiapan'}</Text>
            </View>
            {!readOnly && (
              <Pressable
                onPress={() => handleStageAdvance('cooking')}
                style={[styles.stageBtn, { backgroundColor: colors.primaryLight, borderRadius: radius.sm }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{cookTime ? 'Update' : 'Masak'}</Text>
              </Pressable>
            )}
          </View>

          {/* Stage 3: QC Gate */}
          <View style={[styles.stageRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={[styles.stageIcon, { backgroundColor: qcStatus === 'READY' ? colors.successBg : colors.primaryLight }]}>
              <Feather name="shield" size={15} color={qcStatus === 'READY' ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>3. QC Approval Gate (Kelayakan & Gizi)</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {qcStatus === 'READY'
                  ? `Lolos QC (${qcTime || 'Selesai'})`
                  : qcStatus === 'HOLD'
                  ? 'Batch Ditahan (HOLD)'
                  : qcStatus === 'REJECTED'
                  ? 'Batch Ditolak (REJECTED)'
                  : 'Menunggu Pemeriksaan QC'}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowQcModal(true)}
              style={[
                styles.stageBtn,
                { backgroundColor: qcStatus === 'READY' ? colors.successBg : isDark ? colors.gold : colors.primary, borderRadius: radius.sm },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: qcStatus === 'READY' ? colors.success : '#FFFFFF' }}>
                {qcStatus === 'READY' ? 'Review QC' : 'Periksa QC'}
              </Text>
            </Pressable>
          </View>

          {/* Stage 4: Packing */}
          <View style={[styles.stageRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={[styles.stageIcon, { backgroundColor: packTime ? colors.successBg : colors.primaryLight }]}>
              <Feather name={packTime ? 'check' : 'archive'} size={15} color={packTime ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>4. Pemorsian & Packing Ompreng</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{packTime ? `Dipacking pukul ${packTime}` : 'Menunggu QC lolos'}</Text>
            </View>
            {!readOnly && (
              <Pressable
                onPress={() => handleStageAdvance('packing')}
                style={[styles.stageBtn, { backgroundColor: colors.primaryLight, borderRadius: radius.sm }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{packTime ? 'Update' : 'Packing'}</Text>
              </Pressable>
            )}
          </View>

          {/* Stage 5: Ready to Distribute */}
          <View style={[styles.stageRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={[styles.stageIcon, { backgroundColor: readyTime ? colors.successBg : colors.primaryLight }]}>
              <Feather name={readyTime ? 'check' : 'truck'} size={15} color={readyTime ? colors.success : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>5. Siap Serah Terima ke Driver</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{readyTime ? `Siap pukul ${readyTime}` : 'Menunggu pemorsian'}</Text>
            </View>
            {!readOnly && (
              <Pressable
                onPress={() => handleStageAdvance('ready')}
                style={[styles.stageBtn, { backgroundColor: colors.primaryLight, borderRadius: radius.sm }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{readyTime ? 'Update' : 'Siap Kirim'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Card>

      {/* 3. Target Kebutuhan Sekolah & Realisasi Pemorsian (Yield Dapur) */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <SectionTitle style={{ marginBottom: 0 }}>Target & Hasil Pemorsian (Yield Porsi)</SectionTitle>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
              Target order sekolah ditentukan di awal, realisasi fisik dihitung saat selesai pemorsian ompreng.
            </Text>
          </View>
          <Pill
            label={sudahDiporsi ? (realisasiPorsi >= targetPorsi ? 'Porsi Mencukupi' : 'Porsi Defisit') : 'Sedang Dimasak'}
            tone={sudahDiporsi ? (realisasiPorsi >= targetPorsi ? 'success' : 'danger') : 'warning'}
          />
        </View>

        {/* Target Kebutuhan Sekolah */}
        <View style={{ gap: 6 }}>
          <Stepper
            label="Target Kebutuhan Sekolah (Order Porsi)"
            value={targetPorsi}
            onChange={setTargetPorsi}
            step={50}
            min={0}
            disabled={readOnly}
          />

          {/* Quick Auto-fill Button if target differs */}
          {targetPorsi !== totalSiswaSekolah && totalSiswaSekolah > 0 && !readOnly && (
            <Pressable
              onPress={() => setTargetPorsi(totalSiswaSekolah)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
            >
              <Feather name="refresh-cw" size={12} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                Set Target Otomatis Sesuai Total Siswa: {totalSiswaSekolah.toLocaleString('id-ID')} Porsi
              </Text>
            </Pressable>
          )}

          {/* Rincian Pembagian Alokasi per Sekolah */}
          {affiliatedSchools.length > 0 && (
            <View style={[styles.schoolBreakdownBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
              <Pressable
                onPress={() => setShowSchoolBreakdown(!showSchoolBreakdown)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Feather name="map-pin" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                    Rincian Alokasi {affiliatedSchools.length} Sekolah Penerima ({totalSiswaSekolah.toLocaleString('id-ID')} Siswa)
                  </Text>
                </View>
                <Feather name={showSchoolBreakdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
              </Pressable>

              {showSchoolBreakdown && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  {affiliatedSchools.map((sch, idx) => {
                    const pct = totalSiswaSekolah > 0 ? ((sch.jumlahSiswa / totalSiswaSekolah) * 100).toFixed(0) : '0';
                    return (
                      <View
                        key={sch.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 6,
                          borderBottomWidth: idx < affiliatedSchools.length - 1 ? 1 : 0,
                          borderColor: colors.border,
                        }}
                      >
                        <View style={{ flex: 1, gap: 2, paddingRight: 8 }}>
                          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                            {sch.nama}
                          </Text>
                          <Text style={{ fontSize: 10.5, color: colors.textMuted }} numberOfLines={1}>
                            {sch.alamat}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Pill label={`${sch.jumlahSiswa} Porsi`} tone="primary" />
                          <Text style={{ fontSize: 9.5, color: colors.textMuted }}>{pct}% dari total</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Toggle Status Pemorsian */}
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            Status Penghitungan Pemorsian Fisik:
          </Text>
          <View style={[styles.segmentContainer, { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setSudahDiporsi(false)}
              style={[
                styles.segmentBtn,
                { backgroundColor: !sudahDiporsi ? colors.primary : 'transparent', borderRadius: radius.sm },
              ]}
            >
              <Feather name="activity" size={13} color={!sudahDiporsi ? '#FFF' : colors.text} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: !sudahDiporsi ? '#FFF' : colors.text }}>
                Masih Dimasak di Dapur
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSudahDiporsi(true)}
              style={[
                styles.segmentBtn,
                { backgroundColor: sudahDiporsi ? colors.primary : 'transparent', borderRadius: radius.sm },
              ]}
            >
              <Feather name="check-circle" size={13} color={sudahDiporsi ? '#FFF' : colors.text} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: sudahDiporsi ? '#FFF' : colors.text }}>
                Sudah Diporsi ke Ompreng
              </Text>
            </Pressable>
          </View>
        </View>

        {!sudahDiporsi ? (
          <View style={[styles.infoBanner, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.text, flex: 1, lineHeight: 16 }}>
              Koki saat ini memasak bahan baku volume besar di kuali. Jumlah porsi riil akan dihitung dan diinput setelah tim pemorsi selesai menakar dan mengisi ompreng (Tahap 4).
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm, marginTop: 4 }}>
            {/* Input Realisasi Porsi */}
            <Stepper
              label="Realisasi Porsi Nyata (Hasil Hitung Ompreng Fisik)"
              value={realisasiPorsi}
              onChange={setRealisasiPorsi}
              step={10}
              min={0}
              disabled={readOnly}
            />

            {/* Yield & Efficiency Analysis Box */}
            <View style={[styles.yieldAnalysisBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
              <View style={styles.rowBetween}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>ANALISIS YIELD & KETERSEDIAAN PORSI</Text>
                <Pill
                  label={realisasiPorsi >= targetPorsi ? `Surplus +${realisasiPorsi - targetPorsi} Tray` : `Kurang ${targetPorsi - realisasiPorsi} Tray`}
                  tone={realisasiPorsi >= targetPorsi ? 'success' : 'danger'}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <View>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>TARGET ORDER</Text>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{targetPorsi.toLocaleString('id-ID')} Porsi</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>REALISASI PORSI</Text>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.primary }}>{realisasiPorsi.toLocaleString('id-ID')} Porsi</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>EFISIENSI YIELD</Text>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: realisasiPorsi >= targetPorsi ? colors.success : colors.danger }}>
                    {targetPorsi > 0 ? ((realisasiPorsi / targetPorsi) * 100).toFixed(1) : '100'}%
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: realisasiPorsi >= targetPorsi ? colors.success : colors.danger, fontWeight: '700' }}>
                {realisasiPorsi >= targetPorsi
                  ? 'Porsi mencukupi seluruh kebutuhan sekolah penerima manfaat.'
                  : `Perhatian: Hasil masak kurang ${targetPorsi - realisasiPorsi} porsi! Siapkan batch tambahan segera.`}
              </Text>
            </View>

            <Input
              label="Catatan Hasil Pemorsian / Alasan Selisih (Opsional)"
              value={catatanYield}
              onChangeText={setCatatanYield}
              placeholder="Contoh: 5 ompreng disisihkan untuk uji sampling organoleptik QC..."
              editable={!readOnly}
            />
          </View>
        )}
      </Card>

      {/* 4. Menu Selection Card with Photo Preview */}
      <Card style={{ gap: spacing.md }}>
        <SectionTitle style={{ marginBottom: 0 }}>Menu Makanan SPPG</SectionTitle>
        <DropdownPicker
          label="Pilih Menu"
          icon="coffee"
          value={menuSelection}
          onSelect={onSelectMenu}
          disabled={readOnly}
          options={[...MENU_OPTIONS.map((m) => ({ label: m.label, value: m.label })), { label: 'Lainnya (Isi Sendiri)', value: MANUAL_MENU_VALUE }]}
        />

        {selectedOption?.fotoMenu && (
          <View style={[styles.menuPreviewBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <Image source={{ uri: selectedOption.fotoMenu }} style={styles.menuPreviewImg} resizeMode="cover" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Tampilan Paket Menu:</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{selectedOption.kategoriGizi}</Text>
            </View>
          </View>
        )}

        {menuSelection === MANUAL_MENU_VALUE && (
          <>
            <Input label="Nama Menu" value={manualMenu} onChangeText={setManualMenu} placeholder="Tuliskan nama menu hari ini" editable={!readOnly} />
            <Input label="Kategori Gizi" value={kategoriGizi} onChangeText={setKategoriGizi} placeholder="Contoh: Karbohidrat, Protein, Sayur, Buah" editable={!readOnly} />
          </>
        )}
      </Card>

      {/* 5. Foto Dokumentasi */}
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
            <PrimaryButton label="+ Tambah Foto Contoh" icon="plus-circle" variant="outline" onPress={attachSamplePhoto} />
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

      {/* 6. Tombol Aksi Simpan & Kirim */}
      {!readOnly && (
        <View style={{ gap: spacing.sm }}>
          <PrimaryButton label="Simpan Sementara" icon="save" variant="secondary" onPress={handleSaveDraft} />
          <PrimaryButton
            label={qcStatus === 'READY' ? 'Kirim Laporan Produksi' : 'Kirim Laporan (Perlu Lolos QC)'}
            icon="send"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
          {!canSubmit && (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' }}>
              Syarat kirim: Min. 2 foto, target & realisasi porsi, serta status QC harus READY.
            </Text>
          )}
          {saved && (
            <View style={[styles.successBanner, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Tersimpan — akan terkirim otomatis</Text>
            </View>
          )}
        </View>
      )}

      {/* QC Approval Gate Modal */}
      <Modal visible={showQcModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="shield" size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>QC Approval Gate</Text>
              </View>
              <Pressable onPress={() => setShowQcModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              Pemeriksaan mutu kelayakan batch <Text style={{ fontWeight: '800', color: colors.text }}>{batchId}</Text> sebelum diizinkan masuk tahap packing & distribusi:
            </Text>

            {/* QC Criteria Checklist Visual */}
            <View style={{ gap: 6, padding: 10, backgroundColor: colors.background, borderRadius: radius.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={{ fontSize: 11, color: colors.text }}>Suhu makanan matang &gt; 60°C atau penyimpanan &lt; 8°C</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={{ fontSize: 11, color: colors.text }}>Uji organoleptik (rasa, aroma, warna, tekstur normal)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={{ fontSize: 11, color: colors.text }}>Gramasi porsi & standar AKG gizi terpenuhi</Text>
              </View>
            </View>

            {/* Grade Selector */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                Penetapan Grade Mutu Hasil Uji Ahli Gizi:
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { grade: 'A+' as const, score: 98, desc: 'Grade A+ (98)' },
                  { grade: 'A' as const, score: 92, desc: 'Grade A (92)' },
                  { grade: 'B' as const, score: 82, desc: 'Grade B (82)' },
                  { grade: 'C' as const, score: 65, desc: 'Grade C (65)' },
                ].map((g) => (
                  <Pressable
                    key={g.grade}
                    onPress={() => {
                      setQcGrade(g.grade);
                      setQcScore(g.score);
                    }}
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 8,
                        alignItems: 'center',
                        borderRadius: radius.sm,
                        borderWidth: 1.5,
                        borderColor: qcGrade === g.grade ? colors.primary : colors.border,
                        backgroundColor: qcGrade === g.grade ? colors.primaryLight : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '900',
                        color: qcGrade === g.grade ? colors.primary : colors.text,
                      }}
                    >
                      {g.grade}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9.5,
                        color: qcGrade === g.grade ? colors.primary : colors.textMuted,
                        marginTop: 1,
                      }}
                    >
                      Skor {g.score}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input
              label="Catatan Tim QC Gizi"
              value={qcNotes}
              onChangeText={setQcNotes}
              placeholder="Contoh: Suhu penyajian 68°C, rasa gurih pas, higienitas terjaga."
            />

            <View style={{ gap: 8 }}>
              <PrimaryButton
                label={`APPROVE (READY - GRADE ${qcGrade})`}
                icon="check-circle"
                onPress={() => handleSaveQcStatus('READY', qcGrade, qcScore)}
              />
              <PrimaryButton
                label="HOLD BATCH (Tahan Sementara)"
                icon="alert-circle"
                variant="secondary"
                onPress={() => handleSaveQcStatus('HOLD', 'B', 75)}
              />
              <PrimaryButton
                label="REJECT BATCH (Tolak Kelayakan)"
                icon="x-circle"
                variant="outline"
                onPress={() => handleSaveQcStatus('REJECTED', 'C', 45)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    gap: 10,
  },
  stageIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  menuPreviewBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1 },
  menuPreviewImg: { width: 64, height: 64, borderRadius: 8 },
  stepperRow: { flexDirection: 'row', gap: 12 },
  warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { width: 84 },
  photoThumb: { width: 84, height: 84 },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  removeBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  yieldAnalysisBox: {
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  qcDetailBox: {
    padding: 10,
    gap: 4,
  },
  schoolBreakdownBox: {
    padding: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
});

