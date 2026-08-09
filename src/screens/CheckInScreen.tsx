import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, PrimaryButton, SectionTitle } from '../components/ui';
import { pickImage } from '../utils/pickImage';
import { getCurrentGeotag } from '../utils/geotag';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { ROLE_PERMISSIONS } from '../utils/scope';

export default function CheckInScreen({ navigation, route }: any) {
  const { role, currentUser, users, checkIn, checkOut, presensiList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const targetUserId = route?.params?.userId ?? currentUser?.id ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const existingPresensi = presensiList.find((p) => p.userId === targetUserId && p.tanggal === today);

  const defaultMode = existingPresensi?.jamMasuk && !existingPresensi?.jamKeluar ? 'out' : 'in';
  const mode = route?.params?.mode ?? defaultMode;

  const user = users.find((u) => u.id === targetUserId) ?? currentUser;
  const isCheckIn = mode === 'in';

  // User can only submit attendance for themselves
  const allowed = !!role && !ROLE_PERMISSIONS[role].isViewOnly && (currentUser?.id === targetUserId || role === 'KEPALA_SPPG');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [geotag, setGeotag] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!allowed) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="lock" title="Akses Terbatas" body="Anda tidak dapat melakukan presensi untuk staf ini." />
      </View>
    );
  }

  const takeSelfie = async () => {
    const uri = await pickImage('camera');
    if (uri) setPhotoUri(uri);
  };

  const fetchLocation = async () => {
    setLocating(true);
    const point = await getCurrentGeotag();
    setGeotag(point);
    setLocating(false);
  };

  const canConfirm = allowed && !!photoUri && !!geotag;

  const confirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    if (isCheckIn) {
      checkIn(targetUserId, photoUri, geotag);
    } else {
      checkOut(targetUserId, photoUri, geotag);
    }
    await addToOfflineQueue('presensi', { userId: targetUserId, mode, photoUri, geotag });
    setSubmitting(false);
    navigation.goBack();
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>{isCheckIn ? 'Check-in Kehadiran' : 'Check-out Kehadiran'}</SectionTitle>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: -8 }}>
        {user?.nama ?? targetUserId} • {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
      </Text>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>1. Foto Selfie</SectionTitle>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={[styles.photo, { borderRadius: radius.md }]} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <Feather name="camera" size={32} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
          </View>
        )}
        <PrimaryButton label={photoUri ? 'Ambil Ulang Foto' : 'Ambil Foto Selfie'} icon="camera" variant={photoUri ? 'secondary' : 'primary'} onPress={takeSelfie} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>2. Lokasi GPS</SectionTitle>
        {geotag ? (
          <View style={[styles.locBox, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
            <Feather name="map-pin" size={18} color={colors.success} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>
              {geotag.lat.toFixed(5)}, {geotag.lng.toFixed(5)}
            </Text>
          </View>
        ) : (
          <View style={[styles.locBox, { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}>
            {locating ? <ActivityIndicator color={colors.primary} /> : <Feather name="map-pin" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />}
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{locating ? 'Mengambil lokasi...' : 'Lokasi belum diambil'}</Text>
          </View>
        )}
        <PrimaryButton label={geotag ? 'Perbarui Lokasi' : 'Ambil Lokasi GPS'} icon="map-pin" variant={geotag ? 'secondary' : 'primary'} onPress={fetchLocation} loading={locating} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>3. Konfirmasi</SectionTitle>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
          {canConfirm ? 'Foto dan lokasi siap. Konfirmasi untuk menyimpan presensi.' : 'Lengkapi foto selfie dan lokasi GPS terlebih dahulu.'}
        </Text>
        <PrimaryButton
          label={isCheckIn ? 'Konfirmasi Check-in' : 'Konfirmasi Check-out'}
          icon="check-square"
          onPress={confirm}
          disabled={!canConfirm}
          loading={submitting}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  photo: { width: '100%', height: 200 },
  photoPlaceholder: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  locBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
});
