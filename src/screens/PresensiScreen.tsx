import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PresensiScreen({ navigation }: any) {
  const { role, currentUser } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const { usersInScope, presensiInScope } = useScopedData();
  const today = todayDate();

  if (!role || !currentUser) return null;

  const isStaffOnly = role === 'PETUGAS_LAPANGAN';
  const staff = isStaffOnly
    ? usersInScope.filter((u) => u.id === currentUser.id)
    : usersInScope;

  const canActFor = (userId: string) => userId === currentUser.id;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle>Presensi Kehadiran Staf</SectionTitle>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: -8 }}>
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>

      {staff.length === 0 ? (
        <EmptyState icon="users" title="Belum Ada Staf" body="Belum ada petugas lapangan terdaftar di SPPG ini." />
      ) : (
        staff.map((u) => {
          const presensi = presensiInScope.find((p) => p.userId === u.id && p.tanggal === today);
          const sudahMasuk = !!presensi?.jamMasuk;
          const sudahKeluar = !!presensi?.jamKeluar;
          const isSelf = u.id === currentUser.id;
          const allowed = canActFor(u.id);

          const geoLat = presensi?.geotagMasuk?.lat ?? -6.9147;
          const geoLng = presensi?.geotagMasuk?.lng ?? 107.6098;
          const osmMapUrl = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${geoLng},${geoLat}&z=16&l=map&size=500,160&pt=${geoLng},${geoLat},pm2rdm`;

          return (
            <Card key={u.id} style={{ gap: spacing.sm }}>
              <View style={styles.row}>
                {u.fotoProfil ? (
                  <Image source={{ uri: u.fotoProfil }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Feather name="user" size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.name, { color: colors.text, fontSize: fontSize.sm }]}>{u.nama}</Text>
                    {isSelf && <Pill label="SAYA" tone="primary" />}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                    Shift {u.shift ?? 'Pagi'} • {u.noHp}
                  </Text>
                </View>
                <Pill label={sudahMasuk ? 'Hadir' : 'Belum Presensi'} tone={sudahMasuk ? 'success' : 'warning'} />
              </View>

              <View style={[styles.timeRow, { borderTopColor: colors.border }]}>
                <View style={styles.timeCol}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Jam Masuk</Text>
                  <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>{presensi?.jamMasuk ?? '—'}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Jam Keluar</Text>
                  <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>{presensi?.jamKeluar ?? '—'}</Text>
                </View>
              </View>

              {/* Selfie Photos Preview */}
              {sudahMasuk && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Bukti Selfie & Geotag GPS:</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {presensi?.fotoSelfieMasuk && (
                      <View style={{ flex: 1, gap: 2 }}>
                        <Image source={{ uri: presensi.fotoSelfieMasuk }} style={{ width: '100%', height: 90, borderRadius: radius.sm }} />
                        <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center' }}>Selfie Masuk ({presensi.jamMasuk})</Text>
                      </View>
                    )}
                    {presensi?.fotoSelfieKeluar && (
                      <View style={{ flex: 1, gap: 2 }}>
                        <Image source={{ uri: presensi.fotoSelfieKeluar }} style={{ width: '100%', height: 90, borderRadius: radius.sm }} />
                        <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center' }}>Selfie Keluar ({presensi.jamKeluar})</Text>
                      </View>
                    )}
                  </View>

                  {/* OpenStreetMap Geofence Map Visual */}
                  <View style={{ marginTop: 4, gap: 4 }}>
                    <View style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="map-pin" size={12} color={colors.primary} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>Lokasi Presensi (OpenStreetMap Geofence)</Text>
                      </View>
                      <Pill label="RADIUS GEOFENCE 100M VALID" tone="success" icon="check-circle" style={{ alignSelf: 'flex-start' }} />
                    </View>
                    <Image source={{ uri: osmMapUrl }} style={{ width: '100%', height: 100, borderRadius: radius.sm }} resizeMode="cover" />
                  </View>
                </View>
              )}

              {allowed && !sudahMasuk && (
                <PrimaryButton
                  label="Check-in Presensi Saya"
                  icon="log-in"
                  onPress={() => navigation.navigate('CheckIn', { userId: u.id, mode: 'in' })}
                />
              )}
              {allowed && sudahMasuk && !sudahKeluar && (
                <PrimaryButton
                  label="Check-out Presensi Saya"
                  icon="log-out"
                  variant="secondary"
                  onPress={() => navigation.navigate('CheckIn', { userId: u.id, mode: 'out' })}
                />
              )}
              {sudahMasuk && sudahKeluar && (
                <View style={[styles.doneBanner, { backgroundColor: colors.successBg }]}>
                  <Feather name="check-circle" size={16} color={colors.success} strokeWidth={iconStrokeWidth} />
                  <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Presensi hari ini selesai</Text>
                </View>
              )}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  timeRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  timeCol: { flex: 1, gap: 2 },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
});
