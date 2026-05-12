// services/notifications.js

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ===============================
// CONFIGURACIÓN GENERAL
// ===============================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ===============================
// CANAL ANDROID
// ===============================
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2e86de',
    });
  }
}

// ===============================
// REGISTRO PUSH TOKEN
// ===============================
export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log('Las push notifications requieren dispositivo físico');
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permisos de notificaciones denegados');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();

    console.log('Push Token:', token.data);

    return token.data;

  } catch (error) {
    console.log('Error obteniendo push token:', error);
    return null;
  }
}

// ===============================
// NOTIFICACIÓN LOCAL
// ===============================
export async function scheduleLocalBookingNotification({
  title,
  body,
  data = {},
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });

  } catch (error) {
    console.log('Error enviando notificación local:', error);
  }
}

// ===============================
// NOTIFICAR PROFESIONAL
// ===============================
export async function notifyProfessionalByProfessionalDocId(
  professionalDocId,
  notification
) {
  try {
    console.log('Notificación profesional:', {
      professionalDocId,
      notification,
    });

    // 🔥 AQUÍ MÁS ADELANTE PUEDES:
    // - Guardar en Firestore
    // - Enviar push real
    // - Crear historial
    // - Integrar Expo Push API

    return true;

  } catch (error) {
    console.log('Error notificando profesional:', error);
    return false;
  }
}