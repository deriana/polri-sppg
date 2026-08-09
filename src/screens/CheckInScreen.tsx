import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { pickImage } from '../utils/pickImage';
import { getCurrentGeotag } from '../utils/geotag';
import { addToOfflineQueue } from '../utils/offlineQueue';
import { ROLE_PERMISSIONS } from '../utils/scope';

function calculateDistanceMeter(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function CheckInScreen({ navigation, route }: any) {
  const { role, currentUser, users, checkIn, checkOut, presensiList, currentSppg } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const targetUserId = route?.params?.userId ?? currentUser?.id ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const existingPresensi = presensiList.find((p) => p.userId === targetUserId && p.tanggal === today);

  const defaultMode = existingPresensi?.jamMasuk && !existingPresensi?.jamKeluar ? 'out' : 'in';
  const mode = route?.params?.mode ?? defaultMode;

  const user = users.find((u) => u.id === targetUserId) ?? currentUser;
  const isCheckIn = mode === 'in';

  // Default SPPG coordinates (Bandung / Jakarta)
  const sppgLat = -6.9175;
  const sppgLng = 107.6191;

  // User can only submit attendance for themselves
  const allowed = !!role && !ROLE_PERMISSIONS[role].isViewOnly && (currentUser?.id === targetUserId || role === 'KEPALA_SPPG');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [geotag, setGeotag] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect hardware GPS location on component mount without needing button clicks
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLocating(true);
      const point = await getCurrentGeotag();
      if (mounted && point) {
        setGeotag(point);
      }
      if (mounted) setLocating(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  const distanceMeters = geotag ? calculateDistanceMeter(geotag.lat, geotag.lng, sppgLat, sppgLng) : 0;
  const isGeofenceValid = distanceMeters <= 100;

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

      {/* Step 1: Selfie Photo */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>1. Foto Selfie Presensi</SectionTitle>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={[styles.photo, { borderRadius: radius.md }]} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
            <Feather name="camera" size={32} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
          </View>
        )}
        <PrimaryButton label={photoUri ? 'Ambil Ulang Foto' : 'Ambil Foto Selfie'} icon="camera" variant={photoUri ? 'secondary' : 'primary'} onPress={takeSelfie} />
      </Card>

      {/* Step 2: OpenStreetMap & Geofence GPS */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>2. Lokasi GPS & Geofence Dapur</SectionTitle>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: -4 }}>
          {currentSppg?.nama ?? 'SPPG Dapur Utama'} • Radius Geofence Maksimal 100m
        </Text>

        {geotag ? (
          <View style={{ gap: spacing.xs }}>
            {/* OpenStreetMap Live Interactive Map Container */}
            <View style={{ width: '100%', height: 170, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>body,html,#map{height:100%;margin:0;padding:0;}</style>
                    </head>
                    <body>
                      <iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"
                        src="https://yandex.com/map-widget/v1/?ll=${geotag.lng},${geotag.lat}&z=17&pt=${sppgLng},${sppgLat},pm2rdm~${geotag.lng},${geotag.lat},pm2blm">
                      </iframe>
                    </body>
                    </html>
                  `,
                }}
                style={{ flex: 1 }}
                scrollEnabled={false}
              />
            </View>

            {/* GPS Detail & Geofence Validation Pill */}
            <View style={{ backgroundColor: isGeofenceValid ? colors.successBg : colors.warningBg, borderRadius: radius.md, padding: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="map-pin" size={16} color={isGeofenceValid ? colors.success : colors.warning} />
                  <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '800' }}>
                    {geotag.lat.toFixed(5)}, {geotag.lng.toFixed(5)}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  Jarak: <Text style={{ fontWeight: '800', color: colors.text }}>{distanceMeters}m</Text>
                </Text>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: isGeofenceValid ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)', paddingTop: 6 }}>
                <Pill
                  tone={isGeofenceValid ? 'success' : 'warning'}
                  label={isGeofenceValid ? 'RADIUS GEOFENCE 100M VALID' : 'DILUAR RADIUS 100M (PERINGATAN)'}
                  icon={isGeofenceValid ? 'check-circle' : 'alert-circle'}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.locBox, { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }]}>
            {locating ? <ActivityIndicator color={colors.primary} /> : <Feather name="map-pin" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />}
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{locating ? 'Mendeteksi titik koordinat GPS...' : 'Lokasi GPS belum diambil'}</Text>
          </View>
        )}

        <PrimaryButton label={geotag ? 'Perbarui Lokasi GPS' : 'Ambil Lokasi GPS'} icon="map-pin" variant={geotag ? 'secondary' : 'primary'} onPress={fetchLocation} loading={locating} />
      </Card>

      {/* Step 3: Confirmation */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>3. Konfirmasi Presensi</SectionTitle>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
          {canConfirm ? 'Foto selfie dan titik lokasi GPS sudah valid. Klik tombol konfirmasi untuk menyimpan.' : 'Lengkapi foto selfie dan lokasi GPS terlebih dahulu.'}
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
  locContainer: { gap: 8 },
});
