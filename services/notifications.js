import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications requieren dispositivo real.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado.');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log('No se encontró projectId de EAS.');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch (error) {
    console.log('Error registrando push token:', error);
    return null;
  }
}

export async function savePushTokenToFirestore(pushToken) {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid || !pushToken) return;

    await setDoc(
      doc(db, 'users', uid),
      {
        expoPushToken: pushToken,
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const professionalQuery = query(
      collection(db, 'professionals'),
      where('userId', '==', uid)
    );

    const professionalSnap = await getDocs(professionalQuery);

    if (!professionalSnap.empty) {
      const professionalDoc = professionalSnap.docs[0];

      await updateDoc(doc(db, 'professionals', professionalDoc.id), {
        expoPushToken: pushToken,
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.log('Error guardando Expo push token:', error);
  }
}

export async function ensurePushTokenSaved() {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return null;

    await savePushTokenToFirestore(token);
    return token;
  } catch (error) {
    console.log('Error asegurando push token:', error);
    return null;
  }
}

export async function sendPushNotification(expoPushToken, { title, body, data = {} }) {
  try {
    if (!expoPushToken) return false;

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Resultado envío push:', result);
    return true;
  } catch (error) {
    console.log('Error enviando push notification:', error);
    return false;
  }
}

export async function notifyUserById(userId, { title, body, data = {} }) {
  try {
    if (!userId) return false;

    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    const expoPushToken = userData?.expoPushToken;

    if (!expoPushToken) {
      console.log('El usuario no tiene expoPushToken guardado.');
      return false;
    }

    return await sendPushNotification(expoPushToken, { title, body, data });
  } catch (error) {
    console.log('Error notificando usuario por ID:', error);
    return false;
  }
}

export async function notifyProfessionalByProfessionalDocId(
  professionalDocId,
  { title, body, data = {} }
) {
  try {
    if (!professionalDocId) return false;

    const professionalSnap = await getDoc(doc(db, 'professionals', professionalDocId));
    if (!professionalSnap.exists()) return false;

    const professionalData = professionalSnap.data();

    if (professionalData?.expoPushToken) {
      return await sendPushNotification(professionalData.expoPushToken, {
        title,
        body,
        data,
      });
    }

    if (professionalData?.userId) {
      return await notifyUserById(professionalData.userId, { title, body, data });
    }

    return false;
  } catch (error) {
    console.log('Error notificando profesional:', error);
    return false;
  }
}

export async function scheduleLocalBookingNotification({
  title,
  body,
  data = {},
}) {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data,
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Error programando notificación local:', error);
  }
}