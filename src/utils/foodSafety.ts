import { JENIS_MAKANAN_MASA_SIMPAN } from '../mock/foodSafetyLog';

export interface FoodSafetyEstimate {
  estimasiKadaluarsa: string;
  statusKadaluarsa: 'aman' | 'mendekati_batas' | 'lewat_batas';
}

// Format matches the AppContext id/timestamp convention: 'YYYY-MM-DD HH:mm'.
function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

// Pure function: given production time + jenis makanan, computes the cutoff time and
// classifies freshness relative to now. >1h left = aman, <=1h left = mendekati_batas, past cutoff = lewat_batas.
export function estimateKadaluarsa(waktuProduksi: string, jenisMakanan: string): FoodSafetyEstimate {
  const masaSimpanJam = JENIS_MAKANAN_MASA_SIMPAN[jenisMakanan] ?? 4;
  const produksiDate = new Date(waktuProduksi.replace(' ', 'T'));
  const cutoff = new Date(produksiDate.getTime() + masaSimpanJam * 60 * 60 * 1000);

  const now = new Date();
  const msRemaining = cutoff.getTime() - now.getTime();
  const oneHourMs = 60 * 60 * 1000;

  let statusKadaluarsa: FoodSafetyEstimate['statusKadaluarsa'];
  if (msRemaining <= 0) {
    statusKadaluarsa = 'lewat_batas';
  } else if (msRemaining <= oneHourMs) {
    statusKadaluarsa = 'mendekati_batas';
  } else {
    statusKadaluarsa = 'aman';
  }

  return { estimasiKadaluarsa: formatDateTime(cutoff), statusKadaluarsa };
}
