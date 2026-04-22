import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function PatientNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'users', uid, 'notifications');

    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const data = snapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }))
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.log('Error cargando notificaciones:', error);
        Alert.alert('Error', 'No pudimos cargar tus notificaciones.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const markAsRead = async (notificationId, alreadyRead) => {
    try {
      if (alreadyRead || !uid) return;

      await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.log('Error marcando como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!uid) return;

      setMarkingAll(true);

      const snap = await getDocs(collection(db, 'users', uid, 'notifications'));
      const unreadDocs = snap.docs.filter((d) => d.data()?.read === false);

      await Promise.all(
        unreadDocs.map((d) =>
          updateDoc(doc(db, 'users', uid, 'notifications', d.id), {
            read: true,
            readAt: serverTimestamp(),
          })
        )
      );
    } catch (error) {
      console.log('Error marcando todas:', error);
      Alert.alert('Error', 'No pudimos marcar todas como leídas.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => n.read === false).length;

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'Fecha no disponible';

    const date = new Date(timestamp.seconds * 1000);

    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => markAsRead(item.id, item.read)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.title || 'Notificación'}
        </Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>

      <Text style={styles.cardMessage}>
        {item.message || 'Tienes una nueva notificación.'}
      </Text>

      <Text style={styles.cardDate}>
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Notificaciones</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Estás al día'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={markAllAsRead}
            disabled={unreadCount === 0 || markingAll}
          >
            {markingAll ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.markAll}>Leer todo</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {loading ? (
          <ActivityIndicator size="large" />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán tus alertas y novedades.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map(renderItem)}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, padding: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, color: '#6B7280' },

  markAll: { color: '#2563EB', fontWeight: '700' },

  list: { gap: 12 },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },

  cardUnread: {
    borderColor: '#2563EB',
    borderWidth: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitle: { fontWeight: '700' },
  cardMessage: { marginTop: 6 },
  cardDate: { marginTop: 6, fontSize: 12, color: '#9CA3AF' },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
  },

  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 5 },
});