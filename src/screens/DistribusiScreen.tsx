import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SchoolCarouselCard, SectionTitle } from '../components/ui';
import RouteMapView from '../components/RouteMapView';
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
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark, shadow } = useTheme();

  const inScope = useMemo(() => scopeDistribusi(sppgInScope, distribusiList), [sppgInScope, distribusiList]);
  const todayInScope = useMemo(() => inScope.filter((r) => r.tanggal === todayDateStr()), [inScope]);
  const isMultiSppg = sppgInScope.length > 1;

  const [selectedRuteId, setSelectedRuteId] = useState<string | null>(() => todayInScope[0]?.id || null);

  const selectedRute = useMemo(
    () => todayInScope.find((r) => r.id === selectedRuteId) || todayInScope[0] || null,
    [todayInScope, selectedRuteId],
  );

  const selectedSekolah = useMemo(
    () => (selectedRute ? sekolahList.find((s) => s.id === selectedRute.sekolahId) : null),
    [selectedRute, sekolahList],
  );

  const groupedBySppg = useMemo(() => {
    if (!isMultiSppg) return null;
    return sppgInScope
      .map((s) => ({ sppg: s, rutes: todayInScope.filter((r) => r.sppgId === s.id) }))
      .filter((g) => g.rutes.length > 0);
  }, [isMultiSppg, sppgInScope, todayInScope]);

  const renderRuteCard = (rute: DistribusiRute) => {
    const isKendala = rute.status === 'kendala';
    const sekolahItem = sekolahList.find((s) => s.id === rute.sekolahId);
    const sekolahNama = sekolahItem?.nama ?? rute.sekolahId;
    const isSelected = rute.id === selectedRute?.id;

    return (
      <Card
        key={rute.id}
        style={{
          gap: 12,
          padding: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          ...shadow.card,
        }}
        onPress={() => {
          setSelectedRuteId(rute.id);
          navigation.navigate('DistribusiDetail', { ruteId: rute.id });
        }}
      >
        <View style={styles.rowTop}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, flex: 1 }} numberOfLines={1}>
            {sekolahNama}
          </Text>
          <Pill label={STATUS_LABEL[rute.status]} tone={isKendala ? 'danger' : rute.status === 'tiba' ? 'success' : 'info'} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {sekolahItem?.fotoSekolah ? (
            <Image source={{ uri: sekolahItem.fotoSekolah }} style={{ width: 54, height: 54, borderRadius: 14 }} />
          ) : (
            <View style={{ width: 54, height: 54, borderRadius: 14, backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : (colors.cyanLight || '#ECFEFF'), alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="truck" size={24} color={isDark ? '#22D3EE' : (colors.cyan || '#0891B2')} />
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
              Target: {sekolahItem?.jumlahSiswa ?? 350} siswa ({sekolahItem?.jumlahSiswa ?? 350} porsi)
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
              Estimasi Tiba: <Text style={{ fontWeight: '700', color: colors.text }}>{rute.estimasiTiba || '11:00 WIB'}</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
              <Text style={{ color: isDark ? colors.gold : (colors.accent || colors.primary), fontSize: 11, fontWeight: '800' }}>
                Buka Log Tracking Detail
              </Text>
              <Feather name="chevron-right" size={13} color={isDark ? colors.gold : (colors.accent || colors.primary)} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. TACTICAL GPS MAP VIEW */}
      {selectedRute && (
        <View style={[styles.mapContainer, { borderRadius: radius.xl, borderColor: colors.border, overflow: 'hidden' }]}>
          <RouteMapView
            originLat={-6.9147}
            originLng={107.6098}
            originLabel="Dapur Sentral SPPG Polri"
            destLat={selectedRute?.lat ?? -6.9038}
            destLng={selectedRute?.lng ?? 107.6186}
            destLabel={selectedSekolah?.nama ?? 'Sekolah Afiliasi'}
            status={
              selectedRute.status === 'kendala'
                ? 'problem'
                : selectedRute.status === 'tiba'
                ? 'arrived'
                : selectedRute.status === 'dalam_perjalanan'
                ? 'moving'
                : 'idle'
            }
            height={240}
            colors={colors}
          />
        </View>
      )}

      {/* 2. HORIZONTAL SCHOOL CAROUSEL SLIDER */}
      {todayInScope.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionTitle
            style={{ marginBottom: 0 }}
            action={
              <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
                {todayInScope.length} Titik Sekolah
              </Text>
            }
          >
            Radar Sekolah Afiliasi Hari Ini
          </SectionTitle>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            {todayInScope.map((r) => {
              const sch = sekolahList.find((s) => s.id === r.sekolahId);
              const isSelected = (selectedRuteId || todayInScope[0]?.id) === r.id;
              return (
                <SchoolCarouselCard
                  key={r.id}
                  nama={sch?.nama ?? r.sekolahId}
                  alamat={sch?.alamat}
                  siswaCount={sch?.jumlahSiswa ?? 350}
                  targetPorsi={sch?.jumlahSiswa ?? 350}
                  status={r.status}
                  eta={r.estimasiTiba || '10:45 WIB'}
                  suhuKedatangan={64.5}
                  isSelected={isSelected}
                  onPress={() => {
                    setSelectedRuteId(r.id);
                    navigation.navigate('DistribusiDetail', { ruteId: r.id });
                  }}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 3. DAFTAR RUTE DISTRIBUSI */}
      <SectionTitle
        action={
          <Pressable onPress={() => navigation.navigate('RiwayatDistribusi')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' }}>Semua Log</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </Pressable>
        }
      >
        Daftar Rute Pengiriman ({todayInScope.length})
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
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  mapContainer: {
    borderWidth: 1,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sppgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
});
