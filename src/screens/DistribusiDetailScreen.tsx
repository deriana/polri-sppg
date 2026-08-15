import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage, pickMedia } from '../utils/pickImage';
import RouteMapView, { RouteTripStatus } from '../components/RouteMapView';
import CctvPlayer from '../components/CctvPlayer';
import QrPanel from '../components/QrPanel';
import { buildSerahTerimaPayload, encodeQrPayloadSafe } from '../utils/qrPayload';
import { BuktiMedia, DistribusiRute } from '../types';
import { BRAND_ASSETS } from '../data/images';

const TRIP_STATUS: Record<DistribusiRute['status'], RouteTripStatus> = {
  menunggu: 'idle',
  dalam_perjalanan: 'moving',
  tiba: 'arrived',
  kendala: 'problem',
};

const NEXT_STATUS: Record<DistribusiRute['status'], DistribusiRute['status'] | null> = {
  menunggu: 'dalam_perjalanan',
  dalam_perjalanan: 'tiba',
  kendala: 'dalam_perjalanan',
  tiba: null,
};

const NEXT_LABEL: Record<DistribusiRute['status'], string> = {
  menunggu: 'Dalam Pengiriman (Berangkat)',
  dalam_perjalanan: 'Tiba & Serahkan Makanan',
  tiba: '',
  kendala: 'Lanjutkan Pengiriman',
};

import { Modal, Input } from '../components/ui';

export default function DistribusiDetailScreen({ navigation, route }: any) {
  const { ruteId } = route.params as { ruteId: string };
  const {
    role,
    sppgList,
    sekolahList,
    distribusiList,
    users,
    peralatanList,
    updateDistribusiStatus,
    laporkanKendalaDistribusi,
    currentUser,
    kandunganGiziList,
    qualityPassportList,
    menuHarianPlanList,
  } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius, isDark } = useTheme();

  const [buktiFoto, setBuktiFoto] = useState<string | null>(null);
  const [showKendalaModal, setShowKendalaModal] = useState(false);
  const [rincianKendala, setRincianKendala] = useState('');
  // Lampiran bukti kendala yang sedang disusun di form (belum tersimpan).
  const [kendalaBukti, setKendalaBukti] = useState<BuktiMedia[]>([]);
  // Bukti yang sedang dibuka layar penuh dari kartu kendala.
  const [previewBukti, setPreviewBukti] = useState<BuktiMedia | null>(null);

  const rute = distribusiList.find((r) => r.id === ruteId);
  const sppg = sppgList.find((s) => s.id === rute?.sppgId);
  const sekolah = sekolahList.find((s) => s.id === rute?.sekolahId);
  const driver = users.find((u) => u.role === 'DRIVER' || u.jobdesk === 'driver_distribusi' || u.role === 'PETUGAS_LAPANGAN');
  const mobilBox = peralatanList.find((p) => p.kategori === 'kendaraan');

  const canAdvance =
    !!role && ROLE_PERMISSIONS[role].canManageDistribusi && !!rute && sppgInScope.some((s) => s.id === rute.sppgId);

  // QR serah terima: dibangun sekali saat rute berstatus "tiba", lalu dipindai
  // aplikasi pihak sekolah (aplikasi terpisah). Isi payload lengkap — rincian
  // stok porsi, angka gizi, dan hasil uji mutu batch — supaya sekolah bisa
  // memverifikasi kiriman tanpa akses ke database SPPG. Cocokkan data harian
  // berdasarkan sppgId + tanggal rute, dengan fallback entri terbaru SPPG itu
  // kalau hari tersebut belum punya catatan gizi/uji mutu sendiri.
  const serahTerimaQr = useMemo(() => {
    if (!rute || !sppg || rute.status !== 'tiba') return null;
    const bySppg = <T extends { sppgId: string; tanggal: string }>(list: T[]): T | undefined =>
      list.find((x) => x.sppgId === rute.sppgId && x.tanggal === rute.tanggal) ??
      list.find((x) => x.sppgId === rute.sppgId);
    const payload = buildSerahTerimaPayload({
      rute,
      sppg,
      sekolah,
      gizi: bySppg(kandunganGiziList),
      passport: bySppg(qualityPassportList),
      menuPlan: bySppg(menuHarianPlanList),
      driver,
      kendaraan: mobilBox,
      waktuTerbit: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    return { payload, ...encodeQrPayloadSafe(payload) };
  }, [rute?.id, rute?.status, rute?.tanggal, sppg?.id, sekolah?.id, kandunganGiziList, qualityPassportList, menuHarianPlanList]);

  if (!rute || !sppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="truck" title="Rute Tidak Ditemukan" body="Data rute pengiriman ini tidak tersedia." />
      </View>
    );
  }

  const attachBukti = async (source: 'camera' | 'library', mediaTypes: ('images' | 'videos')[]) => {
    const picked = await pickMedia(source, mediaTypes);
    if (picked) setKendalaBukti((prev) => [...prev, picked]);
  };

  // Laporan kendala wajib berbukti visual — teks saja tidak bisa diverifikasi
  // command center, dan itu justru sumber sengketa saat audit rute bermasalah.
  const handleSimpanKendala = () => {
    if (!rincianKendala.trim()) {
      Alert.alert('Rincian Wajib Diisi', 'Jelaskan kendala rute yang terjadi sebelum mengirim laporan.');
      return;
    }
    if (kendalaBukti.length === 0) {
      Alert.alert(
        'Bukti Visual Wajib Dilampirkan',
        'Lampirkan minimal satu foto atau video kondisi di lapangan. Laporan tanpa bukti tidak dapat diverifikasi Command Center.',
      );
      return;
    }
    laporkanKendalaDistribusi(
      rute.id,
      rincianKendala.trim(),
      kendalaBukti,
      currentUser?.nama ?? 'Driver Armada MBG',
    );
    setShowKendalaModal(false);
    setKendalaBukti([]);
    Alert.alert(
      'Laporan Kendala Terkirim',
      `Rincian kendala beserta ${kendalaBukti.length} bukti visual telah diteruskan ke Command Center Polres/Polda.`,
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Live Map with OSM OSRM Routing */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            Live GPS Tracking Pengiriman MBG:
          </Text>
          <Pill
            label={rute.status.toUpperCase().replace('_', ' ')}
            tone={rute.status === 'tiba' ? 'success' : rute.status === 'dalam_perjalanan' ? 'primary' : 'danger'}
          />
        </View>

        <RouteMapView
          originLat={sppg.lat}
          originLng={sppg.lng}
          originLabel={sppg.nama}
          destLat={rute.lat}
          destLng={rute.lng}
          destLabel={sekolah?.nama ?? rute.sekolahId}
          status={TRIP_STATUS[rute.status]}
          colors={colors}
          height={320}
        />
      </View>

      {/* Warning Card for Detailed Kendala */}
      {rute.status === 'kendala' && (
        <Card style={{ backgroundColor: colors.dangerBg, borderColor: colors.danger, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="alert-triangle" size={18} color={colors.danger} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.danger, flex: 1 }}>
              KENDALA PENGIRIMAN TERDETEKSI
            </Text>
            <Pill label="TINDAKAN DIPERLUKAN" tone="danger" />
          </View>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            Rincian Masalah: {rute.kendalaRincian || 'Kendala lalu lintas / hambatan rute darurat'}
          </Text>

          {/* Bukti visual lapangan — inti verifikasi laporan kendala */}
          <View style={{ gap: 6, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="camera" size={13} color={colors.danger} />
              <Text style={{ fontSize: 10.5, fontWeight: '900', color: colors.danger, flex: 1 }}>
                BUKTI VISUAL LAPANGAN ({rute.kendalaBukti?.length ?? 0})
              </Text>
              {!!rute.kendalaDilaporkan && (
                <Text style={{ fontSize: 10, color: colors.textMuted }}>{rute.kendalaDilaporkan} WIB</Text>
              )}
            </View>

            {rute.kendalaBukti && rute.kendalaBukti.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {rute.kendalaBukti.map((b, idx) => (
                  <Pressable key={`${b.uri}-${idx}`} onPress={() => setPreviewBukti(b)} style={{ width: 132, gap: 4 }}>
                    <View style={[styles.buktiThumbWrap, { borderColor: colors.danger, borderRadius: radius.md }]}>
                      {b.mediaType === 'video' ? (
                        <View style={[styles.buktiVideoStub, { backgroundColor: '#000' }]}>
                          <Feather name="play-circle" size={26} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '800' }}>VIDEO</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: b.uri }} style={styles.buktiThumb} resizeMode="cover" />
                      )}
                    </View>
                    <Text style={{ fontSize: 9.5, color: colors.textMuted }} numberOfLines={2}>
                      {b.keterangan ?? (b.mediaType === 'video' ? 'Rekaman kondisi lapangan' : 'Foto kondisi lapangan')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                Laporan lama tanpa lampiran bukti — laporan baru wajib menyertakan foto/video.
              </Text>
            )}
          </View>

          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Dilaporkan oleh {rute.kendalaPelapor ?? 'Driver Armada'}. Tim Command Center Polres/Polda telah diberi tahu
            untuk penanganan bantuan rute darurat.
          </Text>
        </Card>
      )}

      {/* Gojek/Grab Style Driver & Vehicle Badge Card */}
      <Card variant="accent" style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Image source={BRAND_ASSETS.truckMbg} style={styles.truckImg} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                {driver?.nama ?? 'Bripda Agus Prasetyo'}
              </Text>
              <Feather name="star" size={11} color={colors.gold} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.gold }}>4.9</Text>
            </View>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 }}>
              Armada: {mobilBox?.nama ?? 'Mobil Box Thermal MBG'} • Plat: {mobilBox?.noPlat ?? 'D-8801-SPP'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
              HP: {driver?.noHp ?? '0812-1000-0005'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Tracking History Log Timeline */}
      <Card style={{ gap: spacing.sm }}>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>
          Timeline Status Pengiriman Paket Makanan
        </Text>

        <View style={styles.trackingTimeline}>
          <View style={styles.trackItem}>
            <View style={[styles.trackDot, { backgroundColor: rute.status === 'tiba' ? colors.success : colors.border }]}>
              <Feather name="check" size={10} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>07:15 WIB — Paket Tiba di Sekolah</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Diserahterimakan ke Guru/Kepala Sekolah & Ompreng siap disajikan.</Text>
            </View>
          </View>

          <View style={styles.trackItem}>
            <View style={[styles.trackDot, { backgroundColor: rute.status === 'dalam_perjalanan' ? colors.primary : colors.success }]}>
              <Feather name="navigation" size={10} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>06:30 WIB — Armada Dalam Perjalanan (Live GPS)</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Driver melintasi rute utama komando menuju lokasi sekolah tujuan.</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Bukti Serah Terima foto */}
      {rute.status === 'tiba' && (
        <Card style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Foto Bukti Serah Terima Fisik</Text>
          {rute.buktiFoto ? (
            <Image source={{ uri: rute.buktiFoto }} style={{ width: '100%', height: 200, borderRadius: radius.md }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Belum ada foto bukti serah terima terlampir.</Text>
          )}
        </Card>
      )}

      {/* QR Serah Terima — dipindai ulang oleh aplikasi pihak sekolah */}
      {serahTerimaQr && (
        <Card style={{ gap: spacing.sm, alignItems: 'stretch' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="maximize" size={16} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text, flex: 1 }}>
              QR SERAH TERIMA — SCAN OLEH PIHAK SEKOLAH
            </Text>
            <Pill label="TERBIT" tone="success" />
          </View>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Tunjukkan QR ini ke petugas sekolah/penerima manfaat. Sekolah memindainya dengan aplikasi penerima
            manfaat untuk membaca rincian stok porsi, kandungan gizi, dan hasil uji mutu batch kiriman ini.
          </Text>

          <View style={{ alignItems: 'center', paddingVertical: 4 }}>
            <QrPanel value={serahTerimaQr.value} size={248} caption={`${serahTerimaQr.payload.ruteId} • ${serahTerimaQr.payload.waktuTerbit} WIB`} />
          </View>

          <View style={[styles.qrSummary, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <QrRow label="Sekolah Tujuan" value={serahTerimaQr.payload.sekolah.nama} colors={colors} fontSize={fontSize} />
            <QrRow label="Stok Porsi Diserahkan" value={`${serahTerimaQr.payload.stok.porsiDikirim} porsi`} colors={colors} fontSize={fontSize} />
            <QrRow label="Menu Batch" value={serahTerimaQr.payload.stok.menu} colors={colors} fontSize={fontSize} />
            {serahTerimaQr.payload.gizi ? (
              <QrRow
                label="Hasil Uji Gizi"
                value={`${serahTerimaQr.payload.gizi.kalori} kkal • Protein ${
                  serahTerimaQr.payload.gizi.proteinHewani + serahTerimaQr.payload.gizi.proteinNabati
                } g • AKG ${serahTerimaQr.payload.gizi.statusAkg}`}
                colors={colors}
                fontSize={fontSize}
              />
            ) : (
              <QrRow label="Hasil Uji Gizi" value="Belum ada catatan ahli gizi" colors={colors} fontSize={fontSize} />
            )}
            {serahTerimaQr.payload.ujiMutu ? (
              <QrRow
                label="Uji Mutu Batch"
                value={`${serahTerimaQr.payload.ujiMutu.batchId} • Grade ${serahTerimaQr.payload.ujiMutu.grade} (${serahTerimaQr.payload.ujiMutu.skor}) • Holding ${serahTerimaQr.payload.ujiMutu.suhuHoldingC}°C`}
                colors={colors}
                fontSize={fontSize}
              />
            ) : (
              <QrRow label="Uji Mutu Batch" value="Belum ada passport mutu" colors={colors} fontSize={fontSize} />
            )}
          </View>

          {serahTerimaQr.truncated && (
            <Text style={{ fontSize: 10.5, color: colors.warning, fontWeight: '700' }}>
              Nama menu dipendekkan di dalam QR agar pola tetap mudah dipindai. Rincian penuh tetap bisa dibuka lewat ruteId.
            </Text>
          )}
        </Card>
      )}

      {/* Action Controls for Driver/Staff */}
      {canAdvance && rute.status !== 'tiba' && (
        <Card style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            {rute.status === 'dalam_perjalanan' ? 'Upload Bukti Serah Terima Sekolah' : 'Kontrol Pengiriman Driver'}
          </Text>

          {rute.status === 'dalam_perjalanan' && (
            <>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                Driver wajib mengambil foto bukti serah terima bersama pihak sekolah sebelum menyelesaikan pengiriman.
              </Text>
              {buktiFoto ? (
                <Image source={{ uri: buktiFoto }} style={{ width: '100%', height: 180, borderRadius: radius.md }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="camera" size={28} color={colors.textMuted} />
                </View>
              )}
              <PrimaryButton
                label={buktiFoto ? 'Ganti Foto Serah Terima' : 'Ambil Foto Serah Terima'}
                icon="camera"
                variant={buktiFoto ? 'secondary' : 'primary'}
                onPress={async () => {
                  const uri = await pickImage('camera');
                  if (uri) setBuktiFoto(uri);
                }}
              />
            </>
          )}

          <PrimaryButton
            label={rute.status === 'dalam_perjalanan' ? 'Selesaikan & Konfirmasi Tiba' : `Majukan ➔ ${NEXT_LABEL[rute.status]}`}
            disabled={rute.status === 'dalam_perjalanan' && !buktiFoto}
            onPress={() => {
              const next = NEXT_STATUS[rute.status];
              if (next) updateDistribusiStatus(rute.id, next, buktiFoto ?? undefined);
            }}
          />

          {rute.status !== 'kendala' && (
            <PrimaryButton label="Laporkan Kendala Rute (Lengkap)" variant="danger" onPress={() => setShowKendalaModal(true)} />
          )}
        </Card>
      )}

      {sekolah && (
        <PrimaryButton
          label={`Lihat Data Sekolah ${sekolah.nama}`}
          icon="home"
          variant="outline"
          onPress={() => navigation.navigate('SekolahDetail', { sekolahId: sekolah.id })}
        />
      )}
      <SecondaryButton label="Kembali ke Daftar Rute" onPress={() => navigation.goBack()} />

      {/* Modal Kendala Rute */}
      <Modal visible={showKendalaModal} onClose={() => setShowKendalaModal(false)} title="Laporkan Rincian Kendala Rute">
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          <Input
            label="Penjelasan Kendala Pengiriman"
            icon="alert-circle"
            value={rincianKendala}
            onChangeText={setRincianKendala}
            placeholder="Contoh: Ban mobil pecah di Km 12 / Macet total akibat kecelakaan..."
            multiline
          />

          {/* Lampiran bukti — wajib minimal satu */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="paperclip" size={14} color={colors.danger} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, flex: 1 }}>
                Bukti Foto / Video Lapangan *
              </Text>
              <Pill
                label={kendalaBukti.length > 0 ? `${kendalaBukti.length} lampiran` : 'Wajib'}
                tone={kendalaBukti.length > 0 ? 'success' : 'danger'}
              />
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Command Center tidak bisa memverifikasi laporan berisi teks saja. Ambil foto/video kondisi armada, jalan,
              atau lokasi sekolah sebagai bukti.
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton
                label="Foto"
                icon="camera"
                variant="secondary"
                onPress={() => attachBukti('camera', ['images'])}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label="Rekam Video"
                icon="video"
                variant="secondary"
                onPress={() => attachBukti('camera', ['videos'])}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label="Galeri"
                icon="image"
                variant="secondary"
                onPress={() => attachBukti('library', ['images', 'videos'])}
                style={{ flex: 1 }}
              />
            </View>

            {kendalaBukti.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {kendalaBukti.map((b, idx) => (
                  <View key={`${b.uri}-${idx}`} style={{ width: 96 }}>
                    <View style={[styles.buktiThumbWrap, { borderColor: colors.border, borderRadius: radius.md }]}>
                      {b.mediaType === 'video' ? (
                        <View style={[styles.buktiVideoStub, { backgroundColor: '#000' }]}>
                          <Feather name="play-circle" size={22} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>VIDEO</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: b.uri }} style={styles.buktiThumb} resizeMode="cover" />
                      )}
                    </View>
                    <Pressable
                      onPress={() => setKendalaBukti((prev) => prev.filter((_, i) => i !== idx))}
                      style={[styles.removeBadge, { backgroundColor: colors.danger }]}
                      hitSlop={6}
                    >
                      <Feather name="x" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <PrimaryButton label="Simpan & Laporkan Kendala" icon="check" variant="danger" onPress={handleSimpanKendala} />
        </ScrollView>
      </Modal>

      {/* Pratinjau bukti kendala layar penuh */}
      {previewBukti && (
        <Modal visible={!!previewBukti} onClose={() => setPreviewBukti(null)} title="Bukti Kendala Lapangan">
          <View style={{ gap: spacing.md }}>
            {previewBukti.mediaType === 'video' ? (
              <CctvPlayer
                videoUri={previewBukti.uri}
                label={previewBukti.keterangan ?? 'Bukti kendala rute'}
                height={240}
                autoPlay={false}
                showRecHud={false}
              />
            ) : (
              <Image
                source={{ uri: previewBukti.uri }}
                style={{ width: '100%', height: 260, borderRadius: radius.md }}
                resizeMode="contain"
              />
            )}
            <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: '700' }}>
              {previewBukti.keterangan ?? 'Dokumentasi kondisi lapangan saat kendala terjadi.'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {rute.id} • dilaporkan {rute.kendalaDilaporkan ?? '-'} oleh {rute.kendalaPelapor ?? 'Driver Armada'}
            </Text>
            <SecondaryButton label="Tutup" onPress={() => setPreviewBukti(null)} />
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

function QrRow({ label, value, colors, fontSize }: { label: string; value: string; colors: any; fontSize: any }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <Text style={{ fontSize: 11, color: colors.textMuted, width: 118 }}>{label}</Text>
      <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: '700', flex: 1 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 90 },
  truckImg: { width: 56, height: 56 },
  qrSummary: { padding: 12, borderWidth: 1, gap: 6 },
  trackingTimeline: { gap: 12, paddingLeft: 6, marginVertical: 4 },
  trackItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trackDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  buktiThumbWrap: { width: '100%', height: 92, borderWidth: 1.5, overflow: 'hidden' },
  buktiThumb: { width: '100%', height: '100%' },
  buktiVideoStub: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
