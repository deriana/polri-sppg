import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { UsulanMenu } from '../types';

const STATUS_LABEL: Record<UsulanMenu['status'], string> = {
  diajukan: 'Menunggu Tinjauan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
};

const STATUS_TONE: Record<UsulanMenu['status'], 'warning' | 'success' | 'danger'> = {
  diajukan: 'warning',
  disetujui: 'success',
  ditolak: 'danger',
};

const FILTERS: Array<UsulanMenu['status'] | 'semua'> = ['semua', 'diajukan', 'disetujui', 'ditolak'];

export default function UsulanMenuScreen({ navigation }: any) {
  const { role, usulanMenuList, sekolahList, updateUsulanMenuStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius, isDark } = useTheme();

  const [filterStatus, setFilterStatus] = useState<UsulanMenu['status'] | 'semua'>('semua');
  const [selectedUsulan, setSelectedUsulan] = useState<UsulanMenu | null>(null);
  const [tanggapanText, setTanggapanText] = useState('');
  const [isEditingResponse, setIsEditingResponse] = useState(false);

  const canRespond = !!role && ROLE_PERMISSIONS[role].canManageMenu;

  const inScope = useMemo(() => {
    const ids = new Set(sppgInScope.map((s) => s.id));
    return usulanMenuList.filter((u) => ids.has(u.sppgId));
  }, [sppgInScope, usulanMenuList]);
  const sorted = useMemo(() => [...inScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [inScope]);
  const filtered = useMemo(
    () => (filterStatus === 'semua' ? sorted : sorted.filter((u) => u.status === filterStatus)),
    [sorted, filterStatus],
  );

  const handleRespond = (id: string, status: UsulanMenu['status']) => {
    updateUsulanMenuStatus(id, status, tanggapanText.trim() || undefined);
    setSelectedUsulan(null);
    setTanggapanText('');
    setIsEditingResponse(false);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Banner Explanation */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="book-open" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              USULAN MENU DARI SEKOLAH
            </Text>
          </View>
          <Pill label={`${filtered.length} Usulan`} tone="primary" />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          Daftar aspirasi variasi menu makanan bergizi yang diajukan oleh kepala sekolah, guru, & komite sekolah binaan SPPG.
        </Text>
      </Card>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: 2 }}>
        {FILTERS.map((st) => {
          const isActive = filterStatus === st;
          return (
            <Pressable
              key={st}
              onPress={() => setFilterStatus(st)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isActive ? colors.textInverse : colors.text }}>
                {st === 'semua' ? 'Semua Status' : STATUS_LABEL[st]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="clipboard" title="Belum Ada Usulan" body="Belum ada usulan menu dari sekolah pada kategori status ini." />
      ) : (
        filtered.map((u) => {
          const sekolah = sekolahList.find((s) => s.id === u.sekolahId);

          return (
            <Card
              key={u.id}
              style={{ gap: spacing.xs }}
              onPress={() => {
                setSelectedUsulan(u);
                setTanggapanText(u.tanggapan ?? '');
                setIsEditingResponse(false);
              }}
            >
              <View style={styles.rowBetween}>
                <Pill label={STATUS_LABEL[u.status]} tone={STATUS_TONE[u.status]} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{u.tanggal}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {u.fotoMenu ? (
                  <Image
                    source={typeof u.fotoMenu === 'string' ? { uri: u.fotoMenu } : u.fotoMenu}
                    style={{ width: 72, height: 72, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="home" size={12} color={colors.primary} />
                    <Text style={{ color: colors.text, fontSize: fontSize.xs, fontWeight: '700' }} numberOfLines={1}>
                      {sekolah?.nama ?? u.sekolahId}
                    </Text>
                  </View>

                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: fontSize.sm }} numberOfLines={2}>
                    {u.usulanMenu}
                  </Text>

                  {u.pengusulNama && (
                    <Text style={{ color: colors.textMuted, fontSize: 10.5 }} numberOfLines={1}>
                      Oleh: {u.pengusulNama}
                    </Text>
                  )}
                </View>
              </View>

              {u.alasan && (
                <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }} numberOfLines={2}>
                  Alasan: {u.alasan}
                </Text>
              )}

              {u.tanggapan && (
                <View style={{ backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : colors.primaryLight, borderRadius: radius.sm, padding: 8, marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Tanggapan Ahli Gizi SPPG:</Text>
                  <Text style={{ fontSize: 11, color: colors.text, marginTop: 1 }}>{u.tanggapan}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.primary }}>Ketuk untuk Lihat Detail & Foto</Text>
                <Feather name="chevron-right" size={13} color={colors.primary} />
              </View>
            </Card>
          );
        })
      )}

      {/* Modal Detail Usulan Menu Lengkap */}
      <Modal visible={!!selectedUsulan} animationType="slide" transparent onRequestClose={() => setSelectedUsulan(null)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
            {selectedUsulan && (
              <ScrollView contentContainerStyle={{ gap: spacing.md }} showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>
                      DETAIL USULAN MENU SEKOLAH
                    </Text>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text, marginTop: 2 }}>
                      {selectedUsulan.usulanMenu}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedUsulan(null)} style={{ padding: 4 }}>
                    <Feather name="x" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                {/* Status & Date */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pill label={STATUS_LABEL[selectedUsulan.status]} tone={STATUS_TONE[selectedUsulan.status]} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                    Diajukan pada: {selectedUsulan.tanggal}
                  </Text>
                </View>

                {/* School & Submitter Information */}
                <View style={[styles.infoBlock, { backgroundColor: colors.background, borderColor: colors.border, gap: 6 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="home" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                        {sekolahList.find((s) => s.id === selectedUsulan.sekolahId)?.nama ?? selectedUsulan.sekolahId}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Sekolah Penerima Manfaat MBG
                      </Text>
                    </View>
                  </View>
                  {selectedUsulan.pengusulNama && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Feather name="user-check" size={13} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                        Pengusul: {selectedUsulan.pengusulNama}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Photo Preview in Modal */}
                {selectedUsulan.fotoMenu ? (
                  <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                    <Image
                      source={typeof selectedUsulan.fotoMenu === 'string' ? { uri: selectedUsulan.fotoMenu } : selectedUsulan.fotoMenu}
                      style={{ width: '100%', height: 180 }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: radius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Feather name="camera" size={11} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 10.5, fontWeight: '800' }}>Foto Contoh / Referensi Usulan</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ padding: 12, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                    <Feather name="image" size={16} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Pengusul tidak menyertakan foto referensi.</Text>
                  </View>
                )}

                {/* Proposal Reason */}
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                    Alasan & Kebutuhan Nutrisi Siswa:
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 }}>
                    {selectedUsulan.alasan || 'Tidak ada alasan khusus yang dicantumkan.'}
                  </Text>
                </View>

                {/* Status-specific Callout & Details */}
                {selectedUsulan.status === 'disetujui' && (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                      borderColor: colors.success,
                      borderWidth: 1,
                      borderRadius: radius.md,
                      padding: 12,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="check-circle" size={16} color={colors.success} />
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.success }}>
                        Usulan Menu Telah Disetujui
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11.5, color: colors.text, lineHeight: 18 }}>
                      Menu ini telah divalidasi oleh Ahli Gizi SPPG dan dapat dimasukkan ke dalam perencanaan siklus Kalender Menu MBG.
                    </Text>
                    {selectedUsulan.tanggapan && (
                      <View style={{ marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(16,185,129,0.2)' }}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.success }}>Catatan Tim Gizi:</Text>
                        <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>{selectedUsulan.tanggapan}</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedUsulan.status === 'ditolak' && (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
                      borderColor: colors.danger,
                      borderWidth: 1,
                      borderRadius: radius.md,
                      padding: 12,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="x-circle" size={16} color={colors.danger} />
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.danger }}>
                        Usulan Menu Tidak Disetujui
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11.5, color: colors.text, lineHeight: 18 }}>
                      Usulan ini belum memenuhi standar kecukupan nutrisi AKG atau ketersediaan bahan dapur.
                    </Text>
                    {selectedUsulan.tanggapan && (
                      <View style={{ marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(239,68,68,0.2)' }}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.danger }}>Alasan Penolakan:</Text>
                        <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>{selectedUsulan.tanggapan}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* If already Approved, provide Quick Navigation to Menu Planner */}
                {selectedUsulan.status === 'disetujui' && (
                  <PrimaryButton
                    label="Buka Kalender Menu (Jadwalkan)"
                    icon="calendar"
                    onPress={() => {
                      setSelectedUsulan(null);
                      navigation.navigate('MenuKalender');
                    }}
                  />
                )}

                {/* Response Input for Pending (Diajukan) or when in Edit mode */}
                {canRespond && (selectedUsulan.status === 'diajukan' || isEditingResponse) && (
                  <View style={{ gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
                    <Input
                      label="Berikan Tanggapan Resmi / Catatan Gizi:"
                      value={tanggapanText}
                      onChangeText={setTanggapanText}
                      placeholder="Tuliskan catatan kelayakan gizi / takaran porsi..."
                      multiline
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                      <PrimaryButton
                        label="Setujui Usulan"
                        variant="secondary"
                        icon="check"
                        onPress={() => handleRespond(selectedUsulan.id, 'disetujui')}
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton
                        label="Tolak"
                        variant="danger"
                        icon="x"
                        onPress={() => handleRespond(selectedUsulan.id, 'ditolak')}
                        style={{ flex: 1 }}
                      />
                    </View>
                    {isEditingResponse && (
                      <SecondaryButton
                        label="Batal Ubah Tanggapan"
                        onPress={() => setIsEditingResponse(false)}
                        style={{ marginTop: 4 }}
                      />
                    )}
                  </View>
                )}

                {/* Option to modify response if already reviewed */}
                {canRespond && selectedUsulan.status !== 'diajukan' && !isEditingResponse && (
                  <SecondaryButton
                    label="Ubah Status / Catatan Tanggapan"
                    icon="edit-3"
                    onPress={() => setIsEditingResponse(true)}
                  />
                )}

                <SecondaryButton label="Tutup" onPress={() => setSelectedUsulan(null)} />
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 100 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalCard: { padding: 16, borderRadius: 16, gap: 12 },
  infoBlock: { padding: 12, borderRadius: 10, borderWidth: 1 },
});
