// Fase 2 SIMULASI ONLY — tidak ada koneksi ke perangkat/sensor IoT sungguhan.
// Nilai suhu dihasilkan dari formula sederhana berbasis menit saat ini, cukup
// bervariasi untuk demo tanpa perlu dependency random/uuid.
export function getSimulatedSuhuReading(): { suhu: number; deviceStatus: 'online' | 'offline'; timestamp: string } {
  const now = new Date();
  const minute = now.getMinutes();
  // Rentang suhu gudang/kulkas yang plausible: 2°C - 10°C.
  const suhu = Math.round((2 + (minute % 9) + (minute % 3) * 0.3) * 10) / 10;
  // Simulasikan sensor sesekali offline (kira-kira setiap menit kelipatan 7).
  const deviceStatus: 'online' | 'offline' = minute % 7 === 0 ? 'offline' : 'online';
  const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');
  return { suhu, deviceStatus, timestamp };
}
