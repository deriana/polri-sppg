import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, KpiCard, Pill, SectionTitle, StatusBadge, SyncStatusBadge, EmptyState } from '../components/ui';
import { useScopedData, usePendingSyncCount } from '../hooks';
import { AlertLog, AlertTingkat } from '../types';
import { ROLE_LABEL, ROLE_PERMISSIONS, roleScopeLabel, scopePolresInPolda } from '../utils/scope';
import { syncOfflineQueue } from '../utils/offlineQueue';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const TINGKAT_ORDER: Record<AlertTingkat, number> = { emergency: 0, perhatian: 1, normal: 2 };

function sortAlerts(alerts: AlertLog[]): AlertLog[] {
  return [...alerts].sort((a, b) => TINGKAT_ORDER[a.tingkat] - TINGKAT_ORDER[b.tingkat]);
}

interface QuickAction {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function QuickActionGrid({ items }: { items: QuickAction[] }) {
  const { colors, spacing, radius, fontSize, shadow, iconStrokeWidth } = useTheme();
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.gridCard,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={[styles.gridIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={item.icon} size={22} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <Text style={[styles.gridTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.gridSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AlertPreviewList({ alerts, onSeeAll, onOpen }: { alerts: AlertLog[]; onSeeAll: () => void; onOpen: (a: AlertLog) => void }) {
  const { colors, spacing, fontSize } = useTheme();
  return (
    <Card style={{ gap: spacing.sm }}>
      <SectionTitle
        style={{ marginBottom: 0 }}
        action={
          alerts.length > 0 ? (
            <Pressable onPress={onSeeAll} hitSlop={8}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>Lihat Semua</Text>
            </Pressable>
          ) : undefined
        }
      >
        Alert Aktif
      </SectionTitle>
      {alerts.length === 0 ? (
        <EmptyState icon="shield" title="Tidak Ada Alert Aktif" body="Semua kondisi terpantau normal hari ini." />
      ) : (
        alerts.slice(0, 3).map((a) => (
          <Pressable key={a.id} onPress={() => onOpen(a)} style={[styles.alertRow, { borderBottomColor: colors.border }]}>
            <StatusBadge status={a.tingkat} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
                {a.judul}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                {a.timestamp}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        ))
      )}
    </Card>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, sppgList, sekolahList, progressProduksiRealtime, publicReportList } = useApp();
  const { colors, spacing, fontSize, radius, iconStrokeWidth } = useTheme();
  const { laporanInScope, presensiInScope, checklistInScope, alertInScope, usersInScope, sppgInScope } = useScopedData();
  const [pendingCount, setPendingCount] = usePendingSyncCount();
  const [syncing, setSyncing] = React.useState(false);
  const today = todayDate();

  const handleSync = async () => {
    setSyncing(true);
    const synced = await syncOfflineQueue();
    setSyncing(false);
    setPendingCount(Math.max(0, pendingCount - synced));
  };

  if (!currentUser || !role) return null;

  // -------------------------------------------------------------
  // SUPERVISOR_POLRES / SUPERVISOR_POLDA — wilayah-wide monitoring summary
  // -------------------------------------------------------------
  if (role === 'SUPERVISOR_POLRES' || role === 'SUPERVISOR_POLDA') {
    const activeAlerts = sortAlerts(alertInScope.filter((a) => a.statusTindakLanjut !== 'selesai'));
    const isPolda = role === 'SUPERVISOR_POLDA';

    const derivedStatus = (sppgId: string): AlertTingkat => {
      const sppgAlerts = activeAlerts.filter((a) => a.sppgId === sppgId);
      if (sppgAlerts.some((a) => a.tingkat === 'emergency')) return 'emergency';
      if (sppgAlerts.some((a) => a.tingkat === 'perhatian')) return 'perhatian';
      return 'normal';
    };

    const counts = { normal: 0, perhatian: 0, emergency: 0 };
    sppgInScope.forEach((s) => {
      counts[derivedStatus(s.id)] += 1;
    });

    const polresStats = isPolda
      ? scopePolresInPolda(currentUser, sppgList).map((polres) => {
          const sppgHere = sppgInScope.filter((s) => s.wilayahPolres === polres);
          const idsHere = new Set(sppgHere.map((s) => s.id));
          const sudahLapor = new Set(
            laporanInScope.filter((l) => l.tanggal === today && l.status !== 'draft' && idsHere.has(l.sppgId)).map((l) => l.sppgId),
          );
          const alertPerhatianDarurat = activeAlerts.filter(
            (a) => idsHere.has(a.sppgId) && (a.tingkat === 'perhatian' || a.tingkat === 'emergency'),
          ).length;
          return {
            polres,
            jumlahSppg: sppgHere.length,
            persenLaporan: sppgHere.length > 0 ? Math.round((sudahLapor.size / sppgHere.length) * 100) : 0,
            alertAktif: alertPerhatianDarurat,
          };
        })
      : [];

    return (
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          {currentUser.fotoProfil ? (
            <Image source={{ uri: currentUser.fotoProfil }} style={{ width: 50, height: 50, borderRadius: 25 }} />
          ) : (
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="user" size={24} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.text, fontSize: fontSize.lg }]}>Halo, {currentUser.nama}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{roleScopeLabel(currentUser)} — Pemantauan {sppgInScope.length} SPPG</Text>
          </View>
        </View>

        <SyncStatusBadge pendingCount={pendingCount} onSyncPress={handleSync} syncing={syncing} />

        <SectionTitle>Ringkasan Status SPPG</SectionTitle>
        <View style={styles.statGrid}>
          <KpiCard label="Normal" value={counts.normal} tone={colors.success} icon="check-circle" style={styles.statGridItem} />
          <KpiCard label="Perlu Perhatian" value={counts.perhatian} tone={colors.warning} icon="alert-circle" style={styles.statGridItem} />
          <KpiCard label="Darurat" value={counts.emergency} tone={colors.danger} icon="alert-triangle" style={styles.statGridItem} />
        </View>

        <AlertPreviewList
          alerts={activeAlerts}
          onSeeAll={() => navigation.navigate('Alert')}
          onOpen={(a) => navigation.navigate('AlertDetail', { alertId: a.id })}
        />

        {isPolda && (
          <Card style={{ gap: spacing.sm }}>
            <SectionTitle style={{ marginBottom: 0 }}>Perbandingan Antar-Polres</SectionTitle>
            {polresStats.map((p) => (
              <View key={p.polres} style={[styles.sppgRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sppgName, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
                    {p.polres}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                    {p.jumlahSppg} SPPG • {p.persenLaporan}% lapor hari ini
                  </Text>
                </View>
                <Pill
                  label={`${p.alertAktif} alert`}
                  tone={p.alertAktif > 0 ? 'danger' : 'success'}
                />
              </View>
            ))}
          </Card>
        )}

        <Card style={{ gap: spacing.sm }}>
          <SectionTitle style={{ marginBottom: 0 }} action={
            <Pressable onPress={() => navigation.navigate('DaftarSPPG')} hitSlop={8}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>Lihat Semua</Text>
            </Pressable>
          }>
            Daftar SPPG di Wilayah Anda ({sppgInScope.length})
          </SectionTitle>
          {sppgInScope.slice(0, 5).map((s) => {
            const sppgAlerts = activeAlerts.filter((a) => a.sppgId === s.id);
            const emergencyCount = sppgAlerts.filter((a) => a.tingkat === 'emergency').length;
            const perhatianCount = sppgAlerts.filter((a) => a.tingkat === 'perhatian').length;

            return (
              <Pressable
                key={s.id}
                onPress={() => navigation.navigate('SppgDetail', { sppgId: s.id })}
                style={[styles.sppgCard, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }]}
              >
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  {s.fotoDapur ? (
                    <Image source={{ uri: s.fotoDapur }} style={{ width: 50, height: 50, borderRadius: radius.sm }} />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="home" size={24} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.sppgName, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
                      {s.nama}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                      Kapasitas: {s.kapasitasProduksi.toLocaleString('id-ID')} porsi • {s.wilayahPolres}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <StatusBadge status={derivedStatus(s.id)} />
                      {emergencyCount > 0 && <Pill label={`${emergencyCount} Darurat`} tone="danger" />}
                      {perhatianCount > 0 && <Pill label={`${perhatianCount} Perhatian`} tone="warning" />}
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textMuted} />
                </View>
              </Pressable>
            );
          })}
        </Card>
      </ScrollView>
    );
  }

  // -------------------------------------------------------------
  // KEPALA_SPPG / PETUGAS_LAPANGAN — today's status at a glance
  // -------------------------------------------------------------
  const laporanHariIni = laporanInScope.find((l) => l.tanggal === today);
  const staffAktif = usersInScope.filter((u) => u.role === 'PETUGAS_LAPANGAN' && u.statusAktif);
  const presensiHariIni = presensiInScope.filter((p) => p.tanggal === today);
  const hadirCount = presensiHariIni.filter((p) => p.status === 'hadir').length;
  const checklistHariIni = checklistInScope.find((c) => c.tanggal === today);
  const checklistSelesai = !!checklistHariIni && checklistHariIni.items.every((i) => i.status !== null);
  const checklistKritisGagal = !!checklistHariIni && checklistHariIni.items.some((i) => i.levelKritis && i.status === 'tidak');
  const activeAlerts = sortAlerts(alertInScope.filter((a) => a.statusTindakLanjut !== 'selesai'));

  const isKepala = role === 'KEPALA_SPPG';
  const sekolahBina = currentSppg ? sekolahList.filter((s) => s.sppgId === currentSppg.id) : [];

  const quickActions: QuickAction[] = [
    { key: 'checkin', icon: 'user-check', title: 'Presensi Saya', subtitle: 'Selfie & GPS akun pribadi', onPress: () => navigation.navigate('CheckIn') },
    { key: 'presensi', icon: 'users', title: 'Rekap Presensi Staf', subtitle: 'Rekap & foto hadir tim', onPress: () => navigation.navigate('Presensi') },
    { key: 'checklist', icon: 'check-square', title: 'Checklist', subtitle: 'Checklist harian dapur', onPress: () => navigation.navigate('Checklist') },
    {
      key: 'laporan',
      icon: 'file-text',
      title: isKepala ? 'Laporan' : 'Dokumentasi Laporan',
      subtitle: isKepala ? 'Kelola laporan produksi' : 'Bantu isi dokumentasi',
      onPress: () =>
        isKepala
          ? navigation.navigate('Laporan')
          : navigation.navigate('LaporanForm', { laporanId: laporanHariIni?.id, tanggal: today }),
    },
    { key: 'foodsafety', icon: 'thermometer', title: 'Keamanan Pangan', subtitle: 'Catat suhu & simpan', onPress: () => navigation.navigate('FoodSafetyForm') },
    { key: 'peralatan', icon: 'truck', title: 'Aset & Armada', subtitle: 'Check ompreng & mobil', onPress: () => navigation.navigate('Peralatan') },
  ];

  const targetKapasitas = currentSppg?.kapasitasProduksi || 1500;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        {currentUser.fotoProfil ? (
          <Image source={{ uri: currentUser.fotoProfil }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="user" size={22} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: colors.text, fontSize: fontSize.lg }]}>Halo, {currentUser.nama}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
            {ROLE_LABEL[role]} — {currentSppg?.nama ?? sppgList.find((s) => s.id === currentUser.sppgId)?.nama}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => navigation.navigate('Notifikasi')}
          style={({ pressed }) => [
            { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="bell" size={20} color={colors.primary} strokeWidth={2} />
          {activeAlerts.length > 0 && (
            <View style={{ position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.surface }} />
          )}
        </Pressable>
      </View>

      <Card style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
              TARGET & PORSI PRODUKSI HARIAN
            </Text>
          </View>
          <Pill label="Target Harian" tone="primary" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>
            {progressProduksiRealtime.toLocaleString('id-ID')}
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
            / {targetKapasitas.toLocaleString('id-ID')} porsi terhitung ({Math.round((progressProduksiRealtime / targetKapasitas) * 100)}%)
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.background, borderRadius: radius.pill, overflow: 'hidden', marginTop: 4 }}>
          <View style={{ height: '100%', width: `${Math.min(100, Math.round((progressProduksiRealtime / targetKapasitas) * 100))}%`, backgroundColor: colors.primary, borderRadius: radius.pill }} />
        </View>
      </Card>

      <SectionTitle>Status Hari Ini</SectionTitle>
      <View style={styles.statGrid}>
        <KpiCard
          label="Laporan Hari Ini"
          value={laporanHariIni ? (laporanHariIni.status === 'draft' ? 'Draft' : laporanHariIni.status === 'terkirim' ? 'Terkirim' : 'Diverifikasi') : 'Belum Diisi'}
          tone={laporanHariIni && laporanHariIni.status !== 'draft' ? colors.success : colors.warning}
          icon="file-text"
          style={styles.statGridItem}
          onPress={() => navigation.navigate('LaporanForm', { laporanId: laporanHariIni?.id, tanggal: today })}
        />
        <KpiCard
          label="Presensi Staf"
          value={`${hadirCount}/${staffAktif.length}`}
          tone={hadirCount >= staffAktif.length ? colors.success : colors.warning}
          icon="users"
          style={styles.statGridItem}
          onPress={() => navigation.navigate('Presensi')}
        />
        <KpiCard
          label="Checklist Harian"
          value={checklistSelesai ? 'Selesai' : 'Belum Selesai'}
          tone={checklistKritisGagal ? colors.danger : checklistSelesai ? colors.success : colors.warning}
          icon="check-square"
          badge={checklistKritisGagal ? 'Kritis!' : undefined}
          style={styles.statGridItem}
          onPress={() => navigation.navigate('Checklist')}
        />
        <KpiCard
          label="Alert Aktif"
          value={activeAlerts.length}
          tone={activeAlerts.some((a) => a.tingkat === 'emergency') ? colors.danger : activeAlerts.length > 0 ? colors.warning : colors.success}
          icon="alert-triangle"
          style={styles.statGridItem}
          onPress={() => navigation.navigate('Alert')}
        />
      </View>

      {/* Sekolah Afiliasi SPPG Card */}
      {!!role && ROLE_PERMISSIONS[role].canManageStaff && (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle
            style={{ marginBottom: 0 }}
            action={
              <Pressable onPress={() => navigation.navigate('SekolahForm')} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>+ Tambah</Text>
              </Pressable>
            }
          >
            Sekolah Afiliasi SPPG Ini ({sekolahBina.length} Sekolah)
          </SectionTitle>
          {sekolahBina.length === 0 && (
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Belum ada sekolah afiliasi. Tambahkan sekolah pertama SPPG ini.</Text>
          )}
          {sekolahBina.map((sch) => (
            <Pressable
              key={sch.id}
              onPress={() => navigation.navigate('SekolahDetail', { sekolahId: sch.id })}
              style={[styles.sppgCard, { backgroundColor: colors.background, borderRadius: radius.md, padding: 10 }]}
            >
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {sch.fotoSekolah ? (
                  <Image source={{ uri: sch.fotoSekolah }} style={{ width: 50, height: 50, borderRadius: radius.sm }} />
                ) : (
                  <View style={{ width: 50, height: 50, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="home" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    {sch.nama}
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    Target: {sch.jumlahSiswa.toLocaleString('id-ID')} siswa • {sch.alamat}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>Lihat Detail Pengiriman Menu ➔</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </Card>
      )}

      <SectionTitle>Aksi Cepat</SectionTitle>
      <QuickActionGrid items={quickActions} />

      <AlertPreviewList
        alerts={activeAlerts}
        onSeeAll={() => navigation.navigate('Alert')}
        onOpen={(a) => navigation.navigate('AlertDetail', { alertId: a.id })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCard: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 4 },
  heroTitle: { fontWeight: '800' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statGridItem: { minWidth: '46%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCard: { width: '48%', padding: 14, borderWidth: 1, gap: 6, minHeight: 100, justifyContent: 'flex-start' },
  gridIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gridTitle: { fontWeight: '800' },
  gridSubtitle: { fontSize: 11, lineHeight: 14 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  alertTitle: { fontWeight: '700' },
  sppgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 0.5 },
  sppgName: { fontWeight: '700' },
  sppgCard: { marginBottom: 6 },
});
