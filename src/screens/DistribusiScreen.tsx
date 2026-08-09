import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeDistribusi, ROLE_PERMISSIONS } from '../utils/scope';
import { DistribusiRute } from '../types';

// 'kendala' is a terminal error state, not a forward step — handled separately
// below (danger banner instead of the step row) rather than added to STEPS.
const STEPS: { status: DistribusiRute['status']; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { status: 'menunggu', label: 'Menunggu', icon: 'clock' },
  { status: 'dalam_perjalanan', label: 'Dalam Perjalanan', icon: 'truck' },
  { status: 'tiba', label: 'Tiba', icon: 'check-circle' },
];

export default function DistribusiScreen() {
  const { role, sekolahList, distribusiList, updateDistribusiStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const inScope = useMemo(() => scopeDistribusi(sppgInScope, distribusiList), [sppgInScope, distribusiList]);
  const canAdvance = !!role && ROLE_PERMISSIONS[role].canManageDistribusi;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="navigation" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Pelacakan GPS Armada Real-Time — Lokasi & estimasi kedatangan armada pengiriman ke sekolah terpantau otomatis.
        </Text>
      </View>

      <SectionTitle>Distribusi Armada</SectionTitle>
      {inScope.length === 0 ? (
        <EmptyState icon="truck" title="Belum Ada Rute" body="Belum ada rute distribusi yang tercatat." />
      ) : (
        inScope.map((rute) => {
          const isKendala = rute.status === 'kendala';
          const stepIndex = STEPS.findIndex((s) => s.status === rute.status);
          const nextStatus = STEPS[stepIndex + 1]?.status;
          const sekolahNama = sekolahList.find((s) => s.id === rute.sekolahId)?.nama ?? rute.sekolahId;
          return (
            <Card key={rute.id} style={{ gap: spacing.sm }}>
              <View style={styles.rowTop}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm, flex: 1 }} numberOfLines={1}>
                  {sekolahNama}
                </Text>
                <Pill label={isKendala ? 'Kendala' : STEPS[stepIndex]?.label ?? rute.status} tone={isKendala ? 'danger' : rute.status === 'tiba' ? 'success' : 'info'} />
              </View>

              {isKendala ? (
                <View style={[styles.kendalaBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}>
                  <Feather name="alert-triangle" size={16} color={colors.danger} strokeWidth={iconStrokeWidth} />
                  <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
                    Pengiriman mengalami kendala di lapangan.
                  </Text>
                </View>
              ) : (
                <View style={styles.stepRow}>
                  {STEPS.map((s, i) => {
                    const reached = i <= stepIndex;
                    return (
                      <React.Fragment key={s.status}>
                        <View style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepDot,
                              { backgroundColor: reached ? colors.primary : colors.border },
                            ]}
                          >
                            <Feather name={s.icon} size={12} color={reached ? colors.textInverse : colors.textMuted} strokeWidth={iconStrokeWidth} />
                          </View>
                          <Text style={{ color: reached ? colors.text : colors.textMuted, fontSize: 10, textAlign: 'center' }}>{s.label}</Text>
                        </View>
                        {i < STEPS.length - 1 && (
                          <View style={[styles.stepLine, { backgroundColor: i < stepIndex ? colors.primary : colors.border }]} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}

              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Tanggal: {rute.tanggal} • Estimasi tiba: {rute.estimasiTiba}</Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                Koordinat Live GPS: {rute.lat.toFixed(4)}, {rute.lng.toFixed(4)}
              </Text>

              {canAdvance && !isKendala && (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {nextStatus && (
                    <PrimaryButton
                      label={`Majukan ke: ${STEPS.find((s) => s.status === nextStatus)?.label}`}
                      variant="secondary"
                      fullWidth={false}
                      onPress={() => updateDistribusiStatus(rute.id, nextStatus)}
                      style={{ flex: 1 }}
                    />
                  )}
                  {rute.status !== 'tiba' && (
                    <PrimaryButton
                      label="Tandai Kendala"
                      variant="danger"
                      fullWidth={false}
                      onPress={() => updateDistribusiStatus(rute.id, 'kendala')}
                      style={{ flex: 1 }}
                    />
                  )}
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
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  kendalaBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', width: 64, gap: 4 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 2, marginTop: 12 },
});
