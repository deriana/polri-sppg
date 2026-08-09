import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Izin Ditolak', 'Aktifkan izin kamera/galeri di pengaturan perangkat untuk melanjutkan.');
    return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

// Sibling of pickImage that additionally supports video capture — kept separate so
// every existing pickImage() call site stays untouched (photo-only, same return shape).
export async function pickMedia(
  source: 'camera' | 'library',
  mediaTypes: ('images' | 'videos')[] = ['images'],
): Promise<{ uri: string; mediaType: 'image' | 'video' } | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Izin Ditolak', 'Aktifkan izin kamera/galeri di pengaturan perangkat untuk melanjutkan.');
    return null;
  }

  const options = { quality: 0.7, mediaTypes, videoMaxDuration: 60 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, mediaType: asset.type === 'video' ? 'video' : 'image' };
}
