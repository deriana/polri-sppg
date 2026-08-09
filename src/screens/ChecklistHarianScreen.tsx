import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { CHECKLIST_CATALOG } from '../data/checklistHarian';
import { ChecklistItem, ChecklistKategori } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { pickMedia } from '../utils/pickImage';
import { addToOfflineQueue } from '../utils/offlineQueue';

const KATEGORI_LABEL: Record<ChecklistKategori, string> = {
  kebersihan: 'Kebersihan',
  peralatan: 'Peralatan',
  keamanan_pangan: 'Keamanan Pangan',
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
  const { colors, spacing, fontSize, iconStrokeWidth, radius } = useTheme();
  const today = todayDate();

  const existing = checklistInScope.find((c) => c.tanggal === today);
  const [items, setItems] = useState<ChecklistItem[]>(existing ? existing.items : freshItems());
  const [submitted, setSubmitted] = useState(false);

  if (!role || !currentUser || !currentSppg) return null;

  const readOnly = ROLE_PERMISSIONS[role].isViewOnly;
  const checklistId = existing?.id ?? `CHK-${currentSppg.id}-${today}`;

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const attachPhoto = async (id: string, mediaTypes: ('images' | 'videos')[] = ['images']) => {
    const picked = await pickMedia('camera', mediaTypes);
    if (picked) updateItem(id, { foto: picked.uri, fotoMediaType: picked.mediaType });
  };

  const invalidItems = items.filter((i) => i.status === 'tidak' && !i.catatan?.trim());
  const allAnswered = items.every((i) => i.status !== null);

  const handleSubmit = async () => {
    if (invalidItems.length > 0) {
      Alert.alert('Catatan Wajib Diisi', 'Isi catatan untuk setiap item yang dijawab "Tidak".');
      return;
    }
    const kritisGagal = items.filter((i) => i.levelKritis && i.status === 'tidak');
    const checklist = { id: checklistId, sppgId: currentSppg.id, tanggal: today, items };
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

  if (readOnly && !existing) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="check-square" title="Belum Ada Checklist" body="Checklist harian untuk SPPG ini belum diisi hari ini." />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SectionTitle
        action={
          allAnswered ? <Pill label="Lengkap" tone="success" /> : <Pill label={`${items.filter((i) => i.status !== null).length}/${items.length}`} tone="warning" />
        }
      >
        Checklist Harian
      </SectionTitle>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: -8 }}>
        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      {KATEGORI_ORDER.map((kategori) => {
        const kategoriItems = items.filter((i) => i.kategori === kategori);
        return (
          <View key={kategori} style={{ gap: spacing.sm }}>
            <Text style={[styles.kategoriTitle, { color: colors.text, fontSize: fontSize.md }]}>{KATEGORI_LABEL[kategori]}</Text>
            {kategoriItems.map((item) => {
              const invalid = item.status === 'tidak' && !item.catatan?.trim();
              return (
                <Card key={item.id} style={{ gap: spacing.sm }}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemLabel, { color: colors.text, fontSize: fontSize.sm }]}>{item.item}</Text>
                    {item.levelKritis && <Pill label="Kritis" tone="danger" />}
                  </View>

                  <View style={styles.toggleRow}>
                    <Pressable
                      disabled={readOnly}
                      onPress={() => updateItem(item.id, { status: 'ya' })}
                      style={[
                        styles.toggleBtn,
                        { borderColor: colors.border, borderRadius: radius.md },
                        item.status === 'ya' && { backgroundColor: colors.successBg, borderColor: colors.success },
                      ]}
                    >
                      <Feather name="check" size={18} color={item.status === 'ya' ? colors.success : colors.textMuted} strokeWidth={iconStrokeWidth} />
                      <Text style={{ color: item.status === 'ya' ? colors.success : colors.textMuted, fontWeight: '700' }}>Ya</Text>
                    </Pressable>
                    <Pressable
                      disabled={readOnly}
                      onPress={() => updateItem(item.id, { status: 'tidak' })}
                      style={[
                        styles.toggleBtn,
                        { borderColor: colors.border, borderRadius: radius.md },
                        item.status === 'tidak' && { backgroundColor: colors.dangerBg, borderColor: colors.danger },
                      ]}
                    >
                      <Feather name="x" size={18} color={item.status === 'tidak' ? colors.danger : colors.textMuted} strokeWidth={iconStrokeWidth} />
                      <Text style={{ color: item.status === 'tidak' ? colors.danger : colors.textMuted, fontWeight: '700' }}>Tidak</Text>
                    </Pressable>
                  </View>

                  {item.status === 'tidak' && (
                    <Input
                      label="Catatan (wajib)"
                      value={item.catatan ?? ''}
                      onChangeText={(t) => updateItem(item.id, { catatan: t })}
                      placeholder="Jelaskan kondisi yang ditemukan..."
                      editable={!readOnly}
                      error={invalid ? 'Catatan wajib diisi' : undefined}
                    />
                  )}

                  {!readOnly && (
                    <View style={styles.photoRow}>
                      {item.foto ? (
                        item.fotoMediaType === 'video' ? (
                          <View style={[styles.photoThumb, styles.videoPlaceholder, { borderRadius: radius.sm, borderColor: colors.border }]}>
                            <Feather name="video" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
                          </View>
                        ) : (
                          <Image source={{ uri: item.foto }} style={[styles.photoThumb, { borderRadius: radius.sm }]} />
                        )
                      ) : (
                        <>
                          <Pressable
                            onPress={() => attachPhoto(item.id, ['images'])}
                            style={[styles.photoAddBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
                          >
                            <Feather name="camera" size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
                            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Foto (opsional)</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => attachPhoto(item.id, ['videos'])}
                            style={[styles.photoAddBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
                          >
                            <Feather name="video" size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
                            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Video (opsional)</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        );
      })}

      {!readOnly && <PrimaryButton label="Kirim Checklist" icon="send" onPress={handleSubmit} />}
      {submitted && (
        <View style={[styles.successBanner, { backgroundColor: colors.successBg }]}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '700' }}>Tersimpan lokal — menunggu sinkron</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  kategoriTitle: { fontWeight: '800' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemLabel: { fontWeight: '600', flex: 1 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, minHeight: 48 },
  photoRow: { flexDirection: 'row', gap: 8 },
  photoThumb: { width: 64, height: 64 },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  photoAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', padding: 10 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
});
