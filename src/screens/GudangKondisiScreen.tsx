import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  Card,
  EmptyState,
  Input,
  Modal,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeBahanBaku } from '../utils/scope';
import CctvPlayer from '../components/CctvPlayer';
import { CCTV_FEEDS, CCTV_VIDEO_ASSETS } from '../mock/cctvEvents';
import { INITIAL_STORAGE_IOT_UNITS, StorageIotUnit } from '../mock/gudangIot';
import { useLocalVideoUri } from '../utils/localVideoAsset';
import { BahanBaku, BahanKategori } from '../types';

const KATEGORI_LABEL: Record<BahanKategori, string> = {
  bahan_pokok: 'Bahan Pokok',
  protein: 'Protein & Daging',
  sayur_buah: 'Sayur & Buah',
  bumbu: 'Bumbu & Minyak',
  kemasan: 'Kemasan & Box',
  lainnya: 'Lainnya',
};

const SUHU_AMAN_MAX = 8;
const EXPIRY_WARNING_DAYS = 3;

function daysUntil(tanggal: string): number {
  const d = new Date(tanggal);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GudangKondisiScreen({ navigation }: any) {
  const { currentSppg, foodSafetyList, bahanBakuList } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, iconStrokeWidth, radius, isDark } = useTheme();

  // CCTV Play/Pause State (Default standby / no auto-play)
  const [isCctvPlaying, setIsCctvPlaying] = useState(false);

  // Modal State: 'semua' | 'menipis' | 'kadaluarsa' | null
  const [activeModal, setActiveModal] = useState<'semua' | 'menipis' | 'kadaluarsa' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab State for Bahan: 'stok_kritis' | 'fefo_exp' | 'semua_stok'
  const [activeListTab, setActiveListTab] = useState<'stok_kritis' | 'fefo_exp' | 'semua_stok'>('stok_kritis');

  // Interactive IoT Storage Units State
  const [iotUnits, setIotUnits] = useState<StorageIotUnit[]>(INITIAL_STORAGE_IOT_UNITS);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('IOT-CHL-01');
  const [iotFeedback, setIotFeedback] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);

  // Live Real-Time IoT Simulation: updates telemetry every 2.5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setLivePulse((p) => !p);
      setIotUnits((prev) =>
        prev.map((unit) => {
          let newSuhu = unit.suhuAktual;

          if (unit.pintuStatus === 'terbuka') {
            // Door open: temperature gradually climbs towards ambient room temperature
            const maxTemp = unit.tipe === 'deep_freezer' ? 0.0 : 12.0;
            if (newSuhu < maxTemp) {
              newSuhu = Math.round((newSuhu + 0.15) * 10) / 10;
            }
          } else {
            // Door closed: compressor regulates towards target setpoint
            const diff = unit.suhuTarget - newSuhu;
            if (Math.abs(diff) > 0.25) {
              const step = diff > 0 ? 0.1 : -0.1;
              newSuhu = Math.round((newSuhu + step) * 10) / 10;
            } else {
              // Natural sensor jitter around target setpoint (±0.1°C)
              const jitter = Math.round(((Math.random() - 0.5) * 0.2) * 10) / 10;
              newSuhu = Math.round((unit.suhuTarget + jitter) * 10) / 10;
            }
          }

          // Natural humidity fluctuation (±1% RH)
          const humidJitter = Math.floor(Math.random() * 3) - 1;
          const newHumid = Math.max(45, Math.min(88, unit.kelembaban + humidJitter));

          // Natural power draw fluctuation (kW)
          const basePower =
            unit.modePendingin === 'turbo_freeze'
              ? 2.2
              : unit.modePendingin === 'eco_saving'
              ? 0.7
              : unit.modePendingin === 'auto_defrost'
              ? 1.8
              : 1.35;
          const powerJitter = Math.round(((Math.random() - 0.5) * 0.12) * 100) / 100;
          const newPower = Math.max(0.4, Math.round((basePower + powerJitter) * 100) / 100);

          // Freon pressure fluctuation (PSI)
          const freonJitter = Math.floor(Math.random() * 3) - 1;
          const newFreon = Math.max(36, Math.min(52, unit.tekananFreonPsi + freonJitter));

          return {
            ...unit,
            suhuAktual: newSuhu,
            kelembaban: newHumid,
            dayaListrikKw: newPower,
            tekananFreonPsi: newFreon,
          };
        }),
      );
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const activeUnit = useMemo(() => {
    return iotUnits.find((u) => u.id === selectedUnitId) ?? iotUnits[0];
  }, [iotUnits, selectedUnitId]);

  // Adjust Temperature Handler (+ / -)
  const handleAdjustTemp = (delta: number) => {
    setIotUnits((prev) =>
      prev.map((unit) => {
        if (unit.id !== selectedUnitId) return unit;
        const newTarget = Math.round((unit.suhuTarget + delta) * 10) / 10;
        if (newTarget < unit.suhuMin || newTarget > unit.suhuMax) return unit;
        // Simulate actual temperature moving slightly towards target
        const tempDiff = newTarget - unit.suhuAktual;
        const simulatedActual = Math.round((unit.suhuAktual + tempDiff * 0.25) * 10) / 10;
        return {
          ...unit,
          suhuTarget: newTarget,
          suhuAktual: simulatedActual,
          lastCommand: `Perintah IoT: Suhu target disetel ke ${newTarget > 0 ? `+${newTarget}` : newTarget}°C (Inverter menyesuaikan)`,
          lastCommandTime: 'Baru saja',
        };
      }),
    );
    setIotFeedback(`Perintah dikirim ke ${activeUnit.nama}: Suhu target disetel.`);
    setTimeout(() => setIotFeedback(null), 3500);
  };

  // Toggle Door Open / Locked (Buka / Kunci Kulkas)
  const handleToggleDoor = () => {
    setIotUnits((prev) =>
      prev.map((unit) => {
        if (unit.id !== selectedUnitId) return unit;
        const nextStatus = unit.pintuStatus === 'terkunci' ? 'terbuka' : 'terkunci';
        const isNowOpen = nextStatus === 'terbuka';
        return {
          ...unit,
          pintuStatus: nextStatus,
          // When door is open, air curtain automatically activates to maintain cold air
          airCurtainAktif: isNowOpen ? true : unit.airCurtainAktif,
          lastCommand: isNowOpen
            ? 'Pintu Cold Storage DIBUKA via IoT Solenoid (Air Curtain Otomatis Aktif)'
            : 'Pintu Cold Storage DITUTUP & TERKUNCI RAPAT',
          lastCommandTime: 'Baru saja',
        };
      }),
    );
    setIotFeedback(
      activeUnit.pintuStatus === 'terkunci'
        ? `Pintu ${activeUnit.nama} berhasil dibuka via IoT. Air curtain otomatis aktif.`
        : `Pintu ${activeUnit.nama} telah dikunci rapat kembali.`,
    );
    setTimeout(() => setIotFeedback(null), 3500);
  };

  // Change Cooling Mode
  const handleChangeMode = (mode: StorageIotUnit['modePendingin']) => {
    setIotUnits((prev) =>
      prev.map((unit) => {
        if (unit.id !== selectedUnitId) return unit;
        const modeLabels = {
          standar_haccp: 'Standar HACCP (Otomatis)',
          turbo_freeze: 'Turbo Fast Chill / Freeze',
          eco_saving: 'Eco Saving Mode (Hemat Daya)',
          auto_defrost: 'Siklus Auto-Defrost (Pencairan Es)',
        };
        return {
          ...unit,
          modePendingin: mode,
          lastCommand: `Mode pendingin diubah ke: ${modeLabels[mode]}`,
          lastCommandTime: 'Baru saja',
        };
      }),
    );
    setIotFeedback(`Mode pendingin ${activeUnit.nama} berhasil diubah.`);
    setTimeout(() => setIotFeedback(null), 3500);
  };

  // Toggle Air Curtain
  const handleToggleAirCurtain = () => {
    setIotUnits((prev) =>
      prev.map((unit) => {
        if (unit.id !== selectedUnitId) return unit;
        return {
          ...unit,
          airCurtainAktif: !unit.airCurtainAktif,
          lastCommand: `Air curtain penghalang udara dingin ${!unit.airCurtainAktif ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`,
          lastCommandTime: 'Baru saja',
        };
      }),
    );
  };

  // Toggle UV Lamp
  const handleToggleLampuUv = () => {
    setIotUnits((prev) =>
      prev.map((unit) => {
        if (unit.id !== selectedUnitId) return unit;
        return {
          ...unit,
          lampuUvAktif: !unit.lampuUvAktif,
          lastCommand: `Lampu UV-C sterilisasi udara ${!unit.lampuUvAktif ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`,
          lastCommandTime: 'Baru saja',
        };
      }),
    );
  };

  const sensorSuhu = foodSafetyList.find((f) => f.sppgId === currentSppg?.id && f.sumberSuhu === 'sensor_iot');
  const isSuhuAman = activeUnit.suhuAktual <= (activeUnit.tipe === 'deep_freezer' ? -12 : SUHU_AMAN_MAX);

  const bahanInScope = useMemo(() => scopeBahanBaku(sppgInScope, bahanBakuList), [sppgInScope, bahanBakuList]);

  // Bahan stok di bawah ambang minimum
  const stokMenipis = useMemo(() => {
    return bahanInScope.filter((b) => b.stok <= b.ambangMinimum);
  }, [bahanInScope]);

  // Bahan mendekati kadaluarsa FEFO
  const akanKadaluarsa = useMemo(() => {
    return bahanInScope
      .filter((b) => {
        if (!b.tanggalKadaluarsa) return false;
        const days = daysUntil(b.tanggalKadaluarsa);
        return days <= EXPIRY_WARNING_DAYS;
      })
      .sort((a, b) => (a.tanggalKadaluarsa ?? '').localeCompare(b.tanggalKadaluarsa ?? ''));
  }, [bahanInScope]);

  const gudangFeed = CCTV_FEEDS.find((f) => f.zonaId === 'z1');
  const videoUri = useLocalVideoUri(CCTV_VIDEO_ASSETS[gudangFeed?.videoKey ?? 'freezer']);

  // Modal Filtered Items
  const modalItems = useMemo(() => {
    let baseList: BahanBaku[] = [];
    if (activeModal === 'semua') baseList = bahanInScope;
    if (activeModal === 'menipis') baseList = stokMenipis;
    if (activeModal === 'kadaluarsa') baseList = akanKadaluarsa;

    if (!searchQuery.trim()) return baseList;
    return baseList.filter((b) => b.nama.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeModal, bahanInScope, stokMenipis, akanKadaluarsa, searchQuery]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* 1. Header Banner */}
      <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
        <Feather name="cpu" size={18} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1, fontWeight: '600' }}>
          Smart Storage IoT Controller — pantau & atur suhu ruang pendingin, kendalikan solenoid pintu kulkas freezer, dan pantau stok FEFO real-time.
        </Text>
      </View>

      {/* 2. Interactive IoT Cold Storage Controller */}
      <SectionTitle
        action={
          <Pill
            label={livePulse ? 'LIVE MESH (2.5s)' : 'TELEMETRI AKTIF'}
            tone="success"
            icon="activity"
          />
        }
      >
        Kendali IoT Ruang Pendingin & Freezer
      </SectionTitle>

      {/* Storage Unit Selector Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
        {iotUnits.map((unit) => {
          const isSelected = unit.id === selectedUnitId;
          return (
            <Pressable
              key={unit.id}
              onPress={() => setSelectedUnitId(unit.id)}
              style={[
                styles.unitTab,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather
                name={unit.icon as any}
                size={14}
                color={isSelected ? '#FFF' : colors.text}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: isSelected ? '#FFF' : colors.text,
                }}
              >
                {unit.nama.split(' ')[0]} {unit.nama.split(' ')[1]} ({unit.suhuAktual > 0 ? `+${unit.suhuAktual}` : unit.suhuAktual}°C)
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main Interactive IoT Unit Control Card */}
      <Card style={{ gap: spacing.md, borderColor: colors.primary, borderWidth: 1.5 }}>
        {/* Card Top Title & Status */}
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>
                {activeUnit.nama}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              Kategori: {activeUnit.kategoriLabel} • ID: {activeUnit.id}
            </Text>
          </View>
          <Pill
            label={isSuhuAman ? 'Suhu Sesuai Standar' : 'Waspada Suhu Naik'}
            tone={isSuhuAman ? 'success' : 'danger'}
          />
        </View>

        {/* Temperature & Interactive Setpoint Dial Box */}
        <View style={[styles.tempControlBox, { backgroundColor: colors.background, borderRadius: radius.lg, borderColor: colors.border }]}>
          {/* Actual Temperature */}
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 }}>
              SUHU AKTUAL SENSOR REAL-TIME
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather
                name="thermometer"
                size={28}
                color={activeUnit.suhuAktual <= 0 ? colors.primary : activeUnit.suhuAktual <= 6 ? colors.success : colors.danger}
              />
              <Text
                style={{
                  fontSize: 38,
                  fontWeight: '900',
                  color: activeUnit.suhuAktual <= 0 ? colors.primary : activeUnit.suhuAktual <= 6 ? colors.success : colors.danger,
                }}
              >
                {activeUnit.suhuAktual > 0 ? `+${activeUnit.suhuAktual.toFixed(1)}` : activeUnit.suhuAktual.toFixed(1)}°C
              </Text>
            </View>
            <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
              Batas aman regulasi pangan: {activeUnit.suhuMin}°C s.d. {activeUnit.suhuMax}°C
            </Text>
          </View>

          {/* Interactive Setpoint Stepper */}
          <View style={[styles.setpointRow, { backgroundColor: colors.surface, borderRadius: radius.md, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.textMuted }}>SETPOINT TARGET (KOMPRESOR):</Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: colors.primary }}>
                Target: {activeUnit.suhuTarget > 0 ? `+${activeUnit.suhuTarget.toFixed(1)}` : activeUnit.suhuTarget.toFixed(1)}°C
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable
                onPress={() => handleAdjustTemp(-0.5)}
                style={[styles.tempStepBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Feather name="minus" size={16} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>0.5°C</Text>
              </Pressable>

              <Pressable
                onPress={() => handleAdjustTemp(0.5)}
                style={[styles.tempStepBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primary }}>0.5°C</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Smart Door & Lock Solenoid (Buka / Kunci Kulkas) */}
        <View
          style={[
            styles.doorCard,
            {
              backgroundColor: activeUnit.pintuStatus === 'terkunci' ? colors.successBg : colors.warningBg,
              borderColor: activeUnit.pintuStatus === 'terkunci' ? colors.success : colors.warning,
              borderRadius: radius.md,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={[
                styles.doorIconWrap,
                { backgroundColor: activeUnit.pintuStatus === 'terkunci' ? colors.success : colors.warning },
              ]}
            >
              <Feather
                name={activeUnit.pintuStatus === 'terkunci' ? 'lock' : 'unlock'}
                size={18}
                color="#FFF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: colors.text }}>
                {activeUnit.pintuStatus === 'terkunci'
                  ? 'Pintu Cold Storage: TERKUNCI & TERSEGEL'
                  : 'Pintu Cold Storage: TERBUKA (Sensors Active)'}
              </Text>
              <Text style={{ fontSize: 10.5, color: colors.textMuted }}>
                {activeUnit.pintuStatus === 'terkunci'
                  ? 'Solenoid lock aktif. Suhu terjaga kedap udara.'
                  : 'Peringatan: Segera kunci kembali setelah mengambil bahan makanan.'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleToggleDoor}
            style={[
              styles.doorActionBtn,
              {
                backgroundColor: activeUnit.pintuStatus === 'terkunci' ? colors.primary : colors.success,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Feather
              name={activeUnit.pintuStatus === 'terkunci' ? 'unlock' : 'lock'}
              size={13}
              color="#FFF"
            />
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
              {activeUnit.pintuStatus === 'terkunci' ? 'Buka Kulkas / Unlock' : 'Kunci Pintu'}
            </Text>
          </Pressable>
        </View>

        {/* Mode Pendingin Inverter Controls */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted }}>
            PILIH MODE PENDINGIN KOMPRESOR (INVERTER IoT):
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[
              { mode: 'standar_haccp' as const, label: 'Standar HACCP', icon: 'shield', desc: 'Otomatis' },
              { mode: 'turbo_freeze' as const, label: 'Turbo Chill', icon: 'zap', desc: 'Daya 100%' },
              { mode: 'eco_saving' as const, label: 'Eco Saving', icon: 'activity', desc: 'Hemat Listrik' },
              { mode: 'auto_defrost' as const, label: 'Auto Defrost', icon: 'refresh-cw', desc: 'Cairkan Es' },
            ].map((item) => {
              const isActive = activeUnit.modePendingin === item.mode;
              return (
                <Pressable
                  key={item.mode}
                  onPress={() => handleChangeMode(item.mode)}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.background,
                      borderColor: isActive ? colors.primary : colors.border,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather
                      name={item.icon as any}
                      size={13}
                      color={isActive ? '#FFF' : colors.primary}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isActive ? '#FFF' : colors.text }}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9.5, color: isActive ? 'rgba(255,255,255,0.85)' : colors.textMuted, marginTop: 2 }}>
                    {item.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Auxiliary Controls (Air Curtain & UV Lamp) */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={handleToggleAirCurtain}
            style={[
              styles.auxBtn,
              {
                backgroundColor: activeUnit.airCurtainAktif ? colors.primaryLight : colors.background,
                borderColor: activeUnit.airCurtainAktif ? colors.primary : colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <Feather
              name="wind"
              size={15}
              color={activeUnit.airCurtainAktif ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Air Curtain Pintu</Text>
              <Text style={{ fontSize: 9.5, color: activeUnit.airCurtainAktif ? colors.primary : colors.textMuted, fontWeight: '700' }}>
                {activeUnit.airCurtainAktif ? 'AKTIF (Mencegah Hawa Keluar)' : 'NONAKTIF'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleToggleLampuUv}
            style={[
              styles.auxBtn,
              {
                backgroundColor: activeUnit.lampuUvAktif ? colors.primaryLight : colors.background,
                borderColor: activeUnit.lampuUvAktif ? colors.primary : colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <Feather
              name="sun"
              size={15}
              color={activeUnit.lampuUvAktif ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>Sterilisasi Udara UV-C</Text>
              <Text style={{ fontSize: 9.5, color: activeUnit.lampuUvAktif ? colors.primary : colors.textMuted, fontWeight: '700' }}>
                {activeUnit.lampuUvAktif ? 'LAMPU UV NYALA (Higiene)' : 'NONAKTIF'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Telemetry Sensor Gauges (Humidity, Power, Freon) */}
        <View style={[styles.telemetryGrid, { backgroundColor: colors.background, borderRadius: radius.md }]}>
          <View style={styles.telemetryItem}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>KELEMBABAN</Text>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{activeUnit.kelembaban}% RH</Text>
            <Text style={{ fontSize: 9.5, color: colors.success, fontWeight: '700' }}>Optimal</Text>
          </View>

          <View style={[styles.telemetryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>BEBAN DAYA</Text>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{activeUnit.dayaListrikKw} kW</Text>
            <Text style={{ fontSize: 9.5, color: colors.primary, fontWeight: '700' }}>Inverter Stabil</Text>
          </View>

          <View style={styles.telemetryItem}>
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>TEKANAN FREON</Text>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{activeUnit.tekananFreonPsi} PSI</Text>
            <Text style={{ fontSize: 9.5, color: colors.success, fontWeight: '700' }}>Tekanan Normal</Text>
          </View>
        </View>

        {/* Last IoT Command Log Banner */}
        <View style={[styles.lastCmdBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
          <Feather name="terminal" size={13} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10.5, color: colors.text, fontWeight: '700' }}>
              {activeUnit.lastCommand}
            </Text>
            <Text style={{ fontSize: 9.5, color: colors.textMuted }}>Waktu Eksekusi: {activeUnit.lastCommandTime}</Text>
          </View>
        </View>

        {/* Toast / Feedback Notice */}
        {iotFeedback && (
          <View style={[styles.feedbackToast, { backgroundColor: colors.primary, borderRadius: radius.sm }]}>
            <Feather name="check-circle" size={14} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', flex: 1 }}>{iotFeedback}</Text>
          </View>
        )}
      </Card>

      {/* 3. Kondisi Stok Gudang (Interactive Cards) */}
      <SectionTitle>Kondisi Stok Gudang (Klik Kartu untuk Rincian)</SectionTitle>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {/* Total Bahan Card */}
        <Card onPress={() => setActiveModal('semua')} style={[styles.kpiCard, { borderColor: colors.primary }]}>
          <View style={styles.kpiTopRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>TOTAL BAHAN</Text>
            <Feather name="external-link" size={12} color={colors.primary} />
          </View>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 24 }}>
            {bahanInScope.length}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '700' }}>
            Lihat Semua
          </Text>
        </Card>

        {/* Stok Menipis Card */}
        <Card onPress={() => setActiveModal('menipis')} style={[styles.kpiCard, { borderColor: stokMenipis.length > 0 ? colors.danger : colors.border }]}>
          <View style={styles.kpiTopRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>STOK MENIPIS</Text>
            <Feather name="alert-circle" size={12} color={stokMenipis.length > 0 ? colors.danger : colors.textMuted} />
          </View>
          <Text style={{ color: stokMenipis.length > 0 ? colors.danger : colors.text, fontWeight: '900', fontSize: 24 }}>
            {stokMenipis.length}
          </Text>
          <Text style={{ color: stokMenipis.length > 0 ? colors.danger : colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
            {stokMenipis.length > 0 ? 'Perlu Restok >' : 'Stok Aman'}
          </Text>
        </Card>

        {/* Mau Kadaluarsa Card */}
        <Card onPress={() => setActiveModal('kadaluarsa')} style={[styles.kpiCard, { borderColor: akanKadaluarsa.length > 0 ? colors.warning : colors.border }]}>
          <View style={styles.kpiTopRow}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>FEFO EXP</Text>
            <Feather name="clock" size={12} color={akanKadaluarsa.length > 0 ? colors.warning : colors.textMuted} />
          </View>
          <Text style={{ color: akanKadaluarsa.length > 0 ? colors.warning : colors.text, fontWeight: '900', fontSize: 24 }}>
            {akanKadaluarsa.length}
          </Text>
          <Text style={{ color: akanKadaluarsa.length > 0 ? colors.warning : colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>
            {akanKadaluarsa.length > 0 ? 'Prioritas Olah >' : 'Kadaluarsa Aman'}
          </Text>
        </Card>
      </View>

      {/* 4. Tabbed Monitoring: Stok Kritis vs FEFO Expired */}
      <SectionTitle>Monitoring Stok Kritis & Prioritas FEFO</SectionTitle>
      <Card style={{ gap: spacing.sm, padding: 12 }}>
        {/* Tab Buttons */}
        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: colors.background, padding: 4, borderRadius: radius.md }}>
          <Pressable
            onPress={() => setActiveListTab('stok_kritis')}
            style={[
              styles.listTabBtn,
              {
                backgroundColor: activeListTab === 'stok_kritis' ? (stokMenipis.length > 0 ? colors.danger : colors.primary) : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Feather
              name="alert-octagon"
              size={12}
              color={activeListTab === 'stok_kritis' ? '#FFF' : (stokMenipis.length > 0 ? colors.danger : colors.textMuted)}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: activeListTab === 'stok_kritis' ? '#FFF' : colors.text,
              }}
            >
              Stok Kritis ({stokMenipis.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveListTab('fefo_exp')}
            style={[
              styles.listTabBtn,
              {
                backgroundColor: activeListTab === 'fefo_exp' ? (akanKadaluarsa.length > 0 ? colors.warning : colors.primary) : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Feather
              name="clock"
              size={12}
              color={activeListTab === 'fefo_exp' ? '#FFF' : (akanKadaluarsa.length > 0 ? colors.warning : colors.textMuted)}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: activeListTab === 'fefo_exp' ? '#FFF' : colors.text,
              }}
            >
              FEFO Exp ({akanKadaluarsa.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveListTab('semua_stok')}
            style={[
              styles.listTabBtn,
              {
                backgroundColor: activeListTab === 'semua_stok' ? colors.primary : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
          >
            <Feather
              name="package"
              size={12}
              color={activeListTab === 'semua_stok' ? '#FFF' : colors.textMuted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: activeListTab === 'semua_stok' ? '#FFF' : colors.text,
              }}
            >
              Semua ({bahanInScope.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab Content 1: Stok Kritis */}
        {activeListTab === 'stok_kritis' && (
          <View style={{ gap: 6 }}>
            {stokMenipis.length === 0 ? (
              <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
                <Feather name="check-circle" size={24} color={colors.success} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Seluruh Stok Bahan Aman</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Tidak ada bahan baku yang berada di bawah ambang minimum.</Text>
              </View>
            ) : (
              stokMenipis.map((b) => {
                const selisih = b.ambangMinimum - b.stok;
                return (
                  <View key={b.id} style={[styles.listItemRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                        {b.nama}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Lokasi: {b.lokasiRak ?? 'Gudang Utama'} • {KATEGORI_LABEL[b.kategori]}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.danger }}>
                        {b.stok} {b.satuan}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.danger, fontWeight: '700' }}>
                        (Kurang {selisih > 0 ? selisih : 0} {b.satuan} dari min {b.ambangMinimum})
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Tab Content 2: FEFO Prioritas */}
        {activeListTab === 'fefo_exp' && (
          <View style={{ gap: 6 }}>
            {akanKadaluarsa.length === 0 ? (
              <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
                <Feather name="check-circle" size={24} color={colors.success} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Kedaluwarsa Bahan Aman</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Tidak ada bahan baku mendekati tanggal expired dalam 3 hari ke depan.</Text>
              </View>
            ) : (
              akanKadaluarsa.map((b) => {
                const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : 0;
                const isUrgent = sisaHari <= 1;
                return (
                  <View key={b.id} style={[styles.listItemRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                        {b.nama}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        Stok: {b.stok} {b.satuan} • {b.lokasiRak ?? 'Gudang'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Pill
                        label={sisaHari <= 0 ? 'KADALUARSA HARI INI!' : `${sisaHari} Hari Lagi`}
                        tone={isUrgent ? 'danger' : 'warning'}
                      />
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.text }}>
                        Exp: {b.tanggalKadaluarsa}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Tab Content 3: Semua Stok */}
        {activeListTab === 'semua_stok' && (
          <View style={{ gap: 6 }}>
            {bahanInScope.slice(0, 10).map((b) => {
              const isLow = b.stok <= b.ambangMinimum;
              return (
                <View key={b.id} style={[styles.listItemRow, { backgroundColor: colors.background, borderRadius: radius.sm, borderColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                      {b.nama}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Lokasi: {b.lokasiRak ?? 'Gudang Utama'} • {KATEGORI_LABEL[b.kategori]}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: isLow ? colors.danger : colors.text }}>
                      {b.stok} {b.satuan}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                      Min: {b.ambangMinimum} {b.satuan}
                    </Text>
                  </View>
                </View>
              );
            })}
            {bahanInScope.length > 10 && (
              <PrimaryButton
                label={`Lihat Seluruh ${bahanInScope.length} Bahan (Buka Modal)`}
                variant="outline"
                icon="external-link"
                onPress={() => setActiveModal('semua')}
              />
            )}
          </View>
        )}
      </Card>

      {/* 6. CCTV Area Gudang (With Play/Pause On-Demand Control) */}
      <SectionTitle
        action={
          <Pill
            label={isCctvPlaying ? 'LIVE STREAM' : 'STANDBY'}
            tone={isCctvPlaying ? 'danger' : 'neutral'}
          />
        }
      >
        CCTV Area Gudang
      </SectionTitle>

      {gudangFeed ? (
        <Card style={{ gap: 10, padding: 12 }}>
          {isCctvPlaying ? (
            <View style={{ gap: 8 }}>
              <CctvPlayer videoUri={videoUri} label={gudangFeed.label} height={220} autoPlay={true} />
              <PrimaryButton
                label="Jeda Stream CCTV (Hemat Bandwidth)"
                icon="pause"
                variant="outline"
                onPress={() => setIsCctvPlaying(false)}
              />
            </View>
          ) : (
            <View style={[styles.cctvStandbyBox, { backgroundColor: isDark ? '#000000' : '#1E293B', borderRadius: radius.md }]}>
              <View style={[styles.cctvIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Feather name="video" size={32} color="#FFFFFF" />
              </View>

              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: fontSize.md, textAlign: 'center' }}>
                Kamera CCTV: {gudangFeed.label}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: fontSize.xs, textAlign: 'center', maxWidth: '85%' }}>
                Live streaming dinonaktifkan otomatis demi efisiensi kuota. Ketuk tombol untuk memutar feed.
              </Text>

              <PrimaryButton
                label="Putar Live Feed CCTV Gudang"
                icon="play"
                onPress={() => setIsCctvPlaying(true)}
                style={{ marginTop: 6, minWidth: 220 }}
              />
            </View>
          )}
        </Card>
      ) : (
        <EmptyState icon="video-off" title="Kamera Tidak Tersedia" body="Belum ada feed CCTV untuk area gudang." />
      )}

      {/* 7. MODAL LIST RINCIAN BAHAN */}
      <Modal
        visible={activeModal !== null}
        onClose={() => {
          setActiveModal(null);
          setSearchQuery('');
        }}
        title={
          activeModal === 'semua'
            ? `Seluruh Stok Bahan Baku (${bahanInScope.length})`
            : activeModal === 'menipis'
            ? `Daftar Bahan Stok Menipis (${stokMenipis.length})`
            : `Daftar Bahan FEFO Kadaluarsa (${akanKadaluarsa.length})`
        }
      >
        <View style={{ gap: 10, maxHeight: 450 }}>
          <Input
            icon="search"
            placeholder="Cari nama bahan baku..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearable
          />

          <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            {modalItems.length === 0 ? (
              <EmptyState icon="package" title="Tidak Ditemukan" body="Tidak ada bahan baku yang cocok dengan pencarian." />
            ) : (
              modalItems.map((b) => {
                const isLow = b.stok <= b.ambangMinimum;
                const sisaHari = b.tanggalKadaluarsa ? daysUntil(b.tanggalKadaluarsa) : null;
                const isExpiringSoon = sisaHari !== null && sisaHari <= EXPIRY_WARNING_DAYS;

                return (
                  <View
                    key={b.id}
                    style={[
                      styles.modalItemCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isLow ? colors.danger : isExpiringSoon ? colors.warning : colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {b.fotoBahan ? (
                        <Image source={{ uri: b.fotoBahan }} style={{ width: 44, height: 44, borderRadius: radius.sm }} />
                      ) : (
                        <View style={[styles.modalIconWrap, { backgroundColor: isLow ? colors.dangerBg : colors.primaryLight }]}>
                          <Feather name="package" size={18} color={isLow ? colors.danger : colors.primary} />
                        </View>
                      )}

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>
                          {b.nama}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                          <Pill label={KATEGORI_LABEL[b.kategori]} tone="neutral" />
                          {b.lokasiRak && <Pill label={b.lokasiRak} tone="info" icon="map-pin" />}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: isLow ? colors.danger : colors.text }}>
                          {b.stok} {b.satuan}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>
                          Min: {b.ambangMinimum} {b.satuan}
                        </Text>
                      </View>
                    </View>

                    {b.tanggalKadaluarsa && (
                      <View style={[styles.modalExpBar, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                        <Feather name="calendar" size={12} color={isExpiringSoon ? colors.warning : colors.textMuted} />
                        <Text style={{ fontSize: 11, color: isExpiringSoon ? colors.warning : colors.textMuted, fontWeight: isExpiringSoon ? '800' : '500' }}>
                          Kadaluarsa: {b.tanggalKadaluarsa} ({sisaHari !== null ? (sisaHari <= 0 ? 'Hari Ini!' : `${sisaHari} hari lagi`) : ''})
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <PrimaryButton
            label="Tutup"
            variant="secondary"
            onPress={() => {
              setActiveModal(null);
              setSearchQuery('');
            }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unitTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  listTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tempControlBox: {
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  setpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    gap: 8,
  },
  tempStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  doorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  doorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doorActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeChip: {
    flex: 1,
    minWidth: '47%',
    padding: 10,
    borderWidth: 1,
    gap: 2,
  },
  auxBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderWidth: 1,
  },
  telemetryGrid: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  lastCmdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderWidth: 1,
  },
  feedbackToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  kpiCard: { flex: 1, gap: 4, padding: 12, borderWidth: 1.5 },
  kpiTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 0.5,
  },
  cctvStandbyBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  cctvIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalItemCard: {
    padding: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalExpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
