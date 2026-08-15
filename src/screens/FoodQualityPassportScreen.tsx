import React, { useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { BRAND_ASSETS } from '../data/images';

export default function FoodQualityPassportScreen({ navigation, route }: any) {
  const { qualityPassportList, currentSppg } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const batchId = route?.params?.batchId || 'BATCH-20260815-01';

  const passport = useMemo(
    () => qualityPassportList.find((p) => p.batchId === batchId) || qualityPassportList[0],
    [qualityPassportList, batchId],
  );

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
});
