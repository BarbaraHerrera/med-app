import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  scheduleLocalBookingNotification,
  notifyProfessionalByProfessionalDocId,
} from '../services/notifications';

export default function BookingScreen({ route, navigation }) {
  const { professional } = route.params || {};

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setPatientData(userSnap.data());
      }
    } catch (error) {
      console.log('Error cargando paciente:', error);
    }
  };

  const handleBooking = async () => {
    try {
      if (!auth.currentUser?.uid || !professional?.id) {
        Alert.alert('Error', 'Faltan datos para agendar.');
        return;
      }

      if (!selectedDate.trim() || !selectedTime.trim() || !reason.trim()) {
        Alert.alert('Campos incompletos', 'Completa fecha, hora y motivo.');
        return;
      }

      setLoading(true);

      const patientId = auth.currentUser.uid;
      const patientName =
        patientData?.fullName ||
        auth.currentUser.displayName ||
        'Paciente';

      const professionalName =
        professional?.fullName ||
        professional?.name ||
        'Profesional';

      const professionalUserId =
        professional?.userId || professional?.uid || '';

      const appointmentRef = await addDoc(collection(db, 'appointments'), {
        patientId,
        patientName,
        patientEmail: auth.currentUser.email || '',
        professionalId: professional.id,
        professionalUserId,
        professionalName,
        professionalSpecialty: professional.specialty || '',
        date: selectedDate.trim(),
        time: selectedTime.trim(),
        reason: reason.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      if (professionalUserId) {
        await addDoc(collection(db, 'users', professionalUserId, 'notifications'), {
          title: 'Nueva cita agendada',
          message: `${patientName} agendó una cita para el ${selectedDate.trim()} a las ${selectedTime.trim()}.`,
          type: 'booking',
          appointmentId: appointmentRef.id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      await addDoc(collection(db, 'users', patientId, 'notifications'), {
        title: 'Cita agendada con éxito',
        message: `Tu cita con ${professionalName} fue agendada para el ${selectedDate.trim()} a las ${selectedTime.trim()}.`,
        type: 'booking',
        appointmentId: appointmentRef.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      await notifyProfessionalByProfessionalDocId(professional.id, {
        title: 'Nueva cita agendada',
        body: `${patientName} agendó una cita para el ${selectedDate.trim()} a las ${selectedTime.trim()}.`,
        data: {
          screen: 'ProfessionalDashboard',
          appointmentId: appointmentRef.id,
          type: 'booking',
        },
      });

      await scheduleLocalBookingNotification({
        title: 'Cita agendada',
        body: `Tu cita con ${professionalName} fue creada correctamente.`,
        data: {
          screen: 'PatientAppointments',
          appointmentId: appointmentRef.id,
          type: 'booking',
        },
      });

      Alert.alert('Éxito', 'Tu cita fue agendada correctamente.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('PatientAppointments'),
        },
      ]);
    } catch (error) {
      console.log('Error agendando cita:', error);
      Alert.alert('Error', 'No se pudo agendar la cita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agendar Cita</Text>

      <Text style={styles.label}>Profesional</Text>
      <Text style={styles.value}>
        {professional?.fullName || professional?.name || 'Profesional'}
      </Text>

      <Text style={styles.label}>Fecha</Text>
      <TextInput
        style={styles.input}
        value={selectedDate}
        onChangeText={setSelectedDate}
        placeholder="25/04/2026"
      />

      <Text style={styles.label}>Hora</Text>
      <TextInput
        style={styles.input}
        value={selectedTime}
        onChangeText={setSelectedTime}
        placeholder="15:30"
      />

      <Text style={styles.label}>Motivo</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reason}
        onChangeText={setReason}
        placeholder="Motivo de la consulta"
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmar cita</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F4F7FB',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});