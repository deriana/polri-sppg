import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Input, Pill, PrimaryButton, SecondaryButton } from '../components/ui';
import { ACCOUNTS } from '../mock/accounts';
import { BRAND_ASSETS } from '../data/images';
import { ROLE_LABEL } from '../utils/scope';

export default function LoginScreen() {
  const { login } = useApp();
  const { colors, iconStrokeWidth, isDark } = useTheme();

  const [nikOrId, setNikOrId] = useState('3273010101900001'); // Default Kepala SPPG
  const [password, setPassword] = useState('kepala123');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!nikOrId.trim()) {
      setError('Masukkan NIK atau ID Pengguna.');
      return;
    }
    setShowOtpModal(true);
  };

  const handleVerifyOtp = () => {
    const success = login(nikOrId.trim(), password);
    if (!success) {
      setError('NIK/ID atau kata sandi tidak cocok dengan akun manapun.');
      setShowOtpModal(false);
      return;
    }
    setError(null);
    setShowOtpModal(false);
  };

  const handleBiometricLogin = () => {
    setNikOrId('3273010101900001');
    setPassword('kepala123');
    login('3273010101900001', 'kepala123');
  };

  const fillDemoAccount = (nik: string, pass: string) => {
    setNikOrId(nik);
    setPassword(pass);
    setError(null);
    setShowRoleModal(false);
  };

  const selectedAccount = ACCOUNTS.find((a) => a.nik === nikOrId);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#061325' : '#F4F7FB' }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDark ? '#061325' : '#F4F7FB' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollCenterContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.centerWrapper}>
          {/* 1. HERO INSTITUTIONAL BRAND HEADER */}
          <View style={styles.brandHeroBlock}>
            <View style={styles.logoRow}>
              <View style={[styles.emblemContainer, { backgroundColor: isDark ? colors.surface : '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Image source={BRAND_ASSETS.polriEmblem} style={styles.logoPolri} resizeMode="contain" />
              </View>
              <View style={styles.brandDivider} />
              <View style={[styles.emblemContainer, { backgroundColor: isDark ? colors.surface : '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Image source={BRAND_ASSETS.bgnLogo} style={styles.logoBgn} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.brandTextGroup}>
              <View style={styles.appNameRow}>
                <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#071E49' }]}>
                  SIGAP SPPG
                </Text>
                <View style={styles.presisiBadge}>
                  <Text style={styles.presisiBadgeText}>PRESISI</Text>
                </View>
              </View>
              <Text style={[styles.brandSubtitle, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                SATUAN PELAYANAN PANGAN BERGIZI POLRI – BGN
              </Text>
              <Text style={[styles.tagline, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Sistem Informasi Operasional, Mutu Gizi & Distribusi MBG
              </Text>
            </View>

            <View style={[styles.securityPill, { backgroundColor: isDark ? 'rgba(5,150,105,0.15)' : '#ECFDF5', borderColor: isDark ? 'rgba(5,150,105,0.4)' : '#A7F3D0' }]}>
              <Feather name="shield" size={13} color="#059669" />
              <Text style={styles.securityPillText}>
                Portal Komando Resmi SPPG • Wilayah Hukum Polri & BGN
              </Text>
            </View>
          </View>

          {/* 2. ROLE QUICK SELECTOR HORIZONTAL STRIP */}
          <View style={styles.quickRoleSection}>
            <View style={styles.quickRoleHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.quickRoleAccentDot} />
                <Text style={[styles.quickRoleTitle, { color: isDark ? '#E2E8F0' : '#0F172A' }]}>
                  PILIH PERAN DEMO CEPAT:
                </Text>
              </View>
              <Pressable onPress={() => setShowRoleModal(true)} hitSlop={6}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#1D4ED8' }}>
                  Lihat Semua ({ACCOUNTS.length})
                </Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRoleScroll}>
              {ACCOUNTS.slice(0, 5).map((a) => {
                const isCurrent = a.nik === nikOrId;
                return (
                  <Pressable
                    key={a.role}
                    onPress={() => fillDemoAccount(a.nik, a.password)}
                    style={({ pressed }) => [
                      styles.quickRoleChip,
                      {
                        backgroundColor: isCurrent ? '#071E49' : (isDark ? '#0F2942' : '#FFFFFF'),
                        borderColor: isCurrent ? '#F59E0B' : (isDark ? '#1E3A8A' : '#E2E8F0'),
                        borderWidth: isCurrent ? 1.5 : 1,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Feather
                      name="user-check"
                      size={12}
                      color={isCurrent ? '#FBBF24' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.quickRoleChipText,
                        {
                          color: isCurrent ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#1E293B'),
                          fontWeight: isCurrent ? '900' : '700',
                        },
                      ]}
                    >
                      {ROLE_LABEL[a.role]?.split(' ')[0] || a.role}
                    </Text>
                    {isCurrent && (
                      <View style={styles.activePillDot} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. FORM LOGIN CARD */}
          <View style={[styles.formCard, { backgroundColor: isDark ? '#0B2240' : '#FFFFFF', borderColor: isDark ? '#1E3A8A' : '#E2E8F0' }]}>
            <View style={styles.formHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formTitle, { color: isDark ? '#FFFFFF' : '#071E49' }]}>
                  Autentikasi Personel
                </Text>
                <Text style={{ fontSize: 11.5, color: isDark ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  {selectedAccount ? `${ROLE_LABEL[selectedAccount.role]} • ${selectedAccount.name}` : 'Masukkan NIK / NRP & Sandi Dinas'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowRoleModal(true)}
                style={[styles.roleSelectChip, { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF', borderColor: '#BFDBFE' }]}
              >
                <Feather name="users" size={13} color="#1D4ED8" />
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#1D4ED8' }}>
                  Ganti Role
                </Text>
              </Pressable>
            </View>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Feather name="alert-circle" size={16} color="#DC2626" strokeWidth={iconStrokeWidth} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="NIK / NRP Pengguna"
              icon="user"
              value={nikOrId}
              onChangeText={setNikOrId}
              placeholder="Nomor Induk Kependudukan / NRP"
              keyboardType="number-pad"
              autoCapitalize="none"
              onClear={() => setNikOrId('')}
            />

            <View style={{ gap: 4 }}>
              <Input
                label="Kata Sandi"
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan kata sandi akun"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 }}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={13} color={colors.textMuted} />
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                  {showPassword ? 'Sembunyikan' : 'Lihat Sandi'}
                </Text>
              </Pressable>
            </View>

            <View style={{ gap: 10, marginTop: 4 }}>
              <PrimaryButton label="Masuk ke Sistem SPPG" icon="log-in" onPress={handleSubmit} />

              <Pressable
                onPress={handleBiometricLogin}
                style={({ pressed }) => [
                  styles.biometricBtn,
                  {
                    backgroundColor: isDark ? colors.surface : '#F8FAFC',
                    borderColor: isDark ? '#1E3A8A' : '#CBD5E1',
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather name="aperture" size={17} color="#D97706" />
                <Text style={[styles.biometricBtnText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                  Login Cepat Biometrik Presisi (Sidik Jari)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 4. FOOTNOTE & CREDITS */}
          <View style={styles.footnoteBlock}>
            <Text style={[styles.footnote, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Satuan Pelayanan Pangan Bergizi (SPPG) • Presisi Polri
            </Text>
            <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 10, textAlign: 'center' }}>
              v2.4.0 (Enterprise Release) • Terhubung Server Pusat BGN RI
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL PILIH AKUN DEMO / ROLE SWITCHER */}
      <Modal visible={showRoleModal} animationType="slide" transparent onRequestClose={() => setShowRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowRoleModal(false)} />
          <View style={[styles.roleModalContent, { backgroundColor: isDark ? '#0B2240' : '#FFFFFF', borderColor: isDark ? '#1E3A8A' : '#CBD5E1' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="users" size={17} color="#1D4ED8" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FFFFFF' : '#071E49' }}>
                    Pilih Peran Personel (Quick Switch)
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                    Pilih peran untuk menguji alur kerja operasional SPPG
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setShowRoleModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
              {ACCOUNTS.map((a) => {
                const isCurrent = a.nik === nikOrId;
                return (
                  <Pressable
                    key={a.role}
                    onPress={() => fillDemoAccount(a.nik, a.password)}
                    style={({ pressed }) => [
                      styles.roleItemRow,
                      {
                        backgroundColor: isCurrent ? (isDark ? 'rgba(11,34,64,0.8)' : '#EFF6FF') : (isDark ? '#061325' : '#F8FAFC'),
                        borderColor: isCurrent ? '#1D4ED8' : (isDark ? '#1E3A8A' : '#E2E8F0'),
                        borderWidth: isCurrent ? 1.5 : 1,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={[styles.roleIconWrap, { backgroundColor: isCurrent ? '#071E49' : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') }]}>
                      <Feather name="user-check" size={16} color={isCurrent ? '#FBBF24' : (isDark ? '#FFFFFF' : '#0F172A')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: isDark ? '#FFFFFF' : '#071E49' }}>
                        {ROLE_LABEL[a.role]}
                      </Text>
                      <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>{a.name}</Text>
                      <Text style={{ fontSize: 10, color: '#1D4ED8', fontWeight: '700', marginTop: 1 }}>
                        NIK: {a.nik} • Sandi: {a.password}
                      </Text>
                    </View>
                    <Feather name={isCurrent ? 'check-circle' : 'chevron-right'} size={18} color={isCurrent ? '#1D4ED8' : '#94A3B8'} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OTP VERIFICATION MODAL */}
      <Modal visible={showOtpModal} animationType="fade" transparent onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.otpModalCard, { backgroundColor: isDark ? '#0B2240' : '#FFFFFF', borderColor: isDark ? '#1E3A8A' : '#CBD5E1' }]}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="shield" size={26} color="#1D4ED8" strokeWidth={iconStrokeWidth} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FFFFFF' : '#071E49', textAlign: 'center' }}>
                Verifikasi Kode OTP Presisi
              </Text>
              <Text style={{ fontSize: 11.5, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center', lineHeight: 16 }}>
                Kode keamanan 6-digit dikirim via SMS/WhatsApp ke nomor dinas terdaftar:
              </Text>
              <Pill label={`NIK: ${nikOrId}`} tone="primary" />
            </View>

            <Input
              label="Kode OTP 6-Digit"
              icon="key"
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Masukkan 6 angka OTP"
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={{ gap: 8, marginTop: 4 }}>
              <PrimaryButton label="Verifikasi & Masuk" icon="check-circle" onPress={handleVerifyOtp} />
              <SecondaryButton label="Batal" onPress={() => setShowOtpModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollCenterContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingBottom: 48,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 440,
    gap: 14,
  },
  brandHeroBlock: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  emblemContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
  },
  logoPolri: { width: '100%', height: '100%' },
  logoBgn: { width: 44, height: 44 },
  brandDivider: { width: 1.5, height: 34, backgroundColor: 'rgba(150, 150, 150, 0.35)' },
  brandTextGroup: { alignItems: 'center', gap: 3 },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontWeight: '900', fontSize: 26, letterSpacing: -0.5 },
  presisiBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  presisiBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  brandSubtitle: { fontWeight: '800', fontSize: 11, letterSpacing: 0.5, textAlign: 'center' },
  tagline: { textAlign: 'center', maxWidth: 330 },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 2,
  },
  securityPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  quickRoleSection: {
    gap: 6,
  },
  quickRoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quickRoleAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  quickRoleTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickRoleScroll: {
    gap: 7,
    paddingVertical: 4,
  },
  quickRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  quickRoleChipText: {
    fontSize: 11.5,
  },
  activePillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FBBF24',
    marginLeft: 2,
  },
  formCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  roleSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '700',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  biometricBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footnoteBlock: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  footnote: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 30, 73, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  roleModalContent: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderRadius: 22,
    gap: 12,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  roleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  roleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderRadius: 24,
    gap: 14,
    borderWidth: 1,
  },
});
