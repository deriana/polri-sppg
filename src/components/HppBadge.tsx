import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { HppInfo, formatRp, hppTone } from '../utils/hpp';

interface HppBadgeProps {
  info: HppInfo;
  /** 'chip' untuk di dalam kartu daftar, 'block' untuk panel detail. */
  variant?: 'chip' | 'block';
}

// Penanda HPP (Harga Pokok Produksi) per porsi yang dipakai di semua layar
// bertema menu. Diketuk = rincian pembentuk angkanya terbuka di tempat.
// Rincian sengaja dibuka inline, bukan lewat Modal, karena badge ini sering
// dipakai di dalam modal detail — modal bersarang bermasalah di Android.
export default function HppBadge({ info, variant = 'chip' }: HppBadgeProps) {
  const { colors, fontSize, radius, iconStrokeWidth } = useTheme();
  const [terbuka, setTerbuka] = useState(false);

  const tone = hppTone(info);
  const fg = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.success;
  const bg = tone === 'danger' ? colors.dangerBg : tone === 'warning' ? colors.warningBg : colors.successBg;

  const selisihText =
    info.selisihPct >= 0 ? `${info.selisihPct}% di bawah pagu` : `${Math.abs(info.selisihPct)}% di atas pagu`;

  const rincian = (
    <View style={[styles.rincian, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
      <Text style={{ fontSize: 10, fontWeight: '900', color: colors.text, letterSpacing: 0.3 }}>
        ISI DARI {formatRp(info.nilai)} PER PORSI
      </Text>

      {/* Bar proporsi tiap komponen */}
      <View style={[styles.bar, { backgroundColor: colors.border, borderRadius: 4 }]}>
        {info.rincian.map((k, idx) => (
          <View
            key={k.label}
            style={{
              width: `${k.pct}%`,
              backgroundColor: [colors.primary, colors.gold, colors.info, colors.success, colors.problem][idx % 5],
            }}
          />
        ))}
      </View>

      {info.rincian.map((k, idx) => (
        <View key={k.label} style={styles.komponenRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: [colors.primary, colors.gold, colors.info, colors.success, colors.problem][idx % 5] },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>{k.label}</Text>
            <Text style={{ fontSize: 9.5, color: colors.textMuted }}>{k.keterangan}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.text }}>{formatRp(k.nilai)}</Text>
            <Text style={{ fontSize: 9.5, color: colors.textMuted }}>{k.pct}%</Text>
          </View>
        </View>
      ))}

      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: colors.text, flex: 1 }}>TOTAL HPP / PORSI</Text>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: fg }}>{formatRp(info.nilai)}</Text>
      </View>

      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={{ fontSize: 10.5, color: colors.textMuted, flex: 1 }}>Pagu standar BGN</Text>
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted }}>{formatRp(info.pagu)}</Text>
      </View>

      <View style={[styles.sisaBox, { backgroundColor: bg, borderRadius: radius.sm }]}>
        <Feather
          name={info.selisihPct >= 0 ? 'trending-down' : 'trending-up'}
          size={12}
          color={fg}
          strokeWidth={iconStrokeWidth}
        />
        <Text style={{ fontSize: 10.5, fontWeight: '800', color: fg, flex: 1 }}>
          {info.selisihPct >= 0
            ? `Hemat ${formatRp(info.pagu - info.nilai)} per porsi (${selisihText})`
            : `Lebih ${formatRp(info.nilai - info.pagu)} per porsi dari pagu (${selisihText})`}
        </Text>
      </View>

      {info.perkiraan ? (
        <Text style={{ fontSize: 9.5, color: colors.warning, fontWeight: '700' }}>
          Angka perkiraan — menu ini belum terdaftar di Master Katalog, jadi dipakai biaya rata-rata unit. Daftarkan
          menunya di Master Katalog agar HPP-nya akurat.
        </Text>
      ) : (
        <Text style={{ fontSize: 9.5, color: colors.textMuted }}>
          Sumber: Master Katalog — {info.sumber}. Komponen selain bahan baku memakai struktur biaya per porsi unit ini.
        </Text>
      )}
    </View>
  );

  if (variant === 'chip') {
    return (
      <View style={{ gap: 6 }}>
        <Pressable
          onPress={() => setTerbuka((v) => !v)}
          style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderRadius: radius.pill }, pressed && { opacity: 0.75 }]}
        >
          <Feather name="tag" size={11} color={fg} strokeWidth={iconStrokeWidth} />
          <Text style={{ color: fg, fontSize: 10.5, fontWeight: '900' }}>
            HPP {info.perkiraan ? '±' : ''}
            {formatRp(info.nilai)}/porsi
          </Text>
          <Feather name={terbuka ? 'chevron-up' : 'chevron-down'} size={11} color={fg} strokeWidth={iconStrokeWidth} />
        </Pressable>
        {terbuka && rincian}
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => setTerbuka((v) => !v)}
        style={({ pressed }) => [styles.block, { backgroundColor: bg, borderRadius: radius.md }, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.blockRow}>
          <Feather name="tag" size={14} color={fg} strokeWidth={iconStrokeWidth} />
          <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '800', flex: 1 }}>
            HPP — HARGA POKOK PRODUKSI PER PORSI
          </Text>
          <Text style={{ color: fg, fontSize: 9.5, fontWeight: '900' }}>{selisihText}</Text>
        </View>

        <Text style={{ color: fg, fontSize: fontSize.lg, fontWeight: '900' }}>
          {info.perkiraan ? '± ' : ''}
          {formatRp(info.nilai)}
        </Text>

        <View style={styles.blockRow}>
          <Text style={{ color: colors.textMuted, fontSize: 10.5, flex: 1 }}>
            Pagu standar BGN {formatRp(info.pagu)}/porsi
          </Text>
          <Feather name={terbuka ? 'chevron-up' : 'chevron-down'} size={13} color={fg} strokeWidth={iconStrokeWidth} />
          <Text style={{ color: fg, fontSize: 10, fontWeight: '800' }}>
            {terbuka ? 'Tutup rincian' : 'Lihat rincian'}
          </Text>
        </View>
      </Pressable>
      {terbuka && rincian}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  block: { padding: 10, gap: 3 },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rincian: { padding: 10, borderWidth: 1, gap: 8 },
  bar: { flexDirection: 'row', height: 8, overflow: 'hidden' },
  komponenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingTop: 6 },
  sisaBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
});
