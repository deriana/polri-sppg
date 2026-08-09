import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeDistribusi } from '../utils/scope';
import { DistribusiRute } from '../types';

const STATUS_LABEL: Record<DistribusiRute['status'], string> = {
  menunggu: 'Menunggu Paket',
  dalam_perjalanan: 'Dalam Pengiriman',
  tiba: 'Selesai Terkirim',
  kendala: 'Kendala',
};

const todayDateStr = () => new Date().toISOString().slice(0, 10);

export default function DistribusiScreen({ navigation }: any) {
  const { sekolahList, distribusiList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const inScope = useMemo(() => scopeDistribusi(sppgInScope, distribusiList), [sppgInScope, distribusiList]);
  const todayInScope = useMemo(() => inScope.filter((r) => r.tanggal === todayDateStr()), [inScope]);
  const isMultiSppg = sppgInScope.length > 1;
  const groupedBySppg = useMemo(() => {
    if (!isMultiSppg) return null;
    return sppgInScope
      .map((s) => ({ sppg: s, rutes: todayInScope.filter((r) => r.sppgId === s.id) }))
      .filter((g) => g.rutes.length > 0);
  }, [isMultiSppg, sppgInScope, todayInScope]);

  // Advance/kendala actions live in DistribusiDetailScreen now (that's also
  // where the "tiba" confirm + bukti-foto capture happens) — this list is a
  // tap-through index, not where status gets changed.
  const renderRuteCard = (rute: DistribusiRute) => {
    const isKendala = rute.status === 'kendala';
    const sekolahItem = sekolahList.find((s) => s.id === rute.sekolahId);
    const sekolahNama = sekolahItem?.nama ?? rute.sekolahId;

    return (
      <Card key={rute.id} style={{ gap: spacing.sm }} onPress={() => navigation.navigate('DistribusiDetail', { ruteId: rute.id })}>
        <View style={styles.rowTop}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm, flex: 1 }} numberOfLines={1}>
            {sekolahNama}
          </Text>
          <Pill label={STATUS_LABEL[rute.status]} tone={isKendala ? 'danger' : rute.status === 'tiba' ? 'success' : 'info'} />
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
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="navigation" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Pelacakan GPS Armada Live — Klik pada card rute untuk membuka **Log Pengiriman Detail (Style Shopee / Online Tracking)**.
        </Text>
      </View>

      <SectionTitle
        action={
          <Pressable onPress={() => navigation.navigate('RiwayatDistribusi')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' }}>Semua Log</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </Pressable>
        }
      >
        Distribusi Armada GPS Hari Ini ({todayInScope.length} Rute)
      </SectionTitle>
      {todayInScope.length === 0 ? (
        <EmptyState icon="truck" title="Belum Ada Rute" body="Belum ada rute distribusi untuk hari ini." />
      ) : groupedBySppg ? (
        groupedBySppg.map(({ sppg, rutes }) => (
          <View key={sppg.id} style={{ gap: spacing.sm }}>
            <View style={[styles.sppgHeader, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
              <Feather name="home" size={14} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.xs, flex: 1 }} numberOfLines={1}>
                {sppg.nama}
              </Text>
              <Pill label={`${rutes.length} sekolah`} tone="info" />
            </View>
            {rutes.map(renderRuteCard)}
          </View>
        ))
      ) : (
        todayInScope.map(renderRuteCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sppgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
});
