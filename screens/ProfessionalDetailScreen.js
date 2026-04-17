import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';

export default function ProfessionalDetailScreen({ route, navigation }) {
  const { professional } = route.params || {};

  if (!professional) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>No encontramos al profesional</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const professionalName =
    professional.fullName || professional.name || 'Profesional';

  const latitude =
    typeof professional?.location?.latitude === 'number'
      ? professional.location.latitude
      : typeof professional?.latitude === 'number'
      ? professional.latitude
      : -33.4489;

  const longitude =
    typeof professional?.location?.longitude === 'number'
      ? professional.location.longitude
      : typeof professional?.longitude === 'number'
      ? professional.longitude
      : -70.6693;

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const openMaps = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No pudimos abrir la ubicación.');
    }
  };

    const handleBook = () => {
      navigation.navigate('Booking', { professional });
    };

  const modalitiesText = Array.isArray(professional.modalities) && professional.modalities.length
    ? professional.modalities.join(', ')
    : 'Presencial';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundCircleTop} />
        <View style={styles.backgroundCircleBottom} />

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.topButton} onPress={() => navigation.goBack()}>
            <Text style={styles.topButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Detalle profesional</Text>

          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>♡</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {professionalName.charAt(0)?.toUpperCase() || 'P'}
            </Text>
          </View>

          <Text style={styles.name}>{professionalName}</Text>
          <Text style={styles.specialty}>
            {professional.specialty || 'Especialidad no disponible'}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {professional.isActive === false ? 'Inactivo' : 'Disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Experiencia</Text>
            <Text style={styles.infoValue}>{professional.experience || '5 años'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Modalidad</Text>
            <Text style={styles.infoValue}>{modalitiesText}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Atención</Text>
            <Text style={styles.infoValue}>{professional.attention || 'Particular'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distancia</Text>
            <Text style={styles.infoValue}>Cerca de ti</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sobre este profesional</Text>
          <Text style={styles.sectionText}>
            {professional.description ||
              'Profesional de la salud disponible para atención cercana, con enfoque humano y atención personalizada.'}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <Text style={styles.locationText}>
            {professional.address || 'Ubicación disponible en el mapa'}
          </Text>

          <View style={styles.mapContainer}>
            <MapView style={styles.map} initialRegion={region}>
              <Marker
                coordinate={{ latitude, longitude }}
                title={professionalName}
                description={professional.specialty || 'Especialidad'}
              />
            </MapView>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={openMaps}>
            <Text style={styles.secondaryButtonText}>Abrir en mapas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryOutlineButton} onPress={openMaps}>
            <Text style={styles.secondaryOutlineButtonText}>Cómo llegar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButtonLarge} onPress={handleBook}>
            <Text style={styles.primaryButtonLargeText}>Agendar hora</Text>
          </TouchableOpacity>
        </View>
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
    top: -30,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  backgroundCircleBottom: {
    position: 'absolute',
    bottom: 160,
    left: -60,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topButtonText: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  specialty: {
    marginTop: 6,
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  statusBadgeText: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },
  mapContainer: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#DBEAFE',
    marginBottom: 14,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonLarge: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLargeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryOutlineButton: {
    width: 130,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryOutlineButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
});