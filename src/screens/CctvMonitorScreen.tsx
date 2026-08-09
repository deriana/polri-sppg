import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeCctvEvents, ROLE_PERMISSIONS } from '../utils/scope';
import { CCTV_ANOMALI_LABEL } from '../data/cctvEvents';
import { CctvEvent } from '../types';

export default function CctvMonitorScreen() {
  const { role, currentSppg, cctvEvents, reviewCctvEvent, simulateCctvDetection } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const eventsInScope = useMemo(() => scopeCctvEvents(sppgInScope, cctvEvents), [sppgInScope, cctvEvents]);
  const sorted = useMemo(
    () => [...eventsInScope].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [eventsInScope],
  );

  const canWrite = !!role && !ROLE_PERMISSIONS[role].isViewOnly;

  const cameraLabels = useMemo(() => {
    const unique = Array.from(new Set(eventsInScope.map((e) => e.cameraLabel)));
    return unique.length > 0 ? unique : ['Kamera 1 - Dapur Utama', 'Kamera 2 - Gudang'];
  }, [eventsInScope]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.infoBg, borderRadius: radius.md }]}>
        <Feather name="info" size={16} color={colors.info} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Simulasi Fase 2 — belum terhubung ke perangkat/sistem nyata. Tidak ada feed CCTV atau model AI sungguhan di balik data ini.
        </Text>
      </View>

      <SectionTitle>Kamera</SectionTitle>
      <View style={styles.cameraGrid}>
        {cameraLabels.map((label) => (
          <View key={label} style={[styles.cameraBox, { backgroundColor: colors.border, borderRadius: radius.md }]}>
            <Feather name="video-off" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>
              {label}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>Tidak ada feed nyata</Text>
          </View>
        ))}
      </View>

      <Card variant="outlined" style={{ gap: spacing.sm, borderStyle: 'dashed' }}>
        <SectionTitle style={{ marginBottom: 0 }} action={<Pill label="Simulasi" tone="warning" />}>
          Simulasikan Deteksi
        </SectionTitle>
        {canWrite && currentSppg ? (
          <PrimaryButton
            label="Simulasikan Deteksi Anomali"
            icon="zap"
            variant="secondary"
            onPress={() => simulateCctvDetection(currentSppg.id)}
          />
        ) : (
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
            Peran Anda tidak dapat memicu simulasi deteksi (mode lihat saja).
          </Text>
        )}
      </Card>

      <SectionTitle style={{ marginTop: spacing.xs }}>Riwayat Deteksi Anomali</SectionTitle>
      {sorted.length === 0 ? (
        <EmptyState icon="video" title="Belum Ada Deteksi" body="Belum ada event anomali CCTV yang tercatat." />
      ) : (
        sorted.map((e) => <CctvEventRow key={e.id} event={e} canWrite={canWrite} onReview={() => reviewCctvEvent(e.id)} />)
      )}
    </ScrollView>
  );
}

function CctvEventRow({ event, canWrite, onReview }: { event: CctvEvent; canWrite: boolean; onReview: () => void }) {
  const { colors, spacing, fontSize, iconStrokeWidth } = useTheme();
  const isBaru = event.status === 'baru';

  return (
    <Card
      style={{ gap: spacing.xs }}
      onPress={canWrite && isBaru ? onReview : undefined}
    >
      <View style={styles.rowTop}>
        <Pill label={isBaru ? 'Baru' : 'Ditinjau'} tone={isBaru ? 'warning' : 'success'} />
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{event.confidence}% keyakinan</Text>
      </View>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{CCTV_ANOMALI_LABEL[event.anomaliType]}</Text>
      <View style={styles.rowBottom}>
        <Feather name="camera" size={12} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{event.cameraLabel} • {event.timestamp}</Text>
      </View>
      {canWrite && isBaru && (
        <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' }}>Ketuk untuk tandai ditinjau</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  cameraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cameraBox: { width: 140, height: 100, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
