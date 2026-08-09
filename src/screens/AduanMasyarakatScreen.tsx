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
  const { publicReportList, sppgList, submitPublicReport, updatePublicReportStatus, currentSppg, isDemoMode } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('semua');
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [namaPelapor, setNamaPelapor] = useState('');
  const [noHpPelapor, setNoHpPelapor] = useState('');
  const [selectedSppgId, setSelectedSppgId] = useState(currentSppg?.id || sppgList[0]?.id || 'SPPG-001');
  const [kategori, setKategori] = useState<PublicReportKategori>('kualitas_makanan');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  // Response State
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [tanggapanText, setTanggapanText] = useState('');
  const [newStatus, setNewStatus] = useState<PublicReportStatus>('ditindaklanjuti');

  const filteredReports = publicReportList.filter((r) => {
    if (activeTab === 'semua') return true;
    return r.status === activeTab;
  });

  const handleSubmitNewReport = () => {
    if (!namaPelapor.trim() || !judul.trim() || !deskripsi.trim()) {
      alert('Mohon lengkapi Nama, Judul, dan Deskripsi aduan.');
      return;
    }

    submitPublicReport({
      sppgId: selectedSppgId,
      namaPelapor: namaPelapor.trim(),
      noHpPelapor: noHpPelapor.trim() || '0812-XXXX-XXXX',
      kategori,
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      fotoBukti: fotoUri || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      tanggal: new Date().toISOString().slice(0, 10),
    });

    setModalVisible(false);
    setNamaPelapor('');
    setNoHpPelapor('');
    setJudul('');
    setDeskripsi('');
    setFotoUri(null);
  };

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

          {isDemoMode && (
            <View style={[styles.demoBadge, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.sm }]}>
              <Feather name="zap" size={12} color="#FDE047" strokeWidth={2} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse }}>
                DEMO SIMULASI ACTIVE — Form Publik Real-Time Connected
              </Text>
            </View>
          )}
        </Card>

        {/* Action Bar */}
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>
            Daftar Laporan ({filteredReports.length})
          </Text>
          <PrimaryButton
            label="Buat Aduan"
            icon="plus"
            onPress={() => setModalVisible(true)}
            style={{ paddingHorizontal: spacing.md, height: 38 }}
          />
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
            <Card key={report.id} style={{ gap: spacing.sm }}>
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

              <Text style={{ fontSize: fontSize.sm, color: colors.text, lineHeight: 20 }}>{report.deskripsi}</Text>

              {report.fotoBukti && (
                <View style={[styles.imageWrapper, { borderRadius: radius.md, overflow: 'hidden' }]}>
                  <Image source={{ uri: report.fotoBukti }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                </View>
              )}

              <View style={[styles.reporterBar, { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm }]}>
                <Feather name="user" size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
                  {report.namaPelapor}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>({report.noHpPelapor})</Text>
              </View>

              {/* Tanggapan Resmi */}
              {report.tanggapan ? (
                <View style={[styles.tanggapanBox, { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Feather name="check-circle" size={14} color={colors.primary} strokeWidth={2} />
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
                      Tanggapan Resmi Penanggung Jawab SPPG:
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>{report.tanggapan}</Text>
                </View>
              ) : null}

              {/* Response Inline Form */}
              {isResponding ? (
                <View style={[styles.responseForm, { borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.sm }]}>
                  <Input
                    label="Tanggapan / Solusi Laporan"
                    value={tanggapanText}
                    onChangeText={setTanggapanText}
                    placeholder="Tuliskan tindak lanjut atau tanggapan..."
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
                    <PrimaryButton label="Simpan Tanggapan" onPress={() => handleSaveResponse(report.id)} style={{ flex: 1 }} />
                  </View>
                </View>
              ) : (
                <SecondaryButton
                  label={report.tanggapan ? 'Perbarui Tanggapan' : 'Tindak Lanjuti Laporan'}
                  icon="edit-3"
                  onPress={() => {
                    setRespondingId(report.id);
                    setTanggapanText(report.tanggapan || '');
                    setNewStatus(report.status);
                  }}
                />
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Modal Form Aduan Baru */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text }}>Formulir Aduan Masyarakat</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
              <Input label="Nama Pelapor / Instansi" value={namaPelapor} onChangeText={setNamaPelapor} placeholder="Contoh: Ibu Ani (Orang Tua Siswa)" />
              <Input label="No. Handphone / WhatsApp" value={noHpPelapor} onChangeText={setNoHpPelapor} placeholder="Contoh: 0812-3456-7890" keyboardType="phone-pad" />
              
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Pilih Dapur SPPG Terkait</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                {sppgList.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedSppgId(s.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedSppgId === s.id ? colors.primary : colors.background,
                        borderColor: selectedSppgId === s.id ? colors.primary : colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: selectedSppgId === s.id ? colors.textInverse : colors.text }}>
                      {s.nama}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Kategori Aduan</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {(Object.keys(KATEGORI_LABEL) as PublicReportKategori[]).map((kat) => (
                  <Pressable
                    key={kat}
                    onPress={() => setKategori(kat)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: kategori === kat ? colors.primary : colors.background,
                        borderColor: kategori === kat ? colors.primary : colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: kategori === kat ? colors.textInverse : colors.text }}>
                      {KATEGORI_LABEL[kat]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Judul Ringkas Aduan" value={judul} onChangeText={setJudul} placeholder="Contoh: Pengiriman Keterlambatan di SDN 01" />
              <Input label="Rincian Deskripsi Aduan" value={deskripsi} onChangeText={setDeskripsi} placeholder="Jelaskan secara rinci situasi yang ditemukan..." multiline />

              <Pressable
                onPress={() => setFotoUri('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80')}
                style={[styles.uploadBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}
              >
                <Feather name="camera" size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
                <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
                  {fotoUri ? '✓ Foto Lampiran Terpilih' : '+ Unggah Foto Bukti (Kamera/Galeri)'}
                </Text>
              </Pressable>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <SecondaryButton label="Batal" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Kirim Aduan" onPress={handleSubmitNewReport} style={{ flex: 1 }} />
            </View>
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
