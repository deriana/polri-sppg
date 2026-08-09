import React from 'react';
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
              borderColor: colors.border,
              borderRadius: radius.lg,
              ...shadow.card,
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.975 }] },
          ]}
        >
          <View style={[styles.gridIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
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
  const { role, currentUser, currentSppg, sppgList, sekolahList, progressProduksiRealtime } = useApp();
  const { colors, spacing, fontSize, radius, iconStrokeWidth, isDark } = useTheme();
  const { laporanInScope, presensiInScope, checklistInScope, alertInScope, usersInScope, sppgInScope, broadcastInScope } = useScopedData();
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
  // KEPALA_SPPG / PETUGAS_LAPANGAN — Executive operational overview
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
    { key: 'checkin', icon: 'user-check', title: 'Presensi Saya', subtitle: 'Selfie & GPS akun', onPress: () => navigation.navigate('CheckIn') },
    { key: 'presensi', icon: 'users', title: 'Rekap Presensi Staf', subtitle: 'Rekap & selfie tim', onPress: () => navigation.navigate('Presensi') },
    { key: 'checklist', icon: 'check-square', title: 'Checklist Harian', subtitle: 'Checklist harian dapur', onPress: () => navigation.navigate('Checklist') },
    {
      key: 'laporan',
      icon: 'file-text',
      title: isKepala ? 'Laporan' : 'Dokumentasi Laporan',
      subtitle: isKepala ? 'Kelola laporan produksi' : 'Isi dokumentasi',
      onPress: () =>
        isKepala
          ? navigation.navigate('Laporan')
          : navigation.navigate('LaporanForm', { laporanId: laporanHariIni?.id, tanggal: today }),
    },
    { key: 'foodsafety', icon: 'thermometer', title: 'Keamanan Pangan', subtitle: 'Catat suhu & uji', onPress: () => navigation.navigate('FoodSafetyForm') },
    { key: 'peralatan', icon: 'truck', title: 'Aset & Armada', subtitle: 'Check ompreng & mobil', onPress: () => navigation.navigate('Peralatan') },
  ];

  const targetKapasitas = currentSppg?.kapasitasProduksi || 1500;
  const currentSppgName = currentSppg?.nama ?? sppgList.find((s) => s.id === currentUser.sppgId)?.nama ?? 'SPPG Unit';

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

      {/* 2. Production Stage Progress Hub */}
      <ProductionStageBar progress={progressProduksiRealtime} target={targetKapasitas} />

      {/* Broadcast Alert Banner */}
      {broadcastInScope.length > 0 && (
        <Card style={{ backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB', borderColor: colors.warning, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="radio" size={16} color={colors.warning} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.warning, flex: 1 }}>
              BROADCAST INSTRUKSI PENGUMUMAN
            </Text>
            <Pill label={broadcastInScope[0].tingkat.toUpperCase()} tone="warning" />
          </View>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            {broadcastInScope[0].judul}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {broadcastInScope[0].isi}
          </Text>
        </Card>
      )}

      {/* Driver Task Card if role === DRIVER */}
      {role === 'DRIVER' && (
        <Card variant="accent" style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="truck" size={18} color={isDark ? colors.gold : colors.primary} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
                TUGAS PENGIRIMAN ARMADA HARI INI
              </Text>
            </View>
            <Pill label="3 Rute Sekolah" tone="primary" />
          </View>
          <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: '700', marginTop: 4 }}>
            SDN 1 Bandung ➔ SMPN 5 Bandung ➔ SD IT Al-Azhar
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Total 1.150 porsi ompreng makanan MBG dalam Thermal Box.
          </Text>
          <PrimaryButton
            label="Buka Live GPS & Upload Bukti Tiba"
            icon="navigation"
            onPress={() => navigation.navigate('Distribusi')}
            style={{ marginTop: 8 }}
          />
        </Card>
      )}

      {/* 3. Executive Metrics Grid — Horizontal Scrollable */}
      <SectionTitle>Ringkasan Status Hari Ini</SectionTitle>
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
            value={`${hadirCount}/${staffAktif.length}`}
            tone={hadirCount >= staffAktif.length ? colors.success : colors.warning}
            icon="users"
            onPress={() => navigation.navigate('Presensi')}
          />
        </View>
        <View style={{ width: 136 }}>
          <KpiCard
            label="Checklist Dapur"
            value={checklistSelesai ? 'Selesai' : 'Belum'}
            tone={checklistSelesai ? colors.success : colors.warning}
            icon="check-square"
            onPress={() => navigation.navigate('Checklist')}
          />
        </View>
      </ScrollView>

      {/* 4. Sekolah Afiliasi SPPG Card */}
      {!!role && ROLE_PERMISSIONS[role].canManageStaff && (
        <Card style={{ gap: spacing.sm }}>
          <SectionTitle
            style={{ marginBottom: 0 }}
            action={
              <Pressable onPress={() => navigation.navigate('SekolahForm')} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.xs }}>+ Tambah Sekolah</Text>
              </Pressable>
            }
          >
            Sekolah Afiliasi SPPG ({sekolahBina.length} Sekolah)
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

      {/* 5. Aksi Cepat Hub */}
      <SectionTitle>Aksi Cepat Operasional</SectionTitle>
      <QuickActionGrid items={quickActions} />

      {/* 6. Alert Preview List */}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCard: { width: '48%', padding: 14, borderWidth: 1, gap: 6, minHeight: 100, justifyContent: 'flex-start' },
  gridIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  gridTitle: { fontWeight: '800' },
  gridSubtitle: { fontSize: 11, lineHeight: 14 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  alertTitle: { fontWeight: '700' },
  sppgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 0.5 },
  sppgName: { fontWeight: '700' },
  sppgCard: { marginBottom: 6 },
});
