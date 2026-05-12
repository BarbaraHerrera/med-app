import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfessionalProfileScreen({ navigation }) {
  const [professional, setProfessional] = useState({
    fullName: '',
    specialty: '',
    description: '',
    address: '',
    phone: '',
    photoURL: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'professionals', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfessional((prev) => ({
          ...prev,
          ...docSnap.data(),
        }));
      }
    } catch (error) {
      console.log('Error cargando perfil profesional:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil profesional.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfessional((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePickProfileImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      const user = auth.currentUser;
      if (!user) return;

      setSaving(true);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const imageRef = ref(storage, `professionals/${user.uid}/profile.jpg`);

      await uploadBytes(imageRef, blob);

      const photoURL = await getDownloadURL(imageRef);

      await updateDoc(doc(db, 'professionals', user.uid), {
        photoURL,
        updatedAt: new Date(),
      });

      setProfessional((prev) => ({
        ...prev,
        photoURL,
      }));

      Alert.alert('Listo', 'Foto actualizada correctamente.');
    } catch (error) {
      console.log('Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setSaving(true);

      await updateDoc(doc(db, 'professionals', user.uid), {
        fullName: professional.fullName || '',
        specialty: professional.specialty || '',
        description: professional.description || '',
        address: professional.address || '',
        phone: professional.phone || '',
        photoURL: professional.photoURL || '',
        userId: user.uid,
        updatedAt: new Date(),
      });

      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error) {
      console.log('Error guardando perfil profesional:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Editar perfil</Text>
            <Text style={styles.headerSubtitle}>Perfil profesional</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickProfileImage}
              activeOpacity={0.85}
              disabled={saving}
            >
              {professional?.photoURL ? (
                <Image source={{ uri: professional.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={46} color="#94A3B8" />
                </View>
              )}

              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={17} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.namePreview}>
              {professional?.fullName || 'Tu nombre profesional'}
            </Text>

            <Text style={styles.specialtyPreview}>
              {professional?.specialty || 'Especialidad'}
            </Text>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePickProfileImage}
              disabled={saving}
            >
              <Ionicons name="image-outline" size={18} color="#2563EB" />
              <Text style={styles.photoButtonText}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Información profesional</Text>

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Dra. Camila Rojas"
              value={professional.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Especialidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Médico General"
              value={professional.specialty}
              onChangeText={(text) => handleChange('specialty', text)}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: +569 1234 5678"
              value={professional.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Dirección / comuna</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Las Condes, Santiago"
              value={professional.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Cuéntale a los pacientes sobre tu experiencia, atención y servicios."
              value={professional.description}
              onChangeText={(text) => handleChange('description', text)}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboard: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatarWrapper: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cameraBadge: {
    position: 'absolute',
    right: 5,
    bottom: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  namePreview: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  specialtyPreview: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  photoButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  photoButtonText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 7,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});