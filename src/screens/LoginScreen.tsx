import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Input, Pill, PrimaryButton, SecondaryButton } from '../components/ui';
import { ACCOUNTS } from '../data/accounts';
import { BRAND_ASSETS } from '../data/images';
import { ROLE_LABEL } from '../utils/scope';
import { Role } from '../types';

type AccountCategory = 'semua' | 'manajemen' | 'dapur' | 'lapangan';

const ROLE_CATEGORY_MAP: Record<Role, AccountCategory> = {
  KEPALA_SPPG: 'manajemen',
  AHLI_GIZI: 'manajemen',
  SUPERVISOR_POLRES: 'manajemen',
  SUPERVISOR_POLDA: 'manajemen',
  CHEF_UTAMA: 'dapur',
  PEMORSI_PACKING: 'dapur',
  PETUGAS_SANITASI: 'dapur',
  PETUGAS_LOGISTIK: 'lapangan',
  DRIVER: 'lapangan',
  PETUGAS_LAPANGAN: 'lapangan',
};

const ROLE_ICON_MAP: Record<Role, keyof typeof Feather.glyphMap> = {
  KEPALA_SPPG: 'award',
  AHLI_GIZI: 'activity',
  CHEF_UTAMA: 'coffee',
  PEMORSI_PACKING: 'package',
  PETUGAS_LOGISTIK: 'archive',
  PETUGAS_SANITASI: 'shield',
  DRIVER: 'truck',
  PETUGAS_LAPANGAN: 'user-check',
  SUPERVISOR_POLRES: 'shield',
  SUPERVISOR_POLDA: 'shield',
};

const ROLE_TONE_MAP: Record<Role, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
  KEPALA_SPPG: 'primary',
  AHLI_GIZI: 'success',
  CHEF_UTAMA: 'warning',
  PEMORSI_PACKING: 'info',
  PETUGAS_LOGISTIK: 'primary',
  PETUGAS_SANITASI: 'success',
  DRIVER: 'primary',
  PETUGAS_LAPANGAN: 'info',
  SUPERVISOR_POLRES: 'danger',
  SUPERVISOR_POLDA: 'danger',
};

export default function LoginScreen() {
  const { login } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [nikOrId, setNikOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AccountCategory>('semua');
  const [showQuickAccounts, setShowQuickAccounts] = useState(true);

  const filteredAccounts = useMemo(() => {
    if (selectedCategory === 'semua') return ACCOUNTS;
    return ACCOUNTS.filter((a) => ROLE_CATEGORY_MAP[a.role] === selectedCategory);
  }, [selectedCategory]);

  const handleSubmit = () => {
    if (!nikOrId.trim()) {
      setError('Masukkan NIK atau ID Pengguna.');
      return;
    }
    if (!password.trim()) {
      setError('Masukkan kata sandi akun.');
      return;
    }
    setError(null);
    setShowOtpModal(true);
  };

  const handleVerifyOtp = () => {
    const success = login(nikOrId.trim(), password);
    if (!success) {
      setError('NIK/ID atau Kata Sandi tidak cocok dengan akun terdaftar.');
      setShowOtpModal(false);
      return;
    }
    setError(null);
    setShowOtpModal(false);
  };

  const handleQuickLogin = (nik: string, pass: string) => {
    setNikOrId(nik);
    setPassword(pass);
    setError(null);
    login(nik, pass);
  };

  const handleBiometricMock = () => {
    const defaultAcc = ACCOUNTS[0];
    setNikOrId(defaultAcc.nik);
    setPassword(defaultAcc.password);
    login(defaultAcc.nik, defaultAcc.password);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.md, gap: spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header Banner */}
        <View style={[styles.headerHero, { backgroundColor: isDark ? colors.surface : '#0F172A', borderRadius: radius.xl }]}>
          <View style={styles.heroGlow} />

          <View style={styles.badgeRow}>
            <View style={[styles.pillBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Feather name="shield" size={13} color="#FBBF24" strokeWidth={2.2} />
              <Text style={styles.pillBadgeText}>SISTEM OPERASIONAL PRESISI POLRI</Text>
            </View>
          </View>

          <View style={styles.emblemContainer}>
            <View style={styles.emblemCircle}>
              <Image source={BRAND_ASSETS.polriEmblem} style={styles.emblemImage} resizeMode="contain" />
            </View>
            <View style={styles.emblemDivider} />
            <View style={styles.emblemCircleSecondary}>
              <Image source={BRAND_ASSETS.bgnLogo} style={styles.emblemImageSecondary} resizeMode="contain" />
            </View>
          </View>

          <Text style={styles.heroTitle}>SIGAP SPPG</Text>
          <Text style={styles.heroSubtitle}>
            Sistem Informasi & Pengawasan Dapur Satuan Pelayanan Pemenuhan Gizi
          </Text>
          <Text style={styles.heroAgency}>
            Polri · Badan Gizi Nasional (BGN) Republik Indonesia
          </Text>
        </View>

        {/* Login Form Card */}
        <Card style={{ gap: spacing.md, borderRadius: radius.xl, padding: spacing.lg }}>
          <View style={styles.rowBetween}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
              Masuk Akun Pengguna
            </Text>
            <Pill label="SSL Terenkripsi" tone="success" />
          </View>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md, padding: spacing.sm }]}>
              <Feather name="alert-circle" size={16} color={colors.danger} strokeWidth={iconStrokeWidth} />
              <Text style={{ fontSize: fontSize.xs, color: colors.danger, fontWeight: '700', flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          <Input
            label="NIK / ID Pegawai SPPG"
            icon="user"
            value={nikOrId}
            onChangeText={(t) => {
              setNikOrId(t);
              if (error) setError(null);
            }}
            placeholder="Contoh: 3273010101900001"
            autoCapitalize="none"
            onClear={() => setNikOrId('')}
          />

          <View style={{ gap: 4 }}>
            <Input
              label="Kata Sandi"
              icon="lock"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError(null);
              }}
              placeholder="Masukkan kata sandi..."
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 2 }}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={13} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                {showPassword ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}
              </Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="Masuk ke Sistem Presisi"
            icon="log-in"
            onPress={handleSubmit}
            style={{ marginTop: 4 }}
          />

          {/* Biometric Quick Mock Option */}
          <Pressable
            onPress={handleBiometricMock}
            style={[
              styles.biometricBtn,
              {
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.background,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Feather name="aperture" size={18} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
              Masuk Cepat dengan Sensor Sidik Jari / Face ID
            </Text>
          </Pressable>
        </Card>

        {/* Quick Demo Accounts Header */}
        <Card style={{ gap: spacing.sm, borderRadius: radius.xl, padding: spacing.md }}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.miniIcon, { backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : '#FEF3C7' }]}>
                <Feather name="zap" size={15} color="#D97706" strokeWidth={2.4} />
              </View>
              <View>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                  Katalog Akses Akun Cepat
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Pilih salah satu role untuk langsung mencoba sistem
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setShowQuickAccounts((v) => !v)} hitSlop={8}>
              <Feather name={showQuickAccounts ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {showQuickAccounts && (
            <>
              {/* Category Segment Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
                {[
                  { id: 'semua' as const, label: 'Semua Role' },
                  { id: 'manajemen' as const, label: '👑 Komando & Gizi' },
                  { id: 'dapur' as const, label: '🍳 Dapur & Olah' },
                  { id: 'lapangan' as const, label: '📦 Gudang & Armada' },
                ].map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setSelectedCategory(tab.id)}
                      style={[
                        styles.catTab,
                        {
                          backgroundColor: isActive ? colors.primary : colors.background,
                          borderColor: isActive ? colors.primary : colors.border,
                          borderRadius: radius.pill,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: isActive ? '800' : '600',
                          color: isActive ? colors.textInverse : colors.text,
                        }}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Role Cards List */}
              <View style={{ gap: 8 }}>
                {filteredAccounts.map((a) => {
                  const roleIcon = ROLE_ICON_MAP[a.role] || 'user';
                  const roleTone = ROLE_TONE_MAP[a.role] || 'primary';

                  return (
                    <Pressable
                      key={a.role}
                      onPress={() => handleQuickLogin(a.nik, a.password)}
                      style={({ pressed }) => [
                        styles.accountRow,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          borderRadius: radius.lg,
                        },
                        pressed && { opacity: 0.75, transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                        <Feather name={roleIcon} size={16} color={colors[roleTone] || colors.primary} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>
                            {ROLE_LABEL[a.role]}
                          </Text>
                          <Pill label={a.role.replace('_', ' ')} tone={roleTone} />
                        </View>
                        <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 1 }}>{a.name}</Text>
                        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', marginTop: 2 }}>
                          NIK: {a.nik} · Sandi: {a.password}
                        </Text>
                      </View>

                      <View style={[styles.loginArrow, { backgroundColor: isDark ? 'rgba(13,148,136,0.2)' : '#E0F2FE' }]}>
                        <Feather name="arrow-right" size={14} color={colors.primary} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </Card>

        {/* Security Footer Note */}
        <View style={styles.footerNote}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="lock" size={12} color={colors.textMuted} />
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Dilindungi Enkripsi AES-256 · Pusiknas & Div TIK Polri
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: colors.textMuted, opacity: 0.8 }}>
            Hak Cipta © 2026 SPPG Polri & Badan Gizi Nasional. Semua Hak Dilindungi.
          </Text>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal visible={showOtpModal} animationType="fade" transparent onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={[styles.otpBadgeCircle, { backgroundColor: isDark ? 'rgba(13,148,136,0.2)' : '#ECFDF5' }]}>
                <Feather name="key" size={24} color={colors.success} strokeWidth={iconStrokeWidth} />
              </View>
              <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                Verifikasi Kode OTP Presisi
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
                Kode keamanan 6-digit terkirim ke WhatsApp / SMS terdaftar pada NIK:{' '}
                <Text style={{ fontWeight: '800', color: colors.text }}>{nikOrId}</Text>
              </Text>
            </View>

            <Input
              label="Kode OTP 6-Digit"
              icon="key"
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Belum menerima kode?</Text>
              <Pressable hitSlop={8}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                  Kirim Ulang (00:45)
                </Text>
              </Pressable>
            </View>

            <View style={{ gap: spacing.xs, marginTop: 4 }}>
              <PrimaryButton label="Verifikasi & Masuk Sekarang" icon="check-circle" onPress={handleVerifyOtp} />
              <SecondaryButton label="Batal" onPress={() => setShowOtpModal(false)} />
            </View>
          </Card>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 48 },
  headerHero: {
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251,191,36,0.08)',
  },
  badgeRow: { marginBottom: 12 },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  emblemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  emblemCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emblemImage: { width: '100%', height: '100%' },
  emblemDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  emblemCircleSecondary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emblemImageSecondary: { width: '100%', height: '100%' },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
    lineHeight: 17,
  },
  heroAgency: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 6,
    letterSpacing: 0.4,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  miniIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  catTab: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
  },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  loginArrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  footerNote: { alignItems: 'center', gap: 4, marginTop: 8, paddingBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, gap: 16 },
  otpBadgeCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
