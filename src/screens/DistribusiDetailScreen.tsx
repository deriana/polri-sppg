import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage } from '../utils/pickImage';
import RouteMapView, { RouteTripStatus } from '../components/RouteMapView';
import { DistribusiRute } from '../types';
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
  const { role, sppgList, sekolahList, distribusiList, users, peralatanList, updateDistribusiStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius, isDark } = useTheme();

  const [buktiFoto, setBuktiFoto] = useState<string | null>(null);
  const [showKendalaModal, setShowKendalaModal] = useState(false);
  const [rincianKendala, setRincianKendala] = useState('');

  const rute = distribusiList.find((r) => r.id === ruteId);
  const sppg = sppgList.find((s) => s.id === rute?.sppgId);
  const sekolah = sekolahList.find((s) => s.id === rute?.sekolahId);
  const driver = users.find((u) => u.role === 'DRIVER' || u.jobdesk === 'driver_distribusi' || u.role === 'PETUGAS_LAPANGAN');
  const mobilBox = peralatanList.find((p) => p.kategori === 'kendaraan');

  const canAdvance =
    !!role && ROLE_PERMISSIONS[role].canManageDistribusi && !!rute && sppgInScope.some((s) => s.id === rute.sppgId);

  if (!rute || !sppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="truck" title="Rute Tidak Ditemukan" body="Data rute pengiriman ini tidak tersedia." />
      </View>
    );
  }

  const handleSimpanKendala = () => {
    updateDistribusiStatus(rute.id, 'kendala');
    setShowKendalaModal(false);
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
            Rincian Masalah: {rincianKendala.trim() || 'Kendala lalu lintas / hambatan rute darurat'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Tim Command Center Polres/Polda telah diberi tahu untuk penanganan bantuan rute darurat.
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
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.gold }}>★ 4.9</Text>
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
        <ScrollView style={{ gap: spacing.md }} keyboardShouldPersistTaps="handled">
          <Input
            label="Penjelasan Kendala Pengiriman"
            icon="alert-circle"
            value={rincianKendala}
            onChangeText={setRincianKendala}
            placeholder="Contoh: Ban mobil pecah di Km 12 / Macet total akibat kecelakaan..."
            multiline
          />
          <PrimaryButton label="Simpan & Laporkan Kendala" icon="check" variant="danger" onPress={handleSimpanKendala} style={{ marginTop: 12 }} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 90 },
  truckImg: { width: 56, height: 56 },
  trackingTimeline: { gap: 12, paddingLeft: 6, marginVertical: 4 },
  trackItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trackDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
