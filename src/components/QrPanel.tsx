import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface QrPanelProps {
  value: string;
  size?: number;
  caption?: string;
}

// QR selalu digambar hitam di atas putih, termasuk saat dark mode aktif —
// modul QR berwarna tema bikin kontras turun dan kamera pemindai sering gagal
// mengunci pola. Kotak putihnya sekaligus jadi quiet zone.
export default function QrPanel({ value, size = 220, caption }: QrPanelProps) {
  const { colors, radius, fontSize } = useTheme();
  const [failed, setFailed] = useState(false);

  if (failed || !value) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.dangerBg, borderRadius: radius.md, width: size + 32, height: size + 32 }]}>
        <Feather name="alert-triangle" size={22} color={colors.danger} />
        <Text style={{ color: colors.danger, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' }}>
          QR gagal dibuat — data terlalu panjang atau kosong.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={[styles.wrap, { borderRadius: radius.md }]}>
        <QRCode value={value} size={size} ecl="M" quietZone={8} color="#000000" backgroundColor="#FFFFFF" onError={() => setFailed(true)} />
      </View>
      {!!caption && (
        <Text style={{ color: colors.textMuted, fontSize: 10.5, textAlign: 'center', fontWeight: '600' }}>{caption}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
