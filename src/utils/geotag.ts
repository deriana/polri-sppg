import { Alert } from 'react-native';
import * as Location from 'expo-location';

export async function getCurrentGeotag(): Promise<{ lat: number; lng: number } | null> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Izin Ditolak', 'Aktifkan izin lokasi di pengaturan perangkat untuk melanjutkan.');
    return null;
  }

  try {
    const position = await Location.getCurrentPositionAsync({});
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    Alert.alert('Gagal Mengambil Lokasi', 'Tidak dapat membaca lokasi GPS saat ini. Coba lagi.');
    return null;
  }
}
