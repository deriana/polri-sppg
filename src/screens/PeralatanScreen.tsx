import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import AssetQrModal from '../components/AssetQrModal';
import { useScopedData } from '../hooks';
import { Peralatan, PeralatanKategori, PeralatanStatus } from '../types';
import { KATEGORI_PERALATAN_OPTIONS as KATEGORI_OPTIONS } from '../mock/peralatan';

export default function PeralatanScreen({ route }: any) {
  const { peralatanInScope } = useScopedData();
  const { updatePeralatanStatus, role, sppgList } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();
  const navigation = useNavigation<any>();

  type StatusFilterType = 'semua' | 'bermasalah' | 'ready' | 'maintenance' | 'rusak';
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterType>(() => {
    return route?.params?.initialStatusFilter || 'semua';
  });

  const [activeKategori, setActiveKategori] = useState<PeralatanKategori | 'semua'>(() => {
    if (role === 'PEMORSI_PACKING') return 'ompreng_tray';
    if (role === 'PETUGAS_SANITASI') return 'sterilisasi';
    if (role === 'DRIVER') return 'kendaraan';
    if (role === 'CHEF_UTAMA') return 'alat_masak';
    return 'semua';
  });
  const [selectedEq, setSelectedEq] = useState<Peralatan | null>(null);
  const [editStatus, setEditStatus] = useState<PeralatanStatus>('ready');
  const [catatanText, setCatatanText] = useState('');
  const [qrModalEq, setQrModalEq] = useState<Peralatan | null>(null);

  // Status counts for filter chips
  const countBermasalah = peralatanInScope.filter(
    (p) => p.status === 'rusak' || p.status === 'perlu_perbaikan' || p.status === 'maintenance' || p.jumlahBermasalah > 0,
  ).length;
  const countReady = peralatanInScope.filter((p) => p.status === 'ready' && p.jumlahBermasalah === 0).length;
  const countMaintenance = peralatanInScope.filter((p) => p.status === 'maintenance' || p.status === 'perlu_perbaikan').length;
  const countRusak = peralatanInScope.filter((p) => p.status === 'rusak').length;

  // Interactive Checklist per Role in Peralatan Hub
  const [packingTodos, setPackingTodos] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Pastikan 1.500 Ompreng Stainless dalam kondisi kering dan steril', done: true },
    { id: '2', text: 'Cek karet seal penutup ompreng agar rapat dan anti-bocor', done: true },
    { id: '3', text: 'Kalibrasi nol timbangan digital presisi sebelum pemorsian', done: true },
    { id: '4', text: 'Panaskan & siapkan 50 Thermal Box dengan holding suhu >60°C', done: false },
    { id: '5', text: 'Susun ompreng per sekolah dan lakukan serah terima ke driver', done: false },
  ]);

  const [sanitasiTodos, setSanitasiTodos] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Isi air mesin dishwasher dan setting pemanas suhu sterilisasi 85°C', done: true },
    { id: '2', text: 'Cuci & bilas 1.500 ompreng stainless kotor retur dari sekolah', done: true },
    { id: '3', text: 'Desinfeksi meja kerja pemorsian, talenan, dan pisau dapur', done: true },
    { id: '4', text: 'Pemeriksaan kelayakan APD lengkap seluruh staf sebelum shift', done: true },
    { id: '5', text: 'Kuras dan bersihkan perangkap lemak (grease trap) limbah dapur', done: false },
  ]);

  const togglePackingTodo = (id: string) => {
    setPackingTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const toggleSanitasiTodo = (id: string) => {
    setSanitasiTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const canEditEquipment = (eq?: Peralatan | null) => {
    if (!role) return false;
    if (role === 'KEPALA_SPPG' || role === 'SUPERVISOR_POLRES' || role === 'SUPERVISOR_POLDA') return true;
    if (role === 'PETUGAS_LOGISTIK') return true;
    if (role === 'PEMORSI_PACKING' && (eq?.kategori === 'kontainer_suhu' || eq?.kategori === 'ompreng_tray' || eq?.kategori === 'sealing_packaging')) return true;
    if (role === 'AHLI_GIZI' && (eq?.kategori === 'kontainer_suhu' || eq?.kategori === 'penyimpanan' || eq?.kategori === 'ukur_qc')) return true;
    if (role === 'CHEF_UTAMA' && (eq?.kategori === 'alat_masak' || eq?.kategori === 'ukur_qc')) return true;
    if (role === 'PETUGAS_SANITASI' && (eq?.kategori === 'sterilisasi' || eq?.kategori === 'kebersihan_apd' || eq?.kategori === 'ompreng_tray')) return true;
    if (role === 'DRIVER' && eq?.kategori === 'kendaraan') return true;
    return false;
  };

  const filtered = peralatanInScope.filter((eq) => {
    const matchKat = activeKategori === 'semua' || eq.kategori === activeKategori;
    if (!matchKat) return false;

    if (activeStatusFilter === 'bermasalah') {
      return eq.status === 'rusak' || eq.status === 'perlu_perbaikan' || eq.status === 'maintenance' || eq.jumlahBermasalah > 0;
    }
    if (activeStatusFilter === 'ready') {
      return eq.status === 'ready' && eq.jumlahBermasalah === 0;
    }
    if (activeStatusFilter === 'maintenance') {
      return eq.status === 'maintenance' || eq.status === 'perlu_perbaikan';
    }
    if (activeStatusFilter === 'rusak') {
      return eq.status === 'rusak';
    }
    return true;
  });

  const totalReady = peralatanInScope.reduce((acc, curr) => acc + curr.jumlahReady, 0);
  const totalBermasalah = peralatanInScope.reduce((acc, curr) => acc + curr.jumlahBermasalah, 0);

  const openStatusModal = (eq: Peralatan) => {
    if (!canEditEquipment(eq)) return;
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

  const openAssetDetail = (eq: Peralatan) => {
    const sppg = sppgList.find((s) => s.id === eq.sppgId);
    navigation.navigate('AssetQrDetail', { peralatan: eq, sppgNama: sppg?.nama });
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
              Manajemen Armada, Ompreng Stainless, & Alat Produksi Ber-QR
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

        {/* Action Button: Scan Asset QR */}
        <Pressable
          onPress={() => navigation.navigate('QrScan')}
          style={({ pressed }) => [
            styles.scanHeaderBtn,
            { backgroundColor: colors.gold || '#F59E0B' },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Feather name="camera" size={16} color="#000000" strokeWidth={2.2} />
          <Text style={styles.scanHeaderBtnText}>Pindai QR Aset / Peralatan</Text>
        </Pressable>
      </Card>

      {/* Role-Specific Interactive Work Checklist (Pemorsi & Packing) */}
      {role === 'PEMORSI_PACKING' && (
        <Card variant="accent" style={{ gap: spacing.sm }}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="box" size={16} color={colors.primary} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>
                CHECKLIST KESIAPAN WADAH SAJI & PACKING
              </Text>
            </View>
            <Pill
              label={`${packingTodos.filter((t) => t.done).length}/${packingTodos.length} Selesai`}
              tone={packingTodos.every((t) => t.done) ? 'success' : 'primary'}
            />
          </View>

          <View style={{ gap: 6 }}>
            {packingTodos.map((todo) => (
              <Pressable
                key={todo.id}
                onPress={() => togglePackingTodo(todo.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  backgroundColor: colors.background,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: todo.done ? colors.success : colors.border,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: todo.done ? colors.success : 'transparent',
                    borderColor: todo.done ? colors.success : colors.textMuted,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {todo.done && <Feather name="check" size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: todo.done ? colors.textMuted : colors.text,
                    textDecorationLine: todo.done ? 'line-through' : 'none',
                    fontWeight: todo.done ? '500' : '700',
                    flex: 1,
                  }}
                >
                  {todo.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      {/* Role-Specific Interactive Work Checklist (Petugas Sanitasi) */}
      {role === 'PETUGAS_SANITASI' && (
        <Card variant="accent" style={{ gap: spacing.sm }}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="shield" size={16} color={colors.primary} />
              <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>
                PROSEDUR STERILISASI & SANITASI ALAT DAPUR
              </Text>
            </View>
            <Pill
              label={`${sanitasiTodos.filter((t) => t.done).length}/${sanitasiTodos.length} Selesai`}
              tone={sanitasiTodos.every((t) => t.done) ? 'success' : 'primary'}
            />
          </View>

          <View style={{ gap: 6 }}>
            {sanitasiTodos.map((todo) => (
              <Pressable
                key={todo.id}
                onPress={() => toggleSanitasiTodo(todo.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  backgroundColor: colors.background,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: todo.done ? colors.success : colors.border,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: todo.done ? colors.success : 'transparent',
                    borderColor: todo.done ? colors.success : colors.textMuted,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {todo.done && <Feather name="check" size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: todo.done ? colors.textMuted : colors.text,
                    textDecorationLine: todo.done ? 'line-through' : 'none',
                    fontWeight: todo.done ? '500' : '700',
                    flex: 1,
                  }}
                >
                  {todo.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      {/* 1. Status Filter Pills */}
      <View style={{ marginTop: spacing.xs, gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4 }}>
          FILTER KONDISI ASET
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          <Pressable
            onPress={() => setActiveStatusFilter('semua')}
            style={[
              styles.chip,
              {
                backgroundColor: activeStatusFilter === 'semua' ? colors.primary : colors.surface,
                borderColor: activeStatusFilter === 'semua' ? colors.primary : colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeStatusFilter === 'semua' ? colors.textInverse : colors.text }}>
              Semua ({peralatanInScope.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveStatusFilter('bermasalah')}
            style={[
              styles.chip,
              {
                backgroundColor:
                  activeStatusFilter === 'bermasalah'
                    ? (isDark ? 'rgba(239,68,68,0.3)' : colors.danger)
                    : (isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2'),
                borderColor: colors.danger,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Feather
              name="alert-triangle"
              size={13}
              color={activeStatusFilter === 'bermasalah' ? (isDark ? '#FCA5A5' : '#FFFFFF') : colors.danger}
            />
            <Text
              style={{
                fontSize: fontSize.xs,
                fontWeight: '800',
                color: activeStatusFilter === 'bermasalah' ? (isDark ? '#FCA5A5' : '#FFFFFF') : colors.danger,
              }}
            >
              Bermasalah ({countBermasalah})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveStatusFilter('ready')}
            style={[
              styles.chip,
              {
                backgroundColor: activeStatusFilter === 'ready' ? colors.success : colors.surface,
                borderColor: activeStatusFilter === 'ready' ? colors.success : colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Feather
              name="check-circle"
              size={13}
              color={activeStatusFilter === 'ready' ? '#FFFFFF' : colors.success}
            />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeStatusFilter === 'ready' ? '#FFFFFF' : colors.text }}>
              Siap Pakai ({countReady})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveStatusFilter('maintenance')}
            style={[
              styles.chip,
              {
                backgroundColor: activeStatusFilter === 'maintenance' ? (isDark ? 'rgba(217,119,6,0.3)' : colors.warning) : colors.surface,
                borderColor: activeStatusFilter === 'maintenance' ? colors.warning : colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Feather
              name="tool"
              size={13}
              color={activeStatusFilter === 'maintenance' ? (isDark ? '#FDE68A' : '#FFFFFF') : colors.warning}
            />
            <Text
              style={{
                fontSize: fontSize.xs,
                fontWeight: '800',
                color: activeStatusFilter === 'maintenance' ? (isDark ? '#FDE68A' : '#FFFFFF') : colors.text,
              }}
            >
              Maintenance ({countMaintenance})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* 2. Category Pills */}
      <View style={{ marginTop: spacing.xs, gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4 }}>
          KATEGORI PERALATAN
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {KATEGORI_OPTIONS.map((kat) => {
            const isActive = activeKategori === kat.id;
            return (
              <Pressable
                key={kat.id}
                onPress={() => setActiveKategori(kat.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? (isDark ? colors.gold : colors.primary) : colors.surface,
                    borderColor: isActive ? (isDark ? colors.gold : colors.primary) : colors.border,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Feather name={kat.icon as any} size={14} color={isActive ? '#000000' : colors.textMuted} strokeWidth={iconStrokeWidth} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isActive ? '#000000' : colors.text }}>
                  {kat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Equipment List */}
      <SectionTitle>Daftar Peralatan ({filtered.length})</SectionTitle>

      {filtered.length === 0 ? (
        <EmptyState icon="box" title="Belum Ada Peralatan" body="Peralatan untuk kategori ini belum tercatat." />
      ) : (
        filtered.map((eq) => (
          <Card key={eq.id} onPress={() => openAssetDetail(eq)} style={{ gap: spacing.xs }}>
            {eq.fotoPeralatan && (
              <Image source={{ uri: eq.fotoPeralatan }} style={styles.eqPhoto} resizeMode="cover" />
            )}
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text, flex: 1 }}>{eq.nama}</Text>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>Unit: {eq.kodeUnit}</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setQrModalEq(eq);
                    }}
                    style={[styles.qrBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  >
                    <Feather name="maximize" size={10} color={colors.primary} />
                    <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800' }}>{eq.qrCodeId}</Text>
                  </Pressable>
                </View>
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

            {(eq.kategori === 'kontainer_suhu' || eq.kategori === 'penyimpanan') && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Feather name="thermometer" size={13} color={colors.success} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>
                  Uji Holding Suhu: Min 60°C saat pengiriman (Khusus Pemorsi & QC)
                </Text>
              </View>
            )}

            {/* Action Buttons: Modal QR & Detail Aset */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  setQrModalEq(eq);
                }}
                style={[
                  styles.qrToggleBtn,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    flex: 1,
                  },
                ]}
              >
                <Feather name="maximize" size={15} color={colors.primary} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary }}>
                  QR Code & Share
                </Text>
              </Pressable>

              <Pressable
                onPress={() => openAssetDetail(eq)}
                style={[
                  styles.qrToggleBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    flex: 1,
                  },
                ]}
              >
                <Feather name="file-text" size={15} color={colors.text} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
                  Detail Lengkap
                </Text>
              </Pressable>
            </View>

            {canEditEquipment(eq) ? (
              <SecondaryButton
                label={eq.kategori === 'kontainer_suhu' || eq.kategori === 'penyimpanan' ? 'Uji Suhu & Perbarui Status' : 'Perbarui Status & Kondisi'}
                icon={eq.kategori === 'kontainer_suhu' || eq.kategori === 'penyimpanan' ? 'thermometer' : 'edit-3'}
                onPress={() => openStatusModal(eq)}
                style={{ marginTop: 2 }}
              />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, opacity: 0.7 }}>
                <Feather name="lock" size={12} color={colors.textMuted} />
                <Text style={{ fontSize: 10.5, color: colors.textMuted, fontStyle: 'italic' }}>
                  Akses audit/uji kondisi alat ini dibatasi untuk divisi yang berwenang.
                </Text>
              </View>
            )}
          </Card>
        ))
      )}

      {/* QR Code Modal with Share as PNG */}
      <AssetQrModal
        visible={!!qrModalEq}
        onClose={() => setQrModalEq(null)}
        peralatan={qrModalEq}
        sppgNama={sppgList.find((s) => s.id === qrModalEq?.sppgId)?.nama}
        onViewDetail={() => {
          if (qrModalEq) openAssetDetail(qrModalEq);
        }}
      />

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
  scanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 6,
  },
  scanHeaderBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  eqPhoto: { width: '100%', height: 180, borderRadius: 8, marginBottom: 4 },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  qrToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  infoGrid: { flexDirection: 'row', padding: 10, gap: 12, marginVertical: 4 },
  infoCol: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
});
