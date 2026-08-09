import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, PrimaryButton, SectionTitle } from '../components/ui';
import { roleScopeLabel } from '../utils/scope';

export default function ProfileScreen() {
  const { currentUser, currentSppg, role, logout } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  if (!currentUser || !role) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="user" title="Belum Masuk" body="Data profil tidak tersedia." />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.avatarBlock}>
        {currentUser.fotoProfil ? (
          <Image source={{ uri: currentUser.fotoProfil }} style={{ width: 80, height: 80, borderRadius: 40 }} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: radius.pill }]}>
            <Feather name="user" size={32} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
          </View>
        )}
        <Text style={[styles.name, { color: colors.text, fontSize: fontSize.lg }]}>{currentUser.nama}</Text>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.sm }}>{roleScopeLabel(currentUser)}</Text>
      </View>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Informasi Akun</SectionTitle>
        <InfoRow icon="credit-card" label="NIK" value={currentUser.nik} />
        <InfoRow icon="phone" label="No. HP" value={currentUser.noHp} />
        <InfoRow icon="home" label="SPPG" value={currentSppg?.nama ?? '-'} />
        {currentUser.shift && <InfoRow icon="clock" label="Shift" value={currentUser.shift} />}
        <InfoRow icon="shield" label="Status" value={currentUser.statusAktif ? 'Aktif' : 'Nonaktif'} />
      </Card>

      <PrimaryButton label="Keluar (Logout)" icon="log-out" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const { colors, fontSize, iconStrokeWidth } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, width: 80 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700', flex: 1 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  avatarBlock: { alignItems: 'center', gap: 6, marginVertical: 8 },
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
