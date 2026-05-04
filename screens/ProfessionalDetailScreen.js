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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
    professional?.description ||
    'Este profesional aún no ha agregado una descripción.';
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
      Alert.alert(
        'Ubicación no disponible',
        'Este profesional no tiene coordenadas registradas.'
      );
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
      Alert.alert(
        'Correo no disponible',
        'Este profesional no tiene correo registrado.'
      );
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Detalle profesional</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroBackgroundAccent} />

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

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.badge,
                  verified ? styles.badgeVerified : styles.badgePending,
                ]}
              >
                <Ionicons
                  name={verified ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={verified ? '#15803D' : '#92400E'}
                  style={styles.badgeIcon}
                />
                <Text
                  style={[
                    styles.badgeText,
                    verified ? styles.badgeTextVerified : styles.badgeTextPending,
                  ]}
                >
                  {verified ? 'Verificado' : 'No verificado'}
                </Text>
              </View>

              <View style={styles.softPill}>
                <Ionicons name="medkit-outline" size={14} color="#2563EB" />
                <Text style={styles.softPillText}>Atención médica</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleOpenMap}
              activeOpacity={0.88}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="location-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.quickActionTitle}>Ubicación</Text>
              <Text style={styles.quickActionSubtitle}>Ver en mapa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleEmail}
              activeOpacity={0.88}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="mail-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.quickActionTitle}>Correo</Text>
              <Text style={styles.quickActionSubtitle}>Contactar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Sobre el profesional</Text>
            </View>

            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Información de contacto</Text>
            </View>

            <View style={styles.infoRowPremium}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="location-outline" size={18} color="#475569" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{address}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRowPremium}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="mail-outline" size={18} color="#475569" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo</Text>
                <Text style={styles.infoValue}>{email || 'No disponible'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookingButton}
            onPress={handleBooking}
            activeOpacity={0.9}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bookingButtonText}>Agendar cita</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarSpacer: {
    width: 46,
    height: 46,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden',
  },
  heroBackgroundAccent: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DBEAFE',
    opacity: 0.55,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#EFF6FF',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2563EB',
  },
  name: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  specialty: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeVerified: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  badgeTextVerified: {
    color: '#166534',
  },
  badgeTextPending: {
    color: '#92400E',
  },
  softPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 8,
  },
  softPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
    marginLeft: 6,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  quickActionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#475569',
  },
  infoRowPremium: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bookingButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#2563EB',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bookingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 10,
  },
});