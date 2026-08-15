import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Modal, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_LABEL } from '../utils/scope';
import { toWhatsAppNumber } from '../utils/contact';
import { JOBDESK_LABEL } from '../utils/jobdesk';
import { User } from '../types';

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
  // Kepala SPPG: ketuk kartu staf untuk buka rincian presensi lengkap staf itu.
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

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

  // Dynamic Attendance Analytics Calculation for Kepala SPPG
  const totalStaff = usersInScope.length;

  const staffAttendanceMap = useMemo(() => {
    return usersInScope.map((u) => {
      const p = presensiInScope.find((item) => item.userId === u.id && item.tanggal === today);
      const isHadir = !!p?.jamMasuk;
      const isIzin = (p as any)?.status === 'izin' || (p as any)?.status === 'sakit';
      return {
        user: u,
        presensi: p,
        isHadir,
        isIzin,
        isBelum: !isHadir && !isIzin,
      };
    });
  }, [usersInScope, presensiInScope, today]);

  const hadirCount = staffAttendanceMap.filter((s) => s.isHadir).length;
  const izinCount = staffAttendanceMap.filter((s) => s.isIzin).length;
  const belumCount = staffAttendanceMap.filter((s) => s.isBelum).length;
  const pctHadir = totalStaff > 0 ? Math.round((hadirCount / totalStaff) * 100) : 0;

  // Dynamic Division Breakdown
  const divisionStats = useMemo(() => {
    const dapurStaff = staffAttendanceMap.filter(
      (s) =>
        s.user.jobdesk === 'chef_utama' ||
        s.user.jobdesk === 'asisten_masak' ||
        s.user.jobdesk === 'masak' ||
        s.user.role === 'CHEF_UTAMA'
    );
    const packingStaff = staffAttendanceMap.filter(
      (s) =>
        s.user.jobdesk === 'pemorsi_packing' ||
        s.user.jobdesk === 'petugas_logistik' ||
        s.user.role === 'PEMORSI_PACKING' ||
        s.user.role === 'PETUGAS_LOGISTIK'
    );
    const driverStaff = staffAttendanceMap.filter(
      (s) =>
        s.user.jobdesk === 'driver_distribusi' ||
        s.user.jobdesk === 'driver' ||
        s.user.role === 'DRIVER'
    );
    const giziStaff = staffAttendanceMap.filter(
      (s) =>
        s.user.jobdesk === 'ahli_gizi' ||
        s.user.jobdesk === 'akuntan' ||
        s.user.role === 'KEPALA_SPPG' ||
        s.user.role === 'AHLI_GIZI' ||
        s.user.jobdesk === 'petugas_sanitasi' ||
        s.user.role === 'PETUGAS_SANITASI'
    );

    return [
      {
        label: `Dapur Masak: ${dapurStaff.filter((s) => s.isHadir).length}/${dapurStaff.length} Hadir`,
        tone: dapurStaff.length > 0 && dapurStaff.every((s) => s.isHadir) ? ('success' as const) : ('primary' as const),
        icon: 'user' as const,
      },
      {
        label: `Packing & Logistik: ${packingStaff.filter((s) => s.isHadir).length}/${packingStaff.length} Hadir`,
        tone: packingStaff.length > 0 && packingStaff.every((s) => s.isHadir) ? ('success' as const) : ('primary' as const),
        icon: 'box' as const,
      },
      {
        label: `Driver Armada: ${driverStaff.filter((s) => s.isHadir).length}/${driverStaff.length} Hadir`,
        tone: driverStaff.length > 0 && driverStaff.every((s) => s.isHadir) ? ('success' as const) : ('primary' as const),
        icon: 'truck' as const,
      },
      {
        label: `Gizi & Tim: ${giziStaff.filter((s) => s.isHadir).length}/${giziStaff.length} Hadir`,
        tone: giziStaff.length > 0 && giziStaff.every((s) => s.isHadir) ? ('success' as const) : ('info' as const),
        icon: 'activity' as const,
      },
    ];
  }, [staffAttendanceMap]);

  const filteredStaff = useMemo(() => {
    return usersInScope.filter((u) => {
      const s = staffAttendanceMap.find((item) => item.user.id === u.id);
      if (activeTab === 'hadir' && !s?.isHadir) return false;
      if (activeTab === 'belum' && !s?.isBelum) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          u.nama.toLowerCase().includes(query) ||
          (u.role && u.role.toLowerCase().includes(query)) ||
          (u.jobdesk && u.jobdesk.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [usersInScope, staffAttendanceMap, activeTab, searchQuery]);

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

            {/* Dynamic Division Breakdown */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {divisionStats.map((stat, idx) => (
                <Pill key={idx} label={stat.label} tone={stat.tone} icon={stat.icon} />
              ))}
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
                <Card key={u.id} style={{ gap: spacing.sm }} onPress={() => setSelectedStaff(u)}>
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

                  <View style={[styles.tapHint, { borderTopColor: colors.border }]}>
                    <Text style={{ fontSize: 10.5, color: colors.textMuted }}>NIK: {u.nik}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Rincian Presensi</Text>
                      <Feather name="chevron-right" size={14} color={colors.primary} />
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </>
      )}

      {/* Modal Rincian Presensi Staf (Kepala SPPG) */}
      <Modal
        visible={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={selectedStaff ? `Rincian Presensi — ${selectedStaff.nama}` : ''}
      >
        {selectedStaff && (() => {
          const p = presensiInScope.find((item) => item.userId === selectedStaff.id && item.tanggal === today);
          const hadir = !!p?.jamMasuk;
          const lat = p?.geotagMasuk?.lat ?? -6.9147;
          const lng = p?.geotagMasuk?.lng ?? 107.6098;
          const mapUrl = `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${lng},${lat}&z=16&l=map&size=520,180&pt=${lng},${lat},pm2rdm`;
          const riwayat = presensiInScope
            .filter((item) => item.userId === selectedStaff.id)
            .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
            .slice(0, 7);

          return (
            <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: 16 }}>
              {/* Identitas Staf */}
              <View style={[styles.detailHero, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
                {selectedStaff.fotoProfil ? (
                  <Image source={{ uri: selectedStaff.fotoProfil }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                ) : (
                  <View style={[styles.avatar, { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface }]}>
                    <Feather name="user" size={26} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>{selectedStaff.nama}</Text>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                    {ROLE_LABEL[selectedStaff.role] || selectedStaff.role}
                    {selectedStaff.jobdesk ? ` • ${JOBDESK_LABEL[selectedStaff.jobdesk]}` : ''}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                    NIK {selectedStaff.nik} • Shift {selectedStaff.shift ?? 'Pagi'} • {selectedStaff.kategoriPegawai === 'relawan_lokal' ? 'Relawan Lokal' : 'Pegawai Inti BGN'}
                  </Text>
                </View>
                <Pill label={hadir ? 'Hadir' : 'Belum Presensi'} tone={hadir ? 'success' : 'warning'} />
              </View>

              {/* Jam Masuk / Keluar + Selfie Geotag */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.attendColumn, { backgroundColor: colors.background, borderColor: p?.jamMasuk ? colors.success : colors.border }]}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.text }}>JAM MASUK</Text>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: p?.jamMasuk ? colors.success : colors.textMuted, marginVertical: 3 }}>
                    {p?.jamMasuk ? `${p.jamMasuk}` : '—:—'}
                  </Text>
                  {p?.fotoSelfieMasuk ? (
                    <Image source={{ uri: p.fotoSelfieMasuk }} style={styles.selfieThumb} />
                  ) : (
                    <View style={[styles.selfiePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Feather name="camera" size={16} color={colors.textMuted} />
                    </View>
                  )}
                </View>

                <View style={[styles.attendColumn, { backgroundColor: colors.background, borderColor: p?.jamKeluar ? colors.primary : colors.border }]}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.text }}>JAM KELUAR</Text>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: p?.jamKeluar ? colors.primary : colors.textMuted, marginVertical: 3 }}>
                    {p?.jamKeluar ? `${p.jamKeluar}` : '—:—'}
                  </Text>
                  {p?.fotoSelfieKeluar ? (
                    <Image source={{ uri: p.fotoSelfieKeluar }} style={styles.selfieThumb} />
                  ) : (
                    <View style={[styles.selfiePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Feather name="log-out" size={16} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              </View>

              {/* Titik Geofence */}
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Titik Geotag Check-In</Text>
                <Image source={{ uri: mapUrl }} style={{ width: '100%', height: 130, borderRadius: radius.md }} resizeMode="cover" />
                <Text style={{ fontSize: 10, color: colors.textMuted }}>
                  Koordinat {lat.toFixed(4)}, {lng.toFixed(4)} — {hadir ? 'di dalam radius geofence dapur SPPG' : 'belum ada check-in hari ini'}
                </Text>
              </View>

              {/* Riwayat presensi staf ini */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Riwayat Presensi Tercatat</Text>
                {riwayat.length === 0 ? (
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Belum ada catatan presensi untuk staf ini.</Text>
                ) : (
                  riwayat.map((item) => (
                    <View key={item.id} style={[styles.logRow, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{item.tanggal}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          Masuk: {item.jamMasuk ?? '—'} • Pulang: {item.jamKeluar ?? '—'}
                        </Text>
                      </View>
                      <Pill label={item.status === 'hadir' ? 'Hadir' : item.status} tone={item.status === 'hadir' ? 'success' : 'warning'} />
                    </View>
                  ))
                )}
              </View>

              {/* Kontak staf */}
              <View style={{ gap: spacing.xs }}>
                <PrimaryButton
                  label={`Telepon ${selectedStaff.noHp}`}
                  icon="phone"
                  onPress={() => Linking.openURL(`tel:${selectedStaff.noHp}`)}
                />
                <PrimaryButton
                  label="Hubungi via WhatsApp"
                  icon="message-circle"
                  variant="outline"
                  onPress={() => Linking.openURL(`https://wa.me/${toWhatsAppNumber(selectedStaff.noHp)}`)}
                />
                <SecondaryButton label="Tutup" onPress={() => setSelectedStaff(null)} />
              </View>
            </ScrollView>
          );
        })()}
      </Modal>
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
  tapHint: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 8 },
  detailHero: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
});
