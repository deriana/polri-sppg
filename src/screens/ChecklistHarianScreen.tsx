import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import {
  CHECKLIST_CATALOG,
  CHECKLIST_KATEGORI_LABEL as KATEGORI_LABEL,
  KATEGORI_CHECKLIST_ORDER as KATEGORI_ORDER,
} from '../mock/checklistHarian';
import { ChecklistItem, ChecklistKategori, Role } from '../types';
import { ROLE_LABEL, ROLE_PERMISSIONS } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';
import { addToOfflineQueue } from '../utils/offlineQueue';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function freshItems(userRole?: Role | null): ChecklistItem[] {
  if (!userRole || userRole === 'KEPALA_SPPG' || userRole === 'SUPERVISOR_POLRES' || userRole === 'SUPERVISOR_POLDA') {
    return CHECKLIST_CATALOG.map((c) => ({ ...c, status: null, catatan: null, foto: null }));
  }
  const roleItems = CHECKLIST_CATALOG.filter((c) => c.targetRole === userRole);
  if (roleItems.length === 0) {
    return CHECKLIST_CATALOG.map((c) => ({ ...c, status: null, catatan: null, foto: null }));
  }
  return roleItems.map((c) => ({ ...c, status: null, catatan: null, foto: null }));
}

export default function ChecklistHarianScreen() {
  const { role, currentUser, currentSppg, submitChecklist } = useApp();
  const { checklistInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const isKepala = role === 'KEPALA_SPPG' || role === 'SUPERVISOR_POLRES' || role === 'SUPERVISOR_POLDA';
  const [divisionFilter, setDivisionFilter] = useState<string>('semua');

  const today = todayDate();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Generate 5 days range
  const dateOptions = useMemo(() => {
    const dates: { dateStr: string; label: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Hari Ini' : i === 1 ? 'Kemarin' : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      dates.push({ dateStr, label });
    }
    return dates;
  }, []);

  const existing = checklistInScope.find((c) => c.tanggal === selectedDate);
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (existing && existing.items.length > 0) {
      return existing.items;
    }
    return freshItems(role);
  });
  const [submitted, setSubmitted] = useState(false);

  // Modal State for Adding Custom Checklist Item
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemKategori, setNewItemKategori] = useState<ChecklistKategori>('kebersihan');
  const [newItemKritis, setNewItemKritis] = useState(false);

  React.useEffect(() => {
    if (existing && existing.items.length > 0) {
      setItems(existing.items);
    } else {
      setItems(freshItems(role));
    }
    setSubmitted(false);
  }, [selectedDate, existing?.id, role]);

  if (!role || !currentUser || !currentSppg) return null;

  const isPastDate = selectedDate !== today;
  const readOnly = ROLE_PERMISSIONS[role].isViewOnly || isPastDate;
  const checklistId = existing?.id ?? `CHK-${currentSppg.id}-${selectedDate}`;

  // Filter items based on active role or division tab
  const displayItems = useMemo(() => {
    if (isKepala) {
      if (divisionFilter === 'semua') return items;
      return items.filter((i) => i.targetRole === divisionFilter);
    }
    // For operational roles: only display items tailored for this role
    return items.filter((i) => !i.targetRole || i.targetRole === role);
  }, [items, role, isKepala, divisionFilter]);

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    if (readOnly) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const attachPhoto = async (id: string, mediaTypes: ('images' | 'videos')[] = ['images']) => {
    const picked = await pickMedia('camera', mediaTypes);
    if (picked) updateItem(id, { foto: picked.uri, fotoMediaType: picked.mediaType });
  };

  const handleAddCustomItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `CHK-CUSTOM-${Date.now()}`,
      kategori: newItemKategori,
      item: newItemText.trim(),
      levelKritis: newItemKritis,
      targetRole: role,
      status: null,
      catatan: null,
      foto: null,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
    setNewItemKritis(false);
    setShowAddModal(false);
  };

  const invalidItems = displayItems.filter((i) => i.status === 'tidak' && !i.catatan?.trim());
  const allAnswered = displayItems.every((i) => i.status !== null);
  const completedCount = displayItems.filter((i) => i.status === 'ya').length;

  const handleSubmit = async () => {
    if (invalidItems.length > 0) {
      Alert.alert('Catatan Wajib Diisi', 'Isi catatan untuk setiap item yang dijawab "Tidak".');
      return;
    }
    const kritisGagal = displayItems.filter((i) => i.levelKritis && i.status === 'tidak');
    const checklist = { id: checklistId, sppgId: currentSppg.id, tanggal: selectedDate, items };
    submitChecklist(checklist);
    await addToOfflineQueue('checklist_harian', checklist);
    setSubmitted(true);
    if (kritisGagal.length > 0) {
      Alert.alert(
        'Checklist Terkirim',
        `Checklist tersimpan. ${kritisGagal.length} item kritis dijawab "Tidak" — alert perhatian otomatis dibuat.`,
      );
    } else {
      Alert.alert('Checklist Terkirim', 'Checklist harian berhasil disimpan.');
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Hero Card */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="check-square" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              {isKepala ? 'CHECKLIST OPERASIONAL SPPG (SEMUA DIVISI)' : `CHECKLIST HARIAN (${ROLE_LABEL[role]?.toUpperCase() || 'STAF'})`}
            </Text>
          </View>
          <Pill label={`${completedCount}/${displayItems.length} Selesai`} tone={allAnswered ? 'success' : 'warning'} />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          {isKepala
            ? 'Monitoring audit kepatuhan SOP harian seluruh divisi (Gizi, Dapur, Packing, Logistik, Sanitasi, Driver).'
            : `Pemeriksaan standar operasional prosedur harian sesuai tanggung jawab jabatan Anda (${ROLE_LABEL[role]}).`}
        </Text>
      </Card>

      {/* Division Selector Tabs for Kepala SPPG */}
      {isKepala && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 2 }}>
          {[
            { id: 'semua', label: 'Semua Divisi' },
            { id: 'AHLI_GIZI', label: 'Ahli Gizi & QC' },
            { id: 'CHEF_UTAMA', label: 'Chef & Cook' },
            { id: 'PEMORSI_PACKING', label: 'Pemorsi & Box' },
            { id: 'PETUGAS_LOGISTIK', label: 'Gudang & FEFO' },
            { id: 'PETUGAS_SANITASI', label: 'Sanitasi & APD' },
            { id: 'DRIVER', label: 'Armada Driver' },
          ].map((div) => {
            const isActive = divisionFilter === div.id;
            return (
              <Pressable
                key={div.id}
                onPress={() => setDivisionFilter(div.id)}
                style={[
                  styles.divisionTab,
                  {
                    backgroundColor: isActive ? (isDark ? colors.gold : colors.accent) : colors.surface,
                    borderColor: isActive ? (isDark ? colors.gold : colors.accent) : colors.border,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: isActive ? (isDark ? '#07101E' : '#FFFFFF') : colors.text }}>
                  {div.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Date History Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: 2 }}>
        {dateOptions.map((opt) => {
          const isSelected = selectedDate === opt.dateStr;
          return (
            <Pressable
              key={opt.dateStr}
              onPress={() => setSelectedDate(opt.dateStr)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: isSelected ? (isDark ? colors.gold : colors.primary) : colors.surface,
                  borderColor: isSelected ? (isDark ? colors.gold : colors.primary) : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Feather name="calendar" size={13} color={isSelected ? (isDark ? '#07101E' : '#FFFFFF') : colors.textMuted} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: isSelected ? (isDark ? '#07101E' : '#FFFFFF') : colors.text }}>
                {opt.label} ({opt.dateStr.slice(8)})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!readOnly && (
        <PrimaryButton
          label="+ Tambah Item Checklist Baru"
          icon="plus-circle"
          variant="secondary"
          onPress={() => setShowAddModal(true)}
        />
      )}

      {KATEGORI_ORDER.map((kategori) => {
        const kategoriItems = displayItems.filter((i) => i.kategori === kategori);
        if (kategoriItems.length === 0) return null;

        return (
          <View key={kategori} style={{ gap: spacing.sm }}>
            <SectionTitle style={{ marginBottom: 0 }}>{KATEGORI_LABEL[kategori]}</SectionTitle>
            {kategoriItems.map((item) => {
              const isDone = item.status === 'ya';
              const isFailed = item.status === 'tidak';
              const invalid = isFailed && !item.catatan?.trim();

              return (
                <Card
                  key={item.id}
                  style={[
                    styles.todoCard,
                    isDone && { borderColor: colors.success },
                    isFailed && { borderColor: colors.danger },
                  ]}
                >
                  <View style={styles.todoRow}>
                    {/* Interactive Checkbox */}
                    <Pressable
                      disabled={readOnly}
                      onPress={() => updateItem(item.id, { status: isDone ? null : 'ya' })}
                      style={[
                        styles.checkbox,
                        { borderColor: isDone ? colors.success : isFailed ? colors.danger : colors.border },
                        isDone && { backgroundColor: colors.success },
                        isFailed && { backgroundColor: colors.danger },
                      ]}
                    >
                      {isDone && <Feather name="check" size={14} color="#FFFFFF" strokeWidth={3} />}
                      {isFailed && <Feather name="x" size={14} color="#FFFFFF" strokeWidth={3} />}
                    </Pressable>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          styles.todoText,
                          { color: colors.text, fontSize: fontSize.sm },
                          isDone && styles.todoDoneText,
                        ]}
                      >
                        {item.item}
                      </Text>
                      {item.levelKritis && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Feather name="alert-triangle" size={11} color={colors.warning} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: colors.warning }}>ITEM KRITIS FOOD SAFETY</Text>
                        </View>
                      )}
                    </View>

                    {/* Quick Toggle Buttons */}
                    {!readOnly && (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable
                          onPress={() => updateItem(item.id, { status: 'ya' })}
                          style={[styles.smallBtn, { backgroundColor: isDone ? colors.success : colors.background, borderColor: colors.border }]}
                        >
                          <Feather name="check" size={14} color={isDone ? '#fff' : colors.textMuted} />
                        </Pressable>
                        <Pressable
                          onPress={() => updateItem(item.id, { status: 'tidak' })}
                          style={[styles.smallBtn, { backgroundColor: isFailed ? colors.danger : colors.background, borderColor: colors.border }]}
                        >
                          <Feather name="x" size={14} color={isFailed ? '#fff' : colors.textMuted} />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Mandatory Note when "Tidak" */}
                  {isFailed && (
                    <Input
                      label="Catatan Kendala (Wajib diisi bila Tidak)"
                      value={item.catatan ?? ''}
                      onChangeText={(t) => updateItem(item.id, { catatan: t })}
                      placeholder="Jelaskan kendala/temuan..."
                      editable={!readOnly}
                      error={invalid ? 'Catatan wajib diisi' : undefined}
                    />
                  )}
                </Card>
              );
            })}
          </View>
        );
      })}

      {!readOnly && <PrimaryButton label="Kirim Checklist Harian" icon="send" onPress={handleSubmit} />}

      {/* Modal Add Custom Item */}
      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Item Checklist Baru">
        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          <DropdownPicker
            label="Kategori Checklist"
            value={newItemKategori}
            options={[
              { label: 'Keamanan Pangan & Uji Gizi', value: 'keamanan_pangan' },
              { label: 'Dapur & Pengolahan Masakan', value: 'produksi_masak' },
              { label: 'Pemorsian & Kesiapan Box', value: 'pemorsian_packing' },
              { label: 'Penerimaan Pasokan & FEFO', value: 'gudang_logistik' },
              { label: 'Sanitasi, Dishwasher & APD', value: 'kebersihan' },
              { label: 'Kelayakan Armada & Distribusi', value: 'distribusi_driver' },
              { label: 'Peralatan & Fasilitas', value: 'peralatan' },
            ]}
            onSelect={(val) => setNewItemKategori(val as any)}
            icon="folder"
          />

          <Input
            label="Nama Item Pemeriksaan"
            icon="check-square"
            value={newItemText}
            onChangeText={setNewItemText}
            placeholder="Contoh: Pemeriksaan Kebersihan Lampu Perangkap Lalat"
          />

          <Pressable
            onPress={() => setNewItemKritis(!newItemKritis)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
          >
            <View style={[styles.checkbox, { borderColor: newItemKritis ? colors.warning : colors.border }, newItemKritis && { backgroundColor: colors.warning }]}>
              {newItemKritis && <Feather name="check" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: fontSize.xs, color: colors.text, fontWeight: '700' }}>
              Tandai sebagai Item Kritis (Critical Control Point)
            </Text>
          </Pressable>

          <PrimaryButton label="Tambahkan ke Checklist" icon="plus" onPress={handleAddCustomItem} style={{ marginTop: 12 }} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  divisionTab: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  todoCard: { padding: 12, borderWidth: 1, gap: 8 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todoText: { fontWeight: '700', flex: 1 },
  todoDoneText: { textDecorationLine: 'line-through', opacity: 0.75 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
