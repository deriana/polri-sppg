import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle, StatusBadge } from '../components/ui';
import { useScopedData } from '../hooks';
import { AlertLog, AlertTingkat } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';

const TINGKAT_ORDER: Record<AlertTingkat, number> = { emergency: 0, perhatian: 1, normal: 2 };
const STATUS_LABEL: Record<AlertLog['statusTindakLanjut'], string> = {
  baru: 'Baru',
  ditindaklanjuti: 'Ditindaklanjuti',
  selesai: 'Selesai',
};

export default function AlertListScreen({ navigation }: any) {
  const { role, sppgList } = useApp();
  const { alertInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth } = useTheme();

  const permissions = role ? ROLE_PERMISSIONS[role] : null;
  const isWilayah = !!permissions?.isViewOnly;
  const title =
    permissions?.scopeLevel === 'polda' ? 'Alert Wilayah Polda' : permissions?.scopeLevel === 'polres' ? 'Alert Wilayah Polres' : 'Alert SPPG';

  const sorted = useMemo(
    () => [...alertInScope].sort((a, b) => TINGKAT_ORDER[a.tingkat] - TINGKAT_ORDER[b.tingkat] || (a.timestamp < b.timestamp ? 1 : -1)),
    [alertInScope],
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>{title}</SectionTitle>

      {sorted.length === 0 ? (
        <EmptyState icon="shield" title="Tidak Ada Alert" body="Belum ada alert yang tercatat." />
      ) : (
        sorted.map((a) => {
          const sppgName = sppgList.find((s) => s.id === a.sppgId)?.nama;
          return (
            <Card key={a.id} style={{ gap: spacing.xs }} onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })}>
              <View style={styles.rowTop}>
                <StatusBadge status={a.tingkat} />
                <Pill label={STATUS_LABEL[a.statusTindakLanjut]} tone={a.statusTindakLanjut === 'selesai' ? 'success' : 'neutral'} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }} numberOfLines={1}>
                {a.judul}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={2}>
                {a.deskripsi}
              </Text>
              <View style={styles.rowBottom}>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                  {isWilayah && sppgName ? `${sppgName} • ` : ''}
                  {a.timestamp}
                </Text>
                <Feather name="chevron-right" size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
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
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
});
