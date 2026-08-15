import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  sppgList as initialSppg,
  users as initialUsers,
  laporanList as initialLaporan,
  presensiList as initialPresensi,
  checklistList as initialChecklist,
  foodSafetyList as initialFoodSafety,
  alertList as initialAlert,
  cctvEvents as initialCctvEvents,
  bahanBakuList as initialBahanBaku,
  permintaanBahanList as initialPermintaanBahan,
  distribusiList as initialDistribusi,
  chatMessages as initialChatMessages,
  sekolahList as initialSekolah,
  menuHarianPlanList as initialMenuHarianPlan,
  mitraList as initialMitra,
  mutasiStokList as initialMutasiStok,
  publicReportList as initialPublicReports,
  peralatanList as initialPeralatanList,
  usulanMenuList as initialUsulanMenu,
  initialBroadcastList,
  initialAnggaranLogs,
  initialPengajuanSekolahList,
  initialIncidentList,
  initialKandunganGiziList,
  initialPengajuanAsetList,
  INITIAL_ACTIVITY_LOGS,
  CCTV_ANOMALI_LABEL,
  findAccount,
} from '../mock';
import {
  AlertLog,
  AnggaranLog,
  BuktiMedia,
  PengajuanAset,
  StatusPengajuanAset,
  BahanBaku,
  BroadcastMessage,
  CctvEvent,
  ChatMessage,
  ChecklistHarian,
  ChecklistItem,
  DistribusiRute,
  FoodSafetyLog,
  LaporanProduksi,
  MenuHarianPlan,
  Mitra,
  MutasiStok,
  Peralatan,
  PengajuanSekolah,
  PermintaanBahan,
  Presensi,
  PublicReport,
  Role,
  Sekolah,
  Sppg,
  StatusPengajuanSekolah,
  User,
  MasterMenu,
  UsulanMenu,
  QcStatus,
  IncidentReport,
  IncidentStatus,
  KandunganGiziHarian,
  LaporanPacking,
  LaporanSanitasi,
  BatchTraceabilityRecord,
  FoodQualityPassport,
  CostPerMealBreakdown,
  KitchenReadinessScore,
  AiKitchenEarlyWarning,
  SystemActivityLog,
} from '../types';
import { MASTER_MENU_CATALOG } from '../mock/masterMenu';
import { INITIAL_LAPORAN_PACKING } from '../mock/laporanPacking';
import { INITIAL_LAPORAN_SANITASI } from '../mock/laporanSanitasi';
import { INITIAL_BATCH_TRACEABILITY } from '../mock/batchTraceability';
import { INITIAL_QUALITY_PASSPORTS } from '../mock/qualityPassport';
import { INITIAL_COST_PER_MEAL, INITIAL_KITCHEN_READINESS, INITIAL_AI_EARLY_WARNINGS } from '../mock/kitchenAi';

// Fase 2 (simulasi) — daftar jenis anomali CCTV yang dipakai simulateCctvDetection
// untuk memilih anomali secara berputar (tanpa dependency random).
const CCTV_ANOMALI_TYPES: CctvEvent['anomaliType'][] = ['apd_tidak_lengkap', 'kerumunan', 'area_terlarang', 'kebersihan'];

// Cold-storage safety threshold: above 8°C is treated as an emergency food-safety event.
const SUHU_AMAN_MAX = 8;

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

interface AppContextValue {
  progressProduksiRealtime: number;
  role: Role | null;
  loggedIn: boolean;
  login: (nikOrId: string, password: string) => boolean;
  logout: () => void;
  currentUser: User | null;
  currentSppg: Sppg | null;
  sppgList: Sppg[];
  users: User[];
  laporanList: LaporanProduksi[];
  presensiList: Presensi[];
  checklistList: ChecklistHarian[];
  foodSafetyList: FoodSafetyLog[];
  alertList: AlertLog[];
  peralatanList: Peralatan[];
  updatePeralatanStatus: (id: string, status: Peralatan['status'], catatanKondisi?: string) => void;
  publicReportList: PublicReport[];
  submitPublicReport: (report: Omit<PublicReport, 'id' | 'timestamp' | 'status'>) => void;
  updatePublicReportStatus: (id: string, status: PublicReport['status'], tanggapan?: string) => void;
  usulanMenuList: UsulanMenu[];
  submitUsulanMenu: (usulan: Omit<UsulanMenu, 'id' | 'status' | 'tanggapan'>) => void;
  updateUsulanMenuStatus: (id: string, status: UsulanMenu['status'], tanggapan?: string) => void;
  broadcastList: BroadcastMessage[];
  sendBroadcast: (msg: Omit<BroadcastMessage, 'id' | 'timestamp'>) => void;
  anggaranLogs: AnggaranLog[];
  addAnggaranLog: (log: Omit<AnggaranLog, 'id' | 'tanggal'>) => void;
  pengajuanAsetList: PengajuanAset[];
  ajukanAset: (payload: Omit<PengajuanAset, 'id' | 'tanggal' | 'status' | 'anggaranLogId' | 'tanggapan'>) => void;
  updateStatusPengajuanAset: (id: string, status: StatusPengajuanAset, tanggapan?: string) => void;
  pengajuanSekolahList: PengajuanSekolah[];
  ajukanSekolah: (pengajuan: Omit<PengajuanSekolah, 'id' | 'tanggal' | 'status' | 'tanggapan'>) => void;
  updateStatusPengajuanSekolah: (id: string, status: StatusPengajuanSekolah, tanggapan?: string) => void;
  cctvEvents: CctvEvent[];
  bahanBakuList: BahanBaku[];
  permintaanBahanList: PermintaanBahan[];
  distribusiList: DistribusiRute[];
  chatMessages: ChatMessage[];
  sekolahList: Sekolah[];
  addSekolah: (sekolah: Omit<Sekolah, 'id'>) => void;
  menuHarianPlanList: MenuHarianPlan[];
  setMenuForDate: (sppgId: string, tanggal: string, menu: string, kategoriGizi?: string, fotoMenu?: string) => void;
  mitraList: Mitra[];
  mutasiStokList: MutasiStok[];
  masterMenuList: MasterMenu[];
  addMasterMenu: (menu: Omit<MasterMenu, 'id'>) => void;
  updateMasterMenu: (menu: MasterMenu) => void;
  deleteMasterMenu: (id: string) => void;
  catatMutasiStok: (payload: Omit<MutasiStok, 'id' | 'tanggal'>) => void;
  reviewCctvEvent: (id: string) => void;
  simulateCctvDetection: (sppgId: string) => void;
  ajukanPermintaanBahan: (payload: Omit<PermintaanBahan, 'id' | 'status' | 'tanggal'>) => void;
  updatePermintaanStatus: (id: string, status: PermintaanBahan['status']) => void;
  updateDistribusiStatus: (id: string, status: DistribusiRute['status'], buktiFoto?: string) => void;
  laporkanKendalaDistribusi: (id: string, rincian: string, bukti: BuktiMedia[], pelapor: string) => void;
  sendChatMessage: (sppgId: string, text: string) => void;
  addStaff: (user: Omit<User, 'id'>) => void;
  removeStaff: (userId: string) => void;
  checkIn: (userId: string, fotoUri: string | null, geotag: { lat: number; lng: number } | null) => void;
  checkOut: (userId: string, fotoUri: string | null, geotag: { lat: number; lng: number } | null) => void;
  saveLaporanDraft: (laporan: (Omit<LaporanProduksi, 'id' | 'timestamp' | 'status'> & { id?: string })) => void;
  submitLaporan: (laporanId: string) => void;
  verifyLaporan: (laporanId: string) => void;
  approveQcLaporan: (
    laporanId: string,
    qcStatus: QcStatus,
    qcNotes?: string,
    qcApprovedBy?: string,
    qcGrade?: 'A+' | 'A' | 'B' | 'C',
    qcScore?: number,
  ) => void;
  updateProductionStage: (laporanId: string, stage: 'preparation' | 'cooking' | 'qc' | 'packing' | 'ready') => void;
  submitChecklist: (checklist: ChecklistHarian) => void;
  submitFoodSafetyLog: (log: FoodSafetyLog) => void;
  addAlert: (alert: Omit<AlertLog, 'id' | 'timestamp' | 'statusTindakLanjut'>) => void;
  resolveAlert: (alertId: string) => void;
  followUpAlert: (alertId: string) => void;
  eskalasiAlert: (alertId: string) => void;
  incidentList: IncidentReport[];
  submitIncident: (incident: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus, tindakanPerbaikan?: string) => void;
  kandunganGiziList: KandunganGiziHarian[];
  addKandunganGiziLog: (payload: Omit<KandunganGiziHarian, 'id' | 'createdAt'>) => void;
  laporanPackingList: LaporanPacking[];
  submitLaporanPacking: (payload: Omit<LaporanPacking, 'id' | 'createdAt'>) => void;
  laporanSanitasiList: LaporanSanitasi[];
  submitLaporanSanitasi: (payload: Omit<LaporanSanitasi, 'id' | 'createdAt'>) => void;
  batchTraceabilityList: BatchTraceabilityRecord[];
  qualityPassportList: FoodQualityPassport[];
  costPerMeal: CostPerMealBreakdown;
  kitchenReadinessScore: KitchenReadinessScore;
  aiEarlyWarnings: AiKitchenEarlyWarning[];
  updateCostPerMeal: (payload: Partial<CostPerMealBreakdown>) => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  activityLogs: SystemActivityLog[];
  addActivityLog: (log: Omit<SystemActivityLog, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progressProduksiRealtime, setProgressProduksiRealtime] = useState<number>(1240);
  const [publicReportList, setPublicReportList] = useState<PublicReport[]>(initialPublicReports);
  const [usulanMenuList, setUsulanMenuList] = useState<UsulanMenu[]>(initialUsulanMenu);
  const [peralatanList, setPeralatanList] = useState<Peralatan[]>(initialPeralatanList);
  const [role, setRole] = useState<Role | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sppgList, setSppgList] = useState<Sppg[]>(initialSppg);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [laporanList, setLaporanList] = useState<LaporanProduksi[]>(initialLaporan);
  const [presensiList, setPresensiList] = useState<Presensi[]>(initialPresensi);
  const [checklistList, setChecklistList] = useState<ChecklistHarian[]>(initialChecklist);
  const [foodSafetyList, setFoodSafetyList] = useState<FoodSafetyLog[]>(initialFoodSafety);
  const [alertList, setAlertList] = useState<AlertLog[]>(initialAlert);
  const [cctvEvents, setCctvEvents] = useState<CctvEvent[]>(initialCctvEvents);
  const [bahanBakuList, setBahanBakuList] = useState<BahanBaku[]>(initialBahanBaku);
  const [permintaanBahanList, setPermintaanBahanList] = useState<PermintaanBahan[]>(initialPermintaanBahan);
  const [distribusiList, setDistribusiList] = useState<DistribusiRute[]>(initialDistribusi);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [sekolahList, setSekolahList] = useState<Sekolah[]>(initialSekolah);
  const [menuHarianPlanList, setMenuHarianPlanList] = useState<MenuHarianPlan[]>(initialMenuHarianPlan);
  const [mitraList, setMitraList] = useState<Mitra[]>(initialMitra);
  const [mutasiStokList, setMutasiStokList] = useState<MutasiStok[]>(initialMutasiStok);
  const [masterMenuList, setMasterMenuList] = useState<MasterMenu[]>(MASTER_MENU_CATALOG);
  const [broadcastList, setBroadcastList] = useState<BroadcastMessage[]>(initialBroadcastList);
  const [anggaranLogs, setAnggaranLogs] = useState<AnggaranLog[]>(initialAnggaranLogs);
  const [pengajuanSekolahList, setPengajuanSekolahList] = useState<PengajuanSekolah[]>(initialPengajuanSekolahList);
  const [pengajuanAsetList, setPengajuanAsetList] = useState<PengajuanAset[]>(initialPengajuanAsetList);
  const [incidentList, setIncidentList] = useState<IncidentReport[]>(initialIncidentList);
  const [kandunganGiziList, setKandunganGiziList] = useState<KandunganGiziHarian[]>(initialKandunganGiziList);
  const [laporanPackingList, setLaporanPackingList] = useState<LaporanPacking[]>(INITIAL_LAPORAN_PACKING);
  const [laporanSanitasiList, setLaporanSanitasiList] = useState<LaporanSanitasi[]>(INITIAL_LAPORAN_SANITASI);
  const [batchTraceabilityList, setBatchTraceabilityList] = useState<BatchTraceabilityRecord[]>(INITIAL_BATCH_TRACEABILITY);
  const [qualityPassportList, setQualityPassportList] = useState<FoodQualityPassport[]>(INITIAL_QUALITY_PASSPORTS);
   const [costPerMeal, setCostPerMeal] = useState<CostPerMealBreakdown>(INITIAL_COST_PER_MEAL);
  const [kitchenReadinessScore, setKitchenReadinessScore] = useState<KitchenReadinessScore>(INITIAL_KITCHEN_READINESS);
  const [aiEarlyWarnings, setAiEarlyWarnings] = useState<AiKitchenEarlyWarning[]>(INITIAL_AI_EARLY_WARNINGS);
  const [activityLogs, setActivityLogs] = useState<SystemActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  const addActivityLog: AppContextValue['addActivityLog'] = (log) => {
    const id = `ACT-${Date.now().toString().slice(-8)}`;
    const timestamp = nowTimestamp();
    const newLog: SystemActivityLog = {
      ...log,
      id,
      timestamp,
      ipAddress: log.ipAddress || '10.12.4.88',
      deviceInfo: log.deviceInfo || 'Dinas SPPG Mobile App (Secured)',
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const updateCurrentUser: AppContextValue['updateCurrentUser'] = (patch) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...patch };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    addActivityLog({
      sppgId: currentUser.sppgId,
      userId: currentUser.id,
      userName: currentUser.nama,
      userRole: currentUser.role,
      kategori: 'pengaturan',
      aksi: 'Perbarui Profil Akun',
      rincian: patch.fotoProfil
        ? 'Memperbarui foto profil akun pengguna dari kamera/galeri'
        : 'Memperbarui informasi profil pengguna',
      status: 'SUCCESS',
    });
  };

  const updateCostPerMeal: AppContextValue['updateCostPerMeal'] = (payload) => {
    setCostPerMeal((prev) => {
      const updated = { ...prev, ...payload };
      const totalCostPerPorsi =
        updated.bahanBaku + updated.bumbuMinyak + updated.kemasanSeal + updated.energiDapur + updated.transportBbm;
      const hematEfisiensiPct = Math.round(((updated.paguStandarBgn - totalCostPerPorsi) / updated.paguStandarBgn) * 1000) / 10;
      return { ...updated, totalCostPerPorsi, hematEfisiensiPct };
    });
  };

  const submitLaporanPacking: AppContextValue['submitLaporanPacking'] = (payload) => {
    const id = `LPK-${Date.now().toString().slice(-8)}`;
    const createdAt = nowTimestamp();
    const newLaporan: LaporanPacking = { ...payload, id, createdAt };
    setLaporanPackingList((prev) => [newLaporan, ...prev.filter((p) => p.tanggal !== payload.tanggal || p.sppgId !== payload.sppgId)]);
  };

  const submitLaporanSanitasi: AppContextValue['submitLaporanSanitasi'] = (payload) => {
    const id = `LSN-${Date.now().toString().slice(-8)}`;
    const createdAt = nowTimestamp();
    const newLaporan: LaporanSanitasi = { ...payload, id, createdAt };
    setLaporanSanitasiList((prev) => [newLaporan, ...prev.filter((s) => s.tanggal !== payload.tanggal || s.sppgId !== payload.sppgId)]);
  };

  const addKandunganGiziLog: AppContextValue['addKandunganGiziLog'] = (payload) => {
    const id = `GZI-${Date.now().toString().slice(-8)}`;
    const createdAt = nowTimestamp();
    setKandunganGiziList((prev) => [{ ...payload, id, createdAt }, ...prev]);
  };

  const sendBroadcast: AppContextValue['sendBroadcast'] = (msg) => {
    const id = `BC-${String(broadcastList.length + 1).padStart(3, '0')}`;
    const timestamp = nowTimestamp();
    setBroadcastList((prev) => [{ ...msg, id, timestamp }, ...prev]);
  };

  const addAnggaranLog: AppContextValue['addAnggaranLog'] = (log) => {
    const id = `ANG-${String(anggaranLogs.length + 1).padStart(3, '0')}`;
    const tanggal = todayDate();
    setAnggaranLogs((prev) => [{ ...log, id, tanggal }, ...prev]);
  };

  const ajukanSekolah: AppContextValue['ajukanSekolah'] = (pengajuan) => {
    const id = `PGJ-${String(pengajuanSekolahList.length + 1).padStart(3, '0')}`;
    const tanggal = todayDate();
    setPengajuanSekolahList((prev) => [
      { ...pengajuan, id, tanggal, status: 'diajukan' },
      ...prev,
    ]);
  };

  // Pengadaan aset dapur. Jalur 'mandiri' memotong anggaran unit saat itu juga
  // dengan menulis satu AnggaranLog pengeluaran kategori peralatan_dapur —
  // itulah yang bikin saldo di layar anggaran ikut turun. Jalur 'pusat' hanya
  // mencatat pengajuan; anggaran unit tidak tersentuh sama sekali.
  const ajukanAset: AppContextValue['ajukanAset'] = (payload) => {
    const id = `ASE-${String(pengajuanAsetList.length + 1).padStart(3, '0')}`;
    const tanggal = todayDate();
    let anggaranLogId: string | null = null;

    if (payload.jalur === 'mandiri') {
      anggaranLogId = `ANG-${String(anggaranLogs.length + 1).padStart(3, '0')}`;
      setAnggaranLogs((prev) => [
        {
          id: anggaranLogId as string,
          tanggal,
          sppgId: payload.sppgId,
          jenis: 'pengeluaran',
          kategori: 'peralatan_dapur',
          nominal: payload.totalHarga,
          keterangan: `Pengadaan aset dapur: ${payload.namaAset} (${payload.jumlah} ${payload.satuan})`,
          buktiNota: payload.buktiNota ?? null,
          dibuatOleh: payload.diajukanOleh,
          namaSupplier: payload.namaSupplier,
          noInvoice: payload.noInvoice,
          items: [
            {
              namaBarang: payload.namaAset,
              jumlah: payload.jumlah,
              satuan: payload.satuan,
              hargaSatuan: payload.hargaSatuan,
              totalHarga: payload.totalHarga,
            },
          ],
        },
        ...prev,
      ]);
    }

    setPengajuanAsetList((prev) => [
      {
        ...payload,
        id,
        tanggal,
        status: payload.jalur === 'mandiri' ? 'diterima' : 'diajukan',
        anggaranLogId,
        tanggapan: null,
      },
      ...prev,
    ]);
  };

  const updateStatusPengajuanAset: AppContextValue['updateStatusPengajuanAset'] = (id, status, tanggapan) => {
    setPengajuanAsetList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, tanggapan: tanggapan ?? item.tanggapan } : item)),
    );
  };

  const updateStatusPengajuanSekolah: AppContextValue['updateStatusPengajuanSekolah'] = (id, status, tanggapan) => {
    setPengajuanSekolahList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, status, tanggapan: tanggapan ?? item.tanggapan };
        if (status === 'disetujui') {
          const newSchool: Sekolah = {
            id: `SCH-${String(sekolahList.length + 1).padStart(3, '0')}`,
            sppgId: item.sppgId,
            nama: item.sekolahNama,
            alamat: item.alamat,
            jumlahSiswa: item.jumlahSiswa,
          };
          setSekolahList((cur) => [...cur, newSchool]);
        }
        return updated;
      }),
    );
  };

  const addMasterMenu: AppContextValue['addMasterMenu'] = (menu) => {
    const id = `MM-${String(masterMenuList.length + 1).padStart(3, '0')}`;
    setMasterMenuList((prev) => [ { ...menu, id }, ...prev]);
  };

  const updateMasterMenu: AppContextValue['updateMasterMenu'] = (menu) => {
    setMasterMenuList((prev) => prev.map((m) => (m.id === menu.id ? menu : m)));
  };

  const deleteMasterMenu: AppContextValue['deleteMasterMenu'] = (id) => {
    setMasterMenuList((prev) => prev.filter((m) => m.id !== id));
  };

  const updatePeralatanStatus: AppContextValue['updatePeralatanStatus'] = (id, status, catatanKondisi) => {
    setPeralatanList((prev) =>
      prev.map((eq) =>
        eq.id === id
          ? {
              ...eq,
              status,
              catatanKondisi: catatanKondisi ?? eq.catatanKondisi,
              terakhirDiperiksa: todayDate(),
              jumlahBermasalah: status === 'ready' ? 0 : eq.jumlahBermasalah || 1,
            }
          : eq,
      ),
    );
  };

  const submitPublicReport: AppContextValue['submitPublicReport'] = (report) => {
    const id = `REP-${String(publicReportList.length + 1).padStart(3, '0')}`;
    const newReport: PublicReport = {
      ...report,
      id,
      timestamp: nowTimestamp(),
      status: 'dikirim',
    };
    setPublicReportList((prev) => [newReport, ...prev]);

    // Auto-raise internal AlertLog for citizen complaints
    const alertId = `ALT-REP-${String(alertList.length + 1).padStart(3, '0')}`;
    const newAlert: AlertLog = {
      id: alertId,
      sppgId: report.sppgId,
      jenis: 'aduan_warga',
      sumber: 'aduan',
      tingkat: report.kategori === 'kualitas_makanan' ? 'emergency' : 'perhatian',
      judul: `Aduan Warga (${report.kategori.replace('_', ' ').toUpperCase()}): ${report.judul}`,
      deskripsi: `Laporan publik dari ${report.namaPelapor} (${report.noHpPelapor}): ${report.deskripsi}`,
      timestamp: nowTimestamp(),
      statusTindakLanjut: 'baru',
    };
    setAlertList((prev) => [newAlert, ...prev]);
  };

  const updatePublicReportStatus: AppContextValue['updatePublicReportStatus'] = (id, status, tanggapan) => {
    setPublicReportList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, tanggapan: tanggapan ?? r.tanggapan } : r))
    );
  };

  const submitUsulanMenu: AppContextValue['submitUsulanMenu'] = (usulan) => {
    const id = `UM-${String(usulanMenuList.length + 1).padStart(3, '0')}`;
    setUsulanMenuList((prev) => [{ ...usulan, id, status: 'diajukan', tanggapan: null }, ...prev]);
  };

  const updateUsulanMenuStatus: AppContextValue['updateUsulanMenuStatus'] = (id, status, tanggapan) => {
    setUsulanMenuList((prev) => prev.map((u) => (u.id === id ? { ...u, status, tanggapan: tanggapan ?? u.tanggapan } : u)));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Live fluctuating production counter (naik & turun akibat penyesuaian QC, sampling, atau batch baru)
      setProgressProduksiRealtime((prev) => {
        // ~35% chance to dip slightly (-1 to -3 portions), ~65% chance to increase (+1 to +5 portions)
        const isDip = Math.random() < 0.35;
        const delta = isDip ? -(Math.floor(Math.random() * 3) + 1) : Math.floor(Math.random() * 5) + 1;
        return Math.max(900, Math.min(1500, prev + delta));
      });

      // 2. Simulated warehouse IoT sensor fluctuations
      setFoodSafetyList((prev) =>
        prev.map((f, idx) => {
          if (idx === 0 && f.sumberSuhu === 'sensor_iot') {
            const shift = Number(((Math.random() - 0.5) * 0.3).toFixed(1));
            const newTemp = Math.max(3, Math.min(9, Number((f.suhuPenyimpanan + shift).toFixed(1))));
            return { ...f, suhuPenyimpanan: newTemp };
          }
          return f;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentSppg = useMemo(
    () => sppgList.find((s) => s.id === currentUser?.sppgId) ?? null,
    [sppgList, currentUser],
  );

  const login: AppContextValue['login'] = (nikOrId, password) => {
    const account = findAccount(nikOrId, password);
    if (!account) return false;
    const user = users.find((u) => u.id === account.userId) ?? null;
    setRole(account.role);
    setCurrentUser(user);
    setLoggedIn(true);
    return true;
  };

  const logout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
  };

  const addStaff: AppContextValue['addStaff'] = (user) => {
    const id = `USR-${String(users.length + 1).padStart(3, '0')}`;
    setUsers((prev) => [...prev, { ...user, id }]);
  };

  const removeStaff: AppContextValue['removeStaff'] = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const addSekolah: AppContextValue['addSekolah'] = (sekolah) => {
    const id = `SKL-${String(sekolahList.length + 1).padStart(3, '0')}`;
    setSekolahList((prev) => [...prev, { ...sekolah, id }]);
  };

  const checkIn: AppContextValue['checkIn'] = (userId, fotoUri, geotag) => {
    const tanggal = todayDate();
    setPresensiList((prev) => {
      const existingIndex = prev.findIndex((p) => p.userId === userId && p.tanggal === tanggal);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          jamMasuk: nowTime(),
          fotoSelfieMasuk: fotoUri,
          geotagMasuk: geotag,
          status: 'hadir',
        };
        return updated;
      }
      const id = `PRE-${String(prev.length + 1).padStart(3, '0')}`;
      return [
        ...prev,
        {
          id,
          userId,
          tanggal,
          jamMasuk: nowTime(),
          jamKeluar: null,
          fotoSelfieMasuk: fotoUri,
          fotoSelfieKeluar: null,
          geotagMasuk: geotag,
          geotagKeluar: null,
          status: 'hadir',
        },
      ];
    });
  };

  const checkOut: AppContextValue['checkOut'] = (userId, fotoUri, geotag) => {
    const tanggal = todayDate();
    setPresensiList((prev) =>
      prev.map((p) =>
        p.userId === userId && p.tanggal === tanggal
          ? { ...p, jamKeluar: nowTime(), fotoSelfieKeluar: fotoUri, geotagKeluar: geotag }
          : p,
      ),
    );
  };

  const saveLaporanDraft: AppContextValue['saveLaporanDraft'] = (laporan) => {
    setLaporanList((prev) => {
      const batchId =
        laporan.batchId ||
        `BATCH-${laporan.sppgId}-${(laporan.tanggal || todayDate()).replace(/-/g, '')}-01`;
      if (laporan.id) {
        return prev.map((l) => (l.id === laporan.id ? { ...l, ...laporan, batchId, id: laporan.id!, status: 'draft' } : l));
      }
      const id = `LAP-${String(prev.length + 1).padStart(3, '0')}`;
      return [
        ...prev,
        {
          ...laporan,
          id,
          batchId,
          status: 'draft',
          timestamp: nowTimestamp(),
          preparationTimestamp: nowTime(),
          qcStatus: 'MENUNGGU_QC',
        },
      ];
    });
  };

  const submitLaporan: AppContextValue['submitLaporan'] = (laporanId) => {
    setLaporanList((prev) =>
      prev.map((l) => (l.id === laporanId && l.status === 'draft' ? { ...l, status: 'terkirim', timestamp: nowTimestamp() } : l)),
    );
  };

  const verifyLaporan: AppContextValue['verifyLaporan'] = (laporanId) => {
    setLaporanList((prev) =>
      prev.map((l) => (l.id === laporanId && l.status === 'terkirim' ? { ...l, status: 'diverifikasi' } : l)),
    );
  };

  const approveQcLaporan: AppContextValue['approveQcLaporan'] = (
    laporanId,
    qcStatus,
    qcNotes,
    qcApprovedBy,
    qcGrade,
    qcScore,
  ) => {
    const timestamp = nowTimestamp();
    setLaporanList((prev) =>
      prev.map((l) => {
        if (l.id !== laporanId) return l;
        const resolvedGrade =
          qcGrade ?? l.qcGrade ?? (qcStatus === 'READY' ? 'A+' : qcStatus === 'HOLD' ? 'B' : 'C');
        const resolvedScore =
          qcScore ?? l.qcScore ?? (qcStatus === 'READY' ? 98 : qcStatus === 'HOLD' ? 75 : 50);
        return {
          ...l,
          qcStatus,
          qcGrade: resolvedGrade,
          qcScore: resolvedScore,
          qcNotes: qcNotes ?? l.qcNotes,
          qcApprovedBy: qcApprovedBy ?? currentUser?.nama ?? 'Tim QC Gizi',
          qcTimestamp: nowTime(),
        };
      }),
    );

    const targetLap = laporanList.find((l) => l.id === laporanId);
    if (qcStatus === 'HOLD' || qcStatus === 'REJECTED') {
      addAlert({
        sppgId: targetLap?.sppgId || currentUser?.sppgId || 'SPPG-001',
        jenis: 'checklist_kritis',
        sumber: 'command_center',
        tingkat: qcStatus === 'REJECTED' ? 'emergency' : 'perhatian',
        judul: `QC Batch ${qcStatus}: ${targetLap?.menu || 'Menu MBG'}`,
        deskripsi: `Pemeriksaan QC Gizi memberikan status ${qcStatus} pada Batch ${targetLap?.batchId || laporanId}. Catatan: ${qcNotes || 'Perlu evaluasi kelayakan makanan sebelum distribusi'}.`,
      });
    }
  };

  const updateProductionStage: AppContextValue['updateProductionStage'] = (laporanId, stage) => {
    const time = nowTime();
    setLaporanList((prev) =>
      prev.map((l) => {
        if (l.id !== laporanId) return l;
        if (stage === 'preparation') return { ...l, preparationTimestamp: time };
        if (stage === 'cooking') return { ...l, cookingTimestamp: time };
        if (stage === 'qc') return { ...l, qcTimestamp: time };
        if (stage === 'packing') return { ...l, packingTimestamp: time };
        if (stage === 'ready') return { ...l, readyTimestamp: time };
        return l;
      }),
    );
  };

  const addAlert: AppContextValue['addAlert'] = (alert) => {
    setAlertList((prev) => {
      const id = `ALT-${String(prev.length + 1).padStart(3, '0')}`;
      return [{ ...alert, id, timestamp: nowTimestamp(), statusTindakLanjut: 'baru' }, ...prev];
    });
  };

  const resolveAlert: AppContextValue['resolveAlert'] = (alertId) => {
    setAlertList((prev) => prev.map((a) => (a.id === alertId ? { ...a, statusTindakLanjut: 'selesai' } : a)));
  };

  // Supervisor Polres follow-up action — distinct from resolveAlert: this only ever
  // moves 'baru' -> 'ditindaklanjuti', it can never mark an alert 'selesai' (that
  // remains the Kepala SPPG's call via resolveAlert above).
  const followUpAlert: AppContextValue['followUpAlert'] = (alertId) => {
    setAlertList((prev) =>
      prev.map((a) => (a.id === alertId && a.statusTindakLanjut === 'baru' ? { ...a, statusTindakLanjut: 'ditindaklanjuti' } : a)),
    );
  };

  // Supervisor Polda eskalasi toggle — purely a local demo flag (no real "pusat"
  // system to send to). Screens gate who may call this via ROLE_PERMISSIONS.canEskalasiAlert.
  const eskalasiAlert: AppContextValue['eskalasiAlert'] = (alertId) => {
    setAlertList((prev) => prev.map((a) => (a.id === alertId ? { ...a, eskalasiPusat: !a.eskalasiPusat } : a)));
  };

  // MUST-have business rule: a checklist item marked kritis + "tidak" auto-raises a "perhatian" alert.
  const submitChecklist: AppContextValue['submitChecklist'] = (checklist) => {
    setChecklistList((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === checklist.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = checklist;
        return updated;
      }
      const id = checklist.id || `CHK-${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...checklist, id }];
    });

    const kritisGagal: ChecklistItem[] = checklist.items.filter((item) => item.levelKritis && item.status === 'tidak');
    kritisGagal.forEach((item) => {
      addAlert({
        sppgId: checklist.sppgId,
        jenis: 'checklist_kritis',
        sumber: 'checklist',
        tingkat: 'perhatian',
        judul: `Checklist Kritis: ${item.item}`,
        deskripsi: `Item "${item.item}" dijawab Tidak pada checklist tanggal ${checklist.tanggal}.${item.catatan ? ` Catatan: ${item.catatan}` : ''}`,
      });
    });
  };

  // MUST-have business rule: expired shelf life or suhu > 8°C (cold storage threshold) auto-raises an "emergency" alert.
  const submitFoodSafetyLog: AppContextValue['submitFoodSafetyLog'] = (log) => {
    setFoodSafetyList((prev) => {
      const id = log.id || `FSL-${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...log, id }];
    });

    if (log.statusKadaluarsa === 'lewat_batas' || log.suhuPenyimpanan > SUHU_AMAN_MAX) {
      addAlert({
        sppgId: log.sppgId,
        jenis: 'suhu_tidak_normal',
        sumber: 'suhu',
        tingkat: 'emergency',
        judul: 'Suhu Penyimpanan Tidak Normal',
        deskripsi: `Suhu penyimpanan ${log.jenisMakanan} tercatat ${log.suhuPenyimpanan}°C pada ${log.waktuUkurSuhu}, melebihi ambang batas aman ${SUHU_AMAN_MAX}°C atau sudah melewati masa simpan.`,
      });
    }
  };

  // Fase 2 (SIMULASI) — mengubah status event CCTV baru -> ditinjau. Tidak ada model
  // AI/kamera nyata di baliknya, murni state lokal untuk demo.
  const reviewCctvEvent: AppContextValue['reviewCctvEvent'] = (id) => {
    setCctvEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'ditinjau' } : e)));
  };

  // Fase 2 (SIMULASI) — menambahkan satu event anomali "terdeteksi" secara buatan lalu
  // auto-raise AlertLog perhatian, mirip pola submitChecklist/submitFoodSafetyLog di atas.
  const simulateCctvDetection: AppContextValue['simulateCctvDetection'] = (sppgId) => {
    const anomaliType = CCTV_ANOMALI_TYPES[cctvEvents.length % CCTV_ANOMALI_TYPES.length];
    const confidence = 70 + ((cctvEvents.length * 7) % 26);
    const snapshots = [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    ];
    const event: CctvEvent = {
      id: `CCTV-${String(cctvEvents.length + 1).padStart(3, '0')}`,
      sppgId,
      cameraLabel: `Kamera ${(cctvEvents.length % 4) + 1}`,
      anomaliType,
      confidence,
      timestamp: nowTimestamp(),
      status: 'baru',
      fotoSnapshot: snapshots[cctvEvents.length % snapshots.length],
      deskripsiTemuan: `Hasil analisis Computer Vision AI menemukan indikasi ${CCTV_ANOMALI_LABEL[anomaliType]} dengan skor keyakinan ${confidence}%. Harap petugas penanggung jawab dapur melakukan verifikasi fisik.`,
    };
    setCctvEvents((prev) => [event, ...prev]);
    addAlert({
      sppgId,
      jenis: 'cctv_anomali',
      sumber: 'cctv',
      tingkat: 'perhatian',
      judul: `Deteksi Anomali CCTV: ${CCTV_ANOMALI_LABEL[anomaliType]}`,
      deskripsi: `${event.cameraLabel} mendeteksi ${CCTV_ANOMALI_LABEL[anomaliType]} (keyakinan ${confidence}%). Simulasi Fase 2 — bukan deteksi AI nyata.`,
    });
  };

  // Fase 2 (SIMULASI) — permintaan bahan baku ke gudang, murni CRUD lokal (tidak ada
  // gudang/ERP nyata di baliknya). Tidak digate di context, screen yang menentukan
  // siapa boleh ajukan lewat ROLE_PERMISSIONS.canManageGudang (lihat scope.ts).
  const ajukanPermintaanBahan: AppContextValue['ajukanPermintaanBahan'] = (payload) => {
    const id = `PMB-${String(permintaanBahanList.length + 1).padStart(3, '0')}`;
    setPermintaanBahanList((prev) => [...prev, { ...payload, id, status: 'diajukan', tanggal: todayDate() }]);
  };

  const updatePermintaanStatus: AppContextValue['updatePermintaanStatus'] = (id, status) => {
    setPermintaanBahanList((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  // Fase 2 (SIMULASI) — status distribusi armada dimajukan manual dari layar, bukan
  // dari pelacakan GPS sungguhan.
  const updateDistribusiStatus: AppContextValue['updateDistribusiStatus'] = (id, status, buktiFoto) => {
    setDistribusiList((prev) => prev.map((d) => (d.id === id ? { ...d, status, ...(buktiFoto ? { buktiFoto } : {}) } : d)));
  };

  // Laporan kendala rute selalu membawa bukti visual (foto/video) — teks saja
  // tidak cukup untuk diverifikasi command center, jadi bukti disimpan ikut
  // rincian dan waktu lapor di record rute-nya, bukan di state layar.
  const laporkanKendalaDistribusi: AppContextValue['laporkanKendalaDistribusi'] = (id, rincian, bukti, pelapor) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setDistribusiList((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'kendala',
              kendalaRincian: rincian,
              kendalaBukti: bukti,
              kendalaDilaporkan: timestamp,
              kendalaPelapor: pelapor,
            }
          : d,
      ),
    );
  };

  // Menu Kalender — upsert: update the plan already at sppgId+tanggal, else insert.
  const setMenuForDate: AppContextValue['setMenuForDate'] = (sppgId, tanggal, menu, kategoriGizi, fotoMenu) => {
    setMenuHarianPlanList((prev) => {
      const idx = prev.findIndex((m) => m.sppgId === sppgId && m.tanggal === tanggal);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          menu,
          kategoriGizi: kategoriGizi ?? updated[idx].kategoriGizi,
          fotoMenu: fotoMenu ?? updated[idx].fotoMenu,
        };
        return updated;
      }
      const id = `MHP-${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { id, sppgId, tanggal, menu, kategoriGizi, fotoMenu }];
    });
  };

  // Phase D — satu-satunya jalur perubahan BahanBaku.stok ke depan: menambah satu
  // baris MutasiStok (ledger) DAN menyesuaikan BahanBaku.stok terkait pada saat
  // yang sama, sehingga ledger dan angka stok saat ini selalu konsisten by
  // construction (+jumlah utk masuk, -jumlah utk keluar, clamp minimal 0).
  const catatMutasiStok: AppContextValue['catatMutasiStok'] = (payload) => {
    const id = `MUT-${String(mutasiStokList.length + 1).padStart(3, '0')}`;
    setMutasiStokList((prev) => [{ ...payload, id, tanggal: todayDate() }, ...prev]);
    setBahanBakuList((prev) =>
      prev.map((b) =>
        b.id === payload.bahanId
          ? { ...b, stok: Math.max(0, b.stok + (payload.jenis === 'masuk' ? payload.jumlah : -payload.jumlah)) }
          : b,
      ),
    );
  };

  // Fase 2 (SIMULASI) — chat satu arah yang benar-benar tersimpan (state lokal);
  // balasan Command Center HANYA data seed statis, tidak ada bot/AI otomatis dan
  // pesan ini tidak benar-benar terkirim ke sistem Command Center nyata.
  const sendChatMessage: AppContextValue['sendChatMessage'] = (sppgId, text) => {
    const id = `CHT-${String(chatMessages.length + 1).padStart(3, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { id, sppgId, sender: 'sppg', senderName: currentUser?.nama ?? 'Petugas SPPG', text, timestamp: nowTimestamp() },
    ]);
  };

  const submitIncident: AppContextValue['submitIncident'] = (payload) => {
    const id = `INC-${String(incidentList.length + 1).padStart(3, '0')}`;
    const timestamp = nowTimestamp();
    const newIncident: IncidentReport = {
      ...payload,
      id,
      timestamp,
      status: 'OPEN',
    };
    setIncidentList((prev) => [newIncident, ...prev]);

    // Auto-raise alert if severity is kritis or sedang
    if (payload.tingkatKeparahan === 'kritis' || payload.tingkatKeparahan === 'sedang') {
      addAlert({
        sppgId: payload.sppgId,
        jenis: 'manual',
        sumber: 'manual',
        tingkat: payload.tingkatKeparahan === 'kritis' ? 'emergency' : 'perhatian',
        judul: `Laporan Insiden: ${payload.judul}`,
        deskripsi: `Kategori: ${payload.kategori} di ${payload.lokasi || 'Dapur'}. ${payload.deskripsi}`,
      });
    }
  };

  const updateIncidentStatus: AppContextValue['updateIncidentStatus'] = (id, status, tindakanPerbaikan) => {
    setIncidentList((prev) =>
      prev.map((inc) => {
        if (inc.id !== id) return inc;
        return {
          ...inc,
          status,
          tindakanPerbaikan: tindakanPerbaikan ?? inc.tindakanPerbaikan,
          diselesaikanOleh: status === 'RESOLVED' ? (currentUser?.nama ?? 'Kepala SPPG') : inc.diselesaikanOleh,
          resolvedTimestamp: status === 'RESOLVED' ? nowTimestamp() : inc.resolvedTimestamp,
        };
      }),
    );
  };

  const value = useMemo(
    () => ({
      progressProduksiRealtime,
      role,
      loggedIn,
      login,
      logout,
      currentUser,
      currentSppg,
      sppgList,
      users,
      laporanList,
      presensiList,
      checklistList,
      foodSafetyList,
      alertList,
      peralatanList,
      updatePeralatanStatus,
      publicReportList,
      submitPublicReport,
      updatePublicReportStatus,
      usulanMenuList,
      submitUsulanMenu,
      updateUsulanMenuStatus,
      broadcastList,
      sendBroadcast,
      anggaranLogs,
      addAnggaranLog,
      pengajuanSekolahList,
      ajukanSekolah,
      updateStatusPengajuanSekolah,
      pengajuanAsetList,
      ajukanAset,
      updateStatusPengajuanAset,
      cctvEvents,
      bahanBakuList,
      permintaanBahanList,
      distribusiList,
      chatMessages,
      sekolahList,
      addSekolah,
      menuHarianPlanList,
      masterMenuList,
      addMasterMenu,
      updateMasterMenu,
      deleteMasterMenu,
      mitraList,
      mutasiStokList,
      catatMutasiStok,
      setMenuForDate,
      reviewCctvEvent,
      simulateCctvDetection,
      ajukanPermintaanBahan,
      updatePermintaanStatus,
      updateDistribusiStatus,
      laporkanKendalaDistribusi,
      sendChatMessage,
      addStaff,
      removeStaff,
      checkIn,
      checkOut,
      saveLaporanDraft,
      submitLaporan,
      verifyLaporan,
      approveQcLaporan,
      updateProductionStage,
      submitChecklist,
      submitFoodSafetyLog,
      addAlert,
      resolveAlert,
      followUpAlert,
      eskalasiAlert,
      incidentList,
      submitIncident,
      updateIncidentStatus,
      kandunganGiziList,
      addKandunganGiziLog,
      laporanPackingList,
      submitLaporanPacking,
      laporanSanitasiList,
      submitLaporanSanitasi,
      batchTraceabilityList,
      qualityPassportList,
      costPerMeal,
      kitchenReadinessScore,
      aiEarlyWarnings,
      updateCostPerMeal,
      updateCurrentUser,
      activityLogs,
      addActivityLog,
    }),
    [
      progressProduksiRealtime,
      publicReportList,
      usulanMenuList,
      broadcastList,
      anggaranLogs,
      pengajuanSekolahList,
      pengajuanAsetList,
      incidentList,
      kandunganGiziList,
      laporanPackingList,
      laporanSanitasiList,
      batchTraceabilityList,
      qualityPassportList,
      costPerMeal,
      kitchenReadinessScore,
      aiEarlyWarnings,
      activityLogs,
      role,
      loggedIn,
      currentUser,
      currentSppg,
      sppgList,
      users,
      laporanList,
      presensiList,
      checklistList,
      foodSafetyList,
      alertList,
      cctvEvents,
      bahanBakuList,
      permintaanBahanList,
      distribusiList,
      chatMessages,
      sekolahList,
      menuHarianPlanList,
      mitraList,
      mutasiStokList,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
