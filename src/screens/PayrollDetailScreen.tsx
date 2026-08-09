import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { computePayroll, currentPeriode, formatRupiah } from '../utils/payroll';

export default function PayrollDetailScreen({ navigation, route }: any) {
  const { userId } = route.params as { userId: string };
  const { users, currentSppg, sppgList } = useApp();
  const { colors, spacing, fontSize, radius } = useTheme();

  const user = users.find((u) => u.id === userId);
  const sppg = sppgList.find((s) => s.id === user?.sppgId) ?? currentSppg;

  if (!user) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="user-x" title="Pegawai Tidak Ditemukan" body="Data pegawai ini tidak tersedia." />
      </View>
    );
  }

  const payroll = computePayroll(user);
  const periode = currentPeriode();

  const rowStyle = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 6 };

  const downloadSlip = async () => {
    const html = `
      <html><body style="font-family: sans-serif; padding: 24px;">
        <h2>Slip Gaji — ${periode}</h2>
        <p>${sppg?.nama ?? user.sppgId}</p>
        <hr />
        <p><b>${user.nama}</b><br/>${payroll.jabatanLabel}<br/>NIK: ${user.nik}</p>
        <table cellpadding="6" style="width:100%; border-collapse: collapse;">
          <tr><td>Gaji Pokok</td><td style="text-align:right">${formatRupiah(payroll.gajiPokok)}</td></tr>
          <tr><td>Tunjangan Makan</td><td style="text-align:right">${formatRupiah(payroll.tunjanganMakan)}</td></tr>
          <tr><td>Tunjangan Transportasi</td><td style="text-align:right">${formatRupiah(payroll.tunjanganTransport)}</td></tr>
          <tr><td>Tunjangan Kinerja</td><td style="text-align:right">${formatRupiah(payroll.tunjanganKinerja)}</td></tr>
          <tr style="border-top: 2px solid #000;"><td><b>Total Diterima</b></td><td style="text-align:right"><b>${formatRupiah(payroll.totalGaji)}</b></td></tr>
        </table>
        <p style="margin-top: 24px; font-size: 11px; color: #666;">Slip gaji simulasi — dokumen ini bukan bukti pembayaran resmi.</p>
      </body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Slip Gaji ${user.nama}` });
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {user.fotoProfil ? (
            <Image source={{ uri: user.fotoProfil }} style={{ width: 52, height: 52, borderRadius: 26 }} />
          ) : (
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="user" size={24} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>{user.nama}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{payroll.jabatanLabel}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>NIK: {user.nik}</Text>
          </View>
        </View>
      </Card>

      <SectionTitle style={{ marginBottom: 0 }}>Slip Gaji — {periode}</SectionTitle>
      <Card style={{ gap: 2 }}>
        <View style={rowStyle}>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>Gaji Pokok</Text>
          <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>{formatRupiah(payroll.gajiPokok)}</Text>
        </View>
        <View style={rowStyle}>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>Tunjangan Makan</Text>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>{formatRupiah(payroll.tunjanganMakan)}</Text>
        </View>
        <View style={rowStyle}>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>Tunjangan Transportasi</Text>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>{formatRupiah(payroll.tunjanganTransport)}</Text>
        </View>
        <View style={rowStyle}>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>Tunjangan Kinerja</Text>
          <Text style={{ color: colors.text, fontSize: fontSize.sm }}>{formatRupiah(payroll.tunjanganKinerja)}</Text>
        </View>
        <View style={[rowStyle, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 10 }]}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>Total Diterima</Text>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: fontSize.md }}>{formatRupiah(payroll.totalGaji)}</Text>
        </View>
      </Card>

      <PrimaryButton label="Unduh Slip Gaji (PDF)" icon="download" onPress={downloadSlip} />
      <SecondaryButton label="Kembali" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
});
