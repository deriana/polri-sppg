import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
    return unique.length > 0 ? unique : ['Kamera 1 - Dapur Utama', 'Kamera 2 - Gudang Penyimpanan', 'Kamera 3 - Area Kemasan', 'Kamera 4 - Area Cuci'];
  }, [eventsInScope]);

  const cameraThumbnails = [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="shield" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Pengawasan CCTV AI Real-Time — Deteksi otomatis APD, higienis ruangan, & keamanan area dapur SPPG.
        </Text>
      </View>

      <SectionTitle>Feed Kamera Live ({cameraLabels.length})</SectionTitle>
      <View style={styles.cameraGrid}>
        {cameraLabels.map((label, idx) => (
          <View key={label} style={[styles.cameraBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', padding: 0 }]}>
            <View style={{ width: '100%', height: 90, position: 'relative' }}>
              <Image source={{ uri: cameraThumbnails[idx % cameraThumbnails.length] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(220,38,38,0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>LIVE REC</Text>
              </View>
            </View>
            <View style={{ padding: 8, gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '700' }} numberOfLines={1}>
                {label}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>FHD 1080p • 30 FPS</Text>
            </View>
          </View>
        ))}
      </View>

      <Card variant="outlined" style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }} action={<Pill label="Sensor AI Aktif" tone="success" icon="check-circle" />}>
          Uji Deteksi Anomali AI
        </SectionTitle>
        {canWrite && currentSppg ? (
          <PrimaryButton
            label="Jalankan Analisis AI Kamera"
            icon="cpu"
            variant="secondary"
            onPress={() => simulateCctvDetection(currentSppg.id)}
          />
        ) : (
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
            Mode pemantauan lihat saja.
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
