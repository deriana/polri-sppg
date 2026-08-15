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
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Input, Pill, PrimaryButton, SecondaryButton } from '../components/ui';
import { ACCOUNTS } from '../data/accounts';
import { BRAND_ASSETS } from '../data/images';
import { ROLE_LABEL } from '../utils/scope';

export default function LoginScreen() {
  const { login } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [nikOrId, setNikOrId] = useState('3273010101850001'); // Default Kepala SPPG for convenience
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
    // Show OTP verification modal to complete NIK/ID + OTP flow
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
    // Quick biometric login simulation with active credentials
    setNikOrId('3273010101850001');
    setPassword('kepala123');
    login('3273010101850001', 'kepala123');
  };

  const fillDemoAccount = (nik: string, pass: string) => {
    setNikOrId(nik);
    setPassword(pass);
    setError(null);
    setShowRoleModal(false);
  };

  const selectedAccount = ACCOUNTS.find((a) => a.nik === nikOrId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO INSTITUTIONAL BRAND HEADER */}
        <View style={styles.brandHeroBlock}>
          <View style={styles.logoRow}>
            <View style={[styles.emblemContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.primaryLight, borderRadius: radius.xl }]}>
              <Image source={BRAND_ASSETS.polriEmblem} style={styles.logoPolri} resizeMode="contain" />
            </View>
            <View style={styles.brandDivider} />
            <View style={[styles.emblemContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFBEB', borderRadius: radius.xl }]}>
              <Image source={BRAND_ASSETS.bgnLogo} style={styles.logoBgn} resizeMode="contain" />
            </View>
          </View>

          <View style={{ alignItems: 'center', gap: 3, marginTop: 4 }}>
            <Text style={[styles.brandTitle, { color: isDark ? '#F8FAFC' : colors.primary, fontSize: 26 }]}>
              SIGAP SPPG
            </Text>
            <Text style={[styles.brandSubtitle, { color: isDark ? colors.gold : '#D97706', fontSize: 11 }]}>
              SATUAN PELAYANAN PANGAN BERGIZI POLRI – BGN
            </Text>
            <Text style={[styles.tagline, { color: colors.textMuted, fontSize: 11 }]}>
              Sistem Informasi Operasional & Manajemen Mutu MBG
            </Text>
          </View>

          <View style={[styles.securityPill, { backgroundColor: isDark ? 'rgba(13,148,136,0.12)' : '#F0FDF4', borderColor: isDark ? 'rgba(13,148,136,0.3)' : '#BBF7D0' }]}>
            <Feather name="shield" size={12} color={colors.success} />
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.success }}>
              Enkripsi Resmi Wilayah Hukum Polri & Standar BGN
            </Text>
          </View>
        </View>

        {/* 2. FORM LOGIN CARD */}
        <Card style={{ gap: spacing.md, borderWidth: 1.2, borderColor: colors.border }}>
          <View style={styles.formHeaderRow}>
            <Text style={[styles.formTitle, { color: colors.text, fontSize: fontSize.md }]}>
              Autentikasi Personel
            </Text>
            <Pressable
              onPress={() => setShowRoleModal(true)}
              style={[styles.roleSelectChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            >
              <Feather name="user-check" size={12} color={colors.primary} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.primary }}>
                {selectedAccount ? ROLE_LABEL[selectedAccount.role] : 'Pilih Akun Role'}
              </Text>
              <Feather name="chevron-down" size={12} color={colors.primary} />
            </Pressable>
          </View>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md, padding: spacing.md }]}>
              <Feather name="alert-circle" size={16} color={colors.danger} strokeWidth={iconStrokeWidth} />
              <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSize.xs }]}>{error}</Text>
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

          <View style={{ gap: spacing.xs, marginTop: 4 }}>
            <PrimaryButton label="Masuk ke Sistem" icon="log-in" onPress={handleSubmit} />

            <Pressable
              onPress={handleBiometricLogin}
              style={({ pressed }) => [
                styles.biometricBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="aperture" size={16} color={colors.primary} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                Login Cepat Biometrik (Sidik Jari)
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* 3. FOOTNOTE & SECURITY CREDITS */}
        <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
          <Text style={[styles.footnote, { color: colors.textMuted, fontSize: 10.5 }]}>
            Satuan Pelayanan Pangan Bergizi (SPPG) • Presisi Polri
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 10, opacity: 0.7 }}>
            v2.4.0 (Enterprise Release) • Terhubung Server Pusat BGN
          </Text>
        </View>
      </ScrollView>

      {/* MODAL PILIH AKUN DEMO / ROLE SWITCHER */}
      <Modal visible={showRoleModal} animationType="slide" transparent onRequestClose={() => setShowRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowRoleModal(false)} />
          <View style={[styles.roleModalContent, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="users" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                    Pilih Peran Personel (Quick Switch)
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                    Pilih peran untuk menguji hak akses operasional SPPG
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setShowRoleModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
              {ACCOUNTS.map((a) => {
                const isCurrent = a.nik === nikOrId;
                return (
                  <Pressable
                    key={a.role}
                    onPress={() => fillDemoAccount(a.nik, a.password)}
                    style={({ pressed }) => [
                      styles.roleItemRow,
                      {
                        backgroundColor: isCurrent ? (isDark ? 'rgba(11,34,64,0.6)' : colors.primaryLight) : colors.background,
                        borderColor: isCurrent ? colors.primary : colors.border,
                        borderRadius: radius.md,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={[styles.roleIconWrap, { backgroundColor: isCurrent ? colors.primary : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                      <Feather name="user-check" size={15} color={isCurrent ? '#FFFFFF' : colors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                        {ROLE_LABEL[a.role]}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>{a.name}</Text>
                      <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', marginTop: 1 }}>
                        NIK: {a.nik} • Sandi: {a.password}
                      </Text>
                    </View>
                    <Feather name={isCurrent ? 'check-circle' : 'chevron-right'} size={18} color={isCurrent ? colors.primary : colors.textMuted} />
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
          <Card style={[styles.otpModalContent, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="shield" size={24} color={colors.primary} strokeWidth={iconStrokeWidth} />
              </View>
              <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                Verifikasi Kode OTP Presisi
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 }}>
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

            <View style={{ gap: spacing.xs, marginTop: 4 }}>
              <PrimaryButton label="Verifikasi & Masuk" icon="check-circle" onPress={handleVerifyOtp} />
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
  content: { paddingTop: 40, paddingBottom: 32 },
  brandHeroBlock: { alignItems: 'center', marginVertical: 8, gap: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emblemContainer: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', padding: 8 },
  logoPolri: { width: '100%', height: '100%' },
  logoBgn: { width: 44, height: 44 },
  brandDivider: { width: 1.5, height: 32, backgroundColor: 'rgba(150, 150, 150, 0.3)' },
  brandTitle: { fontWeight: '900', letterSpacing: 1.2 },
  brandSubtitle: { fontWeight: '900', letterSpacing: 0.8, textAlign: 'center' },
  tagline: { textAlign: 'center', maxWidth: 300 },
  securityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formTitle: { fontWeight: '900' },
  roleSelectChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorText: { flex: 1, fontWeight: '600' },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
  },
  footnote: { textAlign: 'center', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  roleModalContent: { padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.2)' },
  roleItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1 },
  roleIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  otpModalContent: { padding: 20, gap: 14 },
});
