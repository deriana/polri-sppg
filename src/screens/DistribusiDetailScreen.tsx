import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, PrimaryButton, SecondaryButton } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage } from '../utils/pickImage';
import RouteMapView, { RouteTripStatus } from '../components/RouteMapView';
import { DistribusiRute } from '../types';

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
  menunggu: 'Dalam Pengiriman',
  dalam_perjalanan: 'Selesai Terkirim',
  tiba: '',
  kendala: 'Dalam Pengiriman',
};

export default function DistribusiDetailScreen({ navigation, route }: any) {
  const { ruteId } = route.params as { ruteId: string };
  const { role, sppgList, sekolahList, distribusiList, users, peralatanList, updateDistribusiStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius } = useTheme();
  const [buktiFoto, setBuktiFoto] = useState<string | null>(null);

  const rute = distribusiList.find((r) => r.id === ruteId);
  const sppg = sppgList.find((s) => s.id === rute?.sppgId);
  const sekolah = sekolahList.find((s) => s.id === rute?.sekolahId);
  const driver = users.find((u) => u.jobdesk === 'driver_distribusi' || u.role === 'PETUGAS_LAPANGAN');
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

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Live OSM Map — vehicle icon steps along the real road route */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Peta Live Pelacakan (OpenStreetMap):</Text>
        <RouteMapView
          originLat={sppg.lat}
          originLng={sppg.lng}
          originLabel={sppg.nama}
          destLat={rute.lat}
          destLng={rute.lng}
          destLabel={sekolah?.nama ?? rute.sekolahId}
          status={TRIP_STATUS[rute.status]}
          colors={colors}
          height={380}
        />
      </View>

      {/* Driver & Vehicle Box */}
      <View style={[styles.driverBox, { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 }]}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {driver?.fotoProfil ? (
            <Image source={{ uri: driver.fotoProfil }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="user" size={20} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>Driver: {driver?.nama ?? 'Bripda Rina Marlina'}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Armada: {mobilBox?.nama ?? 'Mobil Box Insulasi Hino'} ({mobilBox?.noPlat ?? 'B 9812 BGN'})</Text>
          </View>
        </View>
      </View>

      {/* Tracking History Log Timeline */}
      <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 4 }}>Riwayat Lacak Pengiriman Paket (Log Timeline):</Text>

      <View style={styles.trackingTimeline}>
        <View style={styles.trackItem}>
          <View style={[styles.trackDot, { backgroundColor: colors.success }]}>
            <Feather name="check" size={10} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>07:15 WIB — Paket Tiba di Sekolah</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Diserahterimakan kepada Guru Piket Kebersihan SD & Ompreng siap disantap.</Text>
          </View>
        </View>

        <View style={styles.trackItem}>
          <View style={[styles.trackDot, { backgroundColor: rute.status === 'dalam_perjalanan' ? colors.primary : colors.success }]}>
            <Feather name="truck" size={10} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>06:30 WIB — Armada Dalam Perjalanan</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Kurir melewati Checkpoint Jalan Raya (Kurang 1.2 KM dari lokasi sekolah tujuan).</Text>
          </View>
        </View>

        <View style={styles.trackItem}>
          <View style={[styles.trackDot, { backgroundColor: colors.success }]}>
            <Feather name="package" size={10} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>06:00 WIB — Loading Barang ke Mobil Box</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Ompreng makanan berkuah dimuat ke Insulated Thermal Box dan tersegel rapat.</Text>
          </View>
        </View>

        <View style={styles.trackItem}>
          <View style={[styles.trackDot, { backgroundColor: colors.success }]}>
            <Feather name="clipboard" size={10} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>05:30 WIB — Selesai Pemasakan & Pemorsian</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Tim Pemorsi Dapur SPPG menyelesaikan 450 porsi sesuai standar gizi.</Text>
          </View>
        </View>
      </View>

      {/* Bukti Serah Terima — dokumentasi transparansi begitu paket dinyatakan tiba */}
      {rute.status === 'tiba' && (
        <Card style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Bukti Serah Terima</Text>
          {rute.buktiFoto ? (
            <Image source={{ uri: rute.buktiFoto }} style={{ width: '100%', height: 200, borderRadius: radius.md }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Belum ada foto dokumentasi untuk pengiriman ini.</Text>
          )}
        </Card>
      )}

      {/* Aksi Status — konfirmasi wajib pakai foto bukti sebelum masuk status "tiba" */}
      {canAdvance && rute.status !== 'tiba' && (
        <Card style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            {rute.status === 'dalam_perjalanan' ? 'Konfirmasi Serah Terima' : 'Ubah Status Pengiriman'}
          </Text>

          {rute.status === 'dalam_perjalanan' && (
            <>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                Ambil foto bukti paket sudah diserahkan ke sekolah sebelum konfirmasi diterima.
              </Text>
              {buktiFoto ? (
                <Image source={{ uri: buktiFoto }} style={{ width: '100%', height: 180, borderRadius: radius.md }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="camera" size={28} color={colors.textMuted} />
                </View>
              )}
              <PrimaryButton
                label={buktiFoto ? 'Ambil Ulang Foto' : 'Ambil Foto Bukti'}
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
            label={rute.status === 'dalam_perjalanan' ? 'Konfirmasi Diterima' : `Majukan ➔ ${NEXT_LABEL[rute.status]}`}
            variant="secondary"
            disabled={rute.status === 'dalam_perjalanan' && !buktiFoto}
            onPress={() => {
              const next = NEXT_STATUS[rute.status];
              if (next) updateDistribusiStatus(rute.id, next, buktiFoto ?? undefined);
            }}
          />

          {rute.status !== 'kendala' && (
            <PrimaryButton label="Tandai Kendala" variant="danger" onPress={() => updateDistribusiStatus(rute.id, 'kendala')} />
          )}
        </Card>
      )}

      {sekolah && (
        <PrimaryButton
          label={`Buka Detail ${sekolah.nama}`}
          icon="home"
          variant="outline"
          onPress={() => navigation.navigate('SekolahDetail', { sekolahId: sekolah.id })}
        />
      )}
      <SecondaryButton label="Kembali" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  driverBox: { marginTop: 4 },
  trackingTimeline: { gap: 12, paddingLeft: 6, marginVertical: 4 },
  trackItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trackDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
