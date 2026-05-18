import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function AppointmentTrackingScreen({ route, navigation }) {
  const { appointmentId } = route.params || {};
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);

  useEffect(() => {
    if (!appointmentId) {
      Alert.alert('Error', 'No se encontró la cita.');
      navigation.goBack();
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'appointments', appointmentId),
      (snapshot) => {
        if (!snapshot.exists()) {
          Alert.alert('Error', 'La cita ya no existe.');
          navigation.goBack();
          return;
        }

        setAppointment({
          id: snapshot.id,
          ...snapshot.data(),
        });
        setLoading(false);
      },
      (error) => {
        console.log('Error leyendo tracking:', error);
        Alert.alert('Error', 'No pudimos cargar el seguimiento.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [appointmentId]);

  const patientLocation = appointment?.patientLocation;
  const professionalLocation = appointment?.professionalCurrentLocation;

  const hasPatientLocation =
    typeof patientLocation?.latitude === 'number' &&
    typeof patientLocation?.longitude === 'number';

  const hasProfessionalLocation =
    typeof professionalLocation?.latitude === 'number' &&
    typeof professionalLocation?.longitude === 'number';

  const coordinates = useMemo(() => {
    const points = [];

    if (hasPatientLocation) {
      points.push({
        latitude: patientLocation.latitude,
        longitude: patientLocation.longitude,
      });
    }

    if (hasProfessionalLocation) {
      points.push({
        latitude: professionalLocation.latitude,
        longitude: professionalLocation.longitude,
      });
    }

    return points;
  }, [appointment]);

  useEffect(() => {
    if (mapRef.current && coordinates.length >= 2) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 90,
          right: 60,
          bottom: 220,
          left: 60,
        },
        animated: true,
      });
    }
  }, [coordinates.length]);

  const getStatusText = () => {
    switch (appointment?.status) {
      case 'confirmed':
        return 'Cita confirmada';
      case 'on_the_way':
        return 'El profesional va en camino';
      case 'arrived':
        return 'El profesional llegó al destino';
      case 'completed':
        return 'Atención completada';
      case 'cancelled':
        return 'Cita cancelada';
      default:
        return 'Esperando actualización';
    }
  };

  const getDistanceKm = () => {
    if (!hasPatientLocation || !hasProfessionalLocation) return null;

    const R = 6371;
    const dLat = toRad(patientLocation.latitude - professionalLocation.latitude);
    const dLon = toRad(patientLocation.longitude - professionalLocation.longitude);

    const lat1 = toRad(professionalLocation.latitude);
    const lat2 = toRad(patientLocation.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const distanceKm = getDistanceKm();

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando seguimiento...</Text>
      </SafeAreaView>
    );
  }

  if (!hasPatientLocation) {
    return (
      <SafeAreaView style={styles.empty}>
        <Ionicons name="location-outline" size={50} color="#94A3B8" />
        <Text style={styles.emptyTitle}>Sin ubicación del paciente</Text>
        <Text style={styles.emptyText}>
          Esta cita no tiene ubicación de destino guardada.
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: patientLocation.latitude,
          longitude: patientLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        <Marker
          coordinate={{
            latitude: patientLocation.latitude,
            longitude: patientLocation.longitude,
          }}
          title="Destino del paciente"
          description={appointment?.patientName || 'Paciente'}
          pinColor="#2563EB"
        />

        {hasProfessionalLocation && (
          <Marker
            coordinate={{
              latitude: professionalLocation.latitude,
              longitude: professionalLocation.longitude,
            }}
            title="Profesional"
            description={appointment?.professionalName || 'Profesional en camino'}
            pinColor="#16A34A"
          />
        )}

        {coordinates.length >= 2 && (
          <Polyline
            coordinates={coordinates}
            strokeWidth={5}
            strokeColor="#2563EB"
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.bottomCard}>
        <View style={styles.drag} />

        <Text style={styles.title}>{getStatusText()}</Text>

        <Text style={styles.subtitle}>
          {appointment?.professionalName || 'El profesional'} está vinculado a esta atención.
        </Text>

        {hasProfessionalLocation ? (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color="#2563EB" />
              <Text style={styles.infoText}>
                Distancia aproximada:{' '}
                {distanceKm !== null
                  ? distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`
                  : 'calculando...'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#2563EB" />
              <Text style={styles.infoText}>
                Actualización en vivo desde Firestore
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.waitingBox}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.waitingText}>
              Esperando que el profesional inicie la ruta...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 21,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  drag: {
    width: 48,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  infoRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  waitingBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 16,
    gap: 10,
  },
  waitingText: {
    flex: 1,
    color: '#2563EB',
    fontWeight: '800',
  },
});