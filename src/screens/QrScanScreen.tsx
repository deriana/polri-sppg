import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, Screen, SectionTitle } from '../components/ui';
import { PermintaanBahan } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';

const STATUS_LABEL: Record<PermintaanBahan['status'], string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
};

// Demo helper — a seeded PermintaanBahan id a demo user can type or scan a
// printed QR of, since there's no real inventory QR registry/backend.
const DEMO_CODE_HINT = 'PMB-002';

export default function QrScanScreen() {
  const { role, permintaanBahanList, bahanBakuList, updatePermintaanStatus, mitraList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    } else if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert('Izin Kamera Ditolak', 'Aktifkan izin kamera di pengaturan perangkat untuk memindai QR, atau masukkan kode secara manual.');
    }
  }, [permission?.granted, permission?.canAskAgain]);

  if (!role || ROLE_PERMISSIONS[role].isViewOnly) {
    return (
      <Screen>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Petugas Lapangan/Kepala SPPG yang dapat memindai QR verifikasi stok." />
      </Screen>
    );
  }

  const matched = scannedCode
    ? permintaanBahanList.find((p) => p.id.trim().toUpperCase() === scannedCode.trim().toUpperCase())
    : undefined;
  const bahan = matched ? bahanBakuList.find((b) => b.id === matched.bahanId) : undefined;
  const mitra = bahan?.mitraId ? mitraList.find((m) => m.id === bahan.mitraId) : undefined;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedCode) return;
    setScannedCode(data);
  };

  const handleManualSubmit = (codeToUse?: string) => {
    const target = codeToUse ?? manualCode;
    if (!target.trim()) return;
    setScannedCode(target.trim());
  };

  const reset = () => {
    setScannedCode(null);
    setManualCode('');
    setConfirmed(false);
  };

  const confirmPenerimaan = () => {
    if (!matched) return;
    updatePermintaanStatus(matched.id, 'selesai');
    setConfirmed(true);
    Alert.alert(
      'Penerimaan Bahan Dikonfirmasi',
      `Surat jalan ${matched.id} (${bahan?.nama ?? 'Bahan'}) sejumlah ${matched.jumlah} ${bahan?.satuan ?? ''} berhasil diterima dan dicatat ke inventaris gudang.`,
    );
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 110 }}>
        <View style={{ gap: spacing.xs }}>
          <SectionTitle style={{ marginBottom: 0 }}>Pindai QR Penerimaan Barang</SectionTitle>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
            Arahkan kamera ke QR Surat Jalan atau Invoice pengiriman bahan baku dari supplier/pusat BGN.
          </Text>
        </View>

        {/* Camera View */}
        {!scannedCode && permission?.granted && (
          <View style={{ height: 260, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          </View>
        )}

        {!permission?.granted && !scannedCode && (
          <EmptyState icon="camera-off" title="Kamera Tidak Aktif" body="Izin kamera belum aktif. Anda dapat menggunakan tombol simulasi cepat di bawah." />
        )}

        {/* Manual Input & Simulation Shortcuts */}
        {!scannedCode && (
          <Card style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
              PILIHAN SIMULASI UJI QR CEPAT:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                onPress={() => handleManualSubmit('PMB-002')}
                style={[styles.demoChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Feather name="zap" size={13} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Scan QR PMB-002 (Ayam)</Text>
              </Pressable>

              <Pressable
                onPress={() => handleManualSubmit('PMB-001')}
                style={[styles.demoChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Feather name="zap" size={13} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Scan QR PMB-001 (Beras)</Text>
              </Pressable>
            </View>

            <Input label="Atau masukkan nomor surat jalan manual" value={manualCode} onChangeText={setManualCode} placeholder={`Contoh: ${DEMO_CODE_HINT}`} />
            <PrimaryButton label="Gunakan Kode Ini" icon="check" onPress={() => handleManualSubmit()} />
          </Card>
        )}

        {/* Scanned Result Card */}
        {scannedCode && (
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>KODE SURAT JALAN / INVOICE:</Text>
                <Text style={{ color: colors.primary, fontWeight: '900', fontSize: fontSize.md }}>{scannedCode}</Text>
              </View>
              {matched && (
                <Pill label={`Status: ${STATUS_LABEL[matched.status]}`} tone={matched.status === 'selesai' ? 'success' : 'warning'} />
              )}
            </View>

            {matched ? (
              <View style={{ gap: 10 }}>
                <View style={[styles.resultBox, { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.primaryLight }]}>
                      <Feather name="package" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                        {bahan ? bahan.nama : 'Bahan Baku Makanan'}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Jumlah Kirim: <Text style={{ fontWeight: '800', color: colors.text }}>{matched.jumlah} {bahan?.satuan ?? 'unit'}</Text>
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Pemasok: {mitra ? mitra.nama : 'Gudang Pusat BGN'}
                      </Text>
                    </View>
                  </View>
                </View>

                {matched.status !== 'selesai' && !confirmed ? (
                  <PrimaryButton label="Konfirmasi Penerimaan Barang Masuk" icon="check-circle" onPress={confirmPenerimaan} />
                ) : (
                  <View style={[styles.infoBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                    <Feather name="check-circle" size={16} color={colors.success} strokeWidth={iconStrokeWidth} />
                    <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                      Surat jalan ini telah diverifikasi & stok masuk ke gudang.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.infoBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}>
                <Feather name="alert-triangle" size={16} color={colors.danger} strokeWidth={iconStrokeWidth} />
                <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                  Kode tidak dikenali — tidak cocok dengan pengiriman bahan manapun.
                </Text>
              </View>
            )}

            <PrimaryButton label="Pindai Ulang Dokumen Lain" icon="refresh-cw" variant="outline" onPress={reset} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  resultBox: {
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
