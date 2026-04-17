import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SPECIALTIES = [
  'Psicología',
  'Enfermería',
  'Kinesiología',
  'Nutrición',
  'Fonoaudiología',
  'Terapia ocupacional',
  'Medicina general',
  'Otro',
];

const MODALITIES = ['Presencial', 'Online', 'Domicilio'];

export default function ProfessionalProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [modalities, setModalities] = useState([]);
  const [servicesText, setServicesText] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const profileCompletion = useMemo(() => {
    let total = 7;
    let completed = 0;

    if (fullName.trim()) completed++;
    if (specialty.trim()) completed++;
    if (description.trim()) completed++;
    if (phone.trim()) completed++;
    if (address.trim()) completed++;
    if (latitude.trim() && longitude.trim()) completed++;
    if (modalities.length > 0) completed++;

    return Math.round((completed / total) * 100);
  }, [fullName, specialty, description, phone, address, latitude, longitude, modalities]);

  const loadProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'professionals', uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();

        setFullName(data.fullName || '');
        setSpecialty(data.specialty || '');
        setDescription(data.description || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setLatitude(
          data.location?.latitude !== undefined
            ? String(data.location.latitude)
            : ''
        );
        setLongitude(
          data.location?.longitude !== undefined
            ? String(data.location.longitude)
            : ''
        );
        setIsActive(data.isActive ?? true);
        setModalities(Array.isArray(data.modalities) ? data.modalities : []);
        setServicesText(
          Array.isArray(data.services) ? data.services.join(', ') : ''
        );
      }
    } catch (error) {
      console.log('Error cargando perfil profesional:', error);
      Alert.alert('Error', 'No pudimos cargar tu perfil profesional.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Debes permitir acceso a tu ubicación para usar esta función.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lng } = currentLocation.coords;

      setLatitude(String(lat));
      setLongitude(String(lng));

      Alert.alert('Ubicación lista', 'Tu ubicación actual fue cargada correctamente.');
    } catch (error) {
      console.log('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No pudimos obtener tu ubicación actual.');
    } finally {
      setLocating(false);
    }
  };

  const toggleModality = (modality) => {
    if (!isEditing) return;

    setModalities((prev) => {
      if (prev.includes(modality)) {
        return prev.filter((item) => item !== modality);
      }
      return [...prev, modality];
    });
  };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email || '';

    if (!uid) {
      Alert.alert('Error', 'No hay usuario autenticado.');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu nombre profesional.');
      return;
    }

    if (!specialty.trim()) {
      Alert.alert('Campo requerido', 'Selecciona o ingresa tu especialidad.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Campo requerido', 'Agrega una descripción de tu atención.');
      return;
    }

    let parsedLatitude = -33.4489;
    let parsedLongitude = -70.6693;

    if (latitude.trim() && longitude.trim()) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        Alert.alert(
          'Ubicación inválida',
          'La latitud y longitud deben ser números válidos.'
        );
        return;
      }

      parsedLatitude = lat;
      parsedLongitude = lng;
    }

    const services = servicesText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      setSaving(true);

      await setDoc(
        doc(db, 'professionals', uid),
        {
          userId: uid,
          email,
          fullName: fullName.trim(),
          specialty: specialty.trim(),
          description: description.trim(),
          phone: phone.trim(),
          address: address.trim(),
          isActive,
          modalities,
          services,
          updatedAt: serverTimestamp(),
          location: {
            latitude: parsedLatitude,
            longitude: parsedLongitude,
          },
        },
        { merge: true }
      );

      setIsEditing(false);
      Alert.alert('Éxito', 'Tu perfil profesional fue actualizado correctamente.');
    } catch (error) {
      console.log('Error guardando perfil profesional:', error);
      Alert.alert('Error', 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2D6CDF" />
          <Text style={styles.loadingText}>Cargando perfil profesional...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName?.trim() ? fullName.trim().charAt(0).toUpperCase() : 'P'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {fullName?.trim() || 'Perfil profesional'}
          </Text>

          <Text style={styles.heroSubtitle}>
            {specialty?.trim() || 'Completa tu especialidad'}
          </Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {isActive ? 'Disponible' : 'Inactivo'}
              </Text>
            </View>

            <View style={styles.completionPill}>
              <Text style={styles.completionText}>
                Perfil {profileCompletion}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.primaryActionText}>Editar perfil</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={styles.secondaryActionText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryAction, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Información principal</Text>

          <Field
            label="Nombre profesional"
            value={fullName}
            onChangeText={setFullName}
            editable={isEditing}
            placeholder="Ej: Dra. María González"
          />

          <Text style={styles.fieldLabel}>Especialidad</Text>
          <View style={styles.chipsRow}>
            {SPECIALTIES.map((item) => {
              const selected = specialty === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                    !isEditing && styles.chipDisabled,
                  ]}
                  onPress={() => isEditing && setSpecialty(item)}
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            editable={isEditing}
            placeholder="Describe tu atención profesional, experiencia y enfoque."
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          <Field
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            placeholder="+56 9 1234 5678"
            keyboardType="phone-pad"
          />

          <Field
            label="Dirección"
            value={address}
            onChangeText={setAddress}
            editable={isEditing}
            placeholder="Ej: Santiago Centro"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Modalidad de atención</Text>

          <View style={styles.chipsRow}>
            {MODALITIES.map((item) => {
              const selected = modalities.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                    !isEditing && styles.chipDisabled,
                  ]}
                  onPress={() => toggleModality(item)}
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field
            label="Servicios"
            value={servicesText}
            onChangeText={setServicesText}
            editable={isEditing}
            placeholder="Ej: Terapia, evaluación, controles, curaciones"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ubicación profesional</Text>

          <TouchableOpacity
            style={[
              styles.locationButton,
              (!isEditing || locating) && styles.disabledButton,
            ]}
            onPress={handleUseCurrentLocation}
            disabled={!isEditing || locating}
          >
            {locating ? (
              <ActivityIndicator color="#2D6CDF" />
            ) : (
              <Text style={styles.locationButtonText}>Usar mi ubicación actual</Text>
            )}
          </TouchableOpacity>

          <Field
            label="Latitud"
            value={latitude}
            onChangeText={setLatitude}
            editable={isEditing}
            placeholder="-33.4489"
            keyboardType="numeric"
          />

          <Field
            label="Longitud"
            value={longitude}
            onChangeText={setLongitude}
            editable={isEditing}
            placeholder="-70.6693"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estado del perfil</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Perfil activo</Text>
              <Text style={styles.switchDescription}>
                Si está activo, podrás aparecer disponible para pacientes.
              </Text>
            </View>

            <Switch
              value={isActive}
              onValueChange={setIsActive}
              disabled={!isEditing}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475467',
    fontWeight: '600',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  topBar: {
    marginBottom: 12,
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
  hero: {
    backgroundColor: '#2D6CDF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F0FF',
    textAlign: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  completionPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  completionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 18,
  },
  primaryAction: {
    minWidth: 120,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2D6CDF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryAction: {
    minWidth: 110,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryActionText: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.7,
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
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 8,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#101828',
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  inputDisabled: {
    backgroundColor: '#F2F4F7',
    color: '#667085',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
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
    borderColor: '#2D6CDF',
  },
  chipDisabled: {
    opacity: 0.75,
  },
  chipText: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#2D6CDF',
  },
  locationButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  locationButtonText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101828',
  },
  switchDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },
});