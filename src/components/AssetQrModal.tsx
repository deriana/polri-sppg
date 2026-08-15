import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
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
import { Card, Pill, PrimaryButton, SecondaryButton } from './ui';
import { Peralatan, PeralatanStatus } from '../types';

interface AssetQrModalProps {
  visible: boolean;
  onClose: () => void;
  peralatan: Peralatan | null;
  sppgNama?: string;
  onViewDetail?: () => void;
}

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

export default function AssetQrModal({
  visible,
  onClose,
  peralatan,
  sppgNama,
  onViewDetail,
}: AssetQrModalProps) {
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();
  const qrSvgRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  if (!peralatan) return null;

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
            // Web: Trigger browser download via data URI
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${base64Data}`;
            link.download = `QR_${peralatan.qrCodeId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Alert.alert('Berhasil', 'QR Code berhasil diunduh sebagai file PNG.');
          } else {
            // Mobile (iOS/Android): Save to cache directory and trigger native Share dialog
            const fileName = `QR_${peralatan.qrCodeId}.png`;
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
                dialogTitle: `Bagikan QR Code ${peralatan.nama}`,
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Card style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
                QR Code Aset Peralatan
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                Pindai untuk inspeksi atau bagikan file PNG
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.background, borderRadius: radius.pill }]}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            {/* QR Visual */}
            <View style={styles.qrWrapper}>
              <View style={[styles.qrBox, { borderRadius: radius.lg, borderColor: colors.border }]}>
                <QRCode
                  value={peralatan.qrCodeId}
                  size={190}
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
                  {peralatan.qrCodeId}
                </Text>
              </View>
            </View>

            {/* Asset Metadata */}
            <View style={[styles.metaBox, { backgroundColor: colors.background, borderRadius: radius.md }]}>
              <View style={styles.rowBetween}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text, flex: 1 }}>
                  {peralatan.nama}
                </Text>
                <Pill label={peralatan.status.replace('_', ' ').toUpperCase()} tone={statusTone(peralatan.status)} />
              </View>

              <View style={{ gap: 4, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="tag" size={12} color={colors.textMuted} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    Kode Unit: <Text style={{ fontWeight: '700', color: colors.text }}>{peralatan.kodeUnit}</Text>
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="map-pin" size={12} color={colors.textMuted} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    Lokasi: <Text style={{ fontWeight: '700', color: colors.text }}>{peralatan.lokasi}</Text>
                  </Text>
                </View>

                {sppgNama && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="home" size={12} color={colors.primary} />
                    <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
                      SPPG: {sppgNama}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
              <PrimaryButton
                label={isSharing ? 'Memproses PNG...' : 'Bagikan QR sebagai PNG'}
                icon={isSharing ? undefined : 'share-2'}
                onPress={handleSharePng}
                disabled={isSharing}
              />

              {onViewDetail && (
                <SecondaryButton
                  label="Buka Layar Detail Aset Penuh"
                  icon="external-link"
                  onPress={() => {
                    onClose();
                    onViewDetail();
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
  metaBox: {
    padding: 12,
    gap: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
