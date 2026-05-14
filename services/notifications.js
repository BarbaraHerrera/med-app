// services/notifications.js

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }
}

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    Constants?.manifest2?.extra?.eas?.projectId
  );
}

export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log('Las push notifications reales requieren dispositivo físico.');
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
      console.log('Permiso de notificaciones denegado.');
      return null;
    }

    const projectId = getProjectId();

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return tokenResponse.data;
  } catch (error) {
    console.log('Error obteniendo Expo Push Token:', error);
    return null;
  }
}

export async function registerAndSavePushToken() {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    const token = await registerForPushNotificationsAsync();
    if (!token) return null;

    await setDoc(
      doc(db, 'users', uid),
      {
        expoPushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('Expo Push Token guardado:', token);
    return token;
  } catch (error) {
    console.log('Error guardando push token:', error);
    return null;
  }
}

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

async function sendExpoPushNotification(expoPushToken, notification) {
  try {
    if (!expoPushToken) return false;

    const message = {
      to: expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body || notification.message,
      data: notification.data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Resultado push Expo:', result);

    return true;
  } catch (error) {
    console.log('Error enviando push real:', error);
    return false;
  }
}

export async function notifyProfessionalByProfessionalDocId(
  professionalDocId,
  notification
) {
  try {
    if (!professionalDocId) return false;

    const professionalRef = doc(db, 'professionals', professionalDocId);
    const professionalSnap = await getDoc(professionalRef);

    if (!professionalSnap.exists()) {
      console.log('Profesional no existe:', professionalDocId);
      return false;
    }

    const professionalData = professionalSnap.data();
    const professionalUserId = professionalData?.userId;

    if (!professionalUserId) {
      console.log('El profesional no tiene userId.');
      return false;
    }

    const userSnap = await getDoc(doc(db, 'users', professionalUserId));
    const professionalUserData = userSnap.exists() ? userSnap.data() : {};

    const expoPushToken =
      professionalUserData?.expoPushToken ||
      professionalData?.expoPushToken ||
      null;

    await addDoc(collection(db, 'users', professionalUserId, 'notifications'), {
      title: notification.title || 'Nueva notificación',
      message: notification.body || notification.message || '',
      type: notification?.data?.type || 'booking',
      appointmentId: notification?.data?.appointmentId || '',
      read: false,
      senderId: auth.currentUser?.uid || '',
      createdAt: serverTimestamp(),
    });

    if (expoPushToken) {
      await sendExpoPushNotification(expoPushToken, notification);
    } else {
      console.log('El profesional no tiene Expo Push Token guardado.');
    }

    return true;
  } catch (error) {
    console.log('Error notificando profesional:', error);
    return false;
  }
}