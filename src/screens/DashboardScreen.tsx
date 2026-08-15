import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, KpiCard, Pill, PrimaryButton, SectionTitle, StatusBadge, SyncStatusBadge, EmptyState } from '../components/ui';
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
  badge?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onPress: () => void;
}

function QuickActionGrid({ items }: { items: QuickAction[] }) {
  const { colors, spacing, radius, fontSize, shadow, iconStrokeWidth, isDark } = useTheme();
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.gridCard,
            {
              backgroundColor: colors.surface,
              borderColor: item.tone === 'danger' ? colors.danger : item.tone === 'warning' ? colors.warning : colors.border,
              borderRadius: radius.lg,
              ...shadow.card,
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.975 }] },
          ]}
        >
          <View style={styles.gridCardTopRow}>
            <View
              style={[
                styles.gridIconWrap,
                {
                  backgroundColor:
                    item.tone === 'danger'
                      ? colors.dangerBg
                      : item.tone === 'warning'
                      ? colors.warningBg
                      : colors.primaryLight,
                },
              ]}
            >
              <Feather
                name={item.icon}
                size={20}
                color={
                  item.tone === 'danger'
                    ? colors.danger
                    : item.tone === 'warning'
                    ? colors.warning
                    : isDark
                    ? colors.gold
                    : colors.primary
                }
                strokeWidth={iconStrokeWidth}
              />
            </View>
            {item.badge && (
              <Pill
                label={item.badge}
                tone={item.tone ?? 'neutral'}
              />
            )}
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

function CommandHeroHeader({ currentUser, role, sppgName, sppgScopeCount, onNotifPress, activeAlertCount }: any) {
  const { colors, fontSize, radius, spacing, isDark } = useTheme();

  return (
    <View
      style={[
        styles.commandHero,
        {
          backgroundColor: isDark ? colors.surface : colors.primary,
          borderRadius: radius.xl,
          borderColor: isDark ? colors.border : colors.primaryDark,
        },
      ]}
    >
      <View style={styles.commandHeroTopRow}>
        <View style={styles.commandHeroBadge}>
          <View style={[styles.commandHeroPulseDot, { backgroundColor: colors.gold }]} />
          <Text style={[styles.commandHeroBadgeText, { color: colors.gold }]}>PUSAT KOMANDO OPERASIONAL</Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={onNotifPress}
          style={({ pressed }) => [
            styles.notifBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="bell" size={18} color="#FFFFFF" strokeWidth={2} />
          {activeAlertCount > 0 && (
            <View style={[styles.notifBadgeDot, { backgroundColor: colors.danger }]} />
          )}
        </Pressable>
      </View>

      <View style={styles.commandHeroMainRow}>
        {currentUser.fotoProfil ? (
          <Image source={{ uri: currentUser.fotoProfil }} style={styles.heroAvatar} />
        ) : (
          <View style={[styles.heroAvatarPlaceholder, { backgroundColor: colors.gold }]}>
            <Feather name="user" size={22} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.heroGreeting, { color: '#FFFFFF', fontSize: fontSize.lg }]}>
            {currentUser.nama}
          </Text>
          <Text style={{ color: isDark ? colors.textMuted : 'rgba(255,255,255,0.85)', fontSize: fontSize.xs, fontWeight: '600' }}>
            {ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? role} • {sppgName}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ProductionStageBar({ progress, target }: { progress: number; target: number }) {
  const { colors, fontSize, radius } = useTheme();
  const pct = Math.min(100, Math.round((progress / target) * 100));

  const stages = [
    { label: 'Bahan', done: pct >= 20 },
    { label: 'Masak', done: pct >= 40 },
    { label: 'QC Gizi', done: pct >= 65 },
    { label: 'Packing', done: pct >= 85 },
    { label: 'Kirim', done: pct >= 100 },
  ];

  return (
    <Card variant="accent" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="activity" size={16} color={colors.primary} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary, letterSpacing: 0.4 }}>
            PROGRESS DOKUMENTASI PRODUKSI
          </Text>
        </View>
        <Pill label={`${pct}% Selesai`} tone={pct >= 100 ? 'success' : 'primary'} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text }}>
          {progress.toLocaleString('id-ID')}
        </Text>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' }}>
          / {target.toLocaleString('id-ID')} porsi target
        </Text>
      </View>
      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: -6 }}>
        * Fluktuatif real-time (terpengaruh penyesuaian QC, sampling, & batch pemorsian)
      </Text>

      {/* Progress Track */}
      <View style={{ height: 8, backgroundColor: colors.background, borderRadius: radius.pill, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: colors.gold || colors.primary, borderRadius: radius.pill }} />
      </View>

      {/* Stages Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
        {stages.map((stg, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: stg.done ? colors.success : colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: stg.done ? colors.success : colors.border,
              }}
            >
              {stg.done ? (
                <Feather name="check" size={11} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '700' }}>{i + 1}</Text>
              )}
            </View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: stg.done ? colors.text : colors.textMuted }}>
              {stg.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default function DashboardScreen({ navigation }: any) {
  const {
    role,
    currentUser,
    currentSppg,
    sppgList,
    sekolahList,
    progressProduksiRealtime,
    distribusiList,
    bahanBakuList,
    kandunganGiziList,
    kitchenReadinessScore,
    aiEarlyWarnings,
    batchTraceabilityList,
    qualityPassportList,
    costPerMeal,
  } = useApp();
  const { colors, spacing, fontSize, radius, iconStrokeWidth, isDark } = useTheme();
  const {
    laporanInScope,
    presensiInScope,
    checklistInScope,
    foodSafetyInScope,
    alertInScope,
    usersInScope,
    sppgInScope,
    broadcastInScope,
  } = useScopedData();
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
        <CommandHeroHeader
          currentUser={currentUser}
          role={role}
          sppgName={roleScopeLabel(currentUser)}
          sppgScopeCount={sppgInScope.length}
          onNotifPress={() => navigation.navigate('Notifikasi')}
          activeAlertCount={activeAlerts.length}
        />

        <SyncStatusBadge pendingCount={pendingCount} onSyncPress={handleSync} syncing={syncing} />

        <SectionTitle>Ringkasan Status SPPG Wilayah</SectionTitle>
        <View style={styles.statRowThree}>
          <KpiCard label="Normal" value={counts.normal} tone={colors.success} icon="check-circle" />
          <KpiCard label="Perhatian" value={counts.perhatian} tone={colors.warning} icon="alert-circle" />
          <KpiCard label="Darurat" value={counts.emergency} tone={colors.danger} icon="alert-triangle" />
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
                <Pill label={`${p.alertAktif} alert`} tone={p.alertAktif > 0 ? 'danger' : 'success'} />
              </View>
            ))}
          </Card>
        )}

        <Card style={{ gap: spacing.sm }}>
          <SectionTitle
            style={{ marginBottom: 0 }}
            action={
              <Pressable onPress={() => navigation.navigate('DaftarSPPG')} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>Lihat Semua ➔</Text>
              </Pressable>
            }
          >
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
                    <Image source={{ uri: s.fotoDapur }} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="home" size={22} color={colors.primary} />
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
  // KEPALA_SPPG / PETUGAS_LAPANGAN / DRIVER — Operational Flow & Daily Tasks
  // -------------------------------------------------------------
  const activeSppgId = currentSppg?.id || currentUser.sppgId;
  const laporanHariIni = laporanInScope.find((l) => l.tanggal === today);
  const staffAktif = usersInScope.filter((u) => u.role === 'PETUGAS_LAPANGAN' && u.statusAktif);
  const presensiHariIni = presensiInScope.filter((p) => p.tanggal === today);
  const hadirCount = presensiHariIni.filter((p) => p.status === 'hadir').length;
  const checklistHariIni = checklistInScope.find((c) => c.tanggal === today);
  const checklistSelesai = !!checklistHariIni && checklistHariIni.items.every((i) => i.status !== null);
  const checklistKritisGagal = !!checklistHariIni && checklistHariIni.items.some((i) => i.levelKritis && i.status === 'tidak');
  const foodSafetyHariIni = foodSafetyInScope.find((f) => f.tanggal === today);
  const foodSafetyAman = foodSafetyHariIni ? foodSafetyHariIni.suhuPenyimpanan <= 8 : false;

  // Gudang & Bahan
  const bahanSppg = bahanBakuList.filter((b) => b.sppgId === activeSppgId);
  const bahanKritis = bahanSppg.filter((b) => b.stok <= b.ambangMinimum);
  const akanKadaluarsa = bahanSppg.filter((b) => {
    if (!b.tanggalKadaluarsa) return false;
    const d = new Date(b.tanggalKadaluarsa);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  // Distribusi Hari Ini
  const ruteDistribusi = distribusiList.filter((d) => d.sppgId === activeSppgId);
  const ruteTiba = ruteDistribusi.filter((d) => d.status === 'tiba').length;

  const activeAlerts = sortAlerts(alertInScope.filter((a) => a.statusTindakLanjut !== 'selesai'));
  const isKepala = role === 'KEPALA_SPPG';
  const isDriver = role === 'DRIVER';
  const sekolahBina = currentSppg ? sekolahList.filter((s) => s.sppgId === currentSppg.id) : [];

  // Alur Kerja Operasional Harian SPPG (Daily Task Pipeline)
  const workflowSteps = [
    {
      id: 'presensi',
      title: '1. Presensi Seluruh Staf Dapur',
      pic: 'Semua Staf',
      status: hadirCount > 0 ? (hadirCount >= (staffAktif.length || 1) ? 'Lengkap 100%' : `${hadirCount}/${staffAktif.length || 1} Hadir`) : 'Belum Presensi',
      tone: hadirCount >= (staffAktif.length || 1) && hadirCount > 0 ? ('success' as const) : hadirCount > 0 ? ('warning' as const) : ('neutral' as const),
      isDone: hadirCount > 0,
      icon: 'users' as const,
      onPress: () => navigation.navigate(isKepala ? 'Presensi' : 'CheckIn'),
    },
    {
      id: 'gudang',
      title: '2. Kesiapan Bahan & Suhu Gudang',
      pic: 'Petugas Logistik',
      status: bahanKritis.length === 0 ? 'Stok Bahan Aman' : `${bahanKritis.length} Bahan Menipis`,
      tone: bahanKritis.length === 0 ? ('success' as const) : ('danger' as const),
      isDone: bahanKritis.length === 0,
      icon: 'package' as const,
      onPress: () => navigation.navigate('Gudang'),
    },
    {
      id: 'checklist',
      title: '3. Checklist Sanitasi & Dapur',
      pic: 'Koki & Sanitasi',
      status: checklistSelesai ? (checklistKritisGagal ? 'Item Kritis Gagal' : 'Lolos Pemeriksaan') : 'Belum Diisi',
      tone: checklistSelesai ? (checklistKritisGagal ? ('danger' as const) : ('success' as const)) : ('neutral' as const),
      isDone: checklistSelesai && !checklistKritisGagal,
      icon: 'check-square' as const,
      onPress: () => navigation.navigate('Checklist'),
    },
    {
      id: 'foodsafety',
      title: '4. Uji Suhu & Food Safety',
      pic: 'Ahli Gizi / Koki',
      status: foodSafetyHariIni ? (foodSafetyAman ? `Suhu ${foodSafetyHariIni.suhuPenyimpanan}°C (Aman)` : `Suhu Bahaya (${foodSafetyHariIni.suhuPenyimpanan}°C)`) : 'Belum Diuji',
      tone: foodSafetyHariIni ? (foodSafetyAman ? ('success' as const) : ('danger' as const)) : ('neutral' as const),
      isDone: !!foodSafetyHariIni && foodSafetyAman,
      icon: 'thermometer' as const,
      onPress: () => navigation.navigate('FoodSafetyForm'),
    },
    {
      id: 'produksi',
      title: '5. Produksi & Dokumentasi Laporan',
      pic: 'Koki & Kepala SPPG',
      status: laporanHariIni ? (laporanHariIni.status === 'diverifikasi' ? 'Diverifikasi' : laporanHariIni.status === 'terkirim' ? 'Terkirim' : 'Draft') : 'Belum Dibuat',
      tone: laporanHariIni ? (laporanHariIni.status !== 'draft' ? ('success' as const) : ('warning' as const)) : ('neutral' as const),
      isDone: !!laporanHariIni && laporanHariIni.status !== 'draft',
      icon: 'file-text' as const,
      onPress: () =>
        isKepala
          ? navigation.navigate('Laporan')
          : navigation.navigate('LaporanForm', { laporanId: laporanHariIni?.id, tanggal: today }),
    },
    {
      id: 'distribusi',
      title: '6. Distribusi & Serah Terima Sekolah',
      pic: 'Driver & Kurir',
      status: ruteDistribusi.length > 0 ? (ruteTiba === ruteDistribusi.length ? `Selesai (${ruteTiba}/${ruteDistribusi.length} Tiba)` : `${ruteTiba}/${ruteDistribusi.length} Terkirim`) : 'Siap Berangkat',
      tone: ruteDistribusi.length > 0 && ruteTiba === ruteDistribusi.length ? ('success' as const) : ruteTiba > 0 ? ('warning' as const) : ('neutral' as const),
      isDone: ruteDistribusi.length > 0 && ruteTiba === ruteDistribusi.length,
      icon: 'truck' as const,
      onPress: () => navigation.navigate('Distribusi'),
    },
  ];

  const roleSpecificTasks = useMemo(() => {
    const isSelfHadir = presensiHariIni.some((p) => p.userId === currentUser.id);

    if (role === 'AHLI_GIZI') {
      const hasEvaluasi = kandunganGiziList && kandunganGiziList.length > 0;
      return [
        {
          id: 'ag_presensi',
          title: '1. Presensi Kehadiran & Foto Wajah',
          desc: 'Konfirmasi kehadiran bertugas di unit SPPG',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'ag_suhu',
          title: '2. Cek Suhu Cold Storage & Keamanan Pangan',
          desc: 'Pastikan chiller ≤8°C untuk menjaga kesegaran daging/sayur',
          status: foodSafetyAman ? 'Suhu Aman (≤8°C)' : 'Perlu Pengecekan',
          tone: foodSafetyAman ? ('success' as const) : ('danger' as const),
          isDone: foodSafetyAman,
          icon: 'thermometer' as const,
          onPress: () => navigation.navigate('FoodSafetyForm'),
        },
        {
          id: 'ag_gizi',
          title: '3. Evaluasi Kandungan Kalori & Makronutrien',
          desc: 'Input nilai energi pokok, karbo, protein, lemak, & serat AKG BGN',
          status: hasEvaluasi ? 'Tersertifikasi' : 'Perlu Input Hari Ini',
          tone: hasEvaluasi ? ('success' as const) : ('warning' as const),
          isDone: hasEvaluasi,
          icon: 'activity' as const,
          onPress: () => navigation.navigate('KandunganGiziHarian'),
        },
        {
          id: 'ag_alergen',
          title: '4. Uji Sampel Bebas Alergen & Organoleptik',
          desc: 'Cek bebas kontaminasi kacang/seafood & ambil foto sampel porsi',
          status: hasEvaluasi ? 'Sampel Terverifikasi' : 'Uji Porsi Fisik',
          tone: hasEvaluasi ? ('success' as const) : ('neutral' as const),
          isDone: hasEvaluasi,
          icon: 'shield' as const,
          onPress: () => navigation.navigate('KandunganGiziHarian'),
        },
        {
          id: 'ag_resep',
          title: '5. Review Standar Resep & AKG Menu Besok',
          desc: 'Validasi katalog resep dan kebutuhan nutrisi siswa',
          status: 'Katalog Siap',
          tone: 'primary' as const,
          isDone: true,
          icon: 'book-open' as const,
          onPress: () => navigation.navigate('MasterMenu'),
        },
      ];
    }

    if (role === 'CHEF_UTAMA') {
      const isMasak = !!laporanHariIni;
      const isQcOk = laporanHariIni?.qcStatus === 'READY';
      return [
        {
          id: 'cu_presensi',
          title: '1. Presensi Tim Dapur & Cook',
          desc: 'Kesiapan juru masak utama dan asisten masak',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'cu_stok',
          title: '2. Cek Ketersediaan Bahan Masak di Gudang',
          desc: 'Pastikan daging, beras, sayur, & bumbu tersedia lengkap',
          status: bahanKritis.length === 0 ? 'Bahan Lengkap' : `${bahanKritis.length} Bahan Menipis`,
          tone: bahanKritis.length === 0 ? ('success' as const) : ('danger' as const),
          isDone: bahanKritis.length === 0,
          icon: 'package' as const,
          onPress: () => navigation.navigate('Gudang'),
        },
        {
          id: 'cu_alat',
          title: '3. Checklist Kesiapan Kompor & Wajan Jumbo',
          desc: 'Uji nyala api burner, kettle uap 200L, & sanitasi alat',
          status: checklistSelesai ? 'Alat Dapur Siap' : 'Perlu Checklist',
          tone: checklistSelesai ? ('success' as const) : ('neutral' as const),
          isDone: checklistSelesai,
          icon: 'check-square' as const,
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          id: 'cu_masak',
          title: '4. Pengolahan Masakan 5 Tahap (Suhu >75°C)',
          desc: 'Olah masakan sesuai standar resep dan titik matang aman',
          status: isMasak ? 'Sedang Diproses' : 'Siap Mulai Memasak',
          tone: isMasak ? ('success' as const) : ('warning' as const),
          isDone: isMasak,
          icon: 'layers' as const,
          onPress: () => navigation.navigate('ProduksiList'),
        },
        {
          id: 'cu_qc',
          title: '5. Uji Rasa QC & Approval Gate Kelayakan',
          desc: 'Pemeriksaan organoleptik rasa, tekstur, & aroma makanan',
          status: isQcOk ? 'Lolos QC (READY)' : 'Menunggu Uji Rasa',
          tone: isQcOk ? ('success' as const) : ('warning' as const),
          isDone: isQcOk,
          icon: 'shield' as const,
          onPress: () => navigation.navigate('ProduksiList'),
        },
      ];
    }

    if (role === 'PEMORSI_PACKING') {
      return [
        {
          id: 'pp_presensi',
          title: '1. Presensi Tim Pemorsi & Packing',
          desc: 'Kehadiran staf pemorsian di ruang packing steril',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'pp_ompreng',
          title: '2. Kesiapan 1.500 Ompreng Stainless Steril',
          desc: 'Cek wadah saji 5 sekat bebas noda dan bau',
          status: '1.485 Tray Steril Siap',
          tone: 'success' as const,
          isDone: true,
          icon: 'grid' as const,
          onPress: () => navigation.navigate('Peralatan'),
        },
        {
          id: 'pp_gramasi',
          title: '3. Penakaran Gramasi Nasi & Lauk Sesuai Porsi',
          desc: 'Timbang presisi nasi, protein, sayur, & buah per piring',
          status: checklistSelesai ? 'Gramasi Terverifikasi' : 'Uji Timbangan Porsi',
          tone: checklistSelesai ? ('success' as const) : ('warning' as const),
          isDone: checklistSelesai,
          icon: 'check-square' as const,
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          id: 'pp_seal',
          title: '4. Penyegelan Tutup Ompreng (Anti-Bocor)',
          desc: 'Pastikan klip pengunci rapat dan band sealer terkunci rapi',
          status: 'Sealing Berjalan',
          tone: 'primary' as const,
          isDone: true,
          icon: 'package' as const,
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          id: 'pp_laporan',
          title: '5. Dokumentasi & Laporan Packing Hari Ini',
          desc: 'Input total 1.500 ompreng, suhu holding, & foto pemorsian',
          status: 'Laporan Packing',
          tone: 'success' as const,
          isDone: true,
          icon: 'package' as const,
          onPress: () => navigation.navigate('LaporanPacking'),
        },
        {
          id: 'pp_handover',
          title: '6. Serah Terima Box ke Driver Armada Sekolah',
          desc: 'Hitung alokasi thermal box sesuai rute sekolah tujuan',
          status: 'Alokasi Terjadwal',
          tone: 'primary' as const,
          isDone: true,
          icon: 'clipboard' as const,
          onPress: () => navigation.navigate('RiwayatDistribusi'),
        },
      ];
    }

    if (role === 'PETUGAS_LOGISTIK') {
      return [
        {
          id: 'pl_presensi',
          title: '1. Presensi Kehadiran Gudang & Logistik',
          desc: 'Kehadiran petugas loading dock dan pergudangan',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'pl_beli',
          title: '2. Beli Bahan Pokok Mandiri / Belanja Lokal',
          desc: 'Input nota belanja pasar, harga satuan, & upload struk',
          status: 'Beli Bahan',
          tone: 'primary' as const,
          isDone: true,
          icon: 'shopping-cart' as const,
          onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'beli' }),
        },
        {
          id: 'pl_ajuin',
          title: '3. Ajukan Permintaan Pasokan ke Pusat BGN',
          desc: 'Request beras fortifikasi, minyak, & susu ke gudang pusat',
          status: 'Ajukan Pasokan',
          tone: 'info' as const,
          isDone: true,
          icon: 'package' as const,
          onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'ajuin' }),
        },
        {
          id: 'pl_terima',
          title: '4. Penerimaan Pasokan Masuk (Scan QR DO)',
          desc: 'Scan QR surat jalan supplier & timbang berat pasokan masuk',
          status: 'Scanner Siap',
          tone: 'success' as const,
          isDone: true,
          icon: 'camera' as const,
          onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'terima' }),
        },
        {
          id: 'pl_fefo',
          title: '5. Sortir & Penataan Bahan Sistem FEFO',
          desc: 'Pastikan barang kedaluwarsa terdekat ditaruh di depan',
          status: akanKadaluarsa.length === 0 ? 'FEFO Aman' : `${akanKadaluarsa.length} Prioritas Olah`,
          tone: akanKadaluarsa.length === 0 ? ('success' as const) : ('warning' as const),
          isDone: akanKadaluarsa.length === 0,
          icon: 'clock' as const,
          onPress: () => navigation.navigate('Gudang'),
        },
        {
          id: 'pl_suhu',
          title: '6. Monitoring Suhu Sensor IoT & Cek Masalah',
          desc: 'Pantau chiller (0-4°C), freezer (-18°C), & anomali gudang',
          status: foodSafetyAman ? 'Suhu Normal' : 'Peringatan Suhu',
          tone: foodSafetyAman ? ('success' as const) : ('danger' as const),
          isDone: foodSafetyAman,
          icon: 'thermometer' as const,
          onPress: () => navigation.navigate('GudangKondisi'),
        },
        {
          id: 'pl_mutasi',
          title: '7. Catat Mutasi Pengeluaran Bahan untuk Dapur',
          desc: 'Input pengeluaran bahan masak ke buku mutasi stok',
          status: 'Pencatatan Aktif',
          tone: 'primary' as const,
          isDone: true,
          icon: 'file-text' as const,
          onPress: () => navigation.navigate('MutasiStokForm'),
        },
      ];
    }

    if (role === 'PETUGAS_SANITASI') {
      return [
        {
          id: 'ps_presensi',
          title: '1. Presensi Tim Sanitasi & Kebersihan',
          desc: 'Kehadiran staf washing bay dan higiene lingkungan SPPG',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'ps_cuci',
          title: '2. Cuci & Sterilisasi Ompreng (Air Panas 85°C)',
          desc: 'Proses mesin cuci otomatis desinfektan dan uap panas',
          status: 'Dishwasher Siap',
          tone: 'success' as const,
          isDone: true,
          icon: 'shield' as const,
          onPress: () => navigation.navigate('Peralatan'),
        },
        {
          id: 'ps_desinfeksi',
          title: '3. Desinfeksi Meja Pemorsian, Talenan, & Pisau',
          desc: 'Sterilisasi permukaan kontak makanan bebas kontaminasi',
          status: checklistSelesai ? 'Area Higienis' : 'Perlu Desinfeksi',
          tone: checklistSelesai ? ('success' as const) : ('warning' as const),
          isDone: checklistSelesai,
          icon: 'check-square' as const,
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          id: 'ps_apd',
          title: '4. Audit Kelayakan APD Seluruh Staf SPPG',
          desc: 'Cek pemakaian masker, hairnet, apron, & sarung tangan',
          status: checklistSelesai ? 'APD 100% Lengkap' : 'Pemeriksaan APD',
          tone: checklistSelesai ? ('success' as const) : ('neutral' as const),
          isDone: checklistSelesai,
          icon: 'user' as const,
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          id: 'ps_laporan',
          title: '5. Dokumentasi & Laporan Sanitasi Hari Ini',
          desc: 'Input sterilisasi dishwasher 85°C, APD, & foto washing bay',
          status: 'Laporan Sanitasi',
          tone: 'success' as const,
          isDone: true,
          icon: 'shield' as const,
          onPress: () => navigation.navigate('LaporanSanitasi'),
        },
      ];
    }

    if (role === 'DRIVER') {
      const isRuteDone = ruteDistribusi.length > 0 && ruteTiba === ruteDistribusi.length;
      return [
        {
          id: 'dr_presensi',
          title: '1. Presensi Driver & Cek BBM Armada Box',
          desc: 'Pemeriksaan fisik mobil box pendingin dan bahan bakar',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'dr_muat',
          title: '2. Pemuatan Thermal Box Sesuai Alokasi Sekolah',
          desc: 'Muat box ke dalam kabin dan pastikan suhu holding terjaga',
          status: `${ruteDistribusi.length} Rute Sekolah`,
          tone: 'primary' as const,
          isDone: true,
          icon: 'box' as const,
          onPress: () => navigation.navigate('Distribusi'),
        },
        {
          id: 'dr_rute',
          title: '3. Pengantaran MBG ke Sekolah via Live GPS',
          desc: 'Pelacakan rute real-time dan estimasi waktu tiba tepat waktu',
          status: isRuteDone ? 'Semua Tiba' : `${ruteTiba}/${ruteDistribusi.length} Sekolah`,
          tone: isRuteDone ? ('success' as const) : ('warning' as const),
          isDone: isRuteDone,
          icon: 'navigation' as const,
          onPress: () => navigation.navigate('Distribusi'),
        },
        {
          id: 'dr_serah',
          title: '4. Serah Terima Sekolah (Foto Guru & TTD)',
          desc: 'Dokumentasi bukti penerimaan ompreng oleh kepala sekolah/guru',
          status: isRuteDone ? 'Lengkap Terverifikasi' : 'Proses Serah Terima',
          tone: isRuteDone ? ('success' as const) : ('neutral' as const),
          isDone: isRuteDone,
          icon: 'check-square' as const,
          onPress: () => navigation.navigate('Distribusi'),
        },
        {
          id: 'dr_retur',
          title: '5. Pengambilan Ompreng Kotor Hari Sebelumnya',
          desc: 'Angkut ompreng kosong dari sekolah kembali ke SPPG untuk dicuci',
          status: 'Retur Siap',
          tone: 'primary' as const,
          isDone: true,
          icon: 'truck' as const,
          onPress: () => navigation.navigate('RiwayatDistribusi'),
        },
      ];
    }

    if (role === 'PETUGAS_LAPANGAN') {
      return [
        {
          id: 'plp_presensi',
          title: '1. Presensi Kehadiran Geotag GPS',
          desc: 'Selfie foto kehadiran di area dapur SPPG',
          status: isSelfHadir ? 'Sudah Presensi' : 'Belum Presensi',
          tone: isSelfHadir ? ('success' as const) : ('warning' as const),
          isDone: isSelfHadir,
          icon: 'user-check' as const,
          onPress: () => navigation.navigate('CheckIn'),
        },
        {
          id: 'plp_sop',
          title: '2. Pengecekan Kepatuhan Checklist SOP',
          desc: 'Pemeriksaan kepatuhan standar kerja lapangan hari ini',
          status: checklistSelesai ? 'Checklist Selesai' : 'Perlu Checklist',
          tone: checklistSelesai ? ('success' as const) : ('warning' as const),
          isDone: checklistSelesai,
          icon: 'check-square' as const,
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          id: 'plp_aset',
          title: '3. Inspeksi Fisik Peralatan & Fasilitas',
          desc: 'Cek kondisi peralatan operasional dan inventaris',
          status: 'Katalog Aset',
          tone: 'info' as const,
          isDone: true,
          icon: 'box' as const,
          onPress: () => navigation.navigate('Peralatan'),
        },
        {
          id: 'plp_insiden',
          title: '4. Pelaporan Kendala / Insiden Darurat',
          desc: 'Laporkan kendala operasional langsung ke pengawas',
          status: 'Siap Lapor',
          tone: 'danger' as const,
          isDone: true,
          icon: 'alert-triangle' as const,
          onPress: () => navigation.navigate('IncidentForm'),
        },
      ];
    }

    // Default: Petugas Lapangan Umum
    return workflowSteps;
  }, [role, currentUser, presensiHariIni, foodSafetyAman, kandunganGiziList, bahanKritis, checklistSelesai, laporanHariIni, akanKadaluarsa, ruteDistribusi, ruteTiba, workflowSteps, navigation]);

  const activeTaskList = isKepala ? workflowSteps : roleSpecificTasks;
  const completedRoleSteps = activeTaskList.filter((s) => s.isDone).length;
  const roleProgressPct = Math.round((completedRoleSteps / activeTaskList.length) * 100);

  const quickActions: QuickAction[] = useMemo(() => {
    if (role === 'AHLI_GIZI') {
      return [
        {
          key: 'gizi',
          icon: 'activity',
          title: 'Input Kandungan Gizi',
          subtitle: 'Evaluasi AKG BGN',
          badge: 'Ahli Gizi',
          tone: 'success',
          onPress: () => navigation.navigate('KandunganGiziHarian'),
        },
        {
          key: 'master_menu',
          icon: 'book-open',
          title: 'Resep Standar AKG',
          subtitle: 'Katalog nutrisi porsi',
          badge: 'Gizi BGN',
          tone: 'primary',
          onPress: () => navigation.navigate('MasterMenu'),
        },
        {
          key: 'kalender_menu',
          icon: 'calendar',
          title: 'Kalender Menu',
          subtitle: 'Jadwal sajian harian',
          badge: 'Menu Plan',
          tone: 'info',
          onPress: () => navigation.navigate('MenuKalender'),
        },
        {
          key: 'food_safety',
          icon: 'thermometer',
          title: 'Suhu Cold Storage',
          subtitle: 'Kontrol mutu simpan',
          badge: 'Safety',
          tone: 'warning',
          onPress: () => navigation.navigate('FoodSafetyForm'),
        },
        {
          key: 'insiden',
          icon: 'alert-triangle',
          title: 'Lapor Insiden',
          subtitle: 'Kelayakan gizi & alergen',
          badge: 'Darurat',
          tone: 'danger',
          onPress: () => navigation.navigate('IncidentForm'),
        },
        {
          key: 'checkin',
          icon: 'user-check',
          title: 'Presensi Selfie',
          subtitle: 'Selfie & GPS akun',
          badge: 'Presensi',
          tone: 'primary',
          onPress: () => navigation.navigate('CheckIn'),
        },
      ];
    }

    if (role === 'CHEF_UTAMA') {
      return [
        {
          key: 'produksi_masak',
          icon: 'layers',
          title: 'Laporan Produksi',
          subtitle: '5 tahap masak & QC',
          badge: '5 Tahap',
          tone: 'warning',
          onPress: () => navigation.navigate('ProduksiList'),
        },
        {
          key: 'master_menu',
          icon: 'book-open',
          title: 'Resep Masakan',
          subtitle: 'Master bumbu & takaran',
          badge: 'Resep BGN',
          tone: 'primary',
          onPress: () => navigation.navigate('MasterMenu'),
        },
        {
          key: 'gudang_cek',
          icon: 'package',
          title: 'Bahan Masak Gudang',
          subtitle: 'Cek ketersediaan bahan',
          badge: 'Gudang',
          tone: 'info',
          onPress: () => navigation.navigate('Gudang'),
        },
        {
          key: 'alat_masak',
          icon: 'box',
          title: 'Wajan & Kompor',
          subtitle: 'Kesiapan peralatan',
          badge: 'Alat Dapur',
          tone: 'success',
          onPress: () => navigation.navigate('Peralatan'),
        },
        {
          key: 'checkin',
          icon: 'user-check',
          title: 'Presensi Selfie',
          subtitle: 'Selfie & GPS akun',
          badge: 'Presensi',
          tone: 'primary',
          onPress: () => navigation.navigate('CheckIn'),
        },
      ];
    }

    if (role === 'PEMORSI_PACKING') {
      return [
        {
          key: 'laporan_packing',
          icon: 'package',
          title: 'Laporan Packing',
          subtitle: '1.500 ompreng & thermal box',
          badge: 'Packing',
          tone: 'success',
          onPress: () => navigation.navigate('LaporanPacking'),
        },
        {
          key: 'porsi_seal',
          icon: 'check-square',
          title: 'Checklist Porsi',
          subtitle: 'Gramasi & sealing seal',
          badge: 'Porsi',
          tone: 'primary',
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          key: 'jadwal_kirim',
          icon: 'clipboard',
          title: 'Target Porsi Sekolah',
          subtitle: 'Alokasi tray sekolah',
          badge: 'Sekolah',
          tone: 'success',
          onPress: () => navigation.navigate('RiwayatDistribusi'),
        },
        {
          key: 'insiden',
          icon: 'alert-triangle',
          title: 'Lapor Insiden',
          subtitle: 'Ompreng bocor / rusak',
          badge: 'Darurat',
          tone: 'danger',
          onPress: () => navigation.navigate('IncidentForm'),
        },
        {
          key: 'checkin',
          icon: 'user-check',
          title: 'Presensi Selfie',
          subtitle: 'Selfie & GPS akun',
          badge: 'Presensi',
          tone: 'primary',
          onPress: () => navigation.navigate('CheckIn'),
        },
      ];
    }

    if (role === 'PETUGAS_LOGISTIK') {
      return [
        {
          key: 'qrscan',
          icon: 'camera',
          title: 'Scan QR Surat Jalan',
          subtitle: 'Terima barang dari DO',
          badge: 'Terima DO',
          tone: 'success',
          onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'terima' }),
        },
        {
          key: 'request_bahan',
          icon: 'package',
          title: 'Ajukan Pasokan',
          subtitle: 'Permintaan bahan ke BGN',
          badge: 'Gudang Pusat',
          tone: 'info',
          onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'ajuin' }),
        },
        {
          key: 'gudang_fefo',
          icon: 'clock',
          title: 'Stok FEFO Gudang',
          subtitle: 'Pantau tanggal expired',
          badge: 'FEFO',
          tone: 'warning',
          onPress: () => navigation.navigate('Gudang'),
        },
        {
          key: 'gudang_kondisi',
          icon: 'thermometer',
          title: 'Suhu Cold Storage',
          subtitle: 'Sensor chiller / freezer',
          badge: 'IoT Live',
          tone: 'primary',
          onPress: () => navigation.navigate('GudangKondisi'),
        },
        {
          key: 'mutasi',
          icon: 'file-text',
          title: 'Mutasi Stok',
          subtitle: 'Log keluar / masuk bahan',
          badge: 'Mutasi',
          tone: 'primary',
          onPress: () => navigation.navigate('MutasiStokForm'),
        },
        {
          key: 'insiden',
          icon: 'alert-triangle',
          title: 'Lapor Insiden',
          subtitle: 'Bahan reject / busuk',
          badge: 'Darurat',
          tone: 'danger',
          onPress: () => navigation.navigate('IncidentForm'),
        },
        {
          key: 'checkin',
          icon: 'user-check',
          title: 'Presensi Selfie',
          subtitle: 'Selfie & GPS akun',
          badge: 'Presensi',
          tone: 'primary',
          onPress: () => navigation.navigate('CheckIn'),
        },
      ];
    }

    if (role === 'PETUGAS_SANITASI') {
      return [
        {
          key: 'laporan_sanitasi',
          icon: 'shield',
          title: 'Laporan Sanitasi',
          subtitle: 'Dishwasher 85°C & APD',
          badge: 'Sanitasi',
          tone: 'success',
          onPress: () => navigation.navigate('LaporanSanitasi'),
        },
        {
          key: 'checklist',
          icon: 'check-square',
          title: 'Checklist Kebersihan',
          subtitle: 'Area dapur & limbah',
          badge: 'SOP',
          tone: 'primary',
          onPress: () => navigation.navigate('Checklist'),
        },
        {
          key: 'steril',
          icon: 'box',
          title: 'Sterilisasi Ompreng',
          subtitle: 'Mesin cuci air panas',
          badge: 'Steril',
          tone: 'info',
          onPress: () => navigation.navigate('Peralatan'),
        },
        {
          key: 'insiden',
          icon: 'alert-triangle',
          title: 'Lapor Insiden',
          subtitle: 'Kendala sanitasi & air',
          badge: 'Darurat',
          tone: 'danger',
          onPress: () => navigation.navigate('IncidentForm'),
        },
        {
          key: 'checkin',
          icon: 'user-check',
          title: 'Presensi Selfie',
          subtitle: 'Selfie & GPS akun',
          badge: 'Presensi',
          tone: 'primary',
          onPress: () => navigation.navigate('CheckIn'),
        },
      ];
    }

    if (role === 'DRIVER') {
      return [
        {
          key: 'distribusi',
          icon: 'truck',
          title: 'Rute Pengiriman GPS',
          subtitle: 'Peta live & status jalan',
          badge: 'Live GPS',
          tone: 'primary',
          onPress: () => navigation.navigate('Distribusi'),
        },
        {
          key: 'serah_terima',
          icon: 'check-square',
          title: 'Serah Terima Sekolah',
          subtitle: 'Foto guru & tanda tangan',
          badge: 'Sekolah',
          tone: 'success',
          onPress: () => navigation.navigate('Distribusi'),
        },
        {
          key: 'riwayat_kirim',
          icon: 'clipboard',
          title: 'Log Pengiriman',
          subtitle: 'Riwayat paket tiba',
          badge: 'Riwayat',
          tone: 'info',
          onPress: () => navigation.navigate('RiwayatDistribusi'),
        },
        {
          key: 'insiden',
          icon: 'alert-triangle',
          title: 'Lapor Insiden',
          subtitle: 'Kendala jalan / armada',
          badge: 'Darurat',
          tone: 'danger',
          onPress: () => navigation.navigate('IncidentForm'),
        },
        {
          key: 'checkin',
          icon: 'user-check',
          title: 'Presensi Selfie',
          subtitle: 'Selfie & GPS akun',
          badge: 'Presensi',
          tone: 'primary',
          onPress: () => navigation.navigate('CheckIn'),
        },
      ];
    }

    // Default: Kepala SPPG / Staf Umum (Full Komando Set)
    return [
      {
        key: 'anggaran',
        icon: 'shopping-cart',
        title: 'Beli Bahan Pokok',
        subtitle: 'Input nota & belanja',
        badge: 'Nota & Audit',
        tone: 'primary',
        onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'beli' }),
      },
      {
        key: 'traceability',
        icon: 'archive',
        title: 'Lacak Batch Makanan',
        subtitle: 'Farm-to-fork supply chain',
        badge: 'Traceability',
        tone: 'primary',
        onPress: () => navigation.navigate('BatchTraceability'),
      },
      {
        key: 'quality_passport',
        icon: 'award',
        title: 'Paspor Mutu Porsi',
        subtitle: 'Quality score & lab QC',
        badge: 'Score 96',
        tone: 'success',
        onPress: () => navigation.navigate('FoodQualityPassport'),
      },
      {
        key: 'gizi',
        icon: 'activity',
        title: 'Kandungan Gizi',
        subtitle: 'Evaluasi AKG & porsi harian',
        badge: 'Ahli Gizi',
        tone: 'success',
        onPress: () => navigation.navigate('KandunganGiziHarian'),
      },
      {
        key: 'request_bahan',
        icon: 'package',
        title: 'Ajukan ke Pusat',
        subtitle: 'Minta pasokan bahan BGN',
        badge: 'Gudang Pusat',
        tone: 'info',
        onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'ajuin' }),
      },
      {
        key: 'qrscan',
        icon: 'camera',
        title: 'Scan QR Terima',
        subtitle: 'Surat jalan supplier/DO',
        badge: 'Surat Jalan',
        tone: 'success',
        onPress: () => navigation.navigate('PengadaanBahan', { initialTab: 'terima' }),
      },
      {
        key: 'insiden',
        icon: 'alert-triangle',
        title: 'Lapor Insiden',
        subtitle: 'Darurat dapur/distribusi',
        badge: 'Darurat',
        tone: 'danger',
        onPress: () => navigation.navigate('IncidentForm'),
      },
      {
        key: 'produksi',
        icon: 'layers',
        title: 'Produksi & QC',
        subtitle: 'Batch ID & 5 tahap masak',
        badge: '5 Tahap',
        tone: 'warning',
        onPress: () => navigation.navigate('ProduksiList'),
      },
      {
        key: 'gudang_kondisi',
        icon: 'thermometer',
        title: 'Kondisi Gudang',
        subtitle: 'Suhu IoT & stok FEFO',
        badge: 'Sensor IoT',
        tone: 'info',
        onPress: () => navigation.navigate('GudangKondisi'),
      },
      {
        key: 'distribusi',
        icon: 'truck',
        title: 'Kirim Sekolah',
        subtitle: 'Rute & serah terima kurir',
        badge: 'Kurir/Driver',
        tone: 'primary',
        onPress: () => navigation.navigate('Distribusi'),
      },
      {
        key: 'broadcast',
        icon: 'radio',
        title: 'Arahan Mabes',
        subtitle: 'Broadcast komando BGN',
        badge: 'Mabes/BGN',
        tone: 'primary',
        onPress: () => navigation.navigate('Broadcast'),
      },
      {
        key: 'checkin',
        icon: 'user-check',
        title: 'Presensi Selfie',
        subtitle: 'Selfie & GPS akun',
        badge: 'Presensi',
        tone: 'primary',
        onPress: () => navigation.navigate('CheckIn'),
      },
    ];
  }, [role, navigation]);

  const targetKapasitas = currentSppg?.kapasitasProduksi || 1500;
  const currentSppgName = currentSppg?.nama ?? sppgList.find((s) => s.id === currentUser.sppgId)?.nama ?? 'SPPG Unit';
  const [isBroadcastHidden, setIsBroadcastHidden] = useState(false);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Command Header Shield */}
      <CommandHeroHeader
        currentUser={currentUser}
        role={role}
        sppgName={currentSppgName}
        sppgScopeCount={1}
        onNotifPress={() => navigation.navigate('Notifikasi')}
        activeAlertCount={activeAlerts.length}
      />

      <SyncStatusBadge pendingCount={pendingCount} onSyncPress={handleSync} syncing={syncing} />

      {/* 2. BROADCAST KOMANDO MABES / BGN (PALING ATAS & BISA DI-HIDE) */}
      {broadcastInScope.length > 0 && !isBroadcastHidden && (
        <Card style={{ backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB', borderColor: colors.warning, gap: 8, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Feather name="radio" size={16} color={colors.warning} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.warning }}>
                ARAHAN KOMANDO PUSAT (MABES/BGN)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pill label={broadcastInScope[0].tingkat.toUpperCase()} tone="warning" />
              <Pressable
                onPress={() => setIsBroadcastHidden(true)}
                hitSlop={8}
                style={{ padding: 4, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
              >
                <Feather name="x" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            {broadcastInScope[0].judul}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }}>
            {broadcastInScope[0].isi}
          </Text>
        </Card>
      )}

      {broadcastInScope.length > 0 && isBroadcastHidden && (
        <Pressable
          onPress={() => setIsBroadcastHidden(false)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 6 }}
        >
          <Feather name="radio" size={12} color={colors.warning} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.warning }}>
            1 Arahan Mabes Disembunyikan • <Text style={{ textDecorationLine: 'underline' }}>Tampilkan Pengumuman</Text>
          </Text>
        </Pressable>
      )}

      {/* 2.5 SPPG KITCHEN READINESS INDEX BANNER (Executive Quality & Performance) */}
      {(isKepala || role === 'AHLI_GIZI') && (
        <Card
          style={{
            backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : '#0F172A',
            borderRadius: radius.xl,
            gap: spacing.sm,
            borderColor: colors.gold || '#D97706',
            borderWidth: 1.2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="shield" size={15} color="#FBBF24" />
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.8 }}>
                SPPG KITCHEN READINESS INDEX
              </Text>
            </View>
            <Pill label={kitchenReadinessScore.grade} tone="success" />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 }}>
            <View>
              <Text style={{ fontSize: 10.5, color: '#94A3B8' }}>Skor Kesiapan & Mutu Dapur</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#10B981' }}>
                  {kitchenReadinessScore.score}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#94A3B8' }}>/ 100</Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('FoodQualityPassport')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FBBF24' }}>Paspor Mutu Porsi</Text>
              <Feather name="arrow-right" size={12} color="#FBBF24" />
            </Pressable>
          </View>

          {/* Subscores Strip */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: radius.md,
              padding: 8,
              marginTop: 2,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>Presensi</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#F8FAFC' }}>
                {kitchenReadinessScore.subScores.presensiTim}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>Masak SOP</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#F8FAFC' }}>
                {kitchenReadinessScore.subScores.produksiSop}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>Food Safety</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                {kitchenReadinessScore.subScores.foodSafety}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>Distribusi</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#F8FAFC' }}>
                {kitchenReadinessScore.subScores.distribusiArmada}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>Sanitasi</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#F8FAFC' }}>
                {kitchenReadinessScore.subScores.sanitasiHigiene}%
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* 2.6 AI KITCHEN EARLY WARNING & TACTICAL ADVISOR */}
      {aiEarlyWarnings.filter((w) => w.targetRole.includes(role)).length > 0 && (
        <Card
          style={{
            backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF',
            borderColor: colors.primary,
            borderWidth: 1.2,
            borderRadius: radius.xl,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="cpu" size={15} color={colors.primary} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>
                AI KITCHEN TACTICAL ADVISOR
              </Text>
            </View>
            <Pill label="Live Analysis" tone="primary" />
          </View>

          {aiEarlyWarnings
            .filter((w) => w.targetRole.includes(role))
            .slice(0, 2)
            .map((warn) => (
              <View
                key={warn.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  padding: 10,
                  gap: 4,
                  borderLeftWidth: 3,
                  borderLeftColor: warn.tingkat === 'warning' ? colors.warning : colors.primary,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                    {warn.pesan}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{warn.timestamp}</Text>
                </View>
                <Text style={{ fontSize: 10.5, color: colors.textMuted, lineHeight: 15 }}>
                  💡 Rekomendasi: {warn.rekomendasiAksi}
                </Text>
                {warn.actionRoute && warn.actionLabel && (
                  <Pressable
                    onPress={() => navigation.navigate(warn.actionRoute)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      alignSelf: 'flex-start',
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.primary }}>
                      {warn.actionLabel}
                    </Text>
                    <Feather name="arrow-right" size={12} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            ))}
        </Card>
      )}

      {/* 3. Role-Specific Tasks / Daily Operational Hub */}
      <Card variant="accent" style={{ gap: spacing.sm, marginVertical: spacing.xs }}>
        <Pressable
          onPress={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Feather name={isKepala ? 'layers' : 'check-circle'} size={16} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.4 }}>
              {isKepala ? 'ALUR OPERASIONAL SPPG HARI INI' : `TUGAS SAYA HARI INI (${ROLE_LABEL[role]?.toUpperCase() || 'STAF'})`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pill
              label={`${roleProgressPct}% (${completedRoleSteps}/${activeTaskList.length})`}
              tone={roleProgressPct >= 100 ? 'success' : roleProgressPct > 50 ? 'primary' : 'warning'}
            />
            <Feather name={isWorkflowExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
          </View>
        </Pressable>

        {/* Progress Bar Track */}
        <View style={{ height: 6, backgroundColor: colors.background, borderRadius: radius.pill, overflow: 'hidden', marginVertical: 2 }}>
          <View
            style={{
              height: '100%',
              width: `${roleProgressPct}%`,
              backgroundColor: roleProgressPct >= 100 ? colors.success : isDark ? colors.gold : colors.primary,
              borderRadius: radius.pill,
            }}
          />
        </View>

        {/* Collapsed State Summary or Expanded List */}
        {!isWorkflowExpanded ? (
          <Pressable
            onPress={() => setIsWorkflowExpanded(true)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}
          >
            <Text style={{ fontSize: 11, color: colors.textMuted, flex: 1 }}>
              {roleProgressPct >= 100
                ? 'Semua tugas pekerjaan Anda hari ini telah tuntas diselesaikan.'
                : `${completedRoleSteps} dari ${activeTaskList.length} tugas selesai • Ketuk untuk membuka daftar tugas.`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Buka Rincian</Text>
              <Feather name="chevron-down" size={14} color={colors.primary} />
            </View>
          </Pressable>
        ) : (
          <>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {isKepala
                ? 'Pantau dan jalankan seluruh rantai kerja dapur MBG dari persiapan hingga serah terima sekolah:'
                : `Daftar target & tanggung jawab kerja Anda hari ini (${ROLE_LABEL[role]}):`}
            </Text>

            {/* Task Steps Pipeline List */}
            <View style={{ gap: 8, marginTop: 4 }}>
              {activeTaskList.map((step) => (
                <Pressable
                  key={step.id}
                  onPress={step.onPress}
                  style={({ pressed }) => [
                    styles.workflowRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: step.isDone ? colors.success : colors.border,
                      borderRadius: radius.md,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View
                    style={[
                      styles.workflowIconWrap,
                      {
                        backgroundColor: step.isDone ? colors.successBg : colors.primaryLight,
                      },
                    ]}
                  >
                    <Feather
                      name={step.isDone ? 'check' : step.icon}
                      size={15}
                      color={step.isDone ? colors.success : colors.primary}
                      strokeWidth={2.4}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                      {step.title}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                      {'desc' in step ? (step as any).desc : `PIC: ${(step as any).pic}`}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Pill label={step.status} tone={step.tone} />
                    <Text style={{ fontSize: 9.5, fontWeight: '700', color: colors.primary }}>Buka</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setIsWorkflowExpanded(false)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted }}>Sembunyikan Rincian Tugas</Text>
              <Feather name="chevron-up" size={14} color={colors.textMuted} />
            </Pressable>
          </>
        )}
      </Card>

      {/* 4. Quick Menu */}
      <SectionTitle style={{ marginTop: spacing.sm }}>Quick Menu</SectionTitle>
      <QuickActionGrid items={quickActions} />

      {/* 5. Executive Metrics Grid — Horizontal Scrollable */}
      <SectionTitle>Ringkasan Status Cepat</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
        <View style={{ width: 136 }}>
          <KpiCard
            label="Laporan Produksi"
            value={laporanHariIni ? (laporanHariIni.status === 'draft' ? 'Draft' : 'Selesai') : 'Belum'}
            tone={laporanHariIni && laporanHariIni.status !== 'draft' ? colors.success : colors.warning}
            icon="file-text"
            onPress={() => navigation.navigate('LaporanForm', { laporanId: laporanHariIni?.id, tanggal: today })}
          />
        </View>
        <View style={{ width: 136 }}>
          <KpiCard
            label="Presensi Staf"
            value={`${hadirCount}/${staffAktif.length || 1}`}
            tone={hadirCount >= (staffAktif.length || 1) && hadirCount > 0 ? colors.success : colors.warning}
            icon="users"
            onPress={() => navigation.navigate('Presensi')}
          />
        </View>
        <View style={{ width: 136 }}>
          <KpiCard
            label="Checklist Dapur"
            value={checklistSelesai ? (checklistKritisGagal ? 'Gagal' : 'Lolos') : 'Belum'}
            tone={checklistSelesai && !checklistKritisGagal ? colors.success : colors.warning}
            icon="check-square"
            onPress={() => navigation.navigate('Checklist')}
          />
        </View>
        <View style={{ width: 136 }}>
          <KpiCard
            label="Distribusi Sekolah"
            value={ruteDistribusi.length > 0 ? `${ruteTiba}/${ruteDistribusi.length}` : '0/0'}
            tone={ruteDistribusi.length > 0 && ruteTiba === ruteDistribusi.length ? colors.success : colors.warning}
            icon="truck"
            onPress={() => navigation.navigate('Distribusi')}
          />
        </View>
      </ScrollView>

      {/* 6. Daftar Sekolah Bina SPPG */}
      {!!role && ROLE_PERMISSIONS[role].canManageStaff && sekolahBina.length > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle
            style={{ marginBottom: 0 }}
            action={
              <Pressable onPress={() => navigation.navigate('SekolahForm')} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>+ Tambah Sekolah</Text>
              </Pressable>
            }
          >
            Sekolah Penerima MBG ({sekolahBina.length})
          </SectionTitle>
          {sekolahBina.map((sch) => (
            <Pressable
              key={sch.id}
              onPress={() => navigation.navigate('SekolahDetail', { sekolahId: sch.id })}
              style={[styles.sppgCard, { backgroundColor: colors.background, borderRadius: radius.md, padding: 10 }]}
            >
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {sch.fotoSekolah ? (
                  <Image source={{ uri: sch.fotoSekolah }} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="home" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    {sch.nama}
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    Target: {sch.jumlahSiswa.toLocaleString('id-ID')} siswa • {sch.alamat}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>Lihat Detail Pengiriman ➔</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </Card>
      )}

      {/* 7. Alert Preview List */}
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
  content: { padding: 16, gap: 16, paddingBottom: 90 },
  commandHero: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  commandHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commandHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commandHeroPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  commandHeroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  commandHeroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  heroAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGreeting: {
    fontWeight: '900',
  },
  statRowThree: {
    flexDirection: 'row',
    gap: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  gridCard: {
    width: '48.5%',
    padding: 12,
    borderWidth: 1,
    gap: 6,
    minHeight: 110,
    justifyContent: 'flex-start',
  },
  gridCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: { fontWeight: '800' },
  gridSubtitle: { fontSize: 11, lineHeight: 15 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5 },
  alertTitle: { fontWeight: '700' },
  sppgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 0.5 },
  sppgName: { fontWeight: '700' },
  sppgCard: { marginBottom: 8 },
  workflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  workflowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

