import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeDistribusi, ROLE_PERMISSIONS } from '../utils/scope';
import { DistribusiRute } from '../types';

const STEPS: { status: DistribusiRute['status']; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { status: 'menunggu', label: 'Menunggu Paket', icon: 'clock' },
  { status: 'dalam_perjalanan', label: 'Dalam Pengiriman', icon: 'truck' },
  { status: 'tiba', label: 'Selesai Terkirim', icon: 'check-circle' },
];

export default function DistribusiScreen({ navigation, route }: any) {
  const { role, sekolahList, distribusiList, updateDistribusiStatus, users, peralatanList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const [selectedRuteId, setSelectedRuteId] = useState<string | null>(route?.params?.ruteId ?? null);

  const inScope = useMemo(() => scopeDistribusi(sppgInScope, distribusiList), [sppgInScope, distribusiList]);
  const canAdvance = !!role && ROLE_PERMISSIONS[role].canManageDistribusi;

  const selectedRute = selectedRuteId ? inScope.find((r) => r.id === selectedRuteId) : null;
  const sekolah = sekolahList.find((s) => s.id === selectedRute?.sekolahId);
  const driver = users.find((u) => u.jobdesk === 'driver_distribusi' || u.role === 'PETUGAS_LAPANGAN');
  const mobilBox = peralatanList.find((p) => p.kategori === 'kendaraan');

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="navigation" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Pelacakan GPS Armada Live — Klik pada card rute untuk membuka **Log Pengiriman Detail (Style Shopee / Online Tracking)**.
        </Text>
      </View>

      <SectionTitle>Distribusi Armada GPS ({inScope.length} Rute)</SectionTitle>
      {inScope.length === 0 ? (
        <EmptyState icon="truck" title="Belum Ada Rute" body="Belum ada rute distribusi yang tercatat." />
      ) : (
        inScope.map((rute) => {
          const isKendala = rute.status === 'kendala';
          const stepIndex = STEPS.findIndex((s) => s.status === rute.status);
          const nextStatus = STEPS[stepIndex + 1]?.status;
          const sekolahItem = sekolahList.find((s) => s.id === rute.sekolahId);
          const sekolahNama = sekolahItem?.nama ?? rute.sekolahId;

          return (
            <Card key={rute.id} style={{ gap: spacing.sm }} onPress={() => setSelectedRuteId(rute.id)}>
              <View style={styles.rowTop}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm, flex: 1 }} numberOfLines={1}>
                  {sekolahNama}
                </Text>
                <Pill label={isKendala ? 'Kendala' : STEPS[stepIndex]?.label ?? rute.status} tone={isKendala ? 'danger' : rute.status === 'tiba' ? 'success' : 'info'} />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {sekolahItem?.fotoSekolah ? (
                  <Image source={{ uri: sekolahItem.fotoSekolah }} style={{ width: 50, height: 50, borderRadius: radius.sm }} />
                ) : (
                  <View style={{ width: 50, height: 50, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="truck" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Target: {sekolahItem?.jumlahSiswa ?? 350} siswa</Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Jam Tiba: {rute.estimasiTiba}</Text>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>Klik untuk Detail Tracking Log ➔</Text>
                </View>
              </View>

              {canAdvance && !isKendala && (
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                  {nextStatus && (
                    <PrimaryButton
                      label={`Majukan ➔ ${STEPS.find((s) => s.status === nextStatus)?.label}`}
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

      {/* Shopee-style Tracking Detail Modal */}
      <Modal visible={!!selectedRute} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="truck" size={20} color={colors.primary} />
                <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>Detail Pengiriman Shopee-Style</Text>
              </View>
              <Pressable onPress={() => setSelectedRuteId(null)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedRute && (
              <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 10 }}>
                {/* Live OSM Map Box */}
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Peta Live GPS Pengiriman:</Text>
                  <Image
                    source={{ uri: `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${selectedRute.lng},${selectedRute.lat}&z=15&l=map&size=500,160&pt=${selectedRute.lng},${selectedRute.lat},pm2rdm` }}
                    style={{ width: '100%', height: 130, borderRadius: radius.md }}
                    resizeMode="cover"
                  />
                  <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'right' }}>
                    GPS Live: {selectedRute.lat.toFixed(5)}, {selectedRute.lng.toFixed(5)}
                  </Text>
                </View>

                {/* Driver & Vehicle Box */}
                <View style={[styles.driverBox, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }]}>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="user" size={20} color={colors.primary} />
                    </View>
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
                    <View style={[styles.trackDot, { backgroundColor: selectedRute.status === 'dalam_perjalanan' ? colors.primary : colors.success }]}>
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

                {sekolah && (
                  <PrimaryButton
                    label={`Buka Detail ${sekolah.nama}`}
                    icon="home"
                    variant="outline"
                    onPress={() => {
                      setSelectedRuteId(null);
                      navigation.navigate('SekolahDetail', { sekolahId: sekolah.id });
                    }}
                  />
                )}
                <SecondaryButton label="Tutup Tracking Log" onPress={() => setSelectedRuteId(null)} />
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  driverBox: { marginTop: 4 },
  trackingTimeline: { gap: 12, paddingLeft: 6, marginVertical: 4 },
  trackItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trackDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
