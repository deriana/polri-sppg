import { FoodQualityPassport } from '../types';

export const INITIAL_QUALITY_PASSPORTS: FoodQualityPassport[] = [
  {
    id: 'PASSPORT-20260815-01',
    batchId: 'BATCH-20260815-01',
    sppgId: 'SPPG-001',
    tanggal: '2026-08-15',
    menuNama: 'Nasi Pulen, Ayam Kecap Gurih, Sayur Sop Segar, & Semangka',
    score: 96,
    grade: 'A+',
    verifierName: 'Dr. Tri Wibowo, S.Gz',
    verifierRole: 'Ahli Gizi SPPG',
    parameters: {
      titikMatang: {
        value: 84.5,
        unit: '°C',
        passed: true,
        note: 'Suhu inti daging matang sempurna di atas ambang batas kritis 75°C.',
      },
      organoleptik: {
        passed: true,
        note: 'Rasa gurih seimbang, aroma rempah sedap, tekstur empuk lembut, dan warna cerah segar.',
        rasa: 'Gurih Manis Pas',
        aroma: 'Harum Sedap',
        tekstur: 'Daging Empuk, Sayur Renyah',
      },
      gramasiPorsi: {
        passed: true,
        note: 'Gramasi tiap komponen piring sesuai standar AKG Badan Gizi Nasional (BGN).',
        nasi: 150,
        protein: 80,
        sayur: 60,
        buah: 50,
      },
      suhuHolding: {
        value: 64.2,
        unit: '°C',
        passed: true,
        note: 'Suhu makanan di dalam thermal box terjaga di atas batas minimum 60°C selama distribusi.',
      },
      sealingTutup: {
        passed: true,
        note: 'Klip 4 sisi terkunci rapat dan band sealer anti-tumpah terpasang rapi.',
      },
      higieneApd: {
        passed: true,
        note: 'Seluruh kru pemorsi mengenakan apron, hairnet, masker, dan sarung tangan steril 100%.',
      },
    },
    certifiedAt: '07:35 WIB',
  },
];
