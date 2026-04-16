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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      let message = 'No pudimos iniciar sesión. Inténtalo nuevamente.';

      if (error.code === 'auth/invalid-email') {
        message = 'El correo no tiene un formato válido.';
      } else if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        message = 'Correo o contraseña incorrectos.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Espera unos minutos e inténtalo otra vez.';
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

            <Text style={styles.title}>Bienvenido a MedApp</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para encontrar profesionales de la salud cerca de ti.
            </Text>

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
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotWrapper}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
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
    top: 80,
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
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 20,
  },
  forgotText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
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