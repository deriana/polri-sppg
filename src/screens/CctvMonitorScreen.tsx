import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeCctvEvents, ROLE_PERMISSIONS } from '../utils/scope';
import { CCTV_ANOMALI_LABEL } from '../data/cctvEvents';
import { CctvEvent } from '../types';

const localVideoUri = (() => {
  try {
    return Image.resolveAssetSource(require('../../assets/mock_cctv_test.mp4')).uri;
  } catch (e) {
    return 'file:///home/deryana/coding/sigap-sppg/assets/mock_cctv_test.mp4';
  }
})();

export const CCTV_FEEDS = [
  {
    id: 'cctv_1',
    label: 'Kamera 1 - Area Pemasakan Dapur Utama',
    localMp4Url: localVideoUri,
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
    fps: '30 FPS',
    aiStatus: 'APD Lengkap (99.4%)',
  },
  {
    id: 'cctv_2',
    label: 'Kamera 2 - Gudang Penyimpanan Cold Room',
    localMp4Url: localVideoUri,
    thumbnail: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80',
    fps: '30 FPS',
    aiStatus: 'Suhu 4.2°C (Aman)',
  },
  {
    id: 'cctv_3',
    label: 'Kamera 3 - Area Pemorsian & Packaging',
    localMp4Url: localVideoUri,
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    fps: '30 FPS',
    aiStatus: 'Higienis Sanitasi 98%',
  },
  {
    id: 'cctv_4',
    label: 'Kamera 4 - Loading Dock & Washing Bay',
    localMp4Url: localVideoUri,
    thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    fps: '30 FPS',
    aiStatus: 'Armada Ready (Ompreng In)',
  },
];

export default function CctvMonitorScreen() {
  const { role, currentSppg, cctvEvents, reviewCctvEvent, simulateCctvDetection } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [activeFeed, setActiveFeed] = useState<typeof CCTV_FEEDS[0] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CctvEvent | null>(null);

  const eventsInScope = useMemo(() => scopeCctvEvents(sppgInScope, cctvEvents), [sppgInScope, cctvEvents]);
  const sorted = useMemo(
    () => [...eventsInScope].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [eventsInScope],
  );

  const canWrite = !!role && !ROLE_PERMISSIONS[role].isViewOnly;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="video" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Pengawasan CCTV AI Real-Time — Klik petak kamera untuk memutar video stream, atau klik riwayat anomali untuk **Melihat Screenshot Deteksi Otomatis & Tinjauan**.
        </Text>
      </View>

      <SectionTitle>Feed Kamera Live ({CCTV_FEEDS.length} Channel)</SectionTitle>
      <View style={styles.cameraGrid}>
        {CCTV_FEEDS.map((feed) => (
          <Pressable
            key={feed.id}
            onPress={() => setActiveFeed(feed)}
            style={[styles.cameraBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' }]}
          >
            <View style={{ width: '100%', height: 100, position: 'relative' }}>
              <Image source={{ uri: feed.thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(220,38,38,0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>LIVE STREAM</Text>
              </View>
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="play" size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <View style={{ padding: 8, gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '700' }} numberOfLines={1}>
                {feed.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>{feed.aiStatus}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Putar Video ➔</Text>
              </View>
            </View>
          </Pressable>
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

      <SectionTitle style={{ marginTop: spacing.xs }}>Riwayat Deteksi Anomali ({sorted.length})</SectionTitle>
      {sorted.length === 0 ? (
        <EmptyState icon="video" title="Belum Ada Deteksi" body="Belum ada event anomali CCTV yang tercatat." />
      ) : (
        sorted.map((e) => (
          <CctvEventRow key={e.id} event={e} onPress={() => setSelectedEvent(e)} />
        ))
      )}

      {/* Live YouTube Video Player Modal */}
      <Modal visible={!!activeFeed} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Feather name="video" size={20} color={colors.danger} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                  {activeFeed?.label}
                </Text>
              </View>
              <Pressable onPress={() => setActiveFeed(null)}>
                <Feather name="x" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {activeFeed && (
              <View style={{ gap: spacing.sm, marginTop: 10 }}>
                <View style={{ width: '100%', height: 230, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' }}>
                  <WebView
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <style>
                            body, html { margin:0; padding:0; width:100%; height:100%; background-color:#000; overflow:hidden; }
                            video { width:100%; height:100%; border:0; object-fit:cover; }
                          </style>
                        </head>
                        <body>
                          <video src="${activeFeed.localMp4Url}" autoplay loop muted playsinline controls></video>
                        </body>
                        </html>
                      `,
                    }}
                    style={{ flex: 1 }}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    allowFileAccess
                    allowFileAccessFromFileURLs
                    allowUniversalAccessFromFileURLs
                    originWhitelist={['*']}
                  />
                </View>

                <View style={[styles.hudBox, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, gap: 6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="cpu" size={14} color={colors.primary} />
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Computer Vision AI Analytics:</Text>
                    </View>
                    <Pill label={activeFeed.aiStatus} tone="success" />
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Status AI: Deteksi Alat Pelindung Diri (APD Masker & Sarung Tangan) terverifikasi 99.4%. Tidak ditemukan kebocoran / anomali suhu.
                  </Text>
                </View>

                <SecondaryButton label="Tutup Video Stream" onPress={() => setActiveFeed(null)} />
              </View>
            )}
          </Card>
        </View>
      </Modal>

      {/* Modal Detail Screenshot & Tinjauan Anomali */}
      <Modal visible={!!selectedEvent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>Detail Deteksi Anomali CCTV</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>ID: {selectedEvent?.id}</Text>
              </View>
              <Pressable onPress={() => setSelectedEvent(null)}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            {selectedEvent && (
              <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
                <View style={{ width: '100%', position: 'relative', borderRadius: radius.md, overflow: 'hidden' }}>
                  <Image
                    source={{
                      uri: selectedEvent.fotoSnapshot || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80',
                    }}
                    style={{ width: '100%', height: 190 }}
                    resizeMode="cover"
                  />
                  <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(220,38,38,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>📸 SNAPSHOT OTOMATIS AI</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Pill label={selectedEvent.status === 'baru' ? 'Status: Baru (Belum Ditinjau)' : 'Status: Ditinjau & Selesai'} tone={selectedEvent.status === 'baru' ? 'warning' : 'success'} />
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>{selectedEvent.confidence}% Keyakinan AI</Text>
                </View>

                <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
                  {CCTV_ANOMALI_LABEL[selectedEvent.anomaliType]}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="camera" size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{selectedEvent.cameraLabel} • {selectedEvent.timestamp}</Text>
                </View>

                <View style={{ gap: 4, marginTop: 4 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Uraian Temuan Model AI:</Text>
                  <View style={[{ backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }]}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 20 }}>
                      {selectedEvent.deskripsiTemuan || `Deteksi anomali pada ${selectedEvent.cameraLabel} tercatat otomatis oleh sensor AI.`}
                    </Text>
                  </View>
                </View>

                {canWrite && selectedEvent.status === 'baru' && (
                  <PrimaryButton
                    label="Tandai Ditinjau & Selesai"
                    icon="check-circle"
                    onPress={() => {
                      reviewCctvEvent(selectedEvent.id);
                      setSelectedEvent((prev) => prev ? { ...prev, status: 'ditinjau' } : null);
                    }}
                    style={{ marginTop: 6 }}
                  />
                )}

                <SecondaryButton label="Tutup Detail" onPress={() => setSelectedEvent(null)} style={{ marginTop: 2 }} />
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

function CctvEventRow({ event, onPress }: { event: CctvEvent; onPress: () => void }) {
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const isBaru = event.status === 'baru';

  return (
    <Card style={{ gap: spacing.xs }} onPress={onPress}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {event.fotoSnapshot && (
          <Image source={{ uri: event.fotoSnapshot }} style={{ width: 64, height: 64, borderRadius: radius.sm }} resizeMode="cover" />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.rowTop}>
            <Pill label={isBaru ? 'Baru' : 'Ditinjau'} tone={isBaru ? 'warning' : 'success'} />
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>{event.confidence}% AI</Text>
          </View>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.xs, marginTop: 2 }} numberOfLines={1}>
            {CCTV_ANOMALI_LABEL[event.anomaliType]}
          </Text>
          <View style={styles.rowBottom}>
            <Feather name="camera" size={12} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>{event.cameraLabel} • {event.timestamp}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.primary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  cameraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cameraBox: { width: '48%', gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalCard: { borderRadius: 16, padding: 16 },
  hudBox: { marginTop: 4 },
});
