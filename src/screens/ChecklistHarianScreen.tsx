import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, EmptyState, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { CHECKLIST_CATALOG } from '../data/checklistHarian';
import { ChecklistItem, ChecklistKategori } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';
import { addToOfflineQueue } from '../utils/offlineQueue';

const KATEGORI_LABEL: Record<ChecklistKategori, string> = {
  kebersihan: 'Kebersihan & Sanitasi',
  peralatan: 'Peralatan & Container',
  keamanan_pangan: 'Keamanan Pangan & Suhu',
};
const KATEGORI_ORDER: ChecklistKategori[] = ['kebersihan', 'peralatan', 'keamanan_pangan'];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function freshItems(): ChecklistItem[] {
  return CHECKLIST_CATALOG.map((c) => ({ ...c, status: null, catatan: null, foto: null }));
}

export default function ChecklistHarianScreen() {
  const { role, currentUser, currentSppg, submitChecklist } = useApp();
  const { checklistInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

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
  const [items, setItems] = useState<ChecklistItem[]>(existing ? existing.items : freshItems());
  const [submitted, setSubmitted] = useState(false);

  // Modal State for Adding Custom Checklist Item
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemKategori, setNewItemKategori] = useState<ChecklistKategori>('kebersihan');
  const [newItemKritis, setNewItemKritis] = useState(false);

  React.useEffect(() => {
    const found = checklistInScope.find((c) => c.tanggal === selectedDate);
    setItems(found ? found.items : freshItems());
    setSubmitted(false);
  }, [selectedDate, checklistInScope]);

  if (!role || !currentUser || !currentSppg) return null;

  const isPastDate = selectedDate !== today;
  const readOnly = ROLE_PERMISSIONS[role].isViewOnly || isPastDate;
  const checklistId = existing?.id ?? `CHK-${currentSppg.id}-${selectedDate}`;

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
      status: null,
      catatan: null,
      foto: null,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
    setNewItemKritis(false);
    setShowAddModal(false);
  };

  const invalidItems = items.filter((i) => i.status === 'tidak' && !i.catatan?.trim());
  const allAnswered = items.every((i) => i.status !== null);
  const completedCount = items.filter((i) => i.status === 'ya').length;

  const handleSubmit = async () => {
    if (invalidItems.length > 0) {
      Alert.alert('Catatan Wajib Diisi', 'Isi catatan untuk setiap item yang dijawab "Tidak".');
      return;
    }
    const kritisGagal = items.filter((i) => i.levelKritis && i.status === 'tidak');
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
              CHECKLIST HARIAN KEBERSIHAN & HIGIENE
            </Text>
          </View>
          <Pill label={`${completedCount}/${items.length} Selesai`} tone={allAnswered ? 'success' : 'warning'} />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          Panduan pemeriksaan higiene personel, sanitasi dapur, & sterilitas ompreng sebelum distribusi.
        </Text>
      </Card>

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
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Feather name="calendar" size={13} color={isSelected ? colors.textInverse : colors.textMuted} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isSelected ? colors.textInverse : colors.text }}>
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
        const kategoriItems = items.filter((i) => i.kategori === kategori);
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
                    isDone && { borderColor: colors.success, backgroundColor: isDark ? 'rgba(13,148,136,0.08)' : '#F0FDF4' },
                    isFailed && { borderColor: colors.danger, backgroundColor: isDark ? 'rgba(225,29,72,0.08)' : '#FFF1F2' },
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
                      label="Catatan Kondisi (Wajib diisi bila Tidak)"
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
        <ScrollView style={{ gap: spacing.md }} keyboardShouldPersistTaps="handled">
          <DropdownPicker
            label="Kategori Checklist"
            value={newItemKategori}
            options={[
              { label: 'Kebersihan & Sanitasi', value: 'kebersihan' },
              { label: 'Peralatan & Container', value: 'peralatan' },
              { label: 'Keamanan Pangan & Suhu', value: 'keamanan_pangan' },
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
  todoCard: { padding: 12, borderWidth: 1, gap: 8 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todoText: { fontWeight: '700', flex: 1 },
  todoDoneText: { textDecorationLine: 'line-through', opacity: 0.75 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
