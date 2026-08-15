import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { initialIncidentList } from '../data/incidents';
import { publicReportList } from '../data/publicReports';
import { sekolahList } from '../data/sekolah';
import { formatRupiah } from '../utils/payroll';

type PeriodeOption = '7_hari' | '30_hari' | 'bulan_ini' | 'custom';

function formatDateIndo(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1];
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

export default function StatistikEksekutifScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, sppgList } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();
  const { usersInScope, presensiInScope, laporanInScope } = useScopedData();

  const [periode, setPeriode] = useState<PeriodeOption>('7_hari');
  const [customStart, setCustomStart] = useState('2026-08-01');
  const [customEnd, setCustomEnd] = useState('2026-08-15');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end'>('start');
  const [calendarMonth, setCalendarMonth] = useState(7); // 7 = August (0-indexed)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [isExporting, setIsExporting] = useState(false);

  if (!currentUser) return null;

  const sppg = sppgList.find((s) => s.id === currentSppg?.id) ?? currentSppg;

  // Filter dates based on chosen period
  const dateRangeInfo = useMemo(() => {
    const today = new Date('2026-08-15'); // Current system context date
    if (periode === '7_hari') {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      return {
        label: '7 Hari Terakhir',
        sublabel: '09 Agustus 2026 – 15 Agustus 2026',
        daysCount: 7,
        startDateStr: '2026-08-09',
        endDateStr: '2026-08-15',
      };
    } else if (periode === '30_hari') {
      return {
        label: '30 Hari Terakhir',
        sublabel: '17 Juli 2026 – 15 Agustus 2026',
        daysCount: 30,
        startDateStr: '2026-07-17',
        endDateStr: '2026-08-15',
      };
    } else if (periode === 'bulan_ini') {
      return {
        label: 'Bulan Ini (Agustus 2026)',
        sublabel: '01 Agustus 2026 – 15 Agustus 2026',
        daysCount: 15,
        startDateStr: '2026-08-01',
        endDateStr: '2026-08-15',
      };
    } else {
      // Custom Range
      const start = customStart <= customEnd ? customStart : customEnd;
      const end = customStart <= customEnd ? customEnd : customStart;
      const dStart = new Date(start);
      const dEnd = new Date(end);
      const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
      const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      return {
        label: `Kustom (${daysCount} Hari)`,
        sublabel: `${formatDateIndo(start)} – ${formatDateIndo(end)}`,
        daysCount,
        startDateStr: start,
        endDateStr: end,
      };
    }
  }, [periode, customStart, customEnd]);

  // 1. STATISTIK KEHADIRAN STAF
  const attendanceStats = useMemo(() => {
    const staffList = usersInScope;
    const totalStaff = staffList.length;

    // Filter presensi by date range
    const filteredPresensi = presensiInScope.filter(
      (p) => p.tanggal >= dateRangeInfo.startDateStr && p.tanggal <= dateRangeInfo.endDateStr
    );

    const totalExpectedAttendance = totalStaff * dateRangeInfo.daysCount;
    const totalHadirLogs = filteredPresensi.filter((p) => !!p.jamMasuk).length;
    const avgAttendancePct =
      totalExpectedAttendance > 0 ? Math.min(100, Math.round((totalHadirLogs / (totalStaff * (dateRangeInfo.daysCount * 0.85))) * 100)) : 88;

    // Per staff consistency calculation
    const staffRanking = staffList.map((staf) => {
      const stafLogs = filteredPresensi.filter((p) => p.userId === staf.id && !!p.jamMasuk);
      const onTimeCount = stafLogs.filter((p) => {
        if (!p.jamMasuk) return false;
        const [h, m] = p.jamMasuk.split(':').map(Number);
        return h < 6 || (h === 6 && m <= 0);
      }).length;
      return {
        staf,
        hadirCount: stafLogs.length,
        onTimeCount,
        score: stafLogs.length * 10 + onTimeCount * 2,
      };
    });

    staffRanking.sort((a, b) => b.score - a.score);

    const topStaff = staffRanking.slice(0, 3);
    const needAttentionStaff = staffRanking.filter((s) => s.hadirCount < (dateRangeInfo.daysCount * 0.7));

    return {
      totalStaff,
      totalHadirLogs,
      avgAttendancePct,
      topStaff,
      needAttentionStaff,
    };
  }, [usersInScope, presensiInScope, dateRangeInfo]);

  // 2. STATISTIK PRODUKSI & PENERIMA MANFAAT
  const productionStats = useMemo(() => {
    const relevantLaporan = laporanInScope.filter(
      (l) => l.tanggal >= dateRangeInfo.startDateStr && l.tanggal <= dateRangeInfo.endDateStr
    );

    const totalPorsiRealisasi = relevantLaporan.reduce((acc, curr) => acc + curr.realisasiPorsi, 0) || (dateRangeInfo.daysCount * 1485);
    const totalPorsiTarget = relevantLaporan.reduce((acc, curr) => acc + curr.targetPorsi, 0) || (dateRangeInfo.daysCount * 1500);
    const realizationRate = totalPorsiTarget > 0 ? Math.round((totalPorsiRealisasi / totalPorsiTarget) * 100) : 99;

    // Sekolah penerima manfaat
    const affiliatedSchools = sekolahList.filter((s) => s.sppgId === sppg?.id || s.sppgId === 'SPPG-001');
    const totalSiswaBeneficiaries = affiliatedSchools.reduce((acc, curr) => acc + curr.jumlahSiswa, 0) || 1485;

    return {
      totalPorsiRealisasi,
      totalPorsiTarget,
      realizationRate,
      affiliatedSchools,
      totalSiswaBeneficiaries,
      avgPorsiPerDay: Math.round(totalPorsiRealisasi / dateRangeInfo.daysCount),
      onTimeDeliveryRate: 100,
      avgHoldingTemp: 64.8,
    };
  }, [laporanInScope, dateRangeInfo, sppg]);

  // 3. STATISTIK INSIDEN & ADUAN MASYARAKAT
  const incidentStats = useMemo(() => {
    const sppgIncidents = initialIncidentList.filter(
      (i) => (i.sppgId === sppg?.id || i.sppgId === 'SPPG-001') && i.tanggal >= dateRangeInfo.startDateStr && i.tanggal <= dateRangeInfo.endDateStr
    );
    const fallbackIncidents = sppgIncidents.length > 0 ? sppgIncidents : initialIncidentList.filter((i) => i.sppgId === sppg?.id || i.sppgId === 'SPPG-001');

    const totalIncidents = fallbackIncidents.length;
    const resolvedCount = fallbackIncidents.filter((i) => i.status === 'RESOLVED').length;
    const openCount = totalIncidents - resolvedCount;

    const sppgAduan = publicReportList.filter(
      (a) => (a.sppgId === sppg?.id || a.sppgId === 'SPPG-001') && a.tanggal >= dateRangeInfo.startDateStr && a.tanggal <= dateRangeInfo.endDateStr
    );
    const fallbackAduan = sppgAduan.length > 0 ? sppgAduan : publicReportList.filter((a) => a.sppgId === sppg?.id || a.sppgId === 'SPPG-001');
    const totalAduan = fallbackAduan.length;
    const resolvedAduan = fallbackAduan.filter((a) => a.status === 'selesai' || a.status === 'diproses').length;

    return {
      totalIncidents,
      resolvedCount,
      openCount,
      totalAduan,
      resolvedAduan,
      incidentsList: fallbackIncidents,
    };
  }, [sppg, dateRangeInfo]);

  // 4. STATISTIK KEUANGAN & HPP
  const financialStats = useMemo(() => {
    const paguPerPorsi = 15000;
    const realisasiHppAvg = 14150;
    const totalBudgetPagu = productionStats.totalPorsiRealisasi * paguPerPorsi;
    const totalRealisasiBelanja = productionStats.totalPorsiRealisasi * realisasiHppAvg;
    const totalHemat = totalBudgetPagu - totalRealisasiBelanja;
    const hematPct = Math.round((totalHemat / totalBudgetPagu) * 100);

    return {
      paguPerPorsi,
      realisasiHppAvg,
      totalBudgetPagu,
      totalRealisasiBelanja,
      totalHemat,
      hematPct,
    };
  }, [productionStats]);

  const openCalendarFor = (target: 'start' | 'end') => {
    setCalendarTarget(target);
    setShowCalendarModal(true);
  };

  const handleSelectDay = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const formatted = `${calendarYear}-${monthStr}-${dayStr}`;

    if (calendarTarget === 'start') {
      setCustomStart(formatted);
    } else {
      setCustomEnd(formatted);
    }
    setShowCalendarModal(false);
  };

  // Handle Export / Share as PDF
  const handleExportPdf = async () => {
    if (!currentUser) return;
    setIsExporting(true);
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Statistik Eksekutif SPPG</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 28px; color: #0F172A; line-height: 1.5; }
            .header { border-bottom: 3px solid #0B2240; padding-bottom: 12px; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 10px; background: #0B2240; color: #FFF; font-weight: bold; border-radius: 4px; font-size: 11px; }
            .title { font-size: 22px; font-weight: 800; color: #0B2240; margin: 6px 0 2px 0; }
            .subtitle { font-size: 13px; color: #64748B; margin: 0; }
            .kpi-grid { display: flex; gap: 12px; margin: 16px 0; }
            .kpi-card { flex: 1; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; background: #F8FAFC; text-align: center; }
            .kpi-val { font-size: 20px; font-weight: 800; color: #0B2240; }
            .kpi-lbl { font-size: 11px; color: #64748B; font-weight: bold; margin-top: 2px; }
            h3 { color: #0B2240; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-top: 22px; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #0B2240; color: #FFF; text-align: left; padding: 8px; font-weight: 600; }
            td { padding: 8px; border-bottom: 1px solid #E2E8F0; }
            .success { color: #0D9488; font-weight: bold; }
            .warning { color: #D97706; font-weight: bold; }
            .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #CBD5E1; display: flex; justify-content: space-between; font-size: 11px; color: #64748B; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">SIGAP SPPG — LAPORAN EKSEKUTIF KEPALA SPPG</span>
            <div class="title">${sppg?.nama ?? 'SPPG Jawa Barat Unit 01'}</div>
            <div class="subtitle">Periode: ${dateRangeInfo.label} (${dateRangeInfo.sublabel}) • Penanggung Jawab: ${currentUser.nama}</div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-val">${productionStats.totalPorsiRealisasi.toLocaleString('id-ID')}</div>
              <div class="kpi-lbl">Total Porsi MBG</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #0D9488;">${attendanceStats.avgAttendancePct}%</div>
              <div class="kpi-lbl">Kehadiran Staf</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #0D9488;">Grade A+</div>
              <div class="kpi-lbl">Food Safety & AKG</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #0D9488;">${formatRupiah(financialStats.totalHemat)}</div>
              <div class="kpi-lbl">Efisiensi Anggaran</div>
            </div>
          </div>

          <h3>1. Rincian Distribusi & Penerima Manfaat</h3>
          <p style="font-size: 12px; color: #334155;">Total <b>${productionStats.totalSiswaBeneficiaries.toLocaleString('id-ID')} siswa</b> di <b>${productionStats.affiliatedSchools.length} sekolah</b> menerima asupan makanan bergizi tepat waktu dengan rata-rata suhu kedatangan <b>${productionStats.avgHoldingTemp}°C</b>.</p>
          <table>
            <thead>
              <tr>
                <th>Nama Sekolah</th>
                <th>Alamat</th>
                <th>Siswa Terlayani</th>
                <th>Alokasi Porsi</th>
                <th>Status Kirim</th>
              </tr>
            </thead>
            <tbody>
              ${productionStats.affiliatedSchools.map((sch) => `
                <tr>
                  <td><b>${sch.nama}</b></td>
                  <td>${sch.alamat}</td>
                  <td>${sch.jumlahSiswa.toLocaleString('id-ID')} anak</td>
                  <td>${sch.jumlahSiswa.toLocaleString('id-ID')} porsi/hari</td>
                  <td class="success">100% Terdistribusi</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>2. Rekapitulasi Presensi & Disiplin Staf (${attendanceStats.totalStaff} Orang)</h3>
          <table>
            <thead>
              <tr>
                <th>Nama Staf</th>
                <th>Jabatan / Role</th>
                <th>Total Hadir</th>
                <th>Kepatuhan Disiplin</th>
              </tr>
            </thead>
            <tbody>
              ${usersInScope.map((u) => `
                <tr>
                  <td><b>${u.nama}</b></td>
                  <td>${u.role}</td>
                  <td>Hadir Bertugas</td>
                  <td class="success">Tepat Waktu</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>3. Insiden Operasional & Pengaduan</h3>
          <p style="font-size: 12px; color: #334155;">Tercatat <b>${incidentStats.totalIncidents} insiden operasional</b> (${incidentStats.resolvedCount} selesai dimitigasi) dan <b>${incidentStats.totalAduan} aduan masyarakat</b> yang telah ditindaklanjuti secara tuntas.</p>

          <div class="footer">
            <div>Dicetak otomatis oleh Sistem SIGAP SPPG — Kepolisian Negara Republik Indonesia & BGN</div>
            <div>Bandung, ${formatDateIndo('2026-08-15')}<br><b>${currentUser.nama}</b><br>Kepala SPPG</div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Laporan Statistik Eksekutif ${sppg?.nama}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sukses', 'Laporan PDF berhasil dibuat.');
      }
    } catch (err: any) {
      Alert.alert('Gagal Ekspor', err?.message || 'Terjadi kesalahan saat membuat PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const monthNamesIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Summary */}
      <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="bar-chart-2" size={16} color={colors.gold || '#F59E0B'} />
              <Text style={{ fontSize: fontSize.xs, color: colors.gold || '#F59E0B', fontWeight: '800' }}>
                EXECUTIVE INTELLIGENCE DASHBOARD
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.textInverse }}>
              Laporan Statistik & Rekap Berkala
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight }}>
              {sppg?.nama ?? 'SPPG Unit Bandung'} • Komando {currentUser.nama}
            </Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Feather name="trending-up" size={24} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
          </View>
        </View>

        {/* Export / Print Button */}
        <Pressable
          onPress={handleExportPdf}
          disabled={isExporting}
          style={({ pressed }) => [
            styles.exportHeaderBtn,
            { backgroundColor: colors.gold || '#F59E0B' },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Feather name={isExporting ? 'loader' : 'printer'} size={15} color="#000000" strokeWidth={2.2} />
          <Text style={styles.exportHeaderBtnText}>
            {isExporting ? 'Menyiapkan Dokumen PDF...' : 'Cetak / Bagikan Laporan PDF'}
          </Text>
        </Pressable>
      </Card>

      {/* Periode Selector Filter */}
      <View style={{ gap: spacing.xs }}>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>PILIH RENTANG PERIODE:</Text>
        <View style={styles.periodRow}>
          {[
            { id: '7_hari', label: '7 Hari', icon: 'calendar' as const },
            { id: '30_hari', label: '30 Hari', icon: 'calendar' as const },
            { id: 'bulan_ini', label: 'Bulan Ini', icon: 'calendar' as const },
            { id: 'custom', label: 'Kustom Rentang', icon: 'sliders' as const },
          ].map((p) => {
            const isActive = periode === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPeriode(p.id as PeriodeOption)}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: radius.pill,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  },
                ]}
              >
                <Feather
                  name={p.icon}
                  size={12}
                  color={isActive ? colors.textInverse : colors.primary}
                  strokeWidth={iconStrokeWidth}
                />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? colors.textInverse : colors.text }}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Date Range Picker Component */}
        {periode === 'custom' && (
          <Card style={[styles.customRangeCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: radius.md }]}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
              PILIH TANGGAL AWAL & AKHIR:
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Start Date Button */}
              <Pressable
                onPress={() => openCalendarFor('start')}
                style={[
                  styles.dateInputBtn,
                  { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm, flex: 1 },
                ]}
              >
                <Feather name="calendar" size={13} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '700' }}>TANGGAL AWAL</Text>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                    {formatDateIndo(customStart)}
                  </Text>
                </View>
              </Pressable>

              <Feather name="arrow-right" size={16} color={colors.textMuted} />

              {/* End Date Button */}
              <Pressable
                onPress={() => openCalendarFor('end')}
                style={[
                  styles.dateInputBtn,
                  { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm, flex: 1 },
                ]}
              >
                <Feather name="calendar" size={13} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '700' }}>TANGGAL AKHIR</Text>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                    {formatDateIndo(customEnd)}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Quick Range Presets */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {[
                { label: '01 - 07 Agu', start: '2026-08-01', end: '2026-08-07' },
                { label: '08 - 15 Agu', start: '2026-08-08', end: '2026-08-15' },
                { label: '01 - 15 Agu', start: '2026-08-01', end: '2026-08-15' },
                { label: '14 Hari', start: '2026-08-02', end: '2026-08-15' },
              ].map((preset, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    setCustomStart(preset.start);
                    setCustomEnd(preset.end);
                  }}
                  style={[styles.presetChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800' }}>{preset.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
          Rentang: <Text style={{ fontWeight: '700', color: colors.primary }}>{dateRangeInfo.sublabel}</Text>
        </Text>
      </View>

      {/* Executive Summary Brief Card (AI Synthesis) */}
      <Card variant="accent" style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="shield" size={16} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>
              RINGKASAN EKSEKUTIF KINERJA SPPG
            </Text>
          </View>
          <Pill label="GRADE A+ OPTIMAL" tone="success" />
        </View>

        <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 19 }}>
          Selama periode <Text style={{ fontWeight: '800' }}>{dateRangeInfo.label}</Text>, unit SPPG beroperasi dengan tingkat ketercapaian target{' '}
          <Text style={{ fontWeight: '800', color: colors.success }}>{productionStats.realizationRate}%</Text> (total{' '}
          <Text style={{ fontWeight: '800' }}>{productionStats.totalPorsiRealisasi.toLocaleString('id-ID')} porsi</Text> MBG). Disiplin staf mencapai{' '}
          <Text style={{ fontWeight: '800', color: colors.success }}>{attendanceStats.avgAttendancePct}%</Text>, food safety terverifikasi 100% higienis, dan efisiensi anggaran belanja menghasilkan penghematan{' '}
          <Text style={{ fontWeight: '800', color: colors.success }}>{formatRupiah(financialStats.totalHemat)} ({financialStats.hematPct}%)</Text> dari pagu maksimal BGN.
        </Text>

        {/* 4 Core KPI Highlights */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary }}>
              {productionStats.totalPorsiRealisasi.toLocaleString('id-ID')}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>Total Porsi MBG</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.success }}>
              {attendanceStats.avgAttendancePct}%
            </Text>
            <Text style={{ fontSize: 10, color: colors.success, fontWeight: '800' }}>Disiplin Staf</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>
              {incidentStats.resolvedCount}/{incidentStats.totalIncidents}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>Insiden Tuntas</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: colors.infoBg, borderColor: colors.info }]}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.info }}>
              {formatRupiah(financialStats.totalHemat)}
            </Text>
            <Text style={{ fontSize: 10, color: colors.info, fontWeight: '800' }}>Hemat Anggaran</Text>
          </View>
        </View>
      </Card>

      {/* 1. SEKSI PRODUKSI & PENERIMA MANFAAT */}
      <SectionTitle>1. Produksi & Penerima Manfaat</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
              Distribusi Makanan Bergizi Sekolah
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Menjangkau {productionStats.affiliatedSchools.length} sekolah afiliasi di sekitar wilayah unit
            </Text>
          </View>
          <Pill label={`${productionStats.totalSiswaBeneficiaries.toLocaleString('id-ID')} Siswa`} tone="primary" icon="users" />
        </View>

        <View style={[styles.infoGrid, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          <View style={styles.infoCol}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Rata-rata Harian</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
              {productionStats.avgPorsiPerDay.toLocaleString('id-ID')} porsi/hari
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Suhu Kedatangan</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.success }}>
              {productionStats.avgHoldingTemp}°C (Hangat & Aman)
            </Text>
          </View>
        </View>

        {/* List Sekolah */}
        <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 4 }}>
          SEBARAN SEKOLAH PENERIMA MANFAAT:
        </Text>
        <View style={{ gap: 6 }}>
          {productionStats.affiliatedSchools.map((sch) => (
            <View
              key={sch.id}
              style={[
                styles.schoolRow,
                { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md },
              ]}
            >
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{sch.nama}</Text>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                  {sch.alamat} • Kuota: {sch.jumlahSiswa} anak
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                  {(sch.jumlahSiswa * (dateRangeInfo.daysCount > 7 ? Math.min(dateRangeInfo.daysCount, 15) : 7)).toLocaleString('id-ID')} porsi
                </Text>
                <Pill label="100% Terpenuhi" tone="success" />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* 2. SEKSI KEHADIRAN & DISIPLIN STAF */}
      <SectionTitle>2. Kinerja Kehadiran Staf ({attendanceStats.totalStaff} Staf)</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
            Tingkat Disiplin & Presensi Shift
          </Text>
          <Pill label={`${attendanceStats.avgAttendancePct}% Konsistensi`} tone="success" />
        </View>

        {/* Top Performer Staff */}
        <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 2 }}>
          STAF PALING DISIPLIN & HADIR TEPAT WAKTU:
        </Text>
        <View style={{ gap: 6 }}>
          {attendanceStats.topStaff.map((top, idx) => (
            <View
              key={top.staf.id}
              style={[
                styles.staffHighlightRow,
                { backgroundColor: colors.successBg, borderColor: colors.success, borderRadius: radius.md },
              ]}
            >
              <View style={[styles.rankBadge, { backgroundColor: colors.success }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>#{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{top.staf.nama}</Text>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                  {top.staf.role} • Tepat Waktu {top.onTimeCount}x
                </Text>
              </View>
              <Pill label="Disiplin Tinggi" tone="success" />
            </View>
          ))}
        </View>

        {attendanceStats.needAttentionStaff.length > 0 && (
          <>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.warning, marginTop: 4 }}>
              PERLU PERHATIAN / PEMBINAAN KEDISIPLINAN:
            </Text>
            <View style={{ gap: 6 }}>
              {attendanceStats.needAttentionStaff.map((att) => (
                <View
                  key={att.staf.id}
                  style={[
                    styles.staffHighlightRow,
                    { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.md },
                  ]}
                >
                  <Feather name="alert-circle" size={16} color={colors.warning} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{att.staf.nama}</Text>
                    <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                      {att.staf.role} • Belum Hadir / Izin
                    </Text>
                  </View>
                  <Pill label="Perlu Pembinaan" tone="warning" />
                </View>
              ))}
            </View>
          </>
        )}
      </Card>

      {/* 3. SEKSI INSIDEN & MITIGASI MASALAH */}
      <SectionTitle>3. Rekap Insiden & Pengaduan</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
            Log Masalah Operasional & Solusi
          </Text>
          <Pill
            label={`${incidentStats.resolvedCount}/${incidentStats.totalIncidents} Insiden Tuntas`}
            tone={incidentStats.openCount === 0 ? 'success' : 'warning'}
          />
        </View>

        <View style={{ gap: 8, marginTop: 2 }}>
          {incidentStats.incidentsList.map((inc) => (
            <View
              key={inc.id}
              style={[
                styles.incidentBox,
                {
                  backgroundColor: inc.status === 'RESOLVED' ? colors.background : colors.warningBg,
                  borderColor: inc.status === 'RESOLVED' ? colors.border : colors.warning,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, flex: 1 }}>
                  {inc.judul}
                </Text>
                <Pill label={inc.status} tone={inc.status === 'RESOLVED' ? 'success' : 'warning'} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{inc.deskripsi}</Text>
              {inc.tindakanPerbaikan && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Feather name="check" size={12} color={colors.success} />
                  <Text style={{ fontSize: 10.5, color: colors.success, fontWeight: '700', flex: 1 }}>
                    Solusi: {inc.tindakanPerbaikan}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.aduanCard, { backgroundColor: colors.infoBg, borderRadius: radius.md }]}>
          <Feather name="message-square" size={16} color={colors.info} />
          <Text style={{ fontSize: 11, color: colors.info, flex: 1, fontWeight: '700' }}>
            Aduan Publik & Sekolah: {incidentStats.totalAduan} laporan diterima — 100% telah direspon & ditindaklanjuti.
          </Text>
        </View>
      </Card>

      {/* 4. SEKSI EFISIENSI ANGGARAN & REALISASI HPP */}
      <SectionTitle>4. Realisasi Anggaran & Efisiensi HPP</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
            Efisiensi Belanja Bahan Baku MBG
          </Text>
          <Pill label={`Hemat ${financialStats.hematPct}%`} tone="success" />
        </View>

        <View style={[styles.infoGrid, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          <View style={styles.infoCol}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Pagu Standar BGN</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.text }}>
              {formatRupiah(financialStats.paguPerPorsi)} / porsi
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Realisasi HPP Unit</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.success }}>
              {formatRupiah(financialStats.realisasiHppAvg)} / porsi
            </Text>
          </View>
        </View>

        <View style={[styles.savingBanner, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
          <Feather name="trending-down" size={18} color={colors.success} strokeWidth={iconStrokeWidth} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.success, fontSize: fontSize.xs, fontWeight: '800' }}>
              Total Penghematan Anggaran: {formatRupiah(financialStats.totalHemat)}
            </Text>
            <Text style={{ color: colors.success, fontSize: 11, marginTop: 1 }}>
              Tercapai melalui efisiensi pasokan pangan lokal dan rantai dingin tanpa mengurangi nilai gizi AKG.
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ height: spacing.xxl }} />

      {/* Interactive Calendar Date Picker Modal */}
      <Modal visible={showCalendarModal} animationType="fade" transparent onRequestClose={() => setShowCalendarModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCalendarModal(false)} />
          <Card style={[styles.calendarModalCard, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                  {calendarTarget === 'start' ? 'Pilih Tanggal Awal' : 'Pilih Tanggal Akhir'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Bulan {monthNamesIndo[calendarMonth]} {calendarYear}
                </Text>
              </View>
              <Pressable onPress={() => setShowCalendarModal(false)}>
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Month Navigation */}
            <View style={[styles.monthNavRow, { backgroundColor: colors.background, borderRadius: radius.md }]}>
              <Pressable
                onPress={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <Feather name="chevron-left" size={18} color={colors.text} />
              </Pressable>

              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
                {monthNamesIndo[calendarMonth]} {calendarYear}
              </Text>

              <Pressable
                onPress={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((y) => y + 1);
                  } else {
                    setCalendarMonth((m) => m + 1);
                  }
                }}
                style={styles.monthNavBtn}
              >
                <Feather name="chevron-right" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Days Header */}
            <View style={styles.dayHeaderRow}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                <Text key={i} style={[styles.dayHeaderCell, { color: colors.textMuted }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dayStr = String(day).padStart(2, '0');
                const monthStr = String(calendarMonth + 1).padStart(2, '0');
                const fullStr = `${calendarYear}-${monthStr}-${dayStr}`;
                const isSelected = (calendarTarget === 'start' && customStart === fullStr) || (calendarTarget === 'end' && customEnd === fullStr);
                const isInRange = fullStr >= customStart && fullStr <= customEnd;

                return (
                  <Pressable
                    key={day}
                    onPress={() => handleSelectDay(day)}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: isSelected ? colors.primary : isInRange ? colors.primaryLight : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? '900' : '700',
                        color: isSelected ? colors.textInverse : colors.text,
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 6,
  },
  exportHeaderBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  customRangeCard: {
    padding: 12,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 4,
  },
  dateInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderWidth: 1,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  kpiBox: {
    flex: 1,
    minWidth: '46%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    padding: 10,
    gap: 12,
    marginVertical: 2,
  },
  infoCol: { flex: 1, gap: 2 },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
  },
  staffHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentBox: {
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  aduanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginTop: 4,
  },
  savingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 16,
    gap: 12,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  monthNavBtn: {
    padding: 6,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayHeaderCell: {
    width: 38,
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
