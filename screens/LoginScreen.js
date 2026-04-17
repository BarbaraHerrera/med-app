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
  const [secureEntry, setSecureEntry] = useState(true);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);

      // No navegamos manualmente aquí.
      // App.js detectará el usuario autenticado y decidirá:
      // - RoleSelection
      // - Home
      // - ProfessionalDashboard
    } catch (error) {
      console.log('Error login:', error);

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
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Revisa tu conexión a internet e inténtalo nuevamente.';
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
              Inicia sesión para acceder como paciente o profesional de la salud.
            </Text>

            <View style={styles.roleInfoBox}>
              <Text style={styles.roleInfoTitle}>Tu acceso es inteligente</Text>
              <Text style={styles.roleInfoText}>
                La app detectará automáticamente si tu cuenta es de paciente o profesional
                y te llevará a tu pantalla correspondiente.
              </Text>
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
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={secureEntry}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() => setSecureEntry((prev) => !prev)}
                  style={styles.showButton}
                  disabled={loading}
                >
                  <Text style={styles.showButtonText}>
                    {secureEntry ? 'Ver' : 'Ocultar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotWrapper}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
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
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
            </TouchableOpacity>

            <Text style={styles.bottomText}>
              Si aún no has elegido tu tipo de cuenta, la app te lo pedirá después de entrar.
            </Text>
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
    shadowOffset: { width: 0, height: 8 },
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
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
  },
  roleInfoBox: {
    marginTop: 18,
    marginBottom: 22,
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleInfoTitle: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  roleInfoText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
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
  passwordWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  showButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  showButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
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
  bottomText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    fontWeight: '600',
  },
});