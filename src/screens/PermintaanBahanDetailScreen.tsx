import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SecondaryButton } from '../components/ui';
import RouteMapView, { RouteTripStatus } from '../components/RouteMapView';
import QrPanel from '../components/QrPanel';
import { PermintaanBahan } from '../types';

const STATUS_LABEL: Record<PermintaanBahan['status'], string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses Gizi/Gudang',
  dikirim: 'Dalam Pengiriman',
  selesai: 'Selesai Terima',
};

const TRIP_STATUS: Record<PermintaanBahan['status'], RouteTripStatus> = {
  diajukan: 'idle',
  diproses: 'idle',
  dikirim: 'moving',
  selesai: 'arrived',
};

// Bahan tanpa mitra tetap (BahanBaku.mitraId null) otomatis diteruskan ke
// gudang logistik BGN Pusat, bukan ke mitra swasta — titik tetap di Jakarta
// dipakai sebagai origin rute pada kasus itu.
const BGN_PUSAT = { nama: 'Gudang Logistik BGN Pusat', lat: -6.1701, lng: 106.865 };

// Same tracking pattern as DistribusiDetailScreen, but for the other leg of
// the supply chain: raw material shipped either from a Mitra (supplier
// factory/farm) or, when the item has no fixed mitra, from BGN Pusat, to the
// SPPG kitchen. These routes are often cross-regency/province (even island)
// rather than the short SPPG-to-school hop, so the map here can span much
// further — RouteMapView already focuses on the vehicle icon itself rather
// than fitting both endpoints, so that holds regardless of distance.
export default function PermintaanBahanDetailScreen({ navigation, route }: any) {
  const { permintaanId } = route.params as { permintaanId: string };
  const { sppgList, mitraList, bahanBakuList, permintaanBahanList } = useApp();
  const { colors, spacing, fontSize, radius } = useTheme();

  const permintaan = permintaanBahanList.find((p) => p.id === permintaanId);
  const bahan = bahanBakuList.find((b) => b.id === permintaan?.bahanId);
  const mitra = bahan?.mitraId ? mitraList.find((m) => m.id === bahan.mitraId) : undefined;
  const sppg = sppgList.find((s) => s.id === permintaan?.sppgId);
  const origin = mitra ?? BGN_PUSAT;

  if (!permintaan || !sppg) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="package" title="Rute Tidak Ditemukan" body="Data permintaan bahan ini tidak tersedia." />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.rowTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="truck" size={17} color={colors.primary} />
          </View>
          <View>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>Lacak Pengiriman Pasokan</Text>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>No. DO: {permintaan.id}</Text>
          </View>
        </View>
        <Pill label={STATUS_LABEL[permintaan.status]} tone={permintaan.status === 'selesai' ? 'success' : permintaan.status === 'dikirim' ? 'info' : 'neutral'} />
      </View>

      <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
        {bahan?.nama ?? permintaan.bahanId} • {permintaan.jumlah} {bahan?.satuan ?? 'unit'}
      </Text>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="truck" size={14} color={colors.primary} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Peta Live Posisi Truk Pengiriman (OpenStreetMap GPS):</Text>
        </View>
        <RouteMapView
          originLat={origin.lat}
          originLng={origin.lng}
          originLabel={origin.nama}
          destLat={sppg.lat}
          destLng={sppg.lng}
          destLabel={sppg.nama}
          status={TRIP_STATUS[permintaan.status]}
          originIcon="factory"
          destIcon="home"
          vehicleIcon="truck"
          colors={colors}
          height={380}
        />
      </View>

      <Card style={{ gap: spacing.xs }}>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{mitra ? 'Mitra Pemasok' : 'Sumber Pengiriman'}</Text>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {mitra?.fotoLogo ? (
            <Image source={{ uri: mitra.fotoLogo }} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
          ) : (
            <View style={{ width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={mitra ? 'truck' : 'shield'} size={20} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{origin.nama}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              {mitra ? mitra.alamat ?? mitra.wilayahLayanan : 'Belum ada mitra pemasok tetap untuk bahan ini'}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Tujuan: {sppg.nama}</Text>
        {permintaan.catatan && <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Catatan: {permintaan.catatan}</Text>}
      </Card>

      {/* QR surat jalan — isinya id permintaan polos, karena yang memindai adalah
          scanner penerimaan di app ini sendiri (Pindai QR Penerimaan Barang). */}
      <Card style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="maximize" size={16} color={colors.primary} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, flex: 1 }}>
            QR Surat Jalan (DO) — {permintaan.id}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          Tempel/tunjukkan QR ini di dokumen pengiriman. Petugas gudang memindainya lewat menu
          "Pindai QR Penerimaan Barang" saat pasokan tiba untuk mencocokkan dan mencatat stok masuk.
        </Text>
        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
          <QrPanel value={permintaan.id} size={190} caption={`${bahan?.nama ?? permintaan.bahanId} • ${permintaan.jumlah} ${bahan?.satuan ?? 'unit'}`} />
        </View>
      </Card>

      <SecondaryButton label="Kembali" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
