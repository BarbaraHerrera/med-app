import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../firebaseConfig';

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

export default function PatientAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setAppointments(list);

        if (selectedAppointment) {
          const updatedSelected = list.find(
            (item) => item.id === selectedAppointment.id
          );

          if (updatedSelected) {
            setSelectedAppointment(updatedSelected);
          }
        }

        setLoading(false);
      },
      (error) => {
        console.log('Error cargando citas del paciente:', error);
        Alert.alert('Error', 'No pudimos cargar tus citas.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedAppointment?.id]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return 'Pendiente';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return styles.confirmedBadge;
      case 'pending':
        return styles.pendingBadge;
      case 'cancelled':
        return styles.cancelledBadge;
      case 'completed':
        return styles.completedBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const hasLiveLocation = (appointment) => {
    const latitude = appointment?.liveLocation?.latitude;
    const longitude = appointment?.liveLocation?.longitude;

    return (
      appointment?.trackingEnabled === true &&
      appointment?.trackingStatus === 'active' &&
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude)
    );
  };

  const renderAppointment = ({ item }) => {
    const liveAvailable = hasLiveLocation(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {item.professionalName || 'Profesional'}
            </Text>

            <Text style={styles.specialty}>
              {item.specialty || 'Especialidad no disponible'}
            </Text>
          </View>

          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>📅 Fecha:</Text>
          <Text style={styles.value}>{item.date || 'Sin fecha'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🕐 Hora:</Text>
          <Text style={styles.value}>{item.time || 'Sin hora'}</Text>
        </View>

        {!!item.reason && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>📝 Motivo:</Text>
            <Text style={styles.value}>{item.reason}</Text>
          </View>
        )}

        {item.trackingEnabled && (
          <View style={styles.trackingInfo}>
            <Ionicons name="location" size={16} color="#16A34A" />
            <Text style={styles.trackingInfoText}>
              {liveAvailable
                ? 'Seguimiento en vivo disponible'
                : 'Seguimiento activado, esperando ubicación del profesional'}
            </Text>
          </View>
        )}

        {liveAvailable && (
          <TouchableOpacity
            style={styles.liveButton}
            onPress={() => setSelectedAppointment(item)}
          >
            <Ionicons name="map-outline" size={18} color="#FFFFFF" />
            <Text style={styles.liveButtonText}>
              Ver ubicación en vivo
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLiveMap = () => {
    if (!selectedAppointment) return null;

    const latitude = selectedAppointment?.liveLocation?.latitude;
    const longitude = selectedAppointment?.liveLocation?.longitude;

    const liveAvailable = hasLiveLocation(selectedAppointment);

    return (
      <View style={styles.liveMapOverlay}>
        <SafeAreaView style={styles.liveMapContainer}>
          <View style={styles.liveMapHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveMapTitle}>
                Ubicación en vivo
              </Text>

              <Text style={styles.liveMapSubtitle}>
                {selectedAppointment.professionalName || 'Profesional'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedAppointment(null)}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {liveAvailable ? (
            <MapView
              style={styles.liveMap}
              region={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude,
                  longitude,
                }}
                title={
                  selectedAppointment.professionalName || 'Profesional'
                }
                description="Ubicación actual del profesional"
              />
            </MapView>
          ) : (
            <View style={styles.noLiveContainer}>
              <Ionicons name="location-outline" size={50} color="#9CA3AF" />
              <Text style={styles.noLiveTitle}>
                Ubicación aún no disponible
              </Text>
              <Text style={styles.noLiveText}>
                El profesional debe tener activa su ubicación para mostrar el
                seguimiento en vivo.
              </Text>
            </View>
          )}

          <View style={styles.liveFooter}>
            <Text style={styles.liveFooterText}>
              Esta ubicación se actualiza automáticamente mientras la cita esté
              confirmada y el seguimiento siga activo.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando tus citas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mis citas</Text>
          <Text style={styles.subtitle}>
            Revisa tus horas agendadas y el seguimiento en vivo.
          </Text>
        </View>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={54} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No tienes citas agendadas</Text>
          <Text style={styles.emptyText}>
            Cuando reserves una hora con un profesional, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderLiveMap()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#667085',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#101828',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 14,
    color: '#667085',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
  },
  specialty: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 7,
  },
  label: {
    fontWeight: '800',
    color: '#344054',
    marginRight: 6,
  },
  value: {
    flex: 1,
    color: '#475467',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confirmedBadge: {
    backgroundColor: '#D1FADF',
  },
  pendingBadge: {
    backgroundColor: '#FEF0C7',
  },
  cancelledBadge: {
    backgroundColor: '#FEE4E2',
  },
  completedBadge: {
    backgroundColor: '#E0F2FE',
  },
  defaultBadge: {
    backgroundColor: '#EAECF0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#344054',
  },
  trackingInfo: {
    marginTop: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingInfoText: {
    flex: 1,
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },
  liveButton: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  liveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    color: '#101828',
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '600',
  },
  liveMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 99,
  },
  liveMapContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  liveMapHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EC',
  },
  liveMapTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101828',
  },
  liveMapSubtitle: {
    marginTop: 3,
    fontSize: 14,
    color: '#667085',
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMap: {
    flex: 1,
  },
  noLiveContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noLiveTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
  },
  noLiveText: {
    marginTop: 8,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '600',
  },
  liveFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E4E7EC',
  },
  liveFooterText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
});