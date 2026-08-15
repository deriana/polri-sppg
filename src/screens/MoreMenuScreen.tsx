import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { RpIcon, SectionTitle, SyncStatusBadge } from '../components/ui';
import { usePendingSyncCount } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { syncOfflineQueue } from '../utils/offlineQueue';

interface MenuItem {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  desc: string;
}

export default function MoreMenuScreen({ navigation }: any) {
  const { role, currentUser, logout } = useApp();
  const { colors, isDark, toggleTheme, spacing, fontSize, iconSize, iconStrokeWidth, radius, shadow } = useTheme();
  const [pendingCount, setPendingCount] = usePendingSyncCount();
  const [syncing, setSyncing] = useState(false);

  if (!role || !currentUser) return null;
  const permissions = ROLE_PERMISSIONS[role];

  const handleSync = async () => {
    setSyncing(true);
    const synced = await syncOfflineQueue();
    setSyncing(false);
    setPendingCount(Math.max(0, pendingCount - synced));
  };

  const personalItems: MenuItem[] = [
    { key: 'Profile', icon: 'user', label: 'Profil Saya', desc: 'Info akun, data pribadi, & ganti foto profil' },
    { key: 'CheckIn', icon: 'user-check', label: 'Presensi Kehadiran Saya', desc: 'Input foto selfie & lokasi GPS presensi akun pribadi' },
  ];

  const sdmItems: MenuItem[] = [];
  if (permissions.canManageStaff) {
    sdmItems.push({ key: 'Presensi', icon: 'users', label: 'Rekap Presensi Seluruh Staf', desc: 'Pantau rekap & foto selfie hadir seluruh tim SPPG' });
    sdmItems.push({ key: 'StaffList', icon: 'user-plus', label: 'Data Staf Dapur', desc: 'Kelola 47-52 petugas lapangan & relawan SPPG' });
    sdmItems.push({ key: 'Payroll', icon: 'credit-card', label: 'Payroll & Slip Gaji Staf', desc: 'Gaji pokok, tunjangan, & slip gaji tiap pegawai' });
    sdmItems.push({ key: 'LogAktivitas', icon: 'activity', label: 'Log Aktivitas & Audit Trail', desc: 'Rekam jejak seluruh aktivitas & forensik sistem SPPG' });
  }

  const operasionalItems: MenuItem[] = [];
  const phase2Items: MenuItem[] = [];

  if (role === 'KEPALA_SPPG') {
    operasionalItems.push({ key: 'StatistikEksekutif', icon: 'bar-chart-2', label: 'Laporan Statistik & Rekap Berkala', desc: 'Executive Summary mingguan/bulanan: kehadiran staf, distribusi porsi, insiden, kepatuhan gizi, & efisiensi anggaran' });
    operasionalItems.push({ key: 'KandunganGiziHarian', icon: 'activity', label: 'Evaluasi Kandungan Gizi (AKG BGN)', desc: 'Input kandungan energi pokok, makronutrien, & sertifikasi gizi harian' });
    operasionalItems.push({ key: 'PengadaanBahan', icon: 'shopping-cart', label: 'Pengadaan & Logistik Bahan', desc: 'Satu pintu: beli bahan (nota), ajuin ke pusat, & scan QR terima barang' });
    operasionalItems.push({ key: 'PengadaanPeralatan', icon: 'tool', label: 'Pengadaan Peralatan & Aset Dapur', desc: 'Beli mandiri (potong anggaran unit) atau ajukan ke BGN Pusat' });
    operasionalItems.push({ key: 'Anggaran', icon: 'pie-chart', label: 'Log Anggaran & Financial', desc: 'Pantau alokasi dana BGN/Polri, saldo, & log pengeluaran' });
    operasionalItems.push({ key: 'Broadcast', icon: 'radio', label: 'Pusat Broadcast Pengumuman', desc: 'Kirim instruksi resmi & pengumuman ke seluruh tim & driver' });
    operasionalItems.push({ key: 'SppgProfile', icon: 'home', label: 'Profil SPPG Unit', desc: 'Info dapur & kapasitas produksi' });
    operasionalItems.push({ key: 'SekolahForm', icon: 'map-pin', label: 'Pengajuan Sekolah Afiliasi', desc: 'Pilih & ajukan sekolah terdekat penerima gizi' });
    operasionalItems.push({ key: 'MenuKalender', icon: 'calendar', label: 'Kalender Menu Harian', desc: 'Lihat & atur menu per tanggal, status kirim per sekolah' });
    operasionalItems.push({ key: 'MasterMenu', icon: 'book-open', label: 'Master Katalog & Resep Gizi', desc: 'Kelola master resep makanan, gizi AKG, & porsi' });
    operasionalItems.push({ key: 'UsulanMenu', icon: 'edit-3', label: 'Usulan Menu Sekolah', desc: 'Usulan menu dari sekolah & tinjauan SPPG' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Manajemen Insiden Lapangan', desc: 'Pelaporan & investigasi kendala/insiden operasional' });
    operasionalItems.push({ key: 'AduanMasyarakat', icon: 'message-square', label: 'Aduan Masyarakat', desc: 'Laporan pengaduan publik & respon SPPG' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi & Alarm', desc: 'Pengingat tugas & riwayat alert' });

    phase2Items.push({ key: 'Distribusi', icon: 'truck', label: 'Distribusi Armada GPS', desc: 'Pelacakan GPS live armada pengiriman MBG' });
    phase2Items.push({ key: 'RiwayatDistribusi', icon: 'clipboard', label: 'Log Pengiriman Sekolah', desc: 'Riwayat semua pengiriman ke sekolah' });
    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Peralatan & Aset Dapur', desc: 'Armada mobil, ompreng stainless, & thermal box' });
    phase2Items.push({ key: 'CctvMonitor', icon: 'video', label: 'Monitor CCTV AI', desc: 'Analisis AI & deteksi anomali real-time' });
    phase2Items.push({ key: 'Gudang', icon: 'package', label: 'Gudang & Stok Bahan', desc: 'Stok bahan baku SPPG & sensor gudang' });
    phase2Items.push({ key: 'GudangKondisi', icon: 'thermometer', label: 'Kondisi Gudang', desc: 'Suhu cold storage, ringkasan stok, & CCTV gudang' });
    phase2Items.push({ key: 'RiwayatPermintaan', icon: 'file-text', label: 'Riwayat Permintaan Bahan', desc: 'Riwayat pengajuan ke gudang' });
    phase2Items.push({ key: 'MitraList', icon: 'shopping-bag', label: 'Mitra Pemasok', desc: 'Supplier/pabrik bahan baku per kategori' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Command Center', desc: 'Komunikasi langsung dengan pengawas' });
  } else if (role === 'AHLI_GIZI') {
    operasionalItems.push({ key: 'KandunganGiziHarian', icon: 'activity', label: 'Evaluasi Kandungan Gizi (AKG BGN)', desc: 'Input kandungan energi pokok, makronutrien, & sertifikasi gizi harian' });
    operasionalItems.push({ key: 'FoodQualityPassport', icon: 'award', label: 'Paspor Mutu Porsi (Quality Passport)', desc: 'Sertifikasi mutu 6 parameter: organoleptik, suhu, gramasi, & segel' });
    operasionalItems.push({ key: 'ProduksiList', icon: 'shield', label: 'Uji Kelayakan Masak & Approval QC', desc: 'Verifikasi status QC masakan batch 1 & 2 sebelum pemorsian' });
    operasionalItems.push({ key: 'MasterMenu', icon: 'book-open', label: 'Master Katalog & Resep Gizi', desc: 'Kelola master resep makanan, standar AKG, & porsi' });
    operasionalItems.push({ key: 'MenuKalender', icon: 'calendar', label: 'Kalender Menu Harian', desc: 'Tinjau kalender menu terencana per tanggal' });
    operasionalItems.push({ key: 'UsulanMenu', icon: 'edit-3', label: 'Usulan Menu Sekolah', desc: 'Evaluasi usulan menu bergizi dari pihak sekolah' });
    operasionalItems.push({ key: 'FoodSafetyForm', icon: 'thermometer', label: 'Pemeriksaan Food Safety', desc: 'Cek suhu cold storage & suhu makanan matang' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Manajemen Insiden Lapangan', desc: 'Lapor & pantau insiden kelayakan pangan' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi & Alarm', desc: 'Pengingat tugas & info gizi' });

    phase2Items.push({ key: 'BatchTraceability', icon: 'archive', label: 'Lacak Rantai Pangan (Traceability)', desc: 'Pelacakan asal-usul bahan baku hingga porsi meja siswa' });
    phase2Items.push({ key: 'GudangKondisi', icon: 'thermometer', label: 'Kondisi Cold Storage IoT', desc: 'Pantau suhu cold storage bahan segar' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Tim Gizi & Komando', desc: 'Koordinasi internal tim dapur' });
  } else if (role === 'CHEF_UTAMA') {
    operasionalItems.push({ key: 'LaporanForm', icon: 'layers', label: 'Laporan Masak 5 Tahap & QC', desc: 'Input batch ID, tahapan masak, suhu, & rasa QC' });
    operasionalItems.push({ key: 'MasterMenu', icon: 'book-open', label: 'Master Resep & Takaran Bumbu', desc: 'Panduan komposisi bumbu masakan standar BGN' });
    operasionalItems.push({ key: 'MenuKalender', icon: 'calendar', label: 'Kalender Menu Dapur', desc: 'Jadwal masakan yang harus diproduksi hari ini' });
    operasionalItems.push({ key: 'FoodSafetyForm', icon: 'thermometer', label: 'Titik Suhu Masak (Safety)', desc: 'Pencatatan suhu titik matang makanan (>75°C)' });
    operasionalItems.push({ key: 'Checklist', icon: 'check-square', label: 'Checklist Kesiapan Dapur', desc: 'Kesiapan peralatan masak, wajan, & kompor' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Lapor Insiden Dapur', desc: 'Pelaporan kendala pengolahan masakan' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi Dapur', desc: 'Pengingat jadwal masak & instruksi' });

    phase2Items.push({ key: 'Gudang', icon: 'package', label: 'Stok Bahan Baku Dapur', desc: 'Cek ketersediaan bahan masak di gudang' });
    phase2Items.push({ key: 'GudangKondisi', icon: 'thermometer', label: 'Suhu Cold Storage Bahan', desc: 'Kondisi kesegaran daging & sayuran' });
    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Peralatan Masak', desc: 'Kondisi kompor, wajan jumbo, & oven' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Dapur', desc: 'Koordinasi dengan tim logistik & kepala SPPG' });
  } else if (role === 'PEMORSI_PACKING') {
    operasionalItems.push({ key: 'Checklist', icon: 'check-square', label: 'Checklist Porsi & Seal Ompreng', desc: 'Pemeriksaan berat gramasi ompreng & kerapatan tutup' });
    operasionalItems.push({ key: 'FoodSafetyForm', icon: 'thermometer', label: 'Uji Suhu Thermal Box', desc: 'Pastikan suhu holding di dalam box di atas 60°C' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Lapor Insiden Porsi/Box', desc: 'Pelaporan ompreng rusak atau kurang box' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi Packing', desc: 'Pengingat waktu serah terima ke driver' });

    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Ompreng Stainless & Thermal Box', desc: 'Inventaris wadah saji & wadah penghangat' });
    phase2Items.push({ key: 'RiwayatDistribusi', icon: 'clipboard', label: 'Jadwal Kirim Sekolah', desc: 'Daftar jumlah ompreng yang dibutuhkan tiap sekolah' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Tim Packing', desc: 'Koordinasi kesiapan packing dengan driver' });
  } else if (role === 'PETUGAS_LOGISTIK') {
    operasionalItems.push({ key: 'PengadaanBahan', icon: 'camera', label: 'Penerimaan Pasokan (Scan QR DO)', desc: 'Scan QR surat jalan pasokan bahan & ajuin ke pusat' });
    operasionalItems.push({ key: 'Gudang', icon: 'package', label: 'Gudang & Stok Bahan Baku (FEFO)', desc: 'Manajemen stok bahan & kontrol kedaluwarsa' });
    operasionalItems.push({ key: 'MutasiStokForm', icon: 'file-text', label: 'Catat Mutasi Stok Keluar-Masuk', desc: 'Pencatatan pengeluaran bahan untuk masak' });
    operasionalItems.push({ key: 'PengadaanPeralatan', icon: 'tool', label: 'Pengadaan Peralatan & Aset Dapur', desc: 'Usulkan alat dapur: beli mandiri atau ajukan ke BGN Pusat' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Lapor Insiden Pasokan', desc: 'Pelaporan bahan baku busuk / reject / kurang' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi Stok', desc: 'Peringatan stok menipis & tanggal expired' });

    phase2Items.push({ key: 'GudangKondisi', icon: 'thermometer', label: 'Kondisi Suhu Gudang & IoT', desc: 'Pantau suhu chiller/freezer real-time' });
    phase2Items.push({ key: 'CctvMonitor', icon: 'video', label: 'CCTV Loading Dock & Gudang', desc: 'Pemantauan area penerimaan barang' });
    phase2Items.push({ key: 'MitraList', icon: 'shopping-bag', label: 'Mitra Pemasok Bahan', desc: 'Kontak supplier ayam, beras, sayur, & buah' });
    phase2Items.push({ key: 'RiwayatPermintaan', icon: 'file-text', label: 'Riwayat Permintaan Bahan', desc: 'Log pengajuan bahan ke gudang pusat' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Logistik', desc: 'Koordinasi dengan supplier & tim masak' });
  } else if (role === 'PETUGAS_SANITASI') {
    operasionalItems.push({ key: 'Checklist', icon: 'shield', label: 'Checklist Sanitasi & APD Staf', desc: 'Sterilisasi ompreng, pembersihan dapur, & kelayakan APD' });
    operasionalItems.push({ key: 'FoodSafetyForm', icon: 'thermometer', label: 'Inspeksi Higiene & Sanitasi', desc: 'Uji kebersihan permukaan meja & alat' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Lapor Insiden Sanitasi/Limbah', desc: 'Pelaporan kendala grease trap & kebersihan' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi Sanitasi', desc: 'Jadwal sterilisasi berkala' });

    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Mesin Cuci Steril & Ompreng', desc: 'Peralatan sterilisasi air panas & desinfektan' });
    phase2Items.push({ key: 'GudangKondisi', icon: 'thermometer', label: 'Kebersihan Area Gudang', desc: 'Pengecekan sanitasi ruang simpan' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Sanitasi', desc: 'Koordinasi kebersihan lingkungan SPPG' });
  } else if (role === 'DRIVER') {
    operasionalItems.push({ key: 'Distribusi', icon: 'truck', label: 'Distribusi Armada GPS & Rute', desc: 'Pelacakan live GPS armada & serah terima sekolah' });
    operasionalItems.push({ key: 'RiwayatDistribusi', icon: 'clipboard', label: 'Log Pengiriman Sekolah', desc: 'Riwayat serah terima & bukti foto guru' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Lapor Insiden Armada/Jalan', desc: 'Kendala macet, kecelakaan, atau kendala sekolah' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi Pengiriman', desc: 'Instruksi jadwal berangkat & rute pengantaran' });

    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Armada Mobil Box MBG', desc: 'Kondisi fisik armada & kelayakan kendaraan' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat Armada MBG', desc: 'Komunikasi langsung dengan koordinator' });
  } else {
    // Petugas Lapangan Umum
    operasionalItems.push({ key: 'Checklist', icon: 'check-square', label: 'Checklist Harian', desc: 'Checklist kebersihan, APD, & persiapan' });
    operasionalItems.push({ key: 'LaporanForm', icon: 'file-text', label: 'Laporan Produksi', desc: 'Input data tahapan masak' });
    operasionalItems.push({ key: 'FoodSafetyForm', icon: 'thermometer', label: 'Keamanan Pangan', desc: 'Pencatatan suhu & food safety' });
    operasionalItems.push({ key: 'IncidentList', icon: 'alert-octagon', label: 'Lapor Insiden', desc: 'Pelaporan kendala operasional' });
    operasionalItems.push({ key: 'Notifikasi', icon: 'bell', label: 'Notifikasi', desc: 'Pengingat tugas' });

    phase2Items.push({ key: 'Peralatan', icon: 'box', label: 'Peralatan Dapur', desc: 'Inventaris peralatan SPPG' });
    phase2Items.push({ key: 'ChatCommandCenter', icon: 'message-circle', label: 'Chat SPPG', desc: 'Komunikasi tim' });
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <SyncStatusBadge pendingCount={pendingCount} onSyncPress={handleSync} syncing={syncing} />

      {/* Group 1: Akun & Kehadiran Pribadi */}
      <SectionTitle style={{ marginTop: spacing.xs }}>Akun & Kehadiran Pribadi</SectionTitle>
      <View style={styles.tileGrid}>
        {personalItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.tileCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group 2: Manajemen SDM & Tim SPPG */}
      {sdmItems.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: spacing.md }}>Manajemen SDM & Tim SPPG</SectionTitle>
          <View style={styles.tileGrid}>
            {sdmItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => navigation.navigate(item.key)}
                style={({ pressed }) => [
                  styles.tileCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
                  pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                ]}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Group 3: Modul Operasional SPPG */}
      <SectionTitle style={{ marginTop: spacing.md }}>Modul Operasional SPPG</SectionTitle>
      <View style={styles.tileGrid}>
        {operasionalItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.tileCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group 4: Monitoring & Sensor Dapur */}
      <SectionTitle style={{ marginTop: spacing.md }}>Monitoring & Sensor Dapur</SectionTitle>
      <View style={styles.tileGrid}>
        {phase2Items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.tileCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
              pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={item.icon} size={20} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.text, fontSize: fontSize.sm }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group 3: Pengaturan Sistem */}
      <SectionTitle style={{ marginTop: spacing.md }}>Pengaturan & Akun</SectionTitle>
      <View style={{ gap: spacing.sm }}>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={isDark ? 'sun' : 'moon'} size={iconSize.md} color={isDark ? colors.gold : colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: fontSize.sm }}>{isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Ketuk untuk beralih tampilan tema</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, ...shadow.card },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.dangerBg }]}>
            <Feather name="log-out" size={iconSize.md} color={colors.danger} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fontSize.sm }}>Keluar (Logout)</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 90 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  tileCard: {
    width: '48.5%',
    padding: 14,
    borderWidth: 1,
    gap: 8,
    minHeight: 115,
    justifyContent: 'flex-start',
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { fontWeight: '800' },
  tileDesc: { fontSize: 11, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14, minHeight: 60 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
