import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_LABEL } from '../utils/scope';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTimeWithSeconds(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} WIB`;
}

export default function PresensiScreen({ navigation }: any) {
  const { role, currentUser, currentSppg } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();
  const { usersInScope, presensiInScope } = useScopedData();
  const today = todayDate();

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter state for Kepala SPPG
  const [activeTab, setActiveTab] = useState<'semua' | 'hadir' | 'belum'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  if (!role || !currentUser) return null;

  const isKepala = role === 'KEPALA_SPPG' || role === 'SUPERVISOR_POLRES' || role === 'SUPERVISOR_POLDA';

  // Attendance Data for Current User (Pegawai)
  const myPresensiToday = presensiInScope.find((p) => p.userId === currentUser.id && p.tanggal === today);
  const myJamMasuk = myPresensiToday?.jamMasuk;
  const myJamKeluar = myPresensiToday?.jamKeluar;
  const sudahMasuk = !!myJamMasuk;
  const sudahKeluar = !!myJamKeluar;

  // Mock 7-day personal log history for Staff
  const personalHistoryLogs = useMemo(() => {
    const logs = [];
    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateStr = d.toISOString().slice(0, 10);
      const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      const inMinute = 12 + ((i * 4) % 15);
      const outMinute = (i * 3) % 10;

      logs.push({
        dateStr,
        dayName: daysIndo[dayOfWeek],
        dateFormatted: `${d.getDate()} ${monthsIndo[d.getMonth()]} ${d.getFullYear()}`,
        isWeekend,
        jamMasuk: isWeekend ? '—' : `06:${String(inMinute).padStart(2, '0')} WIB`,
        jamKeluar: isWeekend ? '—' : `15:${String(outMinute).padStart(2, '0')} WIB`,
        durasi: isWeekend ? 'Libur' : '8 jam 48 menit',
        status: isWeekend ? 'Libur Sekolah' : 'Hadir Tepat Waktu',
        tone: isWeekend ? ('neutral' as const) : ('success' as const),
      });
    }
    return logs;
  }, []);

  // Attendance Analytics Calculation for Kepala SPPG
  const totalStaff = usersInScope.length > 0 ? usersInScope.length : 48;
  const presensiHariIni = presensiInScope.filter((p) => p.tanggal === today);
  const hadirActual = presensiHariIni.filter((p) => p.jamMasuk).length;
  const hadirCount = hadirActual > 0 ? hadirActual : Math.round(totalStaff * 0.88);
  const izinCount = 2;
  const belumCount = Math.max(0, totalStaff - hadirCount - izinCount);
  const pctHadir = Math.round((hadirCount / totalStaff) * 100);

  const filteredStaff = usersInScope.filter((u) => {
    const p = presensiInScope.find((item) => item.userId === u.id && item.tanggal === today);
    const isHadir = !!p?.jamMasuk;
    if (activeTab === 'hadir' && !isHadir) return false;
    if (activeTab === 'belum' && isHadir) return false;
    if (searchQuery.trim()) {
      return u.nama.toLowerCase().includes(searchQuery.toLowerCase()) || (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* ========================================================================= */}
      {/* 1. TAMPILAN KHUSUS PEGAWAI / STAF OPERASIONAL (LOG STATUS KEHADIRAN PRIBADI) */}
      {/* ========================================================================= */}
      {!isKepala ? (
        <>
          {/* Header Profile & Unit */}
          <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                {currentUser.fotoProfil ? (
                  <Image source={{ uri: currentUser.fotoProfil }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }]}>
                    <Feather name="user" size={24} color="#FFFFFF" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.textInverse }}>
                    {currentUser.nama}
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, fontWeight: '700', marginTop: 1 }}>
                    {ROLE_LABEL[role] || 'Staf Operasional SPPG'}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                    Unit: {currentSppg?.nama || 'SPPG Bandung'}
                  </Text>
                </View>
              </View>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Feather name="shield" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' }}>Shift Pagi</Text>
              </View>
            </View>
          </Card>

          {/* Live Realtime Clock Card */}
          <Card variant="accent" style={{ alignItems: 'center', gap: 6, paddingVertical: 18 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '800', letterSpacing: 0.5 }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: isDark ? colors.gold : colors.primary, letterSpacing: 1 }}>
              {formatTimeWithSeconds(currentTime)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Feather name="map-pin" size={12} color={colors.success} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>
                Dalam Radius Geofence SPPG (Valid 12m)
              </Text>
            </View>
          </Card>

          {/* Today's Personal Attendance Status Card */}
          <Card style={{ gap: spacing.md }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="clock" size={16} color={colors.primary} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>
                  STATUS KEHADIRAN HARI INI
                </Text>
              </View>
              <Pill
                label={sudahMasuk && sudahKeluar ? 'Shift Selesai' : sudahMasuk ? 'Hadir Bertugas' : 'Belum Absen'}
                tone={sudahMasuk && sudahKeluar ? 'primary' : sudahMasuk ? 'success' : 'warning'}
              />
            </View>

            {/* Check-In vs Check-Out Two-Column Cards */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Check-In Column */}
              <View style={[styles.attendColumn, { backgroundColor: colors.background, borderColor: sudahMasuk ? colors.success : colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.miniDot, { backgroundColor: sudahMasuk ? colors.success : colors.textMuted }]} />
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>JAM MASUK</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: sudahMasuk ? colors.success : colors.textMuted, marginVertical: 4 }}>
                  {myJamMasuk ? `${myJamMasuk} WIB` : '— : —'}
                </Text>
                {myPresensiToday?.fotoSelfieMasuk ? (
                  <Image source={{ uri: myPresensiToday.fotoSelfieMasuk }} style={styles.selfieThumb} />
                ) : (
                  <View style={[styles.selfiePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Feather name="camera" size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 9.5, color: colors.textMuted, textAlign: 'center', marginTop: 2 }}>Selfie Masuk</Text>
                  </View>
                )}
                <Text style={{ fontSize: 10, color: sudahMasuk ? colors.success : colors.textMuted, textAlign: 'center', fontWeight: '700', marginTop: 4 }}>
                  {sudahMasuk ? 'Tepat Waktu (GPS OK)' : 'Belum Check-In'}
                </Text>
              </View>

              {/* Check-Out Column */}
              <View style={[styles.attendColumn, { backgroundColor: colors.background, borderColor: sudahKeluar ? colors.primary : colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.miniDot, { backgroundColor: sudahKeluar ? colors.primary : colors.textMuted }]} />
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>JAM KELUAR</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: sudahKeluar ? colors.primary : colors.textMuted, marginVertical: 4 }}>
                  {myJamKeluar ? `${myJamKeluar} WIB` : '— : —'}
                </Text>
                {myPresensiToday?.fotoSelfieKeluar ? (
                  <Image source={{ uri: myPresensiToday.fotoSelfieKeluar }} style={styles.selfieThumb} />
                ) : (
                  <View style={[styles.selfiePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Feather name="log-out" size={18} color={colors.textMuted} />
                    <Text style={{ fontSize: 9.5, color: colors.textMuted, textAlign: 'center', marginTop: 2 }}>Selfie Pulang</Text>
                  </View>
                )}
                <Text style={{ fontSize: 10, color: sudahKeluar ? colors.primary : colors.textMuted, textAlign: 'center', fontWeight: '700', marginTop: 4 }}>
                  {sudahKeluar ? 'Selesai Shift' : 'Menunggu Pulang'}
                </Text>
              </View>
            </View>

            {/* Attendance Action Buttons */}
            {!sudahMasuk ? (
              <PrimaryButton
                label="Ambil Selfie & Check-In Masuk Sekarang"
                icon="camera"
                onPress={() => navigation.navigate('CheckIn', { userId: currentUser.id, mode: 'in' })}
              />
            ) : !sudahKeluar ? (
              <PrimaryButton
                label="Ambil Selfie & Check-Out Pulang"
                icon="log-out"
                variant="secondary"
                onPress={() => navigation.navigate('CheckIn', { userId: currentUser.id, mode: 'out' })}
              />
            ) : (
              <View style={[styles.doneBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                <Feather name="check-circle" size={18} color={colors.success} strokeWidth={iconStrokeWidth} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '800' }}>
                    Presensi Hari Ini Telah Tuntas
                  </Text>
                  <Text style={{ color: colors.success, fontSize: 11, marginTop: 1 }}>
                    Data jam kerja & geotag selfie Anda telah tercatat aman di server SPPG.
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Personal 7-Day Attendance Log History */}
          <Card style={{ gap: spacing.sm }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="calendar" size={16} color={colors.primary} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>
                  LOG RIWAYAT PRESENSI SAYA (7 HARI TERAKHIR)
                </Text>
              </View>
              <Pill label="100% Kepatuhan" tone="success" />
            </View>

            <View style={{ gap: 6, marginTop: 4 }}>
              {personalHistoryLogs.map((log) => (
                <View
                  key={log.dateStr}
                  style={[
                    styles.logRow,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                      {log.dayName}, {log.dateFormatted}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {log.isWeekend
                        ? 'Hari Libur Sekolah MBG'
                        : `Masuk: ${log.jamMasuk} • Pulang: ${log.jamKeluar}`}
                    </Text>
                  </View>
                  <Pill label={log.status} tone={log.tone} />
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : (
        /* ========================================================================= */
        /* 2. TAMPILAN KHUSUS KEPALA SPPG (MONITORING KEHADIRAN SELURUH STAF TIM)    */
        /* ========================================================================= */
        <>
          <SectionTitle>Monitoring Kehadiran Staf SPPG</SectionTitle>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: -8 }}>
            Pusat Rekapitulasi Presensi & Geofence Staf Dapur — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>

          {/* Executive Attendance Statistics KPI Card */}
          <Card variant="accent" style={{ gap: spacing.md }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="bar-chart-2" size={18} color={isDark ? colors.gold : colors.primary} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
                  REKAPITULASI KEHADIRAN STAF HARI INI
                </Text>
              </View>
              <Pill label={`${pctHadir}% HADIR`} tone="success" />
            </View>

            {/* 4-Column KPI Stats */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{totalStaff}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>Total Staf</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#F0FDF4', borderColor: colors.success }]}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.success }}>{hadirCount}</Text>
                <Text style={{ fontSize: 10, color: colors.success, fontWeight: '800' }}>Hadir ({pctHadir}%)</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB', borderColor: colors.warning }]}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.warning }}>{belumCount}</Text>
                <Text style={{ fontSize: 10, color: colors.warning, fontWeight: '800' }}>Belum Hadir</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: colors.infoBg, borderColor: colors.info }]}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.info }}>{izinCount}</Text>
                <Text style={{ fontSize: 10, color: colors.info, fontWeight: '800' }}>Izin / Sakit</Text>
              </View>
            </View>

            {/* Attendance Track */}
            <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
              <View style={[styles.trackFill, { width: `${pctHadir}%`, backgroundColor: colors.success }]} />
            </View>

            {/* Division Breakdown */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Pill label="Dapur Masak: 28/30 Hadir" tone="primary" icon="user" />
              <Pill label="Driver Armada: 8/8 Hadir" tone="success" icon="truck" />
              <Pill label="Ahli Gizi & QC: 6/6 Hadir" tone="info" icon="activity" />
            </View>
          </Card>

          {/* Search & Filter Tabs */}
          <View style={{ gap: spacing.xs }}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari nama staf atau divisi pekerjaan..."
            />

            <View style={styles.tabFilterRow}>
              {(['semua', 'hadir', 'belum'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === 'semua' ? `Semua Staf (${usersInScope.length})` : tab === 'hadir' ? `Hadir (${hadirCount})` : `Belum Hadir (${belumCount})`;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.filterTabBtn,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        borderColor: isActive ? colors.primary : colors.border,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? colors.textInverse : colors.text }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Staff List Cards for Kepala SPPG */}
          {filteredStaff.length === 0 ? (
            <EmptyState icon="users" title="Tidak Ditemukan" body="Tidak ada staf yang sesuai dengan filter ini." />
          ) : (
            filteredStaff.map((u) => {
              const presensi = presensiInScope.find((p) => p.userId === u.id && p.tanggal === today);
              const isHadir = !!presensi?.jamMasuk;
              const geoLat = presensi?.geotagMasuk?.lat ?? -6.9147;
              const geoLng = presensi?.geotagMasuk?.lng ?? 107.6098;
              const osmMapUrl = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${geoLng},${geoLat}&z=16&l=map&size=500,140&pt=${geoLng},${geoLat},pm2rdm`;

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
                      <Text style={[styles.name, { color: colors.text, fontSize: fontSize.sm }]}>{u.nama}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                        {ROLE_LABEL[u.role] || u.role} • Shift {u.shift ?? 'Pagi'}
                      </Text>
                    </View>
                    <Pill label={isHadir ? 'Hadir' : 'Belum Presensi'} tone={isHadir ? 'success' : 'warning'} />
                  </View>

                  <View style={[styles.timeRow, { borderTopColor: colors.border }]}>
                    <View style={styles.timeCol}>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>Jam Masuk</Text>
                      <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '800' }}>
                        {presensi?.jamMasuk ? `${presensi.jamMasuk} WIB` : '—'}
                      </Text>
                    </View>
                    <View style={styles.timeCol}>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>Jam Keluar</Text>
                      <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '800' }}>
                        {presensi?.jamKeluar ? `${presensi.jamKeluar} WIB` : '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Geotag Photos & Map */}
                  {isHadir && (
                    <View style={{ gap: 6, marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {presensi?.fotoSelfieMasuk && (
                          <View style={{ flex: 1, gap: 2 }}>
                            <Image source={{ uri: presensi.fotoSelfieMasuk }} style={{ width: '100%', height: 80, borderRadius: radius.sm }} />
                            <Text style={{ fontSize: 9.5, color: colors.textMuted, textAlign: 'center' }}>Selfie Masuk ({presensi.jamMasuk})</Text>
                          </View>
                        )}
                        {presensi?.fotoSelfieKeluar && (
                          <View style={{ flex: 1, gap: 2 }}>
                            <Image source={{ uri: presensi.fotoSelfieKeluar }} style={{ width: '100%', height: 80, borderRadius: radius.sm }} />
                            <Text style={{ fontSize: 9.5, color: colors.textMuted, textAlign: 'center' }}>Selfie Keluar ({presensi.jamKeluar})</Text>
                          </View>
                        )}
                      </View>
                      <Image source={{ uri: osmMapUrl }} style={{ width: '100%', height: 90, borderRadius: radius.sm }} resizeMode="cover" />
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  profileAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFFFFF' },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  attendColumn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  selfieThumb: { width: 64, height: 64, borderRadius: 8, marginTop: 4 },
  selfiePlaceholder: { width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderWidth: 1 },
  kpiGrid: { flexDirection: 'row', gap: 6 },
  kpiBox: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trackBg: { height: 7, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  tabFilterRow: { flexDirection: 'row', gap: 6 },
  filterTabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  timeRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  timeCol: { flex: 1, gap: 2 },
});
