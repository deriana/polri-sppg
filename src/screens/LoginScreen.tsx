import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Input, PrimaryButton, SecondaryButton } from '../components/ui';
import { ACCOUNTS } from '../data/accounts';
import { BRAND_ASSETS } from '../data/images';
import { ROLE_LABEL } from '../utils/scope';

export default function LoginScreen() {
  const { login } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();

  const [nikOrId, setNikOrId] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  const handleSubmit = () => {
    if (!nikOrId.trim()) {
      setError('Masukkan NIK atau ID Pengguna.');
      return;
    }
    // Show OTP verification modal to complete NIK/ID + OTP flow (Feature 1)
    setShowOtpModal(true);
  };

  const handleVerifyOtp = () => {
    const success = login(nikOrId.trim(), password);
    if (!success) {
      setError('NIK/ID atau OTP tidak cocok dengan akun manapun.');
      setShowOtpModal(false);
      return;
    }
    setError(null);
    setShowOtpModal(false);
  };

  const fillDemoAccount = (nik: string, pass: string) => {
    setNikOrId(nik);
    setPassword(pass);
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.xl, gap: spacing.md }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBlock}>
          <View style={[styles.logoRow]}>
            <View style={[styles.logoWrapper, { backgroundColor: colors.primary, borderRadius: radius.lg }]}>
              <Image source={BRAND_ASSETS.polriEmblem} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Image source={BRAND_ASSETS.bgnLogo} style={styles.logoImageSecondary} resizeMode="contain" />
          </View>
          <Text style={[styles.brandTitle, { color: colors.primary, fontSize: fontSize.xl }]}>SIGAP SPPG</Text>
          <Text style={[styles.tagline, { color: colors.textMuted, fontSize: fontSize.xs }]}>
            Sistem Informasi & Pengawasan Dapur Satuan Pemenuhan Gizi — Polri
          </Text>
        </View>

        <Card style={{ gap: spacing.md }}>
          <Text style={[styles.formTitle, { color: colors.text, fontSize: fontSize.lg }]}>Masuk ke Akun Anda</Text>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderRadius: radius.md, padding: spacing.md }]}>
              <Feather name="alert-circle" size={18} color={colors.danger} strokeWidth={iconStrokeWidth} />
              <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSize.xs }]}>{error}</Text>
            </View>
          )}

          <Input
            label="NIK atau ID Pengguna"
            icon="user"
            value={nikOrId}
            onChangeText={setNikOrId}
            placeholder="Contoh: 3273010101900001"
            autoCapitalize="none"
            onClear={() => setNikOrId('')}
          />

          <Input
            label="Kata Sandi"
            icon="lock"
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan kata sandi"
            secureTextEntry
            autoCapitalize="none"
          />

          <PrimaryButton label="Masuk" icon="log-in" onPress={handleSubmit} style={{ marginTop: spacing.xs }} />

          <Pressable hitSlop={8} style={styles.demoToggle} onPress={() => setShowDemoAccounts((v) => !v)}>
            <Feather name="users" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={[styles.demoToggleText, { color: colors.primary, fontSize: fontSize.xs }]}>
              {showDemoAccounts ? 'Sembunyikan Akun Demo' : 'Tampilkan Akun Demo'}
            </Text>
          </Pressable>

          {showDemoAccounts && (
            <View style={[styles.demoList, { borderTopColor: colors.border, gap: spacing.sm, paddingTop: spacing.md }]}>
              <Text style={[styles.demoSectionTitle, { color: colors.textMuted }]}>Pilih salah satu akun demo untuk mencoba:</Text>
              {ACCOUNTS.map((a) => (
                <Pressable
                  key={a.role}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.demoRow,
                    { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => fillDemoAccount(a.nik, a.password)}
                >
                  <View style={[styles.demoIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Feather name="user-check" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.demoRole, { color: colors.text, fontSize: fontSize.sm }]}>{ROLE_LABEL[a.role]}</Text>
                    <Text style={[styles.demoName, { color: colors.textMuted }]}>{a.name}</Text>
                    <Text style={[styles.demoCreds, { color: colors.primary }]}>
                      {a.nik} / {a.password}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Text style={[styles.footnote, { color: colors.textMuted, fontSize: fontSize.xs }]}>
          Prototipe SIGAP SPPG — data & akun demo bersifat simulasi lokal.
        </Text>
      </ScrollView>

      {/* OTP Verification Modal (Feature 1 - Login NIK/ID + OTP) */}
      <Modal visible={showOtpModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="shield" size={24} color={colors.primary} strokeWidth={iconStrokeWidth} />
              </View>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text }}>Verifikasi Kode OTP</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' }}>
                Kode OTP 6-digit telah dikirim via SMS/WhatsApp ke nomor yang terdaftar pada NIK {nikOrId}
              </Text>
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

            <View style={{ gap: spacing.xs }}>
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
  content: { paddingTop: 56, paddingBottom: 40 },
  brandBlock: { alignItems: 'center', marginVertical: 12, gap: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoWrapper: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', padding: 8 },
  logoImage: { width: '100%', height: '100%' },
  logoImageSecondary: { width: 44, height: 44 },
  brandTitle: { fontWeight: '800', letterSpacing: 1 },
  tagline: { textAlign: 'center', maxWidth: 280 },
  formTitle: { fontWeight: '800' },
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorText: { flex: 1, fontWeight: '600' },
  demoToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  demoToggleText: { fontWeight: '700' },
  demoList: { borderTopWidth: 1 },
  demoSectionTitle: { fontSize: 11, fontWeight: '600' },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  demoIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  demoRole: { fontWeight: '800' },
  demoName: { fontSize: 11, marginTop: 1 },
  demoCreds: { fontSize: 11, marginTop: 2, fontWeight: '700' },
  footnote: { textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 20, gap: 16 },
});
