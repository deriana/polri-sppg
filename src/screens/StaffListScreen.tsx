import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { JOBDESK_ICON, JOBDESK_LABEL } from '../utils/jobdesk';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffListScreen({ navigation }: any) {
  const { role, removeStaff, presensiList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth } = useTheme();
  const { usersInScope } = useScopedData();
  const today = todayDate();

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
        <SectionTitle style={{ marginBottom: 0 }}>Data Staf ({staff.length})</SectionTitle>
        <PrimaryButton label="Tambah" icon="user-plus" onPress={() => navigation.navigate('StaffForm')} fullWidth={false} />
      </View>

      {staff.length === 0 ? (
        <EmptyState icon="users" title="Belum Ada Staf" body="Tambahkan petugas lapangan pertama Anda." />
      ) : (
        staff.map((u) => {
          const hadirHariIni = presensiList.some((p) => p.userId === u.id && p.tanggal === today && p.status === 'hadir');
          const jobdeskIcon = u.jobdesk ? JOBDESK_ICON[u.jobdesk] : 'user';
          return (
            <Card key={u.id} style={styles.row}>
              {u.fotoProfil ? (
                <Image source={{ uri: u.fotoProfil }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={jobdeskIcon} size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, { color: colors.text, fontSize: fontSize.sm }]}>{u.nama}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>NIK {u.nik} • {u.noHp}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Shift {u.shift ?? '-'}</Text>
                <View style={styles.badgeRow}>
                  {u.jobdesk && <Pill label={JOBDESK_LABEL[u.jobdesk]} tone="primary" icon={jobdeskIcon} />}
                  <Pill label={hadirHariIni ? 'Hadir Hari Ini' : 'Belum Presensi'} tone={hadirHariIni ? 'success' : 'neutral'} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  name: { fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
