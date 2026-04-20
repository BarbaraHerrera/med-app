// /screens/PatientAppointmentsScreen.js
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
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function PatientAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', uid)
    );

    const unsubscribe = onSnapshot(
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
        setLoading(false);
      },
      (error) => {
        console.log('Error leyendo citas del paciente:', error);
        Alert.alert('Error', 'No pudimos cargar tus horas agendadas.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const stats = useMemo(() => {
    return {
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    };
  }, [appointments]);

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Mis horas</Text>
          <Text style={styles.heroTitle}>Tus citas agendadas</Text>
          <Text style={styles.heroSubtitle}>
            Revisa el estado de tus solicitudes y próximas atenciones.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listado de citas</Text>

          {loading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aún no tienes horas agendadas</Text>
              <Text style={styles.emptyText}>
                Cuando agendes una atención, aparecerá aquí con su estado.
              </Text>
            </View>
          ) : (
            appointments.map((item) => (
              <View key={item.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.professionalName}>
                    {item.professionalName || 'Profesional'}
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

                <Text style={styles.appointmentInfo}>
                  🩺 {item.specialty || 'Especialidad no disponible'}
                </Text>
                <Text style={styles.appointmentInfo}>
                  📅 {item.appointmentDate || 'Sin fecha'}
                </Text>
                <Text style={styles.appointmentInfo}>
                  ⏰ {item.appointmentTime || 'Sin hora'}
                </Text>

                {!!item.notes && (
                  <Text style={styles.appointmentInfo}>
                    📝 {item.notes}
                  </Text>
                )}

                {item.status === 'pending' && (
                  <Text style={styles.statusDescription}>
                    Tu solicitud fue enviada y está pendiente de confirmación.
                  </Text>
                )}

                {item.status === 'confirmed' && (
                  <Text style={styles.statusDescription}>
                    Tu cita fue confirmada por el profesional.
                  </Text>
                )}

                {item.status === 'completed' && (
                  <Text style={styles.statusDescription}>
                    Esta atención ya fue realizada.
                  </Text>
                )}

                {item.status === 'cancelled' && (
                  <Text style={styles.statusDescription}>
                    Esta cita fue cancelada.
                  </Text>
                )}
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
  headerRow: {
    marginBottom: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  backButtonText: {
    color: '#344054',
    fontWeight: '800',
    fontSize: 14,
  },
  hero: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  heroLabel: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#E0EAFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
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
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 12,
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
  professionalName: {
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
  },
  statusDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    fontWeight: '600',
  },
});