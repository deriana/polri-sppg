import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { Card, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { Peralatan, PeralatanStatus } from '../types';

// Kategori label map — mirrors PeralatanScreen's category labels
const KATEGORI_LABEL: Record<string, string> = {
  kendaraan: 'Mobil & Motor Box',
  ompreng_tray: 'Ompreng Stainless',
  kontainer_suhu: 'Thermal Container',
  alat_masak: 'Kettle & Kompor',
  penyimpanan: 'Penyimpanan Bahan',
  sealing_packaging: 'Sealer & Packing',
  sterilisasi: 'Sterilisasi Alat',
  kebersihan_apd: 'Kebersihan & APD',
  ukur_qc: 'Alat Ukur & QC',
  k3_darurat: 'K3 & Darurat',
};

const getEquipmentBadge = (eq: Peralatan) => {
  if (eq.status === 'rusak') {
    return { label: 'RUSAK TOTAL', tone: 'danger' as const };
  }
  if (eq.status === 'perlu_perbaikan') {
    return { label: 'PERLU PERBAIKAN', tone: 'warning' as const };
  }
  if (eq.status === 'maintenance') {
    return { label: 'DALAM MAINTENANCE', tone: 'warning' as const };
  }
  if (eq.jumlahBermasalah > 0) {
    return {
      label: `⚠️ ${eq.jumlahBermasalah} BERMASALAH (${eq.jumlahReady}/${eq.jumlahTotal} READY)`,
      tone: 'warning' as const,
    };
  }
  if (eq.status === 'digunakan') {
    return { label: 'SEDANG DIGUNAKAN', tone: 'primary' as const };
  }
  return { label: 'SIAP PAKAI (READY)', tone: 'success' as const };
};

const statusTone = (st: PeralatanStatus): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
  switch (st) {
    case 'ready':
      return 'success';
    case 'digunakan':
      return 'primary';
    case 'maintenance':
      return 'warning';
    case 'perlu_perbaikan':
    case 'rusak':
      return 'danger';
    default:
      return 'neutral';
  }
};

interface AssetQrDetailScreenProps {
  route: { params: { peralatan: Peralatan; sppgNama?: string } };
}

export default function AssetQrDetailScreen({ route }: AssetQrDetailScreenProps) {
  const { peralatan: eq, sppgNama } = route.params;
  const { colors, fontSize, radius, spacing, iconStrokeWidth } = useTheme();
  const qrSvgRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleSharePng = async () => {
    if (!qrSvgRef.current) {
      Alert.alert('Gagal', 'Komponen QR belum siap.');
      return;
    }

    setIsSharing(true);
    try {
      qrSvgRef.current.toDataURL(async (base64Data: string) => {
        try {
          if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${base64Data}`;
            link.download = `QR_${eq.qrCodeId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Alert.alert('Berhasil', 'QR Code berhasil diunduh sebagai file PNG.');
          } else {
            const fileName = `QR_${eq.qrCodeId}.png`;
            const file = new File(Paths.cache, fileName);
            if (file.exists) {
              file.delete();
            }
            file.create();
            file.write(base64Data, { encoding: 'base64' });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(file.uri, {
                mimeType: 'image/png',
                dialogTitle: `Bagikan QR Code ${eq.nama}`,
                UTI: 'public.png',
              });
            } else {
              Alert.alert('Sharing Tidak Tersedia', 'Fitur berbagi tidak didukung pada perangkat ini.');
            }
          }
        } catch (error: any) {
          Alert.alert('Gagal Membagikan', error?.message || 'Terjadi kesalahan saat memproses gambar QR.');
        } finally {
          setIsSharing(false);
        }
      });
    } catch (err: any) {
      setIsSharing(false);
      Alert.alert('Gagal', err?.message || 'Tidak dapat membaca data QR.');
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.textInverse }}>
              Detail Aset Peralatan
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight }}>
              Informasi lengkap peralatan SPPG berdasarkan QR Code
            </Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Feather name="clipboard" size={24} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
          </View>
        </View>
      </Card>

      {/* QR Code Display & Share as PNG */}
      <Card style={{ alignItems: 'center', gap: spacing.md }}>
        <View style={[styles.qrBox, { borderRadius: radius.md, borderColor: colors.border }]}>
          <QRCode
            value={eq.qrCodeId}
            size={180}
            ecl="M"
            quietZone={10}
            color="#000000"
            backgroundColor="#FFFFFF"
            getRef={(c) => (qrSvgRef.current = c)}
          />
        </View>

        <View style={[styles.codeBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Feather name="maximize" size={13} color={colors.primary} strokeWidth={iconStrokeWidth} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
            {eq.qrCodeId}
          </Text>
        </View>

        <PrimaryButton
          label={isSharing ? 'Memproses PNG...' : 'Bagikan QR sebagai PNG'}
          icon={isSharing ? undefined : 'share-2'}
          onPress={handleSharePng}
          disabled={isSharing}
          style={{ width: '100%' }}
        />
      </Card>

      {/* Equipment Photo */}
      {eq.fotoPeralatan && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Image source={{ uri: eq.fotoPeralatan }} style={styles.eqPhoto} resizeMode="cover" />
        </Card>
      )}

      {/* Equipment Identity */}
      <SectionTitle>Identitas Peralatan</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text, flex: 1 }}>{eq.nama}</Text>
          <Pill label={getEquipmentBadge(eq).label} tone={getEquipmentBadge(eq).tone} />
        </View>

        <View style={[styles.detailGrid, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textMuted, fontSize: fontSize.xs }]}>ID Aset</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSize.sm }]}>{eq.id}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textMuted, fontSize: fontSize.xs }]}>Kode QR</Text>
              <Text style={[styles.detailValue, { color: colors.primary, fontSize: fontSize.sm }]}>{eq.qrCodeId}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textMuted, fontSize: fontSize.xs }]}>Kode Unit</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSize.sm }]}>{eq.kodeUnit}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textMuted, fontSize: fontSize.xs }]}>Kategori</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSize.sm }]}>
                {KATEGORI_LABEL[eq.kategori] ?? eq.kategori}
              </Text>
            </View>
          </View>
        </View>

        {sppgNama && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="home" size={13} color={colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
              SPPG: {sppgNama} ({eq.sppgId})
            </Text>
          </View>
        )}
      </Card>

      {/* Operational Stats */}
      <SectionTitle>Status Operasional</SectionTitle>
      <Card style={{ gap: spacing.xs }}>
        <View style={[styles.statRow, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          <View style={styles.statCol}>
            <Text style={{ color: colors.text, fontSize: fontSize.xl, fontWeight: '800' }}>
              {eq.jumlahTotal.toLocaleString('id-ID')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Total Unit</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={{ color: colors.success, fontSize: fontSize.xl, fontWeight: '800' }}>
              {eq.jumlahReady.toLocaleString('id-ID')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Ready</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={{ color: eq.jumlahBermasalah > 0 ? colors.danger : colors.success, fontSize: fontSize.xl, fontWeight: '800' }}>
              {eq.jumlahBermasalah}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Bermasalah</Text>
          </View>
        </View>
      </Card>

      {/* Location & Condition */}
      <SectionTitle>Lokasi & Kondisi</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
            <Feather name="map-pin" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Lokasi</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{eq.lokasi}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
            <Feather name="file-text" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Catatan Kondisi</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{eq.catatanKondisi}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
            <Feather name="calendar" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Terakhir Diperiksa</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{eq.terakhirDiperiksa}</Text>
          </View>
        </View>

        {(eq.kategori === 'kontainer_suhu' || eq.kategori === 'penyimpanan') && (
          <View style={[styles.tempBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
            <Feather name="thermometer" size={15} color={colors.success} strokeWidth={iconStrokeWidth} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.success, flex: 1 }}>
              Uji Holding Suhu: Min 60°C saat pengiriman
            </Text>
          </View>
        )}
      </Card>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  eqPhoto: { width: '100%', height: 200, borderRadius: 8 },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailGrid: { padding: 12, gap: 10 },
  detailRow: { flexDirection: 'row', gap: 12 },
  detailCol: { flex: 1, gap: 2 },
  detailLabel: { fontWeight: '600' },
  detailValue: { fontWeight: '800' },
  statRow: { flexDirection: 'row', padding: 14, alignItems: 'center', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', gap: 2 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tempBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginTop: 4 },
});
