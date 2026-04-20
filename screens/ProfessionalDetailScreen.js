// /screens/ProfessionalDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfessionalDetailScreen({ route, navigation }) {
  const professional = route?.params?.professional;

  if (!professional) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Profesional no encontrado</Text>
          <Text style={styles.errorText}>
            No pudimos cargar la información del profesional.
          </Text>

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

  const handleCall = async () => {
    const phone = professional.phone || professional.phoneNumber;

    if (!phone) {
      Alert.alert('Sin teléfono', 'Este profesional no tiene teléfono registrado.');
      return;
    }

    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se pudo abrir el marcador.');
    }
  };

  const handleEmail = async () => {
    const email = professional.email;

    if (!email) {
      Alert.alert('Sin correo', 'Este profesional no tiene correo registrado.');
      return;
    }

    const url = `mailto:${email}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se pudo abrir la app de correo.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(professional.name || professional.fullName || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>
            {professional.name || professional.fullName || 'Profesional'}
          </Text>

          <Text style={styles.specialty}>
            {professional.specialty || 'Especialidad no disponible'}
          </Text>

          <View
            style={[
              styles.verificationBadge,
              professional.verified ? styles.verifiedBadge : styles.unverifiedBadge,
            ]}
          >
            <Text style={styles.verificationBadgeText}>
              {professional.verified ? 'Perfil verificado' : 'Perfil no verificado'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información profesional</Text>

          <Text style={styles.infoItem}>
            📍 {professional.address || 'Dirección no disponible'}
          </Text>

          <Text style={styles.infoItem}>
            ✉️ {professional.email || 'Correo no disponible'}
          </Text>

          <Text style={styles.infoItem}>
            📞 {professional.phone || professional.phoneNumber || 'Teléfono no disponible'}
          </Text>

          <Text style={styles.infoItem}>
            🩺 {professional.specialty || 'Especialidad no disponible'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {professional.description || 'Este profesional aún no ha agregado una descripción.'}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
            <Text style={styles.secondaryButtonText}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleEmail}>
            <Text style={styles.secondaryButtonText}>Correo</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate('Booking', {
              professional,
            })
          }
        >
          <Text style={styles.primaryButtonText}>Agendar cita</Text>
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
  backButtonText: {
    color: '#344054',
    fontWeight: '800',
    fontSize: 14,
  },
  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 28,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  specialty: {
    marginTop: 6,
    color: '#E0EAFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  verificationBadge: {
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verifiedBadge: {
    backgroundColor: '#D1FADF',
  },
  unverifiedBadge: {
    backgroundColor: '#EFF4FF',
  },
  verificationBadgeText: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
  },
  infoCard: {
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
  infoItem: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 21,
  },
  description: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  secondaryButtonText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101828',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
});