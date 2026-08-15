import React, { useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, PrimaryButton, RpIcon, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_LABEL, roleScopeLabel } from '../utils/scope';
import { JOBDESK_LABEL } from '../utils/jobdesk';
import { computePayroll, formatRupiah } from '../utils/payroll';
import { toWhatsAppNumber } from '../utils/contact';
import { pickImage } from '../utils/pickImage';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProfileScreen({ navigation }: any) {
  const { currentUser, currentSppg, role, updateCurrentUser } = useApp();
  const { presensiInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const foto = currentUser?.fotoProfil ?? null;

  const today = todayDate();

  const handlePickCamera = async () => {
    setShowPhotoModal(false);
    const uri = await pickImage('camera');
    if (uri) {
      updateCurrentUser({ fotoProfil: uri });
    }
  };

  const handlePickLibrary = async () => {
    setShowPhotoModal(false);
    const uri = await pickImage('library');
    if (uri) {
      updateCurrentUser({ fotoProfil: uri });
    }
  };

  const handleRemovePhoto = () => {
    setShowPhotoModal(false);
    updateCurrentUser({ fotoProfil: null });
  };

  const stats = useMemo(() => {
    if (!currentUser) return { hadirBulanIni: 0, totalCatatan: 0, tepatWaktu: 0, streak: 0 };
    const bulanIni = today.slice(0, 7);
    const milikSaya = presensiInScope.filter((p) => p.userId === currentUser.id);
    const bulanan = milikSaya.filter((p) => p.tanggal.startsWith(bulanIni));
    const hadir = bulanan.filter((p) => p.jamMasuk);
    const tepat = hadir.filter((p) => (p.jamMasuk ?? '23:59') <= '06:30');
    return {
      hadirBulanIni: hadir.length,
      totalCatatan: bulanan.length,
      tepatWaktu: hadir.length > 0 ? Math.round((tepat.length / hadir.length) * 100) : 0,
      streak: milikSaya.filter((p) => p.jamMasuk).length,
    };
  }, [currentUser, presensiInScope, today]);

  const presensiHariIni = useMemo(
    () => presensiInScope.find((p) => p.userId === currentUser?.id && p.tanggal === today),
    [presensiInScope, currentUser, today],
  );

  const payroll = useMemo(() => (currentUser ? computePayroll(currentUser) : null), [currentUser]);

  if (!currentUser || !role) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="user" title="Belum Masuk" body="Data profil tidak tersedia." />
      </View>
    );
  }

  const sudahMasuk = !!presensiHariIni?.jamMasuk;
  const sudahKeluar = !!presensiHariIni?.jamKeluar;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* ===== Kartu identitas ===== */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: isDark ? colors.surface : colors.primary,
            borderColor: isDark ? colors.border : colors.primaryDark,
            borderRadius: radius.xl,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <Pill label={currentUser.statusAktif ? 'AKUN AKTIF' : 'NONAKTIF'} tone={currentUser.statusAktif ? 'success' : 'neutral'} />
          <Text style={{ color: isDark ? colors.textMuted : 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }}>
            {currentUser.id}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={styles.avatarWrap}>
            {foto ? (
              <Image source={{ uri: foto }} style={[styles.avatarImg, { borderColor: colors.gold }]} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarEmpty, { borderColor: colors.gold, backgroundColor: isDark ? colors.background : colors.primaryDark }]}>
                <Feather name="user" size={34} color={colors.gold} strokeWidth={iconStrokeWidth} />
              </View>
            )}
            <Pressable onPress={() => setShowPhotoModal(true)} style={[styles.avatarEditBtn, { backgroundColor: colors.gold }]} hitSlop={6}>
              <Feather name="camera" size={13} color={isDark ? colors.background : colors.primary} />
            </Pressable>
          </View>

          <Text style={[styles.heroName, { fontSize: fontSize.lg }]}>{currentUser.nama}</Text>
          <Text style={{ color: colors.gold, fontWeight: '800', fontSize: fontSize.xs }}>
            {roleScopeLabel(currentUser)}
          </Text>
          <Text style={{ color: isDark ? colors.textMuted : 'rgba(255,255,255,0.82)', fontSize: 11 }}>
            {currentSppg?.nama ?? 'Unit SPPG'}
            {currentUser.jobdesk ? ` • ${JOBDESK_LABEL[currentUser.jobdesk]}` : ''}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
            <Pill label={`Shift ${currentUser.shift ?? 'Pagi'}`} tone="warning" icon="clock" />
            <Pill
              label={currentUser.kategoriPegawai === 'relawan_lokal' ? 'Relawan Lokal' : 'Pegawai Inti BGN'}
              tone="info"
              icon="award"
            />
          </View>
        </View>
      </View>

      {/* ===== Statistik kehadiran ===== */}
      <View style={styles.statRow}>
        {[
          { icon: 'calendar' as const, value: String(stats.hadirBulanIni), label: 'Hadir Bulan Ini' },
          { icon: 'clock' as const, value: `${stats.tepatWaktu}%`, label: 'Tepat Waktu' },
          { icon: 'check-circle' as const, value: String(stats.streak), label: 'Total Presensi' },
        ].map((s) => (
          <View key={s.label} style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <Feather name={s.icon} size={15} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{s.value}</Text>
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.textMuted, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ===== Presensi hari ini ===== */}
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="map-pin" size={15} color={colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>PRESENSI HARI INI</Text>
          </View>
          <Pill
            label={sudahMasuk && sudahKeluar ? 'Shift Selesai' : sudahMasuk ? 'Sedang Bertugas' : 'Belum Absen'}
            tone={sudahMasuk && sudahKeluar ? 'primary' : sudahMasuk ? 'success' : 'warning'}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.clockBox, { backgroundColor: colors.background, borderColor: sudahMasuk ? colors.success : colors.border }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>MASUK</Text>
            <Text style={{ fontSize: 19, fontWeight: '900', color: sudahMasuk ? colors.success : colors.textMuted }}>
              {presensiHariIni?.jamMasuk ?? '—:—'}
            </Text>
          </View>
          <View style={[styles.clockBox, { backgroundColor: colors.background, borderColor: sudahKeluar ? colors.primary : colors.border }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>KELUAR</Text>
            <Text style={{ fontSize: 19, fontWeight: '900', color: sudahKeluar ? colors.primary : colors.textMuted }}>
              {presensiHariIni?.jamKeluar ?? '—:—'}
            </Text>
          </View>
        </View>

        {!sudahKeluar && (
          <PrimaryButton
            label={sudahMasuk ? 'Selfie & Check-Out Pulang' : 'Selfie & Check-In Masuk'}
            icon={sudahMasuk ? 'log-out' : 'camera'}
            variant={sudahMasuk ? 'secondary' : 'primary'}
            onPress={() => navigation.navigate('CheckIn', { userId: currentUser.id, mode: sudahMasuk ? 'out' : 'in' })}
          />
        )}
      </Card>

      {/* ===== Informasi akun ===== */}
      <Card style={{ gap: 2 }}>
        <SectionTitle style={{ marginBottom: 4 }}>Informasi Akun</SectionTitle>
        <InfoRow icon="credit-card" label="NIK" value={currentUser.nik} />
        <InfoRow icon="briefcase" label="Peran" value={ROLE_LABEL[role] ?? role} />
        <InfoRow icon="home" label="Unit SPPG" value={currentSppg?.nama ?? '-'} />
        {!!currentSppg && <InfoRow icon="shield" label="Wilayah" value={`${currentSppg.wilayahPolres} • ${currentSppg.wilayahPolda}`} />}
        <InfoRow
          icon="phone"
          label="No. HP"
          value={currentUser.noHp}
          action={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={() => Linking.openURL(`tel:${currentUser.noHp}`)} hitSlop={6} style={[styles.miniAction, { backgroundColor: colors.primaryLight }]}>
                <Feather name="phone" size={13} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`https://wa.me/${toWhatsAppNumber(currentUser.noHp)}`)}
                hitSlop={6}
                style={[styles.miniAction, { backgroundColor: colors.successBg }]}
              >
                <Feather name="message-circle" size={13} color={colors.success} />
              </Pressable>
            </View>
          }
        />
      </Card>

      {/* ===== Ringkasan penghasilan ===== */}
      {payroll && (
        <Card style={{ gap: spacing.sm }} onPress={() => navigation.navigate('PayrollDetail', { userId: currentUser.id })}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <RpIcon size={20} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>PENGHASILAN BULAN INI</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? colors.gold : colors.primary }}>
            {formatRupiah(payroll.totalGaji)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {payroll.jabatanLabel} • Ketuk untuk melihat rincian slip gaji
          </Text>
        </Card>
      )}

      {/* ===== Pintasan Akun & Audit Log ===== */}
      <Card style={{ gap: 6 }}>
        <SectionTitle style={{ marginBottom: 2 }}>Pintasan & Keamanan Akun</SectionTitle>
        <SecondaryButton
          label="Log Aktivitas & Audit Trail Sistem"
          icon="activity"
          onPress={() => navigation.navigate('LogAktivitas')}
        />
        <SecondaryButton label="Riwayat Presensi Saya" icon="calendar" onPress={() => navigation.navigate('Presensi')} />
        <SecondaryButton label="Slip Gaji & Payroll" icon="file-text" onPress={() => navigation.navigate('PayrollDetail', { userId: currentUser.id })} />
        <SecondaryButton label="Profil Unit SPPG" icon="home" onPress={() => navigation.navigate('SppgProfile')} />
      </Card>

      {/* ===== Modal Pilih Sumber Foto Profil ===== */}
      <Modal visible={showPhotoModal} animationType="fade" transparent onRequestClose={() => setShowPhotoModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoModal(false)} />
          <Card style={[styles.photoModalCard, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
            <View style={{ alignItems: 'center', gap: 4, paddingBottom: 8 }}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="camera" size={22} color={colors.primary} />
              </View>
              <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                Pilih Sumber Foto Profil
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
                Perbarui foto identitas resmi dinas SPPG Anda
              </Text>
            </View>

            <View style={{ gap: 8, marginVertical: 4 }}>
              <Pressable
                onPress={handlePickCamera}
                style={({ pressed }) => [
                  styles.sourceOptionRow,
                  { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.lg },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={[styles.sourceIconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#EFF6FF' }]}>
                  <Feather name="camera" size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Ambil dari Kamera</Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Buka kamera langsung untuk foto selfie</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textMuted} />
              </Pressable>

              <Pressable
                onPress={handlePickLibrary}
                style={({ pressed }) => [
                  styles.sourceOptionRow,
                  { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.lg },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={[styles.sourceIconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#F0FDF4' }]}>
                  <Feather name="image" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Pilih dari Galeri</Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Pilih foto terbaik dari penyimpanan perangkat</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textMuted} />
              </Pressable>

              {foto && (
                <Pressable
                  onPress={handleRemovePhoto}
                  style={({ pressed }) => [
                    styles.sourceOptionRow,
                    { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderColor: colors.danger, borderRadius: radius.lg },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={[styles.sourceIconWrap, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2' }]}>
                    <Feather name="trash-2" size={18} color={colors.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.danger }}>Hapus Foto Profil</Text>
                    <Text style={{ fontSize: 10.5, color: colors.danger }}>Gunakan avatar default sistem</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.danger} />
                </Pressable>
              )}
            </View>

            <SecondaryButton label="Batal" onPress={() => setShowPhotoModal(false)} />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  action,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  const { colors, fontSize, iconStrokeWidth } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
        <Feather name={icon} size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '700' }}>{value}</Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  hero: { borderWidth: 1, padding: 16, gap: 10 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarWrap: { width: 92, height: 92 },
  avatarImg: { width: 92, height: 92, borderRadius: 46, borderWidth: 3 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarEditBtn: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { color: '#FFFFFF', fontWeight: '900', textAlign: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderWidth: 1, padding: 10, alignItems: 'center', gap: 3 },
  clockBox: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  infoIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  miniAction: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  photoModalCard: {
    padding: 16,
    gap: 8,
  },
  modalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sourceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
  },
  sourceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
