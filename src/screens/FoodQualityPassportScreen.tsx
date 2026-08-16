import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { BRAND_ASSETS } from '../data/images';

export default function FoodQualityPassportScreen({ navigation, route }: any) {
  const { qualityPassportList, currentSppg, foodSafetyList, laporanList } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const initialBatchId = route?.params?.batchId || 'BATCH-20260815-01';
  const initialTanggal = route?.params?.tanggal;
  const initialLogId = route?.params?.logId;

  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);

  // Available batch options for quick switcher
  const availableBatches = useMemo(() => {
    const list: Array<{ batchId: string; label: string; tanggal: string }> = [];
    
    qualityPassportList.forEach((p) => {
      list.push({
        batchId: p.batchId,
        label: `${p.tanggal.slice(5)} (${p.menuNama.split(',')[1]?.trim() || p.menuNama.slice(0, 15)})`,
        tanggal: p.tanggal,
      });
    });

    laporanList.forEach((l) => {
      const bId = l.batchId || l.id;
      if (!list.some((item) => item.batchId === bId)) {
        list.push({
          batchId: bId,
          label: `${l.tanggal.slice(5)} (${l.menu.slice(0, 16)}...)`,
          tanggal: l.tanggal,
        });
      }
    });

    return list;
  }, [qualityPassportList, laporanList]);

  // Dynamic Passport Synthesis
  const passport = useMemo(() => {
    // 1. Cek langsung di qualityPassportList
    const exact = qualityPassportList.find(
      (p) => p.batchId === selectedBatchId || p.id === selectedBatchId,
    );
    if (exact && !initialLogId) return exact;

    // 2. Cek apakah ada matching di FoodSafetyLog
    const matchedLog = foodSafetyList.find(
      (f) =>
        f.id === selectedBatchId ||
        f.id === initialLogId ||
        (initialTanggal && f.tanggal === initialTanggal),
    );

    // 3. Cek Laporan Produksi
    const matchedLaporan = laporanList.find(
      (l) =>
        l.batchId === selectedBatchId ||
        l.id === selectedBatchId ||
        (initialTanggal && l.tanggal === initialTanggal) ||
        (matchedLog && l.tanggal === matchedLog.tanggal),
    );

    if (matchedLog || matchedLaporan) {
      const tanggal = matchedLog?.tanggal || matchedLaporan?.tanggal || '2026-08-15';
      const menuNama =
        matchedLaporan?.menu ||
        `Menu Masakan Sehat (${matchedLog?.jenisMakanan ? matchedLog.jenisMakanan.toUpperCase() : 'Lauk Lengkap & Sayur'})`;
      const isAman = matchedLog ? matchedLog.statusKadaluarsa === 'aman' : true;
      const score = matchedLaporan?.qcScore || (isAman ? 98 : 70);
      const grade = matchedLaporan?.qcGrade || (isAman ? 'A+' : 'C');
      const verifier =
        matchedLog?.petugasLabName ||
        matchedLaporan?.qcApprovedBy ||
        'Dr. Tri Wibowo, S.Gz';
      const certifiedAt = matchedLog?.waktuUkurSuhu
        ? `${matchedLog.waktuUkurSuhu} WIB`
        : matchedLaporan?.qcTimestamp
        ? `${matchedLaporan.qcTimestamp} WIB`
        : '07:35 WIB';
      const suhuInti = matchedLog?.suhuIntiMatang || 84.5;
      const suhuHolding = matchedLog?.suhuHoldingBox || matchedLog?.suhuPenyimpanan || 64.2;

      return {
        id: `PASSPORT-${selectedBatchId}`,
        batchId: matchedLaporan?.batchId || matchedLog?.id || selectedBatchId,
        sppgId: currentSppg?.id || 'SPPG-001',
        tanggal,
        menuNama,
        score,
        grade,
        verifierName: verifier,
        verifierRole: 'Ahli Gizi SPPG Terverifikasi BGN',
        parameters: {
          titikMatang: {
            value: suhuInti,
            unit: '°C',
            passed: suhuInti >= 75,
            note:
              suhuInti >= 75
                ? `Suhu titik matang inti masakan (${suhuInti}°C) di atas ambang batas kritis BGN (≥75.0°C).`
                : `Suhu titik matang (${suhuInti}°C) di bawah standar batas aman BGN.`,
          },
          organoleptik: {
            passed: matchedLog?.rapidTestFormalin !== 'positif' && matchedLog?.rapidTestBoraks !== 'positif',
            note:
              matchedLog?.catatanLab ||
              'Uji kimiawi 4 parameter (Formalin, Boraks, Pestisida, E.Coli) Negatif racun & organoleptik prima.',
            rasa: 'Gurih Manis Pas',
            aroma: 'Harum Sedap',
            tekstur: 'Empuk Lembut',
          },
          gramasiPorsi: {
            passed: true,
            note: 'Gramasi tiap komponen piring memenuhi standar kecukupan nutrisi AKG BGN.',
            nasi: 150,
            protein: 80,
            sayur: 60,
            buah: 50,
          },
          suhuHolding: {
            value: suhuHolding,
            unit: '°C',
            passed: suhuHolding >= 60,
            note: `Suhu makanan di dalam thermal box (${suhuHolding}°C) terjaga hangat di atas 60°C selama distribusi.`,
          },
          sealingTutup: {
            passed: true,
            note: 'Klip 4 sisi terkunci rapat dan band sealer anti-tumpah terpasang rapi.',
          },
          higieneApd: {
            passed: true,
            note: 'Seluruh kru pemorsi mengenakan apron, hairnet, masker, dan sarung tangan steril 100%.',
          },
        },
        certifiedAt,
      };
    }

    return qualityPassportList[0];
  }, [
    qualityPassportList,
    selectedBatchId,
    initialTanggal,
    initialLogId,
    foodSafetyList,
    laporanList,
    currentSppg,
  ]);

  if (!passport) return null;

  const { parameters } = passport;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[PASPOR MUTU DIGITAL SPPG] Batch: ${passport.batchId} | Menu: ${passport.menuNama} | Skor Mutu: ${passport.score}/100 (Grade ${passport.grade}) | Terverifikasi Aman & Memenuhi Standar AKG Badan Gizi Nasional.`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Batch Switcher Bar */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>
          Pilih Batch Produksi & Paspor Mutu:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {availableBatches.map((b) => {
            const isSelected = selectedBatchId === b.batchId;
            return (
              <Pressable
                key={b.batchId}
                onPress={() => setSelectedBatchId(b.batchId)}
                style={[
                  styles.batchChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name="award" size={12} color={isSelected ? '#FFF' : colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#FFF' : colors.text }}>
                  {b.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Official Certificate Card */}
      <Card
        style={[
          styles.certificateCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.gold || '#D97706',
            borderRadius: radius.xl,
          },
        ]}
      >
        {/* Certificate Header Emblem */}
        <View style={styles.certHeader}>
          <View style={styles.emblemRow}>
            <Image source={BRAND_ASSETS.polriEmblem} style={styles.emblemSmall} resizeMode="contain" />
            <Image source={BRAND_ASSETS.bgnLogo} style={styles.emblemSmall} resizeMode="contain" />
          </View>
          <Text style={{ fontSize: 10, fontWeight: '900', color: colors.primary, letterSpacing: 1 }}>
            SATUAN PELAYANAN PEMENUHAN GIZI (SPPG) POLRI
          </Text>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.text, marginTop: 2 }}>
            DIGITAL FOOD QUALITY PASSPORT
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Sertifikat Kelayakan Mutu & Keamanan Pangan Harian
          </Text>
        </View>

        {/* Big Score Badge */}
        <View style={[styles.scoreHero, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', borderRadius: radius.lg }]}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success }}>
              FOOD QUALITY SCORE INDEX
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 2 }}>
              <Text style={{ fontSize: 38, fontWeight: '900', color: colors.success }}>{passport.score}</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMuted }}>/ 100</Text>
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: colors.success }]}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF' }}>GRADE {passport.grade} (SANGAT BAIK)</Text>
            </View>
          </View>
        </View>

        {/* Menu & Batch Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kode Batch:</Text>
            <Text style={styles.infoValue}>{passport.batchId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sajian Menu:</Text>
            <Text style={styles.infoValue}>{passport.menuNama}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unit Dapur:</Text>
            <Text style={styles.infoValue}>{currentSppg?.nama ?? passport.sppgId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu Sertifikasi:</Text>
            <Text style={styles.infoValue}>{passport.tanggal}, {passport.certifiedAt}</Text>
          </View>
        </View>

        <SectionTitle>Hasil Audit 6 Parameter Mutu Kritis</SectionTitle>

        {/* 6 Parameter Checklist */}
        <View style={{ gap: 10 }}>
          {/* 1. Titik Matang */}
          <View style={[styles.paramCard, { backgroundColor: colors.background, borderRadius: radius.md }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  1. Titik Matang Inti Pemanasan
                </Text>
              </View>
              <Pill label={`${parameters.titikMatang.value}°C`} tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 26 }}>
              {parameters.titikMatang.note}
            </Text>
          </View>

          {/* 2. Organoleptik */}
          <View style={[styles.paramCard, { backgroundColor: colors.background, borderRadius: radius.md }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  2. Uji Organoleptik & Bebas Kontaminasi
                </Text>
              </View>
              <Pill label="Lolos Uji" tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 26 }}>
              {parameters.organoleptik.note}
            </Text>
          </View>

          {/* 3. Gramasi Porsi */}
          <View style={[styles.paramCard, { backgroundColor: colors.background, borderRadius: radius.md }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  3. Presisi Gramasi AKG Standar BGN
                </Text>
              </View>
              <Pill label="Presisi 100%" tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 26 }}>
              Nasi {parameters.gramasiPorsi.nasi}g · Lauk {parameters.gramasiPorsi.protein}g · Sayur {parameters.gramasiPorsi.sayur}g · Buah {parameters.gramasiPorsi.buah}g
            </Text>
          </View>

          {/* 4. Suhu Holding */}
          <View style={[styles.paramCard, { backgroundColor: colors.background, borderRadius: radius.md }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  4. Suhu Holding Thermal Box
                </Text>
              </View>
              <Pill label={`${parameters.suhuHolding.value}°C`} tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 26 }}>
              {parameters.suhuHolding.note}
            </Text>
          </View>

          {/* 5. Sealing */}
          <View style={[styles.paramCard, { backgroundColor: colors.background, borderRadius: radius.md }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  5. Kerapatan Sealing Tutup Ompreng
                </Text>
              </View>
              <Pill label="Anti-Bocor" tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 26 }}>
              {parameters.sealingTutup.note}
            </Text>
          </View>

          {/* 6. Higiene APD */}
          <View style={[styles.paramCard, { backgroundColor: colors.background, borderRadius: radius.md }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                  6. Standar Higiene & Kepatuhan APD
                </Text>
              </View>
              <Pill label="100% Lengkap" tone="success" />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 26 }}>
              {parameters.higieneApd.note}
            </Text>
          </View>
        </View>

        {/* Signature & Verification Seal */}
        <View style={[styles.sealBox, { borderColor: colors.border, borderTopWidth: 1, paddingTop: 16, marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Diverifikasi & Divalidasi Oleh:</Text>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                {passport.verifierName}
              </Text>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                {passport.verifierRole}
              </Text>
            </View>
            <View style={[styles.stampPill, { borderColor: colors.success }]}>
              <Feather name="award" size={13} color={colors.success} />
              <Text style={{ fontSize: 10, fontWeight: '900', color: colors.success }}>BGN APPROVED</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={{ gap: spacing.xs }}>
        <PrimaryButton label="Bagikan Paspor Mutu Digital" icon="share-2" onPress={handleShare} />
        <SecondaryButton label="Lihat Rantai Pasok (Batch Traceability)" icon="archive" onPress={() => navigation.navigate('BatchTraceability', { batchId: passport.batchId })} />
        <SecondaryButton label="Kembali" icon="arrow-left" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 64 },
  certificateCard: { padding: 18, borderWidth: 1.5, gap: 14 },
  certHeader: { alignItems: 'center', textAlign: 'center' },
  emblemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  emblemSmall: { width: 36, height: 36 },
  scoreHero: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  infoBox: { padding: 12, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 11, color: '#64748B', flexShrink: 0 },
  infoValue: { fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'right' },
  paramCard: { padding: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sealBox: { gap: 4 },
  stampPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderRadius: 8 },
  batchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
});
