import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, IconButton, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import HppBadge from '../components/HppBadge';
import { resolveHpp } from '../utils/hpp';
import { useScopedData } from '../hooks';
import { scopeDistribusi, scopeMenuHarianPlan, scopeSekolah, ROLE_PERMISSIONS } from '../utils/scope';
import { DistribusiRute } from '../types';
import { MASTER_MENU_CATALOG } from '../mock/masterMenu';

const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_LABEL: Record<DistribusiRute['status'], string> = {
  menunggu: 'Menunggu',
  dalam_perjalanan: 'Dalam Perjalanan',
  tiba: 'Terkirim',
  kendala: 'Kendala',
};
const STATUS_TONE: Record<DistribusiRute['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  menunggu: 'neutral',
  dalam_perjalanan: 'info',
  tiba: 'success',
  kendala: 'danger',
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function toDateStr(year: number, monthIdx: number, day: number): string {
  return `${year}-${pad2(monthIdx + 1)}-${pad2(day)}`;
}
function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatFullDateIndo(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const dayName = days[d.getDay()];
  const dayNum = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

export default function MenuKalenderScreen() {
  const { role, currentSppg, sekolahList, distribusiList, menuHarianPlanList, setMenuForDate, masterMenuList, costPerMeal } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const isSupervisor = !!role && ROLE_PERMISSIONS[role].isViewOnly;
  const canEdit = !!role && ROLE_PERMISSIONS[role].canManageMenu;

  const [selectedSppgId, setSelectedSppgId] = useState<string>(currentSppg?.id ?? sppgInScope[0]?.id ?? '');
  const activeSppgId = isSupervisor ? selectedSppgId : currentSppg?.id ?? sppgInScope[0]?.id ?? '';

  const initialToday = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(initialToday.getFullYear(), initialToday.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr());
  const [editing, setEditing] = useState(false);
  const [menuDraft, setMenuDraft] = useState('');
  const [kategoriDraft, setKategoriDraft] = useState('');
  const [fotoDraft, setFotoDraft] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const monthIdx = viewDate.getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const todayStr = todayDateStr();

  const isSelectedWeekend = useMemo(() => {
    if (!selectedDate) return false;
    const d = new Date(selectedDate);
    const day = d.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }, [selectedDate]);

  const sekolahInScope = useMemo(
    () => scopeSekolah(sppgInScope, sekolahList).filter((s) => s.sppgId === activeSppgId),
    [sppgInScope, sekolahList, activeSppgId],
  );
  const menuInScope = useMemo(
    () => scopeMenuHarianPlan(sppgInScope, menuHarianPlanList).filter((m) => m.sppgId === activeSppgId),
    [sppgInScope, menuHarianPlanList, activeSppgId],
  );
  const distribusiInScope = useMemo(
    () => scopeDistribusi(sppgInScope, distribusiList).filter((d) => d.sppgId === activeSppgId),
    [sppgInScope, distribusiList, activeSppgId],
  );

  const planDatesWithMenu = useMemo(() => new Set(menuInScope.map((m) => m.tanggal)), [menuInScope]);
  const planForSelected = menuInScope.find((m) => m.tanggal === selectedDate);
  const distribusiForSelected = distribusiInScope.filter((d) => d.tanggal === selectedDate);

  useEffect(() => {
    setMenuDraft(planForSelected?.menu ?? '');
    setKategoriDraft(planForSelected?.kategoriGizi ?? '');
    setFotoDraft(planForSelected?.fotoMenu ?? null);
    setEditing(false);
  }, [selectedDate, activeSppgId]);

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(year, monthIdx, d));

  const goPrevMonth = () => setViewDate(new Date(year, monthIdx - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, monthIdx + 1, 1));

  const handleSaveMenu = () => {
    if (!activeSppgId || !menuDraft.trim()) return;
    setMenuForDate(activeSppgId, selectedDate, menuDraft.trim(), kategoriDraft.trim() || undefined, fotoDraft || undefined);
    setEditing(false);
  };

  if (!role) return null;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle style={{ marginBottom: 0 }}>Kalender Perencanaan Menu</SectionTitle>

      {isSupervisor && (
        <DropdownPicker
          label="SPPG"
          icon="home"
          value={selectedSppgId}
          options={sppgInScope.map((s) => ({ label: s.nama, value: s.id }))}
          onSelect={setSelectedSppgId}
        />
      )}

      {/* Calendar Card — Modern Rounded & Responsive */}
      <Card style={{ gap: spacing.md, padding: 14 }}>
        {/* Month Header Nav */}
        <View style={styles.monthHeader}>
          <IconButton icon="chevron-left" onPress={goPrevMonth} tone="neutral" size={20} />
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: fontSize.md }}>
              {MONTH_LABELS[monthIdx]} {year}
            </Text>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Hari Belajar: Sen - Jum • Libur: Sab & Min
            </Text>
          </View>
          <IconButton icon="chevron-right" onPress={goNextMonth} tone="neutral" size={20} />
        </View>

        {/* Weekday Names Header */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((w, wIdx) => {
            const isWeekendHeader = wIdx === 0 || wIdx === 6;
            return (
              <View key={w} style={styles.weekdayCol}>
                <Text
                  style={[
                    styles.weekdayLabel,
                    {
                      color: isWeekendHeader ? '#EF4444' : colors.textMuted,
                      fontSize: fontSize.xs,
                      fontWeight: isWeekendHeader ? '800' : '700',
                    },
                  ]}
                >
                  {w}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Date Matrix Grid */}
        <View style={styles.grid}>
          {cells.map((dateStr, idx) => {
            if (!dateStr) return <View key={`empty-${idx}`} style={styles.cell} />;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasMenu = planDatesWithMenu.has(dateStr);
            const dayNum = Number(dateStr.slice(8, 10));
            const dayOfWeek = new Date(dateStr).getDay();
            const isWeekendCell = dayOfWeek === 0 || dayOfWeek === 6;

            return (
              <Pressable key={dateStr} onPress={() => setSelectedDate(dateStr)} style={styles.cell}>
                <View
                  style={[
                    styles.cellInner,
                    isSelected && {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                    !isSelected && isToday && {
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                    !isSelected && !isToday && isWeekendCell && {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.06)',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? '#FFFFFF'
                        : isWeekendCell
                        ? '#EF4444'
                        : isToday
                        ? colors.primary
                        : colors.text,
                      fontWeight: isSelected || isToday ? '900' : '600',
                      fontSize: fontSize.sm,
                    }}
                  >
                    {dayNum}
                  </Text>
                  {hasMenu && (
                    <View
                      style={[
                        styles.menuDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : colors.success },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Calendar Legend Bar */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Menu Terjadwal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Libur Sekolah (Sab/Min)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendRing, { borderColor: colors.primary }]} />
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Hari Ini</Text>
          </View>
        </View>
      </Card>

      {/* Selected Date Detail Card */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
              {formatFullDateIndo(selectedDate)}
            </Text>
            <Text style={{ fontSize: 11, color: isSelectedWeekend ? '#EF4444' : colors.textMuted, fontWeight: '600', marginTop: 2 }}>
              {isSelectedWeekend ? 'Hari Libur Sekolah MBG (Akhir Pekan)' : 'Hari Belajar Sekolah Aktif'}
            </Text>
          </View>
          <Pill
            label={planForSelected ? 'Ada Menu' : isSelectedWeekend ? 'Libur' : 'Belum Ada'}
            tone={planForSelected ? 'success' : isSelectedWeekend ? 'warning' : 'neutral'}
          />
        </View>

        {/* Weekend Informational Banner (If selected date is Saturday or Sunday) */}
        {isSelectedWeekend && !planForSelected && !editing && (
          <View style={[styles.weekendBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', borderRadius: radius.md, borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="coffee" size={16} color="#EF4444" />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: '#EF4444' }}>
                Hari Libur KBM Sekolah (Tidak Ada MBG Otomatis)
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Dapur SPPG tidak memproduksi makanan secara otomatis pada hari Sabtu & Minggu. Jika sekolah memiliki kegiatan ekstrakurikuler atau agenda khusus, Anda dapat menjadwalkan menu secara manual.
            </Text>
            {canEdit && (
              <PrimaryButton
                label="+ Tambah Menu Manual Hari Libur Ini"
                icon="plus-circle"
                variant="secondary"
                onPress={() => setEditing(true)}
                style={{ marginTop: 4 }}
              />
            )}
          </View>
        )}

        {editing ? (
          <View style={{ gap: spacing.sm, marginTop: 4 }}>
            <DropdownPicker
              label="Pilih dari Master Katalog Menu (Opsional)"
              icon="book-open"
              value={masterMenuList.find((m) => m.nama === menuDraft)?.id ?? ''}
              options={[
                { label: '-- Ketik Manual Menu Custom --', value: '' },
                ...masterMenuList.map((m) => ({ label: m.nama, value: m.id })),
              ]}
              onSelect={(val) => {
                const found = masterMenuList.find((m) => m.id === val);
                if (found) {
                  setMenuDraft(found.nama);
                  setKategoriDraft(found.kategoriGizi);
                  setFotoDraft(found.fotoMenu);
                }
              }}
            />

            <Input
              label="Nama Paket Menu"
              value={menuDraft}
              onChangeText={setMenuDraft}
              placeholder="Tuliskan nama paket menu makanan"
            />
            <Input
              label="Kategori Gizi & Nutrisi"
              value={kategoriDraft}
              onChangeText={setKategoriDraft}
              placeholder="Contoh: Karbohidrat, Protein, Sayur, Buah, Susu"
            />

            {fotoDraft && (
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Pratinjau Foto Menu:</Text>
                <Image source={{ uri: fotoDraft }} style={{ width: '100%', height: 120, borderRadius: radius.md }} resizeMode="cover" />
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <PrimaryButton label="Batal" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Simpan Menu" onPress={handleSaveMenu} disabled={!menuDraft.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <>
            {planForSelected ? (
              <View style={{ gap: spacing.xs, marginTop: 4 }}>
                {planForSelected.fotoMenu && (
                  <Image source={{ uri: planForSelected.fotoMenu }} style={{ width: '100%', height: 160, borderRadius: radius.md }} resizeMode="cover" />
                )}
                {isSelectedWeekend && (
                  <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                    <Pill label="Jadwal Khusus Akhir Pekan (Manual)" tone="warning" />
                  </View>
                )}
                <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '800', marginTop: 2 }}>
                  {planForSelected.menu}
                </Text>
                {planForSelected.kategoriGizi && (
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                    Komposisi: {planForSelected.kategoriGizi}
                  </Text>
                )}

                <HppBadge info={resolveHpp(planForSelected.menu, masterMenuList, costPerMeal)} variant="block" />
                {canEdit && (
                  <PrimaryButton
                    label="Ubah Menu Ini"
                    icon="edit-2"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => setEditing(true)}
                    style={{ marginTop: 6 }}
                  />
                )}
              </View>
            ) : !isSelectedWeekend ? (
              <View style={{ gap: 8, paddingVertical: 4 }}>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
                  Belum ada menu yang direncanakan untuk tanggal hari kerja ini.
                </Text>
                {canEdit && (
                  <PrimaryButton
                    label="+ Rencanakan Menu Tanggal Ini"
                    icon="plus-circle"
                    variant="primary"
                    fullWidth={false}
                    onPress={() => setEditing(true)}
                  />
                )}
              </View>
            ) : null}
          </>
        )}
      </Card>

      {/* Affiliated Schools Delivery Status */}
      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Sekolah Afiliasi & Status Pengiriman</SectionTitle>
        {sekolahInScope.length === 0 ? (
          <EmptyState icon="home" title="Belum Ada Sekolah" body="Belum ada sekolah terdaftar untuk SPPG ini." />
        ) : (
          sekolahInScope.map((sekolah) => {
            const rute = distribusiForSelected.find((d) => d.sekolahId === sekolah.id);
            return (
              <View key={sekolah.id} style={[styles.sekolahCard, { backgroundColor: colors.background, borderRadius: radius.md, padding: 10 }]}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  {sekolah.fotoSekolah ? (
                    <Image source={{ uri: sekolah.fotoSekolah }} style={{ width: 52, height: 52, borderRadius: radius.sm }} />
                  ) : (
                    <View style={{ width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="home" size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }} numberOfLines={1}>
                      {sekolah.nama}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>
                      Target: {sekolah.jumlahSiswa.toLocaleString('id-ID')} siswa
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10 }} numberOfLines={1}>
                      {sekolah.alamat}
                    </Text>
                  </View>
                  <Pill label={rute ? STATUS_LABEL[rute.status] : isSelectedWeekend ? 'Libur' : 'Menunggu'} tone={rute ? STATUS_TONE[rute.status] : 'neutral'} />
                </View>

                {planForSelected?.fotoMenu && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Image source={{ uri: planForSelected.fotoMenu }} style={{ width: 32, height: 32, borderRadius: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>Paket Menu MBG:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                        {planForSelected.menu}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekdayRow: { flexDirection: 'row', paddingVertical: 4 },
  weekdayCol: { width: '14.2857%', alignItems: 'center', justifyContent: 'center' },
  weekdayLabel: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  menuDot: { width: 4, height: 4, borderRadius: 2 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendRing: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  weekendBanner: { padding: 12, gap: 6, borderWidth: 1 },
  sekolahCard: { marginBottom: 6 },
});
