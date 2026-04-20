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
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

export default function ProfessionalDashboardScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('professionalId', '==', uid)
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
        console.log('Error leyendo citas del profesional:', error);
        Alert.alert('Error', 'No pudimos cargar las citas.');
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

  const updateStatus = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);

      await updateDoc(doc(db, 'appointments', appointmentId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.log('Error actualizando estado:', error);
      Alert.alert('Error', 'No pudimos actualizar el estado.');
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Error cerrando sesión:', error);
      Alert.alert('Error', 'No pudimos cerrar sesión.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.topLabel}>Panel profesional</Text>
            <Text style={styles.topTitle}>Gestión de citas</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Solicitudes y atenciones</Text>

          {loading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aún no tienes citas registradas</Text>
              <Text style={styles.emptyText}>
                Las solicitudes que hagan tus pacientes aparecerán aquí.
              </Text>
            </View>
          ) : (
            appointments.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>
                    {item.patientName || 'Paciente'}
                  </Text>

                  <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                    <Text style={styles.statusText}>{item.status || 'pending'}</Text>
                  </View>
                </View>

                <Text style={styles.info}>📧 {item.patientEmail || 'Sin correo'}</Text>
                <Text style={styles.info}>🩺 {item.specialty || 'Sin especialidad'}</Text>
                <Text style={styles.info}>📅 {item.appointmentDate || 'Sin fecha'}</Text>
                <Text style={styles.info}>⏰ {item.appointmentTime || 'Sin hora'}</Text>

                {!!item.notes && <Text style={styles.info}>📝 {item.notes}</Text>}

                <View style={styles.actionsWrap}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.confirmBtn]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item.id, 'confirmed')}
                  >
                    <Text style={styles.actionText}>Confirmar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.completeBtn]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item.id, 'completed')}
                  >
                    <Text style={styles.actionText}>Completar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    disabled={updatingId === item.id}
                    onPress={() => updateStatus(item.id, 'cancelled')}
                  >
                    <Text style={styles.actionText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfessionalProfile')}
        >
          <Text style={styles.profileButtonText}>Ir a mi perfil profesional</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 18,
  },
  topLabel: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  topTitle: {
    marginTop: 4,
    color: '#101828',
    fontSize: 24,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  logoutText: {
    color: '#344054',
    fontWeight: '800',
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
    marginTop: 8,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
    textTransform: 'capitalize',
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
  profileButton: {
    marginTop: 16,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});