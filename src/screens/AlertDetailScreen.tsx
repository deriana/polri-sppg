import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, PrimaryButton, SectionTitle, StatusBadge } from '../components/ui';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { toWhatsAppNumber } from '../utils/contact';

const JENIS_LABEL: Record<string, string> = {
  checklist_kritis: 'Checklist Kritis',
  suhu_tidak_normal: 'Suhu Tidak Normal',
  laporan_terlambat: 'Laporan Terlambat',
  manual: 'Laporan Manual',
  info_pusat: 'Info Command Center',
};

export default function AlertDetailScreen({ navigation, route }: any) {
  const { alertId } = route.params as { alertId: string };
  const { role, currentUser, alertList, sppgList, users, resolveAlert, followUpAlert, eskalasiAlert } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

  const alert = alertList.find((a) => a.id === alertId);
  if (!alert) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="alert-circle" title="Alert Tidak Ditemukan" body="Data alert ini tidak tersedia." />
      </View>
    );
  }

  const sppg = sppgList.find((s) => s.id === alert.sppgId);
  const canResolve = role === 'KEPALA_SPPG' && currentUser?.sppgId === alert.sppgId && alert.statusTindakLanjut !== 'selesai';
  const canFollowUp =
    role === 'SUPERVISOR_POLRES' &&
    ROLE_PERMISSIONS[role].canFollowUpAlert &&
    sppg?.wilayahPolres === currentUser?.wilayahPolres &&
    alert.statusTindakLanjut === 'baru';
  const canEskalasi = role === 'SUPERVISOR_POLDA' && sppg?.wilayahPolda === currentUser?.wilayahPolda;
  const canAct = canResolve || canFollowUp;

  // Role-aware Contact Target:
  // - If current user is KEPALA_SPPG: contact the operational team (Chef, Ahli Gizi, Logistik, or Driver)
  // - If current user is SUPERVISOR or other roles: contact the SPPG's Kepala SPPG
  const isSelfKepala = role === 'KEPALA_SPPG';
  let contactTarget = null;
  let contactTitle = 'Hubungi Petugas Terkait';

  if (isSelfKepala) {
    if (alert.jenis === 'suhu_tidak_normal' || alert.jenis === 'checklist_kritis') {
      contactTarget =
        users.find((u) => u.sppgId === alert.sppgId && u.role === 'CHEF_UTAMA') ||
        users.find((u) => u.sppgId === alert.sppgId && u.role === 'AHLI_GIZI');
      contactTitle = 'Hubungi Koki Utama (Chef)';
    } else if (alert.jenis === 'laporan_terlambat') {
      contactTarget =
        users.find((u) => u.sppgId === alert.sppgId && u.role === 'DRIVER') ||
        users.find((u) => u.sppgId === alert.sppgId && u.role === 'PETUGAS_LOGISTIK');
      contactTitle = 'Hubungi Driver Armada / Logistik';
    } else {
      contactTarget =
        users.find((u) => u.sppgId === alert.sppgId && u.role === 'PETUGAS_LOGISTIK') ||
        users.find((u) => u.sppgId === alert.sppgId && u.role === 'AHLI_GIZI');
      contactTitle = 'Hubungi Penanggung Jawab Terkait';
    }
  } else {
    contactTarget = users.find((u) => u.sppgId === alert.sppgId && u.role === 'KEPALA_SPPG' && u.id !== currentUser?.id);
    contactTitle = 'Hubungi Kepala SPPG';
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <StatusBadge status={alert.tingkat} />
        <Pill label={alert.statusTindakLanjut === 'selesai' ? 'Selesai' : alert.statusTindakLanjut === 'ditindaklanjuti' ? 'Ditindaklanjuti' : 'Baru'} tone={alert.statusTindakLanjut === 'selesai' ? 'success' : 'warning'} />
      </View>

      <Text style={[styles.title, { color: colors.text, fontSize: fontSize.lg }]}>{alert.judul}</Text>

      <Card style={{ gap: spacing.sm }}>
        <DetailRow icon="tag" label="Jenis" value={JENIS_LABEL[alert.jenis] ?? alert.jenis} />
        <DetailRow icon="radio" label="Sumber" value={alert.sumber} />
        <DetailRow icon="home" label="SPPG" value={sppg?.nama ?? alert.sppgId} />
        <DetailRow icon="clock" label="Waktu" value={alert.timestamp} />
      </Card>

      <Card style={{ gap: spacing.xs }}>
        <SectionTitle style={{ marginBottom: 0 }}>Deskripsi</SectionTitle>
        <Text style={{ color: colors.text, fontSize: fontSize.sm, lineHeight: 20 }}>{alert.deskripsi}</Text>
      </Card>

      {contactTarget && (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle style={{ marginBottom: 0 }}>{contactTitle}</SectionTitle>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
            {contactTarget.nama} • {contactTarget.noHp}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <IconButton icon="phone" tone="primary" onPress={() => Linking.openURL(`tel:${contactTarget?.noHp}`)} />
            <IconButton icon="message-circle" tone="success" onPress={() => Linking.openURL(`https://wa.me/${toWhatsAppNumber(contactTarget?.noHp || '')}`)} />
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, alignSelf: 'center' }}>Telepon / WhatsApp</Text>
          </View>
        </Card>
      )}

      {canResolve && (
        <PrimaryButton label="Tandai Selesai" icon="check-circle" onPress={() => resolveAlert(alert.id)} />
      )}
      {canFollowUp && (
        <PrimaryButton label="Tindak Lanjuti" icon="flag" variant="secondary" onPress={() => followUpAlert(alert.id)} />
      )}
      {!canAct && alert.statusTindakLanjut !== 'selesai' && (
        <View style={[styles.infoBanner, { backgroundColor: colors.infoBg, borderRadius: radius.md }]}>
          <Feather name="info" size={16} color={colors.info} strokeWidth={iconStrokeWidth} />
          <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
            Hanya Kepala SPPG terkait yang dapat menandai alert ini selesai, atau Supervisor Polres terkait yang dapat menindaklanjuti.
          </Text>
        </View>
      )}

      {canEskalasi && (
        <Card style={{ gap: spacing.sm }}>
          <View style={styles.headerRow}>
            <SectionTitle style={{ marginBottom: 0 }}>Eskalasi ke Pusat</SectionTitle>
            <Pill label={alert.eskalasiPusat ? 'Dieskalasi' : 'Belum Dieskalasi'} tone={alert.eskalasiPusat ? 'danger' : 'neutral'} />
          </View>
          <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
            <Feather name="arrow-up-circle" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
              Penanda Eskalasi Pusat — Tandai alert ini untuk perhatian prioritas Command Center Pusat.
            </Text>
          </View>
          <PrimaryButton
            label={alert.eskalasiPusat ? 'Batalkan Eskalasi' : 'Eskalasi ke Pusat'}
            icon="arrow-up-circle"
            variant={alert.eskalasiPusat ? 'outline' : 'secondary'}
            onPress={() => eskalasiAlert(alert.id)}
          />
        </Card>
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const { colors, fontSize, iconStrokeWidth } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={14} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, width: 80 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '700', flex: 1 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
});
