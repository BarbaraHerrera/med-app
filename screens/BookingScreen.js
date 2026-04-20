import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const AVAILABLE_TIMES = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

const AVAILABLE_DATES = [
  '2026-04-20',
  '2026-04-21',
  '2026-04-22',
  '2026-04-23',
  '2026-04-24',
];

export default function BookingScreen({ route, navigation }) {
  const professional = route?.params?.professional || null;

  const [selectedDate, setSelectedDate] = useState(AVAILABLE_DATES[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return !!professional && !!selectedDate && !!selectedTime && !loading;
  }, [professional, selectedDate, selectedTime, loading]);

  const handleCreateAppointment = async () => {
    if (!professional) {
      Alert.alert('Error', 'No encontramos la información del profesional.');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Falta información', 'Selecciona una hora.');
      return;
    }

    try {
      setLoading(true);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión.');
        return;
      }

      let patientName = currentUser.displayName || 'Paciente';
      let patientEmail = currentUser.email || '';

      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          patientName =
            userData?.fullName ||
            userData?.name ||
            currentUser.displayName ||
            'Paciente';
          patientEmail = userData?.email || currentUser.email || '';
        }
      } catch (e) {
        console.log('No se pudo leer perfil del paciente:', e);
      }

      await addDoc(collection(db, 'appointments'), {
        patientId: currentUser.uid,
        patientName,
        patientEmail,
        professionalId: professional.userId || professional.id,
        professionalName: professional.name || professional.fullName || 'Profesional',
        specialty: professional.specialty || 'Especialidad no disponible',
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        notes: notes.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        'Cita agendada',
        'Tu solicitud fue enviada correctamente.',
        [
          {
            text: 'Ver mis citas',
            onPress: () => navigation.replace('PatientAppointments'),
          },
        ]
      );
    } catch (error) {
      console.log('Error creando cita:', error);
      Alert.alert('Error', 'No pudimos agendar la cita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Reserva</Text>
          <Text style={styles.heroTitle}>Agenda tu cita</Text>
          <Text style={styles.heroSubtitle}>
            Confirma fecha, hora y agrega un motivo breve para la atención.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profesional</Text>
          <Text style={styles.professionalName}>
            {professional?.name || professional?.fullName || 'Profesional'}
          </Text>
          <Text style={styles.professionalMeta}>
            {professional?.specialty || 'Especialidad no disponible'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
          <View style={styles.optionsWrap}>
            {AVAILABLE_DATES.map((date) => {
              const active = selectedDate === date;
              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selecciona una hora</Text>
          <View style={styles.optionsWrap}>
            {AVAILABLE_TIMES.map((time) => {
              const active = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Motivo o notas</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej: dolor de garganta, control general, consulta psicológica..."
            placeholderTextColor="#98A2B3"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleCreateAppointment}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Confirmar solicitud</Text>
          )}
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
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    marginBottom: 14,
  },
  backText: {
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 12,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
  },
  professionalMeta: {
    marginTop: 6,
    fontSize: 14,
    color: '#667085',
    fontWeight: '600',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FCFCFD',
    padding: 14,
    textAlignVertical: 'top',
    color: '#101828',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});