import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';

export default function ProfessionalDetailScreen({ route, navigation }) {
  const { professional } = route.params || {};

  const professionalName = useMemo(() => {
    return (
      professional?.name ||
      professional?.fullName ||
      professional?.displayName ||
      'Profesional de la salud'
    );
  }, [professional]);

  const specialty = professional?.specialty || 'Especialidad no especificada';
  const description =
    professional?.description || 'Este profesional aún no ha agregado una descripción.';
  const address = professional?.address || 'Dirección no disponible';
  const email = professional?.email || '';
  const photoURL = professional?.photoURL || '';
  const verified = professional?.verified || false;

  const latitude =
    professional?.location?.latitude ??
    professional?.latitude ??
    null;

  const longitude =
    professional?.location?.longitude ??
    professional?.longitude ??
    null;

  const handleBooking = () => {
    if (!professional?.id) {
      Alert.alert('Error', 'No se encontró la información del profesional.');
      return;
    }

    navigation.navigate('Booking', { professional });
  };

  const handleOpenMap = async () => {
    if (latitude == null || longitude == null) {
      Alert.alert('Ubicación no disponible', 'Este profesional no tiene coordenadas registradas.');
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No fue posible abrir el mapa.');
      }
    } catch (error) {
      console.log('Error abriendo mapa:', error);
      Alert.alert('Error', 'No pudimos abrir la ubicación.');
    }
  };

  const handleEmail = async () => {
    if (!email) {
      Alert.alert('Correo no disponible', 'Este profesional no tiene correo registrado.');
      return;
    }

    const mailUrl = `mailto:${email}`;

    try {
      const supported = await Linking.canOpenURL(mailUrl);
      if (supported) {
        await Linking.openURL(mailUrl);
      } else {
        Alert.alert('Error', 'No fue posible abrir el correo.');
      }
    } catch (error) {
      console.log('Error abriendo email:', error);
      Alert.alert('Error', 'No pudimos abrir el correo.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {professionalName?.charAt(0)?.toUpperCase() || 'P'}
            </Text>
          </View>
        )}

        <Text style={styles.name}>{professionalName}</Text>
        <Text style={styles.specialty}>{specialty}</Text>

        <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgePending]}>
          <Text style={styles.badgeText}>
            {verified ? 'Verificado' : 'No verificado'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Sobre el profesional</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Información de contacto</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección</Text>
          <Text style={styles.infoValue}>{address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Correo</Text>
          <Text style={styles.infoValue}>{email || 'No disponible'}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleBooking}>
          <Text style={styles.primaryButtonText}>Agendar cita</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenMap}>
          <Text style={styles.secondaryButtonText}>Ver ubicación</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleEmail}>
          <Text style={styles.secondaryButtonText}>Enviar correo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarPlaceholderText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2563EB',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  specialty: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 14,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  badgeVerified: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#334155',
  },
  actionsContainer: {
    marginTop: 6,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#2E86DE',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
});