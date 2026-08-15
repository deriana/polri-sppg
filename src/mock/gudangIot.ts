export interface StorageIotUnit {
  id: string;
  sppgId: string;
  nama: string;
  tipe: 'chiller_utama' | 'deep_freezer' | 'chiller_sayur' | 'dry_storage';
  kategoriLabel: string;
  icon: string;
  suhuAktual: number;
  suhuTarget: number;
  suhuMin: number;
  suhuMax: number;
  kelembaban: number; // % RH
  dayaListrikKw: number; // kW
  tekananFreonPsi: number; // PSI
  pintuStatus: 'terkunci' | 'terbuka';
  airCurtainAktif: boolean;
  modePendingin: 'standar_haccp' | 'turbo_freeze' | 'eco_saving' | 'auto_defrost';
  blowerSpeed: 'auto' | 'high' | 'eco';
  lampuUvAktif: boolean;
  lastCommand: string;
  lastCommandTime: string;
}

export const INITIAL_STORAGE_IOT_UNITS: StorageIotUnit[] = [
  {
    id: 'IOT-CHL-01',
    sppgId: 'SPPG-001',
    nama: 'Cold Storage Chiller 01 (Daging & Unggas)',
    tipe: 'chiller_utama',
    kategoriLabel: 'Daging Ayam & Sapi Segar',
    icon: 'thermometer',
    suhuAktual: 3.2,
    suhuTarget: 2.5,
    suhuMin: -2.0,
    suhuMax: 6.0,
    kelembaban: 68,
    dayaListrikKw: 1.4,
    tekananFreonPsi: 45,
    pintuStatus: 'terkunci',
    airCurtainAktif: true,
    modePendingin: 'standar_haccp',
    blowerSpeed: 'auto',
    lampuUvAktif: true,
    lastCommand: 'Kompresor Inverter berjalan stabil pada mode Standar HACCP',
    lastCommandTime: '2 menit lalu',
  },
  {
    id: 'IOT-FRZ-02',
    sppgId: 'SPPG-001',
    nama: 'Deep Freezer 02 (Daging Beku & Ikan Laut)',
    tipe: 'deep_freezer',
    kategoriLabel: 'Protein Beku & Seafood',
    icon: 'box',
    suhuAktual: -18.4,
    suhuTarget: -18.0,
    suhuMin: -25.0,
    suhuMax: -12.0,
    kelembaban: 52,
    dayaListrikKw: 2.2,
    tekananFreonPsi: 38,
    pintuStatus: 'terkunci',
    airCurtainAktif: true,
    modePendingin: 'turbo_freeze',
    blowerSpeed: 'high',
    lampuUvAktif: true,
    lastCommand: 'Siklus Deep Freeze aktif menjaga kristal es optimal',
    lastCommandTime: '5 menit lalu',
  },
  {
    id: 'IOT-CHL-03',
    sppgId: 'SPPG-001',
    nama: 'Chiller Sayur & Buah Segar 03',
    tipe: 'chiller_sayur',
    kategoriLabel: 'Sayuran Hijau, Buah & Telur',
    icon: 'feather',
    suhuAktual: 5.6,
    suhuTarget: 5.0,
    suhuMin: 2.0,
    suhuMax: 10.0,
    kelembaban: 82,
    dayaListrikKw: 0.9,
    tekananFreonPsi: 48,
    pintuStatus: 'terkunci',
    airCurtainAktif: false,
    modePendingin: 'eco_saving',
    blowerSpeed: 'auto',
    lampuUvAktif: false,
    lastCommand: 'Humidifier menjaga kelembaban sayur tetap segar 82% RH',
    lastCommandTime: '12 menit lalu',
  },
  {
    id: 'IOT-DRY-04',
    sppgId: 'SPPG-001',
    nama: 'Ruang Kering & Bumbu 04 (Dry Storage)',
    tipe: 'dry_storage',
    kategoriLabel: 'Beras, Minyak & Bumbu Kering',
    icon: 'sun',
    suhuAktual: 22.1,
    suhuTarget: 22.0,
    suhuMin: 18.0,
    suhuMax: 26.0,
    kelembaban: 55,
    dayaListrikKw: 0.6,
    tekananFreonPsi: 50,
    pintuStatus: 'terkunci',
    airCurtainAktif: false,
    modePendingin: 'standar_haccp',
    blowerSpeed: 'auto',
    lampuUvAktif: false,
    lastCommand: 'AC Inverter menjaga sirkulasi udara kering konstan',
    lastCommandTime: '20 menit lalu',
  },
];
