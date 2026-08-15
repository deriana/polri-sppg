import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { Peralatan, PeralatanKategori, PeralatanStatus } from '../types';
import { ROLE_PERMISSIONS } from '../utils/scope';

const KATEGORI_OPTIONS: { id: PeralatanKategori | 'semua'; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'semua', label: 'Semua Alat', icon: 'layers' },
  { id: 'kendaraan', label: 'Mobil & Motor Box', icon: 'truck' },
  { id: 'ompreng_tray', label: 'Ompreng Stainless', icon: 'grid' },
  { id: 'kontainer_suhu', label: 'Thermal Container', icon: 'box' },
  { id: 'alat_masak', label: 'Kettle & Kompor', icon: 'coffee' },
  { id: 'sealing_packaging', label: 'Sealer & Packing', icon: 'package' },
  { id: 'kebersihan_apd', label: 'Steril & Sanitasi', icon: 'shield' },
];

export default function PeralatanScreen() {
  const { peralatanInScope } = useScopedData();
  const { updatePeralatanStatus, role } = useApp();
  const { colors, fontSize, iconSize, iconStrokeWidth, radius, shadow, spacing } = useTheme();

  const [activeKategori, setActiveKategori] = useState<PeralatanKategori | 'semua'>('semua');
  const [selectedEq, setSelectedEq] = useState<Peralatan | null>(null);
  const [editStatus, setEditStatus] = useState<PeralatanStatus>('ready');
  const [catatanText, setCatatanText] = useState('');

  const canEdit = role ? ROLE_PERMISSIONS[role].canManageGudang : false;

  const filtered = peralatanInScope.filter(
    (eq) => activeKategori === 'semua' || eq.kategori === activeKategori,
  );

  const totalReady = peralatanInScope.reduce((acc, curr) => acc + curr.jumlahReady, 0);
  const totalBermasalah = peralatanInScope.reduce((acc, curr) => acc + curr.jumlahBermasalah, 0);

  const openStatusModal = (eq: Peralatan) => {
    setSelectedEq(eq);
    setEditStatus(eq.status);
    setCatatanText(eq.catatanKondisi);
  };

  const handleSaveStatus = () => {
    if (selectedEq) {
      updatePeralatanStatus(selectedEq.id, editStatus, catatanText);
      setSelectedEq(null);
    }
  };

  const statusTone = (st: PeralatanStatus) => {
    switch (st) {
      case 'ready':
        return 'success';
      case 'digunakan':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'perlu_perbaikan':
      case 'rusak':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Summary */}
      <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.textInverse }}>
              Aset & Peralatan Dapur
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, marginTop: 2 }}>
              Manajemen Armada Distribusi, Ompreng Stainless, & Alat Produksi
            </Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Feather name="truck" size={24} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
          </View>
        </View>

        <View style={[styles.statRow, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, marginTop: spacing.xs }]}>
          <View style={styles.statCol}>
            <Text style={{ color: colors.textInverse, fontSize: fontSize.xl, fontWeight: '800' }}>
              {peralatanInScope.length}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: fontSize.xs }}>Kategori Unit</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={{ color: '#86EFAC', fontSize: fontSize.xl, fontWeight: '800' }}>
              {totalReady.toLocaleString('id-ID')}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: fontSize.xs }}>Unit Ready</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={{ color: '#FCA5A5', fontSize: fontSize.xl, fontWeight: '800' }}>
              {totalBermasalah}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: fontSize.xs }}>Bermasalah</Text>
          </View>
        </View>
      </Card>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: spacing.xs }}>
        {KATEGORI_OPTIONS.map((kat) => {
          const isActive = activeKategori === kat.id;
          return (
            <Pressable
              key={kat.id}
              onPress={() => setActiveKategori(kat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Feather name={kat.icon} size={14} color={isActive ? colors.textInverse : colors.textMuted} strokeWidth={iconStrokeWidth} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isActive ? colors.textInverse : colors.text }}>
                {kat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Equipment List */}
      <SectionTitle>Daftar Peralatan ({filtered.length})</SectionTitle>

      {filtered.length === 0 ? (
        <EmptyState icon="box" title="Belum Ada Peralatan" body="Peralatan untuk kategori ini belum tercatat." />
      ) : (
        filtered.map((eq) => (
          <Card key={eq.id} style={{ gap: spacing.xs }}>
            {eq.fotoPeralatan && (
              <Image source={{ uri: eq.fotoPeralatan }} style={styles.eqPhoto} resizeMode="cover" />
            )}
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{eq.nama}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>Kode: {eq.kodeUnit}</Text>
              </View>
              <Pill label={eq.status.replace('_', ' ').toUpperCase()} tone={statusTone(eq.status)} />
            </View>

            <View style={[styles.infoGrid, { backgroundColor: colors.background, borderRadius: radius.md }]}>
              <View style={styles.infoCol}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Kapasitas Total</Text>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>
                  {eq.jumlahTotal.toLocaleString('id-ID')} unit
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Ready Operasional</Text>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success }}>
                  {eq.jumlahReady.toLocaleString('id-ID')} unit
                </Text>
              </View>
            </View>

            <View style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="map-pin" size={13} color={colors.textMuted} />
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, flex: 1 }}>{eq.lokasi}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="info" size={13} color={colors.textMuted} />
                <Text style={{ fontSize: fontSize.xs, color: colors.text, flex: 1, fontWeight: '600' }}>
                  {eq.catatanKondisi}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                Terakhir Diperiksa: {eq.terakhirDiperiksa}
              </Text>
            </View>

            {canEdit && (
              <SecondaryButton
                label="Perbarui Status & Kondisi"
                icon="edit-3"
                onPress={() => openStatusModal(eq)}
                style={{ marginTop: 4 }}
              />
            )}
          </Card>
        ))
      )}

      {/* Edit Status Modal */}
      <Modal visible={!!selectedEq} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>Status Kondisi Alat</Text>
              <Pressable onPress={() => setSelectedEq(null)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedEq && (
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>{selectedEq.nama}</Text>

                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Pilih Status Operasional:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(['ready', 'digunakan', 'maintenance', 'perlu_perbaikan', 'rusak'] as PeralatanStatus[]).map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setEditStatus(st)}
                      style={[
                        styles.statusBtn,
                        {
                          backgroundColor: editStatus === st ? colors.primary : colors.background,
                          borderColor: editStatus === st ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: editStatus === st ? colors.textInverse : colors.text }}>
                        {st.replace('_', ' ').toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Input
                  label="Catatan Hasil Pemeriksaan Kondisi"
                  value={catatanText}
                  onChangeText={setCatatanText}
                  multiline
                  numberOfLines={3}
                  placeholder="Isi catatan pemeriksaan alat..."
                />

                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
                  <SecondaryButton label="Batal" onPress={() => setSelectedEq(null)} style={{ flex: 1 }} />
                  <PrimaryButton label="Simpan" icon="check" onPress={handleSaveStatus} style={{ flex: 1 }} />
                </View>
              </View>
            )}
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', padding: 12, alignItems: 'center', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', gap: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  eqPhoto: { width: '100%', height: 160, borderRadius: 8, marginBottom: 4 },
  infoGrid: { flexDirection: 'row', padding: 10, gap: 12, marginVertical: 4 },
  infoCol: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
});
