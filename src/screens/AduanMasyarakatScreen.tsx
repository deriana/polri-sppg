import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Input, Pill, PrimaryButton, SecondaryButton } from '../components/ui';
import { PublicReport, PublicReportKategori, PublicReportStatus } from '../types';

const KATEGORI_LABEL: Record<PublicReportKategori, string> = {
  kualitas_makanan: 'Kualitas Makanan',
  keterlambatan: 'Keterlambatan',
  kebersihan: 'Kebersihan',
  kemasan: 'Kemasan Box',
  layanan: 'Layanan Staff',
  lainnya: 'Lainnya',
};

const STATUS_COLOR: Record<PublicReportStatus, 'info' | 'warning' | 'primary' | 'success'> = {
  dikirim: 'warning',
  diproses: 'info',
  ditindaklanjuti: 'primary',
  selesai: 'success',
};

const STATUS_LABEL: Record<PublicReportStatus, string> = {
  dikirim: 'Baru Dikirim',
  diproses: 'Sedang Diproses',
  ditindaklanjuti: 'Ditindaklanjuti',
  selesai: 'Selesai',
};

const AI_CLUSTER_META: Record<
  string,
  { label: string; icon: keyof typeof Feather.glyphMap; tone: 'warning' | 'danger' | 'info' | 'primary' | 'success'; pct: number }
> = {
  all: { label: 'Semua Klaster', icon: 'layers', tone: 'primary', pct: 100 },
  menu_preference: { label: 'Menu Preference', icon: 'award', tone: 'success', pct: 69 },
  quality_issue: { label: 'Quality Issue', icon: 'shield', tone: 'danger', pct: 11 },
  portion_issue: { label: 'Portion Issue', icon: 'package', tone: 'primary', pct: 8 },
  taste_issue: { label: 'Taste Issue', icon: 'coffee', tone: 'warning', pct: 7 },
  distribution_issue: { label: 'Distribution Issue', icon: 'truck', tone: 'info', pct: 5 },
};

export default function AduanMasyarakatScreen() {
  const { publicReportList, sppgList, submitPublicReport, updatePublicReportStatus, currentSppg } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('semua');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<PublicReport | null>(null);

  // Response State
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [tanggapanText, setTanggapanText] = useState('');
  const [newStatus, setNewStatus] = useState<PublicReportStatus>('ditindaklanjuti');

  const filteredReports = publicReportList.filter((r) => {
    const matchTab = activeTab === 'semua' || r.status === activeTab;
    const matchCluster = selectedCluster === 'all' || r.aiCluster === selectedCluster;
    return matchTab && matchCluster;
  });

  const handleSaveResponse = (id: string) => {
    updatePublicReportStatus(id, newStatus, tanggapanText.trim() ? tanggapanText.trim() : undefined);
    setRespondingId(null);
    setTanggapanText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        {/* Banner */}
        <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.textInverse }}>
                MBG Citizen Feedback & Aduan
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, marginTop: 2 }}>
                Layanan feedback publik & AI Topic Clustering program Makan Bergizi Gratis
              </Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Feather name="message-square" size={24} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
            </View>
          </View>

          <View style={[styles.demoBadge, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.sm }]}>
            <Feather name="cpu" size={12} color="#FDE047" strokeWidth={2} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse }}>
              AI NLP Sentiment & Clustering Engine Active
            </Text>
          </View>
        </Card>

        {/* AI TOPIC CLUSTERING & EXECUTIVE SUMMARY FOR LEADERSHIP */}
        <Card
          style={{
            backgroundColor: isDark ? colors.surface : '#F8FAFC',
            borderColor: colors.border,
            borderWidth: 1.5,
            gap: 10,
          }}
        >
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isDark ? 'rgba(59,130,246,0.25)' : '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="cpu" size={14} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
                AI FEEDBACK CLUSTERING & INSIGHTS
              </Text>
            </View>
            <Pill tone="success" label="Kepuasan 4.7 / 5.0" />
          </View>

          {/* Quick Metrics Bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background, padding: 10, borderRadius: radius.md }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Total Masukan</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>1.240 Ulasan</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Sentimen Positif</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: colors.success }}>94.2% Puas</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Tindak Lanjut</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: colors.primary }}>100% Respons</Text>
            </View>
          </View>

          {/* AI Cluster Filters */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.textMuted }}>
              Filter Berdasarkan Klaster AI:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {Object.entries(AI_CLUSTER_META).map(([key, meta]) => {
                const isSelected = selectedCluster === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedCluster(key)}
                    style={[
                      styles.clusterChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather name={meta.icon} size={11} color={isSelected ? '#FFF' : colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#FFF' : colors.text }}>
                      {meta.label} ({meta.pct}%)
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Executive Summary Box */}
          <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Feather name="file-text" size={13} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>
                Executive Summary AI untuk Pimpinan:
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.text, lineHeight: 16 }}>
              Pimpinan SPPG tidak perlu membaca ribuan komentar satu per satu. AI menyimpulkan: Kepuasan program minggu ini sangat tinggi (4.7/5). Menu favorit tertinggi adalah Olahan Ikan Gurame & Ayam Kecap. Poin evaluasi prioritas: penyesuaian gramasi porsi untuk siswa kelas atas (SD 4-6) dan takaran bumbu sop sayur.
            </Text>
          </View>
        </Card>

        {/* Action Bar Header */}
        <View style={styles.rowBetween}>
          <View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
              Daftar Masukan Warga ({filteredReports.length})
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
              Klik kartu aduan untuk melihat rincian & menindaklanjuti
            </Text>
          </View>
          <Pill tone="primary" label="Portal Publik" />
        </View>

        {/* Tabs Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {[
            { id: 'semua', label: 'Semua Status' },
            { id: 'dikirim', label: 'Dikirim' },
            { id: 'diproses', label: 'Diproses' },
            { id: 'ditindaklanjuti', label: 'Ditindaklanjuti' },
            { id: 'selesai', label: 'Selesai' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={{ fontSize: fontSize.xs, fontWeight: active ? '700' : '500', color: active ? colors.textInverse : colors.text }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Report List */}
        {filteredReports.map((report) => {
          const sppg = sppgList.find((s) => s.id === report.sppgId);
          const isResponding = respondingId === report.id;
          const clusterMeta = report.aiCluster ? AI_CLUSTER_META[report.aiCluster] : null;

          return (
            <Card key={report.id} style={{ gap: spacing.sm }} onPress={() => setSelectedReport(report)}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
                      {report.id} · {report.timestamp}
                    </Text>
                    {report.ratingBintang && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        {Array.from({ length: report.ratingBintang }).map((_, i) => (
                          <Feather key={i} name="star" size={11} color="#EAB308" />
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                    {report.judul}
                  </Text>
                </View>
                <Pill tone={STATUS_COLOR[report.status]} label={STATUS_LABEL[report.status]} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Pill tone="neutral" label={`SPPG: ${sppg?.nama ?? report.sppgId}`} />
                <Pill tone="primary" label={KATEGORI_LABEL[report.kategori]} />
                {clusterMeta && (
                  <Pill tone={clusterMeta.tone} label={`AI: ${clusterMeta.label}`} icon={clusterMeta.icon} />
                )}
                {report.peranPelapor && (
                  <Pill tone="info" label={report.peranPelapor.replace('_', ' ').toUpperCase()} />
                )}
              </View>

              <Text style={{ fontSize: fontSize.sm, color: colors.text, lineHeight: 20 }} numberOfLines={3}>{report.deskripsi}</Text>

              {report.fotoBukti && (
                <View style={[styles.imageWrapper, { borderRadius: radius.md, overflow: 'hidden' }]}>
                  <Image source={{ uri: report.fotoBukti }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                </View>
              )}

              <View style={[styles.reporterBar, { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm }]}>
                <Feather name="user" size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
                  {report.namaPelapor}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>({report.noHpPelapor})</Text>
                <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', marginLeft: 'auto' }}>Lihat Detail ➔</Text>
              </View>

              {/* Tanggapan Resmi */}
              {report.tanggapan ? (
                <View style={[styles.tanggapanBox, { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Feather name="check-circle" size={14} color={colors.primary} strokeWidth={2} />
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
                      Tanggapan Resmi SPPG:
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }} numberOfLines={2}>{report.tanggapan}</Text>
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>

      {/* Modal Detail Aduan Informatif */}
      <Modal visible={!!selectedReport} animationType="slide" transparent onRequestClose={() => setSelectedReport(null)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '92%' }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text }}>Detail Aduan Publik</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>ID: {selectedReport?.id}</Text>
              </View>
              <Pressable onPress={() => setSelectedReport(null)}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            {selectedReport && (() => {
              const sppg = sppgList.find((s) => s.id === selectedReport.sppgId);
              const isResponding = respondingId === selectedReport.id;

              return (
                <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Pill tone={STATUS_COLOR[selectedReport.status]} label={STATUS_LABEL[selectedReport.status]} />
                    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{selectedReport.timestamp}</Text>
                  </View>

                  <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>{selectedReport.judul}</Text>

                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    <Pill tone="neutral" label={`Dapur SPPG: ${sppg?.nama ?? selectedReport.sppgId}`} />
                    <Pill tone="primary" label={KATEGORI_LABEL[selectedReport.kategori]} />
                  </View>

                  <View style={[styles.reporterBar, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, marginTop: 4 }]}>
                    <Feather name="user" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
                        Pelapor: {selectedReport.namaPelapor}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>Kontak WhatsApp: {selectedReport.noHpPelapor}</Text>
                    </View>
                  </View>

                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Uraian Lengkap Aduan:</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.text, lineHeight: 22 }}>{selectedReport.deskripsi}</Text>
                  </View>

                  {selectedReport.fotoBukti && (
                    <View style={{ gap: 4, marginTop: 4 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Foto Lampiran Bukti:</Text>
                      <Image source={{ uri: selectedReport.fotoBukti }} style={{ width: '100%', height: 180, borderRadius: radius.md }} resizeMode="cover" />
                    </View>
                  )}

                  {/* Tanggapan Resmi */}
                  {selectedReport.tanggapan && (
                    <View style={[styles.tanggapanBox, { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 12, marginTop: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Feather name="check-circle" size={16} color={colors.primary} />
                        <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
                          Tanggapan Penanggung Jawab SPPG:
                        </Text>
                      </View>
                      <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 20 }}>{selectedReport.tanggapan}</Text>
                    </View>
                  )}

                  {/* Response Action inside Modal */}
                  {isResponding ? (
                    <View style={[styles.responseForm, { borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.sm, marginTop: 6 }]}>
                      <Input
                        label="Balas & Beri Tanggapan Resmi"
                        value={tanggapanText}
                        onChangeText={setTanggapanText}
                        placeholder="Tuliskan tindakan atau jawaban penanganan..."
                        multiline
                      />
                      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                        {(['diproses', 'ditindaklanjuti', 'selesai'] as PublicReportStatus[]).map((st) => (
                          <Pressable
                            key={st}
                            onPress={() => setNewStatus(st)}
                            style={[
                              styles.statusChip,
                              {
                                backgroundColor: newStatus === st ? colors.primary : colors.surface,
                                borderColor: newStatus === st ? colors.primary : colors.border,
                                borderRadius: radius.sm,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: fontSize.xs, color: newStatus === st ? colors.textInverse : colors.text, fontWeight: '700' }}>
                              {STATUS_LABEL[st]}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <SecondaryButton label="Batal" onPress={() => setRespondingId(null)} style={{ flex: 1 }} />
                        <PrimaryButton label="Simpan Tanggapan" onPress={() => {
                          handleSaveResponse(selectedReport.id);
                          setSelectedReport((prev) => prev ? { ...prev, status: newStatus, tanggapan: tanggapanText } : null);
                        }} style={{ flex: 1 }} />
                      </View>
                    </View>
                  ) : (
                    <PrimaryButton
                      label={selectedReport.tanggapan ? 'Perbarui Balasan Tanggapan' : 'Balas & Tindak Lanjuti Aduan Ini'}
                      icon="edit-3"
                      onPress={() => {
                        setRespondingId(selectedReport.id);
                        setTanggapanText(selectedReport.tanggapan || '');
                        setNewStatus(selectedReport.status);
                      }}
                      style={{ marginTop: 8 }}
                    />
                  )}

                  <SecondaryButton label="Tutup Modal" onPress={() => setSelectedReport(null)} style={{ marginTop: 4 }} />
                </ScrollView>
              );
            })()}
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  imageWrapper: { width: '100%', marginTop: 4 },
  reporterBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tanggapanBox: { borderLeftWidth: 3, borderLeftColor: '#0284C7' },
  responseForm: { borderTopWidth: 1 },
  statusChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { maxHeight: '90%', borderRadius: 16, gap: 12, padding: 20 },
  clusterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  uploadBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderWidth: 1, borderStyle: 'dashed' },
});
