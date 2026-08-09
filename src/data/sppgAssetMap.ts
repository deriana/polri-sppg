import { Image } from 'react-native';

const resolve = (assetModule: any): string => {
  try {
    return Image.resolveAssetSource(assetModule)?.uri ?? '';
  } catch (e) {
    return '';
  }
};

export const SPPG_ASSET_MAP = {
  // Makanan Paket
  paket_nasi_liwet: resolve(require('../../assets/sppg/paket_nasi_liwet_ayam_bakar_madu.jpg')),
  paket_nasi_kuning: resolve(require('../../assets/sppg/paket_nasi_kuning_rendang.jpg')),
  paket_nasi_gurame: resolve(require('../../assets/sppg/paket_nasi_gurame_bakar.jpg')),
  paket_nasi_ayam_goreng: resolve(require('../../assets/sppg/paket_nasi_ayam_goreng_lengkuas.jpg')),
  paket_nasi_ayam_woku: resolve(require('../../assets/sppg/paket_nasi_ayam_woku.jpg')),
  paket_nasi_uduk: resolve(require('../../assets/sppg/paket_nasi_uduk_semur.jpg')),

  // Lauk Utama
  lh01_ayam_bakar: resolve(require('../../assets/sppg/lh01_ayam_bakar_madu.jpg')),
  lh02_rendang: resolve(require('../../assets/sppg/lh02_rendang_daging_sapi.jpg')),
  lh03_gurame_bakar: resolve(require('../../assets/sppg/lh03_ikan_gurame_bakar.jpg')),
  lh04_ayam_goreng: resolve(require('../../assets/sppg/lh04_ayam_goreng_serundeng.jpg')),
  lh05_ayam_woku: resolve(require('../../assets/sppg/lh05_ayam_woku_kemangi.jpg')),
  lh06_semur_bola_daging: resolve(require('../../assets/sppg/lh06_semur_bola_daging.jpg')),
  lh07_telur_balado: resolve(require('../../assets/sppg/lh07_telur_balado.jpg')),

  // Lauk Nabati
  np01_tempe_orek: resolve(require('../../assets/sppg/np01_tempe_orek.jpg')),
  np02_tahu_bacem: resolve(require('../../assets/sppg/np02_tahu_bacem.jpg')),
  np03_perkedel: resolve(require('../../assets/sppg/np03_perkedel_kentang.jpg')),
  np04_sambal_goreng: resolve(require('../../assets/sppg/np04_sambal_goreng_kentang_ati.jpg')),

  // Sayuran
  sy01_bayam: resolve(require('../../assets/sppg/sy01_sup_bayam.jpg')),
  sy02_sup_wortel: resolve(require('../../assets/sppg/sy02_sup_wortel_makaroni.jpg')),
  sy03_capcay: resolve(require('../../assets/sppg/sy03_capcay_sayur.jpg')),
  sy04_cah_buncis: resolve(require('../../assets/sppg/sy04_cah_buncis_jagung.jpg')),
  sy05_tumis_kacang: resolve(require('../../assets/sppg/sy05_tumis_kacang_panjang.jpg')),

  // Buah & Susu
  buah_apel: resolve(require('../../assets/sppg/buah_apel.jpg')),
  buah_jeruk: resolve(require('../../assets/sppg/buah_jeruk.jpg')),
  buah_pisang: resolve(require('../../assets/sppg/buah_pisang_ambon.jpg')),
  buah_semangka: resolve(require('../../assets/sppg/buah_semangka_melon.jpg')),
  susu_uht: resolve(require('../../assets/sppg/susu_uht.jpg')),

  // Sekolah & SPPG Dapur
  sekolah_1: resolve(require('../../assets/sppg/sekolah_1.jpeg')),
  sekolah_2: resolve(require('../../assets/sppg/sekolah_2.jpg')),
  sekolah_3: resolve(require('../../assets/sppg/sekolah_3.jpeg')),
  sekolah_4: resolve(require('../../assets/sppg/sekolah_4.webp')),
  sekolah_5: resolve(require('../../assets/sppg/sekolah_5.jpeg')),

  sppg_1: resolve(require('../../assets/sppg/sppg_1.png')),
  sppg_2: resolve(require('../../assets/sppg/sppg_2.jpg')),
  sppg_3: resolve(require('../../assets/sppg/sppg_3.jpeg')),
  suasana_sppg_1: resolve(require('../../assets/sppg/suasana_kantor_sppg.webp')),
  suasana_sppg_2: resolve(require('../../assets/sppg/suasana_kantor_sppg_2.webp')),
  suasana_sppg_3: resolve(require('../../assets/sppg/suasana_kantor_sppg_3.jpg')),
  suasana_sppg_4: resolve(require('../../assets/sppg/suasana_kantor_sppg_4.jpeg')),

  // Mobil & Peralatan
  mobil_1: resolve(require('../../assets/sppg/mobil_mbg_1.jpeg')),
  mobil_2: resolve(require('../../assets/sppg/mobil_mbg_2.jpg')),
  tray_1: resolve(require('../../assets/sppg/tray_mbg_1.jpeg')),
  tray_2: resolve(require('../../assets/sppg/tray_mbg_2.jpeg')),

  // Profil Staf & User
  profil_pria_dewasa: resolve(require('../../assets/sppg/profil_pria_dewasa.jpg')),
  profil_wanita_dewasa: resolve(require('../../assets/sppg/profil_wanita_dewasa.jpg')),
  profil_pria_paruh_baya: resolve(require('../../assets/sppg/profil_pria_paruh_baya.jpg')),
  profil_wanita_paruh_baya: resolve(require('../../assets/sppg/profil_wanita_paruh_baya.jpg')),
  profil_anak_sekolah: resolve(require('../../assets/sppg/profil_anak_sekolah.jpg')),
  profil_guru: resolve(require('../../assets/sppg/profil_guru.jpg')),
  polri_1: resolve(require('../../assets/sppg/polri.jpeg')),
  polri_2: resolve(require('../../assets/sppg/polri_2.jpeg')),
  aduan_1: resolve(require('../../assets/sppg/aduan_masyarakat_1.jpg')),
};
