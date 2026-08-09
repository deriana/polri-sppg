import { MenuHarianPlan } from '../types';
import { sppgList } from './sppg';

// MBG-style weekly menu rotation. Cycled by (day-index + sppg-index) so every
// SPPG shows variety day-to-day and isn't in lockstep with the others.
const MENU_ROTATION: { menu: string; kategoriGizi: string }[] = [
  { menu: 'Nasi, Ayam Goreng, Tumis Kangkung, Pisang', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { menu: 'Nasi, Rendang Daging, Sayur Asem, Jeruk', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { menu: 'Nasi, Ikan Bakar, Tumis Buncis, Semangka', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { menu: 'Nasi, Telur Balado, Sayur Bayam, Pepaya', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { menu: 'Nasi, Perkedel Kentang, Sayur Lodeh, Jeruk', kategoriGizi: 'Karbohidrat, Protein Nabati, Sayur, Buah' },
  { menu: 'Nasi, Ayam Bakar, Capcay, Pisang', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
  { menu: 'Nasi, Ikan Goreng, Tumis Toge, Semangka', kategoriGizi: 'Karbohidrat, Protein Hewani, Sayur, Buah' },
];

function dateRange(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startISO);
  const end = new Date(endISO);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Current month (Agustus 2026) + a bit of next month.
const PLAN_DATES = dateRange('2026-08-01', '2026-09-05');

let seq = 0;
export const menuHarianPlanList: MenuHarianPlan[] = sppgList.flatMap((sppg, sppgIdx) =>
  PLAN_DATES.map((tanggal, dayIdx) => {
    seq += 1;
    const combo = MENU_ROTATION[(dayIdx + sppgIdx) % MENU_ROTATION.length];
    const plan: MenuHarianPlan = {
      id: `MHP-${String(seq).padStart(3, '0')}`,
      sppgId: sppg.id,
      tanggal,
      menu: combo.menu,
      kategoriGizi: combo.kategoriGizi,
    };
    return plan;
  }),
);
