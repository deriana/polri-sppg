import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeBahanBaku } from '../utils/scope';
import CctvPlayer from '../components/CctvPlayer';
import { CCTV_FEEDS } from './CctvMonitorScreen';
import { useLocalVideoUri } from '../utils/localVideoAsset';

const SUHU_AMAN_MAX = 8; // sama dengan ambang di AppContext — di atas ini dianggap tidak aman
const EXPIRY_WARNING_DAYS = 3;

function daysUntil(tanggal: string): number {
  const d = new Date(tanggal);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GudangKondisiScreen() {
  const { currentSppg, foodSafetyList, bahanBakuList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const sensorSuhu = foodSafetyList.find((f) => f.sppgId === currentSppg?.id && f.sumberSuhu === 'sensor_iot');
  const isSuhuAman = sensorSuhu ? sensorSuhu.suhuPenyimpanan <= SUHU_AMAN_MAX : true;

  const bahanInScope = useMemo(() => scopeBahanBaku(sppgInScope, bahanBakuList), [sppgInScope, bahanBakuList]);
  const stokMenipis = bahanInScope.filter((b) => b.stok < b.ambangMinimum);
  const akanKadaluarsa = bahanInScope.filter((b) => b.tanggalKadaluarsa && daysUntil(b.tanggalKadaluarsa) <= EXPIRY_WARNING_DAYS);

  const gudangFeed = CCTV_FEEDS.find((f) => f.zonaId === 'z1');
  const videoUri = useLocalVideoUri(require('../../assets/sppg.mp4'));

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="info" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
          Panel Kondisi Gudang — suhu cold storage live, ringkasan stok, dan CCTV area gudang dalam satu layar.
        </Text>
      </View>

      <SectionTitle>Suhu Cold Storage</SectionTitle>
      <Card style={{ gap: spacing.xs }}>
        {sensorSuhu ? (
          <>
            <View style={styles.rowTop}>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Sensor IoT • Update Live</Text>
              <Pill label={isSuhuAman ? 'Aman' : 'Suhu Tidak Normal'} tone={isSuhuAman ? 'success' : 'danger'} />
            </View>
            <Text style={{ color: isSuhuAman ? colors.success : colors.danger, fontWeight: '800', fontSize: 32 }}>
              {sensorSuhu.suhuPenyimpanan.toFixed(1)}°C
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Ambang aman maksimal {SUHU_AMAN_MAX}°C</Text>
          </>
        ) : (
          <EmptyState icon="thermometer" title="Sensor Belum Terpasang" body="Belum ada data sensor suhu IoT untuk SPPG ini." />
        )}
      </Card>

      <SectionTitle>Kondisi Stok Gudang</SectionTitle>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Card style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Total Bahan</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.lg }}>{bahanInScope.length}</Text>
        </Card>
        <Card style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Stok Menipis</Text>
          <Text style={{ color: stokMenipis.length > 0 ? colors.danger : colors.text, fontWeight: '800', fontSize: fontSize.lg }}>
            {stokMenipis.length}
          </Text>
        </Card>
        <Card style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Mau Kadaluarsa</Text>
          <Text style={{ color: akanKadaluarsa.length > 0 ? colors.warning : colors.text, fontWeight: '800', fontSize: fontSize.lg }}>
            {akanKadaluarsa.length}
          </Text>
        </Card>
      </View>

      {stokMenipis.length > 0 && (
        <Card style={{ gap: spacing.xs }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.xs }}>Bahan Stok Menipis:</Text>
          {stokMenipis.map((b) => (
            <Text key={b.id} style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
              • {b.nama} — sisa {b.stok} {b.satuan} (ambang {b.ambangMinimum})
            </Text>
          ))}
        </Card>
      )}

      <SectionTitle>CCTV Area Gudang</SectionTitle>
      {gudangFeed ? (
        <CctvPlayer videoUri={videoUri} label={gudangFeed.label} height={220} />
      ) : (
        <EmptyState icon="video-off" title="Kamera Tidak Tersedia" body="Belum ada feed CCTV untuk area gudang." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
