import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';

// Layar ini adalah turunan (derived view) dari state AppContext — tidak ada
// sistem push notification asli (butuh konfigurasi native push, di luar
// cakupan demo ini). Semua isi feed dihitung ulang tiap render dari data live:
// tugas yang belum beres, alert operasional, dan broadcast komando.
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Jarak waktu relatif ("2 jam lalu") supaya feed terbaca seperti inbox, bukan
// tabel timestamp. Timestamp data berformat "YYYY-MM-DD HH:mm".
function relativeTime(timestamp: string): string {
  const parsed = new Date(timestamp.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return timestamp;
  const diffMin = Math.round((Date.now() - parsed.getTime()) / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffJam = Math.round(diffMin / 60);
  if (diffJam < 24) return `${diffJam} jam lalu`;
  const diffHari = Math.round(diffJam / 24);
  if (diffHari < 7) return `${diffHari} hari lalu`;
  return timestamp.slice(0, 10);
}

type FeedKind = 'tugas' | 'alert' | 'komando';
type Tone = 'danger' | 'warning' | 'info' | 'primary';

interface FeedItem {
  id: string;
  kind: FeedKind;
  icon: keyof typeof Feather.glyphMap;
  tone: Tone;
  badge: string;
  title: string;
  body: string;
  timestamp: string;
  meta?: string;
  onPress?: () => void;
}

const KIND_LABEL: Record<FeedKind | 'semua', string> = {
  semua: 'Semua',
  tugas: 'Tugas',
  alert: 'Alert',
  komando: 'Komando',
};

export default function NotifikasiScreen({ navigation }: any) {
  const { role } = useApp();
  const { laporanInScope, checklistInScope, presensiInScope, usersInScope, alertInScope, broadcastInScope } =
    useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();
  const today = todayDate();

  const [filter, setFilter] = useState<FeedKind | 'semua'>('semua');

  const toneColor = (tone: Tone) => {
    if (tone === 'danger') return { fg: colors.danger, bg: colors.dangerBg };
    if (tone === 'warning') return { fg: colors.warning, bg: colors.warningBg };
    if (tone === 'info') return { fg: colors.info, bg: colors.infoBg };
    return { fg: colors.primary, bg: colors.primaryLight };
  };

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];

    // 1. Pengingat tugas — hanya untuk peran yang memang memegang tugas harian itu.
    if (role === 'KEPALA_SPPG' || role === 'PETUGAS_LAPANGAN') {
      const laporanHariIni = laporanInScope.find((l) => l.tanggal === today);
      if (!laporanHariIni || laporanHariIni.status === 'draft') {
        items.push({
          id: 'r-laporan',
          kind: 'tugas',
          icon: 'file-text',
          tone: 'warning',
          badge: 'TUGAS HARI INI',
          title: 'Laporan produksi hari ini belum diisi',
          body: 'Lengkapi jumlah porsi, menu, dan dokumentasi produksi sebelum tutup shift.',
          timestamp: `${today} 06:00`,
          onPress: () => navigation.navigate('Laporan'),
        });
      }

      const checklistHariIni = checklistInScope.find((c) => c.tanggal === today);
      if (!checklistHariIni || checklistHariIni.items.some((i) => i.status === null)) {
        items.push({
          id: 'r-checklist',
          kind: 'tugas',
          icon: 'check-square',
          tone: 'warning',
          badge: 'TUGAS HARI INI',
          title: 'Checklist harian belum lengkap',
          body: 'Masih ada item checklist dapur yang belum ditandai hari ini.',
          timestamp: `${today} 06:05`,
          onPress: () => navigation.navigate('Checklist'),
        });
      }

      const staffAktif = usersInScope.filter((u) => u.role === 'PETUGAS_LAPANGAN' && u.statusAktif);
      const belumHadir = staffAktif.filter(
        (u) => !presensiInScope.some((p) => p.userId === u.id && p.tanggal === today && p.status === 'hadir'),
      );
      if (belumHadir.length > 0) {
        items.push({
          id: 'r-presensi',
          kind: 'tugas',
          icon: 'user-x',
          tone: 'info',
          badge: 'KEHADIRAN',
          title: `${belumHadir.length} staf belum presensi`,
          body: belumHadir
            .slice(0, 3)
            .map((u) => u.nama)
            .join(', ') + (belumHadir.length > 3 ? `, +${belumHadir.length - 3} lainnya` : ''),
          timestamp: `${today} 07:00`,
          onPress: () => navigation.navigate('Presensi'),
        });
      }
    }

    // 2. Alert operasional — sumber utama notifikasi darurat.
    alertInScope.forEach((a) => {
      items.push({
        id: `a-${a.id}`,
        kind: 'alert',
        icon: a.tingkat === 'emergency' ? 'alert-octagon' : a.tingkat === 'perhatian' ? 'alert-triangle' : 'info',
        tone: a.tingkat === 'emergency' ? 'danger' : a.tingkat === 'perhatian' ? 'warning' : 'info',
        badge: a.tingkat === 'emergency' ? 'DARURAT' : a.tingkat.toUpperCase(),
        title: a.judul,
        body: a.deskripsi,
        timestamp: a.timestamp,
        meta:
          a.statusTindakLanjut === 'selesai'
            ? 'Sudah ditutup'
            : a.statusTindakLanjut === 'ditindaklanjuti'
              ? 'Sedang ditindaklanjuti'
              : 'Belum ditindaklanjuti',
        onPress: () => navigation.navigate('AlertDetail', { alertId: a.id }),
      });
    });

    // 3. Broadcast komando dari Kepala SPPG / Polres / Polda.
    broadcastInScope.forEach((b) => {
      items.push({
        id: `b-${b.id}`,
        kind: 'komando',
        icon: 'radio',
        tone: b.tingkat === 'darurat' ? 'danger' : b.tingkat === 'penting' ? 'primary' : 'info',
        badge: `ARAHAN ${b.tingkat.toUpperCase()}`,
        title: b.judul,
        body: b.isi,
        timestamp: b.timestamp,
        meta: `${b.pengirimNama} • target: ${b.targetRole === 'semua' || !b.targetRole ? 'seluruh staf' : b.targetRole}`,
        onPress: () => navigation.navigate('Broadcast'),
      });
    });

    return items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }, [role, today, laporanInScope, checklistInScope, presensiInScope, usersInScope, alertInScope, broadcastInScope, navigation]);

  const counts = useMemo(
    () => ({
      semua: feed.length,
      tugas: feed.filter((f) => f.kind === 'tugas').length,
      alert: feed.filter((f) => f.kind === 'alert').length,
      komando: feed.filter((f) => f.kind === 'komando').length,
    }),
    [feed],
  );

  const perluTindakan = feed.filter(
    (f) => f.kind === 'tugas' || (f.kind === 'alert' && f.meta === 'Belum ditindaklanjuti'),
  ).length;

  const visible = filter === 'semua' ? feed : feed.filter((f) => f.kind === filter);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Ringkasan inbox */}
      <Card variant="accent" style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.bellWrap, { backgroundColor: perluTindakan > 0 ? colors.dangerBg : colors.successBg }]}>
              <Feather
                name={perluTindakan > 0 ? 'bell' : 'bell-off'}
                size={18}
                color={perluTindakan > 0 ? colors.danger : colors.success}
                strokeWidth={iconStrokeWidth}
              />
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                {perluTindakan > 0 ? `${perluTindakan} butuh tindakan` : 'Semua terkendali'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {counts.semua} notifikasi tercatat pada unit Anda
              </Text>
            </View>
          </View>
          <Pill
            label={perluTindakan > 0 ? 'PERLU AKSI' : 'AMAN'}
            tone={perluTindakan > 0 ? 'danger' : 'success'}
          />
        </View>

        <View style={styles.miniStatRow}>
          {(['tugas', 'alert', 'komando'] as FeedKind[]).map((k) => (
            <View key={k} style={[styles.miniStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: isDark ? colors.gold : colors.primary }}>{counts[k]}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>{KIND_LABEL[k]}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['semua', 'tugas', 'alert', 'komando'] as const).map((k) => {
          const active = filter === k;
          return (
            <Pressable
              key={k}
              onPress={() => setFilter(k)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: active ? colors.textInverse : colors.text }}>
                {KIND_LABEL[k]} ({counts[k]})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle style={{ marginBottom: 0 }}>
        {filter === 'semua' ? 'Semua Notifikasi' : `Notifikasi ${KIND_LABEL[filter]}`}
      </SectionTitle>

      {visible.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="Tidak Ada Notifikasi"
          body={filter === 'semua' ? 'Belum ada tugas tertunda, alert, atau arahan komando.' : `Belum ada notifikasi kategori ${KIND_LABEL[filter]}.`}
        />
      ) : (
        visible.map((item) => {
          const tone = toneColor(item.tone);
          return (
            <Card key={item.id} onPress={item.onPress} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                  <Feather name={item.icon} size={17} color={tone.fg} strokeWidth={iconStrokeWidth} />
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: 9.5, fontWeight: '900', color: tone.fg, letterSpacing: 0.4 }}>
                      {item.badge}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>{relativeTime(item.timestamp)}</Text>
                  </View>

                  <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{item.title}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }} numberOfLines={3}>
                    {item.body}
                  </Text>

                  {!!item.meta && (
                    <Text style={{ fontSize: 10.5, color: tone.fg, fontWeight: '700', marginTop: 1 }}>{item.meta}</Text>
                  )}
                </View>

                {!!item.onPress && (
                  <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ alignSelf: 'center' }} />
                )}
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 110 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bellWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  miniStatRow: { flexDirection: 'row', gap: 6 },
  miniStat: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
