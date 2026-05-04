import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

  const availableDates = useMemo(() => generateNextDays(14), []);
  const availableTimes = useMemo(() => generate24HourSlots(), []);

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

      //if (professionalUserId) {
        //await addDoc(
          //collection(db, 'users', professionalUserId, 'notifications'),
          //{
            //title: 'Nueva cita agendada',
            //message: `${patientName} agendó una cita para el ${selectedDate.trim()} a las ${selectedTime.trim()}.`,
            //type: 'booking',
            //appointmentId: appointmentRef.id,
            //read: false,
            //createdAt: serverTimestamp(),
          //}
        //);
      //}

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
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Agendar cita</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.title}>Reserva tu hora médica</Text>
        <Text style={styles.subtitle}>
          Selecciona una fecha, un horario disponible y cuéntanos el motivo de tu consulta.
        </Text>

        <View style={styles.professionalCard}>
          <View style={styles.professionalAvatar}>
            <Ionicons name="medkit-outline" size={24} color="#2563EB" />
          </View>

          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>
              {professional?.fullName || professional?.name || 'Profesional'}
            </Text>
            <Text style={styles.professionalSpecialty}>
              {professional?.specialty || 'Especialista'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Selecciona una fecha</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        >
          {availableDates.map((item) => {
            const isSelected = selectedDate === item.fullDate;

            return (
              <TouchableOpacity
                key={item.fullDate}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                ]}
                onPress={() => setSelectedDate(item.fullDate)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.dateWeekDay,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {item.weekDay}
                </Text>

                <Text
                  style={[
                    styles.dateNumber,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {item.day}
                </Text>

                <Text
                  style={[
                    styles.dateMonth,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {item.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Horarios disponibles</Text>

        <View style={styles.timeGrid}>
          {availableTimes.map((time) => {
            const isSelected = selectedTime === time;

            return (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeChip,
                  isSelected && styles.timeChipSelected,
                ]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={isSelected ? '#1D4ED8' : '#64748B'}
                  style={styles.timeIcon}
                />
                <Text
                  style={[
                    styles.timeChipText,
                    isSelected && styles.timeChipTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Motivo de la consulta</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Ej: dolor de garganta, control general, revisión médica..."
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calendar-outline" size={18} color="#1D4ED8" />
            <Text style={styles.summaryTitle}>Resumen de tu cita</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha</Text>
            <Text style={styles.summaryValue}>
              {selectedDate || 'No seleccionada'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hora</Text>
            <Text style={styles.summaryValue}>
              {selectedTime || 'No seleccionada'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Profesional</Text>
            <Text style={styles.summaryValue}>
              {professional?.fullName || professional?.name || 'Profesional'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleBooking}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Confirmar cita</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function generateNextDays(totalDays = 14) {
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const days = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const day = String(date.getDate()).padStart(2, '0');
    const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    days.push({
      weekDay: weekDays[date.getDay()],
      day,
      month: months[date.getMonth()],
      fullDate: `${day}/${monthNumber}/${year}`,
    });
  }

  return days;
}

function generate24HourSlots() {
  const times = [];

  for (let hour = 0; hour < 24; hour++) {
    const formattedHour = String(hour).padStart(2, '0');
    times.push(`${formattedHour}:00`);
    times.push(`${formattedHour}:30`);
  }

  return times;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarSpacer: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 22,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  dateList: {
    paddingBottom: 10,
    paddingRight: 8,
  },
  dateCard: {
    width: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateCardSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    transform: [{ scale: 1.02 }],
  },
  dateWeekDay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
  },
  dateMonth: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timeChip: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
  },
  timeChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  timeIcon: {
    marginRight: 6,
  },
  timeChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeChipTextSelected: {
    color: '#1D4ED8',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    color: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '800',
    maxWidth: '58%',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});