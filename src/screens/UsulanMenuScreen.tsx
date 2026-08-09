import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { ROLE_PERMISSIONS } from '../utils/scope';
import { UsulanMenu } from '../types';

const STATUS_LABEL: Record<UsulanMenu['status'], string> = {
  diajukan: 'Menunggu Tinjauan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
};

const STATUS_TONE: Record<UsulanMenu['status'], 'neutral' | 'success' | 'danger'> = {
  diajukan: 'neutral',
  disetujui: 'success',
  ditolak: 'danger',
};

const FILTERS: Array<UsulanMenu['status'] | 'semua'> = ['semua', 'diajukan', 'disetujui', 'ditolak'];

export default function UsulanMenuScreen({ navigation }: any) {
  const { role, usulanMenuList, sekolahList, updateUsulanMenuStatus } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius } = useTheme();

  const [filterStatus, setFilterStatus] = useState<UsulanMenu['status'] | 'semua'>('semua');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [tanggapanText, setTanggapanText] = useState('');

  const canRespond = !!role && ROLE_PERMISSIONS[role].canManageMenu;

  const inScope = useMemo(() => {
    const ids = new Set(sppgInScope.map((s) => s.id));
    return usulanMenuList.filter((u) => ids.has(u.sppgId));
  }, [sppgInScope, usulanMenuList]);
  const sorted = useMemo(() => [...inScope].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [inScope]);
  const filtered = useMemo(
    () => (filterStatus === 'semua' ? sorted : sorted.filter((u) => u.status === filterStatus)),
    [sorted, filterStatus],
  );

  const respond = (id: string, status: UsulanMenu['status']) => {
    updateUsulanMenuStatus(id, status, tanggapanText.trim() || undefined);
    setRespondingId(null);
    setTanggapanText('');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.rowTop}>
        <SectionTitle style={{ marginBottom: 0 }}>Usulan Menu Sekolah</SectionTitle>
        <PrimaryButton label="Buat Usulan" icon="plus" fullWidth={false} onPress={() => navigation.navigate('UsulanMenuForm')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: 2 }}>
        {FILTERS.map((st) => {
          const isActive = filterStatus === st;
          return (
            <Pressable
              key={st}
              onPress={() => setFilterStatus(st)}
              style={[
                styles.chip,
                { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border, borderRadius: radius.pill },
              ]}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: isActive ? colors.textInverse : colors.text }}>
                {st === 'semua' ? 'Semua Status' : STATUS_LABEL[st]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="clipboard" title="Belum Ada Usulan" body="Belum ada usulan menu dari sekolah pada status ini." />
      ) : (
        filtered.map((u) => {
          const sekolah = sekolahList.find((s) => s.id === u.sekolahId);
          const isResponding = respondingId === u.id;

          return (
            <Card key={u.id} style={{ gap: spacing.xs }}>
              <View style={styles.rowTop}>
                <Pill label={STATUS_LABEL[u.status]} tone={STATUS_TONE[u.status]} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{u.tanggal}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="home" size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{sekolah?.nama ?? u.sekolahId}</Text>
              </View>

              <Text style={{ color: colors.text, fontWeight: '800', fontSize: fontSize.sm }}>{u.usulanMenu}</Text>
              {u.alasan && <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Alasan: {u.alasan}</Text>}

              {u.tanggapan && (
                <View style={{ backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 8 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>Tanggapan SPPG:</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.text }}>{u.tanggapan}</Text>
                </View>
              )}

              {canRespond && u.status === 'diajukan' && (
                isResponding ? (
                  <View style={{ gap: spacing.xs }}>
                    <Input
                      value={tanggapanText}
                      onChangeText={setTanggapanText}
                      placeholder="Catatan tanggapan (opsional)"
                      multiline
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <PrimaryButton label="Setujui" variant="secondary" fullWidth onPress={() => respond(u.id, 'disetujui')} style={{ flex: 1 }} />
                      <PrimaryButton label="Tolak" variant="danger" fullWidth onPress={() => respond(u.id, 'ditolak')} style={{ flex: 1 }} />
                    </View>
                  </View>
                ) : (
                  <PrimaryButton label="Tinjau Usulan" variant="secondary" onPress={() => { setRespondingId(u.id); setTanggapanText(''); }} />
                )
              )}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
});
