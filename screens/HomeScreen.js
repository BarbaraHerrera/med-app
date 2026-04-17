import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { addToHistory } from '../services/historyService';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  'Psicólogo',
  'Enfermera',
  'Kinesiólogo',
  'Nutricionista',
  'Médico General',
];

const getProfessionalName = (professional) =>
  professional?.fullName || professional?.name || 'Profesional';

export default function HomeScreen({ navigation }) {
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const mapRef = useRef(null);

  const userName =
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split('@')[0] ||
    'Usuario';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterProfessionals(search, selectedCategory);
  }, [search, selectedCategory, professionals]);

  const featuredProfessional = useMemo(() => {
    if (!filteredProfessionals.length) return null;
    return filteredProfessionals[0];
  }, [filteredProfessionals]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([getUserLocation(), loadProfessionals()]);
    } catch (error) {
      console.log('Error inicial:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'No pudimos acceder a tu ubicación. Se mostrará una ubicación por defecto.'
        );
        setUserLocation({
          latitude: -33.4489,
          longitude: -70.6693,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.log('Error al obtener ubicación:', error);
      setUserLocation({
        latitude: -33.4489,
        longitude: -70.6693,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const enrichProfessionalsWithDistance = (items, location) => {
    if (!location) return items;

    return items
      .map((item) => {
        const hasValidLocation =
          item.location &&
          typeof item.location.latitude === 'number' &&
          typeof item.location.longitude === 'number';

        if (!hasValidLocation) {
          return {
            ...item,
            distanceKm: null,
          };
        }

        const distanceKm = getDistanceInKm(
          location.latitude,
          location.longitude,
          item.location.latitude,
          item.location.longitude
        );

        return {
          ...item,
          distanceKm,
        };
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  };

  const loadProfessionals = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'professionals'));

      const data = querySnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      const validData = data.filter(
        (item) =>
          item.location &&
          typeof item.location.latitude === 'number' &&
          typeof item.location.longitude === 'number'
      );

      const sortedData = enrichProfessionalsWithDistance(validData, userLocation);

      setProfessionals(sortedData);
      setFilteredProfessionals(sortedData);
    } catch (error) {
      console.log('Error al cargar profesionales:', error);
      Alert.alert(
        'Error',
        'No pudimos cargar los profesionales. Revisa Firestore y tus permisos.'
      );
    }
  };

  useEffect(() => {
    if (!userLocation || !professionals.length) return;

    const updatedProfessionals = enrichProfessionalsWithDistance(
      professionals,
      userLocation
    );
    setProfessionals(updatedProfessionals);
  }, [userLocation]);

  const filterProfessionals = (text, category) => {
    let result = [...professionals];

    if (text.trim()) {
      const query = text.toLowerCase();
      result = result.filter((item) => {
        const fullName = item.fullName?.toLowerCase() || '';
        const name = item.name?.toLowerCase() || '';
        const specialty = item.specialty?.toLowerCase() || '';

        return (
          fullName.includes(query) ||
          name.includes(query) ||
          specialty.includes(query)
        );
      });
    }

    if (category) {
      result = result.filter(
        (item) => item.specialty?.toLowerCase() === category.toLowerCase()
      );
    }

    if (userLocation) {
      result = [...result].sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      );
    }

    setFilteredProfessionals(result);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'No pudimos cerrar sesión.');
    }
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory((prev) => (prev === category ? '' : category));
  };

  const openProfile = () => {
    navigation.navigate('Profile');
  };

  const openHistory = () => {
    navigation.navigate('History');
  };

  const openAppointments = () => {
    navigation.navigate('PatientAppointments');
  };

  const openProfessionalDetail = async (professional) => {
    try {
      await addToHistory({
        professionalId: professional.id,
        type: 'view',
        title: getProfessionalName(professional),
      });
    } catch (error) {
      console.log('Error guardando historial:', error);
    } finally {
      navigation.navigate('ProfessionalDetail', { professional });
    }
  };

  const centerMapOnProfessional = (professional) => {
    if (!mapRef.current) return;
    if (
      !professional.location ||
      typeof professional.location.latitude !== 'number' ||
      typeof professional.location.longitude !== 'number'
    ) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: professional.location.latitude,
        longitude: professional.location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      800
    );
  };

  const formatDistance = (distanceKm) => {
    if (distanceKm == null) return 'Distancia no disponible';
    if (distanceKm < 1) return `A ${(distanceKm * 1000).toFixed(0)} m de ti`;
    return `A ${distanceKm.toFixed(1)} km de ti`;
  };

  const renderProfessionalCard = (item) => {
    const professionalName = getProfessionalName(item);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.professionalCard}
        activeOpacity={0.9}
        onPress={() => openProfessionalDetail(item)}
      >
        <View style={styles.professionalAvatar}>
          <Text style={styles.professionalAvatarText}>
            {professionalName.charAt(0)?.toUpperCase() || 'P'}
          </Text>
        </View>

        <View style={styles.professionalInfo}>
          <Text style={styles.professionalName}>{professionalName}</Text>
          <Text style={styles.professionalSpecialty}>
            {item.specialty || 'Especialidad no disponible'}
          </Text>

          <View style={styles.professionalMetaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>Disponible</Text>
            </View>
            <Text style={styles.distanceText}>
              {formatDistance(item.distanceKm)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundCircleTop} />
        <View style={styles.backgroundCircleBottom} />

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userName}</Text>
            <Text style={styles.heading}>Encuentra ayuda médica cerca de ti</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={openAppointments}>
              <Text style={styles.iconButtonText}>🕘</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={openHistory}>
              <Text style={styles.iconButtonText}>📋</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={openProfile}>
              <Text style={styles.iconButtonText}>👤</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Text style={styles.iconButtonText}>↩</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o especialidad"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          {!!selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory('')}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {CATEGORIES.map((item) => {
            const active = selectedCategory === item;

            return (
              <TouchableOpacity
                key={item}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => handleCategoryPress(item)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Atención rápida y cercana</Text>
            <Text style={styles.heroSubtitle}>
              Explora profesionales confiables y encuentra la atención que necesitas.
            </Text>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>MedApp</Text>
          </View>
        </View>

        <View style={styles.mapPreviewCard}>
          <View style={styles.mapPreviewHeader}>
            <Text style={styles.sectionTitle}>Mapa de atención</Text>
          </View>

          <View style={styles.realMapContainer}>
            {userLocation ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={userLocation}
                showsUserLocation
                showsMyLocationButton
              >
                {filteredProfessionals.map((prof) => (
                  <Marker
                    key={prof.id}
                    coordinate={{
                      latitude: prof.location.latitude,
                      longitude: prof.location.longitude,
                    }}
                    title={getProfessionalName(prof)}
                    description={`${prof.specialty || 'Especialidad'} • ${formatDistance(
                      prof.distanceKm
                    )}`}
                    onPress={() => centerMapOnProfessional(prof)}
                  />
                ))}
              </MapView>
            ) : (
              <View style={styles.mapLoader}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loaderText}>Cargando mapa...</Text>
              </View>
            )}
          </View>
        </View>

        {featuredProfessional && (
          <View style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>Más cercano</Text>
            <Text style={styles.featuredName}>
              {getProfessionalName(featuredProfessional)}
            </Text>
            <Text style={styles.featuredSpecialty}>
              {featuredProfessional.specialty || 'Especialidad no disponible'}
            </Text>
            <Text style={styles.featuredDistance}>
              {formatDistance(featuredProfessional.distanceKm)}
            </Text>

            <View style={styles.featuredButtonsRow}>
              <TouchableOpacity
                style={styles.featuredGhostButton}
                onPress={() => centerMapOnProfessional(featuredProfessional)}
              >
                <Text style={styles.featuredGhostButtonText}>Ver en mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.featuredButton}
                onPress={() => openProfessionalDetail(featuredProfessional)}
              >
                <Text style={styles.featuredButtonText}>Ver perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profesionales disponibles</Text>
          <Text style={styles.counterText}>
            {filteredProfessionals.length} resultado
            {filteredProfessionals.length === 1 ? '' : 's'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loaderText}>Cargando profesionales...</Text>
          </View>
        ) : filteredProfessionals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No encontramos resultados</Text>
            <Text style={styles.emptySubtitle}>
              Prueba con otra búsqueda o cambia la especialidad seleccionada.
            </Text>
          </View>
        ) : (
          <View style={styles.listWrapper}>
            {filteredProfessionals.map((item) => renderProfessionalCard(item))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 36,
  },
  backgroundCircleTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  backgroundCircleBottom: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  heading: {
    width: width * 0.45,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    width: width * 0.38,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  iconButtonText: {
    fontSize: 18,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  searchInput: {
    height: 50,
    fontSize: 15,
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  categoriesList: {
    paddingBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
  },
  categoryText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  heroCard: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 14,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  mapPreviewCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  mapPreviewHeader: {
    marginBottom: 14,
  },
  realMapContainer: {
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#DBEAFE',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredCard: {
    marginTop: 18,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
  },
  featuredLabel: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuredSpecialty: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 6,
  },
  featuredDistance: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuredButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  featuredGhostButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  featuredGhostButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  featuredButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  featuredButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  counterText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  loaderBox: {
    paddingVertical: 34,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
  listWrapper: {
    marginTop: 2,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  professionalAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  professionalAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  professionalSpecialty: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
  },
  professionalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },
  distanceText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
});