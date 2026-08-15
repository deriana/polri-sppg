import type {
  DistribusiRute,
  FoodQualityPassport,
  KandunganGiziHarian,
  MenuHarianPlan,
  Peralatan,
  Sekolah,
  Sppg,
  User,
} from '../types';

// QR yang dicetak/ditampilkan aplikasi ini dibaca oleh aplikasi lain (aplikasi
// pihak sekolah / penerima manfaat), jadi isinya harus self-contained: sekolah
// tidak punya akses ke database SPPG. Semua angka gizi & hasil uji mutu ikut
// dibawa di dalam payload, bukan sekadar id yang harus di-lookup.
//
// Dua jenis QR di app ini:
//   1. QR_TIPE_SERAH_TERIMA — dibuat driver saat makanan diserahkan ke sekolah.
//      Dipindai aplikasi sekolah (aplikasi terpisah), bukan oleh app ini.
//   2. Surat jalan (DO) bahan baku — isinya id PermintaanBahan polos, karena
//      yang memindai adalah scanner di app ini sendiri (QrScanScreen /
//      PengadaanBahanScreen) yang mencocokkan ke permintaanBahanList.
export const QR_SCHEMA_VERSION = 1;
export const QR_TIPE_SERAH_TERIMA = 'SERAH_TERIMA_MBG';

// QR versi 40 error-correction M memuat 2.331 byte. Di atas ~1.200 karakter
// modul QR jadi terlalu rapat untuk dipindai dari layar HP ke layar HP, jadi
// itu batas praktis yang dipakai di sini.
export const QR_MAX_CHARS = 1200;

export interface SerahTerimaQrPayload {
  v: number;
  tipe: typeof QR_TIPE_SERAH_TERIMA;
  ruteId: string;
  tanggal: string;
  waktuTerbit: string;
  sppg: { id: string; nama: string };
  sekolah: { id: string; nama: string; jumlahSiswa: number };
  stok: { porsiDikirim: number; menu: string; suhuAntarC: number | null };
  gizi: {
    kalori: number;
    karbohidrat: number;
    proteinHewani: number;
    proteinNabati: number;
    lemak: number;
    serat: number;
    kalsium: number;
    zatBesi: number;
    statusAkg: KandunganGiziHarian['statusKesesuaianAkg'];
    bebasAlergen: boolean;
    ahliGizi: string;
  } | null;
  ujiMutu: {
    batchId: string;
    grade: FoodQualityPassport['grade'];
    skor: number;
    suhuIntiC: number;
    suhuHoldingC: number;
    verifikator: string;
    semuaParameterLulus: boolean;
  } | null;
  armada: { driver: string; noPlat: string };
}

interface BuildArgs {
  rute: DistribusiRute;
  sppg: Sppg;
  sekolah?: Sekolah;
  gizi?: KandunganGiziHarian;
  passport?: FoodQualityPassport;
  menuPlan?: MenuHarianPlan;
  driver?: User;
  kendaraan?: Peralatan;
  waktuTerbit: string;
}

export function buildSerahTerimaPayload({
  rute,
  sppg,
  sekolah,
  gizi,
  passport,
  menuPlan,
  driver,
  kendaraan,
  waktuTerbit,
}: BuildArgs): SerahTerimaQrPayload {
  const p = passport?.parameters;
  return {
    v: QR_SCHEMA_VERSION,
    tipe: QR_TIPE_SERAH_TERIMA,
    ruteId: rute.id,
    tanggal: rute.tanggal,
    waktuTerbit,
    sppg: { id: sppg.id, nama: sppg.nama },
    sekolah: {
      id: rute.sekolahId,
      nama: sekolah?.nama ?? rute.sekolahId,
      jumlahSiswa: sekolah?.jumlahSiswa ?? 0,
    },
    stok: {
      // Satu porsi per siswa terdaftar — porsi kirim mengikuti jumlah siswa sekolah tujuan.
      porsiDikirim: sekolah?.jumlahSiswa ?? 0,
      menu: menuPlan?.menu ?? gizi?.namaPaketMenu ?? passport?.menuNama ?? 'Paket MBG Harian',
      suhuAntarC: p?.suhuHolding.value ?? null,
    },
    gizi: gizi
      ? {
          kalori: gizi.kalori,
          karbohidrat: gizi.karbohidrat,
          proteinHewani: gizi.proteinHewani,
          proteinNabati: gizi.proteinNabati,
          lemak: gizi.lemak,
          serat: gizi.serat,
          kalsium: gizi.kalsium,
          zatBesi: gizi.zatBesi,
          statusAkg: gizi.statusKesesuaianAkg,
          bebasAlergen: gizi.bebasAlergen,
          ahliGizi: gizi.namaAhliGizi,
        }
      : null,
    ujiMutu:
      passport && p
        ? {
            batchId: passport.batchId,
            grade: passport.grade,
            skor: passport.score,
            suhuIntiC: p.titikMatang.value,
            suhuHoldingC: p.suhuHolding.value,
            verifikator: passport.verifierName,
            semuaParameterLulus:
              p.titikMatang.passed &&
              p.organoleptik.passed &&
              p.gramasiPorsi.passed &&
              p.suhuHolding.passed &&
              p.sealingTutup.passed &&
              p.higieneApd.passed,
          }
        : null,
    armada: {
      driver: driver?.nama ?? 'Driver SPPG',
      noPlat: kendaraan?.noPlat ?? '-',
    },
  };
}

export const encodeQrPayload = (payload: SerahTerimaQrPayload): string => JSON.stringify(payload);

// Payload terlalu panjang bikin QR gagal dipindai dari layar. Kalau kelewat
// batas, buang bagian yang paling mudah dicari ulang oleh sekolah lewat ruteId.
export function encodeQrPayloadSafe(payload: SerahTerimaQrPayload): { value: string; truncated: boolean } {
  const full = encodeQrPayload(payload);
  if (full.length <= QR_MAX_CHARS) return { value: full, truncated: false };
  const trimmed: SerahTerimaQrPayload = {
    ...payload,
    stok: { ...payload.stok, menu: payload.stok.menu.slice(0, 60) },
  };
  return { value: encodeQrPayload(trimmed), truncated: true };
}
