import assert from 'assert';
import {
  QR_MAX_CHARS,
  QR_SCHEMA_VERSION,
  buildSerahTerimaPayload,
  encodeQrPayloadSafe,
} from './qrPayload';

// Self-check payload QR serah terima. Jalankan: npm run check:qr
const rute: any = { id: 'DST-01', sppgId: 'SPPG-001', sekolahId: 'SKL-01', tanggal: '2026-08-15', status: 'tiba' };
const sppg: any = { id: 'SPPG-001', nama: 'SPPG Cimahi' };
const sekolah: any = { id: 'SKL-01', nama: 'SDN Cimahi 1', jumlahSiswa: 320 };
const gizi: any = {
  sppgId: 'SPPG-001', tanggal: '2026-08-15', namaPaketMenu: 'Paket A', kalori: 615, karbohidrat: 78,
  proteinHewani: 24, proteinNabati: 10, lemak: 18, serat: 6.5, kalsium: 240, zatBesi: 4.8,
  statusKesesuaianAkg: 'sesuai', bebasAlergen: true, namaAhliGizi: 'Dr. Tri Wibowo',
};
const mkPassport = (higienePassed: boolean): any => ({
  batchId: 'BATCH-01', sppgId: 'SPPG-001', tanggal: '2026-08-15', menuNama: 'Paket A', score: 96, grade: 'A+',
  verifierName: 'Dr. Tri Wibowo',
  parameters: {
    titikMatang: { value: 84.5, unit: '°C', passed: true, note: '' },
    organoleptik: { passed: true, note: '', rasa: '', aroma: '', tekstur: '' },
    gramasiPorsi: { passed: true, note: '', nasi: 150, protein: 80, sayur: 60, buah: 50 },
    suhuHolding: { value: 64.2, unit: '°C', passed: true, note: '' },
    sealingTutup: { passed: true, note: '' },
    higieneApd: { passed: higienePassed, note: '' },
  },
});
const build = (over: any = {}) =>
  buildSerahTerimaPayload({ rute, sppg, sekolah, gizi, passport: mkPassport(true), waktuTerbit: '2026-08-15 07:15', ...over });

// Rincian stok sekolah ikut terbawa, satu porsi per siswa.
const full = build();
assert.strictEqual(full.v, QR_SCHEMA_VERSION);
assert.strictEqual(full.stok.porsiDikirim, 320);
assert.strictEqual(full.stok.suhuAntarC, 64.2);
assert.strictEqual(full.gizi!.kalori, 615);
assert.strictEqual(full.gizi!.statusAkg, 'sesuai');
assert.strictEqual(full.ujiMutu!.semuaParameterLulus, true);

// Satu parameter gagal harus menjatuhkan flag lulus keseluruhan.
assert.strictEqual(build({ passport: mkPassport(false) }).ujiMutu!.semuaParameterLulus, false);

// Tanpa catatan gizi / passport, payload tetap terbentuk dengan field null.
const kosong = build({ gizi: undefined, passport: undefined });
assert.strictEqual(kosong.gizi, null);
assert.strictEqual(kosong.ujiMutu, null);
assert.strictEqual(kosong.stok.menu, 'Paket MBG Harian');

// Menu kepanjangan dipangkas supaya QR tetap di bawah batas praktis pemindaian.
const panjang = build({ menuPlan: { sppgId: 'SPPG-001', tanggal: '2026-08-15', menu: 'X'.repeat(2000) } as any });
const hasil = encodeQrPayloadSafe(panjang);
assert.strictEqual(hasil.truncated, true);
assert.ok(hasil.value.length <= QR_MAX_CHARS, `payload ${hasil.value.length} > ${QR_MAX_CHARS}`);
assert.strictEqual(encodeQrPayloadSafe(full).truncated, false);

// Aplikasi sekolah membaca ulang payload sebagai JSON biasa.
assert.strictEqual(JSON.parse(encodeQrPayloadSafe(full).value).sekolah.nama, 'SDN Cimahi 1');

console.log('qrPayload check OK');
