import { MenuHarianPlan } from '../types';
import { sppgList } from './sppg';
import { dateRange } from './dateRange';

const MENU_ROTATION: { menu: string; kategoriGizi: string; fotoMenu: string }[] = [
  {
    menu: 'Nasi Liwet Pulen, Ayam Bakar Bumbu Madu, Tumis Kangkung Belacan, Buah Pisang Ambon, Susu UHT',
    kategoriGizi: 'Karbohidrat Kompleks, Protein Hewani, Serat & Buah, Kalsium Susu',
    fotoMenu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Kuning Gurih, Daging Rendang Empuk, Sup Sayur Wortel Bening, Buah Jeruk Manis',
    kategoriGizi: 'Karbohidrat, Protein Hewani Tinggi, Mineral & Vitamin C',
    fotoMenu: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Putih Organik, Fillet Ikan Gurame Bakar Kecap, Tumis Buncis Jagung Manis, Semangka Segar',
    kategoriGizi: 'Karbohidrat, Omega-3 Ikan, Serat Buncis, Hidrasi Semangka',
    fotoMenu: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Uduk Gurih, Telur Balado Rempah, Sayur Bayam Labu Bening, Buah Pepaya Manis',
    kategoriGizi: 'Karbohidrat, Protein Telur, Vitamin A Bayam, Pencernaan Pepaya',
    fotoMenu: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Rempah Kemangi, Ayam Woku Manado, Capcay Sayur Komplit, Buah Melon Madu',
    kategoriGizi: 'Karbohidrat, Protein Ayam Rempah, Serat Capcay, Vitamin C Melon',
    fotoMenu: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Pandan Harum, Bola Daging Sapi Semur, Sayur Lodeh Labu Siam, Jeruk Medan Manis',
    kategoriGizi: 'Karbohidrat, Zat Besi Daging Sapi, Serat Labu, Vitamin C Jeruk',
    fotoMenu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Gurih Daun Jeruk, Ikan Kakap Goreng Tepung Crispy, Tumis Tauge Tahu Bakso, Semangka Merah',
    kategoriGizi: 'Karbohidrat, Protein Kakap, Vitamin Tauge, Kalsium Susu UHT',
    fotoMenu: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Bento Jepang, Chicken Katsu Saus Teriyaki, Salad Wortel Jagung, Buah Apel Fuji',
    kategoriGizi: 'Karbohidrat, Protein Katsu Crispy, Antioksidan Apel, Vitamin Sayur',
    fotoMenu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Merah Organik, Ayam Ungkep Kalasan, Sup Kimlo Sayur Jamur, Buah Buah Naga Merah',
    kategoriGizi: 'Serat Nasi Merah, Protein Ayam Kalasan, Jamur Prebiotik, Vitamin Buah Naga',
    fotoMenu: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  },
  {
    menu: 'Nasi Tutug Oncom Khas Sunda, Empal Daging Sapi Suwir, Sayur Asem Segar, Pisang Raja',
    kategoriGizi: 'Karbohidrat, Fermentasi Oncom Sehat, Protein Sapi, Elektrolit Sayur Asem',
    fotoMenu: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  },
];

// Exclude Saturday (6) and Sunday (0) from default auto-generation (Hari Libur Sekolah MBG)
// Generates rolling menu plans from August 1, 2026 to November 30, 2026 (3 months forward)
const SCHOOL_DAYS_DATES = dateRange('2026-08-01', '2026-11-30').filter((d) => {
  const day = new Date(d).getDay();
  return day !== 0 && day !== 6;
});

let seq = 0;
export const menuHarianPlanList: MenuHarianPlan[] = sppgList.flatMap((sppg, sppgIdx) =>
  SCHOOL_DAYS_DATES.map((tanggal, dayIdx) => {
    seq += 1;
    const combo = MENU_ROTATION[(dayIdx + sppgIdx) % MENU_ROTATION.length];
    const plan: MenuHarianPlan = {
      id: `MHP-${String(seq).padStart(4, '0')}`,
      sppgId: sppg.id,
      tanggal,
      menu: combo.menu,
      kategoriGizi: combo.kategoriGizi,
      fotoMenu: combo.fotoMenu,
    };
    return plan;
  }),
);
