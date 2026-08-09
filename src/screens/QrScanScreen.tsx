import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
  const { role, permintaanBahanList, bahanBakuList, updatePermintaanStatus } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
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

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedCode) return; // freeze on first hit until user reset — avoids re-trigger spam
    setScannedCode(data);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    setScannedCode(manualCode.trim());
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
    Alert.alert('Penerimaan Dikonfirmasi', `Permintaan ${matched.id} ditandai selesai diterima.`);
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ padding: spacing.lg, gap: spacing.xs }}>
        <SectionTitle style={{ marginBottom: 0 }}>Pindai QR Verifikasi Stok</SectionTitle>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
          Arahkan kamera ke kode QR penerimaan bahan baku. Kode demo yang tersedia: {DEMO_CODE_HINT} — dapat juga diketik manual di
          bawah bila kamera tidak tersedia.
        </Text>
      </View>

      {!scannedCode && permission?.granted && (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        </View>
      )}

      {!permission?.granted && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState icon="camera-off" title="Kamera Tidak Tersedia" body="Izin kamera ditolak/belum diberikan. Masukkan kode secara manual di bawah." />
        </View>
      )}

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {!scannedCode && (
          <Card style={{ gap: spacing.sm }}>
            <Input label="Atau masukkan kode manual" value={manualCode} onChangeText={setManualCode} placeholder={`Contoh: ${DEMO_CODE_HINT}`} />
            <PrimaryButton label="Gunakan Kode Ini" icon="check" onPress={handleManualSubmit} />
          </Card>
        )}

        {scannedCode && (
          <Card style={{ gap: spacing.sm }}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Kode terpindai:</Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>{scannedCode}</Text>

            {matched ? (
              <>
                <Text style={{ color: colors.text, fontSize: fontSize.sm }}>
                  {bahan ? `${bahan.nama} — ${matched.jumlah} ${bahan.satuan}` : `${matched.jumlah} unit`}
                </Text>
                <Pill label={`Status: ${STATUS_LABEL[matched.status]}`} tone={matched.status === 'selesai' ? 'success' : 'warning'} />
                {matched.status !== 'selesai' && !confirmed ? (
                  <PrimaryButton label="Konfirmasi Penerimaan" icon="check-circle" onPress={confirmPenerimaan} />
                ) : (
                  <View style={[styles.infoBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                    <Feather name="check-circle" size={16} color={colors.success} strokeWidth={iconStrokeWidth} />
                    <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                      Permintaan ini sudah ditandai selesai diterima.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.infoBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}>
                <Feather name="alert-triangle" size={16} color={colors.danger} strokeWidth={iconStrokeWidth} />
                <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                  Kode tidak dikenali — tidak cocok dengan permintaan bahan manapun.
                </Text>
              </View>
            )}

            <PrimaryButton label="Pindai Ulang" icon="refresh-cw" variant="outline" onPress={reset} />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
});
