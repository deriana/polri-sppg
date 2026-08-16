import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { User } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { JOBDESK_ICON, JOBDESK_LABEL } from '../utils/jobdesk';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffListScreen({ navigation }: any) {
  const { role, removeStaff, presensiList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark, shadow } = useTheme();
  const { usersInScope } = useScopedData();
  const today = todayDate();

  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  if (!role || !ROLE_PERMISSIONS[role].canManageStaff) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Kepala SPPG yang dapat mengelola data staf." />
      </View>
    );
  }

  const staff = usersInScope.filter((u) => u.role === 'PETUGAS_LAPANGAN');

  const confirmRemove = (id: string, nama: string) => {
    Alert.alert('Hapus Staf', `Yakin ingin menghapus ${nama} dari daftar staf?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeStaff(id) },
    ]);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <SectionTitle style={{ marginBottom: 0 }}>Data Staf Dapur ({staff.length})</SectionTitle>
        <PrimaryButton label="Tambah" icon="user-plus" onPress={() => navigation.navigate('StaffForm')} fullWidth={false} />
      </View>

      {staff.length === 0 ? (
        <EmptyState icon="users" title="Belum Ada Staf" body="Tambahkan petugas lapangan pertama Anda." />
      ) : (
        staff.map((u) => {
          const presensiHariIni = presensiList.find((p) => p.userId === u.id && p.tanggal === today);
          const hadirHariIni = presensiHariIni?.status === 'hadir';
          const jobdeskIcon = u.jobdesk ? JOBDESK_ICON[u.jobdesk] : 'user';

          return (
            <Card key={u.id} style={[styles.row, { ...shadow.card, borderRadius: radius.lg }]} onPress={() => setSelectedStaff(u)}>
              {u.fotoProfil ? (
                <Image source={{ uri: u.fotoProfil }} style={[styles.avatarImg, { borderRadius: radius.md }]} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.accentLight || colors.primaryLight, borderRadius: radius.md }]}>
                  <Feather name={jobdeskIcon} size={20} color={colors.accent || colors.primary} strokeWidth={iconStrokeWidth} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' }]}>{u.nama}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>NIK {u.nik} • {u.noHp}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Shift {u.shift ?? 'Pagi'}</Text>
                <View style={styles.badgeRow}>
                  {u.jobdesk && <Pill label={JOBDESK_LABEL[u.jobdesk]} tone="royal" icon={jobdeskIcon} />}
                  <Pill label={hadirHariIni ? 'Hadir' : 'Belum Absen'} tone={hadirHariIni ? 'success' : 'neutral'} />
                </View>
              </View>
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <Pill label={u.statusAktif ? 'Aktif' : 'Nonaktif'} tone={u.statusAktif ? 'success' : 'neutral'} />
                <IconButton icon="trash-2" tone="danger" onPress={() => confirmRemove(u.id, u.nama)} />
              </View>
            </Card>
          );
        })
      )}

      {/* Staff Detail Modal */}
      <Modal visible={!!selectedStaff} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>Detail Staf Petugas</Text>
              <Pressable onPress={() => setSelectedStaff(null)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedStaff && (() => {
              const presensi = presensiList.find((p) => p.userId === selectedStaff.id && p.tanggal === today);
              const isHadir = presensi?.status === 'hadir';
              const jobIcon = selectedStaff.jobdesk ? JOBDESK_ICON[selectedStaff.jobdesk] : 'user';

              return (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {selectedStaff.fotoProfil ? (
                      <Image source={{ uri: selectedStaff.fotoProfil }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name={jobIcon} size={28} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>{selectedStaff.nama}</Text>
                      <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
                        {selectedStaff.kategoriPegawai === 'inti_bgn' ? 'Pegawai Inti (ASN BGN)' : 'Tenaga Operasional / Relawan Dapur'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        {selectedStaff.jobdesk && <Pill label={JOBDESK_LABEL[selectedStaff.jobdesk]} tone="primary" />}
                        <Pill label={isHadir ? 'Hadir Hari Ini' : 'Belum Absen'} tone={isHadir ? 'success' : 'neutral'} />
                      </View>
                    </View>
                  </View>

                  <View style={[styles.infoBox, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, gap: 6 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>NIK Pegawai:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>{selectedStaff.nik}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Nomor Kontak WA/Hp:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>{selectedStaff.noHp}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Shift Kerja:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Shift {selectedStaff.shift ?? 'Pagi'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Jam Check-In Hari Ini:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.success }}>{presensi?.jamMasuk ?? 'Belum Check-In'}</Text>
                    </View>
                  </View>

                  {presensi?.fotoSelfieMasuk && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Foto Selfie Check-In:</Text>
                      <Image source={{ uri: presensi.fotoSelfieMasuk }} style={{ width: '100%', height: 140, borderRadius: radius.md }} resizeMode="cover" />
                    </View>
                  )}

                  <SecondaryButton label="Tutup Detail" onPress={() => setSelectedStaff(null)} style={{ marginTop: 4 }} />
                </View>
              );
            })()}
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  name: { fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  infoBox: { marginTop: 4 },
});
