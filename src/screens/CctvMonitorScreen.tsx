import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeCctvEvents, ROLE_PERMISSIONS } from '../utils/scope';
import { CCTV_ANOMALI_LABEL } from '../data/cctvEvents';
import { CctvEvent } from '../types';
import { useLocalVideoUri } from '../utils/localVideoAsset';

export type CctvVideoKey = 'dapur' | 'freezer' | 'garasi' | 'tempatcuci';

// require() paths must be static string literals for Metro — see localVideoAsset.ts
// for why the resolved module id still needs useLocalVideoUri() before a WebView can play it.
export const CCTV_VIDEO_ASSETS: Record<CctvVideoKey, number> = {
  dapur: require('../../assets/cctv_dapur.mp4'),
  freezer: require('../../assets/cctv_freezer.mp4'),
  garasi: require('../../assets/cctv_garasi.mp4'),
  tempatcuci: require('../../assets/cctv_tempatcuci.mp4'),
};

const CCTV_THUMBNAILS: Record<CctvVideoKey, ImageSourcePropType> = {
  dapur: require('../../assets/cctv_dapur_thumb.jpg'),
  freezer: require('../../assets/cctv_freezer_thumb.jpg'),
  garasi: require('../../assets/cctv_garasi_thumb.jpg'),
  tempatcuci: require('../../assets/cctv_tempatcuci_thumb.jpg'),
};

export interface CctvFeedItem {
  id: string;
  zonaId: string;
  zonaNama: string;
  label: string;
  videoKey: CctvVideoKey;
  thumbnail: ImageSourcePropType;
  fps: string;
  aiStatus: string;
}

export const ZONA_CCTV = [
  { id: 'all', nama: 'Semua Area (12 Kamera)' },
  { id: 'z1', nama: 'Gudang & Penerimaan' },
  { id: 'z2', nama: 'Persiapan & Cutting' },
  { id: 'z3', nama: 'Dapur Pemasakan' },
  { id: 'z4', nama: 'Pemorsian & QC' },
  { id: 'z5', nama: 'Washing Bay & Sanitasi' },
  { id: 'z6', nama: 'Dispatch Armada' },
];

export const CCTV_FEEDS: CctvFeedItem[] = [
  // Zona 1: Gudang & Penerimaan
  {
    id: 'cctv_1',
    zonaId: 'z1',
    zonaNama: 'Zona 1: Gudang & Penerimaan',
    label: 'CAM 01 - Loading Dock Penerimaan Bahan',
    videoKey: 'garasi',
    thumbnail: CCTV_THUMBNAILS.garasi,
    fps: '30 FPS',
    aiStatus: 'Verifikasi Timbangan OK',
  },
  {
    id: 'cctv_2',
    zonaId: 'z1',
    zonaNama: 'Zona 1: Gudang & Penerimaan',
    label: 'CAM 02 - Gudang Bahan Kering & Sembako',
    videoKey: 'freezer',
    thumbnail: CCTV_THUMBNAILS.freezer,
    fps: '30 FPS',
    aiStatus: 'Stok FIFO Terpantau',
  },
  {
    id: 'cctv_3',
    zonaId: 'z1',
    zonaNama: 'Zona 1: Gudang & Penerimaan',
    label: 'CAM 03 - Cold Room Freezer (-18°C) & Chiller',
    videoKey: 'freezer',
    thumbnail: CCTV_THUMBNAILS.freezer,
    fps: '30 FPS',
    aiStatus: 'Suhu -18.2°C (Aman)',
  },

  // Zona 2: Persiapan & Cutting
  {
    id: 'cctv_4',
    zonaId: 'z2',
    zonaNama: 'Zona 2: Persiapan & Cutting',
    label: 'CAM 04 - Area Pemotongan Daging & Ikan',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'APD Sarung Tangan 100%',
  },
  {
    id: 'cctv_5',
    zonaId: 'z2',
    zonaNama: 'Zona 2: Persiapan & Cutting',
    label: 'CAM 05 - Area Pencucian & Pengupasan Sayur',
    videoKey: 'tempatcuci',
    thumbnail: CCTV_THUMBNAILS.tempatcuci,
    fps: '30 FPS',
    aiStatus: 'Sanitasi Air Terverifikasi',
  },

  // Zona 3: Dapur Pemasakan Utama
  {
    id: 'cctv_6',
    zonaId: 'z3',
    zonaNama: 'Zona 3: Dapur Pemasakan Utama',
    label: 'CAM 06 - Area Pemasakan Tilting Pan (Lauk)',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'APD Lengkap (99.4%)',
  },
  {
    id: 'cctv_7',
    zonaId: 'z3',
    zonaNama: 'Zona 3: Dapur Pemasakan Utama',
    label: 'CAM 07 - Pengukus Nasi Raksasa B (Karbo)',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'Suhu Kuali 102°C Standard',
  },

  // Zona 4: Pemorsian & Packaging
  {
    id: 'cctv_8',
    zonaId: 'z4',
    zonaNama: 'Zona 4: Pemorsian & Packaging',
    label: 'CAM 08 - Conveyor Line Pemorsian Ompreng',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'Gramasi Porsi Tepat',
  },
  {
    id: 'cctv_9',
    zonaId: 'z4',
    zonaNama: 'Zona 4: Pemorsian & Packaging',
    label: 'CAM 09 - Mesin Sealing & Packaging Box',
    videoKey: 'dapur',
    thumbnail: CCTV_THUMBNAILS.dapur,
    fps: '30 FPS',
    aiStatus: 'Segel Higienis Rapat',
  },

  // Zona 5: Washing Bay & Sanitasi
  {
    id: 'cctv_10',
    zonaId: 'z5',
    zonaNama: 'Zona 5: Washing Bay & Sanitasi',
    label: 'CAM 10 - Washing Bay & Automatic Dishwasher',
    videoKey: 'tempatcuci',
    thumbnail: CCTV_THUMBNAILS.tempatcuci,
    fps: '30 FPS',
    aiStatus: 'Sanitasi Deterjen Sesuai',
  },
  {
    id: 'cctv_11',
    zonaId: 'z5',
    zonaNama: 'Zona 5: Washing Bay & Sanitasi',
    label: 'CAM 11 - Sterilisasi Sinar UV & Dryer Ompreng',
    videoKey: 'tempatcuci',
    thumbnail: CCTV_THUMBNAILS.tempatcuci,
    fps: '30 FPS',
    aiStatus: 'Sinar UV Stereo 100%',
  },

  // Zona 6: Loading Gate Armada
  {
    id: 'cctv_12',
    zonaId: 'z6',
    zonaNama: 'Zona 6: Loading Gate Armada',
    label: 'CAM 12 - Dispatch Armada Kendaraan Penyalur',
    videoKey: 'garasi',
    thumbnail: CCTV_THUMBNAILS.garasi,
    fps: '30 FPS',
    aiStatus: 'Armada Ready 6 Unit',
  },
];

export default function CctvMonitorScreen() {
  const { role, currentSppg, cctvEvents, reviewCctvEvent, simulateCctvDetection } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [activeFeed, setActiveFeed] = useState<CctvFeedItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CctvEvent | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedZona, setSelectedZona] = useState('all');
  const videoUri = useLocalVideoUri(CCTV_VIDEO_ASSETS[activeFeed?.videoKey ?? 'dapur']);

  const filteredFeeds = useMemo(() => {
    if (selectedZona === 'all') return CCTV_FEEDS;
    return CCTV_FEEDS.filter((f) => f.zonaId === selectedZona);
  }, [selectedZona]);

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
          Pengawasan CCTV AI Real-Time — 12 Channel Kamera terbagi dalam 6 Wilayah Operasional Dapur SPPG. Klik kamera untuk putar stream.
        </Text>
      </View>

      <SectionTitle>Feed Kamera Live ({filteredFeeds.length} Channel)</SectionTitle>

      {/* Filter Wilayah / Zonal Dapur */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {ZONA_CCTV.map((z) => {
          const active = selectedZona === z.id;
          return (
            <Pressable
              key={z.id}
              onPress={() => setSelectedZona(z.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? colors.textInverse : colors.text }}>
                {z.nama}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.cameraGrid}>
        {filteredFeeds.map((feed) => (
          <Pressable
            key={feed.id}
            onPress={() => {
              setActiveFeed(feed);
              setIsFullscreen(false);
            }}
            style={[styles.cameraBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' }]}
          >
            <View style={{ width: '100%', height: 100, position: 'relative' }}>
              <Image source={feed.thumbnail} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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

      {/* CCTV Video Player Modal (Normal & Fullscreen) */}
      <Modal visible={!!activeFeed} animationType="fade" transparent={!isFullscreen}>
        <View style={isFullscreen ? styles.fullscreenOverlay : styles.modalOverlay}>
          <Card style={isFullscreen ? styles.fullscreenCard : [styles.modalCard, { backgroundColor: colors.surface }]}>
            {!isFullscreen && (
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Feather name="video" size={20} color={colors.danger} />
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                    {activeFeed?.label}
                  </Text>
                </View>
                <Pressable onPress={() => { setActiveFeed(null); setIsFullscreen(false); }}>
                  <Feather name="x" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            )}

            {activeFeed && (
              <View style={isFullscreen ? { flex: 1, width: '100%', position: 'relative' } : { gap: spacing.sm, marginTop: 10 }}>
                {/* Floating Controls Overlay when Fullscreen */}
                {isFullscreen && (
                  <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 99, flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => setIsFullscreen(false)}
                      style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#444' }}
                    >
                      <Feather name="minimize-2" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Keluar Layar Penuh</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setActiveFeed(null); setIsFullscreen(false); }}
                      style={{ backgroundColor: 'rgba(220,38,38,0.85)', padding: 8, borderRadius: 8 }}
                    >
                      <Feather name="x" size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                )}

                {/* Video Player WebView */}
                <View style={isFullscreen ? { flex: 1, width: '100%', backgroundColor: '#000' } : { width: '100%', height: 230, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' }}>
                  {!videoUri ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                  <WebView
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <style>
                            body, html { margin:0; padding:0; width:100%; height:100%; background-color:#000; overflow:hidden; font-family: monospace, sans-serif; }
                            .container { position:relative; width:100%; height:100%; }
                            video { width:100%; height:100%; border:0; object-fit:cover; pointer-events:none; }
                            .hud-top-left { position:absolute; top:10px; left:10px; color:#ef4444; font-weight:bold; font-size:${isFullscreen ? '14px' : '11px'}; display:flex; align-items:center; gap:6px; text-shadow:1px 1px 4px #000; z-index:10; }
                            .rec-dot { width:${isFullscreen ? '10px' : '8px'}; height:${isFullscreen ? '10px' : '8px'}; background-color:#ef4444; border-radius:50%; animation: blink 1s infinite; }
                            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                            .hud-top-right { position:absolute; top:10px; right:10px; color:#00ff66; font-size:${isFullscreen ? '13px' : '10px'}; font-weight:bold; text-shadow:1px 1px 4px #000; background:rgba(0,0,0,0.5); padding:3px 6px; border-radius:4px; z-index:10; }
                            .hud-bottom-left { position:absolute; bottom:10px; left:10px; max-width:55%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#ffffff; font-size:${isFullscreen ? '13px' : '10px'}; font-weight:bold; text-shadow:1px 1px 4px #000; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:4px; z-index:10; }
                            .hud-bottom-right { position:absolute; bottom:10px; right:10px; color:#00e5ff; font-size:${isFullscreen ? '12px' : '9px'}; font-weight:bold; text-shadow:1px 1px 4px #000; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:4px; z-index:10; }

                            ${
                              isFullscreen
                                ? `
                                  @media (orientation: portrait) {
                                    .container {
                                      width: 100vh !important;
                                      height: 100vw !important;
                                      transform: rotate(90deg);
                                      transform-origin: top left;
                                      position: absolute;
                                      top: 0;
                                      left: 100vw;
                                    }
                                  }
                                `
                                : ''
                            }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <video src="${videoUri}" autoplay loop playsinline></video>
                            <div class="hud-top-left"><div class="rec-dot"></div>● REC LIVE LANDSCAPE</div>
                            <div class="hud-top-right" id="clock">2026-08-09 --:--:--</div>
                            <div class="hud-bottom-left">${activeFeed.label.toUpperCase()}</div>
                            <div class="hud-bottom-right">1080P • AI ACTIVE</div>
                          </div>
                          <script>
                            function updateClock() {
                              const now = new Date();
                              const y = now.getFullYear();
                              const m = String(now.getMonth()+1).padStart(2,'0');
                              const d = String(now.getDate()).padStart(2,'0');
                              const hh = String(now.getHours()).padStart(2,'0');
                              const mm = String(now.getMinutes()).padStart(2,'0');
                              const ss = String(now.getSeconds()).padStart(2,'0');
                              document.getElementById('clock').innerText = y + '-' + m + '-' + d + ' ' + hh + ':' + mm + ':' + ss;
                            }
                            setInterval(updateClock, 1000);
                            updateClock();
                          </script>
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
                  )}
                </View>

                {!isFullscreen && (
                  <>
                    <View style={[styles.hudBox, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, gap: 8 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 160 }}>
                          <Feather name="cpu" size={14} color={colors.primary} />
                          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Computer Vision AI Analytics</Text>
                        </View>
                        <Pill label={activeFeed.aiStatus} tone="success" style={{ alignSelf: 'flex-start' }} />
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }}>
                        Status AI: Deteksi Alat Pelindung Diri (APD Masker & Sarung Tangan) terverifikasi 99.4%. Tidak ditemukan anomali suhu.
                      </Text>
                    </View>

                    <View style={{ gap: 8 }}>
                      <PrimaryButton
                        label="Layar Penuh (Fullscreen)"
                        icon="maximize-2"
                        onPress={() => setIsFullscreen(true)}
                      />
                      <SecondaryButton
                        label="Tutup Video Stream"
                        onPress={() => { setActiveFeed(null); setIsFullscreen(false); }}
                      />
                    </View>
                  </>
                )}
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
  fullscreenOverlay: { flex: 1, backgroundColor: '#000000', padding: 0 },
  fullscreenCard: { flex: 1, borderRadius: 0, padding: 0, backgroundColor: '#000000', margin: 0 },
  hudBox: { marginTop: 4 },
});
