import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const HOURS = [
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
  '17:30',
  '18:00',
];

function getNextDays(count = 7) {
  const days = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    const yyyy = date.getFullYear();
    const mm = `${date.getMonth() + 1}`.padStart(2, '0');
    const dd = `${date.getDate()}`.padStart(2, '0');

    days.push({
      label: `${dd}/${mm}`,
      value: `${yyyy}-${mm}-${dd}`,
    });
  }

  return days;
}

export default function BookingScreen({ route, navigation }) {
  const { professional } = route.params || {};
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const availableDays = useMemo(() => getNextDays(7), []);

  const professionalName =
    professional?.fullName || professional?.name || 'Profesional';

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

  const handleConfirmBooking = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'Debes iniciar sesión.');
        return;
      }

      if (!selectedDate || !selectedTime) {
        Alert.alert('Faltan datos', 'Selecciona una fecha y una hora.');
        return;
      }

      setSaving(true);

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      const patientName = userSnap.exists()
        ? userSnap.data()?.fullName ||
          currentUser.displayName ||
          currentUser.email?.split('@')[0] ||
          'Paciente'
        : currentUser.displayName ||
          currentUser.email?.split('@')[0] ||
          'Paciente';

      await addDoc(collection(db, 'appointments'), {
        professionalId: professional.userId || professional.id,
        patientId: currentUser.uid,
        professionalName,
        patientName,
        specialty: professional.specialty || '',
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        status: 'pending',
        notes: notes.trim(),
        location: professional.location || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Hora agendada', 'Tu solicitud fue enviada correctamente.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.log('Error creando appointment:', error);
      Alert.alert('Error', 'No pudimos agendar la hora.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Agendamiento</Text>
          <Text style={styles.heroTitle}>{professionalName}</Text>
          <Text style={styles.heroSubtitle}>
            {professional.specialty || 'Especialidad no disponible'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
          <View style={styles.chipsRow}>
            {availableDays.map((day) => {
              const selected = selectedDate === day.value;

              return (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelectedDate(day.value)}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selecciona una hora</Text>
          <View style={styles.chipsRow}>
            {HOURS.map((hour) => {
              const selected = selectedTime === hour;

              return (
                <TouchableOpacity
                  key={hour}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelectedTime(hour)}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextSelected]}
                  >
                    {hour}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notas para el profesional</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ej: Necesito control general, dolor de garganta, consulta inicial..."
            placeholderTextColor="#98A2B3"
            multiline
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={handleConfirmBooking}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirmar hora</Text>
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
  container: {
    padding: 20,
    paddingBottom: 36,
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
  heroCard: {
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  chipSelected: {
    backgroundColor: '#E8F0FF',
    borderColor: '#2563EB',
  },
  chipText: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#2563EB',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 15,
    color: '#101828',
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});