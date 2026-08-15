import type { CostPerMealBreakdown, MasterMenu } from '../types';

// HPP (Harga Pokok Produksi) per porsi. Master menu menyimpan angka aslinya,
// tapi menu di Kalender Menu / Laporan Produksi / catatan gizi disimpan sebagai
// teks bebas — bukan id master menu. Jadi HPP-nya dicocokkan lewat irisan kata
// kunci nama menu; kalau tidak ada yang cocok, dipakai biaya rata-rata unit
// (CostPerMealBreakdown) dan hasilnya ditandai sebagai perkiraan.

export const formatRp = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

// Kata yang muncul di hampir semua nama menu — tidak membedakan apa pun,
// jadi dibuang supaya skor kecocokan tidak jadi noise.
const STOPWORDS = new Set([
  'nasi', 'dan', 'atau', 'dengan', 'sayur', 'sayuran', 'paket', 'komplit',
  'segar', 'manis', 'gurih', 'pedas', 'buah', 'susu', 'uht', 'putih',
]);

function tokens(nama: string): Set<string> {
  return new Set(
    nama
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
  );
}

export interface HppKomponen {
  label: string;
  nilai: number;
  /** Porsi komponen ini terhadap total HPP, dalam persen. */
  pct: number;
  keterangan: string;
}

export interface HppInfo {
  /** HPP per porsi dalam rupiah. */
  nilai: number;
  /** true = tidak ada master menu yang cocok, angka diambil dari rata-rata unit. */
  perkiraan: boolean;
  /** Pagu standar BGN per porsi, untuk pembanding. */
  pagu: number;
  /** Selisih terhadap pagu dalam persen; positif = hemat, negatif = lewat pagu. */
  selisihPct: number;
  /** Nama master menu yang dipakai, atau '' kalau memakai rata-rata unit. */
  sumber: string;
  /** Rincian pembentuk angka HPP, urut dari komponen terbesar. */
  rincian: HppKomponen[];
}

// Komponen selain bahan baku praktis sama untuk semua menu: bumbu & minyak,
// kemasan/seal, energi dapur, dan transport dihitung per porsi, bukan per resep.
// Yang membedakan mahal-murahnya sebuah menu adalah harga bahan bakunya. Jadi
// bahan baku dihitung sebagai sisa: HPP menu dikurangi keempat komponen tetap.
// Untuk menu dengan HPP = biaya rata-rata unit, rumus ini menghasilkan angka
// bahanBaku yang persis sama dengan CostPerMealBreakdown.bahanBaku.
function buildRincian(hpp: number, cost: CostPerMealBreakdown): HppKomponen[] {
  const tetap = [
    { label: 'Bumbu & Minyak Goreng', nilai: cost.bumbuMinyak, keterangan: 'Rempah, bumbu dasar, minyak — dihitung per porsi' },
    { label: 'Kemasan & Seal Ompreng', nilai: cost.kemasanSeal, keterangan: 'Ompreng sekali pakai, plastik seal, label batch' },
    { label: 'Energi Dapur', nilai: cost.energiDapur, keterangan: 'Gas, listrik, dan air produksi dibagi jumlah porsi' },
    { label: 'Transport & BBM Armada', nilai: cost.transportBbm, keterangan: 'Distribusi dapur ke sekolah dibagi jumlah porsi' },
  ];
  const totalTetap = tetap.reduce((s, k) => s + k.nilai, 0);
  const bahanBaku = Math.max(0, hpp - totalTetap);

  const semua = [
    {
      label: 'Bahan Baku Utama',
      nilai: bahanBaku,
      keterangan: 'Beras, protein hewani/nabati, sayur, dan buah sesuai resep menu ini',
    },
    ...tetap,
  ];

  return semua.map((k) => ({ ...k, pct: hpp > 0 ? Math.round((k.nilai / hpp) * 1000) / 10 : 0 }));
}

export function resolveHpp(
  namaMenu: string,
  masterMenuList: MasterMenu[],
  costPerMeal: CostPerMealBreakdown,
): HppInfo {
  const target = tokens(namaMenu ?? '');

  let best: MasterMenu | null = null;
  let bestScore = 0;
  for (const menu of masterMenuList) {
    const kandidat = tokens(menu.nama);
    let overlap = 0;
    kandidat.forEach((w) => {
      if (target.has(w)) overlap += 1;
    });
    if (overlap > bestScore) {
      bestScore = overlap;
      best = menu;
    }
  }

  // Satu kata yang sama (mis. "ayam") terlalu lemah untuk mengklaim menu yang
  // sama — butuh minimal dua kata kunci berimpit.
  const cocok = best !== null && bestScore >= 2;
  const nilai = cocok ? (best as MasterMenu).hppPerPorsi : costPerMeal.totalCostPerPorsi;
  const pagu = costPerMeal.paguStandarBgn;

  return {
    nilai,
    perkiraan: !cocok,
    pagu,
    selisihPct: Math.round(((pagu - nilai) / pagu) * 1000) / 10,
    sumber: cocok ? (best as MasterMenu).nama : '',
    rincian: buildRincian(nilai, costPerMeal),
  };
}

/** Ringkasan HPP untuk satu master menu, tanpa perlu pencocokan nama. */
export function hppFromMenu(menu: MasterMenu, costPerMeal: CostPerMealBreakdown): HppInfo {
  const pagu = costPerMeal.paguStandarBgn;
  return {
    nilai: menu.hppPerPorsi,
    perkiraan: false,
    pagu,
    selisihPct: Math.round(((pagu - menu.hppPerPorsi) / pagu) * 1000) / 10,
    sumber: menu.nama,
    rincian: buildRincian(menu.hppPerPorsi, costPerMeal),
  };
}

/** Nada warna badge: hemat = aman, mepet pagu = waspada, lewat pagu = bahaya. */
export function hppTone(info: HppInfo): 'success' | 'warning' | 'danger' {
  if (info.selisihPct < 0) return 'danger';
  if (info.selisihPct < 8) return 'warning';
  return 'success';
}
