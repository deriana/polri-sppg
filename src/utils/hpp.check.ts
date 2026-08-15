import assert from 'assert';
import { formatRp, hppFromMenu, hppTone, resolveHpp } from './hpp';

// Self-check pencocokan HPP. Jalankan: npm run check:hpp
const cost: any = {
  paguStandarBgn: 15000,
  totalCostPerPorsi: 11750,
  bahanBaku: 8500,
  bumbuMinyak: 1200,
  kemasanSeal: 800,
  energiDapur: 750,
  transportBbm: 500,
};
const katalog: any[] = [
  { id: 'MM-001', nama: 'Nasi Liwet, Ayam Bakar Madu, Sayur Bayam & Tempe Orek', hppPerPorsi: 11800 },
  { id: 'MM-002', nama: 'Nasi Kuning Rames, Daging Rendang Empuk & Sambal Goreng Kentang', hppPerPorsi: 13950 },
  { id: 'MM-005', nama: 'Nasi Ayam Woku Belanga, Cah Buncis Jagung & Perkedel', hppPerPorsi: 12150 },
];

// Nama menu di kalender ditulis bebas tapi masih mengandung kata kunci yang sama.
const liwet = resolveHpp('Nasi Liwet Pulen, Ayam Bakar Bumbu Madu, Tumis Kangkung', katalog, cost);
assert.strictEqual(liwet.nilai, 11800);
assert.strictEqual(liwet.perkiraan, false);
assert.strictEqual(liwet.sumber, katalog[0].nama);

// Woku tidak boleh tertukar dengan ayam bakar walau sama-sama mengandung "ayam".
assert.strictEqual(resolveHpp('Nasi Rempah Kemangi, Ayam Woku Manado, Capcay', katalog, cost).nilai, 12150);

// Rendang cocok lewat dua kata kunci: "rendang" + "kentang".
assert.strictEqual(resolveHpp('Nasi Kuning Gurih, Daging Rendang, Sambal Kentang Ati', katalog, cost).nilai, 13950);

// Satu kata beririsan saja ("ayam") terlalu lemah — jatuh ke rata-rata unit.
const lemah = resolveHpp('Bubur Ayam Kampung', katalog, cost);
assert.strictEqual(lemah.perkiraan, true);
assert.strictEqual(lemah.nilai, 11750);

// Menu yang sama sekali asing juga memakai rata-rata unit, bukan menu acak.
const asing = resolveHpp('Menu Belum Terdaftar', katalog, cost);
assert.strictEqual(asing.perkiraan, true);
assert.strictEqual(asing.nilai, 11750);

// Selisih terhadap pagu: (15000-11800)/15000 = 21.3%.
assert.strictEqual(liwet.selisihPct, 21.3);
assert.strictEqual(hppTone(liwet), 'success');

// Mepet pagu → waspada; lewat pagu → bahaya.
assert.strictEqual(hppTone({ ...liwet, nilai: 14500, selisihPct: 3.3 }), 'warning');
assert.strictEqual(hppTone({ ...liwet, nilai: 15800, selisihPct: -5.3 }), 'danger');

// Jalur langsung dari master menu tidak pernah ditandai perkiraan.
const langsung = hppFromMenu(katalog[1], cost);
assert.strictEqual(langsung.nilai, 13950);
assert.strictEqual(langsung.perkiraan, false);
assert.strictEqual(langsung.selisihPct, 7);

// Rincian HPP: komponen tetap diambil apa adanya, bahan baku jadi sisanya,
// dan jumlah seluruh komponen harus persis sama dengan total HPP.
const komponen = liwet.rincian;
assert.strictEqual(komponen.length, 5);
assert.strictEqual(komponen[0].label, 'Bahan Baku Utama');
assert.strictEqual(komponen[0].nilai, 11800 - (1200 + 800 + 750 + 500));
assert.strictEqual(
  komponen.reduce((t, k) => t + k.nilai, 0),
  liwet.nilai,
  'jumlah rincian harus sama dengan total HPP',
);
assert.ok(Math.abs(komponen.reduce((t, k) => t + k.pct, 0) - 100) <= 0.5, 'persentase komponen harus mendekati 100%');

// Untuk menu yang jatuh ke biaya rata-rata unit, bahan baku hasil hitung sisa
// harus sama persis dengan angka bahanBaku di CostPerMealBreakdown.
assert.strictEqual(asing.rincian[0].nilai, cost.bahanBaku);

// HPP di bawah total komponen tetap tidak boleh menghasilkan bahan baku negatif.
const murah: any = { ...cost, totalCostPerPorsi: 2000 };
assert.strictEqual(resolveHpp('Menu Tak Dikenal', katalog, murah).rincian[0].nilai, 0);

assert.strictEqual(formatRp(11800), 'Rp 11.800');

console.log('hpp check OK');
