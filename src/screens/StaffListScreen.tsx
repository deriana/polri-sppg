import React, { useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { User, Role } from '../types';
import { ROLE_LABEL, ROLE_PERMISSIONS } from '../utils/scope';
import { JOBDESK_ICON, JOBDESK_LABEL } from '../utils/jobdesk';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type StaffDivisionFilter = 'semua' | 'masak' | 'pemorsi' | 'driver' | 'logistik' | 'sanitasi' | 'gizi_inti';

export default function StaffListScreen({ navigation }: any) {
  const { currentUser, role, removeStaff, presensiList, currentSppg } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();
  const { usersInScope } = useScopedData();
  const today = todayDate();

  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDivision, setActiveDivision] = useState<StaffDivisionFilter>('semua');

  const canManage = role && ROLE_PERMISSIONS[role]?.canManageStaff;

  // Presensi counts
  const presentCount = useMemo(() => {
    const activeUserIds = new Set(usersInScope.map((u) => u.id));
    return presensiList.filter((p) => p.tanggal === today && p.status === 'hadir' && activeUserIds.has(p.userId)).length;
  }, [usersInScope, presensiList, today]);

  const confirmRemove = (id: string, nama: string) => {
    Alert.alert('Hapus Staf', `Yakin ingin menghapus ${nama} dari daftar staf SPPG?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeStaff(id) },
    ]);
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    Linking.openURL(`https://wa.me/${waNumber}`);
  };

  const filteredStaff = useMemo(() => {
    return usersInScope.filter((u) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.nama.toLowerCase().includes(q);
        const matchNik = u.nik?.toLowerCase().includes(q);
        const matchHp = u.noHp?.toLowerCase().includes(q);
        const matchRole = (ROLE_LABEL[u.role] || '').toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchHp && !matchRole) return false;
      }

      // Division filter
      if (activeDivision === 'masak') {
        return u.role === 'CHEF_UTAMA' || u.jobdesk === 'chef_utama' || u.jobdesk === 'asisten_masak';
      }
      if (activeDivision === 'pemorsi') {
        return u.role === 'PEMORSI_PACKING' || u.jobdesk === 'pemorsi_packing';
      }
      if (activeDivision === 'driver') {
        return u.role === 'DRIVER' || u.jobdesk === 'driver';
      }
      if (activeDivision === 'logistik') {
        return u.role === 'PETUGAS_LOGISTIK' || u.jobdesk === 'petugas_logistik' || u.jobdesk === 'akuntan';
      }
      if (activeDivision === 'sanitasi') {
        return u.role === 'PETUGAS_SANITASI' || u.jobdesk === 'petugas_sanitasi';
      }
      if (activeDivision === 'gizi_inti') {
        return u.role === 'KEPALA_SPPG' || u.role === 'AHLI_GIZI' || u.kategoriPegawai === 'inti_bgn';
      }

      return true;
    });
  }, [usersInScope, searchQuery, activeDivision]);

  const divisionCounts = useMemo(() => {
    return {
      semua: usersInScope.length,
      masak: usersInScope.filter((u) => u.role === 'CHEF_UTAMA' || u.jobdesk === 'chef_utama' || u.jobdesk === 'asisten_masak').length,
      pemorsi: usersInScope.filter((u) => u.role === 'PEMORSI_PACKING' || u.jobdesk === 'pemorsi_packing').length,
      driver: usersInScope.filter((u) => u.role === 'DRIVER' || u.jobdesk === 'driver').length,
      logistik: usersInScope.filter((u) => u.role === 'PETUGAS_LOGISTIK' || u.jobdesk === 'petugas_logistik' || u.jobdesk === 'akuntan').length,
      sanitasi: usersInScope.filter((u) => u.role === 'PETUGAS_SANITASI' || u.jobdesk === 'petugas_sanitasi').length,
      gizi_inti: usersInScope.filter((u) => u.role === 'KEPALA_SPPG' || u.role === 'AHLI_GIZI' || u.kategoriPegawai === 'inti_bgn').length,
    };
  }, [usersInScope]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Executive Card */}
      <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.textInverse }}>
              Daftar Staf & Tim SPPG
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, marginTop: 2 }}>
              {currentSppg?.nama || 'Unit SPPG'} • Roster Lengkap 48 Staf BGN
            </Text>
          </View>
          {canManage && (
            <Pressable
              onPress={() => navigation.navigate('StaffForm')}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.gold || '#F59E0B',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="user-plus" size={14} color="#000000" strokeWidth={2.4} />
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#000000' }}>Tambah Staf</Text>
            </Pressable>
          )}
        </View>

        {/* Quick KPI Stat */}
        <View style={[styles.statRow, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, marginTop: spacing.xs }]}>
          <View style={styles.statCol}>
            <Text style={{ color: colors.textInverse, fontSize: fontSize.xl, fontWeight: '800' }}>
              {usersInScope.length}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: fontSize.xs }}>Total Staf</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={{ color: '#86EFAC', fontSize: fontSize.xl, fontWeight: '800' }}>
              {presentCount}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: fontSize.xs }}>Hadir Hari Ini</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={{ color: '#FDE68A', fontSize: fontSize.xl, fontWeight: '800' }}>
              {usersInScope.length - presentCount}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: fontSize.xs }}>Belum Absen</Text>
          </View>
        </View>
      </Card>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.pill,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder="Cari nama staf, NIK, atau divisi..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text, fontSize: fontSize.xs }]}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Division Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        <Pressable
          onPress={() => setActiveDivision('semua')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'semua' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'semua' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'semua' ? '#FFF' : colors.text }}>
            Semua ({divisionCounts.semua})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveDivision('masak')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'masak' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'masak' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Feather name="coffee" size={13} color={activeDivision === 'masak' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'masak' ? '#FFF' : colors.text }}>
            Kru Masak ({divisionCounts.masak})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveDivision('pemorsi')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'pemorsi' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'pemorsi' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Feather name="box" size={13} color={activeDivision === 'pemorsi' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'pemorsi' ? '#FFF' : colors.text }}>
            Pemorsi & Packing ({divisionCounts.pemorsi})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveDivision('driver')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'driver' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'driver' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Feather name="truck" size={13} color={activeDivision === 'driver' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'driver' ? '#FFF' : colors.text }}>
            Driver Armada ({divisionCounts.driver})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveDivision('logistik')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'logistik' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'logistik' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Feather name="package" size={13} color={activeDivision === 'logistik' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'logistik' ? '#FFF' : colors.text }}>
            Logistik & Gudang ({divisionCounts.logistik})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveDivision('sanitasi')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'sanitasi' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'sanitasi' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Feather name="shield" size={13} color={activeDivision === 'sanitasi' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'sanitasi' ? '#FFF' : colors.text }}>
            Tim Sanitasi ({divisionCounts.sanitasi})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveDivision('gizi_inti')}
          style={[
            styles.chip,
            {
              backgroundColor: activeDivision === 'gizi_inti' ? colors.primary : colors.surface,
              borderColor: activeDivision === 'gizi_inti' ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Feather name="award" size={13} color={activeDivision === 'gizi_inti' ? '#FFF' : colors.textMuted} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: activeDivision === 'gizi_inti' ? '#FFF' : colors.text }}>
            Gizi & Inti BGN ({divisionCounts.gizi_inti})
          </Text>
        </Pressable>
      </ScrollView>

      {/* Staff Roster List */}
      <SectionTitle>Daftar Staf Terdaftar ({filteredStaff.length})</SectionTitle>

      {filteredStaff.length === 0 ? (
        <EmptyState icon="users" title="Staf Tidak Ditemukan" body="Tidak ada staf yang sesuai dengan filter atau kata kunci pencarian." />
      ) : (
        filteredStaff.map((u) => {
          const presensiHariIni = presensiList.find((p) => p.userId === u.id && p.tanggal === today);
          const hadirHariIni = presensiHariIni?.status === 'hadir';
          const jobdeskIcon = u.jobdesk ? JOBDESK_ICON[u.jobdesk] : 'user';
          const roleDisplay = ROLE_LABEL[u.role] || 'Staf Operasional';
          const isMe = currentUser?.id === u.id;

          return (
            <Card key={u.id} style={styles.rowCard} onPress={() => setSelectedStaff(u)}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                {u.fotoProfil ? (
                  <Image source={{ uri: u.fotoProfil }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Feather name={jobdeskIcon} size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
                  </View>
                )}

                <View style={{ flex: 1, gap: 3 }}>
                  {/* Name and Chevron */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
                        {u.nama}
                      </Text>
                      {isMe && (
                        <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.primary }}>Akun Anda</Text>
                        </View>
                      )}
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.textMuted} />
                  </View>

                  {/* Role & Division */}
                  <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '800' }}>
                    {u.jobdesk ? JOBDESK_LABEL[u.jobdesk] : roleDisplay}
                  </Text>

                  {/* Info sub-details */}
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    NIK: {u.nik || '—'} • Shift {u.shift ?? 'Pagi'}
                  </Text>

                  {/* Badge Row */}
                  <View style={styles.badgeRow}>
                    <Pill
                      label={u.kategoriPegawai === 'inti_bgn' ? 'Pegawai Inti BGN' : 'Relawan Lokal'}
                      tone={u.kategoriPegawai === 'inti_bgn' ? 'primary' : 'neutral'}
                    />
                    <Pill
                      label={hadirHariIni ? `Hadir ${presensiHariIni?.jamMasuk || ''}` : 'Belum Absen'}
                      tone={hadirHariIni ? 'success' : 'warning'}
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons: WhatsApp & Remove */}
              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                {isMe ? (
                  <View style={[styles.contactBtn, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF', borderWidth: 1, borderColor: colors.primary }]}>
                    <Feather name="user-check" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Akun Saya ({u.noHp || 'Login'})</Text>
                  </View>
                ) : u.noHp ? (
                  <Pressable
                    onPress={() => handleWhatsApp(u.noHp)}
                    style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
                  >
                    <Feather name="message-circle" size={13} color="#FFFFFF" />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>{u.noHp}</Text>
                  </Pressable>
                ) : (
                  <View />
                )}

                {canManage && !isMe && (
                  <Pressable
                    onPress={() => confirmRemove(u.id, u.nama)}
                    style={{ padding: 6 }}
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={15} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            </Card>
          );
        })
      )}

      {/* Staff Detail Modal */}
      <Modal visible={!!selectedStaff} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>Detail Staf SPPG</Text>
              <Pressable onPress={() => setSelectedStaff(null)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedStaff && (() => {
              const presensi = presensiList.find((p) => p.userId === selectedStaff.id && p.tanggal === today);
              const isHadir = presensi?.status === 'hadir';
              const jobIcon = selectedStaff.jobdesk ? JOBDESK_ICON[selectedStaff.jobdesk] : 'user';
              const isStaffMe = currentUser?.id === selectedStaff.id;

              return (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {selectedStaff.fotoProfil ? (
                      <Image source={{ uri: selectedStaff.fotoProfil }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name={jobIcon} size={28} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>{selectedStaff.nama}</Text>
                        {isStaffMe && (
                          <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.primary }}>Akun Anda</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
                        {selectedStaff.kategoriPegawai === 'inti_bgn' ? 'Pegawai Inti (ASN / PPPK BGN)' : 'Tenaga Operasional / Relawan Dapur'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <Pill label={selectedStaff.jobdesk ? JOBDESK_LABEL[selectedStaff.jobdesk] : ROLE_LABEL[selectedStaff.role]} tone="primary" />
                        <Pill label={isHadir ? `Hadir (${presensi?.jamMasuk || ''})` : 'Belum Absen'} tone={isHadir ? 'success' : 'warning'} />
                      </View>
                    </View>
                  </View>

                  <View style={[styles.infoBox, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, gap: 8 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>NIK Pegawai:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>{selectedStaff.nik || '—'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Nomor Kontak WA:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>{selectedStaff.noHp || '—'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Shift Tugas:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Shift {selectedStaff.shift ?? 'Pagi'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Jam Masuk Hari Ini:</Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isHadir ? colors.success : colors.warning }}>
                        {presensi?.jamMasuk ? `${presensi.jamMasuk} WIB (Tepat Waktu)` : 'Belum Check-In'}
                      </Text>
                    </View>
                  </View>

                  {presensi?.fotoSelfieMasuk && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Foto Selfie Presensi:</Text>
                      <Image source={{ uri: presensi.fotoSelfieMasuk }} style={{ width: '100%', height: 140, borderRadius: radius.md }} resizeMode="cover" />
                    </View>
                  )}

                  {isStaffMe ? (
                    <PrimaryButton
                      label="Buka Profil Saya"
                      icon="user"
                      onPress={() => {
                        setSelectedStaff(null);
                        navigation.navigate('Profile');
                      }}
                    />
                  ) : selectedStaff.noHp ? (
                    <PrimaryButton
                      label="Hubungi via WhatsApp"
                      icon="message-circle"
                      onPress={() => handleWhatsApp(selectedStaff.noHp)}
                    />
                  ) : null}

                  <SecondaryButton label="Tutup" onPress={() => setSelectedStaff(null)} />
                </View>
              );
            })()}
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  rowCard: { padding: 14, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  name: { fontWeight: '800' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statRow: { flexDirection: 'row', paddingVertical: 10 },
  statCol: { flex: 1, alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderWidth: 1 },
  searchInput: { flex: 1, paddingVertical: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 0.5, paddingTop: 8, marginTop: 2 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  infoBox: { marginTop: 4 },
});

