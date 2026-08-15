import { Role, User } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  KEPALA_SPPG: 'Kepala SPPG',
  AHLI_GIZI: 'Ahli Gizi SPPG',
  CHEF_UTAMA: 'Chef Utama & Cook',
  PEMORSI_PACKING: 'Petugas Pemorsi & Packing',
  PETUGAS_LOGISTIK: 'Petugas Logistik & Gudang',
  PETUGAS_SANITASI: 'Petugas Sanitasi & APD',
  DRIVER: 'Driver & Kurir Armada',
  PETUGAS_LAPANGAN: 'Petugas Lapangan',
  SUPERVISOR_POLRES: 'Supervisor Polres',
  SUPERVISOR_POLDA: 'Supervisor Polda',
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  KEPALA_SPPG: 'Pimpinan operasional unit SPPG, bertindak sebagai penanggung jawab utama dapur sentral, persetujuan belanja bahan, verifikasi produksi, pengelolaan staf, dan kepatuhan standar BGN.',
  AHLI_GIZI: 'Penanggung jawab standarisasi AKG (Angka Kecukupan Gizi), pengujian kimia kelayakan pangan (Rapid Test Kit Formalin/Boraks), evaluasi kalori makronutrien, dan persetujuan QC pangan.',
  CHEF_UTAMA: 'Koordinator tim masak & dapur, bertanggung jawab atas 5 tahapan pengolahan makanan, suhu titik matang (>75°C), cita rasa, dan kepatuhan resep standar BGN.',
  PEMORSI_PACKING: 'Petugas penimbangan gramasi porsi per anak, penyegelan ompreng stainless, pengisian thermal insulated box, dan kontrol suhu holding (>60°C).',
  PETUGAS_LOGISTIK: 'Pengelola gudang bahan pangan, penerimaan pasokan suplier gapoktan (Scan QR DO), pencatatan mutasi stok FEFO, dan kontrol sensor suhu cold storage.',
  PETUGAS_SANITASI: 'Petugas sterilisasi wadah saji (Dishwasher 85°C & UV), sanitasi area dapur, kepatuhan APD staf, dan pengelolaan limbah sisa makanan.',
  DRIVER: 'Tenaga distribusi armada kendaraan, pelacakan live GPS pengantaran, serah terima porsi ke pihak sekolah binaan, dan dokumentasi bukti terima.',
  PETUGAS_LAPANGAN: 'Petugas pemantauan umum dan verifikasi lapangan di lingkungan SPPG.',
  SUPERVISOR_POLRES: 'Pengawas wilayah tingkat Polres/Polrestabes, berwenang memantau seluruh SPPG di bawah wilayah hukumnya dan menindaklanjuti alert insiden.',
  SUPERVISOR_POLDA: 'Pengawas tingkat Polda, berwenang atas audit makro seluruh SPPG se-provinsi, eskalasi darurat ke Mabes Polri / Pusat BGN, dan ekspor laporan berkala.',
};

export const ROLE_BADGE_TONE: Record<Role, 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  KEPALA_SPPG: 'primary',
  AHLI_GIZI: 'success',
  CHEF_UTAMA: 'warning',
  PEMORSI_PACKING: 'info',
  PETUGAS_LOGISTIK: 'primary',
  PETUGAS_SANITASI: 'success',
  DRIVER: 'warning',
  PETUGAS_LAPANGAN: 'neutral',
  SUPERVISOR_POLRES: 'primary',
  SUPERVISOR_POLDA: 'danger',
};

// Data-driven "role — wilayah" label for a specific logged-in user, e.g.
// "Supervisor Polres — Polrestabes Bandung". KEPALA_SPPG/PETUGAS_LAPANGAN just
// get the plain role label (their SPPG name is shown separately in the UI).
export function roleScopeLabel(user: User): string {
  if (user.role === 'SUPERVISOR_POLRES') return `${ROLE_LABEL[user.role]} — ${user.wilayahPolres ?? '-'}`;
  if (user.role === 'SUPERVISOR_POLDA') return `${ROLE_LABEL[user.role]} — ${user.wilayahPolda ?? '-'}`;
  return ROLE_LABEL[user.role];
}
