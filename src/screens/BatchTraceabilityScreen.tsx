import React, { useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { BatchTraceabilityStep } from '../types';
import { SPPG_ASSET_MAP } from '../data/sppgAssetMap';
import { toWhatsAppNumber } from '../utils/contact';

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

const STAGE_DOCS_MAP: Record<BatchTraceabilityStep['stage'], { photos: string[]; caption: string; standardDoc: string; picPhone: string }> = {
  supplier_bahan: {
    photos: [SPPG_ASSET_MAP.polri_1, SPPG_ASSET_MAP.suasana_sppg_1],
    caption: 'Fisik karung Beras Bulog Subang & Daging Ayam Broiler segar tiba di loading dock dengan surat jalan DO-BGN-098.',
    standardDoc: 'SOP Penerimaan Bahan Baku BGN No. 04/LOG/2026',
    picPhone: '0812-1000-0020',
  },
  dapur_masak: {
    photos: [SPPG_ASSET_MAP.lh04_ayam_goreng, SPPG_ASSET_MAP.suasana_sppg_2],
    caption: 'Proses perebusan & penumisan ayam bumbu kecap pada kettle steam stainless 304 suhu inti 84.5°C.',
    standardDoc: 'SOP Pemasakan & Titik Matang Inti 75°C BGN',
    picPhone: '0812-1000-0002',
  },
  uji_qc: {
    photos: [SPPG_ASSET_MAP.suasana_sppg_3, SPPG_ASSET_MAP.paket_nasi_ayam_goreng],
    caption: 'Pengukuran suhu thermogun inframerah dan uji organoleptik rasa oleh Ahli Gizi SPPG.',
    standardDoc: 'Standar Keamanan Pangan & AKG Gizi Nasional 2026',
    picPhone: '0812-1000-0005',
  },
  pemorsian_packing: {
    photos: [SPPG_ASSET_MAP.tray_1, SPPG_ASSET_MAP.tray_2],
    caption: 'Penataan 1.500 ompreng steril bersegel klip 4 sisi anti-bocor dan pemuatan ke 50 thermal box suhu 64.2°C.',
    standardDoc: 'SOP Pemorsian & Sealing Higienis SPPG-POLRI',
    picPhone: '0812-1000-0019',
  },
  armada_kirim: {
    photos: [SPPG_ASSET_MAP.mobil_1, SPPG_ASSET_MAP.mobil_2],
    caption: 'Mobil Box Pendingin Dapur SPPG B-1928-POL meluncur ke rute sekolah dengan pelacakan GPS real-time.',
    standardDoc: 'SOP Distribusi Rantai Panas Holding Box BGN',
    picPhone: '0812-1000-0006',
  },
  penerimaan_sekolah: {
    photos: [SPPG_ASSET_MAP.sekolah_1, SPPG_ASSET_MAP.profil_guru],
    caption: 'Serah terima ompreng hangat di gerbang SDN 01 Merdeka diverifikasi oleh Ibu Guru Ratna Kusuma, S.Pd.',
    standardDoc: 'Berita Acara Serah Terima (BAST) Digital MBG',
    picPhone: '0812-9900-1122',
  },
};

export default function BatchTraceabilityScreen({ navigation, route }: any) {
  const { batchTraceabilityList, role } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    route?.params?.batchId || batchTraceabilityList[0]?.batchId || 'BATCH-20260815-01',
  );
  const [selectedStepModal, setSelectedStepModal] = useState<BatchTraceabilityStep | null>(null);

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

  const handleShareStep = async (step: BatchTraceabilityStep) => {
    try {
      await Share.share({
        message: `[BUKTI AUDIT RANTAI PASOK MBG]\nBatch: ${currentBatch.batchId}\nTahap: ${step.title}\nWaktu: ${step.timestamp}\nLokasi: ${step.lokasi}\nPIC: ${step.picName} (${step.picRole})\nStatus: TERVERIFIKASI LOLOS AUDIT BGN & POLRI.`,
      });
    } catch (e) {
      // ignore
    }
  };

  const modalDocs = selectedStepModal ? STAGE_DOCS_MAP[selectedStepModal.stage] : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Hero Overview Card */}
      <Card
        style={{
          backgroundColor: colors.surface,
          gap: spacing.sm,
          borderRadius: radius.xl,
          borderWidth: 1.5,
          borderColor: isDark ? colors.border : '#F59E0B',
        }}
      >
        <View style={styles.rowBetween}>
          <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7' }]}>
            <Feather name="shield" size={13} color="#D97706" strokeWidth={2.2} />
            <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#FBBF24' : '#B45309', letterSpacing: 0.8 }}>
              FOOD SUPPLY CHAIN TRACEABILITY
            </Text>
          </View>
          <Pill label={currentBatch.status.replace('_', ' ').toUpperCase()} tone="success" />
        </View>

        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
            KODE BATCH: {currentBatch.batchId} · SPPG-001
          </Text>
          <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text, marginTop: 2 }}>
            {currentBatch.menuNama}
          </Text>
          <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
            Tanggal Masak: {currentBatch.tanggal} · Realisasi: {currentBatch.totalPorsi.toLocaleString('id-ID')} Porsi
          </Text>
        </View>

        <View style={[styles.summaryGrid, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Rantai Pasok</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text }}>6 Tahap Lengkap</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Status Keamanan</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.success }}>100% Lolos Uji</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Paspor Mutu</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: isDark ? '#FBBF24' : '#B45309' }}>Grade A+ (96/100)</Text>
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

      <SectionTitle
        action={
          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
            Ketuk kartu untuk bukti audit & foto
          </Text>
        }
      >
        Alur Penelusuran Rantai Pangan (Farm-to-Fork)
      </SectionTitle>

      {/* Interactive Timeline Chain */}
      <View style={{ gap: 12 }}>
        {currentBatch.steps.map((step, idx) => {
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
                style={{ flex: 1, gap: spacing.xs, marginBottom: 8, borderColor: colors.border }}
                onPress={() => setSelectedStepModal(step)}
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

                {/* Micro preview snippet */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="camera" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 10.5, color: colors.primary, fontWeight: '700' }}>
                      Lihat Foto Bukti & Rincian Audit
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.primary }}>Buka Modal</Text>
                    <Feather name="chevron-right" size={12} color={colors.primary} />
                  </View>
                </View>
              </Card>
            </View>
          );
        })}
      </View>

      {/* DETAIL MODAL WITH PHOTOS AND COMPREHENSIVE DOCUMENTATION */}
      <Modal
        visible={!!selectedStepModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedStepModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radius.xl, maxHeight: '90%' }]}>
            {selectedStepModal && modalDocs && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
                {/* Modal Header */}
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[styles.modalIconWrap, { backgroundColor: colors[STAGE_COLOR_MAP[selectedStepModal.stage]] || colors.primary }]}>
                      <Feather name={STAGE_ICON_MAP[selectedStepModal.stage]} size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                        {selectedStepModal.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                        {selectedStepModal.timestamp} · {selectedStepModal.lokasi}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setSelectedStepModal(null)} hitSlop={8}>
                    <Feather name="x" size={22} color={colors.textMuted} />
                  </Pressable>
                </View>

                {/* PIC Info Card & Quick Call */}
                <View style={[styles.picCard, { backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>PENANGGUNG JAWAB TAHAP INI</Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>{selectedStepModal.picName}</Text>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{selectedStepModal.picRole}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${modalDocs.picPhone}`)}
                        style={[styles.contactCircle, { backgroundColor: colors.primary }]}
                      >
                        <Feather name="phone" size={14} color="#FFF" />
                      </Pressable>
                      <Pressable
                        onPress={() => Linking.openURL(`https://wa.me/${toWhatsAppNumber(modalDocs.picPhone)}`)}
                        style={[styles.contactCircle, { backgroundColor: '#10B981' }]}
                      >
                        <Feather name="message-circle" size={14} color="#FFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Gallery Documentation */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                    Dokumentasi Fisik & Bukti Lapangan:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {modalDocs.photos.map((uri, pIdx) => (
                      <View key={pIdx} style={[styles.photoFrame, { borderColor: colors.border, borderRadius: radius.md }]}>
                        <Image source={typeof uri === 'number' ? uri : { uri }} style={styles.photoImg} resizeMode="cover" />
                        <View style={styles.photoBadge}>
                          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FFF' }}>Bukti #{pIdx + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16, fontStyle: 'italic' }}>
                    {modalDocs.caption}
                  </Text>
                </View>

                {/* Audit Key-Value Table */}
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                    Parameter Audit Rantai Pasok:
                  </Text>
                  <View style={[styles.tableBox, { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}>
                    {Object.entries(selectedStepModal.detail).map(([k, v], rIdx) => (
                      <View key={k} style={[styles.tableRow, rIdx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={{ fontSize: 11, color: colors.textMuted, width: '44%' }}>{k}</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.text, flex: 1 }}>{String(v)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Compliance Badge */}
                <View style={[styles.complianceBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', borderColor: '#10B981', borderRadius: radius.md }]}>
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                      Audit Lolos & Terverifikasi
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                      {modalDocs.standardDoc}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: spacing.xs, marginTop: 4 }}>
                  <PrimaryButton
                    label="Bagikan Bukti Audit Tahap Ini"
                    icon="share-2"
                    onPress={() => handleShareStep(selectedStepModal)}
                  />
                  <SecondaryButton label="Tutup Detail" onPress={() => setSelectedStepModal(null)} />
                </View>
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>

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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 480, padding: 18 },
  modalIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  picCard: { padding: 12 },
  contactCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  photoFrame: { width: 140, height: 95, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tableBox: { paddingHorizontal: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 8 },
  complianceBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1 },
});
