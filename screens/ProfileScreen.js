// screens/ProfileScreen.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    city: '',
    specialty: '',
    about: '',
  });

  const initials = useMemo(() => {
    const name = profile.fullName?.trim();
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [profile.fullName]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!user?.uid) {
        Alert.alert('Error', 'No se encontró el usuario autenticado.');
        setLoading(false);
        return;
      }

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          fullName: data.fullName || '',
          email: user.email || '',
          phone: data.phone || '',
          city: data.city || '',
          specialty: data.specialty || '',
          about: data.about || '',
        });
      } else {
        const initialData = {
          fullName: user.displayName || '',
          email: user.email || '',
          phone: '',
          city: '',
          specialty: '',
          about: '',
          createdAt: new Date(),
        };

        await setDoc(ref, initialData);
        setProfile({
          fullName: initialData.fullName,
          email: initialData.email,
          phone: initialData.phone,
          city: initialData.city,
          specialty: initialData.specialty,
          about: initialData.about,
        });
      }
    } catch (error) {
      console.log('Error al cargar perfil:', error);
      Alert.alert('Error', 'No pudimos cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!user?.uid) return;

      if (!profile.fullName.trim()) {
        Alert.alert('Campo requerido', 'Por favor ingresa tu nombre.');
        return;
      }

      setSaving(true);

      const ref = doc(db, 'users', user.uid);

      await updateDoc(ref, {
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        city: profile.city.trim(),
        specialty: profile.specialty.trim(),
        about: profile.about.trim(),
        updatedAt: new Date(),
      });

      setEditMode(false);
      Alert.alert('Éxito', 'Tu perfil fue actualizado correctamente.');
    } catch (error) {
      console.log('Error al guardar perfil:', error);

      try {
        const ref = doc(db, 'users', user.uid);
        await setDoc(
          ref,
          {
            fullName: profile.fullName.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim(),
            city: profile.city.trim(),
            specialty: profile.specialty.trim(),
            about: profile.about.trim(),
            updatedAt: new Date(),
          },
          { merge: true }
        );

        setEditMode(false);
        Alert.alert('Éxito', 'Tu perfil fue guardado correctamente.');
      } catch (err) {
        console.log('Error secundario al guardar perfil:', err);
        Alert.alert('Error', 'No pudimos guardar los cambios.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás segura de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            console.log('Error cerrando sesión:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión.');
          }
        },
      },
    ]);
  };

  const renderField = (label, key, placeholder, options = {}) => {
    const { multiline = false, keyboardType = 'default' } = options;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={profile[key]}
          onChangeText={(text) => handleChange(key, text)}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          editable={editMode}
          multiline={multiline}
          keyboardType={keyboardType}
          style={[
            styles.input,
            multiline && styles.textArea,
            !editMode && styles.inputDisabled,
          ]}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mi Perfil</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (editMode) {
                setEditMode(false);
                loadProfile();
              } else {
                setEditMode(true);
              }
            }}
          >
            <Ionicons
              name={editMode ? 'close-outline' : 'create-outline'}
              size={20}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{profile.fullName || 'Tu nombre'}</Text>
          <Text style={styles.email}>{profile.email || 'correo@ejemplo.com'}</Text>

          <View style={styles.badge}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#2563EB" />
            <Text style={styles.badgeText}>Cuenta activa</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          {renderField('Nombre completo', 'fullName', 'Ingresa tu nombre')}
          {renderField('Correo electrónico', 'email', 'Tu correo')}
          {renderField('Teléfono', 'phone', 'Ingresa tu teléfono', {
            keyboardType: 'phone-pad',
          })}
          {renderField('Ciudad', 'city', 'Ej: Santiago')}
          {renderField('Especialidad / interés', 'specialty', 'Ej: Psicología, Enfermería')}
          {renderField('Sobre mí', 'about', 'Cuéntanos un poco sobre ti', {
            multiline: true,
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones</Text>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <Ionicons name="notifications-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.optionText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <Ionicons name="lock-closed-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.optionText}>Privacidad y seguridad</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {editMode && (
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#475569',
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  badge: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  inputDisabled: {
    color: '#475569',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
  },
});