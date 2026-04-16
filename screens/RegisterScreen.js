import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos incompletos', 'Completa toda la información.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      // 1) Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      // 2) Guardar nombre visible en Auth
      await updateProfile(user, {
        displayName: cleanName,
      });

      // 3) Guardar datos reales en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: cleanName,
        email: cleanEmail,
        role: 'patient',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Cuenta creada', 'Tu cuenta fue creada y guardada correctamente.');

      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // navigation.replace('Home');
    } catch (error) {
      console.log('REGISTER ERROR:', error);

      let message = 'No pudimos crear la cuenta. Inténtalo nuevamente.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'Ese correo ya está registrado.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'El correo no tiene un formato válido.';
      } else if (error.code === 'auth/weak-password') {
        message = 'La contraseña es demasiado débil.';
      } else if (error.code === 'permission-denied') {
        message = 'Firestore bloqueó el guardado. Revisa tus reglas.';
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topGlow} />
          <View style={styles.card}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>+</Text>
            </View>

            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>
              Regístrate para acceder a profesionales de la salud y gestionar tu perfil.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="tucorreo@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  topGlow: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    fontSize: 15,
    color: '#0F172A',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});