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

export default function AduanMasyarakatScreen() {
  const { publicReportList, sppgList, submitPublicReport, updatePublicReportStatus, currentSppg } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('semua');
  const [selectedReport, setSelectedReport] = useState<PublicReport | null>(null);

  // Response State
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [tanggapanText, setTanggapanText] = useState('');
  const [newStatus, setNewStatus] = useState<PublicReportStatus>('ditindaklanjuti');

  const filteredReports = publicReportList.filter((r) => {
    if (activeTab === 'semua') return true;
    return r.status === activeTab;
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
                Modul Aduan Masyarakat
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, marginTop: 2 }}>
                Layanan pengaduan publik & transparansi program Makan Bergizi Gratis
              </Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Feather name="message-square" size={24} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
            </View>
          </View>

          <View style={[styles.demoBadge, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.sm }]}>
            <Feather name="check-circle" size={12} color="#FDE047" strokeWidth={2} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse }}>
              Portal Pengaduan Publik Real-Time Connected
            </Text>
          </View>
        </Card>

        {/* Action Bar Header */}
        <View style={styles.rowBetween}>
          <View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
              Daftar Aduan Masuk ({filteredReports.length})
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
            { id: 'semua', label: 'Semua' },
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

          return (
            <Card key={report.id} style={{ gap: spacing.sm }} onPress={() => setSelectedReport(report)}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
                    {report.id} · {report.timestamp}
                  </Text>
                  <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                    {report.judul}
                  </Text>
                </View>
                <Pill tone={STATUS_COLOR[report.status]} label={STATUS_LABEL[report.status]} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Pill tone="neutral" label={`SPPG: ${sppg?.nama ?? report.sppgId}`} />
                <Pill tone="primary" label={KATEGORI_LABEL[report.kategori]} />
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
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  uploadBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderWidth: 1, borderStyle: 'dashed' },
});
