import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RoleSelectionScreen({ navigation }) {
  const [loadingRole, setLoadingRole] = useState(null);

  const handleSelectRole = async (role) => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('Error', 'No hay un usuario autenticado.');
        return;
      }

      setLoadingRole(role);

      const uid = currentUser.uid;
      const email = currentUser.email || '';
      const displayName = currentUser.displayName || '';

      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email,
          fullName: displayName,
          role,
          onboardingCompleted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (role === 'professional') {
        await setDoc(
          doc(db, 'professionals', uid),
          {
            userId: uid,
            email,
            fullName: displayName || '',
            specialty: '',
            description: '',
            phone: '',
            address: '',
            photoURL: '',
            isActive: true,
            verified: false,
            services: [],
            modalities: [],
            rating: 0,
            reviewCount: 0,
            location: {
              latitude: -33.4489,
              longitude: -70.6693,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        navigation.reset({
          index: 0,
          routes: [{ name: 'ProfessionalDashboard' }],
        });
        return;
      }

      if (role === 'patient') {
        await setDoc(
          doc(db, 'patients', uid),
          {
            userId: uid,
            email,
            fullName: displayName || '',
            phone: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        return;
      }
    } catch (error) {
      console.log('Error guardando rol:', error);
      Alert.alert('Error', 'No pudimos guardar tu rol.');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.badge}>MedApp</Text>
        <Text style={styles.title}>¿Cómo quieres usar la app?</Text>
        <Text style={styles.subtitle}>
          Elige tu experiencia para personalizar la navegación y las funciones.
        </Text>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => handleSelectRole('patient')}
          disabled={!!loadingRole}
        >
          <Text style={styles.cardEmoji}>🩺</Text>
          <Text style={styles.cardTitle}>Soy paciente</Text>
          <Text style={styles.cardText}>
            Buscar profesionales, ver mapa y agendar atenciones.
          </Text>

          {loadingRole === 'patient' ? (
            <ActivityIndicator style={{ marginTop: 12 }} color="#2D6CDF" />
          ) : (
            <Text style={styles.cardAction}>Entrar como paciente</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardProfessional]}
          activeOpacity={0.9}
          onPress={() => handleSelectRole('professional')}
          disabled={!!loadingRole}
        >
          <Text style={styles.cardEmoji}>👩‍⚕️</Text>
          <Text style={styles.cardTitle}>Soy profesional de la salud</Text>
          <Text style={styles.cardText}>
            Gestionar agenda, pacientes, perfil profesional y mapa.
          </Text>

          {loadingRole === 'professional' ? (
            <ActivityIndicator style={{ marginTop: 12 }} color="#2D6CDF" />
          ) : (
            <Text style={styles.cardAction}>Entrar como profesional</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0FF',
    color: '#2D6CDF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#101828',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#667085',
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardProfessional: {
    borderColor: '#D7E6FF',
    backgroundColor: '#F9FBFF',
  },
  cardEmoji: {
    fontSize: 34,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#101828',
  },
  cardText: {
    fontSize: 14,
    color: '#667085',
    marginTop: 8,
    lineHeight: 21,
  },
  cardAction: {
    marginTop: 16,
    color: '#2D6CDF',
    fontWeight: '800',
    fontSize: 14,
  },
});