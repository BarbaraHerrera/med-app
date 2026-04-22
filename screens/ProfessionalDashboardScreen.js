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
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { registerForPushNotificationsAsync } from '../services/notifications';

export default function ProfessionalDashboardScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [professionalData, setProfessionalData] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    saveProfessionalPushToken();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const professionalQuery = query(
      collection(db, 'professionals'),
      where('userId', '==', uid)
    );

    const unsubscribeProfessional = onSnapshot(
      professionalQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const docItem = snapshot.docs[0];
          setProfessionalData({
            id: docItem.id,
            ...docItem.data(),
          });
        } else {
          setProfessionalData(null);
        }
        setLoadingProfile(false);
      },
      (error) => {
        console.log('Error cargando perfil profesional:', error);
        Alert.alert('Error', 'No pudimos cargar tu perfil profesional.');
        setLoadingProfile(false);
      }
    );

    return unsubscribeProfessional;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const notificationsRef = collection(db, 'users', uid, 'notifications');

    const unsubscribeNotifications = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const unread = snapshot.docs.filter(
          (docItem) => docItem.data()?.read === false
        ).length;

        setNotificationCount(unread);
      },
      (error) => {
        console.log('Error cargando notificaciones del profesional:', error);
      }
    );

    return unsubscribeNotifications;
  }, [uid]);

  useEffect(() => {
    if (!professionalData?.id) {
      setLoadingAppointments(false);
      return;
    }

    setLoadingAppointments(true);

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('professionalId', '==', professionalData.id)
    );

    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }))
          .sort((a, b) => {
            const dateA = `${a.date || ''} ${a.time || ''}`;
            const dateB = `${b.date || ''} ${b.time || ''}`;
            return dateA.localeCompare(dateB);
          });

        setAppointments(data);
        setLoadingAppointments(false);
      },
      (error) => {
        console.log('Error leyendo citas del profesional:', error);
        Alert.alert('Error', 'No pudimos cargar las citas.');
        setLoadingAppointments(false);
      }
    );

    return unsubscribeAppointments;
  }, [professionalData?.id]);

  const saveProfessionalPushToken = async () => {
    try {
      if (!uid) return;

      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      const q = query(collection(db, 'professionals'), where('userId', '==', uid));
      const snap = await getDocs(q);

      if (snap.empty) return;

      const professionalDoc = snap.docs[0];

      await updateDoc(doc(db, 'professionals', professionalDoc.id), {
        expoPushToken: token,
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      });

      console.log('Token push profesional guardado:', token);
    } catch (error) {
      console.log('Error guardando token push profesional:', error);
    }
  };

  const stats = useMemo(() => {
    return {
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    };
  }, [appointments]);

  const createNotificationForPatient = async (appointment, status) => {
    try {
      if (!appointment?.patientId) return;

      let title = 'Actualización de cita';
      let message = 'Tu cita fue actualizada.';

      const professionalName =
        professionalData?.fullName ||
        professionalData?.name ||
        'el profesional';

      if (status === 'confirmed') {
        title = 'Cita confirmada';
        message = `Tu cita con ${professionalName} fue confirmada para el ${appointment.date || 'día seleccionado'} a las ${appointment.time || 'hora seleccionada'}.`;
      }

      if (status === 'completed') {
        title = 'Cita completada';
        message = `Tu cita con ${professionalName} fue marcada como completada.`;
      }

      if (status === 'cancelled') {
        title = 'Cita cancelada';
        message = `Tu cita con ${professionalName} fue cancelada.`;
      }

      await addDoc(collection(db, 'users', appointment.patientId, 'notifications'), {
        title,
        message,
        type: 'appointment_update',
        appointmentId: appointment.id,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.log('Error creando notificación para paciente:', error);
    }
  };

  const updateStatus = async (appointment, status) => {
    try {
      setUpdatingId(appointment.id);

      await updateDoc(doc(db, 'appointments', appointment.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      await createNotificationForPatient(appointment, status);
      Alert.alert('Éxito', 'Estado de la cita actualizado.');
    } catch (error) {
      console.log('Error actualizando estado de cita:', error);
      Alert.alert('Error', 'No pudimos actualizar el estado de la cita.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Error cerrando sesión:', error);
      Alert.alert('Error', 'No pudimos cerrar sesión.');
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

  const latitude = professionalData?.location?.latitude;
  const longitude = professionalData?.location?.longitude;

  const hasValidLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const initialRegion = hasValidLocation
    ? {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: -33.4489,
        longitude: -70.6693,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.topLabel}>Panel profesional</Text>
            <Text style={styles.topTitle}>Tu dashboard</Text>
            <Text style={styles.topSubtitle}>
              Administra tus citas, revisa tu ubicación y accede rápido a tu perfil.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('ProfessionalNotifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#344054" />

              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#344054" />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="medical-outline" size={28} color="#2563EB" />
            </View>

            <View style={styles.heroTextWrap}>
              <Text style={styles.heroName}>
                {professionalData?.fullName ||
                  professionalData?.name ||
                  'Profesional'}
              </Text>
              <Text style={styles.heroSpecialty}>
                {professionalData?.specialty || 'Especialidad no disponible'}
              </Text>
              <Text style={styles.heroMeta}>
                {professionalData?.address || 'Dirección no disponible'}
              </Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryHeroButton}
              onPress={() =>
                navigation.navigate('ProfessionalProfile', {
                  professional: professionalData,
                })
              }
            >
              <Ionicons name="person-outline" size={18} color="#2563EB" />
              <Text style={styles.primaryHeroButtonText}>Mi perfil profesional</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryHeroButton}
              onPress={() =>
                navigation.navigate('ProfessionalProfile', {
                  professional: professionalData,
                })
              }
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.secondaryHeroButtonText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#16A34A"
              />
            </View>
            <Text style={styles.statNumber}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <MaterialIcons name="task-alt" size={18} color="#0284C7" />
            </View>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu ubicación en el mapa</Text>

            <TouchableOpacity
              style={styles.miniActionButton}
              onPress={() =>
                navigation.navigate('ProfessionalProfile', {
                  professional: professionalData,
                })
              }
            >
              <Text style={styles.miniActionButtonText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapCard}>
            {loadingProfile ? (
              <View style={styles.mapFallback}>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.mapFallbackText}>Cargando ubicación...</Text>
              </View>
            ) : hasValidLocation ? (
              <MapView style={styles.map} initialRegion={initialRegion}>
                <Marker
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  title={
                    professionalData?.fullName ||
                    professionalData?.name ||
                    'Profesional'
                  }
                  description={
                    professionalData?.specialty || 'Especialidad no disponible'
                  }
                />
              </MapView>
            ) : (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackTitle}>Sin ubicación registrada</Text>
                <Text style={styles.mapFallbackText}>
                  Agrega latitude y longitude en tu perfil profesional para que
                  aparezca el mapa.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gestión de citas</Text>

            <TouchableOpacity
              style={styles.profileButtonSmall}
              onPress={() =>
                navigation.navigate('ProfessionalProfile', {
                  professional: professionalData,
                })
              }
            >
              <Text style={styles.profileButtonSmallText}>Mi perfil</Text>
            </TouchableOpacity>
          </View>

          {loadingAppointments ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aún no tienes citas registradas</Text>
              <Text style={styles.emptyText}>
                Cuando un paciente agende una hora, aparecerá aquí para que la
                puedas gestionar.
              </Text>
            </View>
          ) : (
            appointments.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>
                    {item.patientName || 'Paciente'}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      getStatusBadgeStyle(item.status),
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.info}>
                  📧 {item.patientEmail || 'Correo no disponible'}
                </Text>
                <Text style={styles.info}>
                  📅 {item.date || 'Sin fecha'}
                </Text>
                <Text style={styles.info}>
                  ⏰ {item.time || 'Sin hora'}
                </Text>

                {!!item.reason && (
                  <Text style={styles.info}>📝 {item.reason}</Text>
                )}

                <View style={styles.actionsWrap}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.confirmBtn]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item, 'confirmed')}
                  >
                    <Text style={styles.actionText}>
                      {updatingId === item.id ? 'Actualizando...' : 'Confirmar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.completeBtn]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item, 'completed')}
                  >
                    <Text style={styles.actionText}>
                      {updatingId === item.id ? 'Actualizando...' : 'Completar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item, 'cancelled')}
                  >
                    <Text style={styles.actionText}>
                      {updatingId === item.id ? 'Actualizando...' : 'Cancelar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
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
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  topLabel: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topTitle: {
    marginTop: 4,
    color: '#101828',
    fontSize: 28,
    fontWeight: '800',
  },
  topSubtitle: {
    marginTop: 6,
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    color: '#344054',
    fontWeight: '800',
    fontSize: 14,
  },
  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSpecialty: {
    marginTop: 6,
    color: '#E0EAFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroMeta: {
    marginTop: 8,
    color: '#DBEAFE',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  heroActions: {
    marginTop: 18,
    gap: 10,
  },
  primaryHeroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryHeroButtonText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryHeroButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryHeroButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 12,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101828',
  },
  statLabel: {
    marginTop: 6,
    color: '#667085',
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    marginTop: 4,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
  },
  miniActionButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  miniActionButtonText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 12,
  },
  profileButtonSmall: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  profileButtonSmallText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  map: {
    width: '100%',
    height: 260,
  },
  mapFallback: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  mapFallbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 8,
    textAlign: 'center',
  },
  mapFallbackText: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardHeader: {
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
  info: {
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
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmBtn: {
    backgroundColor: '#16A34A',
  },
  completeBtn: {
    backgroundColor: '#0284C7',
  },
  cancelBtn: {
    backgroundColor: '#DC2626',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});