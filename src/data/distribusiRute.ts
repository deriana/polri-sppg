import { DistribusiRute } from '../types';

// Delivery instances keyed by sekolahId+tanggal so Menu Kalender can join
// "what menu was planned for date X" with "who got delivered on date X" per
// school. Covers today (2026-08-09) plus a couple of recent days, mixing
// every status including 'kendala' (delivery problem in the field).
export const distribusiList: DistribusiRute[] = [
  // SPPG-001 — Bandung (SKL-001..004)
  { id: 'DST-001', sppgId: 'SPPG-001', sekolahId: 'SKL-001', tanggal: '2026-08-07', status: 'tiba', estimasiTiba: '2026-08-07 07:30', lat: -6.9034, lng: 107.6181 },
  { id: 'DST-002', sppgId: 'SPPG-001', sekolahId: 'SKL-002', tanggal: '2026-08-07', status: 'tiba', estimasiTiba: '2026-08-07 07:40', lat: -6.9061, lng: 107.6205 },
  { id: 'DST-003', sppgId: 'SPPG-001', sekolahId: 'SKL-003', tanggal: '2026-08-07', status: 'kendala', estimasiTiba: '2026-08-07 08:00', lat: -6.9147, lng: 107.6098 },
  { id: 'DST-004', sppgId: 'SPPG-001', sekolahId: 'SKL-004', tanggal: '2026-08-07', status: 'tiba', estimasiTiba: '2026-08-07 07:50', lat: -6.8981, lng: 107.6142 },

  { id: 'DST-005', sppgId: 'SPPG-001', sekolahId: 'SKL-001', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 07:30', lat: -6.9034, lng: 107.6181 },
  { id: 'DST-006', sppgId: 'SPPG-001', sekolahId: 'SKL-002', tanggal: '2026-08-08', status: 'kendala', estimasiTiba: '2026-08-08 07:45', lat: -6.9061, lng: 107.6205 },
  { id: 'DST-007', sppgId: 'SPPG-001', sekolahId: 'SKL-003', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 08:00', lat: -6.9147, lng: 107.6098 },
  { id: 'DST-008', sppgId: 'SPPG-001', sekolahId: 'SKL-004', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 07:50', lat: -6.8981, lng: 107.6142 },

  { id: 'DST-009', sppgId: 'SPPG-001', sekolahId: 'SKL-001', tanggal: '2026-08-09', status: 'tiba', estimasiTiba: '2026-08-09 07:30', lat: -6.9034, lng: 107.6181 },
  { id: 'DST-010', sppgId: 'SPPG-001', sekolahId: 'SKL-002', tanggal: '2026-08-09', status: 'dalam_perjalanan', estimasiTiba: '2026-08-09 07:45', lat: -6.9061, lng: 107.6205 },
  { id: 'DST-011', sppgId: 'SPPG-001', sekolahId: 'SKL-003', tanggal: '2026-08-09', status: 'menunggu', estimasiTiba: '2026-08-09 08:00', lat: -6.9147, lng: 107.6098 },
  { id: 'DST-012', sppgId: 'SPPG-001', sekolahId: 'SKL-004', tanggal: '2026-08-09', status: 'kendala', estimasiTiba: '2026-08-09 07:50', lat: -6.8981, lng: 107.6142 },

  // SPPG-002 — Jakarta Selatan (SKL-005..008)
  { id: 'DST-013', sppgId: 'SPPG-002', sekolahId: 'SKL-005', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 07:50', lat: -6.2921, lng: 106.7996 },
  { id: 'DST-014', sppgId: 'SPPG-002', sekolahId: 'SKL-006', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 08:00', lat: -6.2879, lng: 106.7975 },

  { id: 'DST-015', sppgId: 'SPPG-002', sekolahId: 'SKL-005', tanggal: '2026-08-09', status: 'dalam_perjalanan', estimasiTiba: '2026-08-09 07:50', lat: -6.2921, lng: 106.7996 },
  { id: 'DST-016', sppgId: 'SPPG-002', sekolahId: 'SKL-006', tanggal: '2026-08-09', status: 'menunggu', estimasiTiba: '2026-08-09 08:05', lat: -6.2879, lng: 106.7975 },
  { id: 'DST-017', sppgId: 'SPPG-002', sekolahId: 'SKL-007', tanggal: '2026-08-09', status: 'tiba', estimasiTiba: '2026-08-09 07:40', lat: -6.2445, lng: 106.8022 },
  { id: 'DST-018', sppgId: 'SPPG-002', sekolahId: 'SKL-008', tanggal: '2026-08-09', status: 'kendala', estimasiTiba: '2026-08-09 08:10', lat: -6.2503, lng: 106.7889 },

  // SPPG-003 — Surabaya (SKL-009..012)
  { id: 'DST-019', sppgId: 'SPPG-003', sekolahId: 'SKL-009', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 08:00', lat: -7.2361, lng: 112.7828 },
  { id: 'DST-020', sppgId: 'SPPG-003', sekolahId: 'SKL-010', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 08:10', lat: -7.2390, lng: 112.7860 },

  { id: 'DST-021', sppgId: 'SPPG-003', sekolahId: 'SKL-009', tanggal: '2026-08-09', status: 'menunggu', estimasiTiba: '2026-08-09 08:10', lat: -7.2361, lng: 112.7828 },
  { id: 'DST-022', sppgId: 'SPPG-003', sekolahId: 'SKL-010', tanggal: '2026-08-09', status: 'dalam_perjalanan', estimasiTiba: '2026-08-09 08:20', lat: -7.2390, lng: 112.7860 },
  { id: 'DST-023', sppgId: 'SPPG-003', sekolahId: 'SKL-011', tanggal: '2026-08-09', status: 'tiba', estimasiTiba: '2026-08-09 07:45', lat: -7.2478, lng: 112.7605 },
  { id: 'DST-024', sppgId: 'SPPG-003', sekolahId: 'SKL-012', tanggal: '2026-08-09', status: 'tiba', estimasiTiba: '2026-08-09 07:55', lat: -7.2412, lng: 112.7550 },

  // SPPG-004 — Bekasi (SKL-013..016)
  { id: 'DST-025', sppgId: 'SPPG-004', sekolahId: 'SKL-013', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 07:45', lat: -6.2383, lng: 106.9756 },
  { id: 'DST-026', sppgId: 'SPPG-004', sekolahId: 'SKL-014', tanggal: '2026-08-08', status: 'tiba', estimasiTiba: '2026-08-08 07:55', lat: -6.2410, lng: 106.9802 },

  { id: 'DST-027', sppgId: 'SPPG-004', sekolahId: 'SKL-013', tanggal: '2026-08-09', status: 'tiba', estimasiTiba: '2026-08-09 07:45', lat: -6.2383, lng: 106.9756 },
  { id: 'DST-028', sppgId: 'SPPG-004', sekolahId: 'SKL-014', tanggal: '2026-08-09', status: 'kendala', estimasiTiba: '2026-08-09 07:55', lat: -6.2410, lng: 106.9802 },
  { id: 'DST-029', sppgId: 'SPPG-004', sekolahId: 'SKL-015', tanggal: '2026-08-09', status: 'menunggu', estimasiTiba: '2026-08-09 08:05', lat: -6.2350, lng: 106.9880 },
];
