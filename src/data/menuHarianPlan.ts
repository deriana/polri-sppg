import { MenuHarianPlan } from '../types';
import { sppgList } from './sppg';

const MENU_ROTATION: { menu: string; kategoriGizi: string; fotoMenu: string }[] = [
  {
    menu: 'Nasi Liwet, Ayam Bakar Bumbu Madu, Tumis Kangkung, Buah Pisang, Susu UHT',
    kategoriGizi: 'Karbohidrat Kompleks, Protein Hewani, Serat & Buah, Kalsium Susu',
    fotoMenu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Kuning Gurih, Daging Rendang Empuk, Sup Sayur Bening, Buah Jeruk',
    kategoriGizi: 'Karbohidrat, Protein Hewani Tinggi, Mineral & Vitamin C',
    fotoMenu: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Putih Organik, Fillet Ikan Gurame Bakar, Tumis Buncis Jagung, Semangka',
    kategoriGizi: 'Karbohidrat, Omega-3 Ikan, Serat Buncis, Hidrasi Semangka',
    fotoMenu: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Uduk Bangka, Telur Balado Rempah, Sayur Bayam Bening, Pepaya Segar',
    kategoriGizi: 'Karbohidrat, Protein Telur, Vitamin A Bayam, Pencernaan Pepaya',
    fotoMenu: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Rempah Woku, Ayam Woku Manado, Capcay Komplit, Buah Melon',
    kategoriGizi: 'Karbohidrat, Protein Ayam Rempah, Serat Capcay, Vitamin C Melon',
    fotoMenu: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Pandan, Bola Daging Sapi Semur, Sayur Lodeh Labu, Jeruk Manis',
    kategoriGizi: 'Karbohidrat, Zat Besi Daging Sapi, Serat Labu, Vitamin C Jeruk',
    fotoMenu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Gurih, Ikan Kakap Goreng Tepung, Tumis Tauge Bakso, Semangka',
    kategoriGizi: 'Karbohidrat, Protein Kakap, Vitamin Tauge, Kalsium Susu UHT',
    fotoMenu: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
  },
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
      fotoMenu: combo.fotoMenu,
    };
    return plan;
  }),
);
