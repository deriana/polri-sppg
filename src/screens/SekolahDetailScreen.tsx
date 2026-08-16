import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, IconButton, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SekolahDetailScreen({ navigation, route }: any) {
  const { sekolahId } = route.params as { sekolahId: string };
  const { sppgList, sekolahList, distribusiList, menuHarianPlanList, publicReportList } = useApp();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'beneficiary'>('ringkasan');
  const [selectedAllergyFilter, setSelectedAllergyFilter] = useState<string>('all');

  const today = todayDateStr();
  const sekolah = sekolahList.find((s) => s.id === sekolahId);
  const sppg = sppgList.find((s) => s.id === sekolah?.sppgId);

  const planToday = menuHarianPlanList.find((m) => m.sppgId === sekolah?.sppgId && m.tanggal === today);
  const ruteDistribusi = distribusiList.find((d) => d.sekolahId === sekolahId && d.tanggal === today);
  const reportsSekolah = publicReportList.filter((r) => r.sekolahId === sekolahId || (sekolah && r.deskripsi.toLowerCase().includes(sekolah.nama.toLowerCase())));

  if (!sekolah) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <EmptyState icon="home" title="Sekolah Tidak Ditemukan" body="Data sekolah ini tidak tersedia." />
      </View>
    );
  }

  const summary = sekolah.beneficiarySummary;
  const daftarAlergi = summary?.daftarAlergi || [];

  const filteredAlergi = daftarAlergi.filter((item) => {
    if (selectedAllergyFilter === 'all') return true;
    return item.jenisAlergi === selectedAllergyFilter;
  });

  const statusLabel = ruteDistribusi?.status === 'tiba' ? 'Telah Diterima Sekolah' : ruteDistribusi?.status === 'dalam_perjalanan' ? 'Dalam Pengiriman' : ruteDistribusi?.status === 'kendala' ? 'Kendala Pengiriman' : 'Menunggu Jadwal';
  const statusTone = ruteDistribusi?.status === 'tiba' ? 'success' : ruteDistribusi?.status === 'dalam_perjalanan' ? 'info' : ruteDistribusi?.status === 'kendala' ? 'danger' : 'neutral';

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <Card style={{ gap: spacing.xs, padding: 0, overflow: 'hidden' }}>
        {sekolah.fotoSekolah ? (
          <Image source={{ uri: sekolah.fotoSekolah }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: 140, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="home" size={40} color={colors.primary} />
          </View>
        )}
        <View style={{ padding: 16, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pill label={statusLabel} tone={statusTone} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>ID: {sekolah.id}</Text>
          </View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: 4 }}>{sekolah.nama}</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
            Afiliasi: {sppg?.nama ?? sekolah.sppgId}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Feather name="map-pin" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, flex: 1 }}>{sekolah.alamat}</Text>
          </View>
        </View>
      </Card>

      {/* Tab Switcher */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => setActiveTab('ringkasan')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'ringkasan' ? colors.primary : colors.surface,
              borderColor: activeTab === 'ringkasan' ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="info" size={14} color={activeTab === 'ringkasan' ? '#FFF' : colors.text} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: activeTab === 'ringkasan' ? '#FFF' : colors.text }}>
            Ringkasan Sekolah
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('beneficiary')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'beneficiary' ? colors.primary : colors.surface,
              borderColor: activeTab === 'beneficiary' ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="users" size={14} color={activeTab === 'beneficiary' ? '#FFF' : colors.text} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: activeTab === 'beneficiary' ? '#FFF' : colors.text }}>
            Siswa & Alergi ({daftarAlergi.length})
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: RINGKASAN SEKOLAH */}
      {activeTab === 'ringkasan' && (
        <View style={{ gap: spacing.md }}>
          {/* Target & Delivery Summary */}
          <Card style={{ gap: spacing.xs }}>
            <SectionTitle style={{ marginBottom: 0 }}>Informasi Sasaran MBG</SectionTitle>
            <View style={[styles.grid, { backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }]}>
              <View style={styles.gridCol}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Target Murid Penerima</Text>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.primary }}>
                  {sekolah.jumlahSiswa.toLocaleString('id-ID')} siswa
                </Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Estimasi Jam Tiba</Text>
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>
                  {ruteDistribusi?.estimasiTiba ?? '07:15 WIB'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Today's Food Menu */}
          <Card style={{ gap: spacing.xs }}>
            <SectionTitle style={{ marginBottom: 0 }}>Menu Paket Makanan Hari Ini</SectionTitle>
            {planToday ? (
              <View style={{ gap: spacing.xs }}>
                {planToday.fotoMenu && (
                  <Image source={{ uri: planToday.fotoMenu }} style={{ width: '100%', height: 160, borderRadius: radius.md }} resizeMode="cover" />
                )}
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>{planToday.menu}</Text>
                {planToday.kategoriGizi && (
                  <Pill label={planToday.kategoriGizi} tone="info" />
                )}
              </View>
            ) : (
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Belum ada menu terjadwal untuk hari ini.</Text>
            )}
          </Card>

          {/* Tracking Button */}
          {ruteDistribusi && (
            <PrimaryButton
              label="Lacak Posisi Armada Pengiriman (Live Tracking)"
              icon="truck"
              onPress={() => navigation.navigate('DistribusiDetail', { ruteId: ruteDistribusi.id })}
            />
          )}

          {/* Public Reports for this School */}
          {reportsSekolah.length > 0 && (
            <Card style={{ gap: spacing.xs }}>
              <SectionTitle style={{ marginBottom: 0 }}>Catatan / Aduan Terkait Sekolah ({reportsSekolah.length})</SectionTitle>
              {reportsSekolah.map((rep) => (
                <View key={rep.id} style={[styles.reportRow, { borderBottomColor: colors.border }]}>
                  <Pill label={rep.kategori.toUpperCase()} tone="warning" />
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text, flex: 1 }}>{rep.judul}</Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{rep.tanggal}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

      {/* TAB 2: DIGITAL BENEFICIARY & ALLERGY PROFILE */}
      {activeTab === 'beneficiary' && (
        <View style={{ gap: spacing.md }}>
          {/* Real-time Daily Attendance & Meal Count Card */}
          <Card
            style={{
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.primary,
              borderWidth: 1.5,
              gap: 12,
            }}
          >
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="users" size={16} color={colors.primary} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
                  REKAPITULASI PRESENSI & MAKAN SISWA HARI INI
                </Text>
              </View>
              <Pill tone="success" label="Presensi 97.5%" />
            </View>

            {/* 4 Stat Box Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                <Text style={styles.statBoxLabel}>Terdaftar</Text>
                <Text style={[styles.statBoxVal, { color: colors.text }]}>
                  {summary?.totalSiswaTerdaftar ?? sekolah.jumlahSiswa}
                </Text>
                <Text style={styles.statBoxSub}>Siswa</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderColor: colors.primary }]}>
                <Text style={styles.statBoxLabel}>Disiapkan</Text>
                <Text style={[styles.statBoxVal, { color: colors.primary }]}>
                  {summary?.porsiDisiapkan ?? sekolah.jumlahSiswa}
                </Text>
                <Text style={styles.statBoxSub}>Porsi MBG</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', borderColor: colors.success }]}>
                <Text style={styles.statBoxLabel}>Menerima</Text>
                <Text style={[styles.statBoxVal, { color: colors.success }]}>
                  {summary?.siswaHadirMenerima ?? sekolah.jumlahSiswa - 6}
                </Text>
                <Text style={styles.statBoxSub}>Siswa Hadir</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', borderColor: colors.danger }]}>
                <Text style={styles.statBoxLabel}>Tidak Hadir</Text>
                <Text style={[styles.statBoxVal, { color: colors.danger }]}>
                  {summary?.siswaTidakHadir ?? 6}
                </Text>
                <Text style={styles.statBoxSub}>
                  {summary?.alasanTidakHadir ? `${summary.alasanTidakHadir.sakit} Sakit, ${summary.alasanTidakHadir.izin} Izin` : 'Sakit / Izin'}
                </Text>
              </View>
            </View>

            {/* SOP Surplus / Remainder Handling */}
            {summary?.penangananSisaPorsi && (
              <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9', padding: 10, borderRadius: radius.md, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="shield" size={12} color={colors.primary} />
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.text }}>
                    Prosedur SOP Penanganan Porsi Siswa Tidak Hadir:
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }}>
                  {summary.penangananSisaPorsi}
                </Text>
              </View>
            )}
          </Card>

          {/* Section: Allergy & Nutrition Profiling */}
          <Card style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="alert-circle" size={16} color={colors.warning} />
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>
                  MANAJEMEN ALERGI & MENU SUBSTITUSI ({daftarAlergi.length})
                </Text>
              </View>
              <Pill tone="primary" label={`${daftarAlergi.length} Khusus`} />
            </View>

            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Sistem mencatat profil alergen siswa dan otomatis memerintahkan dapur SPPG menyiapkan menu substitusi non-allergen bernutrisi setara.
            </Text>

            {/* Allergy Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {[
                { id: 'all', label: `Semua (${daftarAlergi.length})` },
                { id: 'alergi_telur', label: 'Alergi Telur' },
                { id: 'intoleransi_laktosa', label: 'Laktosa' },
                { id: 'alergi_seafood', label: 'Seafood' },
                { id: 'alergi_kacang', label: 'Kacang' },
              ].map((chip) => {
                const active = selectedAllergyFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setSelectedAllergyFilter(chip.id)}
                    style={[
                      styles.allergyChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#FFF' : colors.text }}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* List of Allergy Profiles */}
            {filteredAlergi.length === 0 ? (
              <EmptyState icon="check-circle" title="Tidak Ada Siswa Alergi" body="Tidak ditemukan catatan alergi untuk filter ini." />
            ) : (
              filteredAlergi.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.allergyCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="user" size={12} color={colors.primary} />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                        {item.namaInisial}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <Pill tone="neutral" label={item.kelas} />
                      <Pill tone="danger" label={item.labelAlergi} />
                    </View>
                  </View>

                  {/* Substitution Meal Info Box */}
                  <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', padding: 8, borderRadius: radius.sm, gap: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.success }}>
                      MENU SUBSTITUSI GIZI KHUSUS:
                    </Text>
                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.text }}>
                      {item.menuSubstitusi}
                    </Text>
                    {item.catatanKhusus && (
                      <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic', marginTop: 1 }}>
                        "{item.catatanKhusus}"
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Feather name="check-circle" size={11} color={colors.success} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success }}>
                        Diagnosis Medis Terverifikasi BGN
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>ID: {item.id}</Text>
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* Privacy & Governance Notice */}
          <Card style={{ backgroundColor: isDark ? colors.surface : '#F8FAFC', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="lock" size={14} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>
                KEBIJAKAN PRIVASI & PERLINDUNGAN DATA SISWA (UU PDP)
              </Text>
            </View>
            <Text style={{ fontSize: 10.5, color: colors.textMuted, lineHeight: 16 }}>
              Identitas lengkap siswa dienkripsi dalam sistem. Hanya Ahli Gizi SPPG dan Petugas Satgas Guru MBG yang memiliki hak akses untuk memverifikasi kesesuaian menu substitusi saat serah terima ompreng di kelas.
            </Text>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  gridCol: { flex: 1 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  statBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  statBoxVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  statBoxSub: {
    fontSize: 10,
    color: '#64748B',
  },
  allergyChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  allergyCard: {
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
});
