# 🛡️ Matriks & Panduan RBAC (Role-Based Access Control) SIGAP SPPG

Folder ini (`src/rbac/`) merupakan **pusat pemetaan hak akses dan wewenang (RBAC)** untuk seluruh peran pengguna dalam ekosistem SIGAP SPPG (Polri – BGN).

---

## 👥 Daftar 10 Peran Pengguna (*Roles*)

| Kode Role | Nama Peran | Tingkat Lingkup (*Scope*) | Deskripsi Wewenang |
| :--- | :--- | :--- | :--- |
| **`KEPALA_SPPG`** | Kepala SPPG | `sppg` | Pimpinan unit dapur; persetujuan belanja, verifikasi laporan, rekrut staf, resolve alert internal. |
| **`AHLI_GIZI`** | Ahli Gizi SPPG | `assigned` | Standarisasi AKG, uji formalin/boraks, evaluasi makronutrien, dan verifikasi kelayakan QC. |
| **`CHEF_UTAMA`** | Chef Utama & Cook | `assigned` | Eksekusi 5 tahap masak, monitoring suhu inti makanan (>75°C), cita rasa, dan master resep. |
| **`PEMORSI_PACKING`** | Petugas Pemorsi & Packing | `assigned` | Penimbangan porsi, penyegelan ompreng, pemuatan thermal box holding (>60°C). |
| **`PETUGAS_LOGISTIK`** | Petugas Logistik & Gudang | `sppg` | Penerimaan pasokan suplier DO (Scan QR), stok FEFO, mutasi bahan, sensor gudang. |
| **`PETUGAS_SANITASI`** | Petugas Sanitasi & APD | `assigned` | Dishwasher sterilisasi 85°C & UV, sanitasi area dapur, kepatuhan APD, pembuangan limbah. |
| **`DRIVER`** | Driver & Kurir Armada | `assigned` | Pengantaran armada mobil box GPS, serah terima porsi ke sekolah, bukti digital. |
| **`PETUGAS_LAPANGAN`** | Petugas Lapangan | `assigned` | Pemantauan operasional lapangan multi-SPPG penugasan. |
| **`SUPERVISOR_POLRES`** | Supervisor Polres | `polres` | Pengawas wilayah Polres/Polrestabes; memantau seluruh SPPG di wilayah hukum, tindak lanjut alert. |
| **`SUPERVISOR_POLDA`** | Supervisor Polda | `polda` | Pengawas tingkat Polda; audit makro se-provinsi, eskalasi darurat Mabes/BGN, ekspor audit PDF. |

---

## 📊 Matriks Hak Akses Lengkap (*Permission Matrix*)

| Fitur / Hak Akses | KEPALA | GIZI | CHEF | PACKING | LOGISTIK | SANITASI | DRIVER | POLRES | POLDA |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Input Data Operasional** (`canCreate`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit Data Sendiri** (`canUpdateOwn`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Kelola Staf Dapur** (`canManageStaff`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Verifikasi Laporan Masak** (`canVerifyLaporan`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Kelola Gudang & Stok** (`canManageGudang`) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Distribusi Armada GPS** (`canManageDistribusi`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Kelola Kalender Menu** (`canManageMenu`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Evaluasi & Sertifikasi Gizi** (`canManageGizi`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Akses Anggaran & HPP** (`canManageAnggaran`) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Kirim Broadcast Komando** (`canManageBroadcast`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Tindak Lanjut Alert Polres** (`canFollowUpAlert`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Selesaikan Alert Internal** (`canResolveAlert`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Eskalasi Darurat Polda** (`canEskalasiAlert`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Ekspor Laporan Wilayah** (`canExportLaporan`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Modul Khusus Driver** (`isDriver`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Mode Supervisi (Read-Only)** (`isViewOnly`) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🛠️ Cara Menambah atau Mengubah Hak Akses

1. Buka file [`src/rbac/permissions.ts`](file:///home/deryana/coding/sigap-sppg/src/rbac/permissions.ts).
2. Jika ingin menambah permission baru, tambahkan field di `interface RolePermission` dan atur `true`/`false` pada masing-masing role di objek `ROLE_PERMISSIONS`.
3. Gunakan helper fungsi di komponen/layar:
   ```typescript
   import { hasPermission } from '../rbac';

   if (hasPermission(role, 'canManageAnggaran')) {
     // Tampilkan modul anggaran
   }
   ```
