import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeBahanBaku } from '../utils/scope';
import CctvPlayer from '../components/CctvPlayer';
import { CCTV_FEEDS, CCTV_VIDEO_ASSETS } from './CctvMonitorScreen';
import { useLocalVideoUri } from '../utils/localVideoAsset';
import { BahanBaku, BahanKategori } from '../types';

const KATEGORI_LABEL: Record<BahanKategori, string> = {
  bahan_pokok: 'Bahan Pokok',
  protein: 'Protein & Daging',
  sayur_buah: 'Sayur & Buah',
  bumbu: 'Bumbu & Minyak',
  kemasan: 'Kemasan & Box',
  lainnya: 'Lainnya',
};

const SUHU_AMAN_MAX = 8;
const EXPIRY_WARNING_DAYS = 3;

function daysUntil(tanggal: string): number {
  const d = new Date(tanggal);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GudangKondisiScreen({ navigation }: any) {
  const { currentSppg, foodSafetyList, bahanBakuList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  // CCTV Play/Pause State (Default standby / no auto-play)
  const [isCctvPlaying, setIsCctvPlaying] = useState(false);

  // Modal State: 'semua' | 'menipis' | 'kadaluarsa' | null
  const [activeModal, setActiveModal] = useState<'semua' | 'menipis' | 'kadaluarsa' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sensorSuhu = foodSafetyList.find((f) => f.sppgId === currentSppg?.id && f.sumberSuhu === 'sensor_iot');
  const isSuhuAman = sensorSuhu ? sensorSuhu.suhuPenyimpanan <= SUHU_AMAN_MAX : true;

  const bahanInScope = useMemo(() => scopeBahanBaku(sppgInScope, bahanBakuList), [sppgInScope, bahanBakuList]);

  // Bahan stok di bawah ambang minimum
  const stokMenipis = useMemo(() => {
    return bahanInScope.filter((b) => b.stok <= b.ambangMinimum);
  }, [bahanInScope]);

  // Bahan mendekati kadaluarsa FEFO
  const akanKadaluarsa = useMemo(() => {
    return bahanInScope
      .filter((b) => {
        if (!b.tanggalKadaluarsa) return false;
        const days = daysUntil(b.tanggalKadaluarsa);
        return days <= EXPIRY_WARNING_DAYS;
      })
      .sort((a, b) => (a.tanggalKadaluarsa ?? '').localeCompare(b.tanggalKadaluarsa ?? ''));
  }, [bahanInScope]);

  const gudangFeed = CCTV_FEEDS.find((f) => f.zonaId === 'z1');
  const videoUri = useLocalVideoUri(CCTV_VIDEO_ASSETS[gudangFeed?.videoKey ?? 'freezer']);

  // Modal Filtered Items
  const modalItems = useMemo(() => {
    let baseList: BahanBaku[] = [];
    if (activeModal === 'semua') baseList = bahanInScope;
    if (activeModal === 'menipis') baseList = stokMenipis;
    if (activeModal === 'kadaluarsa') baseList = akanKadaluarsa;

    if (!searchQuery.trim()) return baseList;
    return baseList.filter((b) => b.nama.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeModal, bahanInScope, stokMenipis, akanKadaluarsa, searchQuery]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Banner */}
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="info" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Panel Kondisi Gudang — pantau suhu cold storage IoT, status stok real-time, dan kendali CCTV area gudang.
        </Text>
      </View>

      {/* 2. Suhu Cold Storage */}
      <SectionTitle>Suhu Cold Storage</SectionTitle>
      <Card style={{ gap: spacing.xs }}>
        {sensorSuhu ? (
          <>
            <View style={styles.rowTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="activity" size={14} color={colors.primary} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Sensor IoT • Update Live</Text>
              </View>
              <Pill label={isSuhuAman ? 'Suhu Normal' : 'Suhu Tidak Normal (>8°C)'} tone={isSuhuAman ? 'success' : 'danger'} />
            </View>
            <Text style={{ color: isSuhuAman ? colors.success : colors.danger, fontWeight: '900', fontSize: 32 }}>
              {sensorSuhu.suhuPenyimpanan.toFixed(1)}°C
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
              Ambang batas dingin standar pangan: maksimal {SUHU_AMAN_MAX}°C
            </Text>
          </>
        ) : (
          <EmptyState icon="thermometer" title="Sensor Belum Terpasang" body="Belum ada data sensor suhu IoT untuk SPPG ini." />
        )}
      </Card>

      {/* 3. Kondisi Stok Gudang (Interactive Cards) */}
      <SectionTitle>Kondisi Stok Gudang (Klik Kartu untuk Rincian)</SectionTitle>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {/* Total Bahan Card */}
        <Card onPress={() => setActiveModal('semua')} style={[styles.kpiCard, { borderColor: colors.primary }]}>
          <View style={styles.kpiTopRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>TOTAL BAHAN</Text>
            <Feather name="external-link" size={12} color={colors.primary} />
          </View>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 24 }}>
            {bahanInScope.length}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '700' }}>
            Lihat Semua
          </Text>
        </Card>

        {/* Stok Menipis Card */}
        <Card onPress={() => setActiveModal('menipis')} style={[styles.kpiCard, { borderColor: stokMenipis.length > 0 ? colors.danger : colors.border }]}>
          <View style={styles.kpiTopRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>STOK MENIPIS</Text>
            <Feather name="alert-circle" size={12} color={stokMenipis.length > 0 ? colors.danger : colors.textMuted} />
          </View>
          <Text style={{ color: stokMenipis.length > 0 ? colors.danger : colors.text, fontWeight: '900', fontSize: 24 }}>
            {stokMenipis.length}
          </Text>
          <Text style={{ color: stokMenipis.length > 0 ? colors.danger : colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
            {stokMenipis.length > 0 ? 'Perlu Restok >' : 'Stok Aman'}
          </Text>
        </Card>

        {/* Mau Kadaluarsa Card */}
        <Card onPress={() => setActiveModal('kadaluarsa')} style={[styles.kpiCard, { borderColor: akanKadaluarsa.length > 0 ? colors.warning : colors.border }]}>
          <View style={styles.kpiTopRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>FEFO EXP</Text>
            <Feather name="clock" size={12} color={akanKadaluarsa.length > 0 ? colors.warning : colors.textMuted} />
          </View>
          <Text style={{ color: akanKadaluarsa.length > 0 ? colors.warning : colors.text, fontWeight: '900', fontSize: 24 }}>
            {akanKadaluarsa.length}
          </Text>
          <Text style={{ color: akanKadaluarsa.length > 0 ? colors.warning : colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
            {akanKadaluarsa.length > 0 ? 'Prioritas Olah >' : 'Kadaluarsa Aman'}
          </Text>
        </Card>
      </View>

      {/* 4. Daftar Bahan Stok Menipis & Kritis */}
      {stokMenipis.length > 0 && (
        <Card style={{ gap: spacing.sm, borderColor: colors.danger, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="alert-octagon" size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: '900', fontSize: fontSize.xs }}>
                DAFTAR BAHAN STOK KRITIS / MENIPIS ({stokMenipis.length})
              </Text>
            </View>
            <Pill label="Perlu Pengadaan" tone="danger" />
          </View>

          <View style={{ gap: 6 }}>
            {stokMenipis.map((b) => {
              const selisih = b.ambangMinimum - b.stok;
              return (
                <View key={b.id} style={[styles.listItemRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                      {b.nama}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Lokasi: {b.lokasiRak ?? 'Gudang Utama'} • Kategori: {KATEGORI_LABEL[b.kategori]}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.danger }}>
                      {b.stok} {b.satuan}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.danger, fontWeight: '700' }}>
                      (Kurang {selisih > 0 ? selisih : 0} {b.satuan} dari min {b.ambangMinimum})
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* 5. Daftar Bahan Mendekati Kadaluarsa (FEFO Countdown) */}
      {akanKadaluarsa.length > 0 && (
        <Card style={{ gap: spacing.sm, borderColor: colors.warning, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="clock" size={16} color={colors.warning} />
              <Text style={{ color: colors.warning, fontWeight: '900', fontSize: fontSize.xs }}>
                DAFTAR PRIORITAS FEFO (KEDALUWARSA DEKAT)
              </Text>
            </View>
            <Pill label={`${akanKadaluarsa.length} Bahan`} tone="warning" />
          </View>

          <View style={{ gap: 6 }}>
            {akanKadaluarsa.map((b) => {
              const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : 0;
              const isUrgent = sisaHari <= 1;

              return (
                <View key={b.id} style={[styles.listItemRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                      {b.nama}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Stok: {b.stok} {b.satuan} • {b.lokasiRak}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Pill
                      label={sisaHari <= 0 ? 'KADALUARSA HARI INI!' : `${sisaHari} Hari Lagi`}
                      tone={isUrgent ? 'danger' : 'warning'}
                    />
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.text }}>
                      Exp: {b.tanggalKadaluarsa}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* 6. CCTV Area Gudang (With Play/Pause On-Demand Control) */}
      <SectionTitle
        action={
          <Pill
            label={isCctvPlaying ? 'LIVE STREAM' : 'STANDBY'}
            tone={isCctvPlaying ? 'danger' : 'neutral'}
          />
        }
      >
        CCTV Area Gudang
      </SectionTitle>

      {gudangFeed ? (
        <Card style={{ gap: 10, padding: 12 }}>
          {isCctvPlaying ? (
            <View style={{ gap: 8 }}>
              <CctvPlayer videoUri={videoUri} label={gudangFeed.label} height={220} autoPlay={true} />
              <PrimaryButton
                label="Jeda Stream CCTV (Hemat Bandwidth)"
                icon="pause"
                variant="outline"
                onPress={() => setIsCctvPlaying(false)}
              />
            </View>
          ) : (
            <View style={[styles.cctvStandbyBox, { backgroundColor: isDark ? '#000000' : '#1E293B', borderRadius: radius.md }]}>
              <View style={[styles.cctvIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Feather name="video" size={32} color="#FFFFFF" />
              </View>

              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: fontSize.md, textAlign: 'center' }}>
                Kamera CCTV: {gudangFeed.label}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: fontSize.xs, textAlign: 'center', maxWidth: '85%' }}>
                Live streaming dinonaktifkan otomatis demi efisiensi kuota. Ketuk tombol untuk memutar feed.
              </Text>

              <PrimaryButton
                label="Putar Live Feed CCTV Gudang"
                icon="play"
                onPress={() => setIsCctvPlaying(true)}
                style={{ marginTop: 6, minWidth: 220 }}
              />
            </View>
          )}
        </Card>
      ) : (
        <EmptyState icon="video-off" title="Kamera Tidak Tersedia" body="Belum ada feed CCTV untuk area gudang." />
      )}

      {/* 7. MODAL LIST RINCIAN BAHAN */}
      <Modal
        visible={activeModal !== null}
        onClose={() => {
          setActiveModal(null);
          setSearchQuery('');
        }}
        title={
          activeModal === 'semua'
            ? `Seluruh Stok Bahan Baku (${bahanInScope.length})`
            : activeModal === 'menipis'
            ? `Daftar Bahan Stok Menipis (${stokMenipis.length})`
            : `Daftar Bahan FEFO Kadaluarsa (${akanKadaluarsa.length})`
        }
      >
        <View style={{ gap: 10, maxHeight: 450 }}>
          <Input
            icon="search"
            placeholder="Cari nama bahan baku..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearable
          />

          <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            {modalItems.length === 0 ? (
              <EmptyState icon="package" title="Tidak Ditemukan" body="Tidak ada bahan baku yang cocok dengan pencarian." />
            ) : (
              modalItems.map((b) => {
                const isLow = b.stok <= b.ambangMinimum;
                const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : null;
                const isExpiringSoon = sisaHari !== null && sisaHari <= EXPIRY_WARNING_DAYS;

                return (
                  <View
                    key={b.id}
                    style={[
                      styles.modalItemCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isLow ? colors.danger : isExpiringSoon ? colors.warning : colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {b.fotoBahan ? (
                        <Image source={{ uri: b.fotoBahan }} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                      ) : (
                        <View style={[styles.modalIconWrap, { backgroundColor: isLow ? colors.dangerBg : colors.primaryLight }]}>
                          <Feather name="package" size={18} color={isLow ? colors.danger : colors.primary} />
                        </View>
                      )}

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                          {b.nama}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                          <Pill label={KATEGORI_LABEL[b.kategori]} tone="neutral" />
                          {b.lokasiRak && <Pill label={b.lokasiRak} tone="info" icon="map-pin" />}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: isLow ? colors.danger : colors.text }}>
                          {b.stok} {b.satuan}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>
                          Min: {b.ambangMinimum} {b.satuan}
                        </Text>
                      </View>
                    </View>

                    {b.tanggalKadaluarsa && (
                      <View style={[styles.modalExpBar, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                        <Feather name="calendar" size={12} color={isExpiringSoon ? colors.warning : colors.textMuted} />
                        <Text style={{ fontSize: 11, color: isExpiringSoon ? colors.warning : colors.textMuted, fontWeight: isExpiringSoon ? '800' : '500' }}>
                          Kadaluarsa: {b.tanggalKadaluarsa} ({sisaHari !== null ? (sisaHari <= 0 ? 'Hari Ini!' : `${sisaHari} hari lagi`) : ''})
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <PrimaryButton
            label="Tutup"
            variant="secondary"
            onPress={() => {
              setActiveModal(null);
              setSearchQuery('');
            }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiCard: { flex: 1, gap: 4, padding: 12, borderWidth: 1.5 },
  kpiTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 0.5,
  },
  cctvStandbyBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  cctvIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalItemCard: {
    padding: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalExpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
