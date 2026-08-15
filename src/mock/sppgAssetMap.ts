import { Image } from 'react-native';

// Foto bundled di assets/sppg/ — semua CC/PDM, atribusi lengkap ada di assets/sppg/CREDITS.csv.
// Nama file selalu sama dengan key di bawah, jadi penggantian batch cukup timpa file .jpg-nya.
// react-native-web tidak punya Image.resolveAssetSource — di web require() sudah
// mengembalikan URL string-nya langsung, jadi dipakai apa adanya sebagai fallback.
const resolve = (assetModule: any): string => {
  try {
    return Image.resolveAssetSource?.(assetModule)?.uri ?? (typeof assetModule === 'string' ? assetModule : '');
  } catch (e) {
    return typeof assetModule === 'string' ? assetModule : '';
  }
};

export const SPPG_ASSET_MAP = {
  // Makanan Paket
  paket_nasi_liwet: resolve(require('../../assets/sppg/paket_nasi_liwet.jpg')),
  paket_nasi_kuning: resolve(require('../../assets/sppg/paket_nasi_kuning.jpg')),
  paket_nasi_gurame: resolve(require('../../assets/sppg/paket_nasi_gurame.jpg')),
  paket_nasi_ayam_goreng: resolve(require('../../assets/sppg/paket_nasi_ayam_goreng.jpg')),
  paket_nasi_ayam_woku: resolve(require('../../assets/sppg/paket_nasi_ayam_woku.jpg')),
  paket_nasi_uduk: resolve(require('../../assets/sppg/paket_nasi_uduk.jpg')),

  // Lauk Utama
  lh01_ayam_bakar: resolve(require('../../assets/sppg/lh01_ayam_bakar.jpg')),
  lh02_rendang: resolve(require('../../assets/sppg/lh02_rendang.jpg')),
  lh03_gurame_bakar: resolve(require('../../assets/sppg/lh03_gurame_bakar.jpg')),
  lh04_ayam_goreng: resolve(require('../../assets/sppg/lh04_ayam_goreng.jpg')),
  lh05_ayam_woku: resolve(require('../../assets/sppg/lh05_ayam_woku.jpg')),
  lh06_semur_bola_daging: resolve(require('../../assets/sppg/lh06_semur_bola_daging.jpg')),
  lh07_telur_balado: resolve(require('../../assets/sppg/lh07_telur_balado.jpg')),

  // Lauk Nabati
  np01_tempe_orek: resolve(require('../../assets/sppg/np01_tempe_orek.jpg')),
  np02_tahu_bacem: resolve(require('../../assets/sppg/np02_tahu_bacem.jpg')),
  np03_perkedel: resolve(require('../../assets/sppg/np03_perkedel.jpg')),
  np04_sambal_goreng: resolve(require('../../assets/sppg/np04_sambal_goreng.jpg')),

  // Sayuran
  sy01_bayam: resolve(require('../../assets/sppg/sy01_bayam.jpg')),
  sy02_sup_wortel: resolve(require('../../assets/sppg/sy02_sup_wortel.jpg')),
  sy03_capcay: resolve(require('../../assets/sppg/sy03_capcay.jpg')),
  sy04_cah_buncis: resolve(require('../../assets/sppg/sy04_cah_buncis.jpg')),
  sy05_tumis_kacang: resolve(require('../../assets/sppg/sy05_tumis_kacang.jpg')),

  // Buah & Susu
  buah_apel: resolve(require('../../assets/sppg/buah_apel.jpg')),
  buah_jeruk: resolve(require('../../assets/sppg/buah_jeruk.jpg')),
  buah_pisang: resolve(require('../../assets/sppg/buah_pisang.jpg')),
  buah_semangka: resolve(require('../../assets/sppg/buah_semangka.jpg')),
  susu_uht: resolve(require('../../assets/sppg/susu_uht.jpg')),

  // Sekolah & SPPG Dapur
  sekolah_1: resolve(require('../../assets/sppg/sekolah_1.jpg')),
  sekolah_2: resolve(require('../../assets/sppg/sekolah_2.jpg')),
  sekolah_3: resolve(require('../../assets/sppg/sekolah_3.jpg')),
  sekolah_4: resolve(require('../../assets/sppg/sekolah_4.jpg')),
  sekolah_5: resolve(require('../../assets/sppg/sekolah_5.jpg')),

  sppg_1: resolve(require('../../assets/sppg/sppg_1.jpg')),
  sppg_2: resolve(require('../../assets/sppg/sppg_2.jpg')),
  sppg_3: resolve(require('../../assets/sppg/sppg_3.jpg')),
  suasana_sppg_1: resolve(require('../../assets/sppg/suasana_sppg_1.jpg')),
  suasana_sppg_2: resolve(require('../../assets/sppg/suasana_sppg_2.jpg')),
  suasana_sppg_3: resolve(require('../../assets/sppg/suasana_sppg_3.jpg')),
  suasana_sppg_4: resolve(require('../../assets/sppg/suasana_sppg_4.jpg')),

  // Mobil & Peralatan
  mobil_1: resolve(require('../../assets/sppg/mobil_1.jpg')),
  mobil_2: resolve(require('../../assets/sppg/mobil_2.jpg')),
  tray_1: resolve(require('../../assets/sppg/tray_1.jpg')),
  tray_2: resolve(require('../../assets/sppg/tray_2.jpg')),
  alat_kettle: resolve(require('../../assets/sppg/alat_kettle.jpg')),
  alat_kompor: resolve(require('../../assets/sppg/alat_kompor.jpg')),
  alat_dishwasher: resolve(require('../../assets/sppg/alat_dishwasher.jpg')),
  alat_thermal_box: resolve(require('../../assets/sppg/alat_thermal_box.jpg')),
  alat_sealer: resolve(require('../../assets/sppg/alat_sealer.jpg')),
  alat_timbangan_digital: resolve(require('../../assets/sppg/alat_timbangan_digital.jpg')),
  alat_sterilisasi_uv: resolve(require('../../assets/sppg/alat_sterilisasi_uv.jpg')),
  alat_sink: resolve(require('../../assets/sppg/alat_sink.jpg')),
  alat_boiler: resolve(require('../../assets/sppg/alat_boiler.jpg')),
  alat_ozon_washer: resolve(require('../../assets/sppg/alat_ozon_washer.jpg')),
  alat_rak_tiris: resolve(require('../../assets/sppg/alat_rak_tiris.jpg')),
  alat_chiller: resolve(require('../../assets/sppg/alat_chiller.jpg')),
  alat_freezer: resolve(require('../../assets/sppg/alat_freezer.jpg')),
  alat_rak_gudang: resolve(require('../../assets/sppg/alat_rak_gudang.jpg')),
  alat_lemari_sampel: resolve(require('../../assets/sppg/alat_lemari_sampel.jpg')),
  alat_termometer_probe: resolve(require('../../assets/sppg/alat_termometer_probe.jpg')),
  alat_termometer_ir: resolve(require('../../assets/sppg/alat_termometer_ir.jpg')),
  alat_test_kit: resolve(require('../../assets/sppg/alat_test_kit.jpg')),
  alat_timbangan_lantai: resolve(require('../../assets/sppg/alat_timbangan_lantai.jpg')),
  alat_rice_steamer: resolve(require('../../assets/sppg/alat_rice_steamer.jpg')),
  alat_vegetable_cutter: resolve(require('../../assets/sppg/alat_vegetable_cutter.jpg')),
  alat_talenan: resolve(require('../../assets/sppg/alat_talenan.jpg')),
  alat_meja_stainless: resolve(require('../../assets/sppg/alat_meja_stainless.jpg')),
  alat_printer: resolve(require('../../assets/sppg/alat_printer.jpg')),
  alat_apd: resolve(require('../../assets/sppg/alat_apd.jpg')),
  alat_wastafel: resolve(require('../../assets/sppg/alat_wastafel.jpg')),
  alat_apar: resolve(require('../../assets/sppg/alat_apar.jpg')),
  alat_insect_killer: resolve(require('../../assets/sppg/alat_insect_killer.jpg')),
  alat_genset: resolve(require('../../assets/sppg/alat_genset.jpg')),
  alat_p3k: resolve(require('../../assets/sppg/alat_p3k.jpg')),
  alat_grease_trap: resolve(require('../../assets/sppg/alat_grease_trap.jpg')),

  // Dokumen — foto nota/kwitansi fisik untuk bukti transaksi anggaran
  nota_pembelian_1: resolve(require('../../assets/sppg/nota_pembelian_1.jpg')),
  nota_pembelian_2: resolve(require('../../assets/sppg/nota_pembelian_2.jpg')),

  // Profil Staf & User
  profil_pria_dewasa: resolve(require('../../assets/sppg/profil_pria_dewasa.jpg')),
  profil_wanita_dewasa: resolve(require('../../assets/sppg/profil_wanita_dewasa.jpg')),
  profil_pria_paruh_baya: resolve(require('../../assets/sppg/profil_pria_paruh_baya.jpg')),
  profil_wanita_paruh_baya: resolve(require('../../assets/sppg/profil_wanita_paruh_baya.jpg')),
  profil_anak_sekolah: resolve(require('../../assets/sppg/profil_anak_sekolah.jpg')),
  profil_guru: resolve(require('../../assets/sppg/profil_guru.jpg')),
  polri_1: resolve(require('../../assets/sppg/polri_1.jpg')),
  polri_2: resolve(require('../../assets/sppg/polri_2.jpg')),
};
