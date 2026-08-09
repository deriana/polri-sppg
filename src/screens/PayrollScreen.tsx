import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { JOBDESK_ICON } from '../utils/jobdesk';
import { computePayroll, currentPeriode, formatRupiah } from '../utils/payroll';

export default function PayrollScreen({ navigation }: any) {
  const { role } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const { usersInScope } = useScopedData();

  if (!role || !ROLE_PERMISSIONS[role].canManageStaff) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Kepala SPPG yang dapat melihat payroll staf." />
      </View>
    );
  }

  const staff = usersInScope.filter((u) => u.statusAktif);
  const totalPayroll = staff.reduce((sum, u) => sum + computePayroll(u).totalGaji, 0);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="info" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Simulasi payroll — gaji pokok mengikuti kisaran umum posisi SPPG program MBG, bukan data riil sistem penggajian.
        </Text>
      </View>

      <SectionTitle>Payroll Periode {currentPeriode()}</SectionTitle>

      <Card style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Total Payroll {staff.length} Pegawai</Text>
        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: fontSize.lg }}>{formatRupiah(totalPayroll)}</Text>
      </Card>

      {staff.length === 0 ? (
        <EmptyState icon="users" title="Belum Ada Pegawai" body="Belum ada data pegawai aktif untuk SPPG ini." />
      ) : (
        staff.map((u) => {
          const payroll = computePayroll(u);
          return (
            <Card key={u.id} style={{ gap: spacing.xs }} onPress={() => navigation.navigate('PayrollDetail', { userId: u.id })}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {u.fotoProfil ? (
                  <Image source={{ uri: u.fotoProfil }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={u.jobdesk ? JOBDESK_ICON[u.jobdesk] : 'user'} size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }} numberOfLines={1}>{u.nama}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>{payroll.jabatanLabel}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Pill label={formatRupiah(payroll.totalGaji)} tone="success" />
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 4 }}>Lihat Slip ➔</Text>
                </View>
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
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
});
