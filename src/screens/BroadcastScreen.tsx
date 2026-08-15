import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, DropdownPicker, Input, Modal, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { BroadcastTingkat, Role } from '../types';
import { ROLE_LABEL, ROLE_PERMISSIONS } from '../utils/scope';

const TINGKAT_TONE: Record<BroadcastTingkat, 'danger' | 'warning' | 'info'> = {
  darurat: 'danger',
  penting: 'warning',
  info: 'info',
};

export default function BroadcastScreen({ navigation }: any) {
  const { role, currentUser, currentSppg, sendBroadcast } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, shadow, isDark } = useTheme();
  const { broadcastInScope } = useScopedData();

  const [showModal, setShowModal] = useState(false);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [tingkat, setTingkat] = useState<BroadcastTingkat>('penting');
  const [targetRole, setTargetRole] = useState<string>('semua');
  const [error, setError] = useState<string | null>(null);

  if (!role || !currentUser) return null;
  const permissions = ROLE_PERMISSIONS[role];

  const handleSend = () => {
    if (!judul.trim() || !isi.trim()) {
      setError('Masukkan judul dan isi pesan pengumuman.');
      return;
    }

    sendBroadcast({
      pengirimNama: currentUser.nama,
      pengirimRole: role,
      judul: judul.trim(),
      isi: isi.trim(),
      tingkat,
      targetRole: targetRole as any,
      sppgId: currentSppg?.id,
    });

    setJudul('');
    setIsi('');
    setError(null);
    setShowModal(false);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <Card variant="accent" style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="radio" size={18} color={isDark ? colors.gold : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 }}>
              INSTRUKSI & BROADCAST KOMANDO PUSAT
            </Text>
          </View>
          <Pill label={`${broadcastInScope.length} Instruksi`} tone="primary" />
        </View>
        <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
          Saluran instruksi resmi & maklumat dari Mabes Polri dan Badan Gizi Nasional (BGN) Pusat yang diturunkan ke unit SPPG pelaksana.
        </Text>
      </Card>

      {/* Button to Create Broadcast for Authorized / Simulation */}
      {/*{permissions.canManageBroadcast && (
        <PrimaryButton
          label="+ Simulasi Terbitkan Broadcast dari Pusat"
          icon="radio"
          variant="secondary"
          onPress={() => setShowModal(true)}
        />
      )}*/}

      {/* Broadcast Feed */}
      <SectionTitle>Daftar Maklumat & Instruksi Resmi</SectionTitle>

      <View style={{ gap: spacing.sm }}>
        {broadcastInScope.map((bc) => (
          <Card key={bc.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Pill label="KOMANDO PUSAT / BGN" tone="primary" />
                <Pill label={bc.tingkat.toUpperCase()} tone={TINGKAT_TONE[bc.tingkat]} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{bc.timestamp}</Text>
            </View>

            <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
              {bc.judul}
            </Text>

            <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 18 }}>
              {bc.isi}
            </Text>

            <View style={[styles.bcFooter, { borderTopColor: colors.border }]}>
              <Feather name="shield" size={13} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                Diterbitkan oleh: <Text style={{ color: colors.text, fontWeight: '700' }}>{bc.pengirimNama}</Text> ({ROLE_LABEL[bc.pengirimRole] ?? bc.pengirimRole})
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Modal Broadcast */}
      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Kirim Broadcast Pengumuman Baru">
        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={{ backgroundColor: colors.dangerBg, padding: 10, borderRadius: radius.md, marginBottom: 8 }}>
              <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '600' }}>{error}</Text>
            </View>
          )}

          <DropdownPicker
            label="Tingkat Prioritas Pesan"
            value={tingkat}
            options={[
              { label: 'Penting (Peringatan Tugas)', value: 'penting' },
              { label: 'Darurat (Instruksi Mendesak)', value: 'darurat' },
              { label: 'Info Biasa', value: 'info' },
            ]}
            onSelect={(val) => setTingkat(val as any)}
            icon="alert-circle"
          />

          <DropdownPicker
            label="Target Penerima Pesan"
            value={targetRole}
            options={[
              { label: 'Semua Tim & Staf Operasional', value: 'semua' },
              { label: 'Khusus Driver Armada MBG', value: 'DRIVER' },
              { label: 'Khusus Petugas Lapangan Dapur', value: 'PETUGAS_LAPANGAN' },
            ]}
            onSelect={setTargetRole}
            icon="users"
          />

          <Input
            label="Judul Broadcast"
            icon="type"
            value={judul}
            onChangeText={setJudul}
            placeholder="Contoh: INSTRUKSI PEMERIKSAAN SUHU DUS MIKRO"
          />

          <Input
            label="Isi Instruksi Pengumuman"
            icon="align-left"
            value={isi}
            onChangeText={setIsi}
            placeholder="Tuliskan instruksi lengkap yang harus dilaksanakan penerima..."
            multiline
          />

          <PrimaryButton label="Kirimkan Broadcast Sekarang" icon="send" onPress={handleSend} style={{ marginTop: 12 }} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 90 },
  bcFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
});
