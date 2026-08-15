import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { IncidentCategory, IncidentReport, IncidentSeverity, IncidentStatus } from '../types';

const KATEGORI_LABEL: Record<IncidentCategory, string> = {
  kecelakaan_kerja: 'Kecelakaan Kerja / K3',
  kerusakan_alat: 'Kerusakan Peralatan Dapur',
  keterlambatan_bahan: 'Keterlambatan Pasokan Bahan',
  keterlambatan_distribusi: 'Kendala Distribusi Armada',
  listrik_air_padam: 'Pemadaman Listrik / Air',
  kontaminasi_pangan: 'Isu Keamanan & Higienitas',
  lainnya: 'Insiden Lainnya',
};

const SEVERITY_TONE: Record<IncidentSeverity, 'success' | 'warning' | 'danger'> = {
  rendah: 'success',
  sedang: 'warning',
  kritis: 'danger',
};

const STATUS_TONE: Record<IncidentStatus, 'danger' | 'warning' | 'success'> = {
  OPEN: 'danger',
  INVESTIGASI: 'warning',
  RESOLVED: 'success',
};

type FilterStatus = 'SEMUA' | IncidentStatus;

export default function IncidentListScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, incidentList, updateIncidentStatus } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('SEMUA');
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [tindakanInput, setTindakanInput] = useState('');

  const isKepala = role === 'KEPALA_SPPG';
  const sppgId = currentSppg?.id || currentUser?.sppgId;

  const scopedIncidents = useMemo(() => {
    return incidentList.filter((inc) => !sppgId || inc.sppgId === sppgId);
  }, [incidentList, sppgId]);

  const filteredIncidents = useMemo(() => {
    if (activeFilter === 'SEMUA') return scopedIncidents;
    return scopedIncidents.filter((inc) => inc.status === activeFilter);
  }, [scopedIncidents, activeFilter]);

  const handleOpenDetail = (inc: IncidentReport) => {
    setSelectedIncident(inc);
    setTindakanInput(inc.tindakanPerbaikan ?? '');
  };

  const handleUpdateStatus = (newStatus: IncidentStatus) => {
    if (!selectedIncident) return;
    updateIncidentStatus(selectedIncident.id, newStatus, tindakanInput);
    setSelectedIncident(null);
    Alert.alert('Status Diperbarui', `Insiden ${selectedIncident.id} kini berstatus: ${newStatus}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header & Filter Bar */}
      <View style={[styles.header, { padding: spacing.lg, paddingBottom: 0 }]}>
        <View style={styles.headerRow}>
          <SectionTitle style={{ marginBottom: 0 }}>Laporan Insiden ({scopedIncidents.length})</SectionTitle>
          <PrimaryButton
            label="+ Lapor Insiden"
            icon="alert-octagon"
            fullWidth={false}
            onPress={() => navigation.navigate('IncidentForm')}
          />
        </View>

        {/* Filter Pills */}
        <View style={[styles.segment, { borderColor: colors.border, borderRadius: radius.md }]}>
          {(['SEMUA', 'OPEN', 'INVESTIGASI', 'RESOLVED'] as FilterStatus[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.segmentItem,
                { borderRadius: radius.sm },
                activeFilter === f && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={{
                  color: activeFilter === f ? colors.textInverse : colors.text,
                  fontWeight: '700',
                  fontSize: fontSize.xs,
                }}
              >
                {f === 'SEMUA' ? 'Semua' : f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Incident List */}
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: 120 }]}>
        {filteredIncidents.length === 0 ? (
          <EmptyState
            icon="shield"
            title="Tidak Ada Laporan Insiden"
            body={
              activeFilter === 'SEMUA'
                ? 'Kondisi operasional dapur aman dan terkendali.'
                : `Tidak ada insiden dengan status ${activeFilter}.`
            }
          />
        ) : (
          filteredIncidents.map((inc) => (
            <Card key={inc.id} style={{ gap: spacing.xs }} onPress={() => handleOpenDetail(inc)}>
              <View style={styles.cardHeader}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>{inc.judul}</Text>
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                    {inc.id} • {inc.tanggal} ({inc.timestamp.slice(11, 16) || inc.timestamp})
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Pill label={inc.tingkatKeparahan.toUpperCase()} tone={SEVERITY_TONE[inc.tingkatKeparahan]} />
                  <Pill label={inc.status} tone={STATUS_TONE[inc.status]} />
                </View>
              </View>

              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                Kategori: <Text style={{ color: colors.text, fontWeight: '600' }}>{KATEGORI_LABEL[inc.kategori]}</Text> • Lokasi: {inc.lokasi || 'Dapur SPPG'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                {inc.fotoBukti ? (
                  <Image source={{ uri: inc.fotoBukti }} style={[styles.evidenceThumb, { borderRadius: radius.sm, borderColor: colors.border }]} />
                ) : (
                  <View style={[styles.evidenceThumb, styles.evidenceEmpty, { borderRadius: radius.sm, borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Feather name="image" size={16} color={colors.textMuted} />
                  </View>
                )}
                <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }} numberOfLines={4}>
                  {inc.deskripsi}
                </Text>
              </View>

              {inc.tindakanPerbaikan && (
                <View style={[styles.resolutionBox, { backgroundColor: colors.successBg, borderRadius: radius.sm }]}>
                  <Feather name="check-circle" size={13} color={colors.success} />
                  <Text style={{ fontSize: 11, color: colors.success, flex: 1, fontWeight: '600' }} numberOfLines={2}>
                    Tindakan: {inc.tindakanPerbaikan}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                  Pelapor: {inc.pelaporNama} ({inc.pelaporRole})
                </Text>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Detail & Tindak Lanjut ➔</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Incident Detail & Resolution Modal */}
      <Modal visible={!!selectedIncident} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
            {selectedIncident && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                      {selectedIncident.judul}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                      {selectedIncident.id} • {KATEGORI_LABEL[selectedIncident.kategori]}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedIncident(null)} hitSlop={8}>
                    <Feather name="x" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pill label={`Tingkat: ${selectedIncident.tingkatKeparahan.toUpperCase()}`} tone={SEVERITY_TONE[selectedIncident.tingkatKeparahan]} />
                  <Pill label={`Status: ${selectedIncident.status}`} tone={STATUS_TONE[selectedIncident.status]} />
                </View>

                <View style={{ gap: 4, backgroundColor: colors.background, padding: 10, borderRadius: radius.md }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Deskripsi Kejadian:</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>
                    {selectedIncident.deskripsi}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 4 }}>
                    Lokasi: {selectedIncident.lokasi || 'Dapur Utama'} • Pelapor: {selectedIncident.pelaporNama}
                  </Text>
                </View>

                {/* Foto Bukti Kejadian */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="camera" size={13} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, flex: 1 }}>FOTO BUKTI KEJADIAN</Text>
                    {!!selectedIncident.fotoBukti && <Pill label="Terlampir" tone="success" />}
                  </View>
                  {selectedIncident.fotoBukti ? (
                    <Image
                      source={{ uri: selectedIncident.fotoBukti }}
                      style={{ width: '100%', height: 180, borderRadius: radius.md }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.noPhotoBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
                      <Feather name="image" size={22} color={colors.textMuted} />
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Pelapor tidak melampirkan foto bukti.</Text>
                    </View>
                  )}
                </View>

                {/* Corrective Action Input for Resolution */}
                <Input
                  label="Tindakan Korektif & Perbaikan"
                  value={tindakanInput}
                  onChangeText={setTindakanInput}
                  placeholder="Contoh: Elemen pemanas telah diganti teknisi dan berfungsi normal."
                />

                {/* Status Update Buttons */}
                <View style={{ gap: 8 }}>
                  {selectedIncident.status !== 'RESOLVED' && (
                    <PrimaryButton
                      label="Selesaikan Insiden (RESOLVED)"
                      icon="check-circle"
                      onPress={() => handleUpdateStatus('RESOLVED')}
                    />
                  )}
                  {selectedIncident.status === 'OPEN' && (
                    <PrimaryButton
                      label="Mulai Investigasi (INVESTIGASI)"
                      icon="search"
                      variant="secondary"
                      onPress={() => handleUpdateStatus('INVESTIGASI')}
                    />
                  )}
                  {selectedIncident.status === 'RESOLVED' && (
                    <PrimaryButton
                      label="Buka Kembali Kasus (RE-OPEN)"
                      icon="rotate-ccw"
                      variant="outline"
                      onPress={() => handleUpdateStatus('OPEN')}
                    />
                  )}
                </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segment: { flexDirection: 'row', borderWidth: 1, padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  content: { gap: 12, paddingBottom: 120 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resolutionBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  evidenceThumb: { width: 68, height: 68, borderWidth: 1 },
  evidenceEmpty: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  noPhotoBox: { height: 90, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
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
});
