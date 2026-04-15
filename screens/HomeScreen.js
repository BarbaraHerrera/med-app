// screens/HomeScreen.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [professionals, setProfessionals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = useMemo(
    () => ['Todos', 'Psicólogo', 'Enfermera', 'Kinesiólogo'],
    []
  );

  const [region] = useState({
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    applyFilters(search, selectedCategory, professionals);
  }, [search, selectedCategory, professionals]);

  const loadProfessionals = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'professionals'));
      const list = [];

      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data(),
        });
      });

      setProfessionals(list);
      setFiltered(list);
    } catch (error) {
      console.log('Error cargando profesionales:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (text, category, sourceList = professionals) => {
    const q = (text || '').toLowerCase().trim();

    const result = sourceList.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const specialty = (item.specialty || '').toLowerCase();
      const city = (item.city || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        specialty.includes(q) ||
        city.includes(q);

      const matchesCategory =
        category === 'Todos' ||
        specialty.includes(category.toLowerCase());

      return matchesSearch && matchesCategory;
    });

    setFiltered(result);
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Error cerrando sesión:', error);
    }
  };

  const renderChip = (item) => {
    const active = selectedCategory === item;

    return (
      <TouchableOpacity
        key={item}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setSelectedCategory(item)}
        activeOpacity={0.9}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProfessional = ({ item }) => (
    <TouchableOpacity style={styles.simpleCard} activeOpacity={0.9}>
      <View style={styles.simpleAvatar}>
        <Text style={styles.simpleAvatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : 'P'}
        </Text>
      </View>

      <View style={styles.simpleInfo}>
        <Text style={styles.simpleName}>
          {item.name || 'Profesional'}
        </Text>
        <Text style={styles.simpleSpecialty}>
          {item.specialty || 'Especialidad'}
        </Text>
        <Text style={styles.simpleCity}>
          {item.city || 'Santiago'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#A3AAB7" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3558D4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuVisible(false)}
          />

          <View style={styles.menuWrapper}>
            <Pressable style={styles.menuPanel}>
              <View style={styles.menuHeader}>
                <View style={styles.menuHeaderIcon}>
                  <Ionicons name="person" size={20} color="#6B7BFF" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.menuHeaderTitle}>Tu cuenta</Text>
                  <Text style={styles.menuHeaderSubtitle}>
                    Gestiona tus opciones y accesos
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Profile');
                }}
              >
                <View style={styles.menuIconSoft}>
                  <Ionicons name="person-outline" size={18} color="#7B8494" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuItemTitle}>Mi perfil</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Tus datos y tu cuenta
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A3AAB7" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconPink}>
                  <Ionicons name="heart-outline" size={18} color="#D966A5" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuItemTitle}>Favoritos</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Profesionales guardados
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A3AAB7" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconGray}>
                  <Ionicons name="settings-outline" size={18} color="#7B8494" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuItemTitle}>Configuración</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Preferencias de la app
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A3AAB7" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconGreen}>
                  <Ionicons name="help-circle-outline" size={18} color="#52B788" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuItemTitle}>Ayuda</Text>
                  <Text style={styles.menuItemSubtitle}>
                    Soporte y preguntas frecuentes
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A3AAB7" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.9}
              >
                <View style={styles.logoutIcon}>
                  <Ionicons name="log-out-outline" size={18} color="#D95F59" />
                </View>
                <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerSpacer} />

        <Text style={styles.headerTitle}>MedApp</Text>

        <TouchableOpacity
          style={styles.headerMenuButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="grid-outline" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9AA3AF" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar profesional..."
          placeholderTextColor="#9AA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView style={styles.map} region={region}>
          {filtered.map((item) => {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: lat, longitude: lng }}
                title={item.name || 'Profesional'}
                description={item.specialty || 'Especialidad'}
              />
            );
          })}
        </MapView>
      </View>

      <View style={styles.chipsWrapper}>
        {categories.map(renderChip)}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Profesionales cercanos</Text>
        <Text style={styles.listHeaderSubtitle}>
          {filtered.length} disponible{filtered.length === 1 ? '' : 's'}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderProfessional}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={34} color="#9AA3AF" />
            <Text style={styles.emptyTitle}>No encontramos resultados</Text>
            <Text style={styles.emptySubtitle}>
              Intenta con otro nombre o especialidad.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 8,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSpacer: {
    width: 36,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  headerMenuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#172033',
    fontSize: 14,
  },

  mapContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    height: 165,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },

  map: {
    flex: 1,
  },

  chipsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },

  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginRight: 10,
  },

  chipActive: {
    backgroundColor: '#3558D4',
  },

  chipText: {
    color: '#4A5160',
    fontSize: 13,
    fontWeight: '700',
  },

  chipTextActive: {
    color: '#FFFFFF',
  },

  listHeader: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },

  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
  },

  listHeaderSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#8A94A6',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  simpleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  simpleAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3558D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  simpleAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  simpleInfo: {
    flex: 1,
  },

  simpleName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172033',
    marginBottom: 3,
  },

  simpleSpecialty: {
    fontSize: 13,
    color: '#5F6878',
    marginBottom: 2,
  },

  simpleCity: {
    fontSize: 12,
    color: '#8A94A6',
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
  },

  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#8A94A6',
    textAlign: 'center',
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  menuWrapper: {
    paddingTop: 108,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },

  menuPanel: {
    width: 285,
    backgroundColor: '#F8F7FA',
    borderRadius: 28,
    padding: 14,
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 14,
  },

  menuHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EBF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  menuHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172033',
  },

  menuHeaderSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A94A6',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
  },

  menuTextWrap: {
    flex: 1,
    marginLeft: 12,
  },

  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  menuItemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A94A6',
  },

  menuIconSoft: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF1F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIconPink: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FBEAF4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIconGray: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F2F4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIconGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#E7E8ED',
    marginVertical: 8,
    marginHorizontal: 6,
  },

  logoutBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FCEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  logoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  logoutBtnText: {
    color: '#C94E46',
    fontSize: 16,
    fontWeight: '800',
  },
});