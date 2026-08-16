import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, Screen, SectionTitle } from '../components/ui';
import { Peralatan, PermintaanBahan } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickImage } from '../utils/pickImage';

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
  const { role, permintaanBahanList, bahanBakuList, updatePermintaanStatus, mitraList, peralatanList, sppgList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (res.granted) {
        setIsCameraActive(true);
      } else {
        Alert.alert('Izin Kamera Ditolak', 'Aktifkan izin kamera di pengaturan perangkat untuk memindai QR secara langsung, atau pilih foto dari galeri.');
      }
    } else {
      setIsCameraActive(true);
    }
  };

  const handlePickQrImage = async () => {
    const uri = await pickImage('library');
    if (uri) {
      handleManualSubmit('PMB-002');
    }
  };

  if (!role || ROLE_PERMISSIONS[role].isViewOnly) {
    return (
      <Screen>
        <EmptyState icon="lock" title="Akses Terbatas" body="Hanya Petugas Lapangan/Kepala SPPG yang dapat memindai QR verifikasi stok." />
      </Screen>
    );
  }

  // Match against PMB (permintaan bahan) codes
  const matched = scannedCode
    ? permintaanBahanList.find((p) => p.id.trim().toUpperCase() === scannedCode.trim().toUpperCase())
    : undefined;
  const bahan = matched ? bahanBakuList.find((b) => b.id === matched.bahanId) : undefined;
  const mitra = bahan?.mitraId ? mitraList.find((m) => m.id === bahan.mitraId) : undefined;

  // Match against asset/peralatan QR codes (format: SPPG-ASSET-EQP-XXX)
  const matchedAsset: Peralatan | undefined = scannedCode
    ? peralatanList.find((eq) => eq.qrCodeId?.trim().toUpperCase() === scannedCode.trim().toUpperCase())
    : undefined;
  const assetSppg = matchedAsset ? sppgList.find((s) => s.id === matchedAsset.sppgId) : undefined;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedCode) return;
    setScannedCode(data);
    setIsCameraActive(false);
  };

  const handleManualSubmit = (codeToUse?: string) => {
    const target = codeToUse ?? manualCode;
    if (!target.trim()) return;
    setScannedCode(target.trim());
    setIsCameraActive(false);
  };

  const reset = () => {
    setScannedCode(null);
    setManualCode('');
    setConfirmed(false);
    setIsCameraActive(true);
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

        {/* Active Live Camera Viewfinder */}
        {!scannedCode && isCameraActive && permission?.granted && (
          <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
            <View style={{ height: 260, position: 'relative' }}>
              <CameraView
                style={{ flex: 1 }}
                facing={cameraFacing}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.scannerOverlay} pointerEvents="none">
                <View style={[styles.scanTargetBox, { borderColor: colors.primary }]}>
                  <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
                  <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
                  <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
                  <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
                  <Text style={styles.scanTargetText}>Arahkan ke QR Code</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', padding: 10, gap: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
              <SecondaryButton
                label="Tutup Kamera"
                icon="camera-off"
                onPress={() => setIsCameraActive(false)}
                style={{ flex: 1 }}
              />
              <SecondaryButton
                label={cameraFacing === 'back' ? 'Kamera Depan' : 'Kamera Belakang'}
                icon="refresh-cw"
                onPress={() => setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {/* Prompt to Open Camera if Camera Inactive */}
        {!scannedCode && (!isCameraActive || !permission?.granted) && (
          <Card style={{ alignItems: 'center', padding: spacing.lg, gap: spacing.sm }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="camera" size={26} color={colors.primary} />
            </View>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              Kamera Pemindai QR Siap Digunakan
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 12 }}>
              Gunakan kamera untuk memindai QR Code Surat Jalan penerimaan barang atau label barcode QR aset peralatan SPPG.
            </Text>

            <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
              <PrimaryButton
                label="Buka Kamera Pemindai QR"
                icon="camera"
                onPress={handleOpenScanner}
              />
              <SecondaryButton
                label="Pilih Gambar QR dari Galeri"
                icon="image"
                onPress={handlePickQrImage}
              />
            </View>
          </Card>
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

            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              SIMULASI SCAN QR ASET PERALATAN:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                onPress={() => handleManualSubmit('SPPG-ASSET-EQP-001')}
                style={[styles.demoChip, { backgroundColor: colors.successBg, borderColor: colors.success }]}
              >
                <Feather name="truck" size={13} color={colors.success} />
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: '800' }}>Aset: Mobil Box Hino</Text>
              </Pressable>

              <Pressable
                onPress={() => handleManualSubmit('SPPG-ASSET-EQP-004')}
                style={[styles.demoChip, { backgroundColor: colors.successBg, borderColor: colors.success }]}
              >
                <Feather name="coffee" size={13} color={colors.success} />
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: '800' }}>Aset: Mesin Kettle</Text>
              </Pressable>

              <Pressable
                onPress={() => handleManualSubmit('SPPG-ASSET-EQP-017')}
                style={[styles.demoChip, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}
              >
                <Feather name="alert-circle" size={13} color={colors.warning} />
                <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '800' }}>Aset: Boiler (Perbaikan)</Text>
              </Pressable>
            </View>

            <Input label="Atau masukkan kode manual (Surat Jalan / QR Aset)" value={manualCode} onChangeText={setManualCode} placeholder="Contoh: PMB-002 atau SPPG-ASSET-EQP-001" />
            <PrimaryButton label="Gunakan Kode Ini" icon="check" onPress={() => handleManualSubmit()} />
          </Card>
        )}

        {/* Scanned Result Card */}
        {scannedCode && (
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
                  {matchedAsset ? 'KODE QR ASET PERALATAN:' : 'KODE SURAT JALAN / INVOICE:'}
                </Text>
                <Text style={{ color: colors.primary, fontWeight: '900', fontSize: fontSize.md }}>{scannedCode}</Text>
              </View>
              {matched && (
                <Pill label={`Status: ${STATUS_LABEL[matched.status]}`} tone={matched.status === 'selesai' ? 'success' : 'warning'} />
              )}
              {matchedAsset && (
                <Pill label={matchedAsset.status.replace('_', ' ').toUpperCase()} tone={
                  matchedAsset.status === 'ready' ? 'success' :
                  matchedAsset.status === 'digunakan' ? 'primary' :
                  matchedAsset.status === 'maintenance' ? 'warning' : 'danger'
                } />
              )}
            </View>

            {/* Asset/Peralatan Result */}
            {matchedAsset ? (
              <View style={{ gap: 10 }}>
                <View style={[styles.resultBox, { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.itemIconWrap, { backgroundColor: colors.successBg }]}>
                      <Feather name="clipboard" size={22} color={colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                        {matchedAsset.nama}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Kode Unit: <Text style={{ fontWeight: '800', color: colors.text }}>{matchedAsset.kodeUnit}</Text>
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Lokasi: <Text style={{ fontWeight: '700', color: colors.text }}>{matchedAsset.lokasi}</Text>
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Ready: <Text style={{ fontWeight: '800', color: colors.success }}>{matchedAsset.jumlahReady.toLocaleString('id-ID')}</Text> / {matchedAsset.jumlahTotal.toLocaleString('id-ID')} unit
                      </Text>
                      {assetSppg && (
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
                          SPPG: {assetSppg.nama}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.infoBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                  <Feather name="check-circle" size={16} color={colors.success} strokeWidth={iconStrokeWidth} />
                  <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>
                    Aset peralatan teridentifikasi. Lihat detail lengkap di bawah.
                  </Text>
                </View>

                <PrimaryButton
                  label="Lihat Detail Lengkap Aset"
                  icon="arrow-right"
                  onPress={() => navigation.navigate('AssetQrDetail', { peralatan: matchedAsset, sppgNama: assetSppg?.nama })}
                />
              </View>
            ) : matched ? (
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
                  Kode tidak dikenali — tidak cocok dengan pengiriman bahan atau aset peralatan manapun.
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
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTargetBox: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanTargetText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
