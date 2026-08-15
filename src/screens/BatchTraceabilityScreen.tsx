import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { BatchTraceabilityStep } from '../types';

const STAGE_ICON_MAP: Record<BatchTraceabilityStep['stage'], keyof typeof Feather.glyphMap> = {
  supplier_bahan: 'archive',
  dapur_masak: 'coffee',
  uji_qc: 'activity',
  pemorsian_packing: 'package',
  armada_kirim: 'truck',
  penerimaan_sekolah: 'home',
};

const STAGE_COLOR_MAP: Record<BatchTraceabilityStep['stage'], 'primary' | 'warning' | 'success' | 'info'> = {
  supplier_bahan: 'primary',
  dapur_masak: 'warning',
  uji_qc: 'success',
  pemorsian_packing: 'info',
  armada_kirim: 'primary',
  penerimaan_sekolah: 'success',
};

export default function BatchTraceabilityScreen({ navigation, route }: any) {
  const { batchTraceabilityList, role } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    route?.params?.batchId || batchTraceabilityList[0]?.batchId || 'BATCH-20260815-01',
  );
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);

  const currentBatch = useMemo(
    () => batchTraceabilityList.find((b) => b.batchId === selectedBatchId) || batchTraceabilityList[0],
    [batchTraceabilityList, selectedBatchId],
  );

  if (!currentBatch) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="archive" title="Batch Tidak Ditemukan" body="Data penelusuran batch makanan belum tersedia." />
      </View>
    );
  }

  const toggleExpand = (idx: number) => {
    setExpandedStepIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Hero Overview Card */}
      <Card style={{ backgroundColor: isDark ? colors.surface : '#0F172A', gap: spacing.sm, borderRadius: radius.xl }}>
        <View style={styles.rowBetween}>
          <View style={[styles.badgePill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <Feather name="shield" size={13} color="#FBBF24" strokeWidth={2.2} />
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.8 }}>
              FOOD SUPPLY CHAIN TRACEABILITY
            </Text>
          </View>
          <Pill label={currentBatch.status.replace('_', ' ').toUpperCase()} tone="success" />
        </View>

        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#FBBF24' }}>
            KODE BATCH: {currentBatch.batchId} · SPPG-001
          </Text>
          <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: '#FFFFFF', marginTop: 2 }}>
            {currentBatch.menuNama}
          </Text>
          <Text style={{ fontSize: 11.5, color: '#94A3B8' }}>
            Tanggal Masak: {currentBatch.tanggal} · Total Realisasi: {currentBatch.totalPorsi.toLocaleString('id-ID')} Porsi
          </Text>
        </View>

        <View style={[styles.summaryGrid, { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md }]}>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: 10, color: '#94A3B8' }}>Rantai Pasok</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#F8FAFC' }}>6 Tahap Lengkap</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: 10, color: '#94A3B8' }}>Status Keamanan</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>100% Lolos Uji</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: 10, color: '#94A3B8' }}>Sertifikat Mutu</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FBBF24' }}>Grade A+ (96/100)</Text>
          </View>
        </View>
      </Card>

      {/* Quick Action to Quality Passport */}
      <Pressable
        onPress={() => navigation.navigate('FoodQualityPassport', { batchId: currentBatch.batchId })}
        style={({ pressed }) => [
          styles.passportBanner,
          {
            backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#ECFDF5',
            borderColor: colors.success,
            borderRadius: radius.lg,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={[styles.passportIcon, { backgroundColor: colors.success }]}>
          <Feather name="award" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>
            Buka Digital Food Quality Passport
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Lihat sertifikat hasil uji titik matang 84.5°C, organoleptik, & AKG BGN
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.success} />
      </Pressable>

      <SectionTitle>Alur Penelusuran Rantai Pangan (Farm-to-Fork)</SectionTitle>

      {/* Interactive Timeline Chain */}
      <View style={{ gap: 12 }}>
        {currentBatch.steps.map((step, idx) => {
          const isExpanded = expandedStepIndex === idx || expandedStepIndex === null;
          const isLast = idx === currentBatch.steps.length - 1;
          const tone = STAGE_COLOR_MAP[step.stage] || 'primary';

          return (
            <View key={step.stage} style={styles.timelineRow}>
              {/* Left Timeline Indicator */}
              <View style={styles.timelineLineContainer}>
                <View style={[styles.timelineNode, { backgroundColor: colors[tone] || colors.primary }]}>
                  <Feather name={STAGE_ICON_MAP[step.stage]} size={14} color="#FFFFFF" strokeWidth={2} />
                </View>
                {!isLast && <View style={[styles.timelineTrack, { backgroundColor: colors.border }]} />}
              </View>

              {/* Right Step Content Card */}
              <Card
                style={{ flex: 1, gap: spacing.xs, marginBottom: 8 }}
                onPress={() => toggleExpand(idx)}
              >
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                      {step.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 1 }}>
                      {step.timestamp} · {step.lokasi}
                    </Text>
                  </View>
                  <Pill label={step.status.toUpperCase()} tone="success" />
                </View>

                {/* PIC Responsible Badge */}
                <View style={[styles.picBox, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                  <Feather name="user" size={13} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Penanggung Jawab:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                    {step.picName} ({step.picRole})
                  </Text>
                </View>

                {/* Detailed Key-Value Breakdown */}
                {isExpanded && (
                  <View style={[styles.detailTable, { borderTopColor: colors.border, paddingTop: spacing.xs, marginTop: 4 }]}>
                    {Object.entries(step.detail).map(([key, val]) => (
                      <View key={key} style={styles.detailRow}>
                        <Text style={{ fontSize: 11, color: colors.textMuted, width: '42%' }}>{key}:</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, flex: 1 }}>
                          {String(val)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                    {isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Lengkap'}
                  </Text>
                  <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.primary} />
                </View>
              </Card>
            </View>
          );
        })}
      </View>

      <SecondaryButton
        label="Kembali ke Dashboard"
        icon="arrow-left"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 64 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingHorizontal: 8, marginTop: 4 },
  gridCol: { alignItems: 'center', gap: 2 },
  passportBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1 },
  passportIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineLineContainer: { alignItems: 'center', width: 28 },
  timelineNode: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineTrack: { width: 2, flex: 1, marginVertical: 4 },
  picBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, marginTop: 2 },
  detailTable: { borderTopWidth: 1, gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
});
