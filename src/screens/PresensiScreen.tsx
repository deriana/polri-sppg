import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PresensiScreen({ navigation }: any) {
  const { role, currentUser } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth } = useTheme();
  const { usersInScope, presensiInScope } = useScopedData();
  const today = todayDate();

  if (!role || !currentUser) return null;

  const permissions = ROLE_PERMISSIONS[role];
  const staff = usersInScope.filter((u) => u.role === 'PETUGAS_LAPANGAN');

  const canActFor = (userId: string) => {
    if (permissions.isViewOnly) return false;
    if (role === 'PETUGAS_LAPANGAN') return userId === currentUser.id;
    return true; // KEPALA_SPPG can act for any staff
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Presensi Staf Hari Ini</SectionTitle>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: -8 }}>
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>

      {staff.length === 0 ? (
        <EmptyState icon="users" title="Belum Ada Staf" body="Belum ada petugas lapangan terdaftar di SPPG ini." />
      ) : (
        staff.map((u) => {
          const presensi = presensiInScope.find((p) => p.userId === u.id && p.tanggal === today);
          const sudahMasuk = !!presensi?.jamMasuk;
          const sudahKeluar = !!presensi?.jamKeluar;
          const allowed = canActFor(u.id);

          return (
            <Card key={u.id} style={{ gap: spacing.sm }}>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="user" size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text, fontSize: fontSize.sm }]}>{u.nama}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                    Shift {u.shift ?? '-'} • {u.noHp}
                  </Text>
                </View>
                <Pill label={sudahMasuk ? 'Hadir' : 'Belum Presensi'} tone={sudahMasuk ? 'success' : 'warning'} />
              </View>

              <View style={[styles.timeRow, { borderTopColor: colors.border }]}>
                <View style={styles.timeCol}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Jam Masuk</Text>
                  <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>{presensi?.jamMasuk ?? '—'}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Jam Keluar</Text>
                  <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>{presensi?.jamKeluar ?? '—'}</Text>
                </View>
              </View>

              {allowed && !sudahMasuk && (
                <PrimaryButton
                  label="Check-in"
                  icon="log-in"
                  onPress={() => navigation.navigate('CheckIn', { userId: u.id, mode: 'in' })}
                />
              )}
              {allowed && sudahMasuk && !sudahKeluar && (
                <PrimaryButton
                  label="Check-out"
                  icon="log-out"
                  variant="secondary"
                  onPress={() => navigation.navigate('CheckIn', { userId: u.id, mode: 'out' })}
                />
              )}
              {sudahMasuk && sudahKeluar && (
                <View style={[styles.doneBanner, { backgroundColor: colors.successBg }]}>
                  <Feather name="check-circle" size={16} color={colors.success} strokeWidth={iconStrokeWidth} />
                  <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Presensi hari ini selesai</Text>
                </View>
              )}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  timeRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  timeCol: { flex: 1, gap: 2 },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
});
