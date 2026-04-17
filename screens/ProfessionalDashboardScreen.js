import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function ProfessionalDashboardScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const unsubscribeProfile = onSnapshot(
      doc(db, 'professionals', uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() : null);
        setLoadingProfile(false);
      },
      (error) => {
        console.log('Error perfil profesional:', error);
        setLoadingProfile(false);
      }
    );

    return unsubscribeProfile;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('professionalId', '==', uid)
    );

    const unsubscribeAppointments = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }))
          .sort((a, b) => {
            const dateA = `${a.appointmentDate || ''} ${a.appointmentTime || ''}`;
            const dateB = `${b.appointmentDate || ''} ${b.appointmentTime || ''}`;
            return dateA.localeCompare(dateB);
          });

        setAppointments(data);
        setLoadingAppointments(false);
      },
      (error) => {
        console.log('Error leyendo appointments:', error);
        setAppointments([]);
        setLoadingAppointments(false);
      }
    );

    return unsubscribeAppointments;
  }, [uid]);

  const stats = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const todayDate = new Date().toISOString().split('T')[0];
    const today = appointments.filter((a) => a.appointmentDate === todayDate).length;

    return { pending, confirmed, completed, today };
  }, [appointments]);

  const mapRegion = useMemo(() => {
    const lat = profile?.location?.latitude || -33.4489;
    const lng = profile?.location?.longitude || -70.6693;

    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Error cerrando sesión:', error);
      Alert.alert('Error', 'No pudimos cerrar sesión.');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setUpdatingId(appointmentId);

      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.log('Error actualizando cita:', error);
      Alert.alert('Error', 'No pudimos actualizar la cita.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeStyle = (status) => {
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

  const nextAppointments = appointments.slice(0, 8);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>Panel profesional</Text>
            <Text style={styles.name}>
              {loadingProfile ? 'Cargando...' : profile?.fullName || 'Profesional'}
            </Text>
            <Text style={styles.specialty}>
              {profile?.specialty || 'Completa tu especialidad en tu perfil'}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.today}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('ProfessionalProfile')}
            >
              <Text style={styles.quickEmoji}>👤</Text>
              <Text style={styles.quickText}>Mi perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.quickEmoji}>📋</Text>
              <Text style={styles.quickText}>Historial</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickEmoji}>✅</Text>
              <Text style={styles.quickText}>Citas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agenda y pacientes</Text>

          {loadingAppointments ? (
            <ActivityIndicator color="#2D6CDF" style={{ marginTop: 18 }} />
          ) : nextAppointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aún no tienes reservas</Text>
              <Text style={styles.emptyText}>
                Cuando un paciente agende, aparecerá aquí automáticamente.
              </Text>
            </View>
          ) : (
            nextAppointments.map((item) => {
              const isUpdating = updatingId === item.id;
              const isPending = item.status === 'pending';
              const isConfirmed = item.status === 'confirmed';

              return (
                <View key={item.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.patientName}>
                      {item.patientName || 'Paciente sin nombre'}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        getStatusBadgeStyle(item.status),
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {item.status || 'pending'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.appointmentInfo}>
                    📅 {item.appointmentDate || 'Sin fecha'}
                  </Text>
                  <Text style={styles.appointmentInfo}>
                    ⏰ {item.appointmentTime || 'Sin hora'}
                  </Text>
                  <Text style={styles.appointmentInfo}>
                    🩺 {item.specialty || profile?.specialty || 'Atención'}
                  </Text>
                  {!!item.notes && (
                    <Text style={styles.appointmentInfo}>
                      📝 {item.notes}
                    </Text>
                  )}

                  <View style={styles.actionsWrap}>
                    {isPending && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.confirmButton,
                            isUpdating && styles.disabledButton,
                          ]}
                          onPress={() =>
                            handleUpdateAppointmentStatus(item.id, 'confirmed')
                          }
                          disabled={isUpdating}
                        >
                          <Text style={styles.actionButtonText}>Confirmar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.cancelButton,
                            isUpdating && styles.disabledButton,
                          ]}
                          onPress={() =>
                            handleUpdateAppointmentStatus(item.id, 'cancelled')
                          }
                          disabled={isUpdating}
                        >
                          <Text style={styles.actionButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.completeButton,
                            isUpdating && styles.disabledButton,
                          ]}
                          onPress={() =>
                            handleUpdateAppointmentStatus(item.id, 'completed')
                          }
                          disabled={isUpdating}
                        >
                          <Text style={styles.actionButtonText}>Completar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.cancelButton,
                            isUpdating && styles.disabledButton,
                          ]}
                          onPress={() =>
                            handleUpdateAppointmentStatus(item.id, 'cancelled')
                          }
                          disabled={isUpdating}
                        >
                          <Text style={styles.actionButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {isUpdating && (
                      <View style={styles.inlineLoader}>
                        <ActivityIndicator color="#2D6CDF" />
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapa profesional</Text>

          <View style={styles.mapContainer}>
            <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion}>
              <Marker
                coordinate={{
                  latitude: profile?.location?.latitude || -33.4489,
                  longitude: profile?.location?.longitude || -70.6693,
                }}
                title={profile?.fullName || 'Mi ubicación profesional'}
                description={profile?.specialty || 'Profesional de la salud'}
              />

              {appointments
                .filter(
                  (item) =>
                    item.location &&
                    typeof item.location.latitude === 'number' &&
                    typeof item.location.longitude === 'number'
                )
                .slice(0, 10)
                .map((item) => (
                  <Marker
                    key={`appt-${item.id}`}
                    coordinate={{
                      latitude: item.location.latitude,
                      longitude: item.location.longitude,
                    }}
                    title={item.patientName || 'Paciente'}
                    description={`${item.appointmentDate || ''} ${item.appointmentTime || ''}`}
                  />
                ))}
            </MapView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  hero: {
    backgroundColor: '#2D6CDF',
    borderRadius: 26,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  welcome: {
    color: '#DCE8FF',
    fontSize: 14,
    fontWeight: '700',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  specialty: {
    color: '#EAF1FF',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#101828',
  },
  statLabel: {
    marginTop: 4,
    color: '#667085',
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  quickEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: '#667085',
    lineHeight: 21,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
    flex: 1,
    paddingRight: 10,
  },
  appointmentInfo: {
    marginTop: 8,
    color: '#475467',
    fontSize: 14,
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
    textTransform: 'capitalize',
  },
  actionsWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 110,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  confirmButton: {
    backgroundColor: '#16A34A',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  completeButton: {
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  inlineLoader: {
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  mapContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  map: {
    width: '100%',
    height: 280,
  },
});