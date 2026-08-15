import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card, EmptyState, Input, Pill, PrimaryButton, SecondaryButton, SectionTitle } from '../components/ui';
import { MasterMenu } from '../types';
import { pickImage } from '../utils/pickImage';

export default function MasterMenuScreen() {
  const { masterMenuList, addMasterMenu, updateMasterMenu, deleteMasterMenu, role } = useApp();
  const { colors, fontSize, iconStrokeWidth, radius, spacing, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('semua');
  const [selectedMenu, setSelectedMenu] = useState<MasterMenu | null>(null);
  
  // Modal states
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
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
    const matchSearch =
      m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.kategoriGizi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchSearch) return false;
    if (activeTab === 'semua') return true;
    return m.kategoriGizi.toLowerCase().includes(activeTab.toLowerCase());
  });

  const handlePickPhoto = async () => {
    const uri = await pickImage('library');
    if (uri) setFotoMenu(uri);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setNama('');
    setKategoriGizi('Karbohidrat + Protein Hewani + Sayuran + Buah');
    setFotoMenu(null);
    setKalori('580');
    setProteinGram('28');
    setKarboGram('65');
    setLemakGram('18');
    setPorsiGram('380');
    setDeskripsi('');
    setResep('');
    setBahanUtamaStr('');
    setFormModalVisible(true);
  };

  const openEditModal = (menu: MasterMenu) => {
    setIsEditing(true);
    setEditingId(menu.id);
    setNama(menu.nama);
    setKategoriGizi(menu.kategoriGizi);
    setFotoMenu(menu.fotoMenu);
    setKalori(String(menu.kalori));
    setProteinGram(String(menu.proteinGram));
    setKarboGram(String(menu.karboGram));
    setLemakGram(String(menu.lemakGram));
    setPorsiGram(String(menu.porsiGram || 380));
    setDeskripsi(menu.deskripsi);
    setResep(menu.resep || '');
    setBahanUtamaStr(menu.bahanUtama ? menu.bahanUtama.join(', ') : '');
    setSelectedMenu(null);
    setFormModalVisible(true);
  };

  const handleSaveMenu = () => {
    if (!nama.trim()) {
      Alert.alert('Perhatian', 'Mohon isi Nama Paket Menu Makanan.');
      return;
    }

    const payload = {
      nama: nama.trim(),
      kategoriGizi: kategoriGizi.trim() || 'Karbohidrat + Protein + Sayuran',
      fotoMenu: fotoMenu || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      kalori: Number(kalori) || 550,
      proteinGram: Number(proteinGram) || 25,
      karboGram: Number(karboGram) || 60,
      lemakGram: Number(lemakGram) || 16,
      porsiGram: Number(porsiGram) || 380,
      deskripsi: deskripsi.trim() || 'Menu sehat dan bergizi seimbang standar BGN.',
      resep: resep.trim() || 'Resep terstandar koki SPPG.',
      bahanUtama: bahanUtamaStr.trim()
        ? bahanUtamaStr.split(',').map((s) => s.trim())
        : ['Daging Ayam / Telur', 'Beras Pulen', 'Sayuran Segar'],
    };

    if (isEditing && editingId) {
      updateMasterMenu({ ...payload, id: editingId });
      Alert.alert('Sukses', `Menu "${nama}" berhasil diperbarui.`);
    } else {
      addMasterMenu(payload);
      Alert.alert('Sukses', `Menu baru "${nama}" berhasil ditambahkan ke katalog.`);
    }

    setFormModalVisible(false);
  };

  const handleDelete = (menu: MasterMenu) => {
    Alert.alert(
      'Hapus Menu',
      `Yakin ingin menghapus menu "${menu.nama}" dari katalog?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteMasterMenu(menu.id);
            setSelectedMenu(null);
          },
        },
      ],
    );
  };

  const canManage = role === 'AHLI_GIZI' || role === 'CHEF_UTAMA' || role === 'KEPALA_SPPG';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 64 }}>
        {/* Banner Header */}
        <Card style={{ backgroundColor: colors.primary, gap: spacing.xs, borderRadius: radius.xl }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.textInverse }}>
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
              {masterMenuList.length} Resep Terdaftar • Standar Target 500–650 kkal / porsi
            </Text>
          </View>
        </Card>

        {/* Search & Add Action Header */}
        <View style={{ gap: spacing.xs }}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari nama menu, lauk, nutrisi..."
          />

          <View style={styles.rowBetween}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text }}>
              Katalog Menu ({filteredList.length})
            </Text>
            {canManage && (
              <PrimaryButton
                label="+ Tambah Menu Baru"
                icon="plus"
                onPress={openAddModal}
                style={{ paddingHorizontal: spacing.md, height: 38 }}
              />
            )}
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {[
            { id: 'semua', label: 'Semua' },
            { id: 'ayam', label: '🍗 Daging Ayam' },
            { id: 'sapi', label: '🥩 Daging Sapi' },
            { id: 'ikan', label: '🐟 Fillet Ikan' },
            { id: 'sayur', label: '🥦 Sayuran' },
            { id: 'telur', label: '🥚 Telur' },
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
                <Text style={{ fontSize: fontSize.xs, fontWeight: active ? '800' : '600', color: active ? colors.textInverse : colors.text }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Empty Search State */}
        {filteredList.length === 0 && (
          <EmptyState
            icon="search"
            title="Menu Tidak Ditemukan"
            body="Coba kata kunci lain atau tambahkan menu baru ke katalog."
            actionLabel={canManage ? "+ Tambah Menu" : undefined}
            onAction={canManage ? openAddModal : undefined}
          />
        )}

        {/* Master Menu List Cards */}
        {filteredList.map((menu) => (
          <Card
            key={menu.id}
            style={{ gap: spacing.sm, borderRadius: radius.xl, borderColor: colors.border }}
            onPress={() => setSelectedMenu(menu)}
          >
            {menu.fotoMenu && (
              <View style={[styles.imageWrapper, { borderRadius: radius.md, overflow: 'hidden' }]}>
                <Image source={{ uri: menu.fotoMenu }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
              </View>
            )}

            <View style={{ gap: 4 }}>
              <View style={styles.rowBetween}>
                <Pill tone="primary" label={menu.kategoriGizi} style={{ alignSelf: 'flex-start' }} />
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.textMuted }}>
                  {menu.id}
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                {menu.nama}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 }} numberOfLines={2}>
                {menu.deskripsi}
              </Text>
            </View>

            {/* Macro Badges */}
            <View style={[styles.macroRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.background, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border }]}>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '700' }}>KALORI</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.primary }}>{menu.kalori} kkal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '700' }}>PROTEIN</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>{menu.proteinGram}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '700' }}>KARBO</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>{menu.karboGram}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '700' }}>LEMAK</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }}>{menu.lemakGram}g</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Porsi: {menu.porsiGram || 380} gram / siswa</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {canManage && (
                  <Pressable
                    onPress={() => openEditModal(menu)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }}
                  >
                    <Feather name="edit-2" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Ubah</Text>
                  </Pressable>
                )}
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '800' }}>Detail Resep ➔</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* MODAL DETAIL RESEP & NUTRISI */}
      <Modal visible={!!selectedMenu} animationType="slide" transparent onRequestClose={() => setSelectedMenu(null)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '92%', borderRadius: radius.xl }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.text }}>Detail Resep & Nutrisi</Text>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{selectedMenu?.id} • Standar BGN</Text>
              </View>
              <Pressable onPress={() => setSelectedMenu(null)} hitSlop={8}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            {selectedMenu && (
              <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }} showsVerticalScrollIndicator={false}>
                {selectedMenu.fotoMenu && (
                  <Image source={{ uri: selectedMenu.fotoMenu }} style={{ width: '100%', height: 180, borderRadius: radius.md }} resizeMode="cover" />
                )}

                <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>{selectedMenu.nama}</Text>
                <Pill tone="primary" label={selectedMenu.kategoriGizi} style={{ alignSelf: 'flex-start' }} />

                <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 20 }}>{selectedMenu.deskripsi}</Text>

                {/* Macro Nutrition Box */}
                <View style={[styles.macroRow, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.primary }]}>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800' }}>KALORI</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.primary }}>{selectedMenu.kalori} kkal</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.text, fontWeight: '700' }}>PROTEIN</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>{selectedMenu.proteinGram} gram</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.text, fontWeight: '700' }}>KARBOHIDRAT</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>{selectedMenu.karboGram} gram</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={{ fontSize: 10, color: colors.text, fontWeight: '700' }}>LEMAK</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '900', color: colors.text }}>{selectedMenu.lemakGram} gram</Text>
                  </View>
                </View>

                {/* Bahan Utama */}
                {selectedMenu.bahanUtama && selectedMenu.bahanUtama.length > 0 && (
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>Bahan Baku & Takaran:</Text>
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
                    <View style={[{ backgroundColor: colors.background, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border }]}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.text, lineHeight: 22 }}>{selectedMenu.resep}</Text>
                    </View>
                  </View>
                )}

                {/* Action Controls for Ahli Gizi / Chef */}
                {canManage && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <PrimaryButton
                      label="Ubah Kandungan Gizi / Resep"
                      icon="edit-2"
                      onPress={() => openEditModal(selectedMenu)}
                      style={{ flex: 1 }}
                    />
                    <SecondaryButton
                      label="Hapus"
                      icon="trash-2"
                      onPress={() => handleDelete(selectedMenu)}
                    />
                  </View>
                )}

                <SecondaryButton label="Tutup Detail" onPress={() => setSelectedMenu(null)} style={{ marginTop: 4 }} />
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>

      {/* MODAL FORM TAMBAH / UBAH MASTER MENU */}
      <Modal visible={formModalVisible} animationType="slide" transparent onRequestClose={() => setFormModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '92%', borderRadius: radius.xl }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '900', color: colors.text }}>
                  {isEditing ? 'Ubah Menu & Gizi' : 'Tambah Master Menu Baru'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  {isEditing ? `Edit data ${editingId}` : 'Formulir Resep Terstandarisasi BGN'}
                </Text>
              </View>
              <Pressable onPress={() => setFormModalVisible(false)} hitSlop={8}>
                <Feather name="x" size={22} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }} showsVerticalScrollIndicator={false}>
              <Input
                label="Nama Paket Menu Makanan"
                value={nama}
                onChangeText={setNama}
                placeholder="Contoh: Soto Ayam Lamongan & Nasi Putih"
              />
              <Input
                label="Kategori Gizi"
                value={kategoriGizi}
                onChangeText={setKategoriGizi}
                placeholder="Contoh: Karbohidrat + Protein Hewani + Sayur"
              />

              {/* Photo Input */}
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>Foto Menu Makanan</Text>
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
                    + Upload / Ambil Foto Menu Makanan
                  </Text>
                </Pressable>
              )}

              <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                Target Angka Kecukupan Gizi (AKG per Porsi):
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Input label="Kalori (kkal)" value={kalori} onChangeText={setKalori} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Protein (g)" value={proteinGram} onChangeText={setProteinGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Input label="Karbohidrat (g)" value={karboGram} onChangeText={setKarboGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Lemak (g)" value={lemakGram} onChangeText={setLemakGram} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>

              <Input
                label="Estimasi Berat Porsi (gram/porsi)"
                value={porsiGram}
                onChangeText={setPorsiGram}
                keyboardType="numeric"
                placeholder="380"
              />

              <Input
                label="Bahan Baku Utama (pisahkan dengan koma)"
                value={bahanUtamaStr}
                onChangeText={setBahanUtamaStr}
                placeholder="Contoh: Daging Ayam (100g), Beras (120g), Bayam (50g)"
                multiline
              />

              <Input
                label="Langkah & Resep Memasak Dapur"
                value={resep}
                onChangeText={setResep}
                placeholder="Tuliskan petunjuk memasak, titik matang, atau bumbu..."
                multiline
              />

              <Input
                label="Deskripsi Menu Singkat"
                value={deskripsi}
                onChangeText={setDeskripsi}
                placeholder="Deskripsi singkat nutrisi dan cita rasa menu..."
                multiline
              />

              <View style={{ gap: spacing.xs, marginTop: 8 }}>
                <PrimaryButton
                  label={isEditing ? "Simpan Perubahan Menu" : "Simpan Menu ke Katalog"}
                  icon="check"
                  onPress={handleSaveMenu}
                />
                <SecondaryButton label="Batal" onPress={() => setFormModalVisible(false)} />
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  tabChip: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  imageWrapper: { width: '100%', height: 160 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroItem: { alignItems: 'center', gap: 2 },
  uploadBox: { height: 75, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 480, padding: 18 },
});
