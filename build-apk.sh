#!/usr/bin/env bash
set -e

echo "=== Memulai Build APK SIGAP SPPG ==="

# 1. Pastikan ANDROID_HOME terkonfigurasi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"

if [ ! -d "$ANDROID_HOME" ]; then
  echo "Error: Android SDK tidak ditemukan di $ANDROID_HOME"
  exit 1
fi

# 2. Re-generate aset native Android (Ikon, nama paket, dll.)
echo "Meng-generate proyek native Android..."
npx expo prebuild --platform android

# 3. Bersihkan aset release lama dan jalankan Gradle assembleRelease
echo "Membersihkan cache aset bundle release..."
rm -rf android/app/build/generated/res/createBundleReleaseJsAndAssets android/app/build/intermediates/merged_res/release

echo "Kompilasi biner APK dengan Gradle..."
cd android
./gradlew assembleRelease
cd ..

# 4. Salin APK ke root proyek
OUTPUT_APK="android/app/build/outputs/apk/release/app-release.apk"
TARGET_APK="sigap-sppg.apk"

if [ -f "$OUTPUT_APK" ]; then
  cp "$OUTPUT_APK" "$TARGET_APK"
  echo "BUILD BERHASIL!"
  echo "File APK tersimpan di: $(pwd)/$TARGET_APK"
else
  echo "Error: File APK tidak ditemukan di $OUTPUT_APK"
  exit 1
fi
