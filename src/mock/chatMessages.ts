import { ChatMessage } from '../types';

// Fase 2 SIMULASI — balasan 'command_center' di sini adalah data seed statis,
// bukan bot/AI otomatis. Pesan dari 'sppg' hanya ditambahkan ke log lokal;
// belum benar-benar terkirim ke sistem Command Center nyata (butuh backend).
export const chatMessages: ChatMessage[] = [
  { id: 'CHT-001', sppgId: 'SPPG-001', sender: 'command_center', senderName: 'Command Center Polda Jabar', text: 'Selamat pagi, mohon update kesiapan distribusi hari ini.', timestamp: '2026-08-08 06:00' },
  { id: 'CHT-002', sppgId: 'SPPG-001', sender: 'sppg', senderName: 'Kompol Ahmad Fauzi', text: 'Siap, produksi sudah berjalan sesuai target.', timestamp: '2026-08-08 06:05' },
  { id: 'CHT-003', sppgId: 'SPPG-001', sender: 'command_center', senderName: 'Command Center Polda Jabar', text: 'Baik, laporkan segera bila ada kendala di lapangan.', timestamp: '2026-08-08 06:07' },
  { id: 'CHT-004', sppgId: 'SPPG-002', sender: 'command_center', senderName: 'Command Center Polda Metro Jaya', text: 'Mohon cek suhu penyimpanan pagi ini.', timestamp: '2026-08-09 06:10' },
  { id: 'CHT-005', sppgId: 'SPPG-002', sender: 'sppg', senderName: 'AKP Budi Santoso', text: 'Sudah dicek, suhu dalam batas aman.', timestamp: '2026-08-09 06:15' },
  { id: 'CHT-006', sppgId: 'SPPG-003', sender: 'command_center', senderName: 'Command Center Polda Jatim', text: 'Selamat pagi, semoga distribusi lancar.', timestamp: '2026-08-09 06:00' },
  { id: 'CHT-007', sppgId: 'SPPG-001', sender: 'command_center', senderName: 'Command Center Polda Jabar', text: 'Selamat pagi, mohon update kesiapan distribusi hari ini.', timestamp: '2026-08-10 06:00' },
  { id: 'CHT-008', sppgId: 'SPPG-001', sender: 'sppg', senderName: 'Kompol Ahmad Fauzi', text: 'Siap, produksi sudah berjalan, target 1500 porsi hari ini.', timestamp: '2026-08-10 06:05' },
  { id: 'CHT-009', sppgId: 'SPPG-002', sender: 'sppg', senderName: 'AKP Budi Santoso', text: 'Distribusi pagi ini baru mulai jalan, rute 1 sudah tiba di sekolah pertama.', timestamp: '2026-08-10 07:35' },
  { id: 'CHT-010', sppgId: 'SPPG-002', sender: 'command_center', senderName: 'Command Center Polda Metro Jaya', text: 'Baik, ditunggu update setelah rute selesai.', timestamp: '2026-08-10 07:40' },
];
