import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { NEARBY_SCHOOL_CANDIDATES } from '../mock/sekolah';

export default function SekolahFormScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, ajukanSekolah, updateStatusPengajuanSekolah } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();
  const { pengajuanInScope } = useScopedData();

  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!role || !currentUser) return null;
  const permissions = ROLE_PERMISSIONS[role];
  const isSupervisor = role === 'SUPERVISOR_POLRES' || role === 'SUPERVISOR_POLDA';

  const selectedCandidate = NEARBY_SCHOOL_CANDIDATES[selectedIdx];

  const handleAjukan = () => {
    if (!alasan.trim()) {
      setError('Masukkan alasan pengajuan afiliasi sekolah ini.');
      return;
    }

    ajukanSekolah({
      sppgId: currentSppg?.id ?? currentUser.sppgId,
      sekolahNama: selectedCandidate.nama,
      alamat: selectedCandidate.alamat,
      jumlahSiswa: selectedCandidate.siswa,
      jarakKm: selectedCandidate.jarak,
      alasan: alasan.trim(),
    });

    setError(null);
    setAlasan('');
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Card */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="map-pin" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              PENGAJUAN AFILIASI SEKOLAH TERDEKAT
            </Text>
          </View>
          <Pill label={isSupervisor ? 'Evaluasi Supervisor' : 'Pengajuan Dapur'} tone="primary" />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          {isSupervisor
            ? 'Tinjau dan setujui pengajuan sekolah afiliasi terdekat dari SPPG di wilayah pengawasan Anda.'
            : 'Pilih sekolah calon penerima manfaat MBG terdekat di wilayah dapur Anda dan ajukan ke Supervisor Polres.'}
        </Text>
      </Card>

      {/* View for Supervisor: Approval List */}
      {isSupervisor ? (
        <>
          <SectionTitle>Daftar Pengajuan Sekolah dari SPPG</SectionTitle>
          <View style={{ gap: spacing.sm }}>
            {pengajuanInScope.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', padding: 20 }}>
                Belum ada pengajuan sekolah baru dari SPPG.
              </Text>
            ) : (
              pengajuanInScope.map((p) => (
                <Card key={p.id} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>{p.sekolahNama}</Text>
                    <Pill
                      label={p.status.toUpperCase()}
                      tone={p.status === 'disetujui' ? 'success' : p.status === 'ditolak' ? 'danger' : 'warning'}
                    />
                  </View>

                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    {p.alamat} • {p.jumlahSiswa} siswa • Jarak: {p.jarakKm} km dari Dapur
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.text, marginTop: 2 }}>
                    <Text style={{ fontWeight: '700' }}>Alasan: </Text>
                    {p.alasan}
                  </Text>

                  {p.status === 'diajukan' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <PrimaryButton
                        label="Setujui Afiliasi"
                        icon="check"
                        onPress={() => updateStatusPengajuanSekolah(p.id, 'disetujui', 'Disetujui oleh Supervisor.')}
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton
                        label="Tolak"
                        icon="x"
                        variant="danger"
                        onPress={() => updateStatusPengajuanSekolah(p.id, 'ditolak', 'Ditolak: Kuota tidak mencukupi.')}
                        style={{ flex: 1 }}
                      />
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        </>
      ) : (
        /* View for Kepala SPPG: Form Ajukan Sekolah Terdekat */
        <Card style={{ gap: spacing.md }}>
          <SectionTitle style={{ marginBottom: 0 }}>Form Pengajuan Sekolah Terdekat</SectionTitle>

          {error && (
            <View style={{ backgroundColor: colors.dangerBg, padding: 10, borderRadius: radius.md }}>
              <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '600' }}>{error}</Text>
            </View>
          )}

          <DropdownPicker
            label="Pilih Calon Sekolah di Wilayah Dapur"
            value={String(selectedIdx)}
            options={NEARBY_SCHOOL_CANDIDATES.map((sch, i) => ({
              label: `${sch.nama} (${sch.jarak} km • ${sch.siswa} siswa)`,
              value: String(i),
            }))}
            onSelect={(val) => setSelectedIdx(parseInt(val, 10))}
            icon="home"
          />

          {/* Details of Selected Candidate */}
          <View style={[styles.candidateBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{selectedCandidate.nama}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>{selectedCandidate.alamat}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <Pill label={`Jarak: ${selectedCandidate.jarak} km`} tone="primary" />
              <Pill label={`Jumlah: ${selectedCandidate.siswa} Siswa`} tone="info" />
            </View>
          </View>

          <Input
            label="Alasan & Rekomendasi Afiliasi"
            icon="file-text"
            value={alasan}
            onChangeText={setAlasan}
            placeholder="Contoh: Lokasi sangat dekat (1.4 km), armada dapat tiba dalam 10 menit..."
            multiline
          />

          <PrimaryButton label="Kirimkan Pengajuan ke Supervisor" icon="send" onPress={handleAjukan} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  candidateBox: { padding: 12, borderWidth: 1 },
});

