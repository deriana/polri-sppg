export interface MasterMenu {
  id: string;
  nama: string;
  kategoriGizi: string;
  fotoMenu: string;
  kalori: number;
  proteinGram: number;
  karboGram: number;
  lemakGram: number;
  deskripsi: string;
}

export const MASTER_MENU_CATALOG: MasterMenu[] = [
  {
    id: 'MM-001',
    nama: 'Nasi Liwet, Ayam Bakar Madu, Sayur Bayam & Tempe Orek',
    kategoriGizi: 'Karbohidrat + Protein Hewani + Sayuran + Protein Nabati',
    fotoMenu: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    kalori: 580,
    proteinGram: 28,
    karboGram: 65,
    lemakGram: 18,
    deskripsi: 'Paket nasi liwet gurih dengan lauk utama dada ayam bakar madu empuk, tumis bayam bening segar, dan tempe orek manis pedas.',
  },
  {
    id: 'MM-002',
    nama: 'Nasi Kuning Rames, Daging Rendang Empuk & Sambal Goreng Kentang',
    kategoriGizi: 'Karbohidrat + Protein Daging Sapi + Protein Nabati',
    fotoMenu: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
    kalori: 620,
    proteinGram: 32,
    karboGram: 70,
    lemakGram: 22,
    deskripsi: 'Daging rendang empuk kaya rempah dengan nasi kuning wangi pandan, telur balado iris, dan sambal goreng kentang ati.',
  },
  {
    id: 'MM-003',
    nama: 'Nasi Gurame Bakar Kecap, Sup Sayur Wortel & Tahu Bacem',
    kategoriGizi: 'Karbohidrat + Protein Ikan + Sayuran Kompleks',
    fotoMenu: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    kalori: 540,
    proteinGram: 30,
    karboGram: 60,
    lemakGram: 14,
    deskripsi: 'Fillet gurame segar panggang manis gurih dengan sup wortel makaroni bening kaya vitamin A dan tahu bacem khas Jawa.',
  },
  {
    id: 'MM-004',
    nama: 'Nasi Ayam Goreng Lengkuas, Capcay Sayur & Telur Dadar',
    kategoriGizi: 'Karbohidrat + Double Protein + Sayur Segar',
    fotoMenu: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
    kalori: 590,
    proteinGram: 29,
    karboGram: 62,
    lemakGram: 20,
    deskripsi: 'Ayam kampung digoreng dengan serundeng lengkuas harum gurih, capcay kuah kental wortel buncis, dan telur dadar tebal.',
  },
  {
    id: 'MM-005',
    nama: 'Nasi Ayam Woku Belanga, Cah Buncis Jagung & Perkedel',
    kategoriGizi: 'Karbohidrat + Protein Pedas Segar + Sayuran',
    fotoMenu: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
    kalori: 560,
    proteinGram: 27,
    karboGram: 64,
    lemakGram: 16,
    deskripsi: 'Ayam masak bumbu woku khas Manado berminyak kemangi wangi, cah buncis jagung manis, dan perkedel kentang lembut.',
  },
  {
    id: 'MM-006',
    nama: 'Nasi Uduk Komplit, Semur Bola Daging & Tumis Kacang Panjang',
    kategoriGizi: 'Karbohidrat Santan + Protein Sapi + Sayuran',
    fotoMenu: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    kalori: 610,
    proteinGram: 31,
    karboGram: 68,
    lemakGram: 21,
    deskripsi: 'Bola daging sapi cincang dimasak semur manis gurih, nasi uduk gurih santan, dan tumis kacang panjang tempe.',
  },
];
