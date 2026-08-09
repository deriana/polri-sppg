import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { MasterMenu } from '../types';
import { pickImage } from '../utils/pickImage';

export default function MasterMenuScreen() {
  const { masterMenuList, addMasterMenu, role } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('semua');
  const [selectedMenu, setSelectedMenu] = useState<MasterMenu | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // New Master Menu Form State
  const [nama, setNama] = useState('');
  const [kategoriGizi, setKategoriGizi] = useState('');
  const [fotoMenu, setFotoMenu] = useState<string | null>(null);
  const [kalori, setKalori] = useState('580');
  const [proteinGram, setProteinGram] = useState('28');
  const [karboGram, setKarboGram] = useState('65');
  const [lemakGram, setLemakGram] = useState('18');
  const [porsiGram, setPorsiGram] = useState('380');
  const [deskripsi, setDeskripsi] = useState('');
  const [resep, setResep] = useState('');
  const [bahanUtamaStr, setBahanUtamaStr] = useState('');

  const filteredList = masterMenuList.filter((m) => {
    if (activeTab === 'semua') return true;
    return m.kategoriGizi.toLowerCase().includes(activeTab.toLowerCase());
  });

  const handlePickPhoto = async () => {
    const uri = await pickImage('library');
    if (uri) setFotoMenu(uri);
  };

  const handleSaveNewMenu = () => {
    if (!nama.trim()) {
      alert('Mohon isi Nama Paket Menu Makanan.');
      return;
    }

    addMasterMenu({
      nama: nama.trim(),
      kategoriGizi: kategoriGizi.trim() || 'Karbohidrat + Protein + Sayuran',
      fotoMenu: fotoMenu || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      kalori: Number(kalori) || 550,
      proteinGram: Number(proteinGram) || 25,
      karboGram: Number(karboGram) || 60,
      lemakGram: Number(lemakGram) || 16,
      porsiGram: Number(porsiGram) || 380,
      deskripsi: deskripsi.trim() || 'Menu sehat dan bergizi seimbang standar BGN.',
      resep: resep.trim() || 'Resep terstandar dapur SPPG.',
      bahanUtama: bahanUtamaStr.trim() ? bahanUtamaStr.split(',').map((s) => s.trim()) : ['Daging Ayam', 'Beras', 'Sayuran'],
    });

    setModalVisible(false);
    setNama('');
    setKategoriGizi('');
    setFotoMenu(null);
    setDeskripsi('');
    setResep('');
    setBahanUtamaStr('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        {/* Banner Header */}
        <Card style={{ backgroundColor: colors.primary, gap: spacing.xs }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.textInverse }}>
                Master Katalog Menu & Resep Gizi
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, marginTop: 2 }}>
                Standar AKG (Angka Kecukupan Gizi) Badan Gizi Nasional (BGN)
              </Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Feather name="book-open" size={24} color={colors.textInverse} strokeWidth={iconStrokeWidth} />
            </View>
          </View>

          <View style={[styles.demoBadge, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.sm }]}>
            <Feather name="check-circle" size={12} color="#FDE047" strokeWidth={2} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse }}>
              {masterMenuList.length} Resep Terverifikasi • Standard Target 500-650 kkal/porsi
            </Text>
          </View>
        </Card>

        {/* Action Header */}
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
            Daftar Menu Makanan ({filteredList.length})
          </Text>
          <PrimaryButton
            label="Tambah Menu"
            icon="plus"
            onPress={() => setModalVisible(true)}
            style={{ paddingHorizontal: spacing.md, height: 38 }}
          />
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {[
            { id: 'semua', label: 'Semua' },
            { id: 'ayam', label: 'Daging Ayam' },
            { id: 'sapi', label: 'Daging Sapi' },
            { id: 'ikan', label: 'Fillet Ikan' },
            { id: 'sayur', label: 'Sayuran' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Text style={{ fontSize: fontSize.xs, fontWeight: active ? '700' : '500', color: active ? colors.textInverse : colors.text }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Master Menu List Cards */}
        {filteredList.map((menu) => (
          <Card key={menu.id} style={{ gap: spacing.sm }} onPress={() => setSelectedMenu(menu)}>
            {menu.fotoMenu && (
              <View style={[styles.imageWrapper, { borderRadius: radius.md, overflow: 'hidden' }]}>
                <Image source={{ uri: menu.fotoMenu }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
              </View>
            )}

            <View style={{ gap: 2 }}>
              <Pill tone="primary" label={menu.kategoriGizi} style={{ alignSelf: 'flex-start' }} />
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                {menu.nama}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 }} numberOfLines={2}>
                {menu.deskripsi}
              </Text>
            </View>

            {/* Macro Badges */}
            <View style={[styles.macroRow, { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm }]}>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>⚡ KALORI</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>{menu.kalori} kkal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>🥩 PROTEIN</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{menu.proteinGram}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>🌾 KARBO</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{menu.karboGram}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>🥑 LEMAK</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{menu.lemakGram}g</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Berat Porsi: {menu.porsiGram || 380} gram/siswa</Text>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '800' }}>Buka Resep & Bahan ➔</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Modal Detail Resep & Nutrisi */}
      <Modal visible={!!selectedMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '92%' }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text }}>Detail Resep & Nutrisi</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{selectedMenu?.id}</Text>
              </View>
              <Pressable onPress={() => setSelectedMenu(null)}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            {selectedMenu && (
              <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
                {selectedMenu.fotoMenu && (
                  <Image source={{ uri: selectedMenu.fotoMenu }} style={{ width: '100%', height: 180, borderRadius: radius.md }} resizeMode="cover" />
                )}

                <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>{selectedMenu.nama}</Text>
                <Pill tone="primary" label={selectedMenu.kategoriGizi} style={{ alignSelf: 'flex-start' }} />

                <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 20 }}>{selectedMenu.deskripsi}</Text>

                {/* Macro Nutrition Box */}
                <View style={[styles.macroRow, { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 12 }]}>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>KALORI</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.primary }}>{selectedMenu.kalori} kkal</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.text, fontWeight: '700' }}>PROTEIN</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{selectedMenu.proteinGram} gram</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.text, fontWeight: '700' }}>KARBOHIDRAT</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{selectedMenu.karboGram} gram</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.text, fontWeight: '700' }}>LEMAK</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '800', color: colors.text }}>{selectedMenu.lemakGram} gram</Text>
                  </View>
                </View>

                {/* Bahan Utama */}
                {selectedMenu.bahanUtama && selectedMenu.bahanUtama.length > 0 && (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Bahan Baku & Porsi:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {selectedMenu.bahanUtama.map((b, idx) => (
                        <Pill key={idx} tone="neutral" label={b} />
                      ))}
                    </View>
                  </View>
                )}

                {/* Resep & Langkah Memasak */}
                {selectedMenu.resep && (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Langkah & Resep Memasak Dapur:</Text>
                    <View style={[{ backgroundColor: colors.background, borderRadius: radius.md, padding: 12 }]}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 22 }}>{selectedMenu.resep}</Text>
                    </View>
                  </View>
                )}

                <SecondaryButton label="Tutup Detail" onPress={() => setSelectedMenu(null)} style={{ marginTop: 8 }} />
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>

      {/* Modal Form Tambah Master Menu Baru */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.text }}>Tambah Master Menu Baru</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
              <Input label="Nama Paket Menu Makanan" value={nama} onChangeText={setNama} placeholder="Contoh: Soto Ayam Lamongan & Nasi Putih" />
              <Input label="Kategori Gizi" value={kategoriGizi} onChangeText={setKategoriGizi} placeholder="Contoh: Karbohidrat + Protein Hewani + Sayur" />

              {/* Photo Input */}
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Foto Makanan Menu</Text>
              {fotoMenu ? (
                <View style={{ gap: 4 }}>
                  <Image source={{ uri: fotoMenu }} style={{ width: '100%', height: 140, borderRadius: radius.md }} resizeMode="cover" />
                  <SecondaryButton label="Ganti Foto" onPress={handlePickPhoto} />
                </View>
              ) : (
                <Pressable
                  onPress={handlePickPhoto}
                  style={[styles.uploadBox, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}
                >
                  <Feather name="camera" size={20} color={colors.primary} strokeWidth={iconStrokeWidth} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' }}>
                    + Upload / Ambil Foto Makanan (Kamera/Galeri)
                  </Text>
                </Pressable>
              )}

              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Input label="Kalori (kkal)" value={kalori} onChangeText={setKalori} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Protein (g)" value={proteinGram} onChangeText={setProteinGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Input label="Karbo (g)" value={karboGram} onChangeText={setKarboGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Lemak (g)" value={lemakGram} onChangeText={setLemakGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Porsi (g)" value={porsiGram} onChangeText={setPorsiGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>

              <Input
                label="Bahan Baku Utama (pisahkan dengan koma)"
                value={bahanUtamaStr}
                onChangeText={setBahanUtamaStr}
                placeholder="Contoh: Ayam Segar (100g), Beras (120g), Tauge (40g)"
              />

              <Input
                label="Uraian Deskripsi Paket"
                value={deskripsi}
                onChangeText={setDeskripsi}
                placeholder="Penjelasan ringkas menu..."
                multiline
              />

              <Input
                label="Resep & Panduan Langkah Memasak"
                value={resep}
                onChangeText={setResep}
                placeholder="Tuliskan petunjuk memasak untuk tim dapur..."
                multiline
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <SecondaryButton label="Batal" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Simpan Master Menu" onPress={handleSaveNewMenu} style={{ flex: 1 }} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  imageWrapper: { width: '100%' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  macroItem: { alignItems: 'center', gap: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { maxHeight: '90%', borderRadius: 16, gap: 12, padding: 20 },
  uploadBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderWidth: 1, borderStyle: 'dashed' },
});
