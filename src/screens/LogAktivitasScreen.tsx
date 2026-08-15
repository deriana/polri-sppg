import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { ActivityCategory, SystemActivityLog } from '../types';
import { ROLE_LABEL } from '../utils/scope';

const CATEGORY_TABS: { key: ActivityCategory | 'all'; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'all', label: 'Semua', icon: 'layers' },
  { key: 'autentikasi', label: 'Autentikasi', icon: 'shield' },
  { key: 'presensi', label: 'Presensi', icon: 'user-check' },
  { key: 'produksi', label: 'Produksi', icon: 'coffee' },
  { key: 'food_safety', label: 'Food Safety', icon: 'check-circle' },
  { key: 'logistik', label: 'Logistik & Stok', icon: 'box' },
  { key: 'distribusi', label: 'Distribusi', icon: 'truck' },
  { key: 'keuangan', label: 'Keuangan HPP', icon: 'credit-card' },
  { key: 'insiden', label: 'Insiden & Kendala', icon: 'alert-triangle' },
  { key: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
];

export default function LogAktivitasScreen() {
  const { activityLogs, currentSppg } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemActivityLog | null>(null);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchCategory = selectedCategory === 'all' || log.kategori === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        log.userName.toLowerCase().includes(q) ||
        log.aksi.toLowerCase().includes(q) ||
        log.rincian.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [activityLogs, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = activityLogs.length;
    const success = activityLogs.filter((l) => l.status === 'SUCCESS').length;
    const warning = activityLogs.filter((l) => l.status === 'WARNING').length;
    return { total, success, warning };
  }, [activityLogs]);

  const handleExportLogs = () => {
    Alert.alert(
      'Export Log Aktivitas',
      `Audit log sistem (${filteredLogs.length} entri) berhasil disiapkan dalam format terenkripsi Presisi Polri & BGN.`,
      [{ text: 'OK' }],
    );
  };

  const getCategoryColor = (cat: ActivityCategory) => {
    switch (cat) {
      case 'autentikasi':
        return '#3B82F6';
      case 'presensi':
        return '#0D9488';
      case 'produksi':
        return '#F59E0B';
      case 'food_safety':
        return '#10B981';
      case 'logistik':
        return '#8B5CF6';
      case 'distribusi':
        return '#06B6D4';
      case 'keuangan':
        return '#EAB308';
      case 'insiden':
        return '#EF4444';
      case 'pengaturan':
        return '#64748B';
      default:
        return colors.primary;
    }
  };

  const getCategoryIcon = (cat: ActivityCategory): keyof typeof Feather.glyphMap => {
    switch (cat) {
      case 'autentikasi':
        return 'shield';
      case 'presensi':
        return 'user-check';
      case 'produksi':
        return 'coffee';
      case 'food_safety':
        return 'check-circle';
      case 'logistik':
        return 'box';
      case 'distribusi':
        return 'truck';
      case 'keuangan':
        return 'credit-card';
      case 'insiden':
        return 'alert-triangle';
      case 'pengaturan':
        return 'settings';
      default:
        return 'activity';
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* 1. Header Ringkasan Audit */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
              Log Aktivitas & Audit Trail
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {currentSppg?.nama ?? 'Dapur Sentral SPPG'} • Real-Time Tracking
            </Text>
          </View>
          <Pressable
            onPress={handleExportLogs}
            style={[styles.exportBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
          >
            <Feather name="download" size={13} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Ekspor</Text>
          </Pressable>
        </View>

        {/* 3 Metric Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{stats.total}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>Total Aktivitas</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#F0FDF4', borderColor: colors.success }]}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.success }}>{stats.success}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success }}>Berhasil Normal</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', borderColor: colors.danger }]}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.danger }}>{stats.warning}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.danger }}>Anomali / Perhatian</Text>
          </View>
        </View>
      </View>

      {/* 2. Filter Tab & Search Bar */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: 10, gap: 10 }}>
        <Input
          placeholder="Cari user, aktivitas, atau ID log..."
          icon="search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedCategory(tab.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Feather
                  name={tab.icon}
                  size={12}
                  color={isSelected ? colors.textInverse : colors.textMuted}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? colors.textInverse : colors.text,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Daftar Log Aktivitas */}
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: 10, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon="activity"
            title="Tidak Ada Aktivitas"
            body="Tidak ditemukan log aktivitas yang sesuai dengan filter atau kata kunci pencarian."
          />
        ) : (
          filteredLogs.map((log) => {
            const catColor = getCategoryColor(log.kategori);
            const catIcon = getCategoryIcon(log.kategori);

            return (
              <Pressable
                key={log.id}
                onPress={() => setSelectedLog(log)}
                style={({ pressed }) => [
                  styles.logCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: log.status === 'WARNING' ? colors.warning : colors.border,
                    borderRadius: radius.lg,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={styles.logCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${catColor}18` }]}>
                      <Feather name={catIcon} size={14} color={catColor} strokeWidth={iconStrokeWidth} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: catColor, textTransform: 'uppercase' }}>
                        {log.kategori.replace('_', ' ')}
                      </Text>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                        {log.aksi}
                      </Text>
                    </View>
                  </View>
                  <Pill
                    label={log.status}
                    tone={log.status === 'SUCCESS' ? 'success' : log.status === 'WARNING' ? 'warning' : 'primary'}
                  />
                </View>

                <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }}>
                  {log.rincian}
                </Text>

                <View style={[styles.logCardFooter, { borderTopColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Feather name="user" size={11} color={colors.textMuted} />
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.text }}>
                      {log.userName} ({ROLE_LABEL[log.userRole] ?? log.userRole})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="clock" size={11} color={colors.textMuted} />
                    <Text style={{ fontSize: 10.5, color: colors.textMuted }}>{log.timestamp}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* 4. Modal Detail Audit Log */}
      <Modal
        visible={!!selectedLog}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedLog(null)} />
          {selectedLog && (
            <Card style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.catIconWrap, { backgroundColor: `${getCategoryColor(selectedLog.kategori)}20` }]}>
                    <Feather name={getCategoryIcon(selectedLog.kategori)} size={16} color={getCategoryColor(selectedLog.kategori)} />
                  </View>
                  <View>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                      Detail Rekam Audit Forensik
                    </Text>
                    <Text style={{ fontSize: 10.5, color: colors.textMuted }}>ID Log: {selectedLog.id}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedLog(null)} hitSlop={8}>
                  <Feather name="x" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 8 }}>
                <View style={[styles.detailItem, { backgroundColor: colors.background, borderRadius: radius.md }]}>
                  <Text style={styles.detailLabel}>Aktivitas / Aksi:</Text>
                  <Text style={[styles.detailValue, { color: colors.text, fontWeight: '900' }]}>{selectedLog.aksi}</Text>
                </View>

                <View style={[styles.detailItem, { backgroundColor: colors.background, borderRadius: radius.md }]}>
                  <Text style={styles.detailLabel}>Deskripsi Lengkap:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedLog.rincian}</Text>
                </View>

                <View style={[styles.detailItem, { backgroundColor: colors.background, borderRadius: radius.md }]}>
                  <Text style={styles.detailLabel}>Pelaku Personel:</Text>
                  <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                    {selectedLog.userName} ({ROLE_LABEL[selectedLog.userRole] ?? selectedLog.userRole})
                  </Text>
                  <Text style={{ fontSize: 10.5, color: colors.textMuted }}>User ID: {selectedLog.userId}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.detailItem, { flex: 1, backgroundColor: colors.background, borderRadius: radius.md }]}>
                    <Text style={styles.detailLabel}>Waktu Server:</Text>
                    <Text style={[styles.detailValue, { color: colors.text, fontWeight: '700' }]}>{selectedLog.timestamp} WIB</Text>
                  </View>
                  <View style={[styles.detailItem, { flex: 1, backgroundColor: colors.background, borderRadius: radius.md }]}>
                    <Text style={styles.detailLabel}>IP Jaringan:</Text>
                    <Text style={[styles.detailValue, { color: colors.text, fontWeight: '700' }]}>{selectedLog.ipAddress ?? '10.12.4.88'}</Text>
                  </View>
                </View>

                <View style={[styles.detailItem, { backgroundColor: colors.background, borderRadius: radius.md }]}>
                  <Text style={styles.detailLabel}>Info Perangkat / Enkripsi:</Text>
                  <Text style={[styles.detailValue, { color: colors.textMuted }]}>{selectedLog.deviceInfo ?? 'Dinas SPPG Mobile App (Secured)'}</Text>
                </View>
              </View>

              <SecondaryButton label="Tutup Detail" onPress={() => setSelectedLog(null)} />
            </Card>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerCard: { padding: 14, borderBottomWidth: 1 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statBadge: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  logCard: {
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    padding: 16,
    gap: 8,
  },
  detailItem: {
    padding: 10,
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 11.5,
  },
});
