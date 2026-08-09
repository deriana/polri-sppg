import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, IconButton, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeDistribusi, scopeMenuHarianPlan, scopeSekolah, ROLE_PERMISSIONS } from '../utils/scope';
import { DistribusiRute } from '../types';

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

export default function MenuKalenderScreen() {
  const { role, currentSppg, sekolahList, distribusiList, menuHarianPlanList, setMenuForDate } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();

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

  const year = viewDate.getFullYear();
  const monthIdx = viewDate.getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const todayStr = todayDateStr();

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

  // Reset the edit draft whenever the selected date or active SPPG changes —
  // never when menuHarianPlanList itself changes (that would clobber a draft
  // right after handleSaveMenu commits it).
  useEffect(() => {
    setMenuDraft(planForSelected?.menu ?? '');
    setKategoriDraft(planForSelected?.kategoriGizi ?? '');
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeSppgId]);

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(year, monthIdx, d));

  const goPrevMonth = () => setViewDate(new Date(year, monthIdx - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, monthIdx + 1, 1));

  const handleSaveMenu = () => {
    if (!activeSppgId || !menuDraft.trim()) return;
    setMenuForDate(activeSppgId, selectedDate, menuDraft.trim(), kategoriDraft.trim() || undefined);
    setEditing(false);
  };

  if (!role) return null;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle style={{ marginBottom: 0 }}>Kalender Menu</SectionTitle>

      {isSupervisor && (
        <DropdownPicker
          label="SPPG"
          icon="home"
          value={selectedSppgId}
          options={sppgInScope.map((s) => ({ label: s.nama, value: s.id }))}
          onSelect={setSelectedSppgId}
        />
      )}

      <Card style={{ gap: spacing.sm }}>
        <View style={styles.monthHeader}>
          <IconButton icon="chevron-left" onPress={goPrevMonth} tone="neutral" size={18} />
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.md }}>
            {MONTH_LABELS[monthIdx]} {year}
          </Text>
          <IconButton icon="chevron-right" onPress={goNextMonth} tone="neutral" size={18} />
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((w) => (
            <Text key={w} style={[styles.weekdayLabel, { color: colors.textMuted, fontSize: fontSize.xs }]}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((dateStr, idx) => {
            if (!dateStr) return <View key={`empty-${idx}`} style={styles.cell} />;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasMenu = planDatesWithMenu.has(dateStr);
            const dayNum = Number(dateStr.slice(8, 10));
            return (
              <Pressable key={dateStr} onPress={() => setSelectedDate(dateStr)} style={styles.cell}>
                <View
                  style={[
                    styles.cellInner,
                    { borderRadius: radius.md },
                    isSelected && { backgroundColor: colors.primary },
                    !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.textInverse : colors.text,
                      fontWeight: isToday ? '800' : '600',
                      fontSize: fontSize.sm,
                    }}
                  >
                    {dayNum}
                  </Text>
                  {hasMenu && (
                    <View style={[styles.menuDot, { backgroundColor: isSelected ? colors.textInverse : colors.success }]} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Menu — {selectedDate}</SectionTitle>
        {editing ? (
          <View style={{ gap: spacing.sm }}>
            <Input label="Menu" value={menuDraft} onChangeText={setMenuDraft} placeholder="Tuliskan menu untuk tanggal ini" />
            <Input
              label="Kategori Gizi (opsional)"
              value={kategoriDraft}
              onChangeText={setKategoriDraft}
              placeholder="Contoh: Karbohidrat, Protein, Sayur, Buah"
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <PrimaryButton label="Batal" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Simpan" onPress={handleSaveMenu} disabled={!menuDraft.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <>
            {planForSelected ? (
              <>
                <Text style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '700' }}>{planForSelected.menu}</Text>
                {planForSelected.kategoriGizi && (
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{planForSelected.kategoriGizi}</Text>
                )}
              </>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>Belum ada menu direncanakan.</Text>
            )}
            {canEdit && (
              <PrimaryButton label="Ubah Menu" icon="edit-2" variant="secondary" fullWidth={false} onPress={() => setEditing(true)} />
            )}
          </>
        )}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionTitle style={{ marginBottom: 0 }}>Status Pengiriman per Sekolah</SectionTitle>
        {sekolahInScope.length === 0 ? (
          <EmptyState icon="home" title="Belum Ada Sekolah" body="Belum ada sekolah terdaftar untuk SPPG ini." />
        ) : (
          sekolahInScope.map((sekolah) => {
            const rute = distribusiForSelected.find((d) => d.sekolahId === sekolah.id);
            return (
              <View key={sekolah.id} style={[styles.sekolahRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }} numberOfLines={1}>
                    {sekolah.nama}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                    {sekolah.jumlahSiswa} siswa
                  </Text>
                </View>
                <Pill label={rute ? STATUS_LABEL[rute.status] : 'Belum Dijadwalkan'} tone={rute ? STATUS_TONE[rute.status] : 'neutral'} />
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
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { width: '14.2857%', textAlign: 'center', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellInner: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
  menuDot: { width: 5, height: 5, borderRadius: 2.5 },
  sekolahRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 0.5 },
});
